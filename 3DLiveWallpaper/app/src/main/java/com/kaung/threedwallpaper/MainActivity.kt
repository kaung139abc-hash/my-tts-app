package com.kaung.threedwallpaper

import android.app.Activity
import android.app.WallpaperManager
import android.content.ComponentName
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.widget.Button
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(40, 55, 40, 40)
            setBackgroundColor(Color.rgb(5, 7, 25))
        }
        root.addView(ImageView(this).apply {
            setImageResource(com.kaung.threedwallpaper.R.drawable.ic_wallpaper_logo)
            layoutParams = LinearLayout.LayoutParams(150, 150).apply { bottomMargin = 18 }
        })
        root.addView(TextView(this).apply {
            text = "3D LIVE WALLPAPER"
            textSize = 28f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
        })
        root.addView(TextView(this).apply {
            text = "Neon Space • Parallax • Animated Energy"
            textSize = 15f
            setTextColor(Color.rgb(145, 225, 255))
            gravity = Gravity.CENTER
            setPadding(0, 12, 0, 36)
        })
        root.addView(Button(this).apply {
            text = "SET LIVE WALLPAPER"
            setOnClickListener {
                val i = Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER)
                i.putExtra(WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT,
                    ComponentName(this@MainActivity, ParallaxWallpaperService::class.java))
                startActivity(i)
            }
        }, LinearLayout.LayoutParams(-1, 60).apply { bottomMargin = 16 })
        root.addView(Button(this).apply {
            text = "PREVIEW"
            setOnClickListener {
                startActivity(Intent(WallpaperManager.ACTION_LIVE_WALLPAPER_CHOOSER))
            }
        }, LinearLayout.LayoutParams(-1, 60))
        setContentView(root)
    }
}
