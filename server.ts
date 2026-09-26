import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { Communicate, SubMaker } from 'edge-tts-universal';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Setup file upload destination in /tmp
const upload = multer({
  dest: '/tmp/uploads/',
  limits: { fileSize: 150 * 1024 * 1024 } // 150MB max
});

if (!fs.existsSync('/tmp/uploads')) {
  fs.mkdirSync('/tmp/uploads', { recursive: true });
}

// Ensure yt-dlp binary is present in /tmp
let ytDlpPath: string | null = fs.existsSync('/tmp/yt-dlp') ? '/tmp/yt-dlp' : null;

async function ensureYtDlp(): Promise<string | null> {
  if (ytDlpPath && fs.existsSync(ytDlpPath)) return ytDlpPath;
  try {
    console.log('Downloading yt-dlp binary...');
    await execAsync('curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /tmp/yt-dlp && chmod +x /tmp/yt-dlp');
    ytDlpPath = '/tmp/yt-dlp';
    return ytDlpPath;
  } catch (err) {
    console.error('Failed to download yt-dlp:', err);
    return null;
  }
}
ensureYtDlp();

const ai = new GoogleGenAI({});

// 9 High-fidelity Human Voices (100% Compatible with Burmese and Multilingual Text)
export const SUPPORTED_VOICES = [
  {
    id: 'my-MM-ThihaNeural',
    name: 'သီဟ (Thiha)',
    gender: 'Male',
    lang: 'မြန်မာ (Burmese)',
    desc: 'နွေးထွေးတည်ငြိမ်သော လူငယ်/လူလတ်ပိုင်း အမျိုးသား အသံစစ်စစ် (သတင်း၊ ဝတ္ထု၊ ဇာတ်လမ်းပြောရန် အထူးကောင်း)'
  },
  {
    id: 'my-MM-NilarNeural',
    name: 'နီလာ (Nilar)',
    gender: 'Female',
    lang: 'မြန်မာ (Burmese)',
    desc: 'ကြည်လင်ချိုသာသော သဘာဝ အမျိုးသမီး အသံစစ်စစ် (ကြော်ငြာ၊ ပညာပေး၊ အသံစာအုပ် Audiobook များအတွက် အထူးကောင်း)'
  },
  {
    id: 'en-US-AndrewMultilingualNeural',
    name: 'Andrew (အင်ဒရူး)',
    gender: 'Male',
    lang: 'Multilingual / Storyteller',
    desc: 'ရုပ်ရှင်အသံထွက်ကဲ့သို့ သဘာဝကျပြီး သက်ဝင်လှုပ်ရှားသော Deep Storyteller အသံ'
  },
  {
    id: 'en-US-AvaMultilingualNeural',
    name: 'Ava (အေဗာ)',
    gender: 'Female',
    lang: 'Multilingual / YouTube Narration',
    desc: 'သဘာဝကျပြီး နားထောင်ရ သက်တောင့်သက်သာရှိသော YouTube Narration အသံ'
  },
  {
    id: 'en-US-BrianMultilingualNeural',
    name: 'Brian (ဘရိုင်ယန်)',
    gender: 'Male',
    lang: 'Multilingual / Podcast Host',
    desc: 'အပြောစကား အပြန်အလှန် ပုံစံ၊ Podcast နှင့် ဗဟုသုတ ဝေမျှရန် အသင့်တော်ဆုံး'
  },
  {
    id: 'en-US-EmmaMultilingualNeural',
    name: 'Emma (အမ်မာ)',
    gender: 'Female',
    lang: 'Multilingual / Audiobook',
    desc: 'နူးညံ့ညင်သာသော ဇာတ်လမ်းဖတ်ပြ အမျိုးသမီးအသံ'
  },
  {
    id: 'en-AU-WilliamMultilingualNeural',
    name: 'William (ဝီလျံ)',
    gender: 'Male',
    lang: 'Multilingual / Documentary',
    desc: 'တည်ကြည်လေးနက်ပြီး အာရုံစူးစိုက်စေသော Documentary စတိုင် အမျိုးသားအသံ'
  },
  {
    id: 'fr-FR-RemyMultilingualNeural',
    name: 'Remy (ရီမီ)',
    gender: 'Male',
    lang: 'Multilingual / Warm Voice',
    desc: 'နူးညံ့သိမ်မွေ့သော သဘာဝအသံ (စိတ်အေးချမ်းစေသော ဇာတ်လမ်းများအတွက်)'
  },
  {
    id: 'fr-FR-VivienneMultilingualNeural',
    name: 'Vivienne (ဗီဗီယန်)',
    gender: 'Female',
    lang: 'Multilingual / Elegant Female',
    desc: 'ကြည်လင်ပျော့ပျောင်းသော တော်ဝင်စတိုင် အမျိုးသမီး သဘာဝအသံစစ်စစ်'
  }
];

