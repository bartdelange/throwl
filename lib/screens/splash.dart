import 'dart:async';
import 'dart:math' as math;

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '/services/auth_service.dart';
import '/services/service_locator.dart';

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
  final String dartboardIcon = 'assets/dartboard_white_loader.svg';

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
              const Padding(
                padding: EdgeInsets.all(12.5),
                child: SizedBox(
                  width: 225,
                  height: 225,
                  child: CircularProgressIndicator(
                    strokeWidth: 15,
                    color: Colors.white,
                  ),
                ),
              ),
              Hero(
                tag: 'logo',
                child: SvgPicture.asset(
                  dartboardIcon,
                  height: 250,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
