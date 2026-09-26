import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, Upload, Download, Copy, Check, Play, Pause,
  Sparkles, RefreshCw, AlertCircle, DollarSign,
  Languages, Clock, Subtitles, Volume2, Video, CheckCircle2,
  ExternalLink, Layers, ArrowRight, Settings2, Sliders, UserCheck,
  FileAudio, Info, Mic, X, BookOpen, Wand2, Lightbulb, History, Trash2, RotateCcw, Music, Music2, Disc
} from 'lucide-react';

interface VoiceItem {
  id: string;
  name: string;
  gender: string;
  lang: string;
  desc: string;
}

interface BgmItem {
  id: string;
  name: string;
  category: string;
  volume?: number;
}

interface TTSResult {
  audioUrl: string;
  characterCount: number;
  voiceUsed: string;
  bgmUsed?: string;
}

interface ScriptResult {
  title: string;
  category: string;
  wordCount: number;
  estimatedMinutes: string;
  script: string;
}

interface HistoryItem {
  id: string;
  type: 'tts' | 'story';
  title: string;
  content: string;
  voiceName?: string;
  bgmName?: string;
  audioUrl?: string;
  characterCount: number;
  timestamp: number;
}

export const App: React.FC = () => {
  // Main Navigation Modes: 'tts' (Text to Speech 10k chars) vs 'writer' (AI Story & Script Generator) vs 'history' (Audio & Script Library)
  const [mainMode, setMainMode] = useState<'tts' | 'writer' | 'history'>('tts');

  // ----------------------------------------------------
  // Mode 1: Text-to-Speech (TTS) State
  // ----------------------------------------------------
  const [ttsText, setTtsText] = useState('');
  const [voices, setVoices] = useState<VoiceItem[]>([]);
  const [bgmTracks, setBgmTracks] = useState<BgmItem[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('my-MM-MinKyawDeep');
  const [selectedBgm, setSelectedBgm] = useState('none');
  const [bgmVolume, setBgmVolume] = useState(0.18);
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
  const [scriptDuration, setScriptDuration] = useState('5min');
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  const [scriptError, setScriptError] = useState('');
  const [generatedScript, setGeneratedScript] = useState<ScriptResult | null>(null);

  // ----------------------------------------------------
  // Mode 3: Audio & Story History Library State
  // ----------------------------------------------------
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('voicemaster_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save history to LocalStorage
  const saveToHistory = (item: Omit<HistoryItem, 'id' | 'timestamp'>) => {
    const newItem: HistoryItem = {
      ...item,
      id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now()
    };
    setHistoryItems((prev) => {
      const updated = [newItem, ...prev.slice(0, 49)]; // Keep up to 50 items
      try {
        localStorage.setItem('voicemaster_history', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const deleteHistoryItem = (id: string) => {
    setHistoryItems((prev) => {
      const updated = prev.filter(i => i.id !== id);
      try {
        localStorage.setItem('voicemaster_history', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const clearAllHistory = () => {
    if (window.confirm('သမိုင်းမှတ်တမ်း အားလုံးကို ဖျက်ပစ်ရန် သေချာပါသလားခင်ဗျာ?')) {
      setHistoryItems([]);
      try {
        localStorage.removeItem('voicemaster_history');
      } catch (_) {}
    }
  };

  // Common UI State
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Adsterra Direct Link provided by user: https://omg10.com/4/11846053
  const adsterraDirectLink = 'https://omg10.com/4/11846053';

  // In-App Ad Modal state (so user stays 100% inside this app and never thrown out to browser)
  const [showInAppAdModal, setShowInAppAdModal] = useState(false);
  const [adCountdown, setAdCountdown] = useState(20);

  const resultsSectionRef = useRef<HTMLDivElement | null>(null);

  // 20-Second Mandatory Ad Countdown Timer
  useEffect(() => {
    let timer: any;
    if (showInAppAdModal && adCountdown > 0) {
      timer = setInterval(() => {
        setAdCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [showInAppAdModal, adCountdown]);

  // Load voices and BGM tracks on mount
  useEffect(() => {
    fetch('/api/tts-voices')
      .then(async (res) => {
        const text = await res.text();
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      })
      .then((data) => {
        if (data && data.voices) {
          setVoices(data.voices);
        }
        if (data && data.bgmTracks) {
          setBgmTracks(data.bgmTracks);
        }
      })
      .catch((err) => console.error('Failed to load voices:', err));
  }, []);

  const triggerMonetizationAd = () => {
    setAdCountdown(20);
    setShowInAppAdModal(true);
  };

  const downloadAudioFile = (audioUrl: string, filename: string) => {
    triggerMonetizationAd();
    try {
      if (audioUrl.startsWith('data:')) {
        // Convert base64 data URL to Blob for 100% reliable direct browser download across all devices
        const arr = audioUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'audio/mp3';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(blobUrl);
        }, 1000);
      } else {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = audioUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
        }, 1000);
      }
    } catch (err) {
      console.error('Download error:', err);
      // Fallback
      window.open(audioUrl, '_blank');
    }
  };

  // ----------------------------------------------------
  // Text to Speech Execution (Unlimited characters + BGM Mixing)
  // ----------------------------------------------------
  const handleGenerateTTS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ttsText.trim()) return;

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
          pitch: speechPitch,
          bgm: selectedBgm,
          bgmVolume: bgmVolume
        })
      });

      const responseText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        throw new Error('ဆာဗာနှင့် ချိတ်ဆက်မှု အဆင်မပြေဖြစ်သွားပါသည်။ ခေတ္တစောင့်ပြီး ပြန်လည် ကြိုးစားပေးပါခင်ဗျာ။');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Text-to-speech generation failed');
      }

      setTtsResult(data);
      const voiceName = voices.find(v => v.id === selectedVoice)?.name || selectedVoice;
      const bgmName = bgmTracks.find(b => b.id === selectedBgm)?.name;

      // Automatically save to Audio History Library
      saveToHistory({
        type: 'tts',
        title: `${voiceName} ၏ အသံဖတ်ကြားချက်${selectedBgm !== 'none' ? ` (${bgmName})` : ''}`,
        content: ttsText.trim(),
        voiceName,
        bgmName,
        audioUrl: data.audioUrl,
        characterCount: data.characterCount
      });

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

      const responseText = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(responseText);
      } catch (jsonErr) {
        throw new Error('ဆာဗာနှင့် ချိတ်ဆက်မှု အဆင်မပြေဖြစ်သွားပါသည်။ ခေတ္တစောင့်ပြီး ပြန်လည် ကြိုးစားပေးပါခင်ဗျာ။');
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate script');
      }

      setGeneratedScript(data);

      // Automatically save generated story to History Library
      saveToHistory({
        type: 'story',
        title: data.title,
        content: data.script,
        characterCount: data.script.length
      });
    } catch (err: any) {
      setScriptError(err.message || 'ဇာတ်ညွှန်းဖန်တီးရာတွင် ချွတ်ယွင်းချက်ဖြစ်ပေါ်သွားပါသည်။');
    } finally {
      setIsScriptLoading(false);
    }
  };

  // Transfer generated script directly to TTS Engine with one click and auto-match natural BGM!
  const sendScriptToTTS = (scriptContent: string, genre?: string) => {
    setTtsText(scriptContent);
    // Auto-select matching natural BGM based on genre
    const targetGenre = genre || scriptGenre;
    if (targetGenre === 'horror') setSelectedBgm('horror');
    else if (targetGenre === 'motivation') setSelectedBgm('inspiring');
    else if (targetGenre === 'history' || targetGenre === 'tech') setSelectedBgm('mystery');
    else if (targetGenre === 'bedtime-story' || targetGenre === 'fun-facts') setSelectedBgm('calm');
    else setSelectedBgm('calm');

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
      <header className="border-b border-white/10 bg-[#121520]/90 backdrop-blur-md sticky top-0 z-50 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base lg:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              VoiceMaster Studio
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Unlimited TTS & Story Engine
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              လူအစစ်အသံ Text-to-Speech (စာလုံးရေ အကန့်အသတ်မရှိ) + YouTube/TikTok ဇာတ်လမ်းစက်
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct Header History Access Button */}
          <button
            onClick={() => setMainMode('history')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
              mainMode === 'history'
                ? 'bg-purple-600 text-white border-purple-500 ring-2 ring-purple-400/40 shadow-purple-600/30'
                : 'bg-[#1a1e2e] border-indigo-500/30 text-indigo-200 hover:bg-indigo-600/20 hover:border-indigo-400'
            }`}
          >
            <History className="w-4 h-4 text-purple-400" />
            <span>မှတ်တမ်း ({historyItems.length})</span>
            {historyItems.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            )}
          </button>
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
        {/* Navigation Tabs: Mode 1 (Unlimited TTS) vs Mode 2 (AI Story Generator) vs Mode 3 (Audio History Library) */}
        <div className="bg-[#151824] p-2 rounded-2xl border border-white/15 flex flex-col sm:flex-row items-center gap-2 max-w-2xl mx-auto w-full shadow-2xl shadow-black/50">
          <button
            onClick={() => setMainMode('tts')}
            className={`w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mainMode === 'tts'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/40 ring-2 ring-indigo-400/50'
                : 'text-slate-300 hover:text-white hover:bg-white/5 bg-[#0e111a] border border-white/5'
            }`}
          >
            <Volume2 className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>လူအစစ် TTS (Unlimited)</span>
          </button>

          <button
            onClick={() => setMainMode('writer')}
            className={`w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mainMode === 'writer'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-600/40 ring-2 ring-purple-400/50'
                : 'text-slate-300 hover:text-white hover:bg-white/5 bg-[#0e111a] border border-white/5'
            }`}
          >
            <Wand2 className="w-4 h-4 shrink-0 text-pink-400" />
            <span>AI ဇာတ်လမ်းစက်</span>
          </button>

          <button
            onClick={() => setMainMode('history')}
            className={`w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${
              mainMode === 'history'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/40 ring-2 ring-emerald-400/50'
                : 'text-emerald-300 hover:text-white hover:bg-emerald-500/10 bg-[#0e111a] border border-emerald-500/30'
            }`}
          >
            <History className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-extrabold">📂 သမိုင်းမှတ်တမ်း</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {historyItems.length} ခု
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MODE 1: TEXT-TO-SPEECH (TTS) - Unlimited Chars, 9 Human Voices            */}
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
                    စက်ရုပ်အသံလုံးဝမပေါက်သော Neural Real Human Voices ဖြင့် စာလုံးရေ အကန့်အသတ်မရှိ (Unlimited) အသံဖတ်ပေးပါမည်
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                    {ttsText.length} စာလုံး (Unlimited)
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

                {/* 3. Natural Background Music (BGM) Selector */}
                <div className="space-y-2 bg-[#0d0f17] p-4 rounded-2xl border border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-white/5">
                    <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Music2 className="w-4 h-4 text-purple-400" />
                      <span>သဘာဝကျသော နောက်ခံတေးဂီတ (Natural Background Music - BGM)</span>
                    </label>
                    <span className="text-[11px] text-purple-400 font-semibold">
                      ✓ စကားသံအောက်မှ သဘာဝကျကျ ရောစပ်ပေးမည်
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {bgmTracks.map((bgm) => {
                      const isSelected = selectedBgm === bgm.id;
                      return (
                        <button
                          key={bgm.id}
                          type="button"
                          onClick={() => setSelectedBgm(bgm.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-1 ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30 ring-2 ring-purple-400/40'
                              : 'bg-[#151926] border-white/10 text-slate-300 hover:text-white hover:border-white/20'
                          }`}
                        >
                          <span className="text-xs font-bold leading-snug">{bgm.name}</span>
                          <span className={`text-[10px] ${isSelected ? 'text-purple-200' : 'text-slate-500'}`}>
                            {bgm.id === 'none' ? 'မူလ စကားသံစစ်စစ်' : 'သဘာဝ Ambient Sound'}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {selectedBgm !== 'none' && (
                    <div className="pt-2 flex items-center justify-between gap-4 text-xs text-slate-400">
                      <span className="text-[11px] flex items-center gap-1">
                        <Disc className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                        <span>BGM အသံကျယ်အား: <b>{Math.round(bgmVolume * 100)}%</b> (လူအသံကို မဖုံးစေရန် အလွန်သဘာဝကျကျ ချိန်ညှိထားပါသည်)</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[0.12, 0.18, 0.25, 0.35].map((vol) => (
                          <button
                            key={vol}
                            type="button"
                            onClick={() => setBgmVolume(vol)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              bgmVolume === vol
                                ? 'bg-purple-600 text-white'
                                : 'bg-white/5 text-slate-400 hover:bg-white/10'
                            }`}
                          >
                            {vol === 0.12 ? 'တိုး' : vol === 0.18 ? 'ပုံမှန်' : vol === 0.25 ? 'အလယ်' : 'ကျယ်'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Speed & Pitch Controls */}
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
                    <h3 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                      <span>{voices.find(v => v.id === ttsResult.voiceUsed)?.name || ttsResult.voiceUsed} ၏ အသံထွက်</span>
                      <span className="text-xs font-normal text-slate-400 font-mono">
                        ({ttsResult.characterCount} စာလုံးရေ အပြည့်)
                      </span>
                      {selectedBgm !== 'none' && (
                        <span className="text-[11px] font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Music className="w-3 h-3 text-purple-400" />
                          <span>BGM: {bgmTracks.find(b => b.id === selectedBgm)?.name || selectedBgm}</span>
                        </span>
                      )}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => {
                        const vName = voices.find(v => v.id === ttsResult.voiceUsed)?.name || 'VoiceMaster';
                        downloadAudioFile(ttsResult.audioUrl, `${vName}_Audio_${Date.now()}.mp3`);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download .MP3 (တိုက်ရိုက်ဒေါင်းမည်)</span>
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
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                    <p className="text-[11px] text-slate-400">
                      ✓ ဤအသံဖိုင်ကို သမိုင်းမှတ်တမ်း (History) တွင် အလိုအလျောက် သိမ်းဆည်းပြီးဖြစ်ပါသည်
                    </p>
                    <button
                      onClick={() => setMainMode('history')}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 underline underline-offset-4"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>မှတ်တမ်းကြည့်ရှုမည် ➔</span>
                    </button>
                  </div>
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
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-400" />
                      <span>ဇာတ်လမ်း အရှည် ရွေးချယ်ပါ</span>
                    </span>
                    <span className="text-[11px] text-purple-400 font-semibold">
                      ✓ စာလုံးရေ ၇,၀၀၀ (၅ မိနစ်အပြည့်)
                    </span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: '5min', label: '၅ မိနစ်စာ (စာလုံးရေ ၇,၀၀၀ ခန့် - 7k Chars)', desc: 'ဝတ္ထုရှည် / YouTube ဗီဒီယို (အထူးအကြံပြု)' },
                      { id: '3min', label: '၃ မိနစ်စာ (စာလုံးရေ ၄,၀၀၀ ခန့်)', desc: 'ဆောင်းပါး / ဇာတ်လမ်းတို' }
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setScriptDuration(d.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          scriptDuration === d.id
                            ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-600/30 ring-2 ring-purple-400/40'
                            : 'bg-[#0d0f17] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                        }`}
                      >
                        <span className="block text-xs font-bold text-white mb-0.5">{d.label}</span>
                        <span className="block text-[10px] opacity-75">{d.desc}</span>
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

        {/* ========================================================================= */}
        {/* MODE 3: AUDIO & STORY HISTORY LIBRARY (Local Persistent Storage)           */}
        {/* ========================================================================= */}
        {mainMode === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-[#151926] border border-white/10 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-400" />
                    <span>အသံဖိုင်နှင့် ဇာတ်လမ်း သမိုင်းမှတ်တမ်းများ (History Library)</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    ယခင် ထုတ်လုပ်ထားသော အသံဖိုင်များနှင့် ဇာတ်လမ်းများကို ပြန်လည် နားဆင်/ဒေါင်းလုဒ် ရယူနိုင်ပါသည်
                  </p>
                </div>

                {historyItems.length > 0 && (
                  <button
                    onClick={clearAllHistory}
                    className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>မှတ်တမ်းအားလုံး ဖျက်မည်</span>
                  </button>
                )}
              </div>

              {historyItems.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                    <History className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-300">မှတ်တမ်း မရှိသေးပါ</p>
                    <p className="text-xs text-slate-500 max-w-xs">
                      လူအစစ်အသံ TTS သို့မဟုတ် AI ဇာတ်လမ်း ဖန်တီးလိုက်သည်နှင့် ဤနေရာတွင် အလိုအလျောက် သိမ်းဆည်းပေးပါမည်။
                    </p>
                  </div>
                  <button
                    onClick={() => setMainMode('tts')}
                    className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>TTS အသံ စတင်ထုတ်ယူမည်</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="bg-[#0e111a] border border-white/10 hover:border-indigo-500/30 rounded-xl p-4 transition-all flex flex-col gap-3 shadow-md"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.type === 'tts' 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}>
                            {item.type === 'tts' ? '🔊 TTS အသံဖိုင်' : '✍️ AI ဇာတ်လမ်း'}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate max-w-md">
                            {item.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 text-slate-400 text-[11px] self-end sm:self-auto">
                          <span>{item.characterCount} စာလုံး</span>
                          <span>•</span>
                          <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <button
                            onClick={() => deleteHistoryItem(item.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors ml-1"
                            title="ဖျက်မည်"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content Preview */}
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed font-sans bg-black/20 p-2.5 rounded-lg border border-white/5">
                        {item.content}
                      </p>

                      {/* Audio Player if TTS */}
                      {item.type === 'tts' && item.audioUrl && (
                        <div className="bg-[#08090e] p-2 rounded-lg border border-white/5 flex items-center gap-3">
                          <audio src={item.audioUrl} controls className="w-full h-8" />
                          <button
                            onClick={() => {
                              downloadAudioFile(item.audioUrl!, `${item.title}_${Date.now()}.mp3`);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 active:scale-95 transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>MP3</span>
                          </button>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-[11px] text-slate-500">
                          {item.voiceName ? `အသံရှင်: ${item.voiceName}` : 'AI Scriptwriter'}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              sendScriptToTTS(item.content);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/30 text-indigo-300 font-semibold text-[11px] flex items-center gap-1 active:scale-95"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>TTS ဖြင့် ပြန်လည်ထုတ်မည်</span>
                          </button>

                          <button
                            onClick={() => handleCopy(item.content, `hist_${item.id}`)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-[11px] flex items-center gap-1 border border-white/10 active:scale-95"
                          >
                            {copiedType === `hist_${item.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedType === `hist_${item.id}` ? 'ကူးပြီး' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0c0e14] py-4 px-6 text-center text-xs text-slate-500">
        VoiceMaster Studio • 10k Chars Real Human TTS & AI Viral Scriptwriter
      </footer>

      {/* In-App Ad Popup Modal (Mandatory 20-second viewing before closing) */}
      {showInAppAdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#121520] border border-white/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-3.5 bg-[#171a29] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-black">
                  SPONSORED
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  စပွန်ဆာ ကြော်ငြာ ကမ်းလှမ်းချက်
                </span>
              </div>
              
              {/* Top Countdown indicator */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-[11px] font-mono text-indigo-300 font-bold">
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{adCountdown > 0 ? `${adCountdown}s ကျန်` : 'ပိတ်နိုင်ပါပြီ'}</span>
              </div>
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

            <div className="p-3.5 bg-[#121520] border-t border-white/10 flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 text-[11px]">
                {adCountdown > 0 ? `ကျေးဇူးပြု၍ ${adCountdown} စက္ကန့် ကြည့်ရှုပေးပါခင်ဗျာ...` : 'ကြော်ငြာ ကြည့်ရှုပြီးပါပြီ'}
              </span>

              {adCountdown > 0 ? (
                <button
                  disabled
                  className="px-4 py-2 rounded-xl bg-slate-800/80 text-slate-400 font-bold text-xs flex items-center gap-2 cursor-not-allowed border border-white/5 opacity-70"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span>{adCountdown} စက္ကန့် စောင့်ပါ</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowInAppAdModal(false)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
                >
                  ပိတ်မည် (Close Ad) ✓
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
