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
    private boolean launched = false;

    private void startTaskbar() {
        if (launched) return;
        launched = true;

        Intent intent = new Intent(this, TaskbarService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent);
        } else {
            startService(intent);
        }

        // HyperDock is a taskbar, not a full-screen launcher.
        // Close the Activity so the taskbar remains floating on the right edge.
        finishAndRemoveTask();
    }

    private void openOverlaySettings() {
        Intent i = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getPackageName())
        );
        startActivity(i);
    }

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);

        if (Settings.canDrawOverlays(this)) {
            startTaskbar();
            return;
        }

        showPermissionScreen();
    }

    @Override
    protected void onResume() {
        super.onResume();

        // After the user grants overlay permission, immediately turn
        // HyperDock into the floating right-side taskbar.
        if (!isFinishing() && Settings.canDrawOverlays(this)) {
            startTaskbar();
        }
    }

    private void showPermissionScreen() {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER);
        box.setPadding(48, 48, 48, 48);
        box.setBackgroundColor(0xFF15151B);

        TextView title = new TextView(this);
        title.setText("HyperDock");
        title.setTextColor(Color.WHITE);
        title.setTextSize(30);
        title.setGravity(Gravity.CENTER);
        box.addView(title, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
        ));

        TextView info = new TextView(this);
        info.setText("Right-side floating taskbar\n\nAllow "Display over other apps" once.\nAfter that, opening HyperDock will show only the taskbar.");
        info.setTextColor(0xFFD7D7E0);
        info.setTextSize(16);
        info.setGravity(Gravity.CENTER);
        info.setPadding(0, 24, 0, 24);
        box.addView(info);

        Button permission = new Button(this);
        permission.setText("Allow Display over other apps");
        permission.setOnClickListener(v -> openOverlaySettings());
        box.addView(permission);

        setContentView(box);
    }
}
