import React, { useState } from 'react';
import {
  Video,
  Play,
  Sparkles,
  Check,
  Copy,
  Layers,
  Monitor,
  ShieldCheck,
  Target,
  ArrowRight,
  Radio,
  FileText,
  Zap,
} from 'lucide-react';

interface WalkthroughScene {
  id: number;
  title: string;
  duration: string;
  visualCue: string;
  spokenScript: string;
}

const WALKS_SCENES: WalkthroughScene[] = [
  {
    id: 1,
    title: 'Scene 1: The Problem & Hook',
    duration: '0:00 - 0:20',
    visualCue: 'Show TalentRadar.OS landing view with live 3D Geospatial Job Radar and Recharts CGI Curve.',
    spokenScript: 'Most senior engineers and AI researchers are leaving $100k+ on the table because they benchmark their offers against outdated 2023 data. TalentRadar.OS is the real-time 2026 market intelligence terminal designed to fix that.',
  },
  {
    id: 2,
    title: 'Scene 2: 3D Geospatial Job Radar',
    duration: '0:20 - 0:45',
    visualCue: 'Rotate the 3D WebGL globe, click on San Francisco or Zurich hub, and highlight active tech requisitions.',
    spokenScript: 'Our 3D orbital radar tracks active engineering vacancies across twelve global tech hubs in real time. You can filter by compensation bands, tech stack, and clearance requirements instantly.',
  },
  {
    id: 3,
    title: 'Scene 3: Career Growth Index (CGI) & Salary Analytics',
    duration: '0:45 - 1:10',
    visualCue: 'Navigate to Market Analytics tab, showcase the Career Growth Index Recharts line chart and seniority percentiles.',
    spokenScript: 'Here is our Career Growth Index tracking compounding salary velocity from 2020 through 2027 forecasts. With region-aware PPP normalization, talent anywhere gets fair, calibrated benchmarking.',
  },
  {
    id: 4,
    title: 'Scene 4: AI Buyer Prospect Finder & Closing',
    duration: '1:10 - 1:30',
    visualCue: 'Open the Growth Ad Hub and launch the AI Buyer Prospect Finder software.',
    spokenScript: 'Whether you are a professional accelerating your career or an operator scaling your SaaS, TalentRadar.OS gives you the exact telemetry and AI outreach tools needed to win. Try it live today.',
  },
];

export default function WalkthroughStudioTab() {
  const [activeSceneId, setActiveSceneId] = useState<number>(1);
  const [copiedScriptId, setCopiedScriptId] = useState<number | null>(null);

  const activeScene = WALKS_SCENES.find((s) => s.id === activeSceneId) || WALKS_SCENES[0];

  const handleCopyScript = (scene: WalkthroughScene) => {
    navigator.clipboard.writeText(`[${scene.title} - ${scene.duration}]\nVisual: ${scene.visualCue}\nScript: "${scene.spokenScript}"`);
    setCopiedScriptId(scene.id);
    setTimeout(() => setCopiedScriptId(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-mono">
      {/* Header Banner */}
      <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-6 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40 font-bold tracking-wider">
              INTERACTIVE EXPLAINER MODEL &amp; STUDIO
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#dce7f0] flex items-center gap-2">
            <Video className="w-6 h-6 text-[#38bdf8]" />
            WALKTHROUGH VIDEO &amp; DEMO SCRIPT STUDIO
          </h2>
          <p className="text-xs text-[#7a8b99]">
            Step-by-step visual explainer model and scene-by-scene demo script generator for pitching TalentRadar.OS.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleCopyScript(activeScene)}
            className="px-4 py-2.5 rounded-lg bg-[#38bdf8] hover:bg-[#2dd4bf] text-black font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.25)]"
          >
            {copiedScriptId === activeScene.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedScriptId === activeScene.id ? 'SCENE SCRIPT COPIED!' : 'COPY ACTIVE SCENE SCRIPT'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scene List */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold text-[#7a8b99] uppercase tracking-wider px-1">
            Demo Script Scenes ({WALKS_SCENES.length})
          </h3>

          <div className="space-y-2.5">
            {WALKS_SCENES.map((scene) => {
              const isSelected = activeSceneId === scene.id;
              return (
                <div
                  key={scene.id}
                  onClick={() => setActiveSceneId(scene.id)}
                  className={`panel p-4 rounded-xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#152330] border-[#38bdf8] text-white shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                      : 'bg-[#111a22] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-[#38bdf8] font-bold">SCENE #{scene.id}</span>
                    <span>{scene.duration}</span>
                  </div>
                  <div className="font-bold text-sm text-white">{scene.title}</div>
                  <div className="text-[11px] text-[#7a8b99] line-clamp-1 mt-1">{scene.visualCue}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Scene Studio Preview */}
        <div className="lg:col-span-8 space-y-4">
          <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2b36]">
              <div>
                <span className="text-[10px] text-[#38bdf8] font-bold uppercase">Active Walkthrough Scene</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{activeScene.title}</h3>
              </div>
              <span className="px-3 py-1 rounded bg-[#0a0f14] border border-[#1e2b36] text-xs font-bold text-[#22d3a5]">
                {activeScene.duration}
              </span>
            </div>

            {/* Visual Cue Box */}
            <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-xl p-4 space-y-2">
              <span className="text-[10px] text-[#7a8b99] font-bold flex items-center gap-1.5 uppercase">
                <Monitor className="w-3.5 h-3.5 text-[#38bdf8]" /> Screen / Visual Cue:
              </span>
              <p className="text-xs text-[#dce7f0] leading-relaxed">
                {activeScene.visualCue}
              </p>
            </div>

            {/* Spoken Script Box */}
            <div className="bg-[#0a0f14] border border-[#38bdf8]/30 rounded-xl p-4 space-y-2">
              <span className="text-[10px] text-[#38bdf8] font-bold flex items-center gap-1.5 uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" /> Spoken Demo Script:
              </span>
              <p className="text-xs text-white leading-relaxed italic">
                &ldquo;{activeScene.spokenScript}&rdquo;
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#7a8b99]">
                Ready for video recording, live pitch, or founder demo.
              </span>

              <button
                onClick={() => handleCopyScript(activeScene)}
                className="px-4 py-2 bg-[#38bdf8] hover:bg-[#2dd4bf] text-black font-bold text-xs rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow"
              >
                {copiedScriptId === activeScene.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedScriptId === activeScene.id ? 'Copied Script!' : 'Copy Script'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
