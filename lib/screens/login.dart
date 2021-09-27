import 'package:dartapp/screens/home/home.dart';
import 'package:dartapp/services/auth_service.dart';
import 'package:dartapp/services/service_locator.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({Key? key}) : super(key: key);

  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  bool isLoading = false;
  final _authService = locator<AuthService>();
  final emailFieldController = TextEditingController();
  final passwordFieldController = TextEditingController();
  final fullNameFieldController = TextEditingController();
  late TabController? _tabController;

  @override
  void initState() {
    _tabController = TabController(length: 2, vsync: this);

    super.initState();
  }

  final String dartboardIcon = 'assets/dartboard_white.svg';

  @override
  Widget build(BuildContext context) {
    if (_tabController == null) return Container();
    Size size = MediaQuery.of(context).size;
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          DefaultTextStyle(
            style: const TextStyle(color: Colors.white),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 150),
                  child: IntrinsicHeight(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 50),
                          child: IconButton(
                            iconSize: 60,
                            icon: const Icon(Icons.login_rounded),
                            color: _tabController!.index == 0
                                ? Colors.white
                                : Colors.white38,
                            onPressed: () {
                              setState(() {
                                _tabController!.index = 0;
                              });
                            },
                          ),
                        ),
                        const VerticalDivider(
                          color: Colors.white,
                          width: 25,
                          thickness: 2,
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 50),
                          child: IconButton(
                            iconSize: 60,
                            icon: const Icon(Icons.add_reaction_outlined),
                            color: _tabController!.index == 1
                                ? Colors.white
                                : Colors.white38,
                            onPressed: () {
                              setState(() {
                                _tabController!.index = 1;
                              });
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _formWrapper(_getSignInForm(), size.width),
                      _formWrapper(_getSignUpForm(), size.width),
                    ],
                  ),
                ),
              ],
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
        width: width * 0.5,
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
        padding: EdgeInsets.only(bottom: 50),
        child: Text(
          "SIGN IN",
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 72),
        ),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: _textField(emailFieldController, "EMAIL"),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: _textField(passwordFieldController, "PASSWORD", hide: true),
      ),
      Padding(
        padding: const EdgeInsets.only(top: 30),
        child: _getButton(() async {
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
        })
      ),
    ];
  }

  List<Widget> _getSignUpForm() {
    return [
      const Padding(
        padding: EdgeInsets.only(bottom: 50),
        child: Text(
          "Sign Up",
          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 72),
        ),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: _textField(emailFieldController, "EMAIL"),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: _textField(passwordFieldController, "PASSWORD", hide: true),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: _textField(fullNameFieldController, "FULL NAME"),
      ),
      Padding(
        padding: const EdgeInsets.only(top: 30),
        child: _getButton(() async {
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
        ),
      ),
    ];
  }


  Widget _getButton(onPressed) {
    return GestureDetector(
      child: Hero(
        tag: 'logo',
        child: SizedBox(
          width: 150,
          height: 150,
          child: SvgPicture.asset(
            dartboardIcon,
          ),
        ),
      ),
      onTap: onPressed,
    );
  }
  // Widget _getGoogleButton(String text) {
  //   return SignInButton(
  //     Buttons.Google,
  //     elevation: 5,
  //     padding: const EdgeInsets.symmetric(vertical: 2),
  //     text: text,
  //     onPressed: () async {
  //       setState(() {
  //         isLoading = true;
  //       });
  //       try {
  //         await _authService.signInWithGoogle();
  //       } catch (e) {
  //         if (e is FirebaseAuthException) {
  //           _showMessage(e.message!);
  //         }
  //       }
  //       setState(() {
  //         isLoading = false;
  //       });
  //     },
  //   );
  // }

  _textField(TextEditingController controller, String label,
      {bool hide = false}) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Text(label,
              style:
                  const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        ),
        TextField(
          controller: controller,
          obscureText: hide,
          decoration: const InputDecoration(
            contentPadding: EdgeInsets.symmetric(horizontal: 20),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.all(Radius.circular(100))),
            fillColor: Colors.white,
            filled: true,
          ),
        ),
      ],
    );
  }
}
