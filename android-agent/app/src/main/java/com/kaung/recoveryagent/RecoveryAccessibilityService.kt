package com.kaung.recoveryagent

import android.accessibilityservice.AccessibilityService
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.Toast

class RecoveryAccessibilityService : AccessibilityService() {
    private enum class State {
        IDLE, RECOVERY_PAGE, IDENTIFIER_READY, NEEDS_USER_VERIFICATION,
        TRY_ANOTHER_METHOD, PROCESSING, RECOVERED, ACCOUNT_NOT_FOUND, BLOCKED
    }

    private var state = State.IDLE
    private var lastFingerprint = ""
    private var lastActionAt = 0L
    private var recoveredToastShown = false
    private var lastCloudHintAt = 0L
    private var cloudSafeAction = ""
    private val mainHandler = Handler(Looper.getMainLooper())

    private val sensitive = Regex(
        "password|passcode|verification code|otp|one[- ]time code|backup code|passkey|security code",
        RegexOption.IGNORE_CASE
    )
    private val humanVerification = Regex(
        "captcha|recaptcha|i'm not a robot|robot check|security check|verification code|" +
            "enter the code|passkey|backup code|password",
        RegexOption.IGNORE_CASE
    )
    private val safeIdentifier = Regex(
        "email|e-mail|phone|mobile|username|user name|account|player id|playerid",
        RegexOption.IGNORE_CASE
    )
    private val safeNavigation = listOf(
        "try another way", "use another way", "choose another option",
        "continue", "next", "recover account", "get started"
    )
    private val blockedActions = Regex(
        "password|passcode|verification|verify|otp|one[- ]time|backup|passkey|" +
            "security code|send code|resend|change password|reset password|recover by|" +
            "phone number|email code|confirm identity|prove it|security question",
        RegexOption.IGNORE_CASE
    )
    private val success = Regex(
        "account recovered|recovery successful|you're signed in|you are signed in|" +
            "welcome back|account restored|signed in successfully",
        RegexOption.IGNORE_CASE
    )
    private val notFound = Regex(
        "couldn't find your account|account not found|no account found|user not found",
        RegexOption.IGNORE_CASE
    )

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val root = rootInActiveWindow ?: return
        if (!isSupportedBrowser(event?.packageName?.toString())) return
        val stateText = summarize(root)
        getSharedPreferences("recovery", MODE_PRIVATE).edit()
            .putString("last_screen_text", stateText.take(5000))
            .apply()
        val fingerprint = normalize(stateText).take(1800)

        if (fingerprint == lastFingerprint && event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) {
            return
        }
        lastFingerprint = fingerprint

        val decision = RecoveryDecisionEngine.analyze(stateText)
        persistDecision(decision)
        logDecision(decision)
        updateSecurityMonitor(stateText)
        maybeRequestCloudHint(stateText)
        val next = if (isHumanVerificationVisible(root)) State.NEEDS_USER_VERIFICATION else classify(stateText)
        if (next != state) {
            state = next
            announceState(next)
        }

        when (state) {
            State.NEEDS_USER_VERIFICATION, State.BLOCKED, State.ACCOUNT_NOT_FOUND -> return
            State.RECOVERED -> {
                if (!recoveredToastShown) {
                    recoveredToastShown = true
                    toast("Recovery AI: account recovery appears successful")
                }
                return
            }
            else -> {}
        }

