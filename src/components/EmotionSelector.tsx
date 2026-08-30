import React from "react";
import { EMOTIONS } from "../constants";
import { EmotionType } from "../types";
import {
  MessageCircle,
  Smile,
  BookOpen,
  Radio,
  Heart,
  Sparkles,
  Zap,
  Wind,
  Check,
} from "lucide-react";

interface EmotionSelectorProps {
  selectedEmotion: EmotionType;
  onSelectEmotion: (emotion: EmotionType) => void;
  lang: "my" | "en";
}

export const EmotionSelector: React.FC<EmotionSelectorProps> = ({
  selectedEmotion,
  onSelectEmotion,
  lang,
}) => {
  const getIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case "MessageCircle":
        return <MessageCircle className={className} />;
      case "Smile":
        return <Smile className={className} />;
      case "BookOpen":
        return <BookOpen className={className} />;
      case "Radio":
        return <Radio className={className} />;
      case "Heart":
        return <Heart className={className} />;
      case "Sparkles":
        return <Sparkles className={className} />;
      case "Zap":
        return <Zap className={className} />;
      case "Wind":
        return <Wind className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  return (
    <div className="bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-800 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
        <h2 className="text-sm sm:text-base font-semibold text-slate-100">
          {lang === "my" ? "၂။ လေသံ ခံစားချက် (Emotion & Style)" : "2. Tone & Emotional Style"}
        </h2>
      </div>
      <p className="text-xs text-slate-400 mb-3.5">
        {lang === "my"
          ? "100% လူသားအစစ်ကဲ့သို့ စိတ်ခံစားမှုအလိုက် အသံနေအထားကို သတ်မှတ်ပါ"
          : "Inject authentic human expressive nuances into the voice output"}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {EMOTIONS.map((emotion) => {
          const isSelected = selectedEmotion === emotion.id;
          return (
            <button
              key={emotion.id}
              type="button"
              id={`emotion-btn-${emotion.id}`}
              onClick={() => onSelectEmotion(emotion.id)}
              className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between relative ${
                isSelected
                  ? "bg-slate-800 border-amber-400 ring-1 ring-amber-400/50 shadow-md shadow-amber-500/10"
                  : "bg-slate-950/70 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isSelected ? "bg-amber-400/20 text-amber-300" : "bg-slate-900 text-slate-400"
                  }`}
                >
                  {getIcon(emotion.iconName, "w-4 h-4")}
                </div>
                {isSelected && (
                  <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-200">
                  {lang === "my" ? emotion.myanmarLabel : emotion.label}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                  {lang === "my" ? emotion.myanmarDescription : emotion.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
