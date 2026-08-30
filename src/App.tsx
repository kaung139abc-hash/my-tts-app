import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { PersonaSelector } from "./components/PersonaSelector";
import { VoiceCardSelector } from "./components/VoiceCardSelector";
import { EmotionSelector } from "./components/EmotionSelector";
import { TextInputArea } from "./components/TextInputArea";
import { DialogueStudio } from "./components/DialogueStudio";
import { AudioVisualizerPlayer } from "./components/AudioVisualizerPlayer";
import { HistoryDrawer } from "./components/HistoryDrawer";
import { TipsModal } from "./components/TipsModal";
import { PERSONAS, PRESETS } from "./constants";
import { DialogueLine, EmotionType, GeneratedAudio, PersonaId, TextPreset, VoiceName } from "./types";
import {
  Sparkles,
  Volume2,
  Mic,
  Users,
  Loader2,
  AlertCircle,
  PlayCircle,
  HelpCircle,
} from "lucide-react";

export default function App() {
  const [lang, setLang] = useState<"my" | "en">("my");
  const [mode, setMode] = useState<"single" | "dialogue">("single");
  const [selectedPersona, setSelectedPersona] = useState<PersonaId>("child_girl");
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>("Kore");
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionType>("cheerful");
  const [text, setText] = useState<string>(
    "မင်္ဂလာပါရှင်။ ကလေး၊ လူငယ်၊ လူကြီး၊ မိန်းခလေး၊ Boy၊ မိန်းမကြီး၊ Man အကုန်လုံးအတွက် ၁၀၀ ရာခိုင်နှုန်း သဘာဝကျသော AI အသံထွက်စနစ်မှ ကြိုဆိုပါတယ်။"
  );
  const [customPrompt, setCustomPrompt] = useState<string>("");

  // Dialogue Mode State
  const [dialogue, setDialogue] = useState<DialogueLine[]>([
    {
      id: "line-1",
      speaker: "စကားပြောသူ ၁ (Speaker 1)",
      voice: "Kore",
      persona: "child_girl",
      text: "မင်္ဂလာပါ ဦးလေးရေ... သမီးတို့ကို ပုံပြင်ကောင်းကောင်းလေး တစ်ပုဒ်လောက် ပြောပြပါဦးနော်။",
    },
    {
      id: "line-2",
      speaker: "စကားပြောသူ ၂ (Speaker 2)",
      voice: "Charon",
      persona: "elder_man",
      text: "အေးကွယ်... မင်္ဂလာပါ ငါ့မြေးမလေးရေ၊ ဒီကနေ့တော့ ရှေးခေတ် မှော်တောအုပ်ကြီးအကြောင်း ပုံပြင်ပြောပြမယ်ကွယ်။",
    },
  ]);

  // Audio & History State
  const [currentAudio, setCurrentAudio] = useState<GeneratedAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedAudio[]>(() => {
    try {
      const saved = localStorage.getItem("tts_audio_history");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showTips, setShowTips] = useState<boolean>(false);

  // Save history to local storage
  useEffect(() => {
    try {
      localStorage.setItem("tts_audio_history", JSON.stringify(history));
    } catch {
      // Storage limit fallback
    }
  }, [history]);

  // Handle Persona Selection (auto-sync default voice and emotion)
  const handleSelectPersona = (personaId: PersonaId | "custom") => {
    if (personaId !== "custom") {
      setSelectedPersona(personaId);
      const found = PERSONAS.find((p) => p.id === personaId);
      if (found) {
        setSelectedVoice(found.defaultVoice);
        setSelectedEmotion(found.defaultEmotion);
      }
    }
  };

  // Apply a sample preset
  const handleApplyPreset = (preset: TextPreset) => {
    setText(preset.text);
    if (preset.recommendedPersona) {
      setSelectedPersona(preset.recommendedPersona);
    }
    setSelectedVoice(preset.recommendedVoice);
    setSelectedEmotion(preset.recommendedEmotion);
    setMode("single");
  };

  // AI Script Optimizer (Pacing & Breathing Marks)
  const handleOptimizeScript = async () => {
    if (!text.trim() || isOptimizing) return;
    setIsOptimizing(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/tts/optimize-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          targetTone: selectedEmotion,
          targetLang: lang,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to optimize script");
      }
      if (data.optimizedText) {
        setText(data.optimizedText);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || "Failed to optimize script.");
    } finally {
      setIsOptimizing(false);
    }
  };

  // Generate Neural Speech
  const handleGenerateSpeech = async () => {
    if (isGenerating) return;
    if (mode === "single" && !text.trim()) {
      setErrorMessage(
        lang === "my"
          ? "ကျေးဇူးပြု၍ အသံထွက်စေလိုသော စာသားကို ရိုက်ထည့်ပါ"
          : "Please enter text to synthesize."
      );
      return;
    }
    if (mode === "dialogue" && dialogue.some((d) => !d.text.trim())) {
      setErrorMessage(
        lang === "my"
          ? "ကျေးဇူးပြု၍ စကားပြောခန်း အားလုံးတွင် စာသားများ ဖြည့်စွက်ပါ"
          : "Please fill in text for all dialogue lines."
      );
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const payload =
        mode === "single"
          ? {
              text: text.trim(),
              voice: selectedVoice,
              persona: selectedPersona,
              emotion: selectedEmotion,
              customPrompt: customPrompt.trim() || undefined,
              mode: "single",
              language: lang,
            }
          : {
              dialogue,
              mode: "dialogue",
            };

      const res = await fetch("/api/tts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Speech synthesis failed");
      }

      const newAudioItem: GeneratedAudio = {
        id: Math.random().toString(36).substring(2, 9),
        title:
          mode === "single"
            ? text.trim().slice(0, 30) + (text.length > 30 ? "..." : "")
            : "Dialogue Conversation",
        text:
          mode === "single"
            ? text.trim()
            : dialogue.map((d) => `${d.speaker}: ${d.text}`).join(" | "),
        audioUrl: data.audioUrl,
        duration: data.duration || 5,
        timestamp: Date.now(),
        voice: selectedVoice,
        persona: selectedPersona,
        emotion: selectedEmotion,
        language: lang,
        customPrompt: customPrompt.trim() || undefined,
        mode,
        dialogue: mode === "dialogue" ? dialogue : undefined,
      };

      setCurrentAudio(newAudioItem);
      setHistory((prev) => [newAudioItem, ...prev.slice(0, 40)]);
      setIsPlaying(true);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Generate error:", error);
      setErrorMessage(
        error.message ||
          (lang === "my"
            ? "အသံဖန်တီးမှု မအောင်မြင်ပါ။ ကျေးဇူးပြု၍ ပြန်လည်ကြိုးစားကြည့်ပါ။"
            : "Speech generation failed. Please try again.")
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Preview Voice Sample
  const handlePreviewVoice = (voice: VoiceName) => {
    setSelectedVoice(voice);
    const sampleText =
      lang === "my"
        ? `မင်္ဂလာပါ၊ ကျွန်ုပ်သည် ${voice} ဖြစ်ပြီး သဘာဝကျသော လူသားအသံဖြင့် ပြောကြားပေးနိုင်ပါသည်။`
        : `Hello, I am ${voice}, speaking with high-fidelity 100% human-like voice quality.`;
    setText(sampleText);
  };

  // Toggle favorite in history
  const handleToggleFavorite = (id: string) => {
    setHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    );
    if (currentAudio && currentAudio.id === id) {
      setCurrentAudio({ ...currentAudio, isFavorite: !currentAudio.isFavorite });
    }
  };

  // Delete audio from history
  const handleDeleteAudio = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (currentAudio?.id === id) {
      setIsPlaying(false);
      setCurrentAudio(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Header */}
      <Header
        lang={lang}
        setLang={setLang}
        onOpenTips={() => setShowTips(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Banner with Mode Toggle & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/20 backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-400/30">
                Gemini Neural TTS
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-100">
                {lang === "my"
                  ? "ကလေး၊ လူငယ်၊ လူကြီး၊ မိန်းခလေး၊ Boy၊ မိန်းမကြီး၊ Man အသံစုံ ဖန်တီးမှု စတူဒီယို"
                  : "All-Ages & Genders Neural Speech Studio"}
              </h2>
            </div>
            <p className="text-xs text-slate-300/80 mt-1 max-w-2xl">
              {lang === "my"
                ? "ကလေးငယ် ချစ်စဖွယ်အသံမှစ၍ လူငယ် Boy/Girl၊ လူလတ်ပိုင်း Man၊ မိန်းမကြီး နှင့် သက်ကြီး အဘိုး/အဘွား အသံအထိ ၁၀၀% သဘာဝကျစွာ ပြောင်းလဲပေးနိုင်ပါသည်။"
                : "Generate lifelike speech for Little Kids, Boys, Girls, Young Adults, Mature Women, Men, and Grandparents."}
            </p>
          </div>

          {/* Mode Switch: Single Speaker vs Dialogue */}
          <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800 self-start sm:self-auto">
            <button
              id="mode-single-btn"
              onClick={() => setMode("single")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                mode === "single"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{lang === "my" ? "တစ်ဦးတည်း စကားပြော (Single)" : "Single Speaker"}</span>
            </button>
            <button
              id="mode-dialogue-btn"
              onClick={() => setMode("dialogue")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                mode === "dialogue"
                  ? "bg-amber-500 text-slate-950 shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{lang === "my" ? "နှစ်ဦး အပြန်အလှန် (Dialogue)" : "2-Person Dialogue"}</span>
            </button>
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 flex items-start gap-3 text-xs sm:text-sm animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
              <p className="text-xs text-rose-300/80 mt-0.5">
                {lang === "my"
                  ? "ကျေးဇူးပြု၍ စာသားကို စစ်ဆေးပြီး ပြန်လည် ကြိုးစားကြည့်ပါ။"
                  : "Please check the input text and try again."}
              </p>
            </div>
          </div>
        )}

        {/* Studio Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Main Workspace (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {mode === "single" ? (
              <>
                {/* 1. Persona & Age Profile Selector (ကလေး၊ လူငယ်၊ လူကြီး၊ မိန်းခလေး၊ Boy၊ မိန်းမကြီး၊ Man) */}
                <PersonaSelector
                  selectedPersona={selectedPersona}
                  onSelectPersona={handleSelectPersona}
                  lang={lang}
                />

                {/* 2. Voice Selector */}
                <VoiceCardSelector
                  selectedVoice={selectedVoice}
                  onSelectVoice={setSelectedVoice}
                  lang={lang}
                  onPreviewVoice={handlePreviewVoice}
                />

                {/* 3. Emotion Selector */}
                <EmotionSelector
                  selectedEmotion={selectedEmotion}
                  onSelectEmotion={setSelectedEmotion}
                  lang={lang}
                />

                {/* 4. Text Input Script Area */}
                <TextInputArea
                  text={text}
                  setText={setText}
                  customPrompt={customPrompt}
                  setCustomPrompt={setCustomPrompt}
                  onApplyPreset={handleApplyPreset}
                  lang={lang}
                  isOptimizing={isOptimizing}
                  onOptimizeScript={handleOptimizeScript}
                />
              </>
            ) : (
              /* Dialogue Mode Workspace */
              <DialogueStudio
                dialogue={dialogue}
                setDialogue={setDialogue}
                lang={lang}
              />
            )}

            {/* Main Generate Button */}
            <div className="pt-2">
              <button
                id="generate-human-speech-btn"
                type="button"
                onClick={handleGenerateSpeech}
                disabled={isGenerating}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all transform shadow-xl cursor-pointer ${
                  isGenerating
                    ? "bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99]"
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
                    <span>
                      {lang === "my"
                        ? "100% လူသားအသံ စတူဒီယိုတွင် ဖန်တီးနေပါသည်..."
                        : "Synthesizing 100% Human Neural Audio..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 fill-slate-950" />
                    <span>
                      {lang === "my"
                        ? "လူသားအသံပြောင်းရန် (Generate Human Speech)"
                        : "Generate 100% Human-Like Speech"}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Audio Player & Visualizer */}
            <AudioVisualizerPlayer
              currentAudio={currentAudio}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              lang={lang}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>

          {/* Right Sidebar: History & Quick Guide (4 cols) */}
          <div className="lg:col-span-4 space-y-5">
            {/* Audio History Library */}
            <HistoryDrawer
              history={history}
              currentAudio={currentAudio}
              isPlaying={isPlaying}
              onSelectAudio={(item) => {
                setCurrentAudio(item);
                setIsPlaying(true);
              }}
              onDeleteAudio={handleDeleteAudio}
              onClearAll={() => {
                setHistory([]);
                if (currentAudio) setCurrentAudio(null);
                setIsPlaying(false);
              }}
              onToggleFavorite={handleToggleFavorite}
              lang={lang}
            />

            {/* Quick Tips Box */}
            <div className="bg-slate-900/40 rounded-2xl p-4 border border-slate-800/80 text-xs text-slate-400">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {lang === "my" ? "အသံထွက် ပိုမိုကောင်းမွန်စေရန်" : "Realistic Audio Pro-Tips"}
                </span>
                <button
                  type="button"
                  onClick={() => setShowTips(true)}
                  className="text-[11px] text-amber-400 hover:underline cursor-pointer"
                >
                  {lang === "my" ? "အပြည့်အစုံ" : "View All"}
                </button>
              </div>
              <p className="leading-relaxed">
                {lang === "my"
                  ? "ကလေး၊ လူငယ်၊ လူကြီး၊ မိန်းမကြီး၊ Man စသည့် အသက်အရွယ်စုံ အသံများကို အထက်ပါ Persona မှ တိုက်ရိုက် ရွေးချယ်နိုင်ပါသည်။"
                  : "Pick any age & gender persona from Little Kids, Teens, Adult Men/Women to Elderly Grandparents."}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Tips Guidance Modal */}
      <TipsModal
        isOpen={showTips}
        onClose={() => setShowTips(false)}
        lang={lang}
      />
    </div>
  );
}
