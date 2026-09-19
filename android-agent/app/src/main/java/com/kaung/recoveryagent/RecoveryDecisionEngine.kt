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
        if (Regex("verification code|otp|one[- ]time code|backup code|passkey|security code|captcha|recaptcha|i'm not a robot", RegexOption.IGNORE_CASE).containsMatchIn(t)) {
            return RecoveryDecision("MANUAL_VERIFICATION", "An ownership or human-verification step is visible. Complete it directly on the official service.", requiresUser = true)
        }
        if (Regex("password.*forgot|forgot.*password|forgot your password|forgotten password", RegexOption.IGNORE_CASE).containsMatchIn(t)) {
            return RecoveryDecision("PASSWORD_FORGOTTEN", "The account password is unavailable; continue with the official account-recovery flow.")
        }
        if (Regex("lost.*phone|phone.*lost|lost.*device|device.*lost|can't access.*phone|cannot access.*phone|don't have.*phone|do not have.*phone", RegexOption.IGNORE_CASE).containsMatchIn(t)) {
            return RecoveryDecision("DEVICE_UNAVAILABLE", "The previous device appears unavailable; look for an official alternative recovery method.")
        }
        if (Regex("lost.*sim|sim.*lost|can't access.*number|cannot access.*number|don't have.*number|do not have.*number", RegexOption.IGNORE_CASE).containsMatchIn(t)) {
            return RecoveryDecision("PHONE_NUMBER_UNAVAILABLE", "The previous phone number appears unavailable; use another official recovery method if offered.")
        }
        if (Regex("code.*sent.*(email|gmail)|sent.*code.*(email|gmail)|verification.*email.*can't|verification.*email.*cannot|code.*inaccessible", RegexOption.IGNORE_CASE).containsMatchIn(t)) {
            return RecoveryDecision("VERIFICATION_LOOP", "The verification destination may be inaccessible. Check for another official recovery option rather than bypassing verification.")
        }
        if (Regex("old phone|previous phone|old device|previous device|same device|familiar device|use.*device.*used before|device.*used before", RegexOption.IGNORE_CASE).containsMatchIn(t)) {
            return RecoveryDecision("PREVIOUS_DEVICE_REQUIRED", "Google appears to be asking for a previously used device or familiar context. Do not spoof it; check the official alternatives.")
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
