import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { Client, handle_file } from "@gradio/client";
import { Mic, X, Upload, Sparkles, Loader2, Download, Cloud } from "lucide-react";

const VOXCPM_SPACE = "openbmb/VoxCPM-Demo";
const REFERENCE_CACHE_KEY = "voice_clone_reference";

function dataUrlToFile(dataUrl: string): File {
  const [meta, data] = dataUrl.split(",", 2);
  const mime = meta.match(/data:([^;]+)/)?.[1] || "audio/wav";
  const bytes = atob(data || "");
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
  const extension = mime.includes("mpeg") || mime.includes("mp3") ? "mp3" : "wav";
  return new File([buffer], `reference.${extension}`, { type: mime });
}

function outputToUrl(output: unknown): string {
  if (typeof output === "string") return output;
  if (output && typeof output === "object") {
    const value = output as { url?: unknown; path?: unknown; data?: unknown };
    if (typeof value.url === "string") return value.url;
    if (typeof value.path === "string" && /^https?:\/\//.test(value.path)) return value.path;
    if (typeof value.data === "string") return value.data;
  }
  return "";
}

function VoiceCloneOverlay() {
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState<File | null>(null);
  const [referenceData, setReferenceData] = useState<string>("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const savedReference = localStorage.getItem(REFERENCE_CACHE_KEY);
    if (savedReference) setReferenceData(savedReference);

    // Remove the old ElevenLabs credential/cache so this feature is genuinely keyless.
    localStorage.removeItem("voice_clone_eleven_api_key");
    localStorage.removeItem("voice_clone_eleven_voice_id");
  }, []);

  useEffect(() => () => {
    if (audioUrl.startsWith("blob:")) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const readReference = (file: File) => {
    if (!/^audio\/(wav|mpeg|mp3|x-wav)$/.test(file.type) && !/\.(wav|mp3)$/i.test(file.name)) {
      setError("WAV သို့မဟုတ် MP3 ဖိုင်သာ ထည့်ပါ။");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Reference voice ဖိုင်ကို 15MB အောက်ထားပါ။");
      return;
    }

    setError("");
    setReference(file);
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result || "");
      setReferenceData(value);
      localStorage.setItem(REFERENCE_CACHE_KEY, value);
    };
    reader.readAsDataURL(file);
  };

  const generate = async () => {
    if (!referenceData) return setError("Reference voice အရင်ထည့်ပါ။");
    if (!text.trim()) return setError("အသံထွက်မည့်စာသား အရင်ထည့်ပါ။");

    setBusy(true);
    setError("");
    if (audioUrl.startsWith("blob:")) URL.revokeObjectURL(audioUrl);
    setAudioUrl("");

    try {
      const client = await Client.connect(VOXCPM_SPACE);
      const referenceFile = reference || dataUrlToFile(referenceData);

      const result = await client.predict("/generate", {
        text_input: text.trim(),
        control_instruction: "",
        reference_wav_path_input: handle_file(referenceFile),
        use_prompt_text: false,
        prompt_text_input: "",
        cfg_value_input: 2,
        do_normalize: false,
        denoise: false,
      });

      const output = Array.isArray(result.data) ? result.data[0] : result.data;
      const remoteUrl = outputToUrl(output);
      if (!remoteUrl) {
        throw new Error("VoxCPM2 က audio ဖိုင်ပြန်မပေးနိုင်သေးပါ။ ခဏနေပြီး ပြန်စမ်းပါ။");
      }

      setAudioUrl(remoteUrl);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (/queue|busy|capacity|503|429|timeout/i.test(message)) {
        setError("Free VoxCPM2 server အခုလူများနေပါတယ်။ ခဏစောင့်ပြီး Generate ပြန်နှိပ်ပါ။");
      } else {
        setError(`Voice Clone Error: ${message}`);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return <button onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full border border-amber-400/40 bg-slate-900/95 px-4 py-3 text-sm font-bold text-amber-200 shadow-2xl backdrop-blur hover:bg-slate-800"><Mic size={18}/> Voice Clone</button>;
  }

  return <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-3 sm:items-center" onClick={() => setOpen(false)}>
    <div className="w-full max-w-xl rounded-3xl border border-amber-400/25 bg-slate-950 p-5 text-slate-100 shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2"><Sparkles size={20}/> Voice Clone Studio</h3>
          <p className="text-xs text-slate-400 mt-1">မင်းပိုင် / ခွင့်ပြုချက်ရှိသောအသံကိုသာ clone လုပ်ပါ။</p>
        </div>
        <button onClick={() => setOpen(false)}><X/></button>
      </div>

      <div className="mb-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300"><Cloud size={16}/> Free Keyless Voice Clone</div>
        <div className="mt-1 text-[11px] text-slate-400">VoxCPM2 public server ကိုသုံးပါတယ်။ API Key / ElevenLabs account မလိုပါ။ Burmese အပါအဝင် multilingual voice cloning ကို support လုပ်ပါတယ်။</div>
      </div>

      <label className="block rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-4 cursor-pointer">
        <input className="hidden" type="file" accept="audio/wav,audio/mpeg,audio/mp3,.wav,.mp3" onChange={e => e.target.files?.[0] && readReference(e.target.files[0])}/>
        <div className="flex items-center gap-3"><Upload/><div><div className="font-semibold">Reference Voice</div><div className="text-xs text-slate-400">WAV / MP3 · 15MB အောက်</div></div></div>
        {reference && <div className="mt-2 text-xs text-amber-300">✓ {reference.name}</div>}
        {!reference && referenceData && <div className="mt-2 text-xs text-emerald-300">✓ သိမ်းထားသော reference voice ရှိသည်</div>}
      </label>

      <textarea value={text} onChange={e => setText(e.target.value)} rows={5} placeholder="Clone အသံနဲ့ ပြောစေချင်တဲ့ မြန်မာစာ..." className="mt-3 w-full resize-none rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm outline-none focus:border-amber-400"/>
      {error && <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">{error}</div>}
      <button disabled={busy} onClick={generate} className="mt-3 w-full rounded-2xl bg-amber-400 px-4 py-3 font-bold text-slate-950 disabled:opacity-50 flex items-center justify-center gap-2">
        {busy ? <><Loader2 className="animate-spin" size={18}/> Cloning + Generating...</> : <><Sparkles size={18}/> Generate Clone Voice</>}
      </button>
      {audioUrl && <div className="mt-4 rounded-2xl bg-slate-900 p-3"><audio controls src={audioUrl} className="w-full"/><a href={audioUrl} download="voice-clone.wav" className="mt-2 inline-flex items-center gap-2 text-xs text-amber-300"><Download size={14}/> Audio သိမ်းမယ်</a></div>}
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
