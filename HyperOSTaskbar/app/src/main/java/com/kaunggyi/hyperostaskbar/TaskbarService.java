package com.kaunggyi.hyperostaskbar;

import android.app.*;
import android.content.*;
import android.content.pm.*;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.*;
import android.provider.Settings;
import android.view.*;
import android.widget.*;
import java.util.*;

public class TaskbarService extends Service {
    private static final String CHANNEL = "taskbar";
    private static final int NOTIFICATION_ID = 1001;
        private WindowManager wm;
    private View bar;

    private int dp(float v) {
        return (int) (v * getResources().getDisplayMetrics().density + 0.5f);
    }

    @Override public void onCreate() {
        super.onCreate();
        try {
            createChannel();

            Notification n = new Notification.Builder(this, CHANNEL)
                    .setContentTitle("HyperOS Taskbar")
                    .setContentText("Taskbar is running")
                    .setSmallIcon(android.R.drawable.ic_menu_view)
                    .setOngoing(true)
                    .setCategory(Notification.CATEGORY_SERVICE)
                    .build();

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                startForeground(NOTIFICATION_ID, n,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } else {
                startForeground(NOTIFICATION_ID, n);
            }

            if (!Settings.canDrawOverlays(this)) {
                stopSelf();
                return;
            }

            wm = (WindowManager) getSystemService(WINDOW_SERVICE);
            buildBar();
        } catch (RuntimeException e) {
            stopSelf();
        }
    }

