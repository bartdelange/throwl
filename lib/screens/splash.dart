import 'dart:async';
import 'dart:math' as math;

import 'package:dartapp/services/auth_service.dart';
import 'package:dartapp/services/service_locator.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';

class SplashScreen extends StatefulWidget {
  final Widget mainScreen;
  final Widget loginScreen;

  const SplashScreen(
      {Key? key, required this.mainScreen, required this.loginScreen})
      : super(key: key);

  @override
  _SplashScreenState createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  final _authService = locator<AuthService>();
  final String dartboardIcon = 'assets/dartboard_white.svg';

  StreamSubscription<User?>? _subscription;

  @override
  void initState() {
    _subscription = _authService.authStateChanges.listen((user) {
      if (user != null) {
        Future.wait([
          _authService.setup(),
          Future.delayed(const Duration(milliseconds: 2500))
        ]).then((_) {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (context) {
              return widget.mainScreen;
            }),
            (route) => false,
          );
        });
      } else {
        Future.wait([Future.delayed(const Duration(milliseconds: 2500))])
            .then((_) {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (context) {
              return widget.loginScreen;
            }),
            (route) => false,
          );
        });
      }
    });
    super.initState();
  }

  @override
  void dispose() {
    _subscription!.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Transform.scale(
          scale: math.max(1.r, .5),
          child: Stack(
            children: [
              Hero(
                tag: 'logo',
                child: SvgPicture.asset(
                  dartboardIcon,
                  height: 350,
                ),
              ),
              const Padding(
                padding: EdgeInsets.all(48),
                child: SizedBox(
                  width: 250,
                  height: 250,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
