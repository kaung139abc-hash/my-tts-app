package com.kaung.recoveryagent

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
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
    private val logHandler = Handler(Looper.getMainLooper())

    private val screenshotPicker =
        registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
            if (uri != null) {
                shareScreenshotToAi(uri)
            } else {
                status.text = "Screenshot AI: no image selected"
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        status = findViewById(R.id.status)
        identifier = findViewById(R.id.identifier)
        liveLog = findViewById(R.id.liveLog)

        val prefs = getSharedPreferences("recovery", MODE_PRIVATE)
        identifier.setText(prefs.getString("identifier", ""))

        findViewById<Button>(R.id.save).setOnClickListener {
            prefs.edit().putString("identifier", identifier.text.toString().trim()).apply()
            status.text = "Agent status: identifier saved locally"
            appendLog("✓ Identifier saved locally")
        }
        findViewById<Button>(R.id.accessibility).setOnClickListener {
            appendLog("→ Opening Accessibility settings")
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        }
        findViewById<Button>(R.id.google).setOnClickListener {
            prefs.edit().putString("identifier", identifier.text.toString().trim()).apply()
            startActivity(
                Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse("https://accounts.google.com/signin/recovery")
                )
            )
        }
        findViewById<Button>(R.id.mlbb).setOnClickListener {
            prefs.edit().putString("identifier", identifier.text.toString().trim()).apply()
            startActivity(
                Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse("https://www.mobilelegends.com/")
                )
            )
        }
        findViewById<Button>(R.id.screenshotAi).setOnClickListener {
            screenshotPicker.launch("image/*")
        }
    }

    private fun shareScreenshotToAi(uri: Uri) {
        val share = Intent(Intent.ACTION_SEND).apply {
            type = "image/*"
            putExtra(Intent.EXTRA_STREAM, uri)
            putExtra(
                Intent.EXTRA_TEXT,
                "Recovery AI: Please explain this account-recovery screen and tell me the next legitimate step. Do not request or expose passwords, OTPs, passkeys, or backup codes."
            )
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        startActivity(Intent.createChooser(share, "Send screenshot to AI"))
        status.text = "Screenshot AI: choose the AI app to receive this screenshot"
    }

    private fun appendLog(message: String) {\n        liveLog.append("\\n" + message)\n    }\n\n    override fun onResume() {
        super.onResume()
        val prefs = getSharedPreferences("recovery", MODE_PRIVATE)
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