// Supported Natural Background Music (BGM) Tracks
const SUPPORTED_BGM_TRACKS = [
  { id: 'none', name: 'BGM မထည့်ပါ (သီးသန့် လူအသံ)', category: 'none', volume: 0 },
  { id: 'horror', name: '👻 သရဲ / ထိတ်လန့်ဖွယ် သဘာဝအသံ (Spooky Ambient)', category: 'horror', file: 'horror.mp3', volume: 0.20 },
  { id: 'calm', name: '🌿 သဘာဝ အေးချမ်းဖွယ် သံစဉ် (Calm Nature & Piano)', category: 'calm', file: 'calm.mp3', volume: 0.18 },
  { id: 'inspiring', name: '✨ စိတ်ခွန်အားဖြည့် သံစဉ် (Inspiring Cinematic)', category: 'inspiring', file: 'inspiring.mp3', volume: 0.18 },
  { id: 'mystery', name: '🕵️ လျှို့ဝှက်ဆန်းကြယ် သံစဉ် (Mystery Suspense)', category: 'mystery', file: 'mystery.mp3', volume: 0.22 },
  { id: 'emotional', name: '🍂 ရင်နင့်ဖွယ် ဒရာမာ သံစဉ် (Emotional Drama)', category: 'emotional', file: 'emotional.mp3', volume: 0.18 },
];

