package com.kaung.recoveryagent

import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.text.Editable
import android.text.TextWatcher
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var status: TextView
    private lateinit var identifier: EditText
    private lateinit var liveLog: TextView
    private lateinit var apiKey: EditText
    private val autoStartHandler = Handler(Looper.getMainLooper())
    private var autoStarted = false

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
        apiKey = findViewById(R.id.apiKey)

        val prefs = getSharedPreferences("recovery", MODE_PRIVATE)
        apiKey.setText(prefs.getString("openai_api_key", "").orEmpty())
        identifier.setText(prefs.getString("identifier", "").orEmpty())
        renderLog(prefs.getString("agent_log", "").orEmpty())

        identifier.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) = Unit
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                autoStarted = false
                autoStartHandler.removeCallbacksAndMessages(null)
                val value = s?.toString()?.trim().orEmpty()
                if (value.length < 5 || !isAccessibilityEnabled()) return

                autoStartHandler.postDelayed({
                    if (autoStarted) return@postDelayed
                    val current = identifier.text.toString().trim()
                    if (!looksLikeEmail(current)) return@postDelayed
                    prefs.edit().putString("identifier", current)
                        .putString("agent_state", "STARTING")
                        .putString("auto_start", "GOOGLE")
                        .apply()
                    autoStarted = true
                    appendLog("→ Gmail detected — starting official recovery automatically")
                    openOfficialRecovery("GOOGLE")
                }, 900L)
            }
            override fun afterTextChanged(s: Editable?) = Unit
        })

        findViewById<Button>(R.id.cloudAi).setOnClickListener {
            val key = apiKey.text.toString().trim()
            if (key.isBlank()) {
                status.text = "Cloud AI: enter your OpenAI API key first"
                return@setOnClickListener
            }
            prefs.edit().putString("openai_api_key", key).apply()
            val screen = prefs.getString("last_screen_text", "").orEmpty()
            if (screen.isBlank()) {
                status.text = "Cloud AI: no recovery screen has been analyzed yet"
                return@setOnClickListener
            }
            status.text = "Cloud AI: analyzing current recovery screen…"
            appendLog("→ Cloud AI analysis started")
            CloudAiClient.analyze(screen, key) { result ->
                status.text = "Cloud AI: analysis complete"
                appendLog("✓ Cloud AI: $result")
            }
        }

        findViewById<Button>(R.id.save).setOnClickListener {
            val value = identifier.text.toString().trim()
            prefs.edit().putString("identifier", value).apply()
            status.text = "Agent status: identifier saved locally"
            appendLog("✓ Identifier saved locally")
            if (looksLikeEmail(value) && isAccessibilityEnabled()) {
                autoStarted = true
                prefs.edit().putString("agent_state", "STARTING")
                    .putString("auto_start", "GOOGLE").apply()
                appendLog("→ Gmail identifier saved — opening official recovery")
                openOfficialRecovery("GOOGLE")
            }
        }

        findViewById<Button>(R.id.accessibility).setOnClickListener {
            openAgentAccessibilitySettings()
        }

        findViewById<Button>(R.id.google).setOnClickListener {
            val value = identifier.text.toString().trim()
            prefs.edit().putString("identifier", value).putString("agent_state", "STARTING")
                .putString("auto_start", "GOOGLE").apply()
            appendLog("→ Starting official Google recovery")
            openOfficialRecovery("GOOGLE")
        }

        findViewById<Button>(R.id.mlbb).setOnClickListener {
            val value = identifier.text.toString().trim()
            prefs.edit().putString("identifier", value).putString("agent_state", "STARTING")
                .putString("auto_start", "MLBB").apply()
            appendLog("→ Starting official MLBB route")
            openOfficialRecovery("MLBB")
        }

        findViewById<Button>(R.id.screenshotAi).setOnClickListener {
            screenshotPicker.launch("image/*")
        }
    }

    private fun openAgentAccessibilitySettings() {
        appendLog("→ Opening Accessibility settings")
        status.text = "Opening Accessibility settings…"

        try {
            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
        } catch (_: Exception) {
            try {
                startActivity(
                    Intent(
                        Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                        Uri.parse("package:$packageName")
                    )
                )
            } catch (_: Exception) {
                status.text = "Please open Settings → Accessibility manually"
            }
        }
    }

    private fun openOfficialRecovery(route: String) {
        val url = if (route == "MLBB") "https://www.mobilelegends.com/"
        else "https://accounts.google.com/signin/recovery"
        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        appendLog("✓ Official page opened — live agent is watching the screen")
        status.text = "Agent status: live recovery mode"
    }

    private fun looksLikeEmail(value: String): Boolean =
        Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$").matches(value)

    private fun appendLog(message: String) {
        val prefs = getSharedPreferences("recovery", MODE_PRIVATE)
        val old = prefs.getString("agent_log", "") ?: ""
        val lines = (old.split("\n").filter { it.isNotBlank() } + message).takeLast(40)
        val joined = lines.joinToString("\n")
        prefs.edit().putString("agent_log", joined).apply()
        renderLog(joined)
    }

    private fun renderLog(value: String) {
        liveLog.text = if (value.isBlank()) "LIVE AGENT LOG\\nWaiting to start…" else "LIVE AGENT LOG\\n$value"
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
            "Agent status: ready — type a Gmail to auto-start"
        }
    }

    private fun isAccessibilityEnabled(): Boolean {
        val enabled = Settings.Secure.getString(
            contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: ""
        return enabled.split(':').any { component ->
            try {
                ComponentName.unflattenFromString(component)?.packageName == packageName
            } catch (_: Exception) {
                false
            }
        }
    }
}
