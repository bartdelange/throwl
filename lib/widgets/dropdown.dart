import 'package:dartapp/models/user.dart';
import 'package:flutter/material.dart';

class DropDown<T> extends StatefulWidget {
  const DropDown({Key? key,
    required this.options,
    required this.helperText, required this.onChange,
  }) : super(key: key);

  final List<DropdownMenuItem<T>> options;
  final String helperText;
  final Function(T? value) onChange;

  @override
  _DropDownState createState() => _DropDownState();
}

class _DropDownState<T> extends State<DropDown<T>> {
  T? _chosenValue;

  @override
  Widget build(BuildContext context) {
    return DropdownButtonHideUnderline(
      child: Container(
        padding: EdgeInsets.only(
            left: 10.0, right: 10.0),
        decoration: ShapeDecoration(
          shape: RoundedRectangleBorder(
            side: BorderSide(width: 1.0, style: BorderStyle.solid),
            borderRadius: BorderRadius.all(Radius.circular(5.0)),
          ),
        ),
        child: DropdownButton<T>(
          isExpanded: true,
          value: _chosenValue,
          //elevation: 5,
          style: TextStyle(
            color: Colors.black,
          ),

          items: widget.options,
          hint: Text(
            widget.helperText,
            style: TextStyle(
                color: Colors.black, fontSize: 16, fontWeight: FontWeight.w600),
          ),
          onChanged: (T? value) {
            setState(() {
              _chosenValue = value;
              widget.onChange(value);
            });
          },
        ),
      ),
    );
  }
}