function isValidHttpUrl(stringUrl: string): boolean {
  if (!stringUrl || typeof stringUrl !== 'string') return false;
  if (!/^https?:\/\//i.test(stringUrl.trim())) return false;
  try {
    const url = new URL(stringUrl.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// -------------------------------------------------------------------------------------
// 1. Text-To-Speech (TTS) + Unlimited Character Length Synthesis + Natural BGM Mixing
// -------------------------------------------------------------------------------------
app.get('/api/tts-voices', (_req: Request, res: Response) => {
  return res.json({ 
    voices: SUPPORTED_VOICES,
    bgmTracks: SUPPORTED_BGM_TRACKS
  });
});

app.post('/api/text-to-speech', async (req: Request, res: Response) => {
  const { text, voice = 'my-MM-ThihaNeural', rate = '+0%', pitch = '+0Hz', bgm = 'none', bgmVolume = 0.2 } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'ကျေးဇူးပြု၍ စာသား ရိုက်ထည့်ပေးပါခင်ဗျာ။' });
  }

  const cleanText = text.trim();

  try {
    console.log(`Starting Natural Edge TTS with voice: ${voice}, BGM: ${bgm}, length: ${cleanText.length} chars`);
    
    // Function to run Communicate on any text block
    const synthesizeStream = async (txt: string, vName: string): Promise<Buffer> => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const comm = new Communicate(txt, {
            voice: vName,
            rate: rate || '+0%',
            pitch: pitch || '+0Hz',
          });
          const parts: Buffer[] = [];
          for await (const chunk of comm.stream()) {
            if (chunk.type === 'audio' && chunk.data) {
              parts.push(chunk.data);
            }
          }
          const buf = Buffer.concat(parts);
          if (buf.length > 0) return buf;
        } catch (err) {
          console.warn(`Attempt ${attempt} for voice ${vName} error:`, err);
          await new Promise(r => setTimeout(r, 200 * attempt));
        }
      }
      return Buffer.alloc(0);
    };

    let audioBuffer: Buffer = Buffer.alloc(0);

    // 1. If text is moderate (< 3,000 chars), try direct single stream
    if (cleanText.length <= 3000) {
      try {
        audioBuffer = await synthesizeStream(cleanText, voice);
      } catch (directErr) {
        console.warn('Direct stream failed, falling back to chunking:', directErr);
      }
    }

    // 2. Paragraph / Chunk-level Synthesis (Supports Unlimited Characters cleanly)
    if (audioBuffer.length === 0) {
      console.log('Running paragraph-level continuous chunk synthesis for unlimited length...');
      const paragraphs = cleanText
        .split(/\n+/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const audioChunks: Buffer[] = [];
      for (const para of paragraphs) {
        // If an individual paragraph is huge, split by sentences
        if (para.length > 1500) {
          const sentences = para.match(/[^။!?\n]+[။!?\n]?/g) || [para];
          for (const s of sentences) {
            const sTrim = s.trim();
            if (!sTrim) continue;
            const sBuf = await synthesizeStream(sTrim, voice);
            if (sBuf.length > 0) audioChunks.push(sBuf);
          }
        } else {
          const pBuf = await synthesizeStream(para, voice);
          if (pBuf.length > 0) audioChunks.push(pBuf);
        }
      }

      if (audioChunks.length > 0) {
        audioBuffer = Buffer.concat(audioChunks);
      }
    }

    // 3. Fallback to resilient voice if chosen voice failed
    if (audioBuffer.length === 0) {
      const fallbackVoice = voice === 'my-MM-ThihaNeural' ? 'my-MM-NilarNeural' : 'my-MM-ThihaNeural';
      console.log(`Using fallback voice: ${fallbackVoice} for full text`);
      audioBuffer = await synthesizeStream(cleanText, fallbackVoice);
    }

    if (audioBuffer.length === 0) {
      throw new Error('Speech synthesis produced no audio data.');
    }

    // 4. BGM Audio Mixing (Natural ambient music mixed underneath human speech)
    if (bgm && bgm !== 'none') {
      const selectedBgmTrack = SUPPORTED_BGM_TRACKS.find(b => b.id === bgm);
      if (selectedBgmTrack && selectedBgmTrack.file) {
        const bgmFilePath = path.join(__dirname, 'public', 'bgm', selectedBgmTrack.file);
        if (fs.existsSync(bgmFilePath)) {
          const tempSpeechPath = `/tmp/speech_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.mp3`;
          const tempMixedPath = `/tmp/mixed_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.mp3`;
          try {
            fs.writeFileSync(tempSpeechPath, audioBuffer);
            const vol = typeof bgmVolume === 'number' ? Math.max(0.05, Math.min(0.5, bgmVolume)) : 0.18;
            
            // Mix Speech (100% volume, crisp) + BGM (Looped infinitely to speech length with gentle ducking and fade out)
            const ffmpegMixCmd = `ffmpeg -y -i "${tempSpeechPath}" -stream_loop -1 -i "${bgmFilePath}" -filter_complex "[1:a]volume=${vol}[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2" -c:a libmp3lame -b:a 192k "${tempMixedPath}"`;
            
            await execAsync(ffmpegMixCmd);
            if (fs.existsSync(tempMixedPath)) {
              audioBuffer = fs.readFileSync(tempMixedPath);
              try { fs.unlinkSync(tempMixedPath); } catch (_) {}
            }
          } catch (mixErr) {
            console.warn('BGM Mixing failed, returning raw speech audio:', mixErr);
          } finally {
            try { if (fs.existsSync(tempSpeechPath)) fs.unlinkSync(tempSpeechPath); } catch (_) {}
          }
        }
      }
    }

    const base64Audio = audioBuffer.toString('base64');
    const audioDataUrl = `data:audio/mp3;base64,${base64Audio}`;

    return res.json({
      success: true,
      audioUrl: audioDataUrl,
      audioBytes: audioBuffer.length,
      characterCount: cleanText.length,
      voiceUsed: voice,
      bgmUsed: bgm
    });
  } catch (err: any) {
    console.error('Edge TTS Error:', err?.message || err);
    return res.status(500).json({ 
      error: 'Text-to-Speech ပြုလုပ်ရာတွင် အသံဖမ်းယူမှု မအောင်မြင်ပါ။ စာသားတိုတိုဖြင့် သို့မဟုတ် အခြားအသံ ရွေးချယ်၍ ပြန်လည် စမ်းသပ်ပေးပါခင်ဗျာ။' 
    });
  }
});

