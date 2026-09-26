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

// 9 High-fidelity Human Voices (Neural Real Human Voices)
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
    lang: 'English (US / Natural Human)',
    desc: 'ရုပ်ရှင်အသံထွက်ကဲ့သို့ သဘာဝကျပြီး သက်ဝင်လှုပ်ရှားသော Deep Storyteller အသံ'
  },
  {
    id: 'en-US-AvaMultilingualNeural',
    name: 'Ava (အေဗာ)',
    gender: 'Female',
    lang: 'English (US / Natural Human)',
    desc: 'သဘာဝကျပြီး နားထောင်ရ သက်တောင့်သက်သာရှိသော YouTube Narration အသံ'
  },
  {
    id: 'en-US-BrianMultilingualNeural',
    name: 'Brian (ဘရိုင်ယန်)',
    gender: 'Male',
    lang: 'English (US / Conversational)',
    desc: 'အပြောစကား အပြန်အလှန် ပုံစံ၊ Podcast နှင့် ဗဟုသုတ ဝေမျှရန် အသင့်တော်ဆုံး'
  },
  {
    id: 'en-US-EmmaMultilingualNeural',
    name: 'Emma (အမ်မာ)',
    gender: 'Female',
    lang: 'English (US / Storyteller)',
    desc: 'နူးညံ့ညင်သာသော ဇာတ်လမ်းဖတ်ပြ အသံ'
  },
  {
    id: 'en-GB-RyanNeural',
    name: 'Ryan (ရိုင်ယန်)',
    gender: 'Male',
    lang: 'English (British / UK Accent)',
    desc: 'ဗြိတိသျှ အသံထွက်စစ်စစ်၊ ခံ့ညားထည်ဝါသော Documentary အသံ'
  },
  {
    id: 'en-GB-SoniaNeural',
    name: 'Sonia (ဆိုနီယာ)',
    gender: 'Female',
    lang: 'English (British / UK Accent)',
    desc: 'ယဉ်ကျေးသန့်ပြန့်သော ဗြိတိသျှ တော်ဝင်လေသံ အသံစစ်စစ်'
  },
  {
    id: 'th-TH-NiwatNeural',
    name: 'Niwat (နီဝပ်)',
    gender: 'Male',
    lang: 'Thai (ထိုင်းဘာသာ)',
    desc: 'သဘာဝကျသော ထိုင်းအမျိုးသား အသံစစ်စစ်'
  }
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
// 1. Text-To-Speech (TTS) + Precise SRT Subtitle Generator (Up to 10,000 Chars per run)
// -------------------------------------------------------------------------------------
app.get('/api/tts-voices', (_req: Request, res: Response) => {
  return res.json({ voices: SUPPORTED_VOICES });
});

