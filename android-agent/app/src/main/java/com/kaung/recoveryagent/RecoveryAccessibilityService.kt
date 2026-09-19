package com.kaung.recoveryagent

import android.accessibilityservice.AccessibilityService
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.Toast

class RecoveryAccessibilityService : AccessibilityService() {
    private var lastState = ""
    private var lastActionAt = 0L
    private val mainHandler = Handler(Looper.getMainLooper())

    private val sensitive = Regex(
        "password|passcode|verification code|otp|one[- ]time code|backup code|passkey|security code",
        RegexOption.IGNORE_CASE
    )

    private val safeIdentifier = Regex(
        "email|e-mail|phone|mobile|username|user name|account|player id|playerid",
        RegexOption.IGNORE_CASE
    )

    // Only low-risk navigation controls are automated.
    private val safeNavigation = listOf(
        "try another way",
        "use another way",
        "choose another option",
        "continue",
        "next"
    )

    private val blockedActions = Regex(
        "password|passcode|verification|verify|otp|one[- ]time|backup|passkey|security code|" +
            "send code|resend|change password|reset password|recover by|phone number|email code|" +
            "confirm identity|prove it|security question",
        RegexOption.IGNORE_CASE
    )

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val root = rootInActiveWindow ?: return
        val state = summarize(root)

        if (state.isNotBlank() && state != lastState) {
            lastState = state
            if (isRecoveryPage(state)) {
                toast("Recovery AI: recovery screen detected")
            }
            if (looksLikeHumanVerification(state)) {
                toast("Recovery AI: manual verification required")
                return
            }
        }

        if (looksLikeHumanVerification(state)) return

        val filled = autoFillSafeIdentifier(root, state)
        if (filled) {
            mainHandler.postDelayed({ actOnCurrentPage() }, 450L)
        } else {
            actOnCurrentPage()
        }
    }

    override fun onInterrupt() {}

    private fun actOnCurrentPage() {
        val root = rootInActiveWindow ?: return
        val state = summarize(root)
        if (looksLikeHumanVerification(state)) return

        // The agent can only perform safe navigation; ownership checks remain manual.
        clickSafeNavigation(root)
    }

    private fun isRecoveryPage(state: String): Boolean {
        return state.contains("recovery", true) ||
            state.contains("account", true) ||
            state.contains("sign in", true) ||
            state.contains("couldn't sign you in", true) ||
            state.contains("try again", true) ||
            state.contains("mobile legends", true)
    }

    private fun looksLikeHumanVerification(state: String): Boolean {
        return Regex(
            "captcha|recaptcha|i'm not a robot|robot check|security check|enter the code|verification code|" +
                "passkey|backup code|password",
            RegexOption.IGNORE_CASE
        ).containsMatchIn(state)
    }

    private fun autoFillSafeIdentifier(
        root: AccessibilityNodeInfo,
        state: String
    ): Boolean {
        if (sensitive.containsMatchIn(state)) return false

        val value = getSharedPreferences("recovery", MODE_PRIVATE)
            .getString("identifier", "")?.trim() ?: return false
        if (value.isBlank()) return false

        val nodes = ArrayList<AccessibilityNodeInfo>()
        collectEditable(root, nodes, 0)

        for (node in nodes) {
            val label = listOf(
                node.hintText?.toString(),
                node.contentDescription?.toString(),
                node.text?.toString()
            ).filterNotNull().joinToString(" ")

            if (!safeIdentifier.containsMatchIn(label)) continue
            if (!node.isEditable || !node.text.isNullOrBlank()) continue

            val args = Bundle().apply {
                putCharSequence(
                    AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE,
                    value
                )
            }

            if (node.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args)) {
                toast("Recovery AI: safe identifier filled")
                return true
            }
        }
        return false
    }

    private fun clickSafeNavigation(root: AccessibilityNodeInfo?) {
        if (root == null) return

        val now = System.currentTimeMillis()
        if (now - lastActionAt < 1500L) return

        val nodes = ArrayList<AccessibilityNodeInfo>()
        collectClickable(root, nodes, 0)
        val ordered = nodes.sortedBy { navigationPriority(nodeText(it)) }

        for (node in ordered) {
            val label = nodeText(node).trim()
            if (label.isBlank()) continue
            if (sensitive.containsMatchIn(label) || blockedActions.containsMatchIn(label)) continue

            val normalized = label.replace("\\s+".toRegex(), " ").trim()
            val match = safeNavigation.firstOrNull {
                normalized.equals(it, ignoreCase = true)
            } ?: continue

            if (node.isClickable && node.performAction(AccessibilityNodeInfo.ACTION_CLICK)) {
                lastActionAt = now
                toast("Recovery AI: continuing with \"$match\"")
                return
            }

            var parent = node.parent
            var depth = 0
            while (parent != null && depth < 3) {
                if (parent.isClickable &&
                    !sensitive.containsMatchIn(nodeText(parent)) &&
                    !blockedActions.containsMatchIn(nodeText(parent)) &&
                    parent.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                ) {
                    lastActionAt = now
                    toast("Recovery AI: continuing with \"$match\"")
                    return
                }
                parent = parent.parent
                depth++
            }
        }
    }

    private fun navigationPriority(label: String): Int {
        val s = label.trim().lowercase()
        return when {
            s == "try another way" || s == "use another way" -> 0
            s == "choose another option" -> 1
            s == "continue" -> 2
            s == "next" -> 3
            else -> 99
        }
    }

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
        return out.toString().take(4000)
    }

    private fun walk(node: AccessibilityNodeInfo?, out: StringBuilder, depth: Int) {
        if (node == null || depth > 12 || out.length > 4000) return
        val t = nodeText(node)
        if (t.isNotBlank() && !sensitive.containsMatchIn(t)) {
            out.append(t).append('\n')
        }
        for (i in 0 until node.childCount) walk(node.getChild(i), out, depth + 1)
    }

    private fun collectEditable(
        node: AccessibilityNodeInfo?,
        out: ArrayList<AccessibilityNodeInfo>,
        depth: Int
    ) {
        if (node == null || depth > 12) return
        if (node.isEditable) out.add(node)
        for (i in 0 until node.childCount) collectEditable(node.getChild(i), out, depth + 1)
    }

    private fun collectClickable(
        node: AccessibilityNodeInfo?,
        out: ArrayList<AccessibilityNodeInfo>,
        depth: Int
    ) {
        if (node == null || depth > 12) return
        if (node.isClickable) out.add(node)
        for (i in 0 until node.childCount) collectClickable(node.getChild(i), out, depth + 1)
    }

    private fun toast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
}
