package com.kaunggyi.hyperostaskbar;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class MainActivity extends Activity {
    @Override public void onCreate(Bundle b) {
        super.onCreate(b);
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(48,48,48,48);

        TextView title = new TextView(this);
        title.setText("HyperOS Taskbar\n\nFloating taskbar for quick app launching");
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
        start.setText("Start Taskbar");
        start.setOnClickListener(v -> {
            if (Settings.canDrawOverlays(this)) {
                startService(new Intent(this, TaskbarService.class));
            }
        });
        box.addView(start);

        Button stop = new Button(this);
        stop.setText("Stop Taskbar");
        stop.setOnClickListener(v -> stopService(new Intent(this, TaskbarService.class)));
        box.addView(stop);

        setContentView(box);
    }
}
