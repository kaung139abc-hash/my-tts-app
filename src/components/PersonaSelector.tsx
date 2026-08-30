import React, { useState } from "react";
import { PersonaId, PersonaOption } from "../types";
import { PERSONAS } from "../constants";
import {
  Baby,
  Smile,
  User,
  Sparkles,
  Heart,
  Shield,
  Layers,
  Crown,
} from "lucide-react";

interface PersonaSelectorProps {
  selectedPersona: PersonaId | "custom";
  onSelectPersona: (persona: PersonaId | "custom") => void;
  lang: "my" | "en";
}

export const PersonaSelector: React.FC<PersonaSelectorProps> = ({
  selectedPersona,
  onSelectPersona,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<"all" | "child" | "youth" | "adult" | "elder">("all");

  const categories = [
    { id: "all", label: "အားလုံး (All)", icon: Layers },
    { id: "child", label: "ကလေး (Kids & Boys)", icon: Baby },
    { id: "youth", label: "လူငယ် (Teens & Girls)", icon: Smile },
    { id: "adult", label: "လူလတ် / Man / မိန်းမကြီး", icon: User },
    { id: "elder", label: "လူကြီး / အဘိုး / အဘွား", icon: Crown },
  ];

  const filteredPersonas = PERSONAS.filter((p) => {
    if (activeTab === "all") return true;
    return p.category === activeTab;
  });

  const getPersonaIcon = (id: PersonaId) => {
    switch (id) {
      case "child_girl":
      case "child_boy":
        return <Baby className="w-4 h-4" />;
      case "teen_girl":
      case "teen_boy":
        return <Smile className="w-4 h-4" />;
      case "adult_woman":
        return <Heart className="w-4 h-4" />;
      case "adult_man":
        return <Shield className="w-4 h-4" />;
      case "elder_woman":
      case "elder_man":
        return <Crown className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-slate-900/70 rounded-2xl p-4 sm:p-5 border border-slate-800 backdrop-blur-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <span>{lang === "my" ? "အသံ ကာရိုက်တာ & အသက်အရွယ် (Persona)" : "Voice Persona & Age Profile"}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                {lang === "my" ? "ကလေး / လူငယ် / လူကြီး / Man / မိန်းမကြီး" : "All Ages & Genders"}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              {lang === "my"
                ? "အသက်အရွယ်နှင့် ကာရိုက်တာအလိုက် သဘာဝကျသော အသံအနိမ့်အမြင့်နှင့် ဟန်ပန်ကို ရွေးချယ်ပါ"
                : "Select the exact age group, gender, and vocal personality"}
            </p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                isActive
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-sm"
                  : "bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Persona Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {filteredPersonas.map((persona) => {
          const isSelected = selectedPersona === persona.id;
          return (
            <div
              key={persona.id}
              onClick={() => onSelectPersona(persona.id)}
              className={`group relative p-3 rounded-xl border transition-all duration-200 cursor-pointer text-left flex flex-col justify-between ${
                isSelected
                  ? "bg-gradient-to-b from-amber-500/15 to-slate-900 border-amber-400 shadow-md ring-1 ring-amber-400/40"
                  : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/90 hover:border-slate-700"
              }`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg bg-gradient-to-br ${persona.avatarBg} flex items-center justify-center text-white shadow-sm shrink-0`}
                  >
                    {getPersonaIcon(persona.id)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition">
                      {lang === "my" ? persona.myanmarLabel : persona.label}
                    </h4>
                    <span className="text-[10px] text-amber-400/90 font-medium">
                      {lang === "my" ? persona.myanmarAgeGroup : persona.ageGroup}
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium shrink-0 ${
                    isSelected
                      ? "bg-amber-400 text-slate-950 font-bold"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  {persona.gender === "female" ? "♀ Female" : "♂ Male"}
                </span>
              </div>

              {/* Description */}
              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                {lang === "my" ? persona.myanmarDescription : persona.description}
              </p>

              {/* Recommended Voice Badge */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
                <span>အသံအခြေခံ (Base):</span>
                <span className="font-mono text-amber-300/90 font-semibold">{persona.defaultVoice}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
