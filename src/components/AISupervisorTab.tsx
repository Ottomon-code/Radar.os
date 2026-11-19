import React, { useState, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Shield,
  ArrowRight,
  RefreshCw,
  Cpu,
  Layers,
  Radio,
  CheckCircle2,
  Workflow,
  Zap,
  Compass,
  MessageSquare,
  Activity,
  Terminal,
  Eye,
  ChevronRight,
  TrendingUp,
  Crown,
  ChevronDown,
  CornerDownRight,
  Flame,
  Award,
  Lock,
  Copy,
  Check,
  FileText,
  Download,
  BadgeDollarSign,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import {
  TRIAD_ASSISTANTS,
  INITIAL_INTER_AGENT_MESSAGES,
  PRESET_TRIAD_MISSIONS,
  PRESET_COMMANDER_DIRECTIVES,
  AgentId,
  AIAssistant,
  InterAgentMessage,
  CommanderDirective,
  TriadCollaborativeCycle,
} from '../utils/triadEngine';
import { FounderBioResult } from '../utils/founderBioHelper';
import { useSubscription } from '../context/SubscriptionContext';
import { auth } from '../firebase';

interface AISupervisorTabProps {
  onNavigateToCareer?: (targetRole: string, targetSalary?: number) => void;
  onNavigateToNews?: (company: string, sector: string) => void;
  onNavigateToComms?: () => void;
}

export default function AISupervisorTab({
  onNavigateToCareer,
  onNavigateToNews,
  onNavigateToComms,
}: AISupervisorTabProps) {
  const { isPro, isOwner, openPaywall } = useSubscription();

  // Active operating mode
  const [activeView, setActiveView] = useState<'cooperation' | 'direct_channels' | 'inter_bus' | 'founder_bio'>('cooperation');
  const [selectedAgentId, setSelectedAgentId] = useState<AgentId>('commander');

  useEffect(() => {
    if (!isOwner && activeView === 'founder_bio') {
      setActiveView('cooperation');
    }
  }, [isOwner, activeView]);

  // Founder Biography Generator State (Gemini 4 Hydrogen — Owner Only)
  const [bioTitle, setBioTitle] = useState('Full-Stack Systems Architect & Solo Founder');
  const [bioTone, setBioTone] = useState<'institutional_pe' | 'tech_strategic' | 'recruiting_agency'>('institutional_pe');
  const [bioCountry, setBioCountry] = useState('Kenya');
  const [bioCloudRegion, setBioCloudRegion] = useState('London, United Kingdom (europe-west2)');
  const [bioAskingPrice, setBioAskingPrice] = useState(145000);
  const [bioMonthlyCost, setBioMonthlyCost] = useState(28.35);
  const [bioResult, setBioResult] = useState<FounderBioResult | null>(null);
  const [bioError, setBioError] = useState<string | null>(null);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [copiedBioKey, setCopiedBioKey] = useState<string | null>(null);
  const [injectedIntoCommander, setInjectedIntoCommander] = useState(false);

  // Assistants hierarchy state
  const [assistants, setAssistants] = useState<AIAssistant[]>(TRIAD_ASSISTANTS);
  const [interMessages, setInterMessages] = useState<InterAgentMessage[]>(INITIAL_INTER_AGENT_MESSAGES);
  const [currentCycle, setCurrentCycle] = useState<TriadCollaborativeCycle | null>(null);
  const [cycleError, setCycleError] = useState<string | null>(null);
  const [sendingAgentId, setSendingAgentId] = useState<AgentId | null>(null);
  const [channelError, setChannelError] = useState<string | null>(null);

  // Commander direct instruction controls
  const [directiveTarget, setDirectiveTarget] = useState<'collective' | 'scout' | 'strategist' | 'envoy'>('collective');
  const [commanderCustomInstruction, setCommanderCustomInstruction] = useState('');
  const [lastDispatchedDirective, setLastDispatchedDirective] = useState<string | null>(null);

  // Direct channel chat state for all 4 assistants
  const [channelInputs, setChannelInputs] = useState<Record<AgentId, string>>({
    commander: '',
    scout: '',
    strategist: '',
    envoy: '',
  });
  const [channelHistories, setChannelHistories] = useState<
    Record<AgentId, Array<{ sender: 'user' | AgentId; text: string; time: string; handover?: string; isCommand?: boolean }>>
  >({
    commander: [
      {
        sender: 'commander',
        text: 'ARCHON-0 Commander online. I govern the Triad collective. Instruct me on your overarching career goals, and I will dispatch authoritative operational mandates to Scout, Strategist, and Envoy.',
        time: 'Just now',
        handover: 'Ready to command and arbitrate Scout, Strategist, and Envoy.',
        isCommand: true,
      },
    ],
    scout: [
      {
        sender: 'scout',
        text: 'ARC-1 Scout online. Standing by for Commander directives to scan 9 global tech nodes and stealth funding wires.',
        time: 'Just now',
        handover: 'Executing recon mandates from Commander and feeding validated target packages to Strategist.',
      },
    ],
    strategist: [
      {
        sender: 'strategist',
        text: 'NEXUS-2 Strategist initialized. I ingest Commander parameters and Scout market signals to construct 5-year trajectory vectors and leverage matrices.',
        time: 'Just now',
        handover: 'Ready to arm Envoy with game-theoretic compensation anchor scripts.',
      },
    ],
    envoy: [
      {
        sender: 'envoy',
        text: 'CIPHER-3 Envoy active. I translate Commander negotiation mandates into discreet recruiter counter-offers and stealth outreach.',
        time: 'Just now',
        handover: 'Reporting employer concession telemetry back to Scout and Commander.',
      },
    ],
  });

  // User mission input for collaborative run
  const [customMissionPrompt, setCustomMissionPrompt] = useState('');
  const [isRunningCycle, setIsRunningCycle] = useState(false);
  const [cycleStep, setCycleStep] = useState<number>(4); // 0 = Commander, 1 = Scout, 2 = Strategist, 3 = Envoy, 4 = Audit

  // Fetch initial data
  useEffect(() => {
    fetch('/api/triad/assistants')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setAssistants(data))
      .catch(() => {});

    fetch('/api/triad/messages')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setInterMessages(data))
      .catch(() => {});
  }, []);

  // Auto-generate live founder bio when owner opens the Founder Bio tab
  useEffect(() => {
    if (isOwner && activeView === 'founder_bio' && !bioResult && !isGeneratingBio && !bioError) {
      handleRegenerateBio();
    }
  }, [isOwner, activeView]);

  // Dispatch an explicit authoritative directive from Commander down to the Triad
  const handleDispatchCommanderDirective = (directive: CommanderDirective | { target: 'collective' | 'scout' | 'strategist' | 'envoy'; title: string; instruction: string }) => {
    const timestamp = new Date().toLocaleTimeString();
    const newMsg: InterAgentMessage = {
      id: `IAM-${Date.now()}`,
      fromAgent: 'commander',
      toAgent: directive.target,
      timestamp,
      actionType: 'COMMAND',
      headline: `COMMANDER DIRECTIVE: ${directive.title}`,
      details: directive.instruction,
      confidence: 99,
    };

    setInterMessages((prev) => [newMsg, ...prev]);
    setLastDispatchedDirective(`Directive dispatched to ${directive.target.toUpperCase()} at ${timestamp}`);
    setTimeout(() => setLastDispatchedDirective(null), 4000);

    // If collective directive, trigger a live cycle run
    if (directive.target === 'collective') {
      if (!isPro) {
        openPaywall('Autonomous 4-Agent AI Triad Mission Execution & Inter-Agent Bus');
        return;
      }
      handleExecuteCycle(directive.instruction);
    }
  };

  // Synthesize real investor-ready founder biography via /api/owner/founder-bio
  const handleRegenerateBio = async (
    newTone?: 'institutional_pe' | 'tech_strategic' | 'recruiting_agency',
    newTitle?: string
  ) => {
    if (!isOwner || isGeneratingBio) return;
    setIsGeneratingBio(true);
    setBioError(null);
    const selectedTone = newTone || bioTone;
    const selectedTitle = newTitle || bioTitle;

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error('Verified owner authentication token is required to synthesize M&A founder bio.');
      }
      const res = await fetch('/api/owner/founder-bio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          founderTitle: selectedTitle,
          focusTone: selectedTone,
          sellerCountry: bioCountry,
          cloudRegion: bioCloudRegion,
          askingPrice: bioAskingPrice,
          monthlyOperatingCost: bioMonthlyCost,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error ||
            'Failed to synthesize Founder Biography. Configure GEMINI_API_KEY in Settings > Secrets.'
        );
      }
      setBioResult(data);
    } catch (err: any) {
      setBioError(
        err?.message ||
          'Unable to synthesize live founder biography via /api/owner/founder-bio.'
      );
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleCopyBioText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBioKey(key);
    setTimeout(() => setCopiedBioKey(null), 2500);
  };

  const handleDownloadBioFile = () => {
    if (!bioResult) return;
    const fullText = `=== TALENT_RADAR.OS // INVESTOR-READY FOUNDER BIOGRAPHY ===
Generated: ${bioResult.generatedAt}
Focus Tone: ${bioTone.toUpperCase()}
Title: ${bioTitle}
Funding Status: 100% Bootstrapped / Self-Funded (Zero Debt, Zero Dilution)
Asking Price: $${bioAskingPrice.toLocaleString()} USD via Escrow.com Wire
Seller Location: ${bioCountry}
Hosting Region: ${bioCloudRegion}

--- 1. EXECUTIVE FOUNDER BIOGRAPHY ---
${bioResult.executiveBio}

--- 2. ACQUIRE.COM 150-WORD MARKETPLACE TEASER ---
${bioResult.shortTeaser}

--- 3. WHY I AM SELLING (THE #1 QUESTION BUYERS ASK) ---
${bioResult.whySelling}

--- 4. KEY DILIGENCE & ACQUISITION BULLETS ---
${bioResult.investorDiligenceBullets.map((b) => `• ${b}`).join('\n')}

--- 5. RECOMMENDED SEARCH & PROFILE TAGS ---
${bioResult.recommendedTags.join(', ')}

--- 6. DEAL ROOM SPECIFICATION ---
${bioResult.dealRoomSummary}
`;
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TalentRadar-Investor-Founder-Bio-${bioTone}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleInjectIntoCommander = () => {
    if (!bioResult) return;
    const time = new Date().toLocaleTimeString();
    const briefingText = `[FOUNDER BIOGRAPHY BRIEFING INGESTED]:\n${bioResult.shortTeaser}\n\nKey Strengths: 100% Bootstrapped, $${bioMonthlyCost}/mo operating cost, $${bioAskingPrice.toLocaleString()} unencumbered IP sale via Escrow.com. Seller in ${bioCountry}, cloud in ${bioCloudRegion}.`;

    setChannelHistories((prev) => ({
      ...prev,
      commander: [
        ...prev.commander,
        {
          sender: 'user',
          text: briefingText,
          time,
        },
        {
          sender: 'commander',
          text: `ARCHON-0 ACKNOWLEDGED: Founder biography ingested into active mission memory. I have calibrated Scout, Strategist, and Envoy to enforce this bootstrapped narrative across all negotiation scripts and M&A buyer communications.`,
          time: 'Just now',
          isCommand: true,
        },
      ],
    }));

    const newMsg: InterAgentMessage = {
      id: `IAM-${Date.now()}`,
      fromAgent: 'commander',
      toAgent: 'collective',
      timestamp: time,
      actionType: 'VALIDATE',
      headline: `FOUNDER BIOGRAPHY & M&A POSITIONING MEMORANDUM VALIDATED`,
      details: `Triad collective instructed: Founder is a 100% self-funded developer with clean title. Enforce 98.2% gross margin and $145k buyout posture.`,
      confidence: 100,
    };
    setInterMessages((prev) => [newMsg, ...prev]);

    setInjectedIntoCommander(true);
    setTimeout(() => setInjectedIntoCommander(false), 3500);
  };

  // Execute Autonomous Co-operative Triad Cycle via Gemini 4 Hydrogen (/api/triad/operate)
  const handleExecuteCycle = async (promptToRun?: string) => {
    if (!isPro) {
      openPaywall('Autonomous 4-Agent AI Triad Mission Execution & Inter-Agent Bus');
      return;
    }
    const prompt = promptToRun || customMissionPrompt || 'Execute full talent reconnaissance, skill gap modeling, and counter-offer negotiation.';
    setIsRunningCycle(true);
    setCycleError(null);
    setCycleStep(0);

    const stepTimer1 = setTimeout(() => setCycleStep(1), 500);
    const stepTimer2 = setTimeout(() => setCycleStep(2), 1000);
    const stepTimer3 = setTimeout(() => setCycleStep(3), 1600);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (auth?.currentUser) {
        const token = await auth.currentUser.getIdToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch('/api/triad/operate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt }),
      });

      const cycleData = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          cycleData?.error ||
            'AI Triad synthesis failed. Configure GEMINI_API_KEY in Settings > Secrets.'
        );
      }

      setCurrentCycle(cycleData);

      const newMsg: InterAgentMessage = {
        id: `IAM-${Date.now()}`,
        fromAgent: 'commander',
        toAgent: 'collective',
        timestamp: new Date().toLocaleTimeString(),
        actionType: 'VALIDATE',
        headline: `COMMANDER VALIDATION: Mission approved for "${prompt.slice(0, 48)}..."`,
        details: cycleData.consensusSummary,
        confidence: 99,
      };
      setInterMessages((prev) => [newMsg, ...prev]);
    } catch (err: any) {
      setCycleError(
        err?.message ||
          'Triad orchestration failed. Ensure GEMINI_API_KEY is configured in Settings > Secrets.'
      );
    } finally {
      setCycleStep(4);
      setIsRunningCycle(false);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
    }
  };

  // Direct channel message send via /api/triad/chat (Gemini 4 Hydrogen + Live ATS Grounding)
  const handleSendDirectMessage = async (agentId: AgentId) => {
    const text = channelInputs[agentId].trim();
    if (!text || sendingAgentId) return;

    const userMessage = {
      sender: 'user' as const,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...channelHistories[agentId], userMessage];
    setChannelHistories((prev) => ({
      ...prev,
      [agentId]: updatedHistory,
    }));
    setChannelInputs((prev) => ({ ...prev, [agentId]: '' }));
    setSendingAgentId(agentId);
    setChannelError(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (auth?.currentUser) {
        const token = await auth.currentUser.getIdToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch('/api/triad/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          agentId,
          message: text,
          history: updatedHistory.slice(-6).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.error ||
            'Agent channel synthesis failed. Configure GEMINI_API_KEY in Settings > Secrets.'
        );
      }

      const handoverSummary = data.handoverTarget
        ? `[→ ${String(data.handoverTarget).toUpperCase()} | ${data.confidence || 95}% conf] ${data.handoverNote || ''}`
        : data.handoverNote;

      setChannelHistories((prev) => ({
        ...prev,
        [agentId]: [
          ...prev[agentId],
          {
            sender: agentId,
            text: data.reply || 'Directive acknowledged.',
            time: 'Just now',
            handover: handoverSummary,
            isCommand: agentId === 'commander',
          },
        ],
      }));
    } catch (err: any) {
      setChannelError(
        err?.message ||
          'Direct agent chat failed. Ensure GEMINI_API_KEY is configured in Settings > Secrets.'
      );
    } finally {
      setSendingAgentId(null);
    }
  };

  const commanderAgent = assistants.find((a) => a.id === 'commander') || assistants[0];
  const triadMembers = assistants.filter((a) => a.id !== 'commander');
  const selectedAgent = assistants.find((a) => a.id === selectedAgentId) || assistants[0];

  return (
    <div className="space-y-6">
      {/* COMMAND HIERARCHY HERO BANNER */}
      <div className="panel bg-gradient-to-br from-[#120d1c] via-[#111a22] to-[#142330] border border-purple-500/30 rounded-xl p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#1e2b36]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold tracking-wider flex items-center gap-1">
                <Crown className="w-3 h-3 text-purple-400" />
                COMMANDER &amp; OPERATIONAL TRIAD
              </span>
              <span className="text-xs font-mono text-[#7a8b99]">
                4 COEXISTING AI INTEL AGENTS
              </span>
            </div>
            <h2 className="text-xl font-bold font-mono text-[#dce7f0] mt-1 flex items-center gap-2">
              <Workflow className="w-5 h-5 text-purple-400" />
              AI COMMANDER &amp; TRIAD ORCHESTRATION HIERARCHY
            </h2>
            <p className="text-xs text-[#7a8b99] font-mono mt-0.5">
              Commander (Tier 0) issues authoritative mandates and governs the Triad (Scout, Strategist, Envoy) in an autonomous co-operating loop.
            </p>
          </div>

          {/* Operational Mode Tabs */}
          <div className="flex items-center gap-1.5 bg-[#0a0f14] p-1.5 rounded-lg border border-[#1e2b36] text-xs font-mono">
            <button
              onClick={() => setActiveView('cooperation')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                activeView === 'cooperation'
                  ? 'bg-purple-600 text-white font-semibold shadow'
                  : 'text-[#7a8b99] hover:text-[#dce7f0]'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>Hierarchical Cycle</span>
            </button>

            <button
              onClick={() => setActiveView('direct_channels')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                activeView === 'direct_channels'
                  ? 'bg-[#3b82f6] text-white font-semibold shadow'
                  : 'text-[#7a8b99] hover:text-[#dce7f0]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Direct Channels (4)</span>
            </button>

            <button
              onClick={() => setActiveView('inter_bus')}
              className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                activeView === 'inter_bus'
                  ? 'bg-[#fbbf24] text-black font-semibold shadow'
                  : 'text-[#7a8b99] hover:text-[#dce7f0]'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Inter-Agent Bus ({interMessages.length})</span>
            </button>

            {isOwner && (
              <button
                onClick={() => setActiveView('founder_bio')}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 border ${
                  activeView === 'founder_bio'
                    ? 'bg-[#22d3a5] border-[#22d3a5] text-black font-bold shadow-[0_0_12px_rgba(34,211,165,0.3)]'
                    : 'border-[#22d3a5]/40 text-[#22d3a5] hover:bg-[#22d3a5]/10'
                }`}
                title="Generate Investor-Ready Founder Biography and Acquire.com Listing Pitch"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Founder Bio Helper</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                  activeView === 'founder_bio' ? 'bg-black/30 text-black' : 'bg-[#22d3a5]/20 text-[#22d3a5]'
                }`}>
                  ACQUIRE.COM
                </span>
              </button>
            )}
          </div>
        </div>

        {/* HIERARCHICAL NODE NETWORK: COMMANDER ON TOP -> TRIAD BELOW */}
        <div className="space-y-3 font-mono">
          {/* TIER 0: COMMANDER CARD */}
          <div
            onClick={() => setSelectedAgentId('commander')}
            className={`p-4 rounded-xl border bg-gradient-to-r from-[#170e28] via-[#111a22] to-[#121c27] transition-all cursor-pointer relative group ${
              selectedAgentId === 'commander'
                ? 'border-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.2)]'
                : 'border-purple-500/40 hover:border-purple-400'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 to-violet-900/60 border border-purple-400 text-purple-300 flex items-center justify-center font-bold text-sm shadow">
                  <Crown className="w-5 h-5 text-purple-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-[#dce7f0]">
                      {commanderAgent.name} ({commanderAgent.callsign})
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold uppercase">
                      TIER 0 SUPREME ORCHESTRATOR
                    </span>
                  </div>
                  <div className="text-xs text-purple-300/80 mt-0.5">
                    {commanderAgent.role}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex gap-3 text-right">
                  {commanderAgent.coreMetrics.map((m, i) => (
                    <div key={i} className="hidden sm:block">
                      <span className="text-[9px] text-[#7a8b99] block">{m.label}</span>
                      <span className="text-xs font-bold text-purple-300">{m.value}</span>
                    </div>
                  ))}
                </div>

                <span className="text-[10px] px-2.5 py-1 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold">
                  COMMANDING TRIAD
                </span>
              </div>
            </div>

            <p className="text-xs text-[#7a8b99] mt-2.5 leading-relaxed">
              <strong className="text-purple-300">Mandate:</strong> {commanderAgent.mission}
            </p>

            <div className="mt-3 pt-2.5 border-t border-[#1e2b36] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#7a8b99]">
              <div className="flex items-center gap-1.5 text-purple-300">
                <CornerDownRight className="w-3.5 h-3.5" />
                <span><strong>INSTRUCTS:</strong> Commands Scout on radar targets • Dictates Strategist roadmap • Calibrates Envoy negotiation</span>
              </div>
              <span className="text-xs text-[#22d3a5] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#22d3a5] animate-pulse" />
                Sub-Agents Synchronized
              </span>
            </div>
          </div>

          {/* HIERARCHY FLOW DIVIDER */}
          <div className="flex items-center justify-center gap-2 py-1 text-[10px] font-mono text-[#7a8b99]">
            <span className="w-12 h-px bg-purple-500/30" />
            <span className="text-purple-400 font-bold flex items-center gap-1">
              ▼ COMMANDER DIRECTIVES DISPATCHED DOWN TO OPERATIONAL TRIAD ▼
            </span>
            <span className="w-12 h-px bg-purple-500/30" />
          </div>

          {/* TIER 1: THE 3 OPERATIONAL TRIAD SPECIALISTS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {triadMembers.map((agent) => {
              const isTargeted = selectedAgentId === agent.id;
              return (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`p-4 rounded-xl border bg-[#0a0f14] transition-all cursor-pointer relative group ${
                    isTargeted
                      ? `border-[${agent.accentHex}] shadow-[0_0_14px_rgba(34,211,165,0.12)]`
                      : 'border-[#1e2b36] hover:border-[#3b82f6]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs bg-gradient-to-br ${agent.avatarColor} border`}
                      >
                        {agent.callsign.split('-')[1]}
                      </div>
                      <div>
                        <div className="text-sm font-bold font-mono text-[#dce7f0]">
                          {agent.name}
                        </div>
                        <div className="text-[10px] font-mono text-[#7a8b99]">
                          CALLSIGN: {agent.callsign}
                        </div>
                      </div>
                    </div>

                    <span
                      className="text-[9px] font-mono px-2 py-0.5 rounded border font-semibold"
                      style={{
                        color: agent.accentHex,
                        borderColor: `${agent.accentHex}40`,
                        backgroundColor: `${agent.accentHex}15`,
                      }}
                    >
                      {agent.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#dce7f0] font-mono font-medium mb-1">
                    {agent.role}
                  </div>

                  <p className="text-[11px] text-[#7a8b99] line-clamp-2 leading-relaxed mb-3">
                    {agent.mission}
                  </p>

                  {/* Operates for */}
                  <div className="p-2 rounded bg-[#111a22] border border-[#1e2b36] text-[10px] font-mono">
                    <span className="text-[#3b82f6] font-semibold block mb-0.5">
                      COMMANDED BY ARCHON-0 &amp; REPORTS TO:
                    </span>
                    <span className="text-[#dce7f0]">{agent.operatesFor}</span>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-1 mt-3 pt-2 border-t border-[#1e2b36]/60 text-[10px] font-mono">
                    {agent.coreMetrics.map((m, mIdx) => (
                      <div key={mIdx}>
                        <span className="text-[#7a8b99] block text-[9px] truncate">
                          {m.label}
                        </span>
                        <span className="text-[#dce7f0] font-semibold truncate block">
                          {m.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Data Highway Visualizer */}
        <div className="mt-4 pt-3 border-t border-[#1e2b36] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#7a8b99]">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-400" />
            <span className="text-[#dce7f0]">COMMAND &amp; PEER FEEDBACK FLOW:</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-purple-400 font-bold">COMMANDER</span>
            <span>──(Mandate)──►</span>
            <span className="text-[#22d3a5] font-semibold">SCOUT</span>
            <span>──(Signals)──►</span>
            <span className="text-[#3b82f6] font-semibold">STRATEGIST</span>
            <span>──(Leverage)──►</span>
            <span className="text-[#fbbf24] font-semibold">ENVOY</span>
            <span>──(Friction Telemetry)──►</span>
            <span className="text-purple-400 font-bold">COMMANDER</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#22d3a5]">
            <span className="w-2 h-2 rounded-full bg-[#22d3a5] animate-pulse" />
            <span>HIERARCHY ALIGNMENT: 99.4%</span>
          </div>
        </div>
      </div>

      {/* VIEW 1: CO-OPERATIVE HIERARCHICAL CYCLE */}
      {activeView === 'cooperation' && (
        <div className="space-y-6">
          {/* COMMANDER DIRECTIVE DISPATCH CONSOLE */}
          <div className="panel bg-[#111a22] border border-purple-500/40 rounded-xl p-5 shadow-xl font-mono">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-[#1e2b36] gap-2">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-400" />
                <div>
                  <h3 className="text-base font-bold text-[#dce7f0]">
                    COMMANDER'S DIRECTIVE DISPATCH CONSOLE
                  </h3>
                  <p className="text-xs text-[#7a8b99]">
                    Issue top-down instructions to the entire Triad or target a specific sub-assistant.
                  </p>
                </div>
              </div>
              {lastDispatchedDirective && (
                <span className="text-xs px-2.5 py-1 rounded bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/40 animate-fade">
                  {lastDispatchedDirective}
                </span>
              )}
            </div>

            {/* Target Selector & Command Input */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[#7a8b99]">COMMAND TARGET:</span>
                {(['collective', 'scout', 'strategist', 'envoy'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setDirectiveTarget(t)}
                    className={`px-3 py-1 rounded-lg border transition uppercase font-bold text-[11px] ${
                      directiveTarget === t
                        ? t === 'collective'
                          ? 'bg-purple-600 text-white border-purple-500'
                          : t === 'scout'
                          ? 'bg-[#22d3a5] text-black border-[#22d3a5]'
                          : t === 'strategist'
                          ? 'bg-[#3b82f6] text-white border-[#3b82f6]'
                          : 'bg-[#fbbf24] text-black border-[#fbbf24]'
                        : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
                    }`}
                  >
                    {t === 'collective' ? '★ Collective Triad (All 3)' : `→ ${t}`}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={commanderCustomInstruction || customMissionPrompt}
                  onChange={(e) => {
                    setCommanderCustomInstruction(e.target.value);
                    setCustomMissionPrompt(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const text = commanderCustomInstruction || customMissionPrompt;
                      if (text.trim()) {
                        handleDispatchCommanderDirective({
                          target: directiveTarget,
                          title: `Ad-Hoc Directive to ${directiveTarget.toUpperCase()}`,
                          instruction: text,
                        });
                      }
                    }
                  }}
                  placeholder={`Issue Commander instruction to ${directiveTarget.toUpperCase()} (e.g. Focus on >$320k distributed systems and enforce accelerated vesting)...`}
                  className="flex-1 bg-[#0a0f14] border border-[#1e2b36] focus:border-purple-400 text-[#dce7f0] placeholder-[#7a8b99] text-xs font-mono rounded-lg px-3 py-2.5 outline-none"
                />
                <button
                  onClick={() => {
                    const text = commanderCustomInstruction || customMissionPrompt;
                    if (text.trim()) {
                      handleDispatchCommanderDirective({
                        target: directiveTarget,
                        title: `Executive Mandate to ${directiveTarget.toUpperCase()}`,
                        instruction: text,
                      });
                    }
                  }}
                  disabled={isRunningCycle}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 shadow"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRunningCycle ? 'animate-spin' : ''}`} />
                  {isRunningCycle ? 'TRIAD EXECUTING...' : 'DISPATCH COMMAND'}
                </button>
              </div>

              {/* Ready-to-fire Preset Directives */}
              <div className="pt-2 border-t border-[#1e2b36]">
                <div className="text-[11px] text-[#7a8b99] mb-1.5 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-purple-400" />
                  <span>PRESET COMMANDER AUTHORIZATIONS:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {PRESET_COMMANDER_DIRECTIVES.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setDirectiveTarget(d.target);
                        setCommanderCustomInstruction(d.instruction);
                        handleDispatchCommanderDirective(d);
                      }}
                      className="p-2.5 rounded-lg bg-[#0a0f14] hover:bg-[#161226] border border-[#1e2b36] hover:border-purple-500/50 text-left transition flex flex-col justify-between group"
                    >
                      <div className="flex items-center justify-between text-[10px] mb-1">
                        <span className="font-bold text-purple-400 truncate">{d.title}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            d.priority === 'CRITICAL'
                              ? 'bg-[#f87171]/20 text-[#f87171]'
                              : d.priority === 'HIGH'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-[#fbbf24]/20 text-[#fbbf24]'
                          }`}
                        >
                          {d.priority}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#7a8b99] line-clamp-2 leading-relaxed">
                        {d.instruction}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* REAL-TIME COMMAND & HANDOVER STEPPER */}
          {isRunningCycle && (
            <div className="panel bg-[#0a0f14] border border-purple-500/40 rounded-xl p-4 shadow animate-pulse font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs mb-3">
                <span className="text-purple-400 font-semibold flex items-center gap-2">
                  <Workflow className="w-4 h-4 animate-spin" />
                  HIERARCHICAL COMMAND EXECUTION IN PROGRESS
                </span>
                <span className="text-[#7a8b99]">Phase {cycleStep + 1} of 5 in progression</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                <div
                  className={`p-2.5 rounded-lg border ${
                    cycleStep === 0
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                      : 'bg-[#111a22] border-[#1e2b36] text-[#7a8b99]'
                  }`}
                >
                  <div className="font-bold">0. COMMANDER</div>
                  <div className="text-[10px]">Formulating Mandate...</div>
                </div>

                <div
                  className={`p-2.5 rounded-lg border ${
                    cycleStep === 1
                      ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5]'
                      : 'bg-[#111a22] border-[#1e2b36] text-[#7a8b99]'
                  }`}
                >
                  <div className="font-bold">1. SCOUT (ARC-1)</div>
                  <div className="text-[10px]">Scanning Radar Signals...</div>
                </div>

                <div
                  className={`p-2.5 rounded-lg border ${
                    cycleStep === 2
                      ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]'
                      : 'bg-[#111a22] border-[#1e2b36] text-[#7a8b99]'
                  }`}
                >
                  <div className="font-bold">2. STRATEGIST</div>
                  <div className="text-[10px]">Computing Gap Roadmap...</div>
                </div>

                <div
                  className={`p-2.5 rounded-lg border ${
                    cycleStep === 3
                      ? 'bg-[#fbbf24]/20 border-[#fbbf24] text-[#fbbf24]'
                      : 'bg-[#111a22] border-[#1e2b36] text-[#7a8b99]'
                  }`}
                >
                  <div className="font-bold">3. ENVOY</div>
                  <div className="text-[10px]">Simulating Negotiation...</div>
                </div>

                <div
                  className={`p-2.5 rounded-lg border ${
                    cycleStep === 4
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                      : 'bg-[#111a22] border-[#1e2b36] text-[#7a8b99]'
                  }`}
                >
                  <div className="font-bold">4. AUDIT &amp; GO</div>
                  <div className="text-[10px]">Validating Consensus...</div>
                </div>
              </div>
            </div>
          )}

          {cycleError && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cycleError}</span>
            </div>
          )}

          {!currentCycle && !isRunningCycle ? (
            <div className="panel bg-[#111a22] border border-purple-500/30 rounded-xl p-6 space-y-4 font-mono">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-[#dce7f0] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    AUTONOMOUS GEMINI 4 HYDROGEN TRIAD CYCLE
                  </h4>
                  <p className="text-xs text-[#7a8b99] mt-1">
                    Launch a live multi-agent orchestration cycle grounded in our 14-board ATS snapshot, or select a strategic mission preset below.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleExecuteCycle()}
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shrink-0"
                >
                  <Zap className="w-4 h-4" />
                  <span>RUN LIVE TRIAD CYCLE</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {PRESET_TRIAD_MISSIONS.filter((m) => (m.ownerOnly ? isOwner : true)).map((mission) => (
                  <button
                    key={mission.id}
                    type="button"
                    onClick={() => {
                      setCustomMissionPrompt(mission.prompt);
                      handleExecuteCycle(mission.prompt);
                    }}
                    className="p-3 rounded-lg bg-[#0a0f14] hover:bg-[#161226] border border-[#1e2b36] hover:border-purple-500/50 text-left transition cursor-pointer"
                  >
                    <div className="text-xs font-bold text-purple-300 mb-1">{mission.title}</div>
                    <div className="text-[11px] text-[#7a8b99]">{mission.description}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : currentCycle && (
            <>
              {/* COMMANDER'S EXECUTIVE MANDATE BANNER */}
              <div className="panel bg-[#140e24] border border-purple-500/40 rounded-xl p-5 shadow-lg font-mono">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2b36]">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-purple-400" />
                    <h4 className="text-sm font-bold text-purple-300">
                      COMMANDER&apos;S STRATEGIC MANDATE (ARCHON-0)
                    </h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                    GEMINI 4 HYDROGEN LIVE DISPATCH
                  </span>
                </div>

                <p className="text-xs text-[#dce7f0] leading-relaxed mb-4">
                  {currentCycle.commanderDirective?.intent}
                </p>

                {/* Sub-Directives to each of the 3 assistants */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#0a0f14] border border-[#22d3a5]/30 space-y-1">
                    <span className="text-[10px] text-[#22d3a5] font-bold block">
                      ORDER TO SCOUT:
                    </span>
                    <p className="text-[11px] text-[#dce7f0] leading-relaxed">
                      {currentCycle.commanderDirective?.targetInstructions?.toScout}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0a0f14] border border-[#3b82f6]/30 space-y-1">
                    <span className="text-[10px] text-[#3b82f6] font-bold block">
                      ORDER TO STRATEGIST:
                    </span>
                    <p className="text-[11px] text-[#dce7f0] leading-relaxed">
                      {currentCycle.commanderDirective?.targetInstructions?.toStrategist}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0a0f14] border border-[#fbbf24]/30 space-y-1">
                    <span className="text-[10px] text-[#fbbf24] font-bold block">
                      ORDER TO ENVOY:
                    </span>
                    <p className="text-[11px] text-[#dce7f0] leading-relaxed">
                      {currentCycle.commanderDirective?.targetInstructions?.toEnvoy}
                    </p>
                  </div>
                </div>
              </div>

              {/* THE TRIAD'S EXECUTED CONTRIBUTIONS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-mono">
                <div className="panel bg-[#111a22] border border-[#22d3a5]/30 rounded-xl p-5 shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2b36]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#22d3a5]" />
                        <h4 className="text-sm font-bold text-[#22d3a5]">
                          1. SCOUT&apos;S RECON FINDINGS
                        </h4>
                      </div>
                      <span className="text-[10px] text-[#7a8b99]">
                        PASSED TO STRATEGIST
                      </span>
                    </div>

                    <div className="bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36] text-xs text-[#dce7f0] whitespace-pre-line leading-relaxed">
                      {currentCycle.scoutContribution}
                    </div>
                  </div>

                  {onNavigateToNews && (
                    <button
                      onClick={() => onNavigateToNews('Anthropic & OpenAI Ecosystem', 'Frontier AI & High-Performance Compute')}
                      className="mt-3 w-full py-1.5 px-2.5 rounded bg-[#0a0f14] hover:bg-[#1a2836] border border-[#1e2b36] text-[11px] text-[#22d3a5] flex items-center justify-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Discovered Wire Signals</span>
                    </button>
                  )}
                </div>

                <div className="panel bg-[#111a22] border border-[#3b82f6]/30 rounded-xl p-5 shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2b36]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                        <h4 className="text-sm font-bold text-[#3b82f6]">
                          2. STRATEGIST&apos;S MODEL
                        </h4>
                      </div>
                      <span className="text-[10px] text-[#7a8b99]">
                        PASSED TO ENVOY
                      </span>
                    </div>

                    <div className="bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36] text-xs text-[#dce7f0] whitespace-pre-line leading-relaxed">
                      {currentCycle.strategistContribution}
                    </div>
                  </div>

                  {onNavigateToCareer && (
                    <button
                      onClick={() => onNavigateToCareer('Principal AI Systems Architect', 320000)}
                      className="mt-3 w-full py-1.5 px-2.5 rounded bg-[#0a0f14] hover:bg-[#1a2836] border border-[#1e2b36] text-[11px] text-[#3b82f6] flex items-center justify-center gap-1.5 transition"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Load into Career Calculator</span>
                    </button>
                  )}
                </div>

                <div className="panel bg-[#111a22] border border-[#fbbf24]/30 rounded-xl p-5 shadow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2b36]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" />
                        <h4 className="text-sm font-bold text-[#fbbf24]">
                          3. ENVOY&apos;S PLAYBOOK
                        </h4>
                      </div>
                      <span className="text-[10px] text-[#7a8b99]">
                        REPORTED TO COMMANDER
                      </span>
                    </div>

                    <div className="bg-[#0a0f14] p-3 rounded-lg border border-[#1e2b36] text-xs text-[#dce7f0] whitespace-pre-line leading-relaxed">
                      {currentCycle.envoyContribution}
                    </div>
                  </div>

                  {isOwner && onNavigateToComms && (
                    <button
                      onClick={onNavigateToComms}
                      className="mt-3 w-full py-1.5 px-2.5 rounded bg-[#0a0f14] hover:bg-[#1a2836] border border-[#1e2b36] text-[11px] text-[#fbbf24] flex items-center justify-center gap-1.5 transition"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Open Encrypted Comms Channel</span>
                    </button>
                  )}
                </div>
              </div>

              {/* COMMANDER'S FINAL EXECUTIVE REVIEW & AUDIT */}
              <div className="panel bg-gradient-to-br from-[#120e22] via-[#111a22] to-[#0f1720] border border-purple-500/40 rounded-xl p-5 shadow-xl font-mono">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-[#1e2b36]">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-400" />
                    <h3 className="text-base font-bold text-[#dce7f0]">
                      COMMANDER&apos;S AUDIT &amp; VALIDATED CONSENSUS
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-purple-300 px-2.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 font-bold">
                      AUDIT SCORE: {currentCycle.commanderReview?.auditScore || 98}/100
                    </span>
                    <span className="text-xs text-[#22d3a5] px-2.5 py-0.5 rounded bg-[#22d3a5]/10 border border-[#22d3a5]/30">
                      {currentCycle.commanderReview?.riskMitigationStatus || 'GREEN'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-xs text-[#dce7f0] leading-relaxed mb-4">
                  <span className="text-purple-400 font-bold block mb-1">EXECUTIVE VERDICT:</span>
                  {currentCycle.commanderReview?.strategicVerdict || currentCycle.consensusSummary}
                </div>

                <div>
                  <span className="text-xs font-bold text-[#7a8b99] block mb-2">
                    SYNCHRONIZED MULTI-AGENT ACTION CHECKLIST:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {currentCycle.actionChecklist.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded bg-[#0a0f14] border border-[#1e2b36] flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#22d3a5] shrink-0 mt-0.5" />
                        <span className="text-[#dce7f0]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* VIEW 2: DIRECT SUB-CHANNELS WITH ALL 4 CO-OPERATING ASSISTANTS */}
      {activeView === 'direct_channels' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-mono">
          {/* Agent Selector Sidebar */}
          <div className="lg:col-span-4 space-y-2.5">
            <div className="text-xs text-[#7a8b99] px-1 pb-1">
              SELECT AI ASSISTANT FOR DEDICATED CHANNEL (4):
            </div>
            {assistants.map((agent) => (
              <div
                key={agent.id}
                onClick={() => setSelectedAgentId(agent.id)}
                className={`panel p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedAgentId === agent.id
                    ? agent.id === 'commander'
                      ? 'bg-[#181128] border-purple-500 shadow-[0_0_14px_rgba(168,85,247,0.25)]'
                      : 'bg-[#152330] border-[#22d3a5] shadow-[0_0_12px_rgba(34,211,165,0.15)]'
                    : 'bg-[#111a22] border-[#1e2b36] hover:border-[#3b82f6]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-bold text-sm text-[#dce7f0] flex items-center gap-1.5">
                    {agent.id === 'commander' && <Crown className="w-4 h-4 text-purple-400" />}
                    <span>{agent.name}</span>
                  </div>
                  <span
                    className="text-[9px] px-2 py-0.5 rounded font-semibold border"
                    style={{
                      color: agent.accentHex,
                      borderColor: `${agent.accentHex}40`,
                      backgroundColor: `${agent.accentHex}15`,
                    }}
                  >
                    {agent.callsign}
                  </span>
                </div>
                <div className="text-xs text-[#7a8b99]">{agent.role}</div>
                <div className="text-[11px] text-[#3b82f6] mt-2 pt-2 border-t border-[#1e2b36]">
                  {agent.id === 'commander' ? 'Instructs: Scout, Strategist, Envoy' : `Operates for: ${agent.operatesFor}`}
                </div>
              </div>
            ))}
          </div>

          {/* Dedicated Chat Console */}
          <div className="lg:col-span-8 panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg flex flex-col h-[580px]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1e2b36]">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-gradient-to-br ${selectedAgent.avatarColor} border`}
                >
                  {selectedAgent.id === 'commander' ? <Crown className="w-4 h-4" /> : selectedAgent.callsign.split('-')[1]}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#dce7f0]">
                    DEDICATED CHANNEL: {selectedAgent.name.toUpperCase()} ({selectedAgent.callsign})
                  </h3>
                  <div className="text-[10px] text-[#7a8b99]">
                    {selectedAgent.id === 'commander'
                      ? 'Supreme Commander • Governs and instructs the other 3 assistants'
                      : 'Specialist Assistant • Operating under Commander authority and assisted by peers'}
                  </div>
                </div>
              </div>
              <span
                className="text-[10px] px-2 py-0.5 rounded border font-semibold"
                style={{
                  color: selectedAgent.accentHex,
                  borderColor: `${selectedAgent.accentHex}40`,
                  backgroundColor: `${selectedAgent.accentHex}15`,
                }}
              >
                {selectedAgent.tier}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {channelHistories[selectedAgentId].map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl text-xs border ${
                    msg.sender === 'user'
                      ? 'bg-[#0a0f14] border-[#3b82f6]/40 text-[#dce7f0] ml-8'
                      : msg.isCommand
                      ? 'bg-[#181028] border-purple-500/40 text-[#dce7f0] mr-4'
                      : 'bg-[#0e161e] border-[#1e2b36] text-[#dce7f0] mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-[#7a8b99] mb-1.5">
                    <span
                      className="font-semibold"
                      style={{
                        color: msg.sender === 'user' ? '#22d3a5' : selectedAgent.accentHex,
                      }}
                    >
                      {msg.sender === 'user'
                        ? 'YOU (OPERATOR)'
                        : `${selectedAgent.name.toUpperCase()} (${selectedAgent.callsign})`}
                    </span>
                    <span>{msg.time}</span>
                  </div>
                  <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>

                  {msg.handover && (
                    <div className="mt-2.5 pt-2 border-t border-[#1e2b36] flex items-center gap-1.5 text-[10px] text-[#3b82f6]">
                      <ArrowRight className="w-3 h-3 text-[#22d3a5]" />
                      <span>{msg.handover}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {channelError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{channelError}</span>
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendDirectMessage(selectedAgentId);
              }}
              className="mt-4 pt-3 border-t border-[#1e2b36] flex gap-2"
            >
              <input
                type="text"
                value={channelInputs[selectedAgentId]}
                onChange={(e) =>
                  setChannelInputs({
                    ...channelInputs,
                    [selectedAgentId]: e.target.value,
                  })
                }
                placeholder={
                  selectedAgent.id === 'commander'
                    ? 'Instruct Commander to orchestrate a career campaign across Scout, Strategist, and Envoy...'
                    : `Instruct ${selectedAgent.name} (Gemini 4 Hydrogen + live ATS context)...`
                }
                className="flex-1 bg-[#0a0f14] border border-[#1e2b36] focus:border-purple-400 text-[#dce7f0] text-xs font-mono rounded-lg px-3 py-2 outline-none"
              />
              <button
                type="submit"
                disabled={!channelInputs[selectedAgentId].trim() || sendingAgentId === selectedAgentId}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs font-mono rounded-lg flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingAgentId === selectedAgentId ? 'SYNTHESIZING...' : 'TRANSMIT'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* VIEW 3: LIVE INTER-AGENT BUS (WIRETAP) */}
      {activeView === 'inter_bus' && (
        <div className="panel bg-[#111a22] border border-[#1e2b36] rounded-xl p-5 shadow-lg space-y-4 font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1e2b36]">
            <div>
              <h3 className="text-base font-bold text-[#dce7f0] flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#fbbf24]" />
                INTER-AGENT TELEMETRY BUS // REAL-TIME WIRETAP
              </h3>
              <p className="text-xs text-[#7a8b99]">
                Inspect live machine-to-machine directives from Commander, peer handovers between Scout and Strategist, and recruiter reports from Envoy.
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30">
              BUFFER CAPACITY: 100%
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {interMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3.5 rounded-xl border transition ${
                  msg.fromAgent === 'commander'
                    ? 'bg-[#160f26] border-purple-500/50'
                    : 'bg-[#0a0f14] border-[#1e2b36] hover:border-[#3b82f6]/40'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-1.5 border-b border-[#1e2b36]/60">
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="text-[#7a8b99]">{msg.id}</span>
                    <span className="text-[#7a8b99]">• {msg.timestamp}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                        msg.actionType === 'COMMAND' || msg.actionType === 'VALIDATE'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : msg.actionType === 'HANDOVER'
                          ? 'bg-[#22d3a5]/20 text-[#22d3a5]'
                          : msg.actionType === 'DELEGATE'
                          ? 'bg-[#3b82f6]/20 text-[#3b82f6]'
                          : 'bg-[#fbbf24]/20 text-[#fbbf24]'
                      }`}
                    >
                      {msg.actionType}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span
                      className="font-bold"
                      style={{
                        color:
                          msg.fromAgent === 'commander'
                            ? '#a855f7'
                            : msg.fromAgent === 'scout'
                            ? '#22d3a5'
                            : msg.fromAgent === 'strategist'
                            ? '#3b82f6'
                            : '#fbbf24',
                      }}
                    >
                      {msg.fromAgent.toUpperCase()}
                    </span>
                    <ArrowRight className="w-3 h-3 text-[#7a8b99]" />
                    <span className="text-[#dce7f0] font-bold">
                      {msg.toAgent.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-[#22d3a5] ml-2">
                      ({msg.confidence}% confidence)
                    </span>
                  </div>
                </div>

                <div className="font-bold text-[#dce7f0] mb-1">{msg.headline}</div>
                <p className="text-[#7a8b99] text-[11px] leading-relaxed">{msg.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          OPERATIONAL VIEW 4: INVESTOR-READY FOUNDER BIOGRAPHY HELPER (OWNER ONLY)
         ========================================================================= */}
      {isOwner && activeView === 'founder_bio' && (
        <div className="space-y-6 font-mono">
          {/* Header Banner */}
          <div className="p-5 rounded-xl bg-gradient-to-r from-[#0d1620] via-[#111a22] to-[#142330] border border-[#22d3a5]/40 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#22d3a5]/10 border border-[#22d3a5]/40 text-[#22d3a5] flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-wide">
                      INVESTOR-READY FOUNDER BIOGRAPHY &amp; M&amp;A POSITIONING HELPER
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/40 font-bold">
                      CURATION-READY
                    </span>
                  </div>
                  <p className="text-xs text-[#7a8b99]">
                    Synthesizes authoritative founder bios highlighting your self-funded developer background, $28.35/mo low operating costs, and clean $145k asset transfer.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="px-2.5 py-1 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30 font-bold">
                  ★ 100% BOOTSTRAPPED
                </span>
                <span className="px-2.5 py-1 rounded bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30 font-bold">
                  ZERO VENTURE DEBT
                </span>
                <span className="px-2.5 py-1 rounded bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30 font-bold">
                  $145K CLEAN IP BUYOUT
                </span>
              </div>
            </div>

            {/* Interactive Configuration Controls */}
            <div className="pt-3 border-t border-[#1e2b36] grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Buyer Tone / Target */}
              <div className="space-y-1">
                <label className="text-[11px] text-[#7a8b99] block font-bold">
                  TARGET BUYER TONE &amp; AUDIENCE:
                </label>
                <select
                  value={bioTone}
                  onChange={(e) => {
                    const newTone = e.target.value as any;
                    setBioTone(newTone);
                    handleRegenerateBio(newTone, bioTitle);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-xs text-[#dce7f0] focus:border-[#22d3a5] focus:outline-none"
                >
                  <option value="institutional_pe">Institutional Private Equity (ROI, Margins, Clean IP)</option>
                  <option value="tech_strategic">Technical Strategic Acquirer (Three.js, Stack, Architecture)</option>
                  <option value="recruiting_agency">Boutique Executive Search &amp; HR-Tech Agency</option>
                </select>
              </div>

              {/* Founder Title / Persona */}
              <div className="space-y-1">
                <label className="text-[11px] text-[#7a8b99] block font-bold">
                  FOUNDER TITLE / ROLE:
                </label>
                <select
                  value={bioTitle}
                  onChange={(e) => {
                    const newTitle = e.target.value;
                    setBioTitle(newTitle);
                    handleRegenerateBio(bioTone, newTitle);
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0f14] border border-[#1e2b36] text-xs text-[#dce7f0] focus:border-[#22d3a5] focus:outline-none"
                >
                  <option value="Full-Stack Systems Architect & Solo Founder">Full-Stack Systems Architect &amp; Solo Founder</option>
                  <option value="Quantitative Software Engineer & Systems Builder">Quantitative Software Engineer &amp; Systems Builder</option>
                  <option value="Product Engineer & Geospatial Visualizer">Product Engineer &amp; Geospatial Visualizer</option>
                  <option value="Solo Technical Founder & Micro-SaaS Builder">Solo Technical Founder &amp; Micro-SaaS Builder</option>
                </select>
              </div>

              {/* Regenerate Action */}
              <div className="flex items-end">
                <button
                  onClick={() => handleRegenerateBio()}
                  disabled={isGeneratingBio}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold text-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingBio ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingBio ? 'SYNTHESIZING...' : 'REGENERATE BIOGRAPHY'}</span>
                </button>
              </div>
            </div>

            {/* Quick Jurisdiction & Model Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-[#7a8b99]">
              <div>
                <strong className="text-white">Cloud Infrastructure:</strong> {bioCloudRegion}
              </div>
              <span className="text-[#1e2b36]">•</span>
              <div>
                <strong className="text-white">Seller Location:</strong> {bioCountry} (Escrow.com SWIFT wire ready)
              </div>
              <span className="text-[#1e2b36]">•</span>
              <div>
                <strong className="text-white">Operating Run-Rate:</strong> ${bioMonthlyCost}/mo (98.2% gross margin)
              </div>
            </div>
          </div>

          {bioError && (
            <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{bioError}</span>
            </div>
          )}

          {isGeneratingBio && !bioResult ? (
            <div className="p-10 rounded-xl bg-[#0a0f14] border border-[#22d3a5]/40 text-center space-y-2 text-[#22d3a5]">
              <RefreshCw className="w-6 h-6 mx-auto animate-spin" />
              <div className="text-xs font-bold">SYNTHESIZING INVESTOR FOUNDER BIO VIA GEMINI 4 HYDROGEN...</div>
            </div>
          ) : !bioResult ? (
            <div className="p-8 rounded-xl bg-[#0a0f14] border border-[#1e2b36] text-center space-y-3">
              <div className="text-xs text-[#7a8b99]">
                Click Regenerate Biography above to synthesize an M&amp;A dossier grounded in live ATS telemetry.
              </div>
              <button
                type="button"
                onClick={() => handleRegenerateBio()}
                className="px-4 py-2 rounded-lg bg-[#22d3a5] text-black font-bold text-xs cursor-pointer"
              >
                SYNTHESIZE FOUNDER BIO
              </button>
            </div>
          ) : (
            <>
              {/* Asset Section 1: Executive Founder Biography */}
              <div className="p-5 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-3 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1e2b36] pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#22d3a5]">
                        SECTION 1: EXECUTIVE FOUNDER BIOGRAPHY
                      </span>
                      <span className="text-[10px] px-2 py-0.2 rounded bg-[#22d3a5]/10 text-[#22d3a5] border border-[#22d3a5]/30">
                        FOR ACQUIRE.COM &quot;ABOUT THE SELLER&quot;
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mt-1">
                      {bioResult.headline}
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyBioText(bioResult.executiveBio, 'exec-bio')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111a22] hover:bg-[#1a2632] border border-[#1e2b36] hover:border-[#22d3a5] text-xs font-bold text-[#22d3a5] transition cursor-pointer active:scale-95 shrink-0"
                  >
                    {copiedBioKey === 'exec-bio' ? <Check className="w-3.5 h-3.5 text-[#22d3a5]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBioKey === 'exec-bio' ? 'COPIED TO CLIPBOARD' : 'COPY EXECUTIVE BIO'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-lg bg-[#0e1620] border border-[#1e2b36] text-xs text-[#cbd5e1] leading-relaxed space-y-3 whitespace-pre-line">
                  {bioResult.executiveBio}
                </div>
              </div>

              {/* Asset Section 2 & 3 in 2 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-[#0a0f14] border border-[#1e2b36] flex flex-col justify-between space-y-3 shadow-lg">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2 mb-3">
                      <span className="text-xs font-bold text-[#38bdf8]">
                        SECTION 2: 150-WORD LISTING TEASER
                      </span>
                      <button
                        onClick={() => handleCopyBioText(bioResult.shortTeaser, 'teaser')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#111a22] hover:bg-[#1a2632] border border-[#1e2b36] hover:border-[#38bdf8] text-[11px] font-bold text-[#38bdf8] transition cursor-pointer"
                      >
                        {copiedBioKey === 'teaser' ? <Check className="w-3 h-3 text-[#38bdf8]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedBioKey === 'teaser' ? 'COPIED' : 'COPY'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-[#cbd5e1] leading-relaxed p-3 rounded-lg bg-[#0e1620] border border-[#1e2b36]">
                      &quot;{bioResult.shortTeaser}&quot;
                    </p>
                  </div>
                  <span className="text-[10px] text-[#7a8b99]">
                    Ideal for Acquire.com browse cards, search snippets, and initial outreach teasers.
                  </span>
                </div>

                <div className="p-5 rounded-xl bg-[#0a0f14] border border-[#1e2b36] flex flex-col justify-between space-y-3 shadow-lg">
                  <div>
                    <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2 mb-3">
                      <span className="text-xs font-bold text-[#fbbf24]">
                        SECTION 3: &quot;WHY AM I SELLING?&quot; (THE #1 BUYER QUESTION)
                      </span>
                      <button
                        onClick={() => handleCopyBioText(bioResult.whySelling, 'why-selling')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#111a22] hover:bg-[#1a2632] border border-[#1e2b36] hover:border-[#fbbf24] text-[11px] font-bold text-[#fbbf24] transition cursor-pointer"
                      >
                        {copiedBioKey === 'why-selling' ? <Check className="w-3 h-3 text-[#fbbf24]" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedBioKey === 'why-selling' ? 'COPIED' : 'COPY'}</span>
                      </button>
                    </div>
                    <p className="text-xs text-[#cbd5e1] leading-relaxed p-3 rounded-lg bg-[#0e1620] border border-[#1e2b36]">
                      &quot;{bioResult.whySelling}&quot;
                    </p>
                  </div>
                  <span className="text-[10px] text-[#7a8b99]">
                    Answers why a clean, working SaaS is being sold without raising red flags for PE buyers.
                  </span>
                </div>
              </div>

              {/* Asset Section 4: 6 Key Diligence & Transfer Bullets */}
              <div className="p-5 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-3 shadow-lg">
                <div className="flex items-center justify-between border-b border-[#1e2b36] pb-3">
                  <span className="text-xs font-bold text-[#22d3a5]">
                    SECTION 4: 6 KEY DILIGENCE BULLETS FOR BUYER ROOM
                  </span>
                  <button
                    onClick={() =>
                      handleCopyBioText(
                        bioResult.investorDiligenceBullets.map((b) => `• ${b}`).join('\n'),
                        'diligence-bullets'
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111a22] hover:bg-[#1a2632] border border-[#1e2b36] hover:border-[#22d3a5] text-xs font-bold text-[#22d3a5] transition cursor-pointer"
                  >
                    {copiedBioKey === 'diligence-bullets' ? <Check className="w-3.5 h-3.5 text-[#22d3a5]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBioKey === 'diligence-bullets' ? 'COPIED' : 'COPY ALL 6 BULLETS'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-[#cbd5e1]">
                  {bioResult.investorDiligenceBullets.map((bullet, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#0e1620] border border-[#1e2b36] flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#22d3a5] shrink-0 mt-0.5" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Asset Section 5: Recommended Profile Tags */}
              <div className="p-4 rounded-xl bg-[#0a0f14] border border-[#1e2b36] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#94a3b8]">
                    RECOMMENDED SEARCH TAGS &amp; KEYWORDS FOR ACQUIRE.COM:
                  </span>
                  <button
                    onClick={() => handleCopyBioText(bioResult.recommendedTags.join(', '), 'tags')}
                    className="text-[11px] text-[#22d3a5] hover:underline"
                  >
                    {copiedBioKey === 'tags' ? 'COPIED TAGS' : 'COPY TAGS LIST'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {bioResult.recommendedTags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-md bg-[#111a22] border border-[#1e2b36] text-[#22d3a5] font-semibold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-[#0d1620] border border-[#1e2b36]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadBioFile}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111a22] hover:bg-[#1a2632] border border-[#1e2b36] hover:border-[#22d3a5] text-xs font-bold text-white transition active:scale-95 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#22d3a5]" />
                    <span>DOWNLOAD FULL DOSSIER (.TXT)</span>
                  </button>

                  <button
                    onClick={handleInjectIntoCommander}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold transition active:scale-95 cursor-pointer ${
                      injectedIntoCommander
                        ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5]'
                        : 'bg-[#111a22] hover:bg-[#1a2632] border-purple-500/50 text-purple-300'
                    }`}
                    title="Inject this biography into Archon-0 Commander's memory and inter-agent bus"
                  >
                    <Crown className="w-4 h-4 text-purple-400" />
                    <span>{injectedIntoCommander ? 'INJECTED INTO COMMANDER MEMORY' : 'INJECT INTO COMMANDER MEMORY'}</span>
                  </button>
                </div>

                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-walkthrough-video'))}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#22d3a5]/20 to-[#38bdf8]/20 border border-[#22d3a5] text-[#22d3a5] hover:bg-[#22d3a5]/30 text-xs font-bold transition cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-[#22d3a5]" />
                  <span>LAUNCH WALKTHROUGH VIDEO STUDIO</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
