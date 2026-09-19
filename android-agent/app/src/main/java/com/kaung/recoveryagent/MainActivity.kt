package com.kaung.recoveryagent

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var status: TextView
    private lateinit var identifier: EditText
    private lateinit var liveLog: TextView

    private val screenshotPicker =
        registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
            if (uri != null) shareScreenshotToAi(uri)
            else status.text = "Screenshot AI: no image selected"
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        status = findViewById(R.id.status)
        identifier = findViewById(R.id.identifier)
        liveLog = findViewById(R.id.liveLog)

        val prefs = getSharedPreferences("recovery", MODE_PRIVATE)
        identifier.setText(prefs.getString("identifier", ""))
        renderLog(prefs.getString("agent_log", ""))

        findViewById<Button>(R.id.save).setOnClickListener {
            val value = identifier.text.toString().trim()
            prefs.edit().putString("identifier", value).apply()
            status.text = "Agent status: identifier saved locally"
            appendLog("✓ Identifier saved locally")
        }

        findViewById<Button>(R.id.accessibility).setOnClickListener {
            appendLog("→ Opening Accessibility settings")
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        }

        findViewById<Button>(R.id.google).setOnClickListener {
            val value = identifier.text.toString().trim()
            prefs.edit().putString("identifier", value).putString("agent_state", "STARTING").apply()
            appendLog("→ Starting official Google recovery")
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://accounts.google.com/signin/recovery")))
            appendLog("✓ Google recovery opened — live agent is watching the screen")
        }

        findViewById<Button>(R.id.mlbb).setOnClickListener {
            val value = identifier.text.toString().trim()
            prefs.edit().putString("identifier", value).putString("agent_state", "STARTING").apply()
            appendLog("→ Starting official MLBB route")
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://www.mobilelegends.com/")))
            appendLog("✓ MLBB page opened — live agent is watching the screen")
        }

        findViewById<Button>(R.id.screenshotAi).setOnClickListener {
            screenshotPicker.launch("image/*")
        }
    }

    private fun appendLog(message: String) {
        val prefs = getSharedPreferences("recovery", MODE_PRIVATE)
        val old = prefs.getString("agent_log", "") ?: ""
        val lines = (old.split("\n").filter { it.isNotBlank() } + message).takeLast(40)
        prefs.edit().putString("agent_log", lines.joinToString("\n")).apply()
        renderLog(lines.joinToString("\n"))
    }

    private fun renderLog(value: String) {
        liveLog.text = if (value.isBlank()) "LIVE AGENT LOG\nWaiting to start…" else "LIVE AGENT LOG\n$value"
    }

    private fun shareScreenshotToAi(uri: Uri) {
        val share = Intent(Intent.ACTION_SEND).apply {
            type = "image/*"
            putExtra(Intent.EXTRA_STREAM, uri)
            putExtra(
                Intent.EXTRA_TEXT,
                "Recovery AI: explain this account-recovery screen and identify the next legitimate step. Never request or expose passwords, OTPs, passkeys or backup codes."
            )
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        startActivity(Intent.createChooser(share, "Send screenshot to AI"))
        status.text = "Screenshot AI: choose an AI app"
    }

    override fun onResume() {
        super.onResume()
        val prefs = getSharedPreferences("recovery", MODE_PRIVATE)
        renderLog(prefs.getString("agent_log", "") ?: "")
        val agentState = prefs.getString("agent_state", "")
        status.text = if (!isAccessibilityEnabled()) {
            "Agent status: Accessibility is not enabled"
        } else if (!agentState.isNullOrBlank()) {
            "Agent status: $agentState"
        } else {
            "Agent status: ready — open an official recovery page"
        }
    }

    private fun isAccessibilityEnabled(): Boolean {
        val enabled = Settings.Secure.getString(
            contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: ""
        return enabled.contains(packageName)
    }
}
