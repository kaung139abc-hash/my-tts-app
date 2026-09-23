package com.kaung.threedwallpaper

import android.app.Activity
import android.app.WallpaperManager
import android.content.ComponentName
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.*

class MainActivity : Activity() {
    private val prefs by lazy { getSharedPreferences("wallpaper", MODE_PRIVATE) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        buildUi()
    }

    private fun buildUi() {
        val scroll = ScrollView(this).apply {
            setBackgroundColor(Color.rgb(5, 7, 18))
            isFillViewport = true
        }

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(24, 28, 24, 32)
        }

        root.addView(ImageView(this).apply {
            setImageResource(R.drawable.ic_wallpaper_logo)
            scaleType = ImageView.ScaleType.CENTER_INSIDE
            layoutParams = LinearLayout.LayoutParams(92, 92).apply { bottomMargin = 8 }
        })

        root.addView(TextView(this).apply {
            text = "3D LIVE WALLPAPER"
            textSize = 25f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        }, LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = 4 })

        root.addView(TextView(this).apply {
            text = "100 animated worlds • choose a style"
            textSize = 15f
            setTextColor(Color.rgb(150, 220, 255))
            gravity = Gravity.CENTER
        }, LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = 18 })

        val section = TextView(this).apply {
            text = "100 LIVE WALLPAPER WORLDS"
            textSize = 13f
            setTextColor(Color.rgb(125, 180, 220))
            gravity = Gravity.START
        }
        root.addView(section, LinearLayout.LayoutParams(-1, -2).apply { bottomMargin = 8 })

        val bases = listOf(
            "🏴‍☠️ Anime Pirate", "⚔️ Anime Warrior", "🌴 Tropical Nature",
            "🌲 Mystic Forest", "🌅 Cinematic Sunset", "🌌 Cosmic Space"
        )
        val effects = listOf(
            "Original", "Storm", "Rain", "Moonlight", "Sunrise", "Golden Hour",
            "Snow", "Fireflies", "Cherry Petals", "Autumn Leaves", "Magic Sparks",
            "Ocean Mist", "Lightning", "Aurora", "Dream Glow", "Starfall", "Ember Night"
        )
        val themes = (0 until 100).map { id ->
            val base = bases[id % 6]
            val effect = effects[(id / 6) % effects.size]
            "LIVE %02d  •  %s — %s".format(id + 1, base, effect) to id
        }

        themes.forEach { (name, id) ->
            val button = Button(this).apply {
                text = name
                textSize = 16f
                setTextColor(Color.WHITE)
                isAllCaps = false
                gravity = Gravity.CENTER_VERTICAL or Gravity.START
                minHeight = 62
                minimumHeight = 62
                setPadding(20, 8, 20, 8)
                setOnClickListener {
                    prefs.edit().putInt("mode", id).apply()
                    Toast.makeText(this@MainActivity, "Selected: $name", Toast.LENGTH_SHORT).show()
                }
            }
            root.addView(button, LinearLayout.LayoutParams(-1, 62).apply { bottomMargin = 8 })
        }

        val setButton = Button(this).apply {
            text = "🔥  SET LIVE WALLPAPER"
            textSize = 16f
            isAllCaps = false
            minHeight = 62
            minimumHeight = 62
            setOnClickListener {
                val intent = Intent(WallpaperManager.ACTION_CHANGE_LIVE_WALLPAPER).apply {
                    putExtra(
                        WallpaperManager.EXTRA_LIVE_WALLPAPER_COMPONENT,
                        ComponentName(this@MainActivity, ParallaxWallpaperService::class.java)
                    )
                }
                startActivity(intent)
            }
        }
        root.addView(setButton, LinearLayout.LayoutParams(-1, 62).apply { topMargin = 8; bottomMargin = 8 })

        val previewButton = Button(this).apply {
            text = "👀  PREVIEW LIVE WALLPAPERS"
            textSize = 16f
            isAllCaps = false
            minHeight = 62
            minimumHeight = 62
            setOnClickListener {
                startActivity(Intent(WallpaperManager.ACTION_LIVE_WALLPAPER_CHOOSER))
            }
        }
        root.addView(previewButton, LinearLayout.LayoutParams(-1, 62))

        root.addView(TextView(this).apply {
            text = "100 live presets • parallax camera • weather • particles • no API required"
            textSize = 12f
            setTextColor(Color.rgb(125, 140, 165))
            gravity = Gravity.CENTER
            setPadding(0, 18, 0, 0)
        }, LinearLayout.LayoutParams(-1, -2))

        scroll.addView(root)
        setContentView(scroll)
    }
}
