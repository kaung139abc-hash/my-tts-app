package com.kaung.threedwallpaper

import android.app.Activity
import android.app.WallpaperManager
import android.content.ComponentName
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.widget.*

class MainActivity : Activity() {
    private val prefs by lazy { getSharedPreferences("wallpaper", MODE_PRIVATE) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        buildUi()
    }

    private fun buildUi() {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(28, 42, 28, 28)
            setBackgroundColor(Color.rgb(5, 7, 25))
        }
        root.addView(ImageView(this).apply {
            setImageResource(R.drawable.ic_wallpaper_logo)
            layoutParams = LinearLayout.LayoutParams(115,115).apply { bottomMargin=10 }
        })
        root.addView(TextView(this).apply {
            text="3D LIVE WALLPAPER"; textSize=27f; setTextColor(Color.WHITE); gravity=Gravity.CENTER
        })
        root.addView(TextView(this).apply {
            text="Choose a world"; textSize=15f; setTextColor(Color.rgb(145,225,255))
            gravity=Gravity.CENTER; setPadding(0,8,0,20)
        })

        val themes = listOf(
            "🌌  Neon Core" to 0,
            "🌊  Cyber Ocean" to 1,
            "🌸  Anime Pulse" to 2,
            "🌿  Aurora Forest" to 3
        )
        themes.forEach { (name,id) ->
            root.addView(Button(this).apply {
                text=name; textSize=16f
                setOnClickListener { prefs.edit().putInt("mode",id).apply(); Toast.makeText(this@MainActivity,"Selected: $name",Toast.LENGTH_SHORT).show() }
            }, LinearLayout.LayoutParams(-1,58).apply { bottomMargin=8 })
        }
        root.addView(Button(this).apply {
            text="🔥 SET LIVE WALLPAPER"
            setOnClickListener {
                val i=Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER)
                i.putExtra(WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT,
                    ComponentName(this@MainActivity,ParallaxWallpaperService::class.java))
                startActivity(i)
            }
        }, LinearLayout.LayoutParams(-1,60).apply { topMargin=8 })
        root.addView(Button(this).apply {
            text="👀 PREVIEW"
            setOnClickListener { startActivity(Intent(WallpaperManager.ACTION_LIVE_WALLPAPER_CHOOSER)) }
        }, LinearLayout.LayoutParams(-1,60).apply { topMargin=8 })
        setContentView(root)
    }
}
