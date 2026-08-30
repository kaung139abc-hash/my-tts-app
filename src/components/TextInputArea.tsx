import React, { useState, useRef } from "react";
import { PRESETS } from "../constants";
import { EmotionType, TextPreset, VoiceName } from "../types";
import {
  Sparkles,
  RotateCcw,
  ClipboardPaste,
  Copy,
  BookOpen,
  Volume2,
  Sliders,
  Check,
  Loader2,
  Wand2,
  Upload,
  Infinity,
  FileText,
  AlignLeft,
} from "lucide-react";

interface TextInputAreaProps {
  text: string;
  setText: (text: string) => void;
  customPrompt: string;
  setCustomPrompt: (prompt: string) => void;
  onApplyPreset: (preset: TextPreset) => void;
  lang: "my" | "en";
  isOptimizing: boolean;
  onOptimizeScript: () => void;
}

export const TextInputArea: React.FC<TextInputAreaProps> = ({
  text,
  setText,
  customPrompt,
  setCustomPrompt,
  onApplyPreset,
  lang,
  isOptimizing,
  onOptimizeScript,
}) => {
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const [showAdvancedPrompt, setShowAdvancedPrompt] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exact Text Metrics for Unlimited Lines & Multi-Paragraph Support
  const charCount = text.length;
  const lineCount = text.trim() ? text.split(/\r\n|\r|\n/).length : 0;
  const paragraphCount = text.trim() ? text.trim().split(/\n\s*\n/).filter(Boolean).length : 0;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  // Approximate reading duration calculation (~8-9 Myanmar characters per second)
  const totalSeconds = Math.max(1, Math.ceil(charCount / 9));
  const formatDuration = (secs: number) => {
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}m ${rem}s`;
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        setText(clipText);
      }
    } catch {
      // Fallback
    }
  };

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setText(content);
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = "";
  };

  return (
    <div className="bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-800 backdrop-blur-sm relative space-y-3">
      {/* Hidden file input for importing long scripts */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.srt,.text"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <h2 className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
            <span>{lang === "my" ? "၃။ အသံထွက်စေလိုသော စာသား (Script)" : "3. Speech Script"}</span>
          </h2>
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            <Infinity className="w-3 h-3" />
            <span>{lang === "my" ? "စာကြောင်းရေ အကန့်အသတ်မရှိ" : "Unlimited Lines"}</span>
          </span>
        </div>

        {/* Toolbar buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* File Upload / Import Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-medium transition cursor-pointer"
            title={lang === "my" ? "စာဖိုင် (.txt, .md) တင်သွင်းရန်" : "Import Text / Script File"}
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{lang === "my" ? "ဖိုင်ထည့်ရန်" : "Import File"}</span>
          </button>

          {/* Sample Presets Dropdown button */}
          <div className="relative">
            <button
              id="open-presets-btn"
              type="button"
              onClick={() => setShowPresetsMenu(!showPresetsMenu)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-medium transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>{lang === "my" ? "နမူနာ စာသားများ" : "Sample Scripts"}</span>
            </button>

            {/* Presets popover */}
            {showPresetsMenu && (
              <div className="absolute right-0 mt-2 w-72 sm:w-84 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto">
                <div className="px-2 py-1 border-b border-slate-800 text-[11px] font-semibold text-slate-400">
                  {lang === "my" ? "အသင့်သုံး နမူနာစာသား ရွေးချယ်ရန် (စာရှည်ပါဝင်)" : "Select Sample Preset"}
                </div>
                <div className="divide-y divide-slate-800/60">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        onApplyPreset(preset);
                        setShowPresetsMenu(false);
                      }}
                      className="w-full text-left p-2 hover:bg-slate-800/80 rounded-lg transition cursor-pointer group"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-200 group-hover:text-amber-300">
                        <span>{lang === "my" ? preset.myanmarTitle : preset.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {lang === "my" ? preset.myanmarCategory : preset.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-normal">
                        {preset.text}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Polish Button */}
          <button
            id="ai-polish-script-btn"
            type="button"
            onClick={onOptimizeScript}
            disabled={!text.trim() || isOptimizing}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
              !text.trim() || isOptimizing
                ? "bg-slate-800/40 text-slate-500 border border-slate-800 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 shadow-sm"
            }`}
            title={
              lang === "my"
                ? "မြန်မာစကား သဘာဝကျကျ အဖြတ်အတောက်၊ အသက်ရှူသံ အလိုအလျောက် ညှိယူရန်"
                : "Add natural pauses, breathing marks and human cadence with AI"
            }
          >
            {isOptimizing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>{lang === "my" ? "AI အဖြတ်အတောက်ညှိရန်" : "AI Natural Polish"}</span>
          </button>

          {/* Paste */}
          <button
            type="button"
            onClick={handlePaste}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title={lang === "my" ? "စာသား ကူးထည့်ရန်" : "Paste from clipboard"}
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
          </button>

          {/* Copy */}
          <button
            type="button"
            onClick={handleCopy}
            disabled={!text}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-40 transition cursor-pointer"
            title={lang === "my" ? "စာသား ကူးယူရန်" : "Copy text"}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={() => setText("")}
            disabled={!text}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 disabled:opacity-40 transition cursor-pointer"
            title={lang === "my" ? "အားလုံး ဖျက်ရန်" : "Clear text"}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Textarea with generous size & auto expansion */}
      <div className="relative">
        <textarea
          id="tts-text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            lang === "my"
              ? "ဤနေရာတွင် အသံထွက်စေလိုသော စာပိုဒ်၊ ပုံပြင်၊ သတင်း၊ စာအုပ်အခန်း သို့မဟုတ် ဆောင်းပါး စာကြောင်းရေ အကန့်အသတ်မရှိ ကူးထည့်၍ ဖတ်ခိုင်းနိုင်ပါသည်..."
              : "Type, paste, or import unlimited lines of text, articles, scripts, or stories for 100% human-grade speech synthesis..."
          }
          rows={7}
          className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 resize-y transition font-sans leading-relaxed min-h-[140px]"
          style={{ fontFamily: "'Padauk', 'Noto Sans Myanmar', 'Plus Jakarta Sans', sans-serif" }}
        />
      </div>

      {/* Footer stats with Line & Paragraph Breakdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/60 text-xs text-slate-400">
        <div className="flex items-center gap-2.5 sm:gap-3.5 flex-wrap">
          <span className="flex items-center gap-1 text-slate-300">
            <AlignLeft className="w-3 h-3 text-amber-400" />
            <span>{lang === "my" ? "စာကြောင်း" : "Lines"}:</span>
            <strong className="text-amber-400 font-semibold">{lineCount}</strong>
          </span>

          {paragraphCount > 1 && (
            <span className="flex items-center gap-1 text-slate-300">
              <span>{lang === "my" ? "စာပိုဒ်" : "Paras"}:</span>
              <strong className="text-slate-200 font-semibold">{paragraphCount}</strong>
            </span>
          )}

          <span>
            {lang === "my" ? "စကားလုံး" : "Words"}: <strong className="text-slate-200">{wordCount}</strong>
          </span>

          <span>
            {lang === "my" ? "အက္ခရာ" : "Chars"}: <strong className="text-slate-200">{charCount.toLocaleString()}</strong>
          </span>

          <span>
            {lang === "my" ? "ခန့်မှန်းကြာချိန်" : "Est. Audio"}:{" "}
            <strong className="text-emerald-400 font-semibold">{formatDuration(totalSeconds)}</strong>
          </span>
        </div>

        {/* Custom Director's Note Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvancedPrompt(!showAdvancedPrompt)}
          className="flex items-center gap-1 text-slate-400 hover:text-amber-300 font-medium transition cursor-pointer self-start sm:self-auto"
        >
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>
            {showAdvancedPrompt
              ? lang === "my"
                ? "အသံလမ်းညွှန် ပိတ်ရန်"
                : "Hide Actor Directive"
              : lang === "my"
                ? "စိတ်ကြိုက် အသံလမ်းညွှန် (Actor Prompt)"
                : "Voice Actor Directive (+)"}
          </span>
        </button>
      </div>

      {/* Advanced Voice Actor Prompt Input */}
      {showAdvancedPrompt && (
        <div className="mt-3 p-3 bg-slate-950/90 rounded-xl border border-amber-500/30">
          <label className="block text-xs font-semibold text-amber-300 mb-1">
            {lang === "my"
              ? "စိတ်ကြိုက် အသံသရုပ်ဆောင် လမ်းညွှန်ချက် (Director's Style Prompt)"
              : "Custom Human Voice Director Prompt"}
          </label>
          <p className="text-[11px] text-slate-400 mb-2">
            {lang === "my"
              ? "ဥပမာ - 'အသက်ရှူသံလေး အနည်းငယ်ထည့်၍ အလွန်နွေးထွေးသော အသံဖြင့် ဖြည်းညင်းစွာ ဖတ်ပေးပါ'"
              : "e.g. 'Speak with subtle gentle breathing, intimate micro-pauses, and deep emotional resonance'"}
          </p>
          <input
            id="custom-actor-prompt-input"
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder={
              lang === "my"
                ? "စိတ်ကြိုက် အသံလမ်းညွှန် ထည့်သွင်းရန်..."
                : "Enter custom voice directions..."
            }
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>
      )}
    </div>
  );
};
