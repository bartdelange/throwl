import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:dartapp/models/user.dart' as models;
import 'package:dartapp/services/service_locator.dart';
import 'package:dartapp/services/user_service.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:google_sign_in/google_sign_in.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final _userService = locator<UserService>();

  Stream<User?>get authStateChanges => _auth.authStateChanges();
  models.User? _currentUser;

  models.User? get currentUser => _currentUser;
  ValueNotifier<models.User?> currentUserNotifier = ValueNotifier(null);

  final GoogleSignIn _googleSignIn = GoogleSignIn();

  bool isLoggedIn() {
    return _auth.currentUser != null;
  }

  Future setup() async {
    if (!isLoggedIn()) return;
    _currentUser = await _userService.getById(_auth.currentUser!.uid);
    currentUserNotifier.value = _currentUser;
    _auth.authStateChanges().listen((user) async {
      if (user != null) {
        _currentUser = await _userService.getById(_auth.currentUser!.uid);
        currentUserNotifier.value = _currentUser;
      }
    });
    _userService.userChangeSubscription.onData((event) async {
      if (!isLoggedIn()) return;
      var userDocs = event.docs.where((doc) => doc.id == _currentUser!.userId);
      if(userDocs.isEmpty) return;
      var userDoc = userDocs.first;
      _currentUser = await _userService.getById(userDoc.id);
      currentUserNotifier.value = _currentUser;
    });
  }

  Future signUp(
      {required String email,
      required String password,
      required String name}) async {
    try {
      var user = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password.toLowerCase(),
      );
      if (user.user != null) {
        _currentUser = await _userService.createUser(user.user!.uid, email, name);
        currentUserNotifier.value = _currentUser;
      }
      await signInWithEmailAndPassword(email: email, password: password.toLowerCase());

      return null;
    } on FirebaseAuthException {
      rethrow;
    }
  }

  Future signInWithEmailAndPassword({required String email, required String password}) async {
    try {
      var userCredential = await _auth.signInWithEmailAndPassword(
        email: email.toLowerCase(),
        password: password,
      );
      if (userCredential.user != null) {
        _currentUser = await _userService.getById(userCredential.user!.uid);
        currentUserNotifier.value = _currentUser;
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
