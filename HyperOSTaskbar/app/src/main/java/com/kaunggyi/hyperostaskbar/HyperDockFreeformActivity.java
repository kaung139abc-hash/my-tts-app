package com.kaunggyi.hyperostaskbar;

import android.app.Activity;
import android.app.ActivityOptions;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;

import java.lang.reflect.Method;

public class HyperDockFreeformActivity extends Activity {
    private boolean started = false;

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) { finish(); return; }

        try {
            getWindow().setFlags(WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL);
            getWindow().setFlags(WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
                    WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH);

            setFreeformWindowingMode();
            started = true;

            if (getIntent().getBooleanExtra("check_multiwindow", false)
                    && !isInMultiWindowMode()) {
                finish();
            }
        } catch (Exception ignored) {
            finish();
        }
    }

    private void setFreeformWindowingMode() {
        try {
            ActivityOptions options = ActivityOptions.makeBasic();
            Method m = ActivityOptions.class.getMethod("setLaunchWindowingMode", int.class);
            m.setAccessible(true);
            m.invoke(options, 5);
        } catch (Exception ignored) {}
    }

    @Override protected void onResume() {
        super.onResume();
        if (getIntent().getBooleanExtra("check_multiwindow", false) && !isInMultiWindowMode()) {
            finish();
        }
    }

    @Override public void finish() {
        if (started) super.finish();
    }
}
