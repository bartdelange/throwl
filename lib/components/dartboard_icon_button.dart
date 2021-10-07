import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:flutter_svg/flutter_svg.dart';

class DartboardIconButton extends StatelessWidget {
  final String dartboardIcon = 'assets/dartboard_white.svg';

  final VoidCallback onPressed;

  final String label;

  const DartboardIconButton(
      {Key? key, required this.onPressed, required this.label})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    return TextButton.icon(
      icon: Padding(
        padding: EdgeInsets.only(right: 25.r),
        child: SizedBox(
          width: math.max(75.r, 25),
          height: math.max(75.r, 25),
          child: SvgPicture.asset(
            dartboardIcon,
          ),
        ),
      ),
      onPressed: onPressed,
      label: Padding(
        padding: EdgeInsets.only(top: 5.r),
        child: Text(
          label,
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w800,
            fontSize: 48.sp,
          ),
        ),
      ),
    );
  }
}
