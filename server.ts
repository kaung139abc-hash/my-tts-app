import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Helper to convert raw PCM to WAV Buffer
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  // Check if buffer is already a WAV file (starts with 'RIFF')
  if (pcmBuffer.length >= 4 && pcmBuffer.toString('utf8', 0, 4) === 'RIFF') {
    return pcmBuffer;
  }

  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const wavHeader = Buffer.alloc(44);

  // RIFF chunk descriptor
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write('WAVE', 8);

  // "fmt " sub-chunk
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  wavHeader.writeUInt16LE(1, 20);  // AudioFormat (1 for PCM)
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(bitsPerSample, 34);

  // "data" sub-chunk
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(pcmBuffer.length, 40);

  return Buffer.concat([wavHeader, pcmBuffer]);
}

// Helper to create silent PCM buffer for natural inter-sentence pauses
function createSilenceBuffer(sampleRate = 24000, durationSec = 0.15, numChannels = 1, bitsPerSample = 16): Buffer {
  const numBytes = Math.floor(sampleRate * durationSec * numChannels * (bitsPerSample / 8));
  return Buffer.alloc(numBytes);
}

// Smart text chunking optimized for Burmese (Myanmar) & English punctuation and clauses
function splitTextIntoChunks(rawText: string, maxChunkLength = 260): string[] {
  const clean = rawText.trim();
  if (!clean) return [];
  if (clean.length <= maxChunkLength) return [clean];

  const chunks: string[] = [];
  // Split into paragraphs first
  const paragraphs = clean.split(/\n+/);

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    if (trimmedPara.length <= maxChunkLength) {
      chunks.push(trimmedPara);
      continue;
    }

    // Split by Burmese sentence stop (။), question marks, exclamation marks, English full stops
    const sentences = trimmedPara
      .replace(/([။.!?]+)/g, "$1\n___SPLIT___\n")
      .split("\n___SPLIT___\n")
      .map((s) => s.trim())
      .filter(Boolean);

    let currentChunk = "";

    for (const sent of sentences) {
      if (!sent) continue;

      if ((currentChunk + " " + sent).trim().length <= maxChunkLength) {
        currentChunk = currentChunk ? (currentChunk + " " + sent).trim() : sent;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = "";
        }

        if (sent.length <= maxChunkLength) {
          currentChunk = sent;
        } else {
          // If a single sentence is still too long, split by Burmese comma (၊) or English comma (,)
          const clauses = sent
            .replace(/([၊,;]+)/g, "$1\n___CLAUSE___\n")
            .split("\n___CLAUSE___\n")
            .map((c) => c.trim())
            .filter(Boolean);

          for (const clause of clauses) {
            if ((currentChunk + " " + clause).trim().length <= maxChunkLength) {
              currentChunk = currentChunk ? (currentChunk + " " + clause).trim() : clause;
            } else {
              if (currentChunk) {
                chunks.push(currentChunk);
                currentChunk = "";
              }
              if (clause.length <= maxChunkLength) {
                currentChunk = clause;
              } else {
                // Hard wrap by word/space
                const words = clause.split(/\s+/);
                for (const word of words) {
                  if ((currentChunk + " " + word).trim().length <= maxChunkLength) {
                    currentChunk = currentChunk ? (currentChunk + " " + word).trim() : word;
                  } else {
                    if (currentChunk) chunks.push(currentChunk);
                    currentChunk = word;
                  }
                }
              }
            }
          }
        }
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
  }

  return chunks.filter((c) => c.trim().length > 0);
}

