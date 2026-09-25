package com.kaunggyi.hyperostaskbar;

import android.app.ActivityOptions;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Rect;
import android.os.Build;
import android.provider.Settings;

import java.lang.reflect.Method;

public final class FreeformEngine {
    private FreeformEngine() {}

    public static boolean canUse(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return false;
        PackageManager pm = context.getPackageManager();
        if (pm.hasSystemFeature("android.software.freeform_window_management")) return true;
        try {
            return Settings.Global.getInt(context.getContentResolver(),
                    "enable_freeform_support", 0) != 0;
        } catch (Exception ignored) {
            return false;
        }
    }

    public static void prepare(Context context) {
        if (!canUse(context)) return;
        try {
            Intent i = new Intent(context, HyperDockFreeformActivity.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                    | Intent.FLAG_ACTIVITY_LAUNCH_ADJACENT
                    | Intent.FLAG_ACTIVITY_NO_ANIMATION);
            i.putExtra("check_multiwindow", true);
            ActivityOptions o = ActivityOptions.makeBasic();
            Method m = ActivityOptions.class.getMethod("setLaunchWindowingMode", int.class);
            m.setAccessible(true);
            m.invoke(o, 5);
            context.startActivity(i, o.toBundle());
        } catch (Exception ignored) {}
    }

    public static android.os.Bundle options(Context context, Rect bounds) {
        ActivityOptions o = ActivityOptions.makeBasic();
        try {
            Method m = ActivityOptions.class.getMethod("setLaunchWindowingMode", int.class);
            m.setAccessible(true);
            m.invoke(o, 5);
        } catch (Exception ignored) {}
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            o.setLaunchBounds(bounds);
        }
        return o.toBundle();
    }
}
