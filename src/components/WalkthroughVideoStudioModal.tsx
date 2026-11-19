import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Video,
  Film,
  Play,
  Pause,
  Square,
  Download,
  Volume2,
  VolumeX,
  Mic,
  Monitor,
  CheckCircle2,
  Copy,
  Sparkles,
  ExternalLink,
  Radio,
  Globe,
  Scale,
  BadgeDollarSign,
  Cpu,
  Layers,
  Maximize2,
  RotateCcw,
  X,
  FileText,
  Clock,
  Send,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  Captions,
  Subtitles,
} from 'lucide-react';

interface WalkthroughVideoStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  publishedUrl?: string;
  askingPrice?: number;
}

interface Scene {
  id: string;
  title: string;
  subtitle: string;
  durationSec: number;
  badge: string;
  script: string;
}

const SCENES: Scene[] = [
  {
    id: 'intro',
    title: 'TalentRadar.io: Global Geospatial Intelligence Platform',
    subtitle: 'Pre-Revenue SaaS Platform • $145,000 USD Full Software & IP Buyout',
    durationSec: 25,
    badge: 'EXECUTIVE OVERVIEW',
    script:
      'Welcome to the Acquire.com walkthrough of TalentRadar.io. This is a complete, pre-revenue SaaS platform tracking 4,402 live tech requisitions across 17 global tech hubs. Available for an unencumbered full software and IP buyout at $145,000 USD with zero technical debt.',
  },
  {
    id: 'geospatial',
    title: '3D Geospatial Engine & Secondary Tech Hubs',
    subtitle: 'Austin, Toronto, Bengaluru, Tel Aviv, Stockholm + Frontier Sectors',
    durationSec: 30,
    badge: '3D WEBGL ENGINE',
    script:
      'Our Three.js WebGL globe visualizes live hiring velocity across secondary tech hubs including Austin, Toronto, Bengaluru, Tel Aviv, and Stockholm. Includes dedicated telemetry for Commercial SpaceTech, Computational Genomics, and Next-Gen Energy Grid Optimization.',
  },
  {
    id: 'jobs-radar',
    title: 'Real-Time Job Telemetry & Token Highlighting',
    subtitle: '4,402+ Tracked Requisitions • Regex-Escaped Keyword Highlighting',
    durationSec: 30,
    badge: 'LIVE REQUISITION STREAM',
    script:
      'TalentRadar streams active job alerts with role demand indexing and regex-escaped token highlighting. Recruiters and engineering leaders benchmark salaries and pinpoint surging skillsets with sub-millisecond precision.',
  },
  {
    id: 'stack',
    title: 'Production Tech Stack & Multi-Platform Distribution',
    subtitle: 'React 18, TypeScript, Node.js Express, Three.js, PWA & Android TWA',
    durationSec: 25,
    badge: 'ENTERPRISE ARCHITECTURE',
    script:
      'Engineered with React 18, TypeScript, Tailwind CSS, Node.js Express, and Three.js. It features an offline PWA service worker and Android Google Play TWA package com.talentradar.app with zero compiler errors and modular architecture.',
  },
  {
    id: 'financials',
    title: 'Financial Operating P&L & Clean Escrow.com Transfer',
    subtitle: '$0 Revenue (Pre-Rev) • $28.35/mo Low Operating Costs • 98.2% Margin',
    durationSec: 25,
    badge: 'M&A CURATION METRICS',
    script:
      'Pre-revenue with verified operating expenses of only $28.35 per month across Cloud Run, Cloudflare, and Gemini API tokens. 100% sole founder IP ownership, with a turnkey closing structure via Escrow.com with a 10% inspection deposit.',
  },
];

const TOTAL_DURATION_SEC = SCENES.reduce((acc, s) => acc + s.durationSec, 0); // 135s (2m 15s)

export interface SubtitleCue {
  id: number;
  sceneId: string;
  sceneBadge: string;
  startSec: number;
  endSec: number;
  text: string;
}

function buildSubtitleCues(scenes: Scene[]): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  let cursor = 0;
  let cueId = 1;

  for (const scene of scenes) {
    // Split script into natural sentence/clause chunks (~8-16 words each)
    const sentences = scene.script
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const chunks: string[] = [];
    for (const sentence of sentences) {
      const words = sentence.split(/\s+/);
      if (words.length <= 15) {
        chunks.push(sentence);
      } else {
        // Split long sentence cleanly at a comma or midpoint
        const mid = Math.ceil(words.length / 2);
        let splitIdx = mid;
        for (let i = Math.max(4, mid - 4); i <= Math.min(words.length - 4, mid + 4); i++) {
          if (words[i - 1].endsWith(',')) {
            splitIdx = i;
            break;
          }
        }
        chunks.push(words.slice(0, splitIdx).join(' '));
        chunks.push(words.slice(splitIdx).join(' '));
      }
    }

    const totalWords = chunks.reduce((sum, c) => sum + c.split(/\s+/).length, 0) || 1;
    let sceneElapsed = 0;

    chunks.forEach((chunkText, idx) => {
      const chunkWords = chunkText.split(/\s+/).length;
      const isLast = idx === chunks.length - 1;
      const chunkDuration = isLast
        ? Number((scene.durationSec - sceneElapsed).toFixed(2))
        : Number(((chunkWords / totalWords) * scene.durationSec).toFixed(2));

      const startSec = Number((cursor + sceneElapsed).toFixed(2));
      const endSec = Number((startSec + chunkDuration).toFixed(2));

      cues.push({
        id: cueId++,
        sceneId: scene.id,
        sceneBadge: scene.badge,
        startSec,
        endSec,
        text: chunkText,
      });

      sceneElapsed += chunkDuration;
    });

    cursor += scene.durationSec;
  }

  return cues;
}

function formatSubtitleTimestamp(secs: number, separator: ',' | '.' = ','): string {
  const clamped = Math.max(0, secs);
  const hours = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const wholeSecs = Math.floor(clamped % 60);
  const ms = Math.round((clamped - Math.floor(clamped)) * 1000);
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const pad3 = (n: number) => String(n).padStart(3, '0');
  return `${pad2(hours)}:${pad2(mins)}:${pad2(wholeSecs)}${separator}${pad3(ms)}`;
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 3);
}

