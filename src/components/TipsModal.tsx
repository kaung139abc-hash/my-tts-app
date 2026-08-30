import React from "react";
import { X, Sparkles, CheckCircle2, MessageSquare, Volume2, Mic } from "lucide-react";
import { PRO_TIPS_BURMESE } from "../constants";

interface TipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: "my" | "en";
}

export const TipsModal: React.FC<TipsModalProps> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              {lang === "my"
                ? "100% လူသားအစစ်အသံ ရရှိစေရန် လမ်းညွှန်ချက်များ"
                : "Tips for 100% Human-Like Voice Realism"}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === "my"
                ? "Gemini Neural TTS ဖြင့် အသံထွက် အကောင်းမွန်ဆုံး ဖန်တီးနည်း"
                : "Best practices for ultra-natural pronunciation and flow"}
            </p>
          </div>
        </div>

        {/* Body Tips */}
        <div className="space-y-3.5 text-xs text-slate-300">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h4 className="font-semibold text-amber-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {lang === "my" ? "၁။ ပုဒ်ဖြတ်ပုဒ်ရပ်များကို အသုံးပြုပါ" : "1. Use Natural Punctuation"}
            </h4>
            <p className="leading-relaxed text-slate-400 pl-5">
              {lang === "my"
                ? "မြန်မာစာတွင် '၊' (ပုဒ်ခွဲ) နှင့် '။' (ပုဒ်မ) တို့ကို သင့်လျော်စွာ ထည့်သွင်းပေးခြင်းဖြင့် စကားပြောသူ၏ သဘာဝ အသက်ရှူရပ်နားသံ (Breathing Pauses) ကို အတိအကျ ဖန်တီးပေးပါသည်။"
                : "Insert commas, periods, and ellipses (...) to define where real humans naturally take breaths and micro-pauses."}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h4 className="font-semibold text-amber-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {lang === "my"
                ? "၂။ 'AI အဖြတ်အတောက်ညှိရန် (Polish)' ကို နှိပ်ပါ"
                : "2. Use AI Natural Polish"}
            </h4>
            <p className="leading-relaxed text-slate-400 pl-5">
              {lang === "my"
                ? "စာသားရေးသားပြီးပါက 'AI အဖြတ်အတောက်ညှိရန်' ခလုတ်ကို နှိပ်လိုက်ရုံဖြင့် လူသားတစ်ဦး အသံနေအထားအတိုင်း စာသားကို အလိုအလျောက် ပြုပြင်ပေးမည်ဖြစ်ပါသည်။"
                : "The built-in AI Polish button automatically formats pacing, phrasing, and breathing markers for human cadence."}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h4 className="font-semibold text-amber-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {lang === "my"
                ? "၃။ ခံစားချက်နှင့် စိတ်ကြိုက် အသံလမ်းညွှန်ချက်များ"
                : "3. Emotion & Director Prompts"}
            </h4>
            <p className="leading-relaxed text-slate-400 pl-5">
              {lang === "my"
                ? "သတင်း၊ ပုံပြင်ပြော၊ ရွှင်လန်းဖော်ရွေ၊ တိုးတိုးလေးပြော စသည့် လေသံအမျိုးမျိုးကို ရွေးချယ်နိုင်ပြီး၊ 'Actor Prompt' တွင် 'နွေးထွေးစွာ ဖတ်ပေးပါ' ဟု ထည့်သွင်းနိုင်ပါသည်။"
                : "Choose from 8 distinct emotional styles or use custom director notes like 'Whisper softly with gentle breaths'."}
            </p>
          </div>
        </div>

        {/* Footer Button */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
          >
            {lang === "my" ? "နားလည်ပါပြီ (Close)" : "Got it"}
          </button>
        </div>
      </div>
    </div>
  );
};
