package com.kaung.recoveryagent

import android.os.Handler
import android.os.Looper
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

object CloudAiClient {
    private val client = OkHttpClient()
    private val jsonType = "application/json".toMediaType()

    fun analyze(screenText: String, apiKey: String, callback: (String) -> Unit) {
        Thread {
            val prompt = """
You are a cautious account-recovery assistant. Analyze the visible UI text below.
Identify the service/state, explain the next legitimate recovery step, and say whether
the user must perform ownership verification. Never ask for, reveal, store, or fill
passwords, OTPs, passkeys, backup codes, or CAPTCHA answers. Do not bypass security.
Return concise JSON only with these keys: STATE, NEXT_STEP, USER_ACTION, SAFE_AUTOMATION.\nSTATE must be one of RECOVERY_PAGE, IDENTIFIER, ALTERNATIVE_METHOD, MANUAL_VERIFICATION,\nRECOVERED, NOT_FOUND, UNKNOWN. SAFE_AUTOMATION must be one of NONE, FILL_IDENTIFIER,\nCLICK_TRY_ANOTHER_WAY, CLICK_CONTINUE, CLICK_NEXT, WAIT_USER. Never output credentials or secrets.
VISIBLE UI:
${screenText}
""".trimIndent()

            try {
                val body = JSONObject()
                    .put("model", "gpt-5-mini")
                    .put("input", prompt)
                    .put("max_output_tokens", 500)
                    .toString()

                val request = Request.Builder()
                    .url("https://api.openai.com/v1/responses")
                    .addHeader("Authorization", "Bearer $apiKey")
                    .addHeader("Content-Type", "application/json")
                    .post(body.toRequestBody(jsonType))
                    .build()

                client.newCall(request).execute().use { response ->
                    val raw = response.body?.string().orEmpty()
                    if (!response.isSuccessful) {
                        throw IllegalStateException("Cloud AI HTTP ${response.code}")
                    }
                    val text = extractText(JSONObject(raw))
                    Handler(Looper.getMainLooper()).post {
                        callback(if (text.isBlank()) "Cloud AI returned no analysis." else text)
                    }
                }
            } catch (e: Exception) {
                Handler(Looper.getMainLooper()).post {
                    callback("Cloud AI error: ${e.message ?: "request failed"}")
                }
            }
        }.start()
    }

    private fun extractText(root: JSONObject): String {
        root.optString("output_text").takeIf { it.isNotBlank() }?.let { return it }
        val output = root.optJSONArray("output") ?: return ""
        val result = StringBuilder()
        for (i in 0 until output.length()) {
            val item = output.optJSONObject(i) ?: continue
            val content = item.optJSONArray("content") ?: continue
            for (j in 0 until content.length()) {
                val part = content.optJSONObject(j) ?: continue
                val text = part.optString("text")
                if (text.isNotBlank()) result.append(text).append("\n")
            }
        }
        return result.toString().trim()
    }
}