// Single chunk synthesizer helper
async function synthesizeSingleChunk(
  ai: GoogleGenAI,
  chunkText: string,
  voice: string,
  emotionStyle: string,
  personaStyle: string,
  customPrompt?: string,
  language = "my"
): Promise<{ pcmBuffer: Buffer; sampleRate: number }> {
  let prompt = `Speak the following text ${emotionStyle}`;
  if (personaStyle) {
    prompt += `, specifically ${personaStyle}`;
  }
  if (customPrompt && customPrompt.trim()) {
    prompt += `, following these specific style directions: ${customPrompt.trim()}`;
  }
  if (language === "my") {
    prompt += `. The text is in Myanmar (Burmese) language; pronounce every word accurately with natural native Burmese human intonation, tone heights, and cadence.`;
  }
  prompt += `. Do not add any greeting, preamble, explanations, or meta commentary. Speak ONLY the exact words provided:\n\n${chunkText.trim()}`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  const rawBase64 = part?.inlineData?.data;
  const returnedMime = part?.inlineData?.mimeType || "audio/pcm;rate=24000";

  if (!rawBase64) {
    throw new Error("No audio returned from speech model for chunk.");
  }

  const pcmBuffer = Buffer.from(rawBase64, "base64");
  const sampleRate = returnedMime.includes("16000") ? 16000 : 24000;
  return { pcmBuffer, sampleRate };
}
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Single-speaker & Multi-speaker TTS generation endpoint
app.post("/api/tts/generate", async (req, res) => {
  try {
    const {
      text,
      voice = "Kore",
      persona,
      emotion = "natural",
      customPrompt,
      mode = "single",
      dialogue,
      language = "my", // 'my' (Burmese), 'en' (English), 'auto'
    } = req.body;

    if (mode === "single" && (!text || typeof text !== "string" || !text.trim())) {
      return res.status(400).json({ error: "Text content is required for speech synthesis." });
    }

    if (mode === "dialogue" && (!dialogue || !Array.isArray(dialogue) || dialogue.length === 0)) {
      return res.status(400).json({ error: "Valid dialogue lines are required for multi-speaker mode." });
    }

    const ai = getAI();

    // Persona & Age Profile map
    const personaDirections: Record<string, string> = {
      child_girl: "in the voice and persona of a cute, sweet, innocent 6-year-old child girl (ကလေး မိန်းကလေး) with a high-pitched, playful, bright, adorable and curious voice",
      child_boy: "in the voice and persona of an energetic, playful, adventurous 7-year-old young boy (ကလေး ယောက်ျားလေး / Boy) with vibrant enthusiasm and authentic child cadence",
      teen_girl: "in the voice and persona of a vibrant, friendly, cheerful young teenage girl (လူငယ် မိန်းခလေး) with modern, bright and natural conversational inflections",
      teen_boy: "in the voice and persona of a lively, dynamic, casual young teenage boy / youth (လူငယ် ယောက်ျားလေး) with engaging and cheerful energy",
      adult_woman: "in the voice and persona of a warm, sophisticated, nurturing, articulate mature woman or mother (မိန်းမကြီး / အမေ) with steady, loving and elegant delivery",
      adult_man: "in the voice and persona of a confident, articulate, mature adult gentleman / man (လူလတ်ပိုင်း / Man အမျိုးသား) with rich, steady, calm and professional resonance",
      elder_woman: "in the voice and persona of a loving, gentle, 70-year-old grandmother / senior elder woman (သက်ကြီး အဘွားအို / မိန်းမကြီး) with soft, nostalgic, caring and comforting tone",
      elder_man: "in the voice and persona of a wise, calm, gentle 72-year-old grandfather / senior elder gentleman (သက်ကြီး အဘိုးအို / လူကြီး) with deep, measured, warm and experienced pacing",
    };

    // Emotion & Tone direction map
    const emotionDirections: Record<string, string> = {
      natural: "in a completely natural, human, conversational, and effortless tone with authentic human pacing and gentle pauses",
      cheerful: "with a lively, warm, cheerful, positive, and smiling human expression",
      storytelling: "like a captivating story narrator with soothing, rhythmic, expressive cadence, deep warmth, and subtle suspense",
      news: "as a professional, crisp, articulate, clear broadcast anchor with authoritative and balanced delivery",
      empathetic: "with deep empathy, softness, comfort, care, and gentle warm human reassurance",
      dramatic: "with cinematic theatrical passion, dramatic pauses, deep emotion, and vivid human expression",
      motivational: "with high energy, inspiring confidence, powerful emphasis, and motivational enthusiasm",
      whisper: "in a soft, intimate, gentle, relaxed whisper/ASMR tone with delicate human breathing",
    };

    const emotionStyle = emotionDirections[emotion] || emotionDirections.natural;
    const personaStyle = persona && personaDirections[persona] ? personaDirections[persona] : "";

    if (mode === "single") {
      const chunks = splitTextIntoChunks(text, 260);
      if (chunks.length === 0) {
        return res.status(400).json({ error: "No valid text content found for speech synthesis." });
      }

      console.log(`[TTS] Synthesizing single speaker (${text.length} chars) across ${chunks.length} chunk(s)`);

      const pcmChunks: Buffer[] = [];
      let detectedSampleRate = 24000;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const resChunk = await synthesizeSingleChunk(
          ai,
          chunk,
          voice,
          emotionStyle,
          personaStyle,
          customPrompt,
          language
        );
        detectedSampleRate = resChunk.sampleRate;
        pcmChunks.push(resChunk.pcmBuffer);

        // Add 120ms natural breathing pause between chunks
        if (i < chunks.length - 1) {
          pcmChunks.push(createSilenceBuffer(detectedSampleRate, 0.12));
        }
      }

      const mergedPcm = Buffer.concat(pcmChunks);
      const wavBuffer = pcmToWav(mergedPcm, detectedSampleRate, 1, 16);
      const wavBase64 = wavBuffer.toString("base64");
      const durationSeconds = (mergedPcm.length / (detectedSampleRate * 2)).toFixed(2);

      return res.json({
        success: true,
        audioUrl: `data:audio/wav;base64,${wavBase64}`,
        duration: Number(durationSeconds),
        sampleRate: detectedSampleRate,
        voice,
        persona,
        emotion,
        textLength: text.trim().length,
        chunksCount: chunks.length,
      });
    } else {
      // Multi-speaker / Dialogue mode with unlimited lines support
      const validDialogue = dialogue.filter(
        (d: { text?: string }) => d && typeof d.text === "string" && d.text.trim().length > 0
      );

      if (validDialogue.length === 0) {
        return res.status(400).json({ error: "No dialogue text lines found to synthesize." });
      }

      console.log(`[TTS] Synthesizing dialogue with ${validDialogue.length} line(s)`);

      const speaker1 = validDialogue[0]?.speaker || "Speaker 1";
      const voice1 = validDialogue[0]?.voice || "Kore";
      const speaker2 = validDialogue.find((d: { speaker: string; voice?: string }) => d.speaker !== speaker1)?.speaker || "Speaker 2";
      const voice2 = validDialogue.find((d: { speaker: string; voice?: string }) => d.speaker !== speaker1)?.voice || "Puck";

      // If dialogue is short (<= 3 lines and total text <= 350 chars), use multiSpeakerVoiceConfig directly
      const totalDialogueChars = validDialogue.reduce((acc: number, d: { text: string }) => acc + d.text.length, 0);

      if (validDialogue.length <= 3 && totalDialogueChars <= 350) {
        const dialogueScript = validDialogue
          .map((d: { speaker: string; text: string; persona?: string }) => {
            const personaHint = d.persona && personaDirections[d.persona] ? ` (${d.persona})` : "";
            return `${d.speaker}${personaHint}: ${d.text}`;
          })
          .join("\n");

        let prompt = `TTS the following realistic human conversation between ${speaker1} and ${speaker2} with natural back-and-forth rhythm, breathing pauses, and authentic emotional nuance:\n\n${dialogueScript}`;

        const response = await ai.models.generateContent({
          model: "gemini-3.1-flash-tts-preview",
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                  {
                    speaker: speaker1,
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: voice1 } },
                  },
                  {
                    speaker: speaker2,
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: voice2 } },
                  },
                ],
              },
            },
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const rawBase64 = part?.inlineData?.data;
        const returnedMime = part?.inlineData?.mimeType || "audio/pcm;rate=24000";

        if (!rawBase64) {
          throw new Error("Failed to generate dialogue audio from speech model.");
        }

        const pcmBuffer = Buffer.from(rawBase64, "base64");
        const sampleRate = returnedMime.includes("16000") ? 16000 : 24000;
        const wavBuffer = pcmToWav(pcmBuffer, sampleRate, 1, 16);
        const wavBase64 = wavBuffer.toString("base64");
        const durationSeconds = (pcmBuffer.length / (sampleRate * 2)).toFixed(2);

        return res.json({
          success: true,
          audioUrl: `data:audio/wav;base64,${wavBase64}`,
          duration: Number(durationSeconds),
          sampleRate,
          mode: "dialogue",
          speakers: [
            { speaker: speaker1, voice: voice1 },
            { speaker: speaker2, voice: voice2 },
          ],
        });
      }

      // For long dialogues with multiple turns, synthesize each line turn and seamlessly join with natural speaker turn pauses
      const pcmTurnBuffers: Buffer[] = [];
      let detectedSampleRate = 24000;

      for (let i = 0; i < validDialogue.length; i++) {
        const turn = validDialogue[i];
        const turnVoice = turn.voice || (turn.speaker === speaker1 ? voice1 : voice2);
        const turnPersona = turn.persona;
        const linePersonaStyle = turnPersona && personaDirections[turnPersona] ? personaDirections[turnPersona] : "";

        // If turn text is very long, chunk it
        const lineChunks = splitTextIntoChunks(turn.text, 260);
        for (let c = 0; c < lineChunks.length; c++) {
          const resTurn = await synthesizeSingleChunk(
            ai,
            lineChunks[c],
            turnVoice,
            emotionStyle,
            linePersonaStyle,
            customPrompt,
            language
          );
          detectedSampleRate = resTurn.sampleRate;
          pcmTurnBuffers.push(resTurn.pcmBuffer);
          if (c < lineChunks.length - 1) {
            pcmTurnBuffers.push(createSilenceBuffer(detectedSampleRate, 0.1));
          }
        }

        // Add 250ms conversation turn pause between different speaker turns
        if (i < validDialogue.length - 1) {
          pcmTurnBuffers.push(createSilenceBuffer(detectedSampleRate, 0.25));
        }
      }

      const mergedPcm = Buffer.concat(pcmTurnBuffers);
      const wavBuffer = pcmToWav(mergedPcm, detectedSampleRate, 1, 16);
      const wavBase64 = wavBuffer.toString("base64");
      const durationSeconds = (mergedPcm.length / (detectedSampleRate * 2)).toFixed(2);

      return res.json({
        success: true,
        audioUrl: `data:audio/wav;base64,${wavBase64}`,
        duration: Number(durationSeconds),
        sampleRate: detectedSampleRate,
        mode: "dialogue",
        speakers: [
          { speaker: speaker1, voice: voice1 },
          { speaker: speaker2, voice: voice2 },
        ],
        linesCount: validDialogue.length,
      });
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error("TTS generation error:", err);
    res.status(500).json({
      error: "Text-to-speech generation failed.",
      message: err.message || "An unexpected error occurred.",
    });
  }
});

