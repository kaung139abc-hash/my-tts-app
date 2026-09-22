package com.kaung.recoveryagent

import android.content.ContentValues
import android.media.AudioAttributes
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.provider.MediaStore
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.naman14.androidlame.AndroidLame
import com.naman14.androidlame.LameBuilder
import java.io.BufferedInputStream
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.Locale
import java.util.UUID
import kotlin.concurrent.thread

class MainActivity : AppCompatActivity(), TextToSpeech.OnInitListener {
    private lateinit var tts: TextToSpeech
    private lateinit var textInput: EditText
    private lateinit var voiceSpinner: Spinner
    private lateinit var rateSeek: SeekBar
    private lateinit var pitchSeek: SeekBar
    private lateinit var status: TextView
    private lateinit var speakButton: Button
    private lateinit var saveButton: Button
    private lateinit var saveMp3Button: Button
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
        saveMp3Button = findViewById(R.id.saveMp3Button)
        rateSeek.progress = 50
        pitchSeek.progress = 50
        tts = TextToSpeech(this, this)
        speakButton.setOnClickListener { speak() }
        saveButton.setOnClickListener { saveWav() }
        saveMp3Button.setOnClickListener { saveMp3() }
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
        val labels = voices.map { it.locale.displayName + " • " + it.name }
        voiceSpinner.adapter = ArrayAdapter(
            this, android.R.layout.simple_spinner_dropdown_item,
            labels.ifEmpty { listOf("Android default voice") }
        )
        status.text = "Ready • Local TTS • WAV + MP3 • API key not required"
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
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "preview-" + UUID.randomUUID())
        status.text = "Speaking locally…"
    }

    private fun saveWav() {
        if (!ready) { status.text = "TTS is still starting…"; return }
        val text = textInput.text.toString().trim()
        if (text.isEmpty()) { status.text = "Enter some text first."; return }
        applySettings()
        val file = File(cacheDir, "tts-" + System.currentTimeMillis() + ".wav")
        setExportButtons(false)
        status.text = "Creating WAV locally…"
        tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String?) = Unit
            override fun onError(utteranceId: String?) {
                if (utteranceId != "export") return
                runOnUiThread { setExportButtons(true); status.text = "Could not create the WAV file." }
            }
            override fun onDone(utteranceId: String?) {
                if (utteranceId != "export") return
                val saved = copyToMusic(file, "wav")
                runOnUiThread {
                    setExportButtons(true)
                    status.text = if (saved != null) "Saved WAV: " + saved else "WAV could not be saved."
                }
            }
        })
        tts.synthesizeToFile(
            text,
            Bundle().apply { putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, "export") },
            file,
            "export"
        )
    }

    private fun saveMp3() {
        if (!ready) { status.text = "TTS is still starting…"; return }
        val text = textInput.text.toString().trim()
        if (text.isEmpty()) { status.text = "Enter some text first."; return }
        applySettings()
        val wav = File(cacheDir, "tts-mp3-" + System.currentTimeMillis() + ".wav")
        setExportButtons(false)
        status.text = "Creating MP3 locally…"
        val utteranceId = "mp3-export"
        tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(id: String?) = Unit
            override fun onError(id: String?) {
                if (id != utteranceId) return
                runOnUiThread { setExportButtons(true); status.text = "Could not create the source audio." }
            }
            override fun onDone(id: String?) {
                if (id != utteranceId) return
                thread {
                    val result = try { encodeWavToMp3(wav) } catch (_: Exception) { null }
                    runOnUiThread {
                        setExportButtons(true)
                        status.text = if (result != null) "Saved MP3: " + result else "MP3 conversion failed."
                    }
                }
            }
        })
        tts.synthesizeToFile(
            text,
            Bundle().apply { putString(TextToSpeech.Engine.KEY_PARAM_UTTERANCE_ID, utteranceId) },
            wav,
            utteranceId
        )
    }

    private fun setExportButtons(enabled: Boolean) {
        saveButton.isEnabled = enabled
        saveMp3Button.isEnabled = enabled
    }

    private data class WavHeader(val sampleRate: Int, val channels: Int, val dataOffset: Int)

    private fun readWavHeader(file: File): WavHeader? {
        FileInputStream(file).use { input ->
            val riff = ByteArray(12)
            if (input.read(riff) != 12) return null
            if (String(riff, 0, 4, Charsets.US_ASCII) != "RIFF" ||
                String(riff, 8, 4, Charsets.US_ASCII) != "WAVE") return null
            var sampleRate = 0
            var channels = 0
            var offset = 12
            while (true) {
                val chunk = ByteArray(8)
                if (input.read(chunk) != 8) return null
                val size = ByteBuffer.wrap(chunk, 4, 4).order(ByteOrder.LITTLE_ENDIAN).int
                val id = String(chunk, 0, 4, Charsets.US_ASCII)
                if (id == "fmt ") {
                    val fmt = ByteArray(size.coerceAtMost(64))
                    if (input.read(fmt) != fmt.size) return null
                    if (fmt.size >= 16) {
                        channels = ByteBuffer.wrap(fmt, 2, 2).order(ByteOrder.LITTLE_ENDIAN).short.toInt()
                        sampleRate = ByteBuffer.wrap(fmt, 4, 4).order(ByteOrder.LITTLE_ENDIAN).int
                    }
                    if (size > fmt.size) input.skip((size - fmt.size).toLong())
                } else if (id == "data") {
                    return if (sampleRate > 0 && channels in 1..2) WavHeader(sampleRate, channels, offset + 8) else null
                } else {
                    input.skip(size.toLong() + (size and 1))
                }
                offset += 8 + size + (size and 1)
            }
        }
    }

    private fun encodeWavToMp3(wav: File): String? {
        val header = readWavHeader(wav) ?: return null
        val channels = header.channels
        val lame = AndroidLame(
            LameBuilder()
                .setInSampleRate(header.sampleRate)
                .setOutChannels(channels)
                .setOutSampleRate(header.sampleRate)
                .setOutBitrate(128)
                .setQuality(5)
                .setMode(if (channels == 1) LameBuilder.Mode.MONO else LameBuilder.Mode.JSTEREO)
        )
        val temp = File(cacheDir, "tts-" + System.currentTimeMillis() + ".mp3")
        val input = BufferedInputStream(FileInputStream(wav))
        val output = FileOutputStream(temp)
        try {
            input.skip(header.dataOffset.toLong())
            val frameBytes = channels * 2
            val pcmBytes = ByteArray(1152 * frameBytes)
            val mp3 = ByteArray(8192)
            while (true) {
                val count = input.read(pcmBytes)
                if (count <= 0) break
                val usable = count - (count % frameBytes)
                if (usable <= 0) continue
                val samples = usable / frameBytes
                val shorts = ShortArray(samples * channels)
                ByteBuffer.wrap(pcmBytes, 0, usable).order(ByteOrder.LITTLE_ENDIAN).asShortBuffer().get(shorts)
                val written = lame.encodeBufferInterLeaved(shorts, samples, mp3)
                if (written > 0) output.write(mp3, 0, written)
            }
            val flushed = lame.flush(mp3)
            if (flushed > 0) output.write(mp3, 0, flushed)
        } finally {
            input.close()
            output.close()
            lame.close()
            wav.delete()
        }
        return copyToMusic(temp, "mp3")
    }

    private fun copyToMusic(source: File, extension: String): String? {
        if (!source.exists()) return null
        val mime = if (extension == "mp3") "audio/mpeg" else "audio/wav"
        val name = "TTS-" + System.currentTimeMillis() + "." + extension
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val values = ContentValues().apply {
                    put(MediaStore.Audio.Media.DISPLAY_NAME, name)
                    put(MediaStore.Audio.Media.MIME_TYPE, mime)
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
                "Music/TTS/" + name
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
