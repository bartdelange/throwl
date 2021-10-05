import 'dart:math' as math;

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '/services/auth_service.dart';
import '/services/service_locator.dart';
import 'home/home.dart';

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
  final nameFieldController = TextEditingController();
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
    return Scaffold(
      body: SingleChildScrollView(
        physics:
            const ClampingScrollPhysics(parent: NeverScrollableScrollPhysics()),
        child: SizedBox(
          height: MediaQuery.of(context).size.height,
          child: Stack(
            children: [
              DefaultTextStyle(
                style: const TextStyle(color: Colors.white),
                child: Column(
                  children: [
                    Padding(
                      padding: EdgeInsets.only(top: 150.h),
                      child: IntrinsicHeight(
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Padding(
                              padding: EdgeInsets.only(right: 60.w),
                              child: IconButton(
                                iconSize: math.max(60.w, 45),
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
                            VerticalDivider(
                              color: Colors.white,
                              width: 25.h,
                              thickness: 2.w,
                            ),
                            Padding(
                              padding: EdgeInsets.only(left: 60.w),
                              child: IconButton(
                                iconSize: math.max(60.w, 45),
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
                          _formWrapper(
                            _getSignUpForm(),
                            math.max(
                                .5.sw,
                                math.min(MediaQuery.of(context).size.width - 60,
                                    500)),
                          ),
                          _formWrapper(
                            _getSignInForm(),
                            math.max(
                                .5.sw,
                                math.min(MediaQuery.of(context).size.width - 60,
                                    500)),
                          ),
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
        width: width,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: child,
        ),
      ),
    );
  }

  void _showPasswordResetModal() {
    // _authService.resetPassword(emailFieldController.text);
  }

  List<Widget> _getSignInForm() {
    return [
      Padding(
        padding: EdgeInsets.only(bottom: 50.h),
        child: Text(
          "SIGN IN",
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 72.sp,
          ),
        ),
      ),
      Padding(
        padding: EdgeInsets.symmetric(vertical: 10.h),
        child: _textField(emailFieldController, "EMAIL",
            textInputAction: TextInputAction.next),
      ),
      Padding(
        padding: EdgeInsets.symmetric(vertical: 10.h),
        child: Column(
          children: [
            _textField(passwordFieldController, "PASSWORD", hide: true, removeBottomPadding: true),
            // TextButton(
            //   onPressed: () {
            //     _showPasswordResetModal();
            //   },
            //   child: const Text(
            //     'FORGOT PASSWORD?',
            //     style: TextStyle(color: Colors.white),
            //   ),
            // ),
          ],
        ),
      ),
      Padding(
        padding: EdgeInsets.only(top: 30.h),
        child: _getButton(
          () async {
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
        ),
      ),
    ];
  }

  List<Widget> _getSignUpForm() {
    return [
      Padding(
        padding: EdgeInsets.only(bottom: 50.h),
        child: Text(
          "Sign Up",
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 72.sp,
          ),
        ),
      ),
      Padding(
        padding: EdgeInsets.symmetric(vertical: 10.h),
        child: _textField(emailFieldController, "EMAIL",
            textInputAction: TextInputAction.next),
      ),
      Padding(
        padding: EdgeInsets.symmetric(vertical: 10.h),
        child: _textField(passwordFieldController, "PASSWORD",
            textInputAction: TextInputAction.next, hide: true),
      ),
      Padding(
        padding: EdgeInsets.symmetric(vertical: 10.h),
        child: _textField(nameFieldController, "NAME"),
      ),
      Padding(
        padding: EdgeInsets.only(top: 30.h),
        child: _getButton(
          () async {
            setState(() {
              isLoading = true;
            });
            try {
              await _authService.signUp(
                email: emailFieldController.text,
                password: passwordFieldController.text,
                name: nameFieldController.text,
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
          width: math.max(150.w, 100),
          height: math.max(150.w, 100),
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

  _textField(
    TextEditingController controller,
    String label, {
    textInputAction = TextInputAction.done,
    bool hide = false,
    bool removeBottomPadding = false
  }) {
    return Column(
      children: [
        Padding(
          padding: removeBottomPadding ? EdgeInsets.only(top: 10.h, bottom: 0) : EdgeInsets.symmetric(vertical: 10.h),
          child: Text(
            label,
            style: TextStyle(
                fontSize: math.max(18.sp, 14), fontWeight: FontWeight.w700),
          ),
        ),
        TextField(
          textInputAction: textInputAction,
          controller: controller,
          obscureText: hide,
          decoration: InputDecoration(
            contentPadding: const EdgeInsets.symmetric(horizontal: 20),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.all(Radius.circular(100.w)),
            ),
            fillColor: Colors.white,
            filled: true,
          ),
        ),
      ],
    );
  }
}
