import 'package:dartapp/components/bouncing_widget.dart';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

class ScrollableListView extends StatefulWidget {
  final List<Widget> children;

  const ScrollableListView({Key? key, required this.children})
      : super(key: key);

  @override
  State<ScrollableListView> createState() => ScrollableListViewState();
}

class ScrollableListViewState extends State<ScrollableListView>
    with SingleTickerProviderStateMixin {
  bool _scrollableIndicator = false;
  late Animation<double> _animationScrollIndicator;
  late AnimationController _animationControllerScrollIndicator;

  late ScrollController _scrollController;

  @override
  void initState() {
    super.initState();

    _scrollController = ScrollController();
    _scrollController.addListener(_scrollListener);
    WidgetsBinding.instance!.addPostFrameCallback((_) {
      if (_scrollController.position.maxScrollExtent > 0) {
        setState(() {
          _scrollableIndicator = true;
        });
      }
    });

    _animationControllerScrollIndicator = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    _animationControllerScrollIndicator.forward();
    _animationScrollIndicator = Tween<double>(begin: 0, end: 25).animate(
        CurvedAnimation(
            parent: _animationControllerScrollIndicator,
            curve: Curves.easeInCubic))
      ..addStatusListener((status) {
        if (status == AnimationStatus.completed) {
          _animationControllerScrollIndicator.reverse();
        } else if (status == AnimationStatus.dismissed) {
          _animationControllerScrollIndicator.forward();
        }
      });
    _animationControllerScrollIndicator.forward();
  }

  @override
  void dispose() {
    _animationControllerScrollIndicator.dispose();
    super.dispose();
  }

  void _scrollListener() {
    if (_scrollableIndicator) {
      setState(() {
        _scrollableIndicator = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // TODO: implement build
    return Stack(
      children: [
        ListView(
          controller: _scrollController,
          children: widget.children,
        ),
        _scrollableIndicator
            ? Positioned(
                bottom: 0,
                right: 0,
                left: 0,
                child: BouncingWidget(
                  animation: _animationScrollIndicator,
                  child: Icon(
                    Icons.keyboard_arrow_down_rounded,
                    color: Colors.white,
                    size: 50.r,
                  ),
                ),
              )
            : Container()
      ],
    );
  }
}
