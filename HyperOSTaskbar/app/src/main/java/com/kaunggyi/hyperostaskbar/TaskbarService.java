package com.kaunggyi.hyperostaskbar;

import android.app.ActivityOptions;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.List;

public class TaskbarService extends Service {
    private static final String CHANNEL = "hyperdock";
    private static final int NOTIFICATION_ID = 1001;
    private WindowManager wm;
    private View bar;
    private int nextWindowSlot = 0;

    private int dp(float value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }

    @Override public void onCreate() {
        super.onCreate();
        try {
            createChannel();
            Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    ? new Notification.Builder(this, CHANNEL) : new Notification.Builder(this);
            Notification notification = builder.setContentTitle("HyperDock")
                    .setContentText("Floating taskbar is running")
                    .setSmallIcon(android.R.drawable.ic_menu_view)
                    .setOngoing(true).setCategory(Notification.CATEGORY_SERVICE).build();
            startForeground(NOTIFICATION_ID, notification);
            if (!Settings.canDrawOverlays(this)) { stopSelf(); return; }
            wm = (WindowManager) getSystemService(WINDOW_SERVICE);
            buildBar();
        } catch (Exception e) { stopSelf(); }
    }

    private void buildBar() {
        if (wm == null || !Settings.canDrawOverlays(this)) { stopSelf(); return; }

        LinearLayout shell = new LinearLayout(this);
        shell.setOrientation(LinearLayout.VERTICAL);
        shell.setGravity(Gravity.CENTER_HORIZONTAL);
        shell.setPadding(dp(3), dp(6), dp(3), dp(6));

        GradientDrawable background = new GradientDrawable();
        background.setColor(0xF21A1A24);
        background.setCornerRadius(dp(18));
        background.setStroke(dp(1), 0xFF6C63FF);
        shell.setBackground(background);
        shell.setElevation(dp(10));

        ScrollView scroll = new ScrollView(this);
        scroll.setVerticalScrollBarEnabled(false);
        LinearLayout appsColumn = new LinearLayout(this);
        appsColumn.setOrientation(LinearLayout.VERTICAL);
        appsColumn.setGravity(Gravity.CENTER_HORIZONTAL);
        scroll.addView(appsColumn, new ScrollView.LayoutParams(dp(68), ScrollView.LayoutParams.WRAP_CONTENT));

        PackageManager pm = getPackageManager();
        List<ApplicationInfo> apps = new ArrayList<>();
        try {
            Intent launcher = new Intent(Intent.ACTION_MAIN);
            launcher.addCategory(Intent.CATEGORY_LAUNCHER);
            List<ResolveInfo> resolved = pm.queryIntentActivities(launcher, PackageManager.MATCH_ALL);
            for (ResolveInfo ri : resolved) {
                ApplicationInfo ai = ri.activityInfo != null ? ri.activityInfo.applicationInfo : null;
                if (ai == null || getPackageName().equals(ai.packageName)) continue;
                if (pm.getLaunchIntentForPackage(ai.packageName) == null) continue;
                boolean duplicate = false;
                for (ApplicationInfo old : apps)
                    if (old.packageName.equals(ai.packageName)) { duplicate = true; break; }
                if (!duplicate) apps.add(ai);
            }
        } catch (Exception ignored) {}

        apps.sort((a,b) -> {
            try { return String.valueOf(pm.getApplicationLabel(a)).compareToIgnoreCase(
                    String.valueOf(pm.getApplicationLabel(b))); } catch (Exception e) { return 0; }
        });
        for (ApplicationInfo app : apps) addAppCell(appsColumn, pm, app);

        shell.addView(scroll, new LinearLayout.LayoutParams(dp(72), dp(360)));
        if (apps.isEmpty()) {
            TextView empty = makeButton("Apps");
            shell.addView(empty, new LinearLayout.LayoutParams(dp(68), dp(44)));
        }

        addDivider(shell);

        TextView settings = makeButton("⚙");
        settings.setTextSize(20);
        settings.setContentDescription("HyperDock settings");
        settings.setOnClickListener(v -> {
            try {
                Intent i = new Intent(this, HyperDockSettingsActivity.class);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(i);
            } catch (Exception ignored) {}
        });
        shell.addView(settings, new LinearLayout.LayoutParams(dp(68), dp(44)));

        TextView home = makeButton("⌂");
        home.setTextSize(22);
        home.setOnClickListener(v -> goHome());
        shell.addView(home, new LinearLayout.LayoutParams(dp(68), dp(44)));

        TextView hide = makeButton("×");
        hide.setTextSize(20);
        hide.setOnClickListener(v -> removeBar());
        shell.addView(hide, new LinearLayout.LayoutParams(dp(68), dp(44)));

        bar = shell;

        int type = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY : WindowManager.LayoutParams.TYPE_PHONE;
        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                dp(78), WindowManager.LayoutParams.WRAP_CONTENT, type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
                PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.LEFT | Gravity.CENTER_VERTICAL;
        lp.x = dp(6);

        try { wm.addView(bar, lp); } catch (Exception e) { bar = null; stopSelf(); }
    }

