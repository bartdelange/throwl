import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dartapp/models/user.dart' as models;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:google_sign_in/google_sign_in.dart';

class AuthService {
  final CollectionReference _users =
      FirebaseFirestore.instance.collection('users');
  final FirebaseAuth _auth = FirebaseAuth.instance;

  Stream<User?>get authStateChanges => _auth.authStateChanges();
  models.User? _currentUser;

  models.User? get currentUser => _currentUser;
  ValueNotifier<models.User?> currentUserNotifier = ValueNotifier(null);

  final GoogleSignIn _googleSignIn = GoogleSignIn();

  bool isLoggedIn() {
    return _auth.currentUser != null;
  }

  Future _updateUser(userDoc) async {
    Map<String, dynamic> data = userDoc.data()! as Map<String, dynamic>;
    if (data["friends"] != null) {
      List<models.Friend> friends = await Future.wait(
          data['friends'].map<Future<models.Friend>>((friend) async {
            var user = await friend['user'].get();
            return models.Friend(
                models.User(user.id, user['name'], user['email']),
                friend['confirmed'],
                friend['requester']);
          }).toList());
      _currentUser = models.User.withFriends(
          userDoc.id, data["name"], data["email"], friends);
    } else {
      _currentUser = models.User.withFriends(
          userDoc.id, data["name"], data["email"], []);
    }
  }

  Future setup() async {
    if (!isLoggedIn()) return;
    await _updateUser(await _users.doc(_auth.currentUser!.uid).get());
    _auth.authStateChanges().listen((user) async {
      if (user != null) {
        var userDoc = await _users.doc(user.uid).get();
        await _updateUser(userDoc);
        currentUserNotifier.value = _currentUser;
      }
    });
    _users.snapshots().listen((event) async {
      if (!isLoggedIn()) return;
      var userDocs = event.docs.where((doc) => doc.id == _currentUser!.userId);
      if(userDocs.isEmpty) return;
      var userDoc = userDocs.first;
      await _updateUser(userDoc);
      currentUserNotifier.value = _currentUser;
    });
  }

  Future signUp(
      {required String email,
      required String password,
      required String fullName}) async {
    try {
      var user = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      if (user.user != null) {
        await _users
            .doc(user.user!.uid)
            .set({"name": fullName, "email": email, "friends": []});
      }
      await signInWithEmailAndPassword(email: email, password: password);

      return null;
    } on FirebaseAuthException {
      rethrow;
    }
  }

  Future signInWithEmailAndPassword({required String email, required String password}) async {
    try {
      var userCredential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      if (userCredential.user != null) {
        await _updateUser(await _users.doc(userCredential.user!.uid).get());
      }
    } on FirebaseAuthException {
    rethrow;
    }
  }

  Future<String?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleSignInAccount =
          await _googleSignIn.signIn();
      final GoogleSignInAuthentication googleSignInAuthentication =
          await googleSignInAccount!.authentication;
      final AuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleSignInAuthentication.accessToken,
        idToken: googleSignInAuthentication.idToken,
      );
      var userCredential = await await _auth.signInWithCredential(credential);
      if (userCredential.user != null) {
        await _updateUser(await _users.doc(userCredential.user!.uid).get());
      }
    } on FirebaseAuthException {
      rethrow;
    }
  }

  Future<void> signOut() async {
    if (await _googleSignIn.isSignedIn()) {
      await _googleSignIn.signOut();
    }
    await _auth.signOut();
    _currentUser = null;
    currentUserNotifier.value = null;
  }
}
