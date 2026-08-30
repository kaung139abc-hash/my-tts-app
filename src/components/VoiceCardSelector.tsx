import React, { useState } from "react";
import { VOICES } from "../constants";
import { VoiceName } from "../types";
import { User, Volume2, Sparkles, Check, Play, Pause } from "lucide-react";

interface VoiceCardSelectorProps {
  selectedVoice: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  lang: "my" | "en";
  isPlayingPreview?: boolean;
  onPreviewVoice?: (voice: VoiceName) => void;
}

export const VoiceCardSelector: React.FC<VoiceCardSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  lang,
  isPlayingPreview = false,
  onPreviewVoice,
}) => {
  const [genderFilter, setGenderFilter] = useState<"all" | "female" | "male">("all");

  const filteredVoices = VOICES.filter((v) => {
    if (genderFilter === "all") return true;
    if (genderFilter === "female") return v.gender === "female";
    if (genderFilter === "male") return v.gender === "male";
    return true;
  });

  return (
    <div className="bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-800 backdrop-blur-sm">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <h2 className="text-sm sm:text-base font-semibold text-slate-100">
              {lang === "my" ? "၁။ AI လူသား အသံရွေးချယ်ရန်" : "1. Select AI Human Voice"}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === "my"
              ? "မိမိဖတ်ကြားလိုသော အကြောင်းအရာနှင့် ကိုက်ညီမည့် အသံပုံစံကို ရွေးချယ်ပါ"
              : "Choose an authentic human voice timbre suited for your script"}
          </p>
        </div>

        {/* Gender Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            id="filter-all-voices"
            onClick={() => setGenderFilter("all")}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
              genderFilter === "all"
                ? "bg-slate-800 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {lang === "my" ? "အားလုံး (၆)" : "All (6)"}
          </button>
          <button
            id="filter-female-voices"
            onClick={() => setGenderFilter("female")}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
              genderFilter === "female"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {lang === "my" ? "အမျိုးသမီး" : "Female"}
          </button>
          <button
            id="filter-male-voices"
            onClick={() => setGenderFilter("male")}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition cursor-pointer ${
              genderFilter === "male"
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {lang === "my" ? "အမျိုးသား" : "Male"}
          </button>
        </div>
      </div>

      {/* Voice Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredVoices.map((voice) => {
          const isSelected = selectedVoice === voice.id;
          return (
            <div
              key={voice.id}
              id={`voice-card-${voice.id.toLowerCase()}`}
              onClick={() => onSelectVoice(voice.id)}
              className={`relative group rounded-xl p-3.5 border transition-all duration-200 cursor-pointer text-left flex flex-col justify-between ${
                isSelected
                  ? "bg-slate-800/90 border-amber-400/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50"
                  : "bg-slate-950/70 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700"
              }`}
            >
              {/* Top Row: Avatar, Name & Tag */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-full bg-gradient-to-tr ${voice.avatarColor} flex items-center justify-center text-white shadow-md text-sm font-bold`}
                    >
                      {voice.name[0]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                        <span>{lang === "my" ? voice.myanmarName : voice.name}</span>
                        {isSelected && (
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-400 text-slate-950">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-amber-300/90 font-medium">
                        {lang === "my" ? voice.myanmarTone : voice.tone}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                      isSelected
                        ? "bg-amber-400/10 border-amber-400/30 text-amber-300"
                        : "bg-slate-900 border-slate-800 text-slate-400"
                    }`}
                  >
                    {voice.tag}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300/80 line-clamp-2 leading-relaxed">
                  {lang === "my" ? voice.myanmarDescription : voice.description}
                </p>
              </div>

              {/* Bottom bar indicator */}
              <div className="mt-3 pt-2 border-t border-slate-800/50 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 capitalize flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-500" />
                  {voice.gender}
                </span>

                {onPreviewVoice && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewVoice(voice.id);
                    }}
                    className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium hover:underline py-0.5 px-1.5 rounded transition"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{lang === "my" ? "နားထောင်ကြည့်ရန်" : "Test Voice"}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
