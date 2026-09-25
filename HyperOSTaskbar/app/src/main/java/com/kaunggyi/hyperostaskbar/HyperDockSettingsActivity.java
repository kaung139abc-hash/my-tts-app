package com.kaunggyi.hyperostaskbar;

import android.app.Activity;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.widget.CompoundButton;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Switch;
import android.widget.TextView;

public class HyperDockSettingsActivity extends Activity {
    private SharedPreferences prefs;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        prefs = getSharedPreferences("hyperdock", MODE_PRIVATE);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(28, 28, 28, 28);
        root.setBackgroundColor(0xFF121218);

        TextView title = text("HyperDock", 28, Color.WHITE);
        root.addView(title);

        TextView sub = text("Settings", 16, 0xFFBDBDC8);
        root.addView(sub);

        ScrollView scroll = new ScrollView(this);
        LinearLayout list = new LinearLayout(this);
        list.setOrientation(LinearLayout.VERTICAL);

        section(list, "FREEFORM MODE");
        addSwitch(list, "Freeform window support",
                "Request freeform bounds when the device supports them.",
                "freeform", true);
        addSwitch(list, "Always open apps in new windows",
                "Create a separate task when possible.",
                "new_windows", true);
        addSwitch(list, "Remember window positions",
                "Reuse the last requested position for each app.",
                "remember_bounds", true);

        section(list, "TASKBAR");
        addSwitch(list, "Keep taskbar visible",
                "Keep the left-side taskbar above other apps.",
                "keep_visible", true);
        addSwitch(list, "Collapse after launching an app",
                "Hide the taskbar after selecting an app.",
                "collapse_after_launch", false);

        section(list, "APPEARANCE");
        addSwitch(list, "Show app labels",
                "Display names below application icons.",
                "labels", true);
        addSwitch(list, "Dark appearance",
                "Use HyperDock's dark interface.",
                "dark", true);

        section(list, "ADVANCED");
        addSwitch(list, "Use 2×2 workspace",
                "Request four window slots when freeform is available.",
                "workspace_2x2", true);

        TextView note = text(
                "HyperDock requests freeform windows from Android/HyperOS. "
                + "The system may ignore that request on devices where freeform mode is unavailable.",
                13, 0xFF9999A5);
        note.setPadding(0, 24, 0, 20);
        list.addView(note);

        scroll.addView(list);
        root.addView(scroll, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT, 0, 1));

        TextView done = text("DONE", 15, Color.WHITE);
        done.setGravity(Gravity.CENTER);
        done.setPadding(16, 18, 16, 18);
        done.setOnClickListener(v -> finish());
        root.addView(done);

        setContentView(root);
    }

    private void section(LinearLayout parent, String title) {
        TextView v = text(title, 12, 0xFF8E8E9A);
        v.setPadding(0, 26, 0, 8);
        parent.addView(v);
    }

    private void addSwitch(LinearLayout parent, String title, String summary,
                           String key, boolean def) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.VERTICAL);
        row.setPadding(0, 12, 0, 12);

        Switch sw = new Switch(this);
        sw.setText(title);
        sw.setTextColor(Color.WHITE);
        sw.setTextSize(16);
        sw.setChecked(prefs.getBoolean(key, def));
        sw.setOnCheckedChangeListener((CompoundButton button, boolean checked) ->
                prefs.edit().putBoolean(key, checked).apply());

        TextView desc = text(summary, 13, 0xFFAAAAB5);
        desc.setPadding(0, 3, 0, 0);

        row.addView(sw);
        row.addView(desc);
        parent.addView(row);
    }

    private TextView text(String value, float size, int color) {
        TextView v = new TextView(this);
        v.setText(value);
        v.setTextSize(size);
        v.setTextColor(color);
        return v;
    }
}
