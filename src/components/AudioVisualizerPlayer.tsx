import React, { useEffect, useRef, useState } from "react";
import { GeneratedAudio } from "../types";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Share2,
  Star,
  Sparkles,
  Check,
  FastForward,
  Rewind,
  Repeat,
} from "lucide-react";

interface AudioVisualizerPlayerProps {
  currentAudio: GeneratedAudio | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  lang: "my" | "en";
  onToggleFavorite?: (id: string) => void;
}

export const AudioVisualizerPlayer: React.FC<AudioVisualizerPlayerProps> = ({
  currentAudio,
  isPlaying,
  onTogglePlay,
  lang,
  onToggleFavorite,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sync audio element with current audio source
  useEffect(() => {
    if (!audioRef.current || !currentAudio?.audioUrl) return;

    audioRef.current.src = currentAudio.audioUrl;
    audioRef.current.load();
    setCurrentTime(0);

    const onLoaded = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration || currentAudio.duration || 0);
      }
    };

    audioRef.current.addEventListener("loadedmetadata", onLoaded);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("loadedmetadata", onLoaded);
      }
    };
  }, [currentAudio?.audioUrl]);

  // Handle Play / Pause state from prop
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current
        .play()
        .catch((e) => console.log("Playback interaction required:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Loop
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  // Canvas visualizer animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;
    const barCount = 48;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4; // idle baseline

        if (isPlaying) {
          // Dynamic harmonic motion simulation
          const freq1 = Math.sin(phase + i * 0.25) * 0.5 + 0.5;
          const freq2 = Math.cos(phase * 1.5 + i * 0.15) * 0.5 + 0.5;
          const amplitude = (freq1 * 0.6 + freq2 * 0.4) * (height * 0.85);
          barHeight = Math.max(4, amplitude);
        } else {
          // Subtle idle resting wave
          barHeight = 4 + Math.sin(i * 0.3) * 2;
        }

        const x = i * (barWidth + 2);
        const y = (height - barHeight) / 2;

        // Gradient for bars
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isPlaying) {
          gradient.addColorStop(0, "#f59e0b"); // amber-500
          gradient.addColorStop(0.5, "#fb923c"); // orange-400
          gradient.addColorStop(1, "#f43f5e"); // rose-500
        } else {
          gradient.addColorStop(0, "#334155"); // slate-700
          gradient.addColorStop(1, "#1e293b"); // slate-800
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      if (isPlaying) {
        phase += 0.08 * playbackRate;
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackRate]);

  // Time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const handleEnded = () => {
    if (!isLooping && isPlaying) {
      onTogglePlay();
    }
  };

  const skipSeconds = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(
        0,
        Math.min(duration, audioRef.current.currentTime + seconds)
      );
    }
  };

  const formatTime = (timeInSec: number) => {
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleDownload = () => {
    if (!currentAudio?.audioUrl) return;
    const a = document.createElement("a");
    a.href = currentAudio.audioUrl;
    const safeTitle = currentAudio.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 20);
    a.download = `TTS_${currentAudio.voice}_${safeTitle || "voice"}_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = () => {
    if (!currentAudio) return;
    navigator.clipboard.writeText(
      `[AI Neural Speech]\nVoice: ${currentAudio.voice}\nEmotion: ${currentAudio.emotion}\nScript: "${currentAudio.text}"`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!currentAudio) {
    return (
      <div className="bg-slate-900/60 rounded-2xl p-6 border border-slate-800 backdrop-blur-sm text-center flex flex-col items-center justify-center min-h-[220px]">
        <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mb-3">
          <Volume2 className="w-6 h-6 text-slate-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">
          {lang === "my" ? "အသံဖန်တီးရန် အဆင်သင့်ဖြစ်ပါပြီ" : "Ready to Generate Audio"}
        </h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          {lang === "my"
            ? "အထက်ပါ စာသားနှင့် အသံရွေးချယ်ပြီး 'လူသားအသံပြောင်းရန်' ခလုတ်ကို နှိပ်ပါ"
            : "Select your preferred voice and click 'Generate Human Speech' to hear studio audio"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 rounded-2xl p-5 border border-amber-500/30 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Glow background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="hidden"
      />

      {/* Header Info */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold shadow">
            {currentAudio.voice[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">{currentAudio.title}</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                {currentAudio.voice}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 capitalize">
                {currentAudio.emotion}
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 font-normal">
              "{currentAudio.text}"
            </p>
          </div>
        </div>

        {/* Action icons (favorite, share, download) */}
        <div className="flex items-center gap-1.5">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(currentAudio.id)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title={currentAudio.isFavorite ? "Remove favorite" : "Add to favorites"}
            >
              <Star
                className={`w-4 h-4 ${
                  currentAudio.isFavorite
                    ? "text-amber-400 fill-amber-400"
                    : "text-slate-400"
                }`}
              />
            </button>
          )}

          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title={lang === "my" ? "အသံအချက်အလက် ကူးယူရန်" : "Copy Audio Details"}
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Share2 className="w-4 h-4 text-slate-400" />
            )}
          </button>

          <button
            id="download-wav-btn"
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition cursor-pointer"
            title="Download Studio WAV Audio File"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Download .WAV</span>
          </button>
        </div>
      </div>

      {/* Audio Waveform Canvas */}
      <div className="w-full bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 mb-3 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={600}
          height={60}
          className="w-full h-14 rounded-lg block"
        />
      </div>

      {/* Scrubber Timeline */}
      <div className="space-y-1 mb-3">
        <div className="relative flex items-center">
          <input
            id="audio-timeline-slider"
            type="range"
            min={0}
            max={duration || 1}
            step={0.01}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 uppercase">24kHz PCM</span>
            <span>/</span>
            <span>{formatTime(duration || currentAudio.duration || 0)}</span>
          </div>
        </div>
      </div>

      {/* Main Playback Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
        {/* Left: Speed selector */}
        <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-1 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 font-semibold px-1">
            {lang === "my" ? "နှုန်း" : "Rate"}:
          </span>
          {[0.75, 1, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              onClick={() => setPlaybackRate(rate)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition cursor-pointer ${
                playbackRate === rate
                  ? "bg-amber-400 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Center: Play, Pause, Rewind, Fast-Forward */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => skipSeconds(-5)}
            className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Rewind 5s"
          >
            <Rewind className="w-4 h-4" />
          </button>

          <button
            id="audio-play-pause-btn"
            type="button"
            onClick={onTogglePlay}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 font-bold transition transform hover:scale-105 active:scale-95 cursor-pointer"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-slate-950 text-slate-950" />
            ) : (
              <Play className="w-6 h-6 fill-slate-950 text-slate-950 ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => skipSeconds(5)}
            className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Forward 5s"
          >
            <FastForward className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            className={`p-2 rounded-full transition cursor-pointer ${
              isLooping
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "bg-slate-800/80 hover:bg-slate-700 text-slate-400"
            }`}
            title="Loop audio"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Volume Slider */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className="text-slate-400 hover:text-white transition cursor-pointer"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-slate-300" />
            )}
          </button>
          <input
            id="audio-volume-slider"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              setIsMuted(false);
            }}
            className="w-16 sm:w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>
      </div>
    </div>
  );
};