export default function WalkthroughVideoStudioModal({
  isOpen,
  onClose,
  publishedUrl = 'https://ais-dev-keikksd2dcsi4qe6bzstuj-50566079524.europe-west2.run.app',
  askingPrice = 145000,
}: WalkthroughVideoStudioModalProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'screen-recorder' | 'curation-dossier'>('video');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isVoiceoverEnabled, setIsVoiceoverEnabled] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [subtitleStyle, setSubtitleStyle] = useState<'broadcast' | 'cinema'>('broadcast');
  const [subtitleSize, setSubtitleSize] = useState<'md' | 'lg'>('lg');
  const [subtitleCues, setSubtitleCues] = useState<SubtitleCue[]>(() => buildSubtitleCues(SCENES));
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlobUrl, setRecordedBlobUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Screen recorder states
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const [screenRecordedUrl, setScreenRecordedUrl] = useState<string | null>(null);
  const [screenRecordSeconds, setScreenRecordSeconds] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const screenRecorderRef = useRef<MediaRecorder | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  // Determine current scene
  let accumulated = 0;
  let activeSceneIndex = 0;
  for (let i = 0; i < SCENES.length; i++) {
    if (currentTimeSec >= accumulated && currentTimeSec < accumulated + SCENES[i].durationSec) {
      activeSceneIndex = i;
      break;
    }
    accumulated += SCENES[i].durationSec;
    if (i === SCENES.length - 1 && currentTimeSec >= accumulated) {
      activeSceneIndex = SCENES.length - 1;
    }
  }
  const currentScene = SCENES[activeSceneIndex];
  const activeSubtitleCue =
    subtitleCues.find((c) => currentTimeSec >= c.startSec && currentTimeSec < c.endSec) ||
    subtitleCues[subtitleCues.length - 1];

  // Speech synthesis narrator
  const speakCurrentScene = useCallback((text: string) => {
    if (!isVoiceoverEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (_) {}
  }, [isVoiceoverEnabled]);

  // Audio chime tone generator
  const playChimeTone = useCallback((freq = 520) => {
    if (isAudioMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
        audioDestRef.current = audioCtxRef.current.createMediaStreamDestination();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      if (audioDestRef.current) {
        gain.connect(audioDestRef.current);
      }

      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    } catch (_) {}
  }, [isAudioMuted]);

  // Canvas Drawing Routine (1280x720 HD)
  const drawFrame = useCallback((timeSec: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // 1. Dark Futuristic Studio Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#090d12');
    bgGrad.addColorStop(0.5, '#0d151e');
    bgGrad.addColorStop(1, '#080c10');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Animated Grid Lines
    ctx.strokeStyle = 'rgba(34, 211, 165, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    const gridOffset = (timeSec * 20) % gridSize;
    for (let x = -gridSize; x < width + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x + gridOffset, 0);
      ctx.lineTo(x + gridOffset, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Top Cyber Header Bar
    ctx.fillStyle = 'rgba(17, 26, 34, 0.9)';
    ctx.fillRect(0, 0, width, 60);
    ctx.strokeStyle = '#1e2b36';
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.lineTo(width, 60);
    ctx.stroke();

    // Top Brand Text
    ctx.fillStyle = '#dce7f0';
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillText('TALENT_RADAR.OS', 30, 38);

    ctx.fillStyle = '#22d3a5';
    ctx.font = '14px "JetBrains Mono", monospace';
    ctx.fillText('// ACQUIRE.COM CURATION WALKTHROUGH', 220, 38);

    // Top Right Status Indicators
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px "JetBrains Mono", monospace';
    ctx.fillText(`ASKING: $${askingPrice.toLocaleString()} USD`, width - 360, 38);

    ctx.fillStyle = '#22d3a5';
    ctx.fillText('PRE-REV / 100% IP SALE', width - 180, 38);

    // 4. Scene Contents Rendering
    const sceneIdx = Math.min(
      Math.floor((timeSec / TOTAL_DURATION_SEC) * SCENES.length),
      SCENES.length - 1
    );
    const scene = SCENES[sceneIdx] || SCENES[0];

    // Scene Badge
    ctx.fillStyle = 'rgba(34, 211, 165, 0.15)';
    ctx.strokeStyle = 'rgba(34, 211, 165, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(30, 85, 220, 30);
    ctx.fillRect(30, 85, 220, 30);

    ctx.fillStyle = '#22d3a5';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillText(`SCENE ${sceneIdx + 1}/5: ${scene.badge}`, 42, 105);

    // Scene Main Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "JetBrains Mono", sans-serif';
    ctx.fillText(scene.title, 30, 155);

    // Scene Subtitle
    ctx.fillStyle = '#94a3b8';
    ctx.font = '17px "JetBrains Mono", monospace';
    ctx.fillText(scene.subtitle, 30, 185);

    // Visual Graphics per Scene
    if (sceneIdx === 0) {
      // SCENE 1: EXECUTIVE OVERVIEW HUD
      const cardX = 30;
      const cardY = 220;
      const cardW = 580;
      const cardH = 340;

      // Card 1: Key Investment Highlights
      ctx.fillStyle = 'rgba(17, 26, 34, 0.85)';
      ctx.strokeStyle = '#22d3a5';
      ctx.strokeRect(cardX, cardY, cardW, cardH);
      ctx.fillRect(cardX, cardY, cardW, cardH);

      ctx.fillStyle = '#22d3a5';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillText('★ EXECUTIVE TRANSACTION HIGHLIGHTS', cardX + 24, cardY + 36);

      const items = [
        '• Model: 100% Full Software & Intellectual Property Buyout',
        '• Asking Price: $145,000 USD via Escrow.com Wire',
        '• Revenue Status: $0.00 (Pure Pre-Revenue Software Asset)',
        '• Operating Expense: ~$28.35 / month (Cloud Run + Cloudflare)',
        '• Gross Margin: ~98.2% on future subscription revenue',
        '• Live Deployment: Google Cloud Run (Europe-West2)',
        '• Ownership: 100% Sole Founder, No Debt, No Encumbrances',
      ];
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '14px "JetBrains Mono", monospace';
      items.forEach((item, idx) => {
        ctx.fillText(item, cardX + 24, cardY + 75 + idx * 35);
      });

      // Card 2: Interactive Radar Pulse & Metrics
      const rX = 640;
      const rY = 220;
      const rW = 610;
      const rH = 340;

      ctx.fillStyle = 'rgba(17, 26, 34, 0.85)';
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(rX, rY, rW, rH);
      ctx.fillRect(rX, rY, rW, rH);

      // Radar Circle
      const centerX = rX + 160;
      const centerY = rY + 170;
      const maxR = 110;

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxR * 0.33, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, maxR * 0.66, 0, Math.PI * 2);
      ctx.arc(centerX, centerY, maxR, 0, Math.PI * 2);
      ctx.stroke();

      // Sweeping Hand
      const sweepAngle = (timeSec * 3) % (Math.PI * 2);
      ctx.strokeStyle = '#22d3a5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(sweepAngle) * maxR,
        centerY + Math.sin(sweepAngle) * maxR
      );
      ctx.stroke();

      // Metric Stats Box
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px "JetBrains Mono", monospace';
      ctx.fillText('4,402+', rX + 340, rY + 90);
      ctx.fillStyle = '#7a8b99';
      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.fillText('LIVE TRACKED REQUISITIONS', rX + 340, rY + 112);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 28px "JetBrains Mono", monospace';
      ctx.fillText('17 HUBS', rX + 340, rY + 175);
      ctx.fillStyle = '#7a8b99';
      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.fillText('GLOBAL TECH NODES MAPPED', rX + 340, rY + 197);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 28px "JetBrains Mono", monospace';
      ctx.fillText('100% IP', rX + 340, rY + 260);
      ctx.fillStyle = '#7a8b99';
      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.fillText('UNENCUMBERED ASSET & CODE', rX + 340, rY + 282);

    } else if (sceneIdx === 1) {
      // SCENE 2: 3D GEOSPATIAL & SECONDARY HUBS
      const globeCenterX = 350;
      const globeCenterY = 380;
      const globeR = 140;

      // Draw wireframe spinning globe representation
      ctx.strokeStyle = 'rgba(34, 211, 165, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(globeCenterX, globeCenterY, globeR, 0, Math.PI * 2);
      ctx.stroke();

      // Latitude lines
      for (let lat = -60; lat <= 60; lat += 30) {
        const yOffset = (lat / 90) * globeR * 0.8;
        const rad = Math.sqrt(Math.max(0, globeR * globeR - yOffset * yOffset));
        ctx.beginPath();
        ctx.ellipse(globeCenterX, globeCenterY + yOffset, rad, rad * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Longitude lines with rotation
      const rot = (timeSec * 0.8) % Math.PI;
      for (let long = 0; long < Math.PI; long += Math.PI / 4) {
        const curRot = long + rot;
        ctx.beginPath();
        ctx.ellipse(globeCenterX, globeCenterY, Math.abs(Math.cos(curRot)) * globeR, globeR, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Secondary Hubs Panel on Right
      const hX = 640;
      const hY = 220;
      const hW = 610;
      const hH = 340;

      ctx.fillStyle = 'rgba(17, 26, 34, 0.85)';
      ctx.strokeStyle = '#22d3a5';
      ctx.strokeRect(hX, hY, hW, hH);
      ctx.fillRect(hX, hY, hW, hH);

      ctx.fillStyle = '#22d3a5';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillText('★ HIGH-GROWTH SECONDARY HUBS MAPPED', hX + 24, hY + 36);

      const hubs = [
        { name: 'Austin, Texas [30.27° N, -97.74° W]', spec: 'SpaceTech & Defense Avionics • 312 Jobs' },
        { name: 'Toronto, Ontario [43.65° N, -79.38° W]', spec: 'Clean Energy Grid & AI Compute • 289 Jobs' },
        { name: 'Bengaluru, India [12.97° N, 77.59° E]', spec: 'Ultra-Scale Cluster Distributed Systems • 415 Jobs' },
        { name: 'Tel Aviv, Israel [32.08° N, 34.78° E]', spec: 'Zero-Knowledge Cryptography & Sec • 248 Jobs' },
        { name: 'Stockholm, Sweden [59.33° N, 18.06° E]', spec: 'Computational Genomics & Bio-Sim • 194 Jobs' },
      ];

      hubs.forEach((h, idx) => {
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.fillText(h.name, hX + 24, hY + 70 + idx * 52);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillText(h.spec, hX + 24, hY + 90 + idx * 52);
      });

    } else if (sceneIdx === 2) {
      // SCENE 3: LIVE REQUISITION STREAM & TOKEN HIGHLIGHTING
      const jX = 30;
      const jY = 220;
      const jW = 750;
      const jH = 340;

      ctx.fillStyle = 'rgba(17, 26, 34, 0.85)';
      ctx.strokeStyle = '#22d3a5';
      ctx.strokeRect(jX, jY, jW, jH);
      ctx.fillRect(jX, jY, jW, jH);

      ctx.fillStyle = '#22d3a5';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillText('★ LIVE REQUISITION RADAR & HIGHLIGHTING ENGINE', jX + 24, jY + 36);

      const jobCards = [
        {
          id: 'ALERT-913',
          title: 'Senior Guidance, Navigation & Control (GNC) Engineer',
          comp: '$210,000 – $275,000',
          loc: 'Austin, TX • SpaceTech Avionics',
          skills: 'Flight Dynamics, C++, Kalman Filters, RTOS',
        },
        {
          id: 'ALERT-914',
          title: 'Principal Grid Systems Architect - High-Voltage DC',
          comp: '$225,000 – $295,000',
          loc: 'Toronto, ON • Energy Grid',
          skills: 'SCADA, Distributed Energy, Microgrids, Python',
        },
        {
          id: 'ALERT-915',
          title: 'Staff Computational Genomics Scientist',
          comp: '$205,000 – $265,000',
          loc: 'Stockholm, SE • Genomics',
          skills: 'PyTorch, Next-Gen Sequencing, AlphaFold, BioPython',
        },
      ];

      jobCards.forEach((job, idx) => {
        const top = jY + 60 + idx * 90;
        ctx.fillStyle = '#111a22';
        ctx.strokeStyle = '#1e2b36';
        ctx.fillRect(jX + 20, top, jW - 40, 80);
        ctx.strokeRect(jX + 20, top, jW - 40, 80);

        ctx.fillStyle = '#22d3a5';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillText(job.id, jX + 32, top + 22);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.fillText(job.title, jX + 130, top + 22);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 13px "JetBrains Mono", monospace';
        ctx.fillText(job.comp, jX + 32, top + 46);

        ctx.fillStyle = '#38bdf8';
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.fillText(job.loc, jX + 240, top + 46);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillText(`Highlighted Skills: ${job.skills}`, jX + 32, top + 68);
      });

      // Right Side Telemetry Card
      const tX = 810;
      const tY = 220;
      const tW = 440;
      const tH = 340;

      ctx.fillStyle = 'rgba(17, 26, 34, 0.85)';
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(tX, tY, tW, tH);
      ctx.fillRect(tX, tY, tW, tH);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 15px "JetBrains Mono", monospace';
      ctx.fillText('📡 LIVE API STREAM TELEMETRY', tX + 20, tY + 36);

      ctx.fillStyle = '#22d3a5';
      ctx.font = '13px "JetBrains Mono", monospace';
      ctx.fillText('GET /api/jobs/market-radar', tX + 20, tY + 70);

      const metrics = [
        '• Global Openings: 4,402 Requisitions',
        '• Active Global Tech Nodes: 17 Hubs',
        '• Aggregate Velocity Index: 94.2 / 100',
        '• YoY Market Surge: +34.8%',
        '• Median Search Query Latency: <12ms',
        '• Token Splitting: Regex Escaped',
        '• Status: 200 OK (Continuous Feed)',
      ];
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px "JetBrains Mono", monospace';
      metrics.forEach((m, idx) => {
        ctx.fillText(m, tX + 20, tY + 110 + idx * 30);
      });

    } else if (sceneIdx === 3) {
      // SCENE 4: PRODUCTION STACK & ZERO TECHNICAL DEBT
      const stackX = 30;
      const stackY = 220;
      const stackW = 1220;
      const stackH = 340;

      ctx.fillStyle = 'rgba(17, 26, 34, 0.85)';
      ctx.strokeStyle = '#38bdf8';
      ctx.strokeRect(stackX, stackY, stackW, stackH);
      ctx.fillRect(stackX, stackY, stackW, stackH);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillText('★ PRODUCTION-GRADE CODEBASE & TRANSFERABLE ARCHITECTURE', stackX + 24, stackY + 36);

      const columns = [
        {
          title: 'FRONTEND ARCHITECTURE',
          items: [
            '• React 18 & TypeScript (100% Strict)',
            '• Tailwind CSS with Zero-Pill Rules',
            '• Lucide Icons & Recharts Visualizer',
            '• Vite Ultra-Fast Build System',
            '• 0 Compiler Errors / 0 Warnings',
          ],
        },
        {
          title: '3D WEBGL GRAPHICS',
          items: [
            '• Three.js WebGL Engine',
            '• Dynamic Lat/Lng 3D Vector Math',
            '• OrbitControls & Smooth Dampening',
            '• 17 Interactive Hub Node Spheres',
            '• 60 FPS Render Loop Hardware Accel',
          ],
        },
        {
          title: 'BACKEND & MOBILE',
          items: [
            '• Node.js Express REST API',
            '• Google Cloud Run (Containerized)',
            '• Gemini AI Multi-Role Triad Agent',
            '• PWA Service Worker (Offline Cache)',
            '• Android Google Play TWA Package',
          ],
        },
      ];

      columns.forEach((col, cIdx) => {
        const colLeft = stackX + 30 + cIdx * 390;
        ctx.fillStyle = '#22d3a5';
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        ctx.fillText(col.title, colLeft, stackY + 75);

        ctx.fillStyle = '#e2e8f0';
        ctx.font = '13px "JetBrains Mono", monospace';
        col.items.forEach((item, iIdx) => {
          ctx.fillText(item, colLeft, stackY + 110 + iIdx * 36);
        });
      });

    } else {
      // SCENE 5: FINANCIALS, P&L & ESCROW CLOSING
      const fX = 30;
      const fY = 220;
      const fW = 580;
      const fH = 340;

      ctx.fillStyle = 'rgba(17, 26, 34, 0.85)';
      ctx.strokeStyle = '#fbbf24';
      ctx.strokeRect(fX, fY, fW, fH);
      ctx.fillRect(fX, fY, fW, fH);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillText('★ MONTHLY OPERATING P&L STATEMENT (ACQUIRE.COM)', fX + 24, fY + 36);

      const plItems = [
        { label: 'Annual / Monthly Revenue:', val: '$0.00 USD (Pre-Revenue)' },
        { label: 'Google Cloud Run Hosting:', val: '$12.50 / month' },
        { label: 'Cloudflare Domain & SSL:', val: '$1.85 / month' },
        { label: 'Gemini AI API Tokens:', val: '$8.00 / month' },
        { label: 'Google Workspace Admin:', val: '$6.00 / month' },
        { label: 'TOTAL MONTHLY OPERATING EXPENSE:', val: '$28.35 / month' },
        { label: 'PROJECTED GROSS SOFTWARE MARGIN:', val: '98.2%' },
      ];

      plItems.forEach((pl, idx) => {
        const isTotal = idx >= 5;
        ctx.fillStyle = isTotal ? '#22d3a5' : '#94a3b8';
        ctx.font = isTotal ? 'bold 13px "JetBrains Mono", monospace' : '13px "JetBrains Mono", monospace';
        ctx.fillText(pl.label, fX + 24, fY + 75 + idx * 36);

        ctx.fillStyle = isTotal ? '#22d3a5' : '#ffffff';
        ctx.fillText(pl.val, fX + 380, fY + 75 + idx * 36);
      });

      // Right Side: Turnkey Closing Terms
      const cX = 640;
      const cY = 220;
      const cW = 610;
      const cH = 340;

      ctx.fillStyle = 'rgba(17, 26, 34, 0.85)';
      ctx.strokeStyle = '#22d3a5';
      ctx.strokeRect(cX, cY, cW, cH);
      ctx.fillRect(cX, cY, cW, cH);

      ctx.fillStyle = '#22d3a5';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.fillText('★ FULL BUYOUT ASSET SALE TERMS ($145,000 USD)', cX + 24, cY + 36);

      const terms = [
        '• Purchase Price: $145,000 USD via Escrow.com Wire',
        '• Buyer Inspection Deposit: 10% ($14,500) Held in Escrow',
        '• Inspection Period: 48 Hours Full Code Audit Period',
        '• Included Asset 1: Complete Git Repo + Commercial IP Rights',
        '• Included Asset 2: Canonical Domain (talentradar.io)',
        '• Included Asset 3: Google Play Store TWA (com.talentradar.app)',
        '• Handover Support: 30 Days Founder Architecture Transition',
      ];
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '13px "JetBrains Mono", monospace';
      terms.forEach((t, idx) => {
        ctx.fillText(t, cX + 24, cY + 75 + idx * 35);
      });
    }

    // 5. Bottom Synchronized Subtitles & Narration HUD Bar
    const activeCue =
      subtitleCues.find((c) => timeSec >= c.startSec && timeSec < c.endSec) ||
      subtitleCues[subtitleCues.length - 1];

    if (showSubtitles && activeCue) {
      if (subtitleStyle === 'broadcast') {
        // High-contrast lower-third broadcast caption bar
        ctx.fillStyle = 'rgba(6, 10, 15, 0.94)';
        ctx.fillRect(0, height - 112, width, 104);
        ctx.strokeStyle = 'rgba(34, 211, 165, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height - 112);
        ctx.lineTo(width, height - 112);
        ctx.stroke();

        // Cue badge & timestamp header
        ctx.fillStyle = '#22d3a5';
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(
          `CC // SUBTITLE [${activeCue.id}/${subtitleCues.length}] • ${formatSubtitleTimestamp(activeCue.startSec, '.').slice(3, 8)} - ${formatSubtitleTimestamp(activeCue.endSec, '.').slice(3, 8)}`,
          30,
          height - 86
        );

        ctx.fillStyle = '#38bdf8';
        ctx.textAlign = 'right';
        ctx.fillText(activeCue.sceneBadge, width - 30, height - 86);
        ctx.textAlign = 'left';

        // Multi-line wrapped subtitle text
        const fontSize = subtitleSize === 'lg' ? 21 : 17;
        ctx.font = `bold ${fontSize}px "Inter", "JetBrains Mono", sans-serif`;
        const wrappedLines = wrapCanvasText(ctx, activeCue.text, width - 100);
        const lineHeight = fontSize + 7;
        const startY = wrappedLines.length === 1 ? height - 42 : height - 56;

        ctx.textAlign = 'center';
        wrappedLines.forEach((line, idx) => {
          const yPos = startY + idx * lineHeight;
          // Crisp dark outline for broadcast legibility
          ctx.lineWidth = 4;
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
          ctx.strokeText(line, width / 2, yPos);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(line, width / 2, yPos);
        });
        ctx.textAlign = 'left';
      } else {
        // Floating Cinema Subtitle Box over lower third
        const fontSize = subtitleSize === 'lg' ? 22 : 18;
        ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
        const wrappedLines = wrapCanvasText(ctx, activeCue.text, width - 180);
        const lineHeight = fontSize + 8;
        const maxLineWidth = Math.max(...wrappedLines.map((l) => ctx.measureText(l).width), 240);
        const boxW = Math.min(width - 80, maxLineWidth + 56);
        const boxH = wrappedLines.length * lineHeight + 24;
        const boxX = (width - boxW) / 2;
        const boxY = height - boxH - 24;

        ctx.fillStyle = 'rgba(5, 8, 12, 0.88)';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = 'rgba(34, 211, 165, 0.65)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.textAlign = 'center';
        wrappedLines.forEach((line, idx) => {
          const yPos = boxY + 28 + idx * lineHeight;
          ctx.fillStyle = '#ffffff';
          ctx.fillText(line, width / 2, yPos);
        });
        ctx.textAlign = 'left';
      }
    } else {
      // Minimal footer strip when subtitles are toggled off
      ctx.fillStyle = 'rgba(11, 17, 24, 0.88)';
      ctx.fillRect(0, height - 46, width, 38);
      ctx.fillStyle = '#7a8b99';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText(`SCENE ${sceneIdx + 1}/5: ${scene.title} • CAPTIONS OFF`, 30, height - 22);
    }

    // 6. Bottom Progress Timeline Bar
    const progress = Math.min(timeSec / TOTAL_DURATION_SEC, 1);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, height - 8, width, 8);

    ctx.fillStyle = '#22d3a5';
    ctx.fillRect(0, height - 8, width * progress, 8);

    // Scrubber head
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(width * progress, height - 4, 6, 0, Math.PI * 2);
    ctx.fill();

    // Recording watermark if active
    if (isRecording) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.beginPath();
      ctx.arc(width - 130, 36, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 13px "JetBrains Mono", monospace';
      ctx.fillText('REC 30FPS', width - 110, 41);
    }
  }, [TOTAL_DURATION_SEC, askingPrice, isAudioMuted, isRecording, showSubtitles, subtitleCues, subtitleSize, subtitleStyle]);

  // Main playback loop
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const deltaSec = ((now - lastTime) / 1000) * playbackSpeed;
      lastTime = now;

      if (isPlaying) {
        setCurrentTimeSec((prev) => {
          const next = prev + deltaSec;
          if (next >= TOTAL_DURATION_SEC) {
            setIsPlaying(false);
            if (isRecording) {
              stopRecording();
            }
            return TOTAL_DURATION_SEC;
          }
          return next;
        });
      }

      drawFrame(currentTimeSec);
      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, playbackSpeed, currentTimeSec, drawFrame, TOTAL_DURATION_SEC, isRecording]);

  // Track scene changes to speak narration
  const lastSpokenSceneRef = useRef<number>(-1);
  useEffect(() => {
    if (isPlaying && activeSceneIndex !== lastSpokenSceneRef.current) {
      lastSpokenSceneRef.current = activeSceneIndex;
      playChimeTone(600 + activeSceneIndex * 60);
      speakCurrentScene(SCENES[activeSceneIndex].script);
    }
  }, [isPlaying, activeSceneIndex, playChimeTone, speakCurrentScene]);

  // Start Canvas Video Recording (WebM 60fps/30fps with audio track)
  const startRecording = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Capture 30fps canvas video stream
      const stream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : null;
      if (!stream) {
        alert('Canvas video capture stream is not supported in this browser.');
        return;
      }

      // Add audio destination track if supported
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioCtx();
            audioDestRef.current = audioCtxRef.current.createMediaStreamDestination();
          }
          if (audioDestRef.current && audioDestRef.current.stream.getAudioTracks().length > 0) {
            stream.addTrack(audioDestRef.current.stream.getAudioTracks()[0]);
          }
        }
      } catch (_) {}

      recordedChunksRef.current = [];
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedBlobUrl(url);
        setIsRecording(false);
      };

      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      setCurrentTimeSec(0);
      lastSpokenSceneRef.current = -1;
      setIsPlaying(true);
    } catch (err) {
      console.error('Error starting video recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsPlaying(false);
  };

  // Screen recorder for recording user's live app tab + microphone
  const startScreenRecording = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' } as any,
        audio: true,
      });

      // Optionally mix microphone
      let combinedStream = displayStream;
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          const dest = ctx.createMediaStreamDestination();
          const displayAudio = ctx.createMediaStreamSource(displayStream);
          const micAudio = ctx.createMediaStreamSource(micStream);
          displayAudio.connect(dest);
          micAudio.connect(dest);
          combinedStream = new MediaStream([
            ...displayStream.getVideoTracks(),
            ...dest.stream.getAudioTracks(),
          ]);
        }
      } catch (_) {
        // Microphone access denied or not available; fallback to display audio only
      }

      screenStreamRef.current = combinedStream;
      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(combinedStream);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setScreenRecordedUrl(url);
        setIsScreenRecording(false);
        // Stop all tracks
        combinedStream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(200);
      screenRecorderRef.current = recorder;
      setIsScreenRecording(true);
      setScreenRecordSeconds(0);
    } catch (err) {
      console.error('Failed to initiate screen recording:', err);
    }
  };

  const stopScreenRecording = () => {
    if (screenRecorderRef.current && screenRecorderRef.current.state !== 'inactive') {
      screenRecorderRef.current.stop();
    }
    setIsScreenRecording(false);
  };

  // Timer intervals
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScreenRecording) {
      interval = setInterval(() => setScreenRecordSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isScreenRecording]);

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const jumpToScene = (index: number) => {
    let sec = 0;
    for (let i = 0; i < index; i++) sec += SCENES[i].durationSec;
    setCurrentTimeSec(sec);
    drawFrame(sec);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const generateSrtContent = () => {
    return subtitleCues
      .map(
        (cue, idx) =>
          `${idx + 1}\n${formatSubtitleTimestamp(cue.startSec, ',')} --> ${formatSubtitleTimestamp(cue.endSec, ',')}\n${cue.text}\n`
      )
      .join('\n');
  };

  const generateVttContent = () => {
    const body = subtitleCues
      .map(
        (cue, idx) =>
          `${idx + 1}\n${formatSubtitleTimestamp(cue.startSec, '.')} --> ${formatSubtitleTimestamp(cue.endSec, '.')}\n${cue.text}\n`
      )
      .join('\n');
    return `WEBVTT\n\n${body}`;
  };

  const downloadSubtitleFile = (format: 'srt' | 'vtt') => {
    const content = format === 'srt' ? generateSrtContent() : generateVttContent();
    const mime = format === 'srt' ? 'application/x-subrip;charset=utf-8' : 'text/vtt;charset=utf-8';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TalentRadar-Acquire-Walkthrough.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateCueText = (id: number, text: string) => {
    setSubtitleCues((prev) => prev.map((c) => (c.id === id ? { ...c, text } : c)));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0b1118] border border-[#22d3a5]/50 shadow-[0_0_50px_rgba(34,211,165,0.2)] text-[#dce7f0] overflow-hidden">
        {/* Top Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2b36] bg-[#0e1620]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#22d3a5]/10 border border-[#22d3a5]/40 text-[#22d3a5]">
              <Film className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-mono text-white tracking-wide">
                  ACQUIRE.COM // IN-APP WALKTHROUGH VIDEO STUDIO
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/40 font-mono font-bold">
                  CURATION-READY
                </span>
              </div>
              <p className="text-xs text-[#7a8b99] font-mono">
                Generate, record, and export full 1080p/720p walkthrough video and submission dossier directly in-app
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick tab switcher */}
            <div className="flex rounded-lg bg-[#111a22] border border-[#1e2b36] p-1 text-xs font-mono">
              <button
                onClick={() => setActiveTab('video')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                  activeTab === 'video'
                    ? 'bg-[#22d3a5] text-black font-bold shadow'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Video Studio</span>
              </button>
              <button
                onClick={() => setActiveTab('screen-recorder')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                  activeTab === 'screen-recorder'
                    ? 'bg-[#38bdf8] text-black font-bold shadow'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Live Screen Capture</span>
              </button>
              <button
                onClick={() => setActiveTab('curation-dossier')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                  activeTab === 'curation-dossier'
                    ? 'bg-[#fbbf24] text-black font-bold shadow'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Listing Dossier</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#111a22] hover:bg-[#1a2632] border border-[#1e2b36] text-[#7a8b99] hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'video' && (
            <div className="space-y-5">
              {/* Video Player Canvas Container */}
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-[#22d3a5]/40 bg-black shadow-2xl">
                <canvas
                  ref={canvasRef}
                  width={1280}
                  height={720}
                  className="w-full h-full object-contain block"
                />

                {/* Overlaid Playback Status Pill */}
                <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
                  <span className="text-[11px] px-2.5 py-1 rounded-md bg-black/75 border border-[#22d3a5]/60 text-[#22d3a5] font-mono font-bold backdrop-blur-sm">
                    {formatTime(currentTimeSec)} / {formatTime(TOTAL_DURATION_SEC)}
                  </span>
                  <span className="text-[11px] px-2.5 py-1 rounded-md bg-black/75 border border-[#38bdf8]/60 text-[#38bdf8] font-mono font-semibold backdrop-blur-sm">
                    {currentScene.badge}
                  </span>
                </div>

                {/* Recording Live Indicator */}
                {isRecording && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-600/90 text-white font-mono font-bold text-xs shadow-lg animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    <span>RECORDING: {formatTime(recordingSeconds)}</span>
                  </div>
                )}
              </div>

              {/* Player Timeline Scrubber */}
              <div className="space-y-2">
                <div className="relative w-full h-3 bg-[#111a22] border border-[#1e2b36] rounded-full overflow-hidden cursor-pointer">
                  <div
                    className="h-full bg-gradient-to-r from-[#22d3a5] via-[#38bdf8] to-[#fbbf24] transition-all"
                    style={{ width: `${(currentTimeSec / TOTAL_DURATION_SEC) * 100}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={TOTAL_DURATION_SEC}
                    step={0.5}
                    value={currentTimeSec}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCurrentTimeSec(val);
                      drawFrame(val);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                {/* Scene jump markers */}
                <div className="grid grid-cols-5 gap-2 text-center">
                  {SCENES.map((s, idx) => (
                    <button
                      key={s.id}
                      onClick={() => jumpToScene(idx)}
                      className={`px-2 py-1.5 rounded text-[11px] font-mono truncate transition border ${
                        activeSceneIndex === idx
                          ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5] font-bold'
                          : 'bg-[#111a22] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
                      }`}
                      title={s.title}
                    >
                      {idx + 1}. {s.badge}
                    </button>
                  ))}
                </div>
              </div>

              {/* Master Player & Recording Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#0e1620] border border-[#1e2b36]">
                {/* Playback buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (currentTimeSec >= TOTAL_DURATION_SEC) {
                        setCurrentTimeSec(0);
                      }
                      setIsPlaying(!isPlaying);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold font-mono transition cursor-pointer active:scale-95"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                    <span>{isPlaying ? 'PAUSE' : 'PLAY PREVIEW'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentTimeSec(0);
                      drawFrame(0);
                      setIsPlaying(false);
                    }}
                    className="p-2 rounded-lg bg-[#111a22] hover:bg-[#1a2632] border border-[#1e2b36] text-[#7a8b99] hover:text-white transition"
                    title="Restart from beginning"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  {/* Speed toggle */}
                  <button
                    onClick={() => {
                      const speeds = [1, 1.25, 1.5];
                      const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
                      setPlaybackSpeed(next);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-[#111a22] border border-[#1e2b36] text-xs font-mono text-[#94a3b8] hover:text-white"
                  >
                    {playbackSpeed}x SPEED
                  </button>

                  {/* Voiceover audio toggle */}
                  <button
                    onClick={() => setIsVoiceoverEnabled(!isVoiceoverEnabled)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
                      isVoiceoverEnabled
                        ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8]'
                        : 'bg-[#111a22] border-[#1e2b36] text-[#7a8b99]'
                    }`}
                    title="Toggle synthesized speech voiceover"
                  >
                    {isVoiceoverEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>{isVoiceoverEnabled ? 'VOICEOVER: ON' : 'VOICEOVER: OFF'}</span>
                  </button>

                  {/* Burned-in Subtitles / CC Toggle */}
                  <button
                    onClick={() => setShowSubtitles(!showSubtitles)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
                      showSubtitles
                        ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5] font-bold'
                        : 'bg-[#111a22] border-[#1e2b36] text-[#7a8b99]'
                    }`}
                    title="Toggle burned-in subtitles on video preview and .webm export"
                  >
                    <Captions className="w-3.5 h-3.5" />
                    <span>{showSubtitles ? 'SUBTITLES (CC): ON' : 'SUBTITLES (CC): OFF'}</span>
                  </button>

                  {showSubtitles && (
                    <button
                      onClick={() => setSubtitleStyle(subtitleStyle === 'broadcast' ? 'cinema' : 'broadcast')}
                      className="px-2.5 py-1.5 rounded-lg bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5]/60 text-xs font-mono text-[#94a3b8] hover:text-white transition cursor-pointer"
                      title="Switch subtitle visual style"
                    >
                      STYLE: {subtitleStyle.toUpperCase()}
                    </button>
                  )}

                  {showSubtitles && (
                    <button
                      onClick={() => setSubtitleSize(subtitleSize === 'lg' ? 'md' : 'lg')}
                      className="px-2.5 py-1.5 rounded-lg bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5]/60 text-xs font-mono text-[#94a3b8] hover:text-white transition cursor-pointer"
                      title="Toggle subtitle font size"
                    >
                      SIZE: {subtitleSize.toUpperCase()}
                    </button>
                  )}
                </div>

                {/* In-App Recording Action */}
                <div className="flex flex-wrap items-center gap-2">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono font-bold transition shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer active:scale-95"
                    >
                      <Film className="w-4 h-4" />
                      <span>RECORD &amp; EXPORT VIDEO (.WEBM)</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-mono font-bold transition shadow cursor-pointer active:scale-95"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>STOP &amp; FINALIZE VIDEO</span>
                    </button>
                  )}

                  {recordedBlobUrl && (
                    <a
                      href={recordedBlobUrl}
                      download="TalentRadar-Acquire-Listing-Walkthrough.webm"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#22d3a5] to-[#38bdf8] text-black font-mono font-bold transition shadow hover:opacity-90 active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>DOWNLOAD .WEBM</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Synchronized Subtitles & Cue Editor Panel */}
              <div className="p-4 rounded-xl bg-[#0e1620] border border-[#1e2b36] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#22d3a5] font-bold">
                    <Subtitles className="w-4 h-4" />
                    <span>TIMED SUBTITLES ({subtitleCues.length} CUES • BURNED INTO .WEBM EXPORT)</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => downloadSubtitleFile('srt')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#111a22] hover:bg-[#1a2632] border border-[#22d3a5]/40 text-[11px] font-mono text-[#22d3a5] font-bold transition cursor-pointer"
                      title="Download SubRip (.srt) subtitles for Loom, YouTube, or Vimeo"
                    >
                      <Download className="w-3 h-3" />
                      <span>DOWNLOAD .SRT</span>
                    </button>

                    <button
                      onClick={() => downloadSubtitleFile('vtt')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#111a22] hover:bg-[#1a2632] border border-[#38bdf8]/40 text-[11px] font-mono text-[#38bdf8] font-bold transition cursor-pointer"
                      title="Download WebVTT (.vtt) subtitles"
                    >
                      <Download className="w-3 h-3" />
                      <span>DOWNLOAD .VTT</span>
                    </button>

                    <button
                      onClick={() => copyToClipboard(generateSrtContent(), 'srt-copy')}
                      className="flex items-center gap-1 text-[11px] font-mono text-[#7a8b99] hover:text-[#22d3a5] transition cursor-pointer"
                    >
                      {copiedField === 'srt-copy' ? <CheckCircle2 className="w-3 h-3 text-[#22d3a5]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'srt-copy' ? 'COPIED .SRT' : 'COPY .SRT'}</span>
                    </button>

                    <button
                      onClick={() => setSubtitleCues(buildSubtitleCues(SCENES))}
                      className="text-[11px] font-mono text-[#7a8b99] hover:text-white transition cursor-pointer"
                      title="Reset edited subtitles back to default script"
                    >
                      RESET CUES
                    </button>
                  </div>
                </div>

                {/* Active Cue Highlight Banner */}
                {activeSubtitleCue && (
                  <div className="p-3 rounded-lg bg-[#111a22] border border-[#22d3a5]/50 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-[#22d3a5] font-bold block">
                        ACTIVE SUBTITLE [{formatTime(activeSubtitleCue.startSec)} → {formatTime(activeSubtitleCue.endSec)}]
                      </span>
                      <p className="text-sm font-mono text-white font-semibold">
                        &quot;{activeSubtitleCue.text}&quot;
                      </p>
                    </div>
                    <span className="text-[10px] px-2 py-1 rounded bg-[#22d3a5]/15 text-[#22d3a5] border border-[#22d3a5]/40 font-mono font-bold shrink-0">
                      LIVE SYNC
                    </span>
                  </div>
                )}

                {/* Scrollable Cue List (Click to jump, edit inline) */}
                <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {subtitleCues.map((cue) => {
                    const isActive = activeSubtitleCue?.id === cue.id;
                    return (
                      <div
                        key={cue.id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border transition ${
                          isActive
                            ? 'bg-[#22d3a5]/10 border-[#22d3a5] text-white'
                            : 'bg-[#0a0f14] border-[#1e2b36] text-[#94a3b8] hover:border-[#38bdf8]/40'
                        }`}
                      >
                        <button
                          onClick={() => {
                            setCurrentTimeSec(cue.startSec);
                            drawFrame(cue.startSec);
                          }}
                          className={`px-2 py-1 rounded text-[10px] font-mono font-bold shrink-0 cursor-pointer transition ${
                            isActive
                              ? 'bg-[#22d3a5] text-black'
                              : 'bg-[#111a22] text-[#38bdf8] border border-[#1e2b36] hover:border-[#38bdf8]'
                          }`}
                          title="Jump video to this subtitle timestamp"
                        >
                          {formatTime(cue.startSec)}
                        </button>

                        <input
                          type="text"
                          value={cue.text}
                          onChange={(e) => updateCueText(cue.id, e.target.value)}
                          className="flex-1 bg-transparent text-xs font-mono text-[#dce7f0] focus:outline-none focus:text-white"
                          aria-label={`Subtitle cue ${cue.id}`}
                        />

                        <span className="hidden sm:inline text-[10px] font-mono text-[#64748b] shrink-0">
                          {cue.sceneBadge}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'screen-recorder' && (
            <div className="space-y-6">
              <div className="p-5 rounded-xl bg-[#0e1620] border border-[#38bdf8]/40 space-y-3">
                <div className="flex items-center gap-2 text-sm font-mono text-[#38bdf8] font-bold">
                  <Monitor className="w-4 h-4" />
                  <span>LIVE IN-APP SCREEN &amp; MICROPHONE RECORDER</span>
                </div>
                <p className="text-xs text-[#94a3b8] font-mono leading-relaxed">
                  Prefer to record a live walkthrough with your own voice and live tab navigation? Use our built-in browser screen capture. Click Start Recording, select this browser tab, narrate the features, and download a ready-to-upload WebM video for Acquire.com or Loom.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {!isScreenRecording ? (
                    <button
                      onClick={startScreenRecording}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#38bdf8] hover:bg-[#0284c7] text-black font-mono font-bold transition shadow-[0_0_15px_rgba(56,189,248,0.3)] cursor-pointer active:scale-95"
                    >
                      <Mic className="w-4 h-4" />
                      <span>START LIVE SCREEN RECORDING</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopScreenRecording}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono font-bold transition shadow animate-pulse cursor-pointer"
                    >
                      <Square className="w-4 h-4 fill-current" />
                      <span>STOP RECORDING ({formatTime(screenRecordSeconds)})</span>
                    </button>
                  )}

                  {screenRecordedUrl && (
                    <a
                      href={screenRecordedUrl}
                      download="TalentRadar-Live-Walkthrough.webm"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#22d3a5] text-black font-mono font-bold transition shadow hover:bg-[#1db890]"
                    >
                      <Download className="w-4 h-4" />
                      <span>DOWNLOAD LIVE RECORDING (.WEBM)</span>
                    </a>
                  )}
                </div>
              </div>

              {screenRecordedUrl && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono text-[#22d3a5] font-bold">PREVIEW YOUR LIVE RECORDED VIDEO (WITH SUBTITLE TRACK):</h4>
                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-[#1e2b36] bg-black">
                    <video src={screenRecordedUrl} controls className="w-full h-full object-contain">
                      <track
                        kind="subtitles"
                        label="English Subtitles"
                        srcLang="en"
                        default
                        src={`data:text/vtt;charset=utf-8,${encodeURIComponent(generateVttContent())}`}
                      />
                    </video>
                  </div>
                </div>
              )}

              {/* Live Recording Subtitle Teleprompter */}
              <div className="p-4 rounded-xl bg-[#0e1620] border border-[#1e2b36] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono text-[#22d3a5] font-bold">
                    <Captions className="w-4 h-4" />
                    <span>TELEPROMPTER &amp; SUBTITLE CUE SHEET FOR LIVE RECORDING</span>
                  </div>
                  <button
                    onClick={() => downloadSubtitleFile('srt')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#111a22] hover:bg-[#1a2632] border border-[#22d3a5]/40 text-[11px] font-mono text-[#22d3a5] font-bold transition cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>EXPORT .SRT</span>
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {subtitleCues.map((cue) => (
                    <div
                      key={cue.id}
                      className="p-2.5 rounded-lg bg-[#111a22] border border-[#1e2b36] text-xs font-mono flex items-start gap-3"
                    >
                      <span className="text-[#38bdf8] font-bold shrink-0">
                        [{formatTime(cue.startSec)}]
                      </span>
                      <span className="text-[#e2e8f0] leading-relaxed">{cue.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'curation-dossier' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-[#0e1620] border border-[#fbbf24]/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-mono text-[#fbbf24] font-bold">
                    <BadgeDollarSign className="w-4 h-4" />
                    <span>ACQUIRE.COM CURATION SUBMISSION FIELDS</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/40 font-mono font-bold">
                    PRE-REVENUE IP SALE
                  </span>
                </div>
                <p className="text-xs text-[#94a3b8] font-mono leading-relaxed">
                  These blocks are formatted to copy and paste directly into Acquire.com’s seller listing fields to pass curation review immediately.
                </p>
              </div>

              {/* Section 1: Product Description */}
              <div className="p-4 rounded-xl bg-[#0e1620] border border-[#1e2b36] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-[#22d3a5]">
                    1. PRODUCT DESCRIPTION &amp; LIVE LINK
                  </h3>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `PRODUCT DESCRIPTION:\nTalentRadar.io is a production-grade 3D Geospatial Intelligence and Quantitative Career Analytics platform built for institutional engineering recruiting and compensation benchmarking. The platform tracks 4,402+ live active tech requisitions across 17 global technology hubs (including Austin, Toronto, Bengaluru, Tel Aviv, Stockholm, SF, London, Tokyo, and Zurich) with dedicated intelligence for emerging frontier sectors (Commercial SpaceTech / Defense Avionics, Computational Genomics, Next-Gen Energy Grid Optimization).\n\nLIVE URL:\n${publishedUrl}\n\nCANONICAL DOMAIN:\ntalentradar.io`,
                        'field-desc'
                      )
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111a22] hover:bg-[#1a2632] border border-[#1e2b36] text-xs font-mono text-[#22d3a5] transition"
                  >
                    {copiedField === 'field-desc' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'field-desc' ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36] text-xs font-mono text-[#cbd5e1] space-y-2">
                  <p>
                    <strong className="text-white">TalentRadar.io</strong> is a production-grade 3D Geospatial Intelligence and Quantitative Career Analytics platform built for institutional engineering recruiting and compensation benchmarking.
                  </p>
                  <p>
                    <strong className="text-[#38bdf8]">Live Link:</strong> {publishedUrl}
                  </p>
                  <p>
                    <strong className="text-[#22d3a5]">Walkthrough Video:</strong> Exported directly via in-app video studio (.webm file) or uploaded to Loom.
                  </p>
                </div>
              </div>

              {/* Section 2: User Metrics ($0 Revenue Statement) */}
              <div className="p-4 rounded-xl bg-[#0e1620] border border-[#1e2b36] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-[#38bdf8]">
                    2. USER &amp; USAGE METRICS (REVENUE: $0.00 USD)
                  </h3>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `REVENUE & USAGE METRICS:\n• Current Annual / Monthly Revenue: $0.00 USD (Clearly stated as pre-revenue software asset)\n• Live Tracked Tech Requisitions: 4,402+ Openings across 17 global tech nodes\n• Global Tech Hubs Covered: 17 hubs with 3D coordinate vectors\n• Search & Highlighting Engine: Regex-escaped token splitting with real-time telemetry\n• Gross Margin Potential: 98.2% based on lightweight operational expenses`,
                        'field-metrics'
                      )
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111a22] hover:bg-[#1a2632] border border-[#1e2b36] text-xs font-mono text-[#38bdf8] transition"
                  >
                    {copiedField === 'field-metrics' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'field-metrics' ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36] text-xs font-mono text-[#cbd5e1] space-y-1">
                  <p className="text-[#f87171] font-bold">• REVENUE: $0.00 USD (Pre-Revenue Full IP &amp; Software Sale)</p>
                  <p>• Tracked Requisitions: 4,402+ across 17 secondary and tier-1 hubs</p>
                  <p>• Emerging Frontier Sectors: SpaceTech Avionics, Comp Genomics, Clean Grid</p>
                  <p>• PWA Cache &amp; Android TWA: 100% functional offline capability</p>
                </div>
              </div>

              {/* Section 3: Monthly P&L Breakdown */}
              <div className="p-4 rounded-xl bg-[#0e1620] border border-[#1e2b36] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-[#fbbf24]">
                    3. MONTHLY P&amp;L (ACTUAL OPERATING EXPENSES)
                  </h3>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `MONTHLY OPERATING P&L:\n• Cloud Run Container Hosting: $12.50 / mo\n• Cloudflare Registrar & DNS: $1.85 / mo\n• Gemini AI Model Tokens: $8.00 / mo\n• Google Workspace Admin: $6.00 / mo\nTOTAL MONTHLY EXPENSES: $28.35 / mo\nGROSS SOFTWARE MARGIN: 98.2%`,
                        'field-pnl'
                      )
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111a22] hover:bg-[#1a2632] border border-[#1e2b36] text-xs font-mono text-[#fbbf24] transition"
                  >
                    {copiedField === 'field-pnl' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'field-pnl' ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36] text-xs font-mono text-[#cbd5e1] grid grid-cols-2 gap-2">
                  <div>Cloud Run Hosting: <span className="text-white font-bold">$12.50 / mo</span></div>
                  <div>Cloudflare Domain: <span className="text-white font-bold">$1.85 / mo</span></div>
                  <div>Gemini AI Tokens: <span className="text-white font-bold">$8.00 / mo</span></div>
                  <div>Google Workspace: <span className="text-white font-bold">$6.00 / mo</span></div>
                  <div className="col-span-2 pt-1 border-t border-[#1e2b36] text-[#22d3a5] font-bold">
                    TOTAL OPERATING RUN-RATE: $28.35 / mo (~$340.20 / yr)
                  </div>
                </div>
              </div>

              {/* Section 4: Assets & Price */}
              <div className="p-4 rounded-xl bg-[#0e1620] border border-[#1e2b36] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-[#22d3a5]">
                    4. INCLUDED ASSETS &amp; ASKING PRICE ($145,000 USD)
                  </h3>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `INCLUDED ASSETS & BUYOUT TERMS:\n• Asking Price: $145,000 USD\n• Deposit: 10% ($14,500 USD) held in Escrow.com\n• Ownership: 100% single founder, zero debt, clean title\n• Source Code: Complete TypeScript/React/Node repository with 0 compiler errors\n• Domain: talentradar.io with Cloudflare transfer code (EPP)\n• Android App: com.talentradar.app Google Play package and signing keystore\n• Support: 30 days of founder technical transition`,
                        'field-assets'
                      )
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111a22] hover:bg-[#1a2632] border border-[#1e2b36] text-xs font-mono text-[#22d3a5] transition"
                  >
                    {copiedField === 'field-assets' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'field-assets' ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36] text-xs font-mono text-[#cbd5e1] space-y-1">
                  <p>• <strong className="text-white">Asking Price:</strong> $145,000 USD Full Buyout</p>
                  <p>• <strong className="text-white">Escrow:</strong> Escrow.com wire ready (10% refundable inspection deposit)</p>
                  <p>• <strong className="text-white">Ownership:</strong> 100% Sole Founder (mortyp1125@gmail.com)</p>
                  <p>• <strong className="text-white">Assets Included:</strong> 100% Source Code, Domain, Play Store Package, 3D Assets, Architecture Dossier</p>
                </div>
              </div>

              {/* Section 5: Bootstrapped Funding & Jurisdiction */}
              <div className="p-4 rounded-xl bg-[#0e1620] border border-[#1e2b36] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-bold text-[#38bdf8]">
                    5. FUNDING STATUS &amp; OPERATING JURISDICTION
                  </h3>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `FUNDING & JURISDICTION SUMMARY:\n• Financing: 100% Bootstrapped / Self-Funded by Solo Technical Founder (Zero outside capital, zero debt, zero equity dilution)\n• Cloud Infrastructure Location: London, United Kingdom (Google Cloud Run region: europe-west2 with global Cloudflare edge network)\n• Seller & Beneficiary Tax Residence: Kenya (Supported by Escrow.com for direct USD SWIFT wire payouts)\n• Sale Structure: 100% Clean Digital Asset Sale (Asset Purchase Agreement / Bill of Sale). Transferred cleanly into buyer's domestic jurisdiction (US Delaware LLC/C-Corp, UK Ltd, EU, or international holding company) with zero legacy entity liabilities.`,
                        'field-funding-jurisdiction'
                      )
                    }
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#111a22] hover:bg-[#1a2632] border border-[#1e2b36] text-xs font-mono text-[#38bdf8] transition"
                  >
                    {copiedField === 'field-funding-jurisdiction' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'field-funding-jurisdiction' ? 'COPIED' : 'COPY'}</span>
                  </button>
                </div>
                <div className="p-3 rounded-lg bg-[#111a22] border border-[#1e2b36] text-xs font-mono text-[#cbd5e1] space-y-1.5">
                  <p>
                    • <strong className="text-white">Funding Type:</strong> <span className="text-[#22d3a5] font-bold">100% Bootstrapped / Self-Funded</span> (No VC/angel dilution, no debt, 100% common founder equity).
                  </p>
                  <p>
                    • <strong className="text-white">Cloud Infrastructure Location:</strong> London, UK (<span className="text-[#38bdf8]">europe-west2</span>) on Google Cloud Run + Cloudflare CDN.
                  </p>
                  <p>
                    • <strong className="text-white">Seller Location / KYC:</strong> Kenya (Standard Escrow.com USD SWIFT wire payout to Kenyan bank account).
                  </p>
                  <p>
                    • <strong className="text-white">Buyer Transferability:</strong> Full Asset Sale (APA / Bill of Sale). Absorbed instantly into US, UK, EU, or global entities with zero tax nexus issues.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#1e2b36] bg-[#0e1620] text-xs font-mono">
          <div className="flex items-center gap-2 text-[#7a8b99]">
            <ShieldCheck className="w-4 h-4 text-[#22d3a5]" />
            <span>Curated for Acquire.com Review • Escrow.com Integrated</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#111a22] hover:bg-[#1a2632] border border-[#1e2b36] text-[#94a3b8] hover:text-white transition"
            >
              Close Studio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
