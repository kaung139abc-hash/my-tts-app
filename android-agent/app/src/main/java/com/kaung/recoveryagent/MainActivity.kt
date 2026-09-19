package com.kaung.recoveryagent

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(32,40,32,32) }
        root.addView(TextView(this).apply { text="Recovery AI — Android Agent"; textSize=24f })
        root.addView(TextView(this).apply {
            text="Enable Accessibility Service so the agent can inspect visible recovery pages and perform safe navigation.\n\nPasswords, OTPs, passkeys and backup codes are never read or entered by the agent."
            textSize=15f; setPadding(0,20,0,20)
        })
        root.addView(Button(this).apply { text="Enable Accessibility Service"; setOnClickListener { startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) } })
        root.addView(Button(this).apply { text="Open official Google recovery"; setOnClickListener { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://accounts.google.com/signin/recovery"))) } })
        root.addView(Button(this).apply { text="Open official MLBB site"; setOnClickListener { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://www.mobilelegends.com/"))) } })
        setContentView(root)
    }
}
