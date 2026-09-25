package com.kaunggyi.hyperostaskbar;

import android.app.*;
import android.content.*;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.*;
import android.provider.Settings;
import android.view.*;
import android.widget.*;
import java.util.*;

public class TaskbarService extends Service {
    private WindowManager wm;
    private View bar;
    private static final String CHANNEL = "taskbar";

    @Override public void onCreate() {
        super.onCreate();
        createChannel();
        Notification n = new Notification.Builder(this, CHANNEL)
                .setContentTitle("HyperOS Taskbar")
                .setContentText("Taskbar is running")
                .setSmallIcon(android.R.drawable.ic_menu_view)
                .setOngoing(true)
                .build();
        startForeground(1001, n);

        if (!Settings.canDrawOverlays(this)) { stopSelf(); return; }

        wm = (WindowManager)getSystemService(WINDOW_SERVICE);
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER);
        row.setPadding(10,8,10,8);

        GradientDrawable bg = new GradientDrawable();
        bg.setColor(0xEE202124);
        bg.setCornerRadius(28);
        row.setBackground(bg);

        List<ApplicationInfo> apps = new ArrayList<>();
        for (ApplicationInfo ai : getPackageManager().getInstalledApplications(PackageManager.GET_META_DATA)) {
            if (getPackageManager().getLaunchIntentForPackage(ai.packageName) != null
                    && !ai.packageName.equals(getPackageName())) apps.add(ai);
            if (apps.size() >= 4) break;
        }

        for (ApplicationInfo ai : apps) {
            TextView b = button(getPackageManager().getApplicationLabel(ai).toString());
            b.setOnClickListener(v -> {
                Intent launch = getPackageManager().getLaunchIntentForPackage(ai.packageName);
                if (launch != null) {
                    launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(launch);
                }
            });
            row.addView(b);
        }

        TextView hide = button("×");
        hide.setOnClickListener(v -> stopSelf());
        row.addView(hide);

        bar = row;
        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
        lp.y = 24;
        wm.addView(bar, lp);
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel c = new NotificationChannel(CHANNEL, "Taskbar", NotificationManager.IMPORTANCE_LOW);
            ((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(c);
        }
    }

    private TextView button(String s) {
        TextView v = new TextView(this);
        v.setText(s);
        v.setTextColor(Color.WHITE);
        v.setTextSize(15);
        v.setGravity(Gravity.CENTER);
        v.setPadding(22,14,22,14);
        return v;
    }

    @Override public void onDestroy() {
        if (wm != null && bar != null) wm.removeView(bar);
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent intent) { return null; }
}
