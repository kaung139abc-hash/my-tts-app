package com.kaunggyi.hyperostaskbar;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.graphics.Color;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class MainActivity extends Activity {
    private void startTaskbar() {
        Intent intent = new Intent(this, TaskbarService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent);
        } else {
            startService(intent);
        }
    }

    @Override public void onCreate(Bundle b) {
        super.onCreate(b);

        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(48, 48, 48, 48);

        TextView title = new TextView(this);
        title.setText("HyperDock\n\nFloating taskbar for quick app launching");
        title.setTextSize(22);
        box.addView(title);

        Button permission = new Button(this);
        permission.setText("Allow Display over other apps");
        permission.setOnClickListener(v -> {
            Intent i = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName()));
            startActivity(i);
        });
        box.addView(permission);

        Button start = new Button(this);
        start.setText("Start HyperDock");
        start.setOnClickListener(v -> {
            if (Settings.canDrawOverlays(this)) {
                startTaskbar();
            } else {
                startActivity(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getPackageName())));
            }
        });
        box.addView(start);

        Button multi = new Button(this);
        multi.setText("4-App Mode");
        multi.setTextSize(16);
        multi.setOnClickListener(v -> {
            if (!Settings.canDrawOverlays(this)) {
                startActivity(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse("package:" + getPackageName())));
                return;
            }
            startTaskbar();
            android.widget.Toast.makeText(this,
                    "4-App Mode started. Use the side Taskbar to open apps.",
                    android.widget.Toast.LENGTH_LONG).show();
        });
        box.addView(multi);

        Button accessibility = new Button(this);
        accessibility.setText("Enable Floating Window Control");
        accessibility.setTextSize(16);
        accessibility.setOnClickListener(v ->
                startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)));
        box.addView(accessibility);

        Button stop = new Button(this);
        stop.setText("Stop HyperDock");
        stop.setOnClickListener(v -> stopService(new Intent(this, TaskbarService.class)));
        box.addView(stop);

        setContentView(box);
    }
}