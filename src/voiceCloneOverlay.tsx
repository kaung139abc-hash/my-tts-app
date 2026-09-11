import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Mic, X, Upload, Sparkles, Loader2, Download, KeyRound } from "lucide-react";

const ELEVEN_API = "https://api.elevenlabs.io/v1";
const VOICE_CACHE_KEY = "voice_clone_eleven_voice_id";

function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, data] = dataUrl.split(",", 2);
  const mime = meta.match(/data:([^;]+)/)?.[1] || "audio/wav";
  const bytes = atob(data || "");
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
  return new Blob([buffer], { type: mime });
}

function pcmToWavBlob(pcm: ArrayBuffer, sampleRate = 24000, channels = 1): Blob {
  const pcmBytes = new Uint8Array(pcm);
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  const write = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + pcmBytes.length, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, pcmBytes.length, true);
  return new Blob([header, pcmBytes], { type: "audio/wav" });
}

async function readError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data?.detail?.message || data?.detail || data?.message || data?.error || `Voice service error (${response.status})`;
  } catch {
    return `Voice service error (${response.status})`;
  }
}

async function createClonedVoice(apiKey: string, referenceData: string): Promise<string> {
  const form = new FormData();
  const referenceBlob = dataUrlToBlob(referenceData);
  form.append("name", `Kaung Clone ${Date.now()}`);
  form.append("description", "Authorized personal reference voice for Myanmar TTS.");
  form.append("files", referenceBlob, "reference.wav");

  const response = await fetch(`${ELEVEN_API}/voices/add`, {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: form,
  });

  if (!response.ok) throw new Error(await readError(response));
  const data = await response.json();
  if (!data?.voice_id) throw new Error("Voice cloning service did not return a voice ID.");
  localStorage.setItem(VOICE_CACHE_KEY, data.voice_id);
  return data.voice_id;
}

async function generateClonedSpeech(apiKey: string, voiceId: string, text: string): Promise<Blob> {
  const response = await fetch(`${ELEVEN_API}/text-to-speech/${encodeURIComponent(voiceId)}?output_format=pcm_24000`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/pcm",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.48,
        similarity_boost: 0.92,
        style: 0.28,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) throw new Error(await readError(response));
  return pcmToWavBlob(await response.arrayBuffer(), 24000, 1);
}

