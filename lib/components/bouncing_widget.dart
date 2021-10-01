import 'package:flutter/material.dart';

class BouncingWidget extends AnimatedWidget {
  const BouncingWidget({Key? key, required Animation<double> animation, required this.child})
      : super(key: key, listenable: animation);
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final animation = listenable as Animation<double>;
    return Center(
      child: Transform.translate(
        offset: Offset(0, animation.value),
        child: child,
      ),
    );
  }
}
