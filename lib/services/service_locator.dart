import 'package:get_it/get_it.dart';

import 'auth_service.dart';
import 'game_service.dart';
import 'user_service.dart';

GetIt locator = GetIt.asNewInstance();

void setupLocator() {
  locator.registerSingleton<UserService>(UserService());
  locator.registerSingleton<AuthService>(AuthService());
  locator.registerSingleton<GameService>(GameService());
}