function VoiceCloneOverlay() {
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState<File | null>(null);
  const [referenceData, setReferenceData] = useState<string>("");
  const [text, setText] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState("");
  const [voiceId, setVoiceId] = useState("");

  useEffect(() => {
    const savedReference = localStorage.getItem("voice_clone_reference");
    const savedKey = localStorage.getItem("voice_clone_eleven_api_key");
    const savedVoice = localStorage.getItem(VOICE_CACHE_KEY);
    if (savedReference) setReferenceData(savedReference);
    if (savedKey) setApiKey(savedKey);
    if (savedVoice) setVoiceId(savedVoice);
  }, []);

  const readReference = (file: File) => {
    if (!/^audio\/(wav|mpeg|mp3|x-wav|wav)$/.test(file.type) && !/\.(wav|mp3)$/i.test(file.name)) {
      setError("WAV သို့မဟုတ် MP3 ဖိုင်သာ ထည့်ပါ။");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Reference voice ဖိုင်ကို 15MB အောက်ထားပါ။");
      return;
    }
    setError("");
    setReference(file);
    setVoiceId("");
    localStorage.removeItem(VOICE_CACHE_KEY);
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      setReferenceData(value);
      localStorage.setItem("voice_clone_reference", value);
    };
    reader.readAsDataURL(file);
  };

  const generate = async () => {
    if (!referenceData) return setError("Reference voice အရင်ထည့်ပါ။");
    if (!text.trim()) return setError("အသံထွက်မည့်စာသား အရင်ထည့်ပါ။");
    if (!apiKey.trim()) return setError("Voice Clone အတွက် ElevenLabs API key ထည့်ပါ။");

    setBusy(true);
    setError("");
    setAudioUrl("");
    localStorage.setItem("voice_clone_eleven_api_key", apiKey.trim());

    try {
      let activeVoiceId = voiceId;
      if (!activeVoiceId) {
        activeVoiceId = await createClonedVoice(apiKey.trim(), referenceData);
        setVoiceId(activeVoiceId);
      }

      let wav: Blob;
      try {
        wav = await generateClonedSpeech(apiKey.trim(), activeVoiceId, text.trim());
      } catch (firstError) {
        // A cached voice can become unavailable after it is deleted remotely; clone it again once.
        if (/not found|does not exist|invalid voice|voice_id/i.test(firstError instanceof Error ? firstError.message : "")) {
          localStorage.removeItem(VOICE_CACHE_KEY);
          const freshVoiceId = await createClonedVoice(apiKey.trim(), referenceData);
          setVoiceId(freshVoiceId);
          wav = await generateClonedSpeech(apiKey.trim(), freshVoiceId, text.trim());
        } else {
          throw firstError;
        }
      }

      const url = URL.createObjectURL(wav);
      setAudioUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Voice clone generation failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return <button onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-amber-400/40 bg-slate-900/95 px-4 py-3 text-sm font-bold text-amber-200 shadow-2xl backdrop-blur hover:bg-slate-800"><Mic size={18}/> Voice Clone</button>;
  }

  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-3 sm:items-center" onClick={() => setOpen(false)}>
    <div className="w-full max-w-xl rounded-3xl border border-amber-400/25 bg-slate-950 p-5 text-slate-100 shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-bold flex items-center gap-2"><Sparkles size={20}/> Voice Clone Studio</h3><p className="text-xs text-slate-400 mt-1">မင်းပိုင် / ခွင့်ပြုချက်ရှိသောအသံကိုသာ clone လုပ်ပါ။</p></div><button onClick={() => setOpen(false)}><X/></button></div>

      <div className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><KeyRound size={16}/> ElevenLabs API Key</div>
        <input value={apiKey} onChange={e => setApiKey(e.target.value)} type="password" placeholder="sk_..." className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-amber-400" />
        <div className="mt-1 text-[11px] text-slate-500">Key ကို ဒီ browser ရဲ့ localStorage ထဲမှာသာ သိမ်းထားပါတယ်။</div>
      </div>

      <label className="block rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-4 cursor-pointer"><input className="hidden" type="file" accept="audio/wav,audio/mpeg,audio/mp3,.wav,.mp3" onChange={e => e.target.files?.[0] && readReference(e.target.files[0])}/><div className="flex items-center gap-3"><Upload/><div><div className="font-semibold">Reference Voice</div><div className="text-xs text-slate-400">WAV / MP3 · 15MB အောက်</div></div></div>{reference && <div className="mt-2 text-xs text-amber-300">✓ {reference.name}</div>}{!reference && referenceData && <div className="mt-2 text-xs text-emerald-300">✓ သိမ်းထားသော reference voice ရှိသည်</div>}</label>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={5} placeholder="Clone အသံနဲ့ ပြောစေချင်တဲ့ မြန်မာစာ..." className="mt-3 w-full resize-none rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm outline-none focus:border-amber-400"/>
      {error && <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">{error}</div>}
      <button disabled={busy} onClick={generate} className="mt-3 w-full rounded-2xl bg-amber-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-50 flex items-center justify-center gap-2">{busy ? <><Loader2 className="animate-spin" size={18}/> Cloning + Generating...</> : <><Sparkles size={18}/> Generate Clone Voice</>}</button>
      {audioUrl && <div className="mt-4 rounded-2xl bg-slate-900 p-3"><audio controls src={audioUrl} className="w-full"/><a href={audioUrl} download="voice-clone.wav" className="mt-2 inline-flex items-center gap-2 text-xs text-amber-300"><Download size={14}/> WAV သိမ်းမယ်</a></div>}
    </div>
  </div>;
}

export function mountVoiceCloneOverlay() {
  if (document.getElementById("voice-clone-overlay-root")) return;
  const root = document.createElement("div");
  root.id = "voice-clone-overlay-root";
  document.body.appendChild(root);
  createRoot(root).render(<VoiceCloneOverlay />);
}
