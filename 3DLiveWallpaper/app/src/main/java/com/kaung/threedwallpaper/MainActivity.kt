package com.kaung.threedwallpaper

import android.app.Activity
import android.app.WallpaperManager
import android.content.ComponentName
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val layout=LinearLayout(this).apply {
            orientation=LinearLayout.VERTICAL; setPadding(48,80,48,48)
        }
        layout.addView(TextView(this).apply {
            text="3D Live Wallpaper"; textSize=30f
        })
        layout.addView(TextView(this).apply {
            text="Animated 3D / Parallax wallpaper • Offline • No API key"
            textSize=16f; setPadding(0,20,0,40)
        })
        layout.addView(Button(this).apply {
            text="Set 3D Live Wallpaper"
            setOnClickListener {
                val i=Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER)
                i.putExtra(WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT,
                    ComponentName(this@MainActivity, ParallaxWallpaperService::class.java))
                startActivity(i)
            }
        })
        layout.addView(Button(this).apply {
            text="Open Wallpaper Preview"
            setOnClickListener { startActivity(Intent(WallpaperManager.ACTION_LIVE_WALLPAPER_CHOOSER)) }
        })
        setContentView(layout)
    }
}