    private void buildBar() {
        final LinearLayout shell = new LinearLayout(this);
        shell.setOrientation(LinearLayout.HORIZONTAL);
        shell.setGravity(Gravity.CENTER_VERTICAL);
        shell.setPadding(dp(8), dp(5), dp(8), dp(5));

        final HorizontalScrollView scroll = new HorizontalScrollView(this);
        scroll.setHorizontalScrollBarEnabled(false);
        scroll.setFillViewport(false);
        final LinearLayout appsRow = new LinearLayout(this);
        appsRow.setOrientation(LinearLayout.HORIZONTAL);
        appsRow.setGravity(Gravity.CENTER_VERTICAL);
        scroll.addView(appsRow, new HorizontalScrollView.LayoutParams(
                HorizontalScrollView.LayoutParams.WRAP_CONTENT,
                HorizontalScrollView.LayoutParams.WRAP_CONTENT));

        GradientDrawable bg = new GradientDrawable();
        bg.setColor(0xF21A1A24);
        bg.setCornerRadius(dp(28));
        bg.setStroke(dp(1), 0xFF6C63FF);
        shell.setBackground(bg);
        shell.setElevation(dp(12));

        PackageManager pm = getPackageManager();
        List<ApplicationInfo> apps = new ArrayList<>();

        try {
            Intent launcher = new Intent(Intent.ACTION_MAIN);
            launcher.addCategory(Intent.CATEGORY_LAUNCHER);
            List<ResolveInfo> resolved = pm.queryIntentActivities(launcher, PackageManager.MATCH_ALL);

            for (ResolveInfo ri : resolved) {
                ApplicationInfo ai = ri.activityInfo != null ? ri.activityInfo.applicationInfo : null;
                if (ai != null && !getPackageName().equals(ai.packageName)
                        && pm.getLaunchIntentForPackage(ai.packageName) != null) {
                    boolean duplicate = false;
                    for (ApplicationInfo old : apps) {
                        if (old.packageName.equals(ai.packageName)) {
                            duplicate = true;
                            break;
                        }
                    }
                    if (!duplicate) apps.add(ai);
                }
            }
        } catch (RuntimeException ignored) {}

        apps.sort((a, b) -> {
            try {
                String aa = String.valueOf(pm.getApplicationLabel(a));
                String bb = String.valueOf(pm.getApplicationLabel(b));
                return aa.compareToIgnoreCase(bb);
            } catch (RuntimeException e) {
                return 0;
            }
        });

        int count = apps.size();
        for (int i = 0; i < count; i++) {
            addAppCell(appsRow, pm, apps.get(i));
        }

        shell.addView(scroll, new LinearLayout.LayoutParams(
                0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        if (count == 0) {
            TextView empty = makeButton("Apps");
            empty.setTextSize(12);
            shell.addView(empty);
        }

        View sep = new View(this);
        sep.setBackgroundColor(0xFF555562);
        shell.addView(sep, new LinearLayout.LayoutParams(dp(1), dp(34)));

        TextView home = makeButton("⌂");
        home.setTextSize(23);
        home.setOnClickListener(v -> {
            try {
                Intent in = new Intent(Intent.ACTION_MAIN);
                in.addCategory(Intent.CATEGORY_HOME);
                in.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(in);
            } catch (RuntimeException ignored) {}
        });
        shell.addView(home);

        TextView hide = makeButton("⌄");
        hide.setTextSize(22);
        hide.setOnClickListener(v -> {
            try {
                if (bar != null && wm != null) wm.removeView(bar);
            } catch (RuntimeException ignored) {}
            bar = null;
        });
        shell.addView(hide);

        bar = shell;

        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;

        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT);

        lp.gravity = Gravity.BOTTOM;
        lp.y = dp(6);

        try {
            wm.addView(bar, lp);
        } catch (RuntimeException e) {
            bar = null;
            stopSelf();
        }
    }

    private void addAppCell(LinearLayout shell, PackageManager pm, ApplicationInfo ai) {
        try {
            LinearLayout cell = new LinearLayout(this);
            cell.setGravity(Gravity.CENTER);
            cell.setOrientation(LinearLayout.VERTICAL);
            cell.setPadding(dp(5), dp(2), dp(5), dp(2));

            ImageView icon = new ImageView(this);
            icon.setImageDrawable(pm.getApplicationIcon(ai));
            icon.setScaleType(ImageView.ScaleType.FIT_CENTER);
            cell.addView(icon, new LinearLayout.LayoutParams(dp(34), dp(34)));

            TextView label = new TextView(this);
            label.setText(pm.getApplicationLabel(ai));
            label.setTextColor(Color.WHITE);
            label.setTextSize(8);
            label.setMaxLines(1);
            label.setEllipsize(android.text.TextUtils.TruncateAt.END);
            cell.addView(label, new LinearLayout.LayoutParams(dp(54), dp(18)));

            cell.setContentDescription(pm.getApplicationLabel(ai));
            cell.setOnClickListener(v -> {
                try {
                    Intent in = pm.getLaunchIntentForPackage(ai.packageName);
                    if (in != null) {
                        in.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(in);
                    }
                } catch (RuntimeException ignored) {}
            });
            shell.addView(cell);
        } catch (RuntimeException ignored) {}
    }

    private TextView makeButton(String s) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextColor(Color.WHITE);
        t.setGravity(Gravity.CENTER);
        t.setTextSize(17);
        t.setPadding(dp(10), dp(4), dp(10), dp(4));
        return t;
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel c = new NotificationChannel(
                    CHANNEL, "Taskbar", NotificationManager.IMPORTANCE_LOW);
            NotificationManager nm =
                    (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (nm != null) nm.createNotificationChannel(c);
        }
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (bar == null && Settings.canDrawOverlays(this)) {
            try { buildBar(); } catch (RuntimeException ignored) {}
        }
        return START_STICKY;
    }

    @Override public void onTaskRemoved(Intent rootIntent) {
        // Keep the foreground service alive when the app's recent-task card is swiped away.
        super.onTaskRemoved(rootIntent);
    }

    @Override public void onDestroy() {
        if (wm != null && bar != null) {
            try { wm.removeView(bar); } catch (RuntimeException ignored) {}
        }
        bar = null;
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent intent) {
        return null;
    }
}