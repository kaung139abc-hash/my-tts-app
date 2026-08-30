import React, { useState } from "react";
import { GeneratedAudio } from "../types";
import {
  History,
  Play,
  Pause,
  Download,
  Trash2,
  Star,
  Search,
  Volume2,
  Clock,
  Sparkles,
} from "lucide-react";

interface HistoryDrawerProps {
  history: GeneratedAudio[];
  currentAudio: GeneratedAudio | null;
  isPlaying: boolean;
  onSelectAudio: (audio: GeneratedAudio) => void;
  onDeleteAudio: (id: string) => void;
  onClearAll: () => void;
  onToggleFavorite: (id: string) => void;
  lang: "my" | "en";
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  history,
  currentAudio,
  isPlaying,
  onSelectAudio,
  onDeleteAudio,
  onClearAll,
  onToggleFavorite,
  lang,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFavoriteOnly, setFilterFavoriteOnly] = useState(false);

  const filteredHistory = history.filter((item) => {
    if (filterFavoriteOnly && !item.isFavorite) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q) ||
        item.voice.toLowerCase().includes(q) ||
        item.emotion.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleDownload = (item: GeneratedAudio, e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = item.audioUrl;
    a.download = `TTS_${item.voice}_${item.id}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-800 backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm sm:text-base font-semibold text-slate-100">
            {lang === "my"
              ? `အသံသွင်း မှတ်တမ်း (${history.length})`
              : `Audio Library & History (${history.length})`}
          </h2>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-slate-400 hover:text-rose-400 transition cursor-pointer self-start sm:self-auto"
          >
            {lang === "my" ? "အားလုံး ဖျက်မည်" : "Clear All"}
          </button>
        )}
      </div>

      {/* Search & Favorites filter */}
      {history.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === "my" ? "မှတ်တမ်း ရှာဖွေရန်..." : "Search recordings..."}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterFavoriteOnly(!filterFavoriteOnly)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
              filterFavoriteOnly
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                filterFavoriteOnly ? "fill-amber-400 text-amber-400" : ""
              }`}
            />
            <span className="hidden sm:inline">
              {lang === "my" ? "အနှစ်သက်ဆုံး" : "Favorites"}
            </span>
          </button>
        </div>
      )}

      {/* History Items List */}
      {history.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-500">
          <Volume2 className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-slate-400" />
          {lang === "my"
            ? "ထုတ်လုပ်ထားသော အသံမှတ်တမ်း မရှိသေးပါ"
            : "No generated audio recordings yet."}
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500">
          {lang === "my" ? "ရှာဖွေမှု ရလဒ် မတွေ့ပါ" : "No matching recordings found."}
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {filteredHistory.map((item) => {
            const isCurrent = currentAudio?.id === item.id;
            const isCurrentPlaying = isCurrent && isPlaying;
            return (
              <div
                key={item.id}
                onClick={() => onSelectAudio(item)}
                className={`p-2.5 rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
                  isCurrent
                    ? "bg-slate-800/90 border-amber-400/70 shadow-sm"
                    : "bg-slate-950/60 border-slate-800/70 hover:bg-slate-900 hover:border-slate-700"
                }`}
              >
                {/* Left play icon + info */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      isCurrent
                        ? "bg-amber-400 text-slate-950"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {isCurrentPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-semibold text-slate-200 truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 font-medium shrink-0">
                        {item.voice}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                      {item.text}
                    </p>
                  </div>
                </div>

                {/* Right duration, favorite, download, delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-0.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {item.duration}s
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item.id);
                    }}
                    className="p-1 text-slate-400 hover:text-amber-400 transition cursor-pointer"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        item.isFavorite ? "text-amber-400 fill-amber-400" : ""
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDownload(item, e)}
                    className="p-1 text-slate-400 hover:text-amber-300 transition cursor-pointer"
                    title="Download .wav"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAudio(item.id);
                    }}
                    className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                    title="Delete recording"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
