import 'package:dartapp/screens/home.dart';
import 'package:dartapp/services/auth_service.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_signin_button/flutter_signin_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool isLoading = false;
  final AuthService _service = AuthService();
  final emailFieldController = TextEditingController();
  final passwordFieldController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    Size size = MediaQuery.of(context).size;
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text("Pijlen Gooien Applicatie"),
          bottom: const TabBar(
            tabs: [
              Tab(icon: Icon(Icons.login_rounded), text: "Sign In"),
              Tab(icon: Icon(Icons.assignment_rounded), text: "Sign Up"),
            ],
          ),
        ),
        body: Stack(
          children: [
            TabBarView(
              children: [
                _formWrapper(_getSignInForm(), size.width),
                _formWrapper(_getSignUpForm(), size.width)
              ],
            ),
            Positioned(
              left: 0,
              top: 0,
              child: isLoading
                  ? Container(
                      width: double.infinity,
                      height: double.infinity,
                      decoration: const BoxDecoration(color: Colors.black26),
                      child: const CircularProgressIndicator(),
                    )
                  : Container(),
            ),
          ],
        ),
      ),
    );
  }

  void _showMessage(String message) {
    showDialog(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            title: const Text("Error"),
            content: Text(message),
            actions: [
              TextButton(
                child: const Text("Ok"),
                onPressed: () {
                  Navigator.of(context).pop();
                },
              )
            ],
          );
        });
  }

  Widget _formWrapper(List<Widget> child, double width) {
    return Center(
      child: !isLoading
          ? SizedBox(
              width: width * 0.6,
              child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: child),
            )
          : const CircularProgressIndicator(),
    );
  }

  List<Widget> _getSignInForm() {
    return [
      const Padding(
        padding: EdgeInsets.only(bottom: 100),
        child: Text(
          "Sign In",
          style: TextStyle(fontWeight: FontWeight.w100, fontSize: 72),
        ),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: TextField(
          controller: emailFieldController,
          decoration: const InputDecoration(
              border: OutlineInputBorder(),
              hintText: 'john@doe.com',
              labelText: "Email"),
        ),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: TextField(
          controller: passwordFieldController,
          obscureText: true,
          decoration: const InputDecoration(
              border: OutlineInputBorder(),
              hintText: 'Password!123',
              labelText: "Password"),
        ),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: SignInButton(
          Buttons.Email,
          elevation: 5,
          padding: const EdgeInsets.symmetric(vertical: 10),
          onPressed: () async {
            setState(() {
              isLoading = true;
            });
            try {
              await _service.signInWithEmailAndPassword(
                email: emailFieldController.text,
                password: passwordFieldController.text,
              );
              Navigator.pushAndRemoveUntil(context,
                  MaterialPageRoute(builder: (context) {
                return const HomeScreen();
              }), (route) => false);
            } catch (e) {
              if (e is FirebaseAuthException) {
                _showMessage(e.message!);
              }
            }
            setState(() {
              isLoading = false;
            });
          },
          text: "Sign in",
        ),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: _getGoogleButton("Sign in with Google"),
      ),
    ];
  }

  List<Widget> _getSignUpForm() {
    return [
      const Padding(
        padding: EdgeInsets.only(bottom: 100),
        child: Text(
          "Sign Up",
          style: TextStyle(fontWeight: FontWeight.w100, fontSize: 72),
        ),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: TextField(
          controller: emailFieldController,
          decoration: const InputDecoration(
              border: OutlineInputBorder(),
              hintText: 'john@doe.com',
              labelText: "Email"),
        ),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: TextField(
          controller: passwordFieldController,
          obscureText: true,
          decoration: const InputDecoration(
              border: OutlineInputBorder(),
              hintText: 'Password!123',
              labelText: "Password"),
        ),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: SignInButton(
          Buttons.Email,
          elevation: 5,
          padding: const EdgeInsets.symmetric(vertical: 10),
          onPressed: () async {
            setState(() {
              isLoading = true;
            });
            try {
              await _service.signUp(
                email: emailFieldController.text,
                password: passwordFieldController.text,
              );
              Navigator.pushAndRemoveUntil(context,
                  MaterialPageRoute(builder: (context) {
                return const HomeScreen();
              }), (route) => false);
            } catch (e) {
              if (e is FirebaseAuthException) {
                _showMessage(e.message!);
              }
            }
            setState(() {
              isLoading = false;
            });
          },
          text: "Sign up",
        ),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: _getGoogleButton("Sign up with Google"),
      ),
    ];
  }

  Widget _getGoogleButton(String text) {
    return SignInButton(
      Buttons.Google,
      elevation: 5,
      padding: const EdgeInsets.symmetric(vertical: 2),
      text: text,
      onPressed: () async {
        setState(() {
          isLoading = true;
        });
        try {
          await _service.signInWithGoogle();
          Navigator.pushAndRemoveUntil(context,
              MaterialPageRoute(builder: (context) {
            return const HomeScreen();
          }), (route) => false);
        } catch (e) {
          if (e is FirebaseAuthException) {
            _showMessage(e.message!);
          }
        }
        setState(() {
          isLoading = false;
        });
      },
    );
  }
}