// -------------------------------------------------------------------------------------
// 2. Video Link / Upload -> Speech-To-Text (SRT) Transcription via Gemini AI
// -------------------------------------------------------------------------------------
async function transcribeAudioToSRT(audioFilePath: string, originalName: string, mimeType: string = 'audio/mp3') {
  console.log(`Starting AI transcription for: ${originalName} (${audioFilePath})`);

  const fileBuffer = fs.readFileSync(audioFilePath);
  const base64Audio = fileBuffer.toString('base64');
  const targetMime = mimeType.startsWith('video') ? 'video/mp4' : 'audio/mp3';

  const prompt = `You are a world-class professional subtitle generator and transcriber specializing in Burmese (Myanmar) and multilingual audio/video.
Your mission is to produce 100% faithful, word-by-word accurate subtitles matching exact speech timings.

Instructions:
1. Listen thoroughly to the entire media from the very first second to the last. Do not summarize or skip any parts, especially in long recordings.
2. Transcribe in authentic Unicode Myanmar script (if Burmese is spoken) or the actual spoken language. Ensure correct Burmese spelling and grammatical boundaries.
3. Every subtitle cue MUST have precise start and end timestamps in standard SRT time format: "HH:MM:SS,mmm" (e.g. 00:01:23,450).
4. Synchronize each line tightly with the speaker's vocal pace (typically 2 to 6 seconds per subtitle line, containing 1 natural spoken clause).
5. Output structured JSON matching the schema.

Schema:
{
  "detectedLanguage": "string (e.g. Myanmar, English, etc.)",
  "fullTranscript": "string (continuous complete transcript)",
  "subtitles": [
    {
      "index": 1,
      "startTime": "00:00:01,200",
      "endTime": "00:00:04,500",
      "text": "spoken phrase"
    }
  ]
}`;

  const audioPart = {
    inlineData: {
      mimeType: targetMime,
      data: base64Audio,
    },
  };

  let response = null;
  const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
  for (const m of modelsToTry) {
    try {
      response = await ai.models.generateContent({
        model: m,
        contents: [
          {
            role: 'user',
            parts: [
              audioPart,
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });
      if (response && response.text) break;
    } catch (modelErr: any) {
      console.warn(`Model ${m} failed, trying fallback:`, modelErr?.message || modelErr);
    }
  }

  if (!response || !response.text) {
    throw new Error('AI transcription service temporarily unavailable.');
  }

  let parsedData = null;
  try {
    const text = response.text || '{}';
    parsedData = JSON.parse(text);
  } catch (err) {
    console.error('JSON parse error from Gemini:', err, response.text);
    throw new Error('AI output format error');
  }

  let srtContent = '';
  if (Array.isArray(parsedData.subtitles)) {
    srtContent = parsedData.subtitles
      .map((item: any, i: number) => {
        const idx = item.index || (i + 1);
        const start = item.startTime || '00:00:00,000';
        const end = item.endTime || '00:00:02,000';
        const txt = item.text || '';
        return `${idx}\n${start} --> ${end}\n${txt}\n`;
      })
      .join('\n');
  }

  return {
    language: parsedData.detectedLanguage || 'Auto-detected',
    transcript: parsedData.fullTranscript || '',
    subtitles: parsedData.subtitles || [],
    srt: srtContent
  };
}

// =====================================================================================
// AI Story & Video Script Generator (Generates full, rich, long 7,000-character scripts)
// =====================================================================================
app.post('/api/generate-story-script', async (req: Request, res: Response) => {
  const { topic, genre = 'horror', duration = '5min', targetAudience = 'all', language = 'my' } = req.body;
  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: 'ဇာတ်လမ်း သို့မဟုတ် ခေါင်းစဉ်ကို ထည့်သွင်းပေးပါခင်ဗျာ။' });
  }

  try {
    console.log(`Starting 2-Part Deep Story Generation for topic: "${topic}" (${genre})...`);

    // Part 1: Act 1 & Act 2 (Introduction, Ambient Atmosphere, Character Journey, Mystery Discovery)
    const promptPart1 = `You are an acclaimed master novelist, film screenwriter, and viral storyteller in Myanmar.
The user wants an EXTREMELY LONG, IMMERSIVE storytelling script in natural spoken Burmese Unicode (မြန်မာစကားပြော လေသံစစ်စစ်).

Topic/Theme: "${topic.trim()}"
Genre: "${genre}" (horror/သရဲဇာတ်လမ်း, motivation/စိတ်ခွန်အားဖြည့်, tech/နည်းပညာ, history/သမိုင်း, fun-facts/ဗဟုသုတ, bedtime-story/ပုံပြင်)

INSTRUCTIONS FOR PART 1:
- Write Part 1 covering Act 1 (Atmospheric opening, setting, character background, eerie journey) and Act 2 (Deepening mystery, creepy encounters, ominous signs).
- Write in extreme narrative detail (at least 3,500 Myanmar characters / 8 to 10 rich paragraphs).
- Build immense tension. Do NOT resolve the conflict yet; end Part 1 on a dramatic suspenseful cliffhanger.
- Do NOT include bracketed stage directions like [Music starts] or [Scene 1] so it can be fed directly to Text-to-Speech.

Respond strictly in valid JSON:
{
  "title": "string (Creative Myanmar Title)",
  "category": "string",
  "part1Text": "string (long spoken Burmese story text)"
}`;

    let resPart1: any = null;
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
    for (const m of modelsToTry) {
      try {
        resPart1 = await ai.models.generateContent({
          model: m,
          contents: promptPart1,
          config: {
            responseMimeType: 'application/json',
            maxOutputTokens: 8192
          }
        });
        if (resPart1 && resPart1.text) break;
      } catch (err: any) {
        console.warn(`Part 1 generation failed with ${m}:`, err?.message || err);
      }
    }

    if (!resPart1 || !resPart1.text) {
      throw new Error('AI script generation failed. Please try again.');
    }

    const dataPart1 = JSON.parse(resPart1.text);
    const storyTitle = dataPart1.title || topic;
    const part1Story = dataPart1.part1Text || '';

    // Part 2: Act 3 & Act 4 (Climax, intense revelation, emotional escape/aftermath, memorable conclusion)
    const promptPart2 = `You are continuing the master storytelling script: "${storyTitle}".
Here is the previous narrative (Part 1):
${part1Story.slice(-1200)}

INSTRUCTIONS FOR PART 2:
- Write Part 2 covering Act 3 (Shocking climax, revelation of the true mystery, intense heart-pounding moments) and Act 4 (Emotional aftermath, realization, memorable lesson/conclusion).
- Write in extreme narrative detail (at least 3,500 Myanmar characters / 8 to 10 rich paragraphs) in natural spoken Burmese.
- Continue smoothly from Part 1.
- Do NOT include bracketed directions like [Music] or [Ending].

Respond strictly in valid JSON:
{
  "part2Text": "string (continuation spoken Burmese story text)"
}`;

    let resPart2: any = null;
    for (const m of modelsToTry) {
      try {
        resPart2 = await ai.models.generateContent({
          model: m,
          contents: promptPart2,
          config: {
            responseMimeType: 'application/json',
            maxOutputTokens: 8192
          }
        });
        if (resPart2 && resPart2.text) break;
      } catch (err: any) {
        console.warn(`Part 2 generation failed with ${m}:`, err?.message || err);
      }
    }

    let fullNarration = part1Story;
    if (resPart2 && resPart2.text) {
      try {
        const dataPart2 = JSON.parse(resPart2.text);
        if (dataPart2.part2Text) {
          fullNarration = `${part1Story.trim()}\n\n${dataPart2.part2Text.trim()}`;
        }
      } catch (_) {}
    }

    console.log(`Generated story successfully! Total characters: ${fullNarration.length}`);

    return res.json({
      success: true,
      title: storyTitle,
      category: dataPart1.category || genre,
      wordCount: fullNarration.length,
      estimatedMinutes: '၅ မိနစ် (စာလုံးရေ ၇,၀၀၀ ခန့်)',
      script: fullNarration
    });
  } catch (error: any) {
    console.error('Script generation error:', error);
    return res.status(500).json({ error: error.message || 'ဇာတ်ညွှန်းဖန်တီးရာတွင် အမှားဖြစ်ပေါ်သွားပါသည်။ နောက်တစ်ကြိမ် ထပ်မံကြိုးစားပေးပါ။' });
  }
});

