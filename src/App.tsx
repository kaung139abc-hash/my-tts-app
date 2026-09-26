import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Upload, Download, Copy, Check, Play, Pause,
  Sparkles, RefreshCw, AlertCircle, DollarSign,
  Languages, Clock, Subtitles, Volume2, Video, CheckCircle2,
  ExternalLink, Layers, ArrowRight, Settings2, Sliders, UserCheck,
  FileAudio, Info, Mic, X, BookOpen, Wand2, Lightbulb
} from 'lucide-react';

interface VoiceItem {
  id: string;
  name: string;
  gender: string;
  lang: string;
  desc: string;
}

interface TTSResult {
  audioUrl: string;
  characterCount: number;
  voiceUsed: string;
}

interface ScriptResult {
  title: string;
  category: string;
  wordCount: number;
  estimatedMinutes: string;
  script: string;
}

export const App: React.FC = () => {
  // Main Navigation Modes: 'tts' (Text to Speech 10k chars) vs 'writer' (AI Story & Script Generator)
  const [mainMode, setMainMode] = useState<'tts' | 'writer'>('tts');

  // ----------------------------------------------------
  // Mode 1: Text-to-Speech (TTS) State
  // ----------------------------------------------------
  const [ttsText, setTtsText] = useState('');
  const [voices, setVoices] = useState<VoiceItem[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('my-MM-ThihaNeural');
  const [speechRate, setSpeechRate] = useState('+0%');
  const [speechPitch, setSpeechPitch] = useState('+0Hz');
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [ttsResult, setTtsResult] = useState<TTSResult | null>(null);
  const [ttsError, setTtsError] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // ----------------------------------------------------
  // Mode 2: AI Story & Video Script Generator State (Option 1)
  // ----------------------------------------------------
  const [scriptTopic, setScriptTopic] = useState('');
  const [scriptGenre, setScriptGenre] = useState('horror');
  const [scriptDuration, setScriptDuration] = useState('2-3min');
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  const [scriptError, setScriptError] = useState('');
  const [generatedScript, setGeneratedScript] = useState<ScriptResult | null>(null);

  // Common UI State
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Adsterra Direct Link provided by user: https://omg10.com/4/11846053
  const adsterraDirectLink = 'https://omg10.com/4/11846053';

  // In-App Ad Modal state (so user stays 100% inside this app and never thrown out to browser)
  const [showInAppAdModal, setShowInAppAdModal] = useState(false);

  const resultsSectionRef = useRef<HTMLDivElement | null>(null);

  // Load voices on mount
  useEffect(() => {
    fetch('/api/tts-voices')
      .then((res) => res.json())
      .then((data) => {
        if (data.voices) {
          setVoices(data.voices);
        }
      })
      .catch((err) => console.error('Failed to load voices:', err));
  }, []);

  const triggerMonetizationAd = () => {
    setShowInAppAdModal(true);
  };

  // ----------------------------------------------------
  // Text to Speech Execution (Up to 10,000 characters)
  // ----------------------------------------------------
  const handleGenerateTTS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ttsText.trim()) return;

    if (ttsText.length > 10000) {
      setTtsError(`စာလုံးရေ ${ttsText.length} လုံး ဖြစ်နေပါသည်။ တစ်ကြိမ်လျှင် ၁၀,၀၀၀ (10,000 characters) အထိသာ ထည့်သွင်းပေးပါခင်ဗျာ။`);
      return;
    }

    setIsTtsLoading(true);
    setTtsError('');
    setTtsResult(null);

    try {
      const res = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ttsText.trim(),
          voice: selectedVoice,
          rate: speechRate,
          pitch: speechPitch
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Text-to-speech generation failed');
      }

      setTtsResult(data);
      // Auto-scroll directly to player so user immediately sees and hears audio
      setTimeout(() => {
        resultsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    } catch (err: any) {
      setTtsError(err.message || 'အသံထွက်ထုတ်ယူရာတွင် ချွတ်ယွင်းချက် ဖြစ်ပေါ်သွားပါသည်။');
    } finally {
      setIsTtsLoading(false);
    }
  };

  // ----------------------------------------------------
  // AI Story & Video Script Generation (Option 1)
  // ----------------------------------------------------
  const handleGenerateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scriptTopic.trim()) return;

    setIsScriptLoading(true);
    setScriptError('');
    setGeneratedScript(null);
    triggerMonetizationAd();

    try {
      const res = await fetch('/api/generate-story-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: scriptTopic.trim(),
          genre: scriptGenre,
          duration: scriptDuration
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate script');
      }

      setGeneratedScript(data);
    } catch (err: any) {
      setScriptError(err.message || 'ဇာတ်ညွှန်းဖန်တီးရာတွင် ချွတ်ယွင်းချက်ဖြစ်ပေါ်သွားပါသည်။');
    } finally {
      setIsScriptLoading(false);
    }
  };

  // Transfer generated script directly to TTS Engine with one click!
  const sendScriptToTTS = (scriptContent: string) => {
    setTtsText(scriptContent);
    setMainMode('tts');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const downloadFile = (content: string, filename: string, mime: string) => {
    triggerMonetizationAd();
    const element = document.createElement('a');
    const file = new Blob([content], { type: mime });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const predefinedGenres = [
    { id: 'horror', label: 'သရဲ / ထိတ်လန့်ဖွယ် 👻', placeholder: 'ဥပမာ - ညသန်းခေါင် အဝေးပြေးလမ်းမပေါ်က ထူးဆန်းသော ကားကြုံခရီးသည်' },
    { id: 'motivation', label: 'စိတ်ခွန်အားဖြည့် 💪', placeholder: 'ဥပမာ - စိတ်ဓာတ်ကျနေချိန် ပြန်လည်ရုန်းထနိုင်မည့် စိတ်ခွန်အားပေး စကားများ' },
    { id: 'tech', label: 'နည်းပညာ / AI ဗဟုသုတ 💻', placeholder: 'ဥပမာ - အနာဂတ်တွင် လူသားများကို အံ့အားသင့်စေမည့် AI စနစ်သစ်များ' },
    { id: 'history', label: 'သမိုင်းကြောင်း / ထူးခြားဖြစ်ရပ်များ 🏛️', placeholder: 'ဥပမာ - ပျောက်ဆုံးသွားသော ရှေးဟောင်း ရွှေရောင်မြို့တော်ကြီး၏ လျှို့ဝှက်ချက်' },
    { id: 'fun-facts', label: 'စိတ်ဝင်စားဖွယ်ရာ ဗဟုသုတ 💡', placeholder: 'ဥပမာ - ကမ္ဘာပေါ်မှာ လူတွေမသိသေးတဲ့ အလွန်ထူးဆန်းသော တိရစ္ဆာန်များ' },
    { id: 'bedtime-story', label: 'ပုံပြင် / ဒဏ္ဍာရီ 🌙', placeholder: 'ဥပမာ - သစ်တောနက်ကြီးထဲက မှော်သစ်ပင်နှင့် ရိုးသားသော သစ်ခုတ်သမား' },
  ];

  return (
    <div className="min-h-screen bg-[#0d0f15] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#121520]/80 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base lg:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              VoiceMaster Studio
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                10k Chars • Real Human TTS • AI Scriptwriter
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              လူအစစ်အသံ Text-to-Speech (စာလုံးရေ ၁၀,၀၀၀) + YouTube/TikTok ဇာတ်လမ်းဇာတ်ညွှန်း ရေးဖွဲ့စနစ်
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Real Human Engine Active</span>
          </span>
        </div>
      </header>

      {/* In-App Native Banner (Inside the app - never opens external tab) */}
      <div className="w-full bg-[#111420] border-b border-white/5 py-2.5 px-4 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/60 to-slate-900 border border-indigo-500/20 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-black shrink-0">AD</span>
            <span className="text-xs text-slate-200 font-medium text-center sm:text-left">
              သင့်အတွက် အထူးအစီအစဉ်များနှင့် ပရိုမိုးရှင်းများကို App အတွင်း ကြည့်ရှုပါ
            </span>
          </div>
          <button
            onClick={() => setShowInAppAdModal(true)}
            className="px-3.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 transition-all active:scale-95"
          >
            ကြည့်ရှုမည်
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Navigation Tabs: Mode 1 (TTS 10k Chars) vs Mode 2 (AI Story & Script Generator) */}
        <div className="bg-[#151824] p-1.5 rounded-2xl border border-white/10 flex items-center gap-2 max-w-lg mx-auto w-full shadow-lg">
          <button
            onClick={() => setMainMode('tts')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mainMode === 'tts'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>လူအစစ်အသံ TTS (၁၀,၀၀၀ လုံး)</span>
          </button>

          <button
            onClick={() => setMainMode('writer')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mainMode === 'writer'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>AI ဇာတ်လမ်း/ဇာတ်ညွှန်း ရေးဖွဲ့စက်</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MODE 1: TEXT-TO-SPEECH (TTS) - 9 Human Voices, 10,000 Chars, SRT Sync */}
        {/* ========================================================================= */}
        {mainMode === 'tts' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Form Card */}
            <div className="bg-[#151926] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>လူအစစ်အသံ Text to Speech Engine</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    စက်ရုပ်အသံလုံးဝမပေါက်သော Neural Real Human Voices ဖြင့် စာလုံးရေ ၁၀,၀၀၀ အထိ အသံဖတ်ပေးပါမည်
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    {ttsText.length} / 10,000 လုံး
                  </span>
                </div>
              </div>

              <form onSubmit={handleGenerateTTS} className="space-y-5">
                {/* 1. Voice Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-indigo-400" />
                      <span>အသံအမျိုးအစား ရွေးချယ်ပါ (လူအစစ်အသံ ၉ မျိုး ရွေးနိုင်ပါသည်)</span>
                    </span>
                    <span className="text-[11px] text-emerald-400 font-normal">
                      ✓ စက်ရုပ်အသံလုံးဝမဟုတ်ပါ
                    </span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {voices.map((v) => {
                      const isSelected = selectedVoice === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => setSelectedVoice(v.id)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/40'
                              : 'bg-[#0e111a] border-white/10 hover:border-white/25 hover:bg-white/[0.02]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              {v.gender === 'Female' ? '👩' : '👨'} {v.name}
                            </span>
                            <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded">
                              {v.gender}
                            </span>
                          </div>
                          <span className="text-[10px] font-medium text-slate-400 block mb-1">
                            {v.lang}
                          </span>
                          <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
                            {v.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Text Input Area (Supports up to 10,000 characters) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <span>ဖတ်ပြစေလိုသော စာသားများ ရိုက်ထည့်ပါ (မြန်မာ သို့မဟုတ် အင်္ဂလိပ်)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setTtsText('မင်္ဂလာပါရှင်။ VoiceMaster Studio မှ ကြိုဆိုပါတယ်။ ကျွန်မတို့ စနစ်ဟာ စက်ရုပ်အသံလုံးဝ မဟုတ်ဘဲ လူသားစစ်စစ်ရဲ့ သဘာဝလေယူလေသိမ်းအတိုင်း အလွန်ချောမွေ့ကြည်လင်စွာ ဖတ်ကြားပေးနိုင်ပါတယ်။')}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-normal"
                    >
                      နမူနာစာသား စမ်းထည့်ရန်
                    </button>
                  </label>

                  <textarea
                    rows={8}
                    required
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    placeholder="ဒီနေရာတွင် ဖတ်ပြစေလိုသော စာများကို ရိုက်ထည့်ပါ သို့မဟုတ် ကူးယူထည့်သွင်းပါ (စာလုံးရေ ၁၀,၀၀၀ အထိ အပြည့်အစုံ ဖတ်ပြပေးပါမည်)..."
                    className="w-full bg-[#0d0f17] border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 leading-relaxed font-sans resize-y"
                  />
                </div>

                {/* 3. Speed & Pitch Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#0d0f17] p-3.5 rounded-xl border border-white/5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>အသံအမြန်နှုန်း (Speech Speed)</span>
                      </span>
                      <span className="text-indigo-400 font-mono font-bold">{speechRate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {['-20%', '-10%', '+0%', '+10%', '+20%'].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => setSpeechRate(rate)}
                          className={`flex-1 py-1 rounded text-[11px] font-bold transition-all ${
                            speechRate === rate
                              ? 'bg-indigo-600 text-white shadow'
                              : 'bg-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          {rate === '+0%' ? 'မူလ' : rate}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                        <span>အသံအနိမ့်အမြင့် (Pitch Tone)</span>
                      </span>
                      <span className="text-indigo-400 font-mono font-bold">{speechPitch}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {['-10Hz', '-5Hz', '+0Hz', '+5Hz', '+10Hz'].map((pitch) => (
                        <button
                          key={pitch}
                          type="button"
                          onClick={() => setSpeechPitch(pitch)}
                          className={`flex-1 py-1 rounded text-[11px] font-bold transition-all ${
                            speechPitch === pitch
                              ? 'bg-indigo-600 text-white shadow'
                              : 'bg-white/5 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          {pitch === '+0Hz' ? 'မူလ' : pitch}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Error Banner */}
                {ttsError && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{ttsError}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isTtsLoading || !ttsText.trim()}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {isTtsLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>လူအစစ်အသံ ထုတ်လုပ်နေပါသည် (စာသားအပြည့်အစုံ)...</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>လူအစစ်အသံဖြင့် အသံထွက်ပြောင်းမည် (MP3 အသံဖိုင် ရယူမည်)</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Results Player Section */}
            {ttsResult && (
              <div 
                ref={resultsSectionRef}
                className="bg-[#151926] border border-indigo-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in duration-300"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/20 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>အသံဖိုင် အပြည့်အစုံ အောင်မြင်စွာ ထွက်ရှိပါပြီ</span>
                    </div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{voices.find(v => v.id === ttsResult.voiceUsed)?.name || ttsResult.voiceUsed} ၏ အသံထွက်</span>
                      <span className="text-xs font-normal text-slate-400 font-mono">
                        ({ttsResult.characterCount} စာလုံးရေ အပြည့်)
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        triggerMonetizationAd();
                        const a = document.createElement('a');
                        a.href = ttsResult.audioUrl;
                        a.download = `VoiceMaster_${Date.now()}.mp3`;
                        a.click();
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download .MP3</span>
                    </button>
                  </div>
                </div>

                {/* Audio Player Container */}
                <div className="bg-[#0c0e14] p-4 rounded-xl border border-white/10 flex flex-col gap-3">
                  <audio
                    ref={audioPlayerRef}
                    src={ttsResult.audioUrl}
                    controls
                    className="w-full h-11"
                    onPlay={() => setIsPlayingAudio(true)}
                    onPause={() => setIsPlayingAudio(false)}
                    onEnded={() => setIsPlayingAudio(false)}
                  />
                  <p className="text-[11px] text-slate-400 text-center">
                    အသံဖိုင်ကို တိုက်ရိုက် နားထောင်နိုင်ပြီး Download .MP3 ခလုတ်ဖြင့် သိမ်းဆည်းနိုင်ပါသည်
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: AI STORY & VIDEO SCRIPT GENERATOR (Option 1 - 100% Reliable & Viral) */}
        {/* ========================================================================= */}
        {mainMode === 'writer' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Form */}
            <div className="bg-[#151926] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5">
              <div className="border-b border-white/10 pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-purple-400" />
                  <span>AI ဇာတ်လမ်းနှင့် ဗီဒီယို ဇာတ်ညွှန်း ရေးဖွဲ့စက် (Story & Script Generator)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  YouTube, TikTok, Facebook Creator များအတွက် ခေါင်းစဉ်တစ်ခု ပေးရုံဖြင့် ဆွဲဆောင်မှုအပြည့်ရှိသော မြန်မာဇာတ်ညွှန်းကို AI က ချက်ချင်း အစအဆုံး ရေးဖွဲ့ပေးပါမည်
                </p>
              </div>

              <form onSubmit={handleGenerateScript} className="space-y-5">
                {/* 1. Category / Genre Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <span>ဇာတ်လမ်း / ဗီဒီယို အမျိုးအစား ရွေးချယ်ပါ</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {predefinedGenres.map((g) => {
                      const isSel = scriptGenre === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setScriptGenre(g.id)}
                          className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                            isSel
                              ? 'bg-indigo-600/25 border-indigo-500 text-white ring-2 ring-indigo-500/30'
                              : 'bg-[#0d0f17] border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
                          }`}
                        >
                          {g.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Topic Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span>ဇာတ်လမ်း ခေါင်းစဉ် သို့မဟုတ် အကြောင်းအရာ ရိုက်ထည့်ပါ</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={scriptTopic}
                    onChange={(e) => setScriptTopic(e.target.value)}
                    placeholder={predefinedGenres.find(g => g.id === scriptGenre)?.placeholder || 'ဥပမာ - ညသန်းခေါင် ထူးဆန်းသော ဖြစ်ရပ်'}
                    className="w-full bg-[#0d0f17] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* 3. Duration Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-400" />
                    <span>ခန့်မှန်း ကြာချိန် ရွေးချယ်ပါ</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '1min', label: '၁ မိနစ်စာ (TikTok/Shorts)' },
                      { id: '2-3min', label: '၂ ~ ၃ မိနစ် (Standard)' },
                      { id: '5min', label: '၅ မိနစ်အရှည် (Long Story)' }
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setScriptDuration(d.id)}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                          scriptDuration === d.id
                            ? 'bg-purple-600 text-white border-purple-500 shadow'
                            : 'bg-[#0d0f17] border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Banner */}
                {scriptError && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{scriptError}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isScriptLoading || !scriptTopic.trim()}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-bold shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {isScriptLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>AI က စိတ်ဝင်စားဖွယ် ဇာတ်ညွှန်းကို ရေးဖွဲ့နေပါသည်...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>AI ဖြင့် ဇာတ်ညွှန်း ရေးဖွဲ့မည် (Generate Viral Script)</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Generated Script Results */}
            {generatedScript && (
              <div className="bg-[#151926] border border-purple-500/30 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 text-[11px] font-bold border border-purple-500/20 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>ဇာတ်ညွှန်း အောင်မြင်စွာ ရေးဖွဲ့ပြီးပါပြီ</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {generatedScript.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      ခန့်မှန်းကြာချိန် - {generatedScript.estimatedMinutes} • စာလုံးရေ - {generatedScript.script.length} လုံး
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* One-click Send to Human TTS */}
                    <button
                      onClick={() => sendScriptToTTS(generatedScript.script)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>လူအသံစစ်စစ်ဖြင့် အသံထွက်ပြောင်းမည် ➔</span>
                    </button>
                    <button
                      onClick={() => handleCopy(generatedScript.script, 'script')}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-white/10 active:scale-95"
                    >
                      {copiedType === 'script' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedType === 'script' ? 'ကူးယူပြီး' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Script Content */}
                <div className="bg-[#0c0e14] p-4 sm:p-5 rounded-2xl border border-white/10 max-h-96 overflow-y-auto leading-relaxed text-sm text-slate-200 whitespace-pre-line font-sans select-text">
                  {generatedScript.script}
                </div>

                <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl flex items-center justify-between text-xs text-indigo-300">
                  <span>💡 အကြံပြုချက် - အပေါ်ရှိ <b>"လူအသံစစ်စစ်ဖြင့် အသံထွက်ပြောင်းမည်"</b> ခလုတ်ကို နှိပ်လိုက်ပါက ဤဇာတ်ညွှန်းစာသား အပြည့်အစုံကို မြန်မာလူအသံစစ်စစ် (သီဟ သို့မဟုတ် နီလာ) ဖြင့် MP3 အသံဖိုင်အပြည့်အစုံ ချက်ချင်း ထုတ်ယူနိုင်ပါမည်။</span>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0c0e14] py-4 px-6 text-center text-xs text-slate-500">
        VoiceMaster Studio • 10k Chars Real Human TTS & AI Viral Scriptwriter
      </footer>

      {/* In-App Ad Popup Modal (User stays 100% inside the app!) */}
      {showInAppAdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121520] border border-white/15 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-3.5 bg-[#171a29] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-black">
                  SPONSORED
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  အထူးကြော်ငြာ ကမ်းလှမ်းချက်
                </span>
              </div>
              <button
                onClick={() => setShowInAppAdModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title="ပိတ်မည်"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* In-App Ad Content Container */}
            <div className="flex-1 bg-black min-h-[360px] sm:min-h-[420px] relative">
              <iframe
                src={adsterraDirectLink}
                title="Sponsor Offer"
                sandbox="allow-scripts allow-same-origin allow-forms"
                className="w-full h-full min-h-[360px] sm:min-h-[420px] border-none"
              />
            </div>

            <div className="p-3 bg-[#121520] border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>ကြော်ငြာကို App အတွင်း ကြည့်ရှုနေပါသည်</span>
              <button
                onClick={() => setShowInAppAdModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
              >
                ပိတ်မည် (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
