import 'package:dartapp/services/auth_service.dart';
import 'package:dartapp/services/user_service.dart';
import 'package:get_it/get_it.dart';

GetIt locator = GetIt.asNewInstance();

void setupLocator() {
  locator.registerSingleton<UserService>(UserService());
  locator.registerSingleton<AuthService>(AuthService());
}