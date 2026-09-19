package com.kaung.recoveryagent

import android.accessibilityservice.AccessibilityService
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import android.widget.Toast

class RecoveryAccessibilityService : AccessibilityService() {
    private var lastState = ""
    private val sensitive = Regex(
        "password|passcode|verification code|otp|one[- ]time code|backup code|passkey|security code",
        RegexOption.IGNORE_CASE
    )
    private val safeIdentifier = Regex(
        "email|e-mail|phone|mobile|username|user name|account|player id|playerid",
        RegexOption.IGNORE_CASE
    )

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val root = rootInActiveWindow ?: return
        val state = summarize(root)
        if (state.isNotBlank() && state != lastState) {
            lastState = state
            if (state.contains("recovery", true) ||
                state.contains("verify", true) ||
                state.contains("account", true) ||
                state.contains("sign in", true)
            ) {
                Toast.makeText(this, "Recovery AI: recovery page detected", Toast.LENGTH_SHORT).show()
            }
        }
        autoFillSafeIdentifier(root, state)
    }

    override fun onInterrupt() {}

    private fun autoFillSafeIdentifier(root: AccessibilityNodeInfo, state: String) {
        if (sensitive.containsMatchIn(state)) return
        val value = getSharedPreferences("recovery", MODE_PRIVATE)
            .getString("identifier", "")?.trim() ?: return
        if (value.isBlank()) return

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

            node.performAction(
                AccessibilityNodeInfo.ACTION_SET_TEXT,
                android.os.Bundle().apply {
                    putCharSequence(
                        AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE,
                        value
                    )
                }
            )
            Toast.makeText(this, "Recovery AI: safe identifier filled", Toast.LENGTH_SHORT).show()
            break
        }
    }

    private fun summarize(root: AccessibilityNodeInfo): String {
        val out = StringBuilder()
        walk(root, out, 0)
        return out.toString().take(4000)
    }

    private fun walk(node: AccessibilityNodeInfo?, out: StringBuilder, depth: Int) {
        if (node == null || depth > 12 || out.length > 4000) return
        val t = listOf(
            node.text?.toString(),
            node.contentDescription?.toString(),
            node.hintText?.toString()
        ).filterNotNull().joinToString(" ").trim()
        if (t.isNotBlank() && !sensitive.containsMatchIn(t)) out.append(t).append('\n')
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
}