app.post('/api/text-to-speech', async (req: Request, res: Response) => {
  const { text, voice = 'my-MM-ThihaNeural', rate = '+0%', pitch = '+0Hz' } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'ကျေးဇူးပြု၍ စာသား ရိုက်ထည့်ပေးပါခင်ဗျာ။' });
  }

  const cleanText = text.trim();
  if (cleanText.length > 10000) {
    return res.status(400).json({ error: 'တစ်ကြိမ်လျှင် စာလုံးရေ ၁၀,၀၀၀ (10,000 characters) အထိသာ ခွင့်ပြုထားပါသည်။' });
  }

  try {
    console.log(`Starting Natural Edge TTS with voice: ${voice}, length: ${cleanText.length} chars`);
    
    // Function to run Communicate on a text string with automatic retry
    const synthesizeBlock = async (txt: string, vName: string): Promise<{ audio: Buffer; srt: string }> => {
      let lastErr: any = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const comm = new Communicate(txt, {
            voice: vName,
            rate: rate || '+0%',
            pitch: pitch || '+0Hz',
          });
          const subMaker = new SubMaker();
          const parts: Buffer[] = [];
          for await (const chunk of comm.stream()) {
            if (chunk.type === 'audio') {
              parts.push(chunk.data);
            } else if (chunk.type === 'WordBoundary') {
              try {
                subMaker.feed(chunk);
              } catch (_) {}
            }
          }
          const buf = Buffer.concat(parts);
          if (buf.length > 0) {
            return {
              audio: buf,
              srt: subMaker.getSrt() || ''
            };
          }
        } catch (err) {
          lastErr = err;
          await new Promise(r => setTimeout(r, 150 * attempt));
        }
      }
      return { audio: Buffer.alloc(0), srt: '' };
    };

    let audioBuffer: Buffer = Buffer.alloc(0);
    let fullSrt = '';

    // If text is moderate (under 2,500 chars), synthesize directly in one clean shot (zero chunking artifacts)
    if (cleanText.length <= 2500) {
      try {
        const result = await synthesizeBlock(cleanText, voice);
        audioBuffer = result.audio;
        fullSrt = result.srt;
      } catch (directErr: any) {
        console.warn('Direct synthesis failed, falling back:', directErr?.message || directErr);
      }
    }

    // If still no audio or text is longer than 2,500 chars, chunk by meaningful paragraphs
    if (audioBuffer.length === 0) {
      const splitIntoChunks = (str: string, maxLen = 1500): string[] => {
        const rawBlocks = str.split(/\n+/).map(s => s.trim()).filter(Boolean);
        const chunks: string[] = [];
        let curr = '';

        for (const block of rawBlocks) {
          // Check if block contains actual alphanumeric or letters (not just punctuation)
          if (!/[a-zA-Z0-9\u1000-\u109F\uAA60-\uAA7F]/.test(block)) {
            continue;
          }
          if ((curr + '\n' + block).length > maxLen) {
            if (curr.trim()) chunks.push(curr.trim());
            curr = block;
          } else {
            curr = curr ? `${curr}\n${block}` : block;
          }
        }
        if (curr.trim()) chunks.push(curr.trim());
        return chunks.length > 0 ? chunks : [str];
      };

      const textChunks = splitIntoChunks(cleanText);
      const audioChunks: Buffer[] = [];

      for (const chunkText of textChunks) {
        if (!chunkText || !/[a-zA-Z0-9\u1000-\u109F]/.test(chunkText)) continue;
        try {
          const resBlock = await synthesizeBlock(chunkText, voice);
          if (resBlock.audio.length > 0) {
            audioChunks.push(resBlock.audio);
            if (resBlock.srt) {
              fullSrt += (fullSrt ? '\n\n' : '') + resBlock.srt;
            }
          }
        } catch (cErr: any) {
          console.warn('Chunk synthesis error:', cErr?.message || cErr);
        }
      }

      if (audioChunks.length > 0) {
        audioBuffer = Buffer.concat(audioChunks);
      }
    }

    // Ultimate fallback if chosen voice temporarily failed
    if (audioBuffer.length === 0) {
      const fallbackVoice = voice === 'my-MM-ThihaNeural' ? 'my-MM-NilarNeural' : 'en-US-AndrewMultilingualNeural';
      console.log(`Using resilient fallback voice: ${fallbackVoice}`);
      const fallbackRes = await synthesizeBlock(cleanText.slice(0, 1500), fallbackVoice);
      audioBuffer = fallbackRes.audio;
      fullSrt = fallbackRes.srt;
    }

    if (audioBuffer.length === 0) {
      throw new Error('Speech synthesis produced no audio data.');
    }

    const base64Audio = audioBuffer.toString('base64');
    const audioDataUrl = `data:audio/mp3;base64,${base64Audio}`;

    return res.json({
      success: true,
      audioUrl: audioDataUrl,
      audioBytes: audioBuffer.length,
      srt: fullSrt,
      characterCount: cleanText.length,
      voiceUsed: voice,
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
