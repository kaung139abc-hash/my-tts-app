import React, { useState } from "react";
import { PERSONAS, VOICES } from "../constants";
import { DialogueLine, PersonaId, VoiceName } from "../types";
import { Plus, Trash2, User, Users, Volume2, ArrowUpDown } from "lucide-react";

interface DialogueStudioProps {
  dialogue: DialogueLine[];
  setDialogue: (lines: DialogueLine[]) => void;
  lang: "my" | "en";
}

export const DialogueStudio: React.FC<DialogueStudioProps> = ({
  dialogue,
  setDialogue,
  lang,
}) => {
  const [speaker1Name, setSpeaker1Name] = useState("စကားပြောသူ ၁ (Speaker 1)");
  const [speaker1Voice, setSpeaker1Voice] = useState<VoiceName>("Kore");
  const [speaker1Persona, setSpeaker1Persona] = useState<PersonaId>("teen_girl");

  const [speaker2Name, setSpeaker2Name] = useState("စကားပြောသူ ၂ (Speaker 2)");
  const [speaker2Voice, setSpeaker2Voice] = useState<VoiceName>("Puck");
  const [speaker2Persona, setSpeaker2Persona] = useState<PersonaId>("teen_boy");

  const addLine = (speakerNum: 1 | 2) => {
    const newLine: DialogueLine = {
      id: Math.random().toString(36).substring(2, 9),
      speaker: speakerNum === 1 ? speaker1Name : speaker2Name,
      voice: speakerNum === 1 ? speaker1Voice : speaker2Voice,
      persona: speakerNum === 1 ? speaker1Persona : speaker2Persona,
      text: "",
    };
    setDialogue([...dialogue, newLine]);
  };

  const updateLineText = (id: string, text: string) => {
    setDialogue(dialogue.map((line) => (line.id === id ? { ...line, text } : line)));
  };

  const removeLine = (id: string) => {
    if (dialogue.length <= 1) return;
    setDialogue(dialogue.filter((line) => line.id !== id));
  };

  const toggleSpeaker = (id: string) => {
    setDialogue(
      dialogue.map((line) => {
        if (line.id === id) {
          const isSpeaker1 = line.speaker === speaker1Name;
          return {
            ...line,
            speaker: isSpeaker1 ? speaker2Name : speaker1Name,
            voice: isSpeaker1 ? speaker2Voice : speaker1Voice,
            persona: isSpeaker1 ? speaker2Persona : speaker1Persona,
          };
        }
        return line;
      })
    );
  };

  return (
    <div className="bg-slate-900/60 rounded-2xl p-4 sm:p-5 border border-slate-800 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm sm:text-base font-semibold text-slate-100">
              {lang === "my"
                ? "လူနှစ်ဦး အပြန်အလှန် စကားပြောခန်း (Multi-Speaker Dialogue)"
                : "Multi-Speaker Conversational Dialogue Studio"}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {lang === "my"
              ? "ကလေး၊ လူငယ်၊ လူကြီး၊ မိန်းမကြီး၊ Man ဇာတ်ကောင် ၂ ဦး၏ အပြန်အလှန် စကားပြောသံကို သဘာဝကျကျ ဖန်တီးပါ"
              : "Create realistic multi-speaker conversations with custom ages & personas"}
          </p>
        </div>
      </div>

      {/* Speaker Configuration Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800">
        {/* Speaker 1 Config */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              {lang === "my" ? "ပထမ ဇာတ်ကောင် (Speaker 1)" : "Character 1"}
            </span>
          </div>

          <input
            type="text"
            value={speaker1Name}
            onChange={(e) => setSpeaker1Name(e.target.value)}
            placeholder="Speaker 1 Name"
            className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-slate-200"
          />

          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={speaker1Persona}
              onChange={(e) => {
                const pId = e.target.value as PersonaId;
                setSpeaker1Persona(pId);
                const found = PERSONAS.find((p) => p.id === pId);
                if (found) setSpeaker1Voice(found.defaultVoice);
              }}
              className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-[11px] text-slate-200"
            >
              {PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>
                  {lang === "my" ? p.myanmarLabel : p.label}
                </option>
              ))}
            </select>

            <select
              value={speaker1Voice}
              onChange={(e) => setSpeaker1Voice(e.target.value as VoiceName)}
              className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-[11px] text-slate-200"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Speaker 2 Config */}
        <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              {lang === "my" ? "ဒုတိယ ဇာတ်ကောင် (Speaker 2)" : "Character 2"}
            </span>
          </div>

          <input
            type="text"
            value={speaker2Name}
            onChange={(e) => setSpeaker2Name(e.target.value)}
            placeholder="Speaker 2 Name"
            className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-slate-200"
          />

          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={speaker2Persona}
              onChange={(e) => {
                const pId = e.target.value as PersonaId;
                setSpeaker2Persona(pId);
                const found = PERSONAS.find((p) => p.id === pId);
                if (found) setSpeaker2Voice(found.defaultVoice);
              }}
              className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-[11px] text-slate-200"
            >
              {PERSONAS.map((p) => (
                <option key={p.id} value={p.id}>
                  {lang === "my" ? p.myanmarLabel : p.label}
                </option>
              ))}
            </select>

            <select
              value={speaker2Voice}
              onChange={(e) => setSpeaker2Voice(e.target.value as VoiceName)}
              className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-[11px] text-slate-200"
            >
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Dialogue Lines */}
      <div className="space-y-3 mb-4">
        {dialogue.map((line, idx) => {
          const isSpeaker1 = line.speaker === speaker1Name;
          return (
            <div
              key={line.id}
              className={`p-3 rounded-xl border transition-all ${
                isSpeaker1
                  ? "bg-rose-950/20 border-rose-500/30"
                  : "bg-blue-950/20 border-blue-500/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSpeaker1 ? "bg-rose-400" : "bg-blue-400"
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-200">
                    {line.speaker} ({line.voice})
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleSpeaker(line.id)}
                    className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700 cursor-pointer"
                    title={lang === "my" ? "စကားပြောသူ လဲလှယ်ရန်" : "Switch Speaker"}
                  >
                    <ArrowUpDown className="w-2.5 h-2.5" />
                    <span>{lang === "my" ? "လဲလှယ်ရန်" : "Switch"}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  disabled={dialogue.length <= 1}
                  className="text-slate-500 hover:text-rose-400 disabled:opacity-30 p-1 cursor-pointer"
                  title="Remove line"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <textarea
                value={line.text}
                onChange={(e) => updateLineText(line.id, e.target.value)}
                placeholder={
                  lang === "my"
                    ? `${line.speaker} ပြောမည့် စကားကို ရိုက်ထည့်ပါ...`
                    : `Type dialogue for ${line.speaker}...`
                }
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          );
        })}
      </div>

      {/* Add Line Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => addLine(1)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{speaker1Name} စာကြောင်းထည့်ရန်</span>
        </button>
        <button
          type="button"
          onClick={() => addLine(2)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-medium transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{speaker2Name} စာကြောင်းထည့်ရန်</span>
        </button>
      </div>
    </div>
  );
};
