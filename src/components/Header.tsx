import React from "react";
import { Mic, Sparkles, Volume2, Globe, HelpCircle } from "lucide-react";

interface HeaderProps {
  lang: "my" | "en";
  setLang: (lang: "my" | "en") => void;
  onOpenTips: () => void;
}

export const Header: React.FC<HeaderProps> = ({ lang, setLang, onOpenTips }) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-bold">
            <Mic className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-amber-200 bg-clip-text text-transparent">
                {lang === "my" ? "AI လူသားအသံပြောင်း TTS Studio" : "Human-Like AI Voice TTS Studio"}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Sparkles className="w-3 h-3 text-amber-400" />
                100% Neural Human Voice
              </span>
            </div>
            <p className="text-xs text-slate-400 font-normal">
              {lang === "my"
                ? "အဆင့်မြင့် သဘာဝကျသော မြန်မာနှင့် နိုင်ငံတကာ စကားပြော အသံသွင်းစနစ်"
                : "Ultra-realistic natural speech powered by Gemini 24kHz Audio"}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status Chip */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>24kHz Studio HD</span>
          </div>

          {/* Tips / Help Button */}
          <button
            id="tts-tips-btn"
            onClick={onOpenTips}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-medium transition cursor-pointer"
            title={lang === "my" ? "အသုံးပြုနည်း လမ်းညွှန်" : "Usage Tips"}
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">{lang === "my" ? "လမ်းညွှန်" : "Tips"}</span>
          </button>

          {/* Language Switch */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
            <button
              id="lang-my-btn"
              onClick={() => setLang("my")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                lang === "my"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              မြန်မာ
            </button>
            <button
              id="lang-en-btn"
              onClick={() => setLang("en")}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition cursor-pointer ${
                lang === "en"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
