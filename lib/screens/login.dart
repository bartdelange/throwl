import 'dart:math' as math;

import '/components/dartboard_icon_button.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

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
  final resetPasswordEmailFieldController = TextEditingController();
  late TabController? _tabController;

  @override
  void initState() {
    _tabController = TabController(length: 2, vsync: this);

    super.initState();
  }

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
                                icon: const Icon(Icons.person_add_alt_1_rounded),
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
                                icon: const Icon(Icons.login_rounded),
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
                          _renderForm(
                            _getSignUpFormItems(),
                            math.max(
                                .5.sw,
                                math.min(MediaQuery.of(context).size.width - 60,
                                    500)),
                          ),
                          _renderForm(
                            _getSignInFormItems(),
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

  Widget _renderForm(List<Widget> child, double width) {
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
    showDialog(
      context: context,
      builder: (BuildContext context) => AlertDialog(
        contentPadding: const EdgeInsets.only(top: 25),
        title: const Text('Reset your password'),
        content: ClipRect(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 25),
            child: SizedBox(
              width: 300,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    textInputAction: TextInputAction.send,
                    controller: resetPasswordEmailFieldController,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      hintText: 'john@doe.com',
                    ),
                  ),
                  Padding(
                    padding: EdgeInsets.only(top: 10.h),
                    child: ElevatedButton(
                      onPressed: () {
                        _authService.resetPassword(
                            resetPasswordEmailFieldController.text);
                        const snackBar =
                            SnackBar(content: Text('Reset mail send'));
                        ScaffoldMessenger.of(context).showSnackBar(snackBar);
                        Navigator.pop(context);
                        resetPasswordEmailFieldController.clear();
                      },
                      child: const Text(
                        'Send reset mail',
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  List<Widget> _getSignInFormItems() {
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
        child: _renderTextField(emailFieldController, "EMAIL",
            textInputAction: TextInputAction.next),
      ),
      Padding(
        padding: EdgeInsets.symmetric(vertical: 10.h),
        child: Column(
          children: [
            _renderTextField(passwordFieldController, "PASSWORD",
                hide: true, removeBottomPadding: true),
            TextButton(
              onPressed: () {
                _showPasswordResetModal();
              },
              child: const Text(
                'FORGOT PASSWORD?',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      ),
      Padding(
        padding: EdgeInsets.only(top: 30.h),
        child: DartboardIconButton(
          label: "GO",
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
        ),
      ),
    ];
  }

  List<Widget> _getSignUpFormItems() {
    return [
      Padding(
        padding: EdgeInsets.only(bottom: 75.h),
        child: Text(
          "SIGN UP",
          style: TextStyle(
            fontWeight: FontWeight.w800,
            fontSize: 72.sp,
          ),
        ),
      ),
      Padding(
        padding: EdgeInsets.symmetric(vertical: 10.h),
        child: _renderTextField(emailFieldController, "EMAIL",
            textInputAction: TextInputAction.next),
      ),
      Padding(
        padding: EdgeInsets.symmetric(vertical: 10.h),
        child: _renderTextField(passwordFieldController, "PASSWORD",
            textInputAction: TextInputAction.next, hide: true),
      ),
      Padding(
        padding: EdgeInsets.symmetric(vertical: 10.h),
        child: _renderTextField(nameFieldController, "NAME"),
      ),
      Padding(
        padding: EdgeInsets.only(top: 30.h),
        child: DartboardIconButton(
          label: "GO",
          onPressed: () async {
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



  Widget _renderTextField(
    TextEditingController controller,
    String label, {
    textInputAction = TextInputAction.done,
    bool hide = false,
    bool removeBottomPadding = false,
  }) {
    return Column(
      children: [
        Padding(
          padding: removeBottomPadding
              ? EdgeInsets.only(top: 10.h, bottom: 0)
              : EdgeInsets.symmetric(vertical: 10.h),
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
