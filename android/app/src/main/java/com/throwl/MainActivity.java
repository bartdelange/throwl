package com.throwl;

import android.os.Bundle;
import com.facebook.react.ReactActivity;
import com.facebook.react.ReactActivityDelegate;
import com.zoontek.rnbootsplash.RNBootSplash;

public class MainActivity extends ReactActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    RNBootSplash.init(MainActivity.this);
    super.onCreate(null);
  }

  @Override
  protected String getMainComponentName() {
    return "throwl";
  }
}
