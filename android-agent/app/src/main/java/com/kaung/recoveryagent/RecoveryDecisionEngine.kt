package com.kaung.recoveryagent

data class RecoveryDecision(
    val state: String,
    val explanation: String,
    val safeAction: String? = null,
    val requiresUser: Boolean = false
)

object RecoveryDecisionEngine {
    private val secret = Regex(
        "password|passcode|otp|verification code|one[- ]time code|backup code|passkey|security code",
        RegexOption.IGNORE_CASE
    )

    fun analyze(text: String): RecoveryDecision {
        val t = text.replace("\\s+".toRegex(), " ").trim()
        if (secret.containsMatchIn(t)) {
            return RecoveryDecision("MANUAL_VERIFICATION", "A sensitive ownership check is visible. Complete it directly on the official service.", requiresUser = true)
        }
        if (Regex("couldn't find your account|account not found|no account found|user not found", RegexOption.IGNORE_CASE).containsMatchIn(t)) {
            return RecoveryDecision("NOT_FOUND", "The official page reports that the account could not be found.")
        }
        if (Regex("account recovered|recovery successful|you're signed in|you are signed in|welcome back|account restored|signed in successfully", RegexOption.IGNORE_CASE).containsMatchIn(t)) {
            return RecoveryDecision("RECOVERED", "The visible page appears to show a successful recovery or sign-in.")
        }
        if (Regex("try another way|use another way|choose another option", RegexOption.IGNORE_CASE).containsMatchIn(t)) {
            return RecoveryDecision("ALTERNATIVE_METHOD", "Another legitimate recovery method is available.", "TRY_ANOTHER_WAY")
        }
        if (Regex("continue|next|recover account|get started", RegexOption.IGNORE_CASE).containsMatchIn(t)) {
            return RecoveryDecision("NAVIGATION", "A low-risk recovery navigation action is available.", "CONTINUE")
        }
        if (Regex("recovery|recover|sign in|mobile legends", RegexOption.IGNORE_CASE).containsMatchIn(t)) {
            return RecoveryDecision("RECOVERY_PAGE", "A recovery-related page is visible; the agent will inspect it again after the page settles.")
        }
        return RecoveryDecision("UNKNOWN", "No trusted recovery state was recognized. No automatic action is taken.")
    }
}
