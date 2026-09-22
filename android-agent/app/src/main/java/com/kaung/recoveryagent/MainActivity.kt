package com.kaung.recoveryagent

import android.content.ContentValues
import android.media.AudioAttributes
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.util.Locale
import java.util.UUID

class MainActivity : AppCompatActivity(), TextToSpeech.OnInitListener {
    private lateinit var tts: TextToSpeech
    private lateinit var textInput: EditText
    private lateinit var voiceSpinner: Spinner
    private lateinit var rateSeek: SeekBar
    private lateinit var pitchSeek: SeekBar
    private lateinit var status: TextView
    private lateinit var speakButton: Button
    private lateinit var saveButton: Button
    private var ready = false
    private var voices = listOf<TextToSpeech.Voice>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        textInput = findViewById(R.id.textInput)
        voiceSpinner = findViewById(R.id.voiceSpinner)
        rateSeek = findViewById(R.id.rateSeek)
        pitchSeek = findViewById(R.id.pitchSeek)
        status = findViewById(R.id.status)
        speakButton = findViewById(R.id.speakButton)
        saveButton = findViewById(R.id.saveButton)
        rateSeek.progress = 50
        pitchSeek.progress = 50
        tts = TextToSpeech(this, this)
        speakButton.setOnClickListener { speak() }
        saveButton.setOnClickListener { saveWav() }
    }

    override fun onInit(result: Int) {
        if (result != TextToSpeech.SUCCESS) {
            status.text = "TTS engine could not start. Enable an Android TTS engine in Settings."
            return
        }
        tts.setAudioAttributes(
            AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build()
        )
        ready = true
        val locale = Locale.getDefault()
        tts.language = locale
        voices = tts.voices
            .filter { !it.isNetworkConnectionRequired && it.locale.language == locale.language }
            .sortedBy { it.name.lowercase(Locale.ROOT) }
        if (voices.isEmpty()) {
            voices = tts.voices.filter { !it.isNetworkConnectionRequired }
                .sortedBy { it.name.lowercase(Locale.ROOT) }
        }
        val labels = voices.map { voice ->
            val quality = when {
                voice.quality >= TextToSpeech.VOICE_QUALITY_VERY_HIGH -> "high"
                voice.quality >= TextToSpeech.VOICE_QUALITY_HIGH -> "good"
                else -> "standard"
            }
            "${voice.locale.displayName} • ${voice.name} • $quality"
        }
        voiceSpinner.adapter = ArrayAdapter(
            this, android.R.layout.simple_spinner_dropdown_item,
            labels.ifEmpty { listOf("Android default voice") }
        )
        status.text = "Ready • Local TTS • API key not required"
    }

    private fun applySettings() {
        if (voices.isNotEmpty() && voiceSpinner.selectedItemPosition in voices.indices) {
            tts.voice = voices[voiceSpinner.selectedItemPosition]
        }
        tts.setSpeechRate(0.5f + rateSeek.progress / 50f)
        tts.setPitch(0.5f + pitchSeek.progress / 50f)
    }

    private fun speak() {
        if (!ready) { status.text = "TTS is still starting…"; return }
        val text = textInput.text.toString().trim()
        if (text.isEmpty()) { status.text = "Enter some text first."; return }
        applySettings()
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "preview-${UUID.randomUUID()}")
        status.text = "Speaking locally…"
    }

    private fun saveWav() {
        if (!ready) { status.text = "TTS is still starting…"; return }
        val text = textInput.text.toString().trim()
        if (text.isEmpty()) { status.text = "Enter some text first."; return }
        applySettings()
        val file = File(cacheDir, "tts-${System.currentTimeMillis()}.wav")
        saveButton.isEnabled = false
        status.text = "Creating WAV locally…"
        tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) = Unit
            override fun onError(utteranceId: String?) {
                runOnUiThread {
                    saveButton.isEnabled = true
                    status.text = "Could not create the WAV file."
                }
            }
            override fun onDone(utteranceId: String?) {
                if (utteranceId != "export") return
                val saved = copyToMusic(file)
                runOnUiThread {
                    saveButton.isEnabled = true
                    status.text = if (saved != null) "Saved WAV: $saved" else "WAV could not be saved."
                }
            }
        })
        val params = Bundle().apply {
            putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "export")
        }
        tts.synthesizeToFile(text, params, file, "export-${UUID.randomUUID()}")
    }

    private fun copyToMusic(source: File): String? {
        if (!source.exists()) return null
        val name = "TTS-${System.currentTimeMillis()}.wav"
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val values = ContentValues().apply {
                    put(MediaStore.Audio.Media.DISPLAY_NAME, name)
                    put(MediaStore.Audio.Media.MIME_TYPE, "audio/wav")
                    put(MediaStore.Audio.Media.RELATIVE_PATH, Environment.DIRECTORY_MUSIC + "/TTS")
                    put(MediaStore.Audio.Media.IS_PENDING, 1)
                }
                val uri = contentResolver.insert(MediaStore.Audio.Media.EXTERNAL_CONTENT_URI, values) ?: return null
                contentResolver.openOutputStream(uri)?.use { output ->
                    FileInputStream(source).use { input -> input.copyTo(output) }
                }
                values.clear()
                values.put(MediaStore.Audio.Media.IS_PENDING, 0)
                contentResolver.update(uri, values, null, null)
                "Music/TTS/$name"
            } else {
                val dir = File(getExternalFilesDir(Environment.DIRECTORY_MUSIC), "TTS")
                dir.mkdirs()
                val target = File(dir, name)
                FileInputStream(source).use { input -> FileOutputStream(target).use { output -> input.copyTo(output) } }
                target.absolutePath
            }
        } catch (_: Exception) {
            null
        } finally {
            source.delete()
        }
    }

    override fun onDestroy() {
        if (::tts.isInitialized) { tts.stop(); tts.shutdown() }
        super.onDestroy()
    }
}
