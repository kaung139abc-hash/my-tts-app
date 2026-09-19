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

    // Navigation-only actions. Never click controls that request or change credentials.
    private val safeNavigation = listOf(
        "try again",
        "try another way",
        "use another way",
        "choose another option",
        "continue",
        "next"
    )

    private val blockedActions = Regex(
        "password|passcode|verification|verify|otp|one[- ]time|backup|passkey|security code|" +
            "send code|resend|change password|reset password|recover by|phone number|email code",
        RegexOption.IGNORE_CASE
    )

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        val root = rootInActiveWindow ?: return
        val state = summarize(root)

        if (state.isNotBlank() && state != lastState) {
            lastState = state
            if (isRecoveryPage(state)) {
                Toast.makeText(
                    this,
                    "Recovery AI: recovery page detected",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }

        val filled = autoFillSafeIdentifier(root, state)
        if (filled) {
            // Give the page a moment to update before looking for the next safe button.
            mainHandler.postDelayed({
                clickSafeNavigation(rootInActiveWindow)
            }, 350L)
        } else {
            clickSafeNavigation(root)
        }
    }

    override fun onInterrupt() {}

    private fun isRecoveryPage(state: String): Boolean {
        return state.contains("recovery", true) ||
            state.contains("account", true) ||
            state.contains("sign in", true) ||
            state.contains("couldn't sign you in", true) ||
            state.contains("try again", true)
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
                Toast.makeText(
                    this,
                    "Recovery AI: safe identifier filled",
                    Toast.LENGTH_SHORT
                ).show()
                return true
            }
        }
        return false
    }

    private fun clickSafeNavigation(root: AccessibilityNodeInfo?) {
        if (root == null) return

        // Prevent repeated clicks caused by rapid accessibility events.
        val now = System.currentTimeMillis()
        if (now - lastActionAt < 1200L) return

        val nodes = ArrayList<AccessibilityNodeInfo>()
        collectClickable(root, nodes, 0)

        // Prefer recovery-specific choices before generic Continue/Next.
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
                Toast.makeText(
                    this,
                    "Recovery AI: continuing with \"$match\"",
                    Toast.LENGTH_SHORT
                ).show()
                return
            }

            // Some web controls expose a clickable parent instead of the text node.
            var parent = node.parent
            var depth = 0
            while (parent != null && depth < 3) {
                if (parent.isClickable &&
                    !sensitive.containsMatchIn(nodeText(parent)) &&
                    parent.performAction(AccessibilityNodeInfo.ACTION_CLICK)
                ) {
                    lastActionAt = now
                    Toast.makeText(
                        this,
                        "Recovery AI: continuing with \"$match\"",
                        Toast.LENGTH_SHORT
                    ).show()
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
            s == "try again" -> 2
            s == "continue" -> 3
            s == "next" -> 4
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

    private fun walk(
        node: AccessibilityNodeInfo?,
        out: StringBuilder,
        depth: Int
    ) {
        if (node == null || depth > 12 || out.length > 4000) return

        val t = nodeText(node)
        if (t.isNotBlank() && !sensitive.containsMatchIn(t)) {
            out.append(t).append('\\n')
        }

        for (i in 0 until node.childCount) {
            walk(node.getChild(i), out, depth + 1)
        }
    }

    private fun collectEditable(
        node: AccessibilityNodeInfo?,
        out: ArrayList<AccessibilityNodeInfo>,
        depth: Int
    ) {
        if (node == null || depth > 12) return
        if (node.isEditable) out.add(node)
        for (i in 0 until node.childCount) {
            collectEditable(node.getChild(i), out, depth + 1)
        }
    }

    private fun collectClickable(
        node: AccessibilityNodeInfo?,
        out: ArrayList<AccessibilityNodeInfo>,
        depth: Int
    ) {
        if (node == null || depth > 12) return
        if (node.isClickable) out.add(node)
        for (i in 0 until node.childCount) {
            collectClickable(node.getChild(i), out, depth + 1)
        }
    }
}
