import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:dartapp/screens/home/home.dart';
import 'package:dartapp/screens/login.dart';
import 'package:dartapp/screens/splash.dart';
import 'package:dartapp/services/service_locator.dart';
import 'package:firebase_core/firebase_core.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  setupLocator();

  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp])
      .then((_) {
    runApp(const DartscounterApp());
  });

}

class DartscounterApp extends StatelessWidget {
  const DartscounterApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Darts Counter',
      theme: ThemeData(
        primarySwatch: const MaterialColor(0xFF02314e, {
          50: Color.fromRGBO(2, 49, 78, .1),
          100: Color.fromRGBO(2, 49, 78, .2),
          200: Color.fromRGBO(2, 49, 78, .3),
          300: Color.fromRGBO(2, 49, 78, .4),
          400: Color.fromRGBO(2, 49, 78, .5),
          500: Color.fromRGBO(2, 49, 78, .6),
          600: Color.fromRGBO(2, 49, 78, .7),
          700: Color.fromRGBO(2, 49, 78, .8),
          800: Color.fromRGBO(2, 49, 78, .9),
          900: Color.fromRGBO(2, 49, 78, 1),
        }),
        scaffoldBackgroundColor: const Color(0xFF02314d),
        fontFamily: 'Karbon',
      ),
      home: const SplashScreen(mainScreen: HomeScreen(), loginScreen: LoginScreen()),
    );
  }
}