    private void addAppCell(LinearLayout parent, PackageManager pm, ApplicationInfo ai) {
        try {
            LinearLayout cell = new LinearLayout(this);
            cell.setOrientation(LinearLayout.VERTICAL);
            cell.setGravity(Gravity.CENTER);
            cell.setPadding(dp(2), dp(2), dp(2), dp(2));
            cell.setContentDescription(pm.getApplicationLabel(ai));

            ImageView icon = new ImageView(this);
            icon.setImageDrawable(pm.getApplicationIcon(ai));
            icon.setScaleType(ImageView.ScaleType.FIT_CENTER);
            cell.addView(icon, new LinearLayout.LayoutParams(dp(36), dp(36)));

            TextView label = new TextView(this);
            label.setText(pm.getApplicationLabel(ai));
            label.setTextColor(Color.WHITE);
            label.setTextSize(8);
            label.setGravity(Gravity.CENTER);
            label.setMaxLines(1);
            label.setEllipsize(android.text.TextUtils.TruncateAt.END);
            cell.addView(label, new LinearLayout.LayoutParams(dp(62), dp(16)));

            cell.setOnClickListener(v -> launchApp(ai.packageName));
            parent.addView(cell, new LinearLayout.LayoutParams(dp(68), dp(56)));
        } catch (Exception ignored) {}
    }

    private void launchApp(String packageName) {
        try {
            PackageManager pm = getPackageManager();
            Intent intent = pm.getLaunchIntentForPackage(packageName);
            if (intent == null) return;

            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                    | Intent.FLAG_ACTIVITY_MULTIPLE_TASK
                    | Intent.FLAG_ACTIVITY_NEW_DOCUMENT
                    | Intent.FLAG_ACTIVITY_LAUNCH_ADJACENT);

            int w = getResources().getDisplayMetrics().widthPixels;
            int h = getResources().getDisplayMetrics().heightPixels;
            int margin = dp(6);
            int topBase = dp(8);
            int usableH = Math.max(dp(500), h - dp(16));
            int slot = nextWindowSlot++ % 4;
            int col = slot % 2, row = slot / 2;
            int halfW = Math.max(dp(240), w / 2);
            int halfH = Math.max(dp(300), usableH / 2);

            Rect bounds = new Rect(
                    col == 0 ? margin : halfW + margin,
                    topBase + row * halfH + margin,
                    col == 0 ? halfW - margin : w - margin,
                    Math.min(h - margin, topBase + (row + 1) * halfH - margin)
            );

            ActivityOptions options = ActivityOptions.makeBasic();
            if (getSharedPreferences("hyperdock", MODE_PRIVATE).getBoolean("freeform", true)) {
                options.setLaunchBounds(bounds);
            }

            android.os.Bundle opts = options.toBundle();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N
                    && getSharedPreferences("hyperdock", MODE_PRIVATE).getBoolean("freeform", true)) {
                opts.putInt("android.activity.launchWindowingMode", 5);
            }

            startActivity(intent, opts);
        } catch (Exception first) {
            try {
                Intent fallback = getPackageManager().getLaunchIntentForPackage(packageName);
                if (fallback != null) {
                    fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(fallback);
                }
            } catch (Exception ignored) {}
        }
    }

    private void addDivider(LinearLayout shell) {
        View divider = new View(this);
        divider.setBackgroundColor(0xFF555562);
        shell.addView(divider, new LinearLayout.LayoutParams(dp(48), dp(1)));
    }

    private TextView makeButton(String text) {
        TextView button = new TextView(this);
        button.setText(text); button.setTextColor(Color.WHITE);
        button.setGravity(Gravity.CENTER); button.setTextSize(17);
        button.setPadding(dp(4), dp(4), dp(4), dp(4));
        return button;
    }

    private void goHome() {
        try {
            Intent intent = new Intent(Intent.ACTION_MAIN);
            intent.addCategory(Intent.CATEGORY_HOME);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        } catch (Exception ignored) {}
    }

    private void removeBar() {
        try { if (bar != null && wm != null) wm.removeView(bar); } catch (Exception ignored) {}
        bar = null;
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL, "HyperDock", NotificationManager.IMPORTANCE_LOW);
            NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
            if (manager != null) manager.createNotificationChannel(channel);
        }
    }

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (bar == null && Settings.canDrawOverlays(this)) try { buildBar(); } catch (Exception ignored) {}
        return START_STICKY;
    }

    @Override public void onDestroy() { removeBar(); super.onDestroy(); }
    @Override public IBinder onBind(Intent intent) { return null; }
}
