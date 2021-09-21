import 'package:dartapp/screens/home/home.dart';
import 'package:dartapp/services/auth_service.dart';
import 'package:dartapp/services/service_locator.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_signin_button/flutter_signin_button.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool isLoading = false;
  final _authService = locator<AuthService>();
  final emailFieldController = TextEditingController();
  final passwordFieldController = TextEditingController();
  final fullNameFieldController = TextEditingController();

  @override
  void initState() {
    isLoading = true;
    try {
      _authService.setup().then((_) {
        isLoading = false;
        if (_authService.isLoggedIn()) {
          SchedulerBinding.instance!.addPostFrameCallback((_) {
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (context) {
                return const HomeScreen();
              }),
              (route) => false,
            );
          });
        }
      });
    } catch (e) {
      rethrow;
    }
    isLoading = false;

    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    Size size = MediaQuery
        .of(context)
        .size;
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        body: Stack(
          fit: StackFit.expand,
          children: [
            DefaultTextStyle(
              style: const TextStyle(color: Colors.white),
              child: Container(
                decoration:
                    BoxDecoration(color: Theme.of(context).primaryColor),
                child: Column(
                  children: [
                    const TabBar(
                      tabs: [
                        Tab(icon: Icon(Icons.login_rounded), text: "Sign In"),
                        Tab(
                            icon: Icon(Icons.assignment_rounded),
                            text: "Sign Up"),
                      ],
                    ),
                    Expanded(
                      child: TabBarView(
                        children: [
                          _formWrapper(_getSignInForm(), size.width),
                          _formWrapper(_getSignUpForm(), size.width)
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            isLoading
                ? Container(
                    decoration: const BoxDecoration(color: Colors.black26),
                    child: const Center(child: CircularProgressIndicator()),
                  )
                : Container(),
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
      child: SizedBox(
        width: width * 0.6,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: child,
        ),
      ),
    );
  }

  List<Widget> _getSignInForm() {
    return [
      const Padding(
        padding: EdgeInsets.only(bottom: 100),
        child: Text(
          "Sign In",
          style: TextStyle(
              fontWeight: FontWeight.w100, fontSize: 72),
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
              await _authService.signInWithEmailAndPassword(
                email: emailFieldController.text,
                password: passwordFieldController.text,
              );
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) {
                  return const HomeScreen();
                }),
                (route) => false,
              );
            } on FirebaseAuthException catch (e) {
              _showMessage(e.message!);
            } on Exception catch (_) {
              _showMessage("Something went wrong, please try again");
            } finally {
              setState(() {
                isLoading = false;
              });
            }
          },
          text: "Sign in",
        ),
      ),
      // Padding(
      //   padding: const EdgeInsets.symmetric(vertical: 5),
      //   child: _getGoogleButton("Sign in with Google"),
      // ),
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
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: TextField(
          controller: fullNameFieldController,
          decoration: const InputDecoration(
              border: OutlineInputBorder(),
              hintText: 'John Doe',
              labelText: "Full name"),
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
              await _authService.signUp(
                email: emailFieldController.text,
                password: passwordFieldController.text,
                fullName: fullNameFieldController.text,
              );
              Navigator.pushAndRemoveUntil(
                context,
                MaterialPageRoute(builder: (context) {
                  return const HomeScreen();
                }),
                (route) => false,
              );
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
      // Padding(
      //   padding: const EdgeInsets.symmetric(vertical: 5),
      //   child: _getGoogleButton("Sign up with Google"),
      // ),
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
          await _authService.signInWithGoogle();
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
