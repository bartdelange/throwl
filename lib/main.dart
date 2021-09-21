import 'package:dartapp/screens/login.dart';
import 'package:dartapp/services/service_locator.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  setupLocator();

  runApp(const PijlgooiApp());
}

class PijlgooiApp extends StatelessWidget {
  const PijlgooiApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Pijlgooi App',
      theme: ThemeData(
        primarySwatch: const MaterialColor(0xFF02314d, {
          50: Color.fromRGBO(1, 49, 77, .1),
          100: Color.fromRGBO(1, 49, 77, .2),
          200: Color.fromRGBO(1, 49, 77, .3),
          300: Color.fromRGBO(1, 49, 77, .4),
          400: Color.fromRGBO(1, 49, 77, .5),
          500: Color.fromRGBO(1, 49, 77, .6),
          600: Color.fromRGBO(1, 49, 77, .7),
          700: Color.fromRGBO(1, 49, 77, .8),
          800: Color.fromRGBO(1, 49, 77, .9),
          900: Color.fromRGBO(1, 49, 77, 1),
        }),
      ),
      home: const LoginScreen(),
    );
  }
}