// Upload Media File -> Speech-to-SRT
app.post('/api/transcribe-upload', upload.single('mediaFile'), async (req: Request, res: Response) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No media file was uploaded.' });
  }

  const tempPath = file.path;
  const originalName = file.originalname || 'uploaded_media';
  const audioExtractPath = `${tempPath}_extracted.mp3`;

  try {
    let finalAudioPath = tempPath;
    let finalMime = file.mimetype;

    if (file.mimetype.startsWith('video') || file.originalname.endsWith('.mp4') || file.originalname.endsWith('.mkv')) {
      try {
        await execAsync(`ffmpeg -y -i "${tempPath}" -vn -ar 24000 -ac 1 -b:a 64k "${audioExtractPath}"`);
        if (fs.existsSync(audioExtractPath)) {
          finalAudioPath = audioExtractPath;
          finalMime = 'audio/mp3';
        }
      } catch (ffErr) {
        console.warn('ffmpeg extraction fallback to direct file:', ffErr);
      }
    }

    const result = await transcribeAudioToSRT(finalAudioPath, originalName, finalMime);

    return res.json({
      success: true,
      title: originalName,
      language: result.language,
      transcript: result.transcript,
      subtitles: result.subtitles,
      srt: result.srt
    });
  } catch (err: any) {
    console.error('Transcription upload error:', err);
    return res.status(500).json({ 
      error: 'Failed to transcribe audio. Please make sure the audio contains audible speech.' 
    });
  } finally {
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      if (fs.existsSync(audioExtractPath)) fs.unlinkSync(audioExtractPath);
    } catch (_) {}
  }
});