        val filled = autoFillSafeIdentifier(root, stateText)
        if (filled) {
            mainHandler.postDelayed({ continueSafely() }, 500L)
        } else {
            continueSafely()
        }
    }

    override fun onInterrupt() {
        mainHandler.removeCallbacksAndMessages(null)
    }

    private fun persistDecision(decision: RecoveryDecision) {
        val prefs = getSharedPreferences("recovery", MODE_PRIVATE)
        prefs.edit()
            .putString("decision_state", decision.state)
            .putString("decision_explanation", decision.explanation)
            .putString("decision_safe_action", decision.safeAction.orEmpty())
            .putBoolean("decision_requires_user", decision.requiresUser)
            .apply()
    }

    private fun securityRisk(text: String): String {
        val t = normalize(text)
        val signals = mutableListOf<String>()
        if (Regex("suspicious|unrecognized|unknown device|new device|new sign-in|security alert|unusual activity|someone may have|hacked|compromised", RegexOption.IGNORE_CASE).containsMatchIn(t)) {
            signals.add("POSSIBLE_ACCOUNT_TAKEOVER")
        }
        if (Regex("signed in on|your devices|recent security activity|sessions|devices", RegexOption.IGNORE_CASE).containsMatchIn(t)) {
            signals.add("SECURITY_ACTIVITY_VISIBLE")
        }
        if (Regex("recovery email|recovery phone|2-step verification|two-step verification|2fa", RegexOption.IGNORE_CASE).containsMatchIn(t)) {
            signals.add("RECOVERY_SECURITY_SETTINGS")
        }
        return if (signals.isEmpty()) "NO_HIGH_RISK_SIGNAL" else signals.joinToString(",")
    }

    private fun updateSecurityMonitor(text: String) {
        val prefs = getSharedPreferences("recovery", MODE_PRIVATE)
        val risk = securityRisk(text)
        prefs.edit().putString("security_risk", risk).apply()
        if (risk != "NO_HIGH_RISK_SIGNAL") {
            val old = prefs.getString("agent_log", "").orEmpty()
            val line = "SECURITY → $risk"
            val lines = (old.split("\n").filter { it.isNotBlank() } + line).takeLast(40)
            prefs.edit().putString("agent_log", lines.joinToString("\n")).apply()
        }
    }

    private fun classify(text: String): State {
        if (success.containsMatchIn(text)) return State.RECOVERED
        if (notFound.containsMatchIn(text)) return State.ACCOUNT_NOT_FOUND
        if (text.contains("try another way", true) ||
            text.contains("use another way", true) ||
            text.contains("choose another option", true)
        ) return State.TRY_ANOTHER_METHOD
        if (text.contains("recovery", true) ||
            text.contains("recover", true) ||
            text.contains("sign in", true) ||
            text.contains("mobile legends", true)
        ) return State.RECOVERY_PAGE
        return State.IDLE
    }

    private fun announceState(next: State) {
        getSharedPreferences("recovery", MODE_PRIVATE).edit()
            .putString("agent_state", next.name).apply()
        val message = when (next) {
            State.RECOVERY_PAGE -> "Recovery AI: recovery page detected"
            State.IDENTIFIER_READY -> "Recovery AI: identifier ready"
            State.TRY_ANOTHER_METHOD -> "Recovery AI: another legitimate recovery method detected"
            State.NEEDS_USER_VERIFICATION -> "Recovery AI: manual verification required"
            State.RECOVERED -> "Recovery AI: recovery success detected"
            State.ACCOUNT_NOT_FOUND -> "Recovery AI: account not found"
            State.BLOCKED -> "Recovery AI: action blocked for safety"
            else -> return
        }
        toast(message)
    }

    private fun logDecision(decision: RecoveryDecision) {
        val prefs = getSharedPreferences("recovery", MODE_PRIVATE)
        val old = prefs.getString("agent_log", "") ?: ""
        val message = when (decision.state) {
            "MANUAL_VERIFICATION" -> "⚠ User verification required"
            "RECOVERED" -> "✓ Recovery success detected"
            "NOT_FOUND" -> "• Official page says account was not found"
            "ALTERNATIVE_METHOD" -> "→ Alternative recovery method detected"
            "NAVIGATION" -> "→ Safe navigation available"
            "RECOVERY_PAGE" -> "✓ Recovery screen analyzed"
            else -> "• No safe action recognized"
        }
        val lines = (old.split("\n").filter { it.isNotBlank() } + message).takeLast(40)
        prefs.edit().putString("agent_log", lines.joinToString("\n")).apply()
    }

    private fun maybeRequestCloudHint(screenText: String) {
        val now = System.currentTimeMillis()
        if (now - lastCloudHintAt < 5000L || !isTrustedRecoveryContext(screenText)) return
        val prefs = getSharedPreferences("recovery", MODE_PRIVATE)
        val key = prefs.getString("openai_api_key", "").orEmpty().trim()
        if (key.isBlank()) return
        lastCloudHintAt = now

        CloudAiClient.analyze(key, screenText) { result ->
            cloudSafeAction = parseCloudSafeAction(result)
            prefs.edit()
                .putString("cloud_ai_last_result", result)
                .putString("cloud_safe_action", cloudSafeAction)
                .apply()
            val old = prefs.getString("agent_log", "").orEmpty()
            val line = "AI → " + result.replace("\\s+".toRegex(), " ").trim().take(280)
            val lines = (old.split("\n").filter { it.isNotBlank() } + line).takeLast(40)
            prefs.edit().putString("agent_log", lines.joinToString("\n")).apply()
            mainHandler.post { continueSafely() }
        }
    }

    private fun continueSafely(preferredAction: String? = null) {
        val root = rootInActiveWindow ?: return
        if (!isSupportedBrowser(root.packageName?.toString())) return
        val text = summarize(root)
        if (!isTrustedRecoveryContext(text)) return

        val current = classify(text)
        if (current == State.NEEDS_USER_VERIFICATION ||
            current == State.RECOVERED ||
            current == State.ACCOUNT_NOT_FOUND
        ) return

        val cloudAction = preferredAction ?: cloudSafeAction
        if (cloudAction.isNotBlank() && cloudAction != "FILL_IDENTIFIER") {
            if (clickSafeNavigation(root, cloudAction)) return
        }
        clickSafeNavigation(root, null)
    }

    private fun isSensitiveField(label: String): Boolean {
        return Regex(
            "password|passcode|verification code|otp|one[- ]time code|backup code|passkey|security code",
            RegexOption.IGNORE_CASE
        ).containsMatchIn(label)
    }

    private fun isHumanVerificationVisible(root: AccessibilityNodeInfo): Boolean {
        val nodes = ArrayList<AccessibilityNodeInfo>()
        collectEditable(root, nodes, 0)
        for (node in nodes) {
            val label = normalize(
                listOf(
                    node.hintText?.toString(),
                    node.contentDescription?.toString(),
                    node.text?.toString()
                ).filterNotNull().joinToString(" ")
            )
            if (isSensitiveField(label)) return true
        }
        val visible = normalize(summarize(root))
        return Regex("captcha|recaptcha|i'm not a robot|robot check", RegexOption.IGNORE_CASE)
            .containsMatchIn(visible)
    }

    private fun clickSafeNavigation(
        root: AccessibilityNodeInfo,
        preferredAction: String?
    ): Boolean {
        val now = System.currentTimeMillis()
        if (now - lastActionAt < 1200L) return false
        if (isHumanVerificationVisible(root)) return false

        val candidates = ArrayList<AccessibilityNodeInfo>()
        collectClickable(root, candidates, 0)

        val ranked = candidates.mapNotNull { node ->
            val label = normalize(nodeText(node))
            if (label.isBlank()) return@mapNotNull null
            if (sensitive.containsMatchIn(label) || blockedActions.containsMatchIn(label)) {
                return@mapNotNull null
            }
            val action = classifyNavigation(label) ?: return@mapNotNull null
            val preferred = preferredAction == action
            val exact = safeNavigation.any { label == it }
            Triple(navigationScore(label, action, preferred, exact), node, action)
        }.sortedByDescending { it.first }

        for ((_, node, action) in ranked) {
            if (node.isClickable && node.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                lastActionAt = now
                state = State.PROCESSING
                toast("Recovery AI: auto-clicked \"$action\"")
                return true
            }

            var parent = node.parent
            var depth = 0
            while (parent != null && depth < 4) {
                val parentText = normalize(nodeText(parent))
                if (parent.isClickable &&
                    !sensitive.containsMatchIn(parentText) &&
                    !blockedActions.containsMatchIn(parentText) &&
                    parent.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                ) {
                    lastActionAt = now
                    state = State.PROCESSING
                    toast("Recovery AI: auto-clicked \"$action\"")
                    return true
                }
                parent = parent.parent
                depth++
            }
        }
        return false
    }

    private fun classifyNavigation(label: String): String? {
        val t = normalize(label)
        if (t.contains("try another way") ||
            t.contains("use another way") ||
            t.contains("choose another option")
        ) return "TRY_ANOTHER_WAY"

        if (t == "next" || t.contains("next")) return "NEXT"
        if (t == "continue" || t.contains("continue") ||
            t.contains("recover account") || t.contains("get started")
        ) return "CONTINUE"

        return null
    }

    private fun navigationScore(
        label: String,
        action: String,
        preferred: Boolean,
        exact: Boolean
    ): Int {
        var score = 0
        if (preferred) score += 100
        if (exact) score += 30
        score += when (action) {
            "TRY_ANOTHER_WAY" -> 20
            "CONTINUE" -> 10
            "NEXT" -> 8
            else -> 0
        }
        if (label.length > 80) score -= 30
        return score
    }

    private fun parseCloudSafeAction(result: String): String {
        val upper = result.uppercase()
        return when {
            upper.contains("CLICK_TRY_ANOTHER_WAY") -> "TRY_ANOTHER_WAY"
            upper.contains("CLICK_CONTINUE") -> "CONTINUE"
            upper.contains("CLICK_NEXT") -> "NEXT"
            upper.contains("FILL_IDENTIFIER") -> "FILL_IDENTIFIER"
            else -> ""
        }
    }

    private fun navigationPriority(label: String): Int {
        return when (normalize(label)) {
            "try another way", "use another way" -> 0
            "choose another option" -> 1
            "continue" -> 2
            "next" -> 3
            "recover account", "get started" -> 4
            else -> 99
        }
    }

    private fun isSupportedBrowser(packageName: String?): Boolean {
        return packageName in setOf(
            "com.android.chrome",
            "org.mozilla.firefox",
            "com.microsoft.emmx",
            "com.opera.browser",
            "com.sec.android.app.sbrowser"
        )
    }

    private fun isTrustedRecoveryContext(text: String): Boolean {
        val t = normalize(text)
        val google = t.contains("accounts.google.com") ||
            t.contains("google account") ||
            t.contains("recover your account") ||
            t.contains("find your email") ||
            (t.contains("sign in") && t.contains("google"))
        val mlbb = t.contains("mobile legends") ||
            t.contains("moonton") ||
            (t.contains("customer service") && (t.contains("mlbb") || t.contains("mobile")))
        return google || mlbb
    }

    private fun autoFillSafeIdentifier(
        root: AccessibilityNodeInfo,
        screenText: String
    ): Boolean {
        if (!isTrustedRecoveryContext(screenText) || isHumanVerificationVisible(root)) return false
        val value = getSharedPreferences("recovery", MODE_PRIVATE)
            .getString("identifier", "").orEmpty().trim()
        if (value.isBlank() || !safeIdentifier.containsMatchIn(screenText)) return false

        val nodes = ArrayList<AccessibilityNodeInfo>()
        collectEditable(root, nodes, 0)
        for (node in nodes) {
            if (!node.isEnabled || !node.isFocusable) continue
            val label = normalize(
                listOf(
                    node.hintText?.toString(),
                    node.contentDescription?.toString(),
                    node.text?.toString()
                ).filterNotNull().joinToString(" ")
            )
            if (label.isBlank() || isSensitiveField(label) || !safeIdentifier.containsMatchIn(label)) continue
            if (!node.text.isNullOrBlank()) continue

            val args = Bundle()
            args.putCharSequence(
                AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE,
                value
            )
            if (node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)) {
                lastActionAt = System.currentTimeMillis()
                state = State.IDENTIFIER_READY
                toast("Recovery AI: safe identifier filled")
                return true
            }
        }
        return false
    }

    private fun normalize(value: String): String =
        value.replace("\\s+".toRegex(), " ").trim().lowercase()

    private fun nodeText(node: AccessibilityNodeInfo?): String {
        if (node == null) return ""
        return listOf(
            node.text?.toString(),
            node.contentDescription?.toString(),
            node.hintText?.toString()
        ).filterNotNull().joinToString(" ").trim()
    }

    private fun summarize(root: AccessibilityNodeInfo): String {
        val out = StringBuilder()
        walk(root, out, 0)
        return out.toString().take(5000)
    }

    private fun walk(node: AccessibilityNodeInfo?, out: StringBuilder, depth: Int) {
        if (node == null || depth > 14 || out.length > 5000) return
        val text = nodeText(node)
        if (text.isNotBlank() && !sensitive.containsMatchIn(text)) {
            out.append(text).append('\n')
        }
        for (i in 0 until node.childCount) walk(node.getChild(i), out, depth + 1)
    }

    private fun collectEditable(
        node: AccessibilityNodeInfo?,
        out: ArrayList<AccessibilityNodeInfo>,
        depth: Int
    ) {
        if (node == null || depth > 14) return
        if (node.isEditable) out.add(node)
        for (i in 0 until node.childCount) collectEditable(node.getChild(i), out, depth + 1)
    }

    private fun collectClickable(
        node: AccessibilityNodeInfo?,
        out: ArrayList<AccessibilityNodeInfo>,
        depth: Int
    ) {
        if (node == null || depth > 14) return
        if (node.isClickable) out.add(node)
        for (i in 0 until node.childCount) collectClickable(node.getChild(i), out, depth + 1)
    }

    private fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
}
