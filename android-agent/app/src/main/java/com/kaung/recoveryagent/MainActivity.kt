package com.kaung.recoveryagent

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var status: TextView
    private lateinit var identifier: EditText

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        status = findViewById(R.id.status)
        identifier = findViewById(R.id.identifier)

        val prefs = getSharedPreferences("recovery", MODE_PRIVATE)
        identifier.setText(prefs.getString("identifier", ""))

        findViewById<Button>(R.id.save).setOnClickListener {
            prefs.edit().putString("identifier", identifier.text.toString().trim()).apply()
            status.text = "Agent status: identifier saved locally"
        }
        findViewById<Button>(R.id.accessibility).setOnClickListener {
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        }
        findViewById<Button>(R.id.google).setOnClickListener {
            prefs.edit().putString("identifier", identifier.text.toString().trim()).apply()
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://accounts.google.com/signin/recovery")))
        }
        findViewById<Button>(R.id.mlbb).setOnClickListener {
            prefs.edit().putString("identifier", identifier.text.toString().trim()).apply()
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://www.mobilelegends.com/")))
        }
    }

    override fun onResume() {
        super.onResume()
        status.text = if (isAccessibilityEnabled())
            "Agent status: Accessibility is enabled"
        else
            "Agent status: Accessibility is not enabled"
    }

    private fun isAccessibilityEnabled(): Boolean {
        val enabled = Settings.Secure.getString(
            contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: ""
        return enabled.contains(packageName)
    }
}