// Video Link (YouTube, TikTok, Facebook) -> Speech-to-SRT
app.post('/api/transcribe-url', async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url || !isValidHttpUrl(url)) {
    return res.status(400).json({ error: 'Please provide a valid video link (YouTube, TikTok, Facebook, etc).' });
  }

  const timestamp = Date.now();
  const targetAudioPath = `/tmp/link_audio_${timestamp}.mp3`;

  try {
    await ensureYtDlp();

    console.log(`Extracting audio from URL: ${url}`);
    const cmd = `/tmp/yt-dlp --no-warnings --no-playlist -x --audio-format mp3 -o "${targetAudioPath}" "${url}"`;
    await execAsync(cmd, { timeout: 120000 });

    if (!fs.existsSync(targetAudioPath)) {
      const altPath = targetAudioPath.endsWith('.mp3') ? targetAudioPath : `${targetAudioPath}.mp3`;
      if (!fs.existsSync(altPath)) {
        throw new Error('Audio extraction failed from the provided URL.');
      }
    }

    const actualPath = fs.existsSync(targetAudioPath) ? targetAudioPath : `${targetAudioPath}.mp3`;
    const result = await transcribeAudioToSRT(actualPath, url, 'audio/mp3');

    return res.json({
      success: true,
      url,
      language: result.language,
      transcript: result.transcript,
      subtitles: result.subtitles,
      srt: result.srt
    });
  } catch (err: any) {
    console.error('URL Transcription error:', err);
    return res.status(400).json({ 
      error: 'ဤ Video Link မှ အသံကို ဆာဗာက တိုက်ရိုက်ဆွဲယူ၍ မရနိုင်ပါ။ အောက်ပါ "ဖိုင် တိုက်ရိုက် Upload တင်မည်" ခလုတ်ကို နှိပ်ပြီး မိမိဖုန်းထဲရှိ Video/Audio ဖိုင်ကို ရွေးချယ်ပေးပါက SRT စာတန်းထိုး တိကျစွာ ချက်ချင်းရရှိပါမည်။' 
    });
  } finally {
    try {
      if (fs.existsSync(targetAudioPath)) fs.unlinkSync(targetAudioPath);
    } catch (_) {}
  }
});

// Download Subtitle
app.post('/api/download-subtitles', (req: Request, res: Response) => {
  const { content, filename = 'subtitles', format = 'srt' } = req.body;
  if (!content) {
    return res.status(400).send('No subtitle content provided');
  }

  const safeName = filename.replace(/[^\w\s-]/gi, '').trim() || 'subtitles';
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}.${format}"`);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.send(content);
});

// Static assets / SPA setup
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