// AI Text Polish & Natural Pacing Optimizer for Myanmar & English Text
app.post("/api/tts/optimize-script", async (req, res) => {
  try {
    const { text, targetTone = "natural", targetLang = "my" } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required." });
    }

    const ai = getAI();
    const prompt = `You are an expert human voice actor director and linguistic specialist for Text-to-Speech (TTS) natural speech synthesis in ${targetLang === "my" ? "Myanmar (Burmese)" : "English"}.
Enhance the following text so that when read by a neural TTS AI, it sounds 100% like a real human speaking naturally (${targetTone} style).
Guidelines:
1. Preserve the exact core meaning and language without altering facts.
2. Insert natural punctuation (commas, ellipses ..., periods, hyphens, and Myanmar '၊' and '။') where a real human would take natural breaths, micro-pauses, or change pitch emphasis.
3. Remove robotic phrasing, convert awkward numbers/symbols into smooth spoken words.
4. Output ONLY the optimized ready-to-speak text without markdown codeblocks, notes, or explanations.

Original Text:
${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

    const optimized = response.text?.trim() || text;
    res.json({ optimizedText: optimized });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Optimize script error:", err);
    res.status(500).json({ error: "Failed to optimize script.", message: err.message });
  }
});

// Vite Middleware for SPA development & Production Static Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TTS Studio Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
