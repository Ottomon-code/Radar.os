import React, { useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial } from '@react-three/drei';
import {
  Globe,
  Crosshair,
  MapPin,
  Radio,
  TrendingUp,
  DollarSign,
  Layers,
  Sparkles,
  X,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Activity
} from 'lucide-react';
import { LiveTechHubData, MarketRadarData } from '../types/marketRadar';

export interface CityHub {
  name: string;
  country: string;
  lat: number;
  lng: number;
  openings: number;
  salaryBand: string;
  coords: [number, number, number];
  openingsDelta24h?: string;
  hiringVelocity?: number;
  topSkills?: string[];
  dominantSector?: string;
  status?: string;
}

export interface MarketContinent {
  id: string;
  name: string;
  continent: string;
  primarySector: string;
  averageSalaryDisplay: string;
  averageSalaryUsd: number;
  salaryBand: string;
  openingsCount: string;
  hiringVelocity: string;
  topSkills: string[];
  topCompanies: string[];
  description: string;
  lat: number;
  lng: number;
  coords: [number, number, number];
  color: string;
}

// Convert spherical lat/lng to 3D Cartesian coordinates on unit sphere radius R
function latLngToVector3(lat: number, lng: number, radius = 1.15): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

export const GLOBAL_TECH_HUBS: CityHub[] = [
  { name: 'San Francisco', country: 'US', lat: 37.77, lng: -122.41, openings: 420, salaryBand: '$220k - $340k', coords: latLngToVector3(37.77, -122.41, 1.12) },
  { name: 'New York', country: 'US', lat: 40.71, lng: -74.00, openings: 380, salaryBand: '$210k - $320k', coords: latLngToVector3(40.71, -74.00, 1.12) },
  { name: 'London', country: 'UK', lat: 51.50, lng: -0.12, openings: 260, salaryBand: '£140k - £220k', coords: latLngToVector3(51.50, -0.12, 1.12) },
  { name: 'Zurich', country: 'CH', lat: 47.37, lng: 8.54, openings: 140, salaryBand: 'CHF 190k - 260k', coords: latLngToVector3(47.37, 8.54, 1.12) },
  { name: 'Tokyo', country: 'JP', lat: 35.67, lng: 139.65, openings: 190, salaryBand: '¥22M - ¥35M', coords: latLngToVector3(35.67, 139.65, 1.12) },
  { name: 'Singapore', country: 'SG', lat: 1.35, lng: 103.81, openings: 175, salaryBand: 'S$200k - S$300k', coords: latLngToVector3(1.35, 103.81, 1.12) },
  { name: 'Chicago', country: 'US', lat: 41.87, lng: -87.62, openings: 210, salaryBand: '$250k - $450k', coords: latLngToVector3(41.87, -87.62, 1.12) },
  { name: 'Berlin', country: 'DE', lat: 52.52, lng: 13.40, openings: 165, salaryBand: '€120k - €180k', coords: latLngToVector3(52.52, 13.40, 1.12) },
  { name: 'Seattle', country: 'US', lat: 47.60, lng: -122.33, openings: 340, salaryBand: '$215k - $330k', coords: latLngToVector3(47.60, -122.33, 1.12) },
  { name: 'Austin', country: 'US', lat: 30.27, lng: -97.74, openings: 310, salaryBand: '$200k - $320k', coords: latLngToVector3(30.27, -97.74, 1.12) },
  { name: 'Toronto', country: 'CA', lat: 43.65, lng: -79.38, openings: 245, salaryBand: 'C$180k - C$275k', coords: latLngToVector3(43.65, -79.38, 1.12) },
  { name: 'Bengaluru', country: 'IN', lat: 12.97, lng: 77.59, openings: 390, salaryBand: '₹4.5M - ₹8.5M', coords: latLngToVector3(12.97, 77.59, 1.12) },
  { name: 'Tel Aviv', country: 'IL', lat: 32.08, lng: 34.78, openings: 280, salaryBand: '₪550k - ₪850k', coords: latLngToVector3(32.08, 34.78, 1.12) },
  { name: 'Stockholm', country: 'SE', lat: 59.33, lng: 18.06, openings: 195, salaryBand: 'SEK 1.1M - 1.7M', coords: latLngToVector3(59.33, 18.06, 1.12) },
];

export const MARKET_CONTINENT_SPHERES: MarketContinent[] = [
  {
    id: 'na-pacific-ai',
    name: 'Pacific AI Corridor (Silicon Valley & Seattle)',
    continent: 'North America',
    primarySector: 'Frontier AI & Large Foundation Models',
    averageSalaryDisplay: '$285,000 USD / yr',
    averageSalaryUsd: 285000,
    salaryBand: '$240,000 – $420,000 + Top Carry',
    openingsCount: '540+ Active Stealth Requisitions',
    hiringVelocity: 'High Velocity (+34% YoY)',
    topSkills: ['CUDA', 'Triton', 'InfiniBand', 'Slurm Orchestration', 'PyTorch'],
    topCompanies: ['Anthropic', 'OpenAI', 'Meta FAIR', 'NVIDIA Deep Learning'],
    description: 'Global epicentre for foundation model training, multi-thousand GPU clusters, and custom inference compilation.',
    lat: 38.5,
    lng: -121.5,
    coords: latLngToVector3(38.5, -121.5, 1.16),
    color: '#22d3a5',
  },
  {
    id: 'na-east-quant',
    name: 'Wall Street & Northeast Corridor',
    continent: 'North America',
    primarySector: 'Quantitative Trading & Low-Latency Microstructure',
    averageSalaryDisplay: '$340,000 USD / yr',
    averageSalaryUsd: 340000,
    salaryBand: '$260,000 – $550,000 + Year-End Bonus',
    openingsCount: '420+ Active Quant Roles',
    hiringVelocity: 'Aggressive Hiring (+28% YoY)',
    topSkills: ['C++23', 'Solarflare DPDK', 'Market Microstructure', 'SIMD AVX-512'],
    topCompanies: ['Citadel Securities', 'Jane Street', 'Two Sigma', 'Hudson River Trading'],
    description: 'Sub-microsecond algorithmic order routing, kernel-bypass network drivers, and automated market making.',
    lat: 41.2,
    lng: -73.8,
    coords: latLngToVector3(41.2, -73.8, 1.16),
    color: '#38bdf8',
  },
  {
    id: 'na-texas-silicon',
    name: 'Texas Silicon Triangle (Austin & Dallas)',
    continent: 'North America',
    primarySector: 'Semiconductors & Custom Chip Architecture',
    averageSalaryDisplay: '$235,000 USD / yr',
    averageSalaryUsd: 235000,
    salaryBand: '$190,000 – $320,000 + Equity',
    openingsCount: '290+ Active Openings',
    hiringVelocity: 'Steady Growth (+22% YoY)',
    topSkills: ['SystemVerilog', 'PCIe Gen5 DMA', 'ASIC Synthesis', 'VHDL'],
    topCompanies: ['Tenstorrent', 'AMD Labs', 'Tesla Autopilot HW', 'Arm'],
    description: 'Next-generation RISC-V and neural accelerator silicon development with low-power thermal design.',
    lat: 30.3,
    lng: -97.7,
    coords: latLngToVector3(30.3, -97.7, 1.16),
    color: '#fbbf24',
  },
  {
    id: 'eu-west-london',
    name: 'London & Cambridge BioTech Arc',
    continent: 'Europe',
    primarySector: 'AI Alignment & Bio-Computational Chemistry',
    averageSalaryDisplay: '$240,000 USD (£185k / yr)',
    averageSalaryUsd: 240000,
    salaryBand: '£150,000 – £280,000 + Equity',
    openingsCount: '310+ Active Requisitions',
    hiringVelocity: 'High Demand (+26% YoY)',
    topSkills: ['PyTorch Geometric', 'CryoEM Simulation', 'Adversarial Red-Teaming', 'JAX'],
    topCompanies: ['Google DeepMind', 'Isomorphic Labs', 'Hermes Frontier AI'],
    description: 'Pioneering structural biology predictions, molecular dynamics, and rigorous safety evaluation suites.',
    lat: 52.1,
    lng: -0.2,
    coords: latLngToVector3(52.1, -0.2, 1.16),
    color: '#a855f7',
  },
  {
    id: 'eu-central-alps',
    name: 'Zurich & Munich DeepTech Alps',
    continent: 'Europe',
    primarySector: 'Autonomous Robotics & Computer Vision',
    averageSalaryDisplay: '$265,000 USD (CHF 235k / yr)',
    averageSalaryUsd: 265000,
    salaryBand: 'CHF 190,000 – CHF 320,000',
    openingsCount: '210+ Active Positions',
    hiringVelocity: 'Targeted Hiring (+19% YoY)',
    topSkills: ['ROS 2', 'LiDAR SLAM', 'PREEMPT_RT', 'Factor Graph Optimization'],
    topCompanies: ['Kratos Defense', 'Anybotics', 'ETH Zurich Labs', 'ABB Robotics'],
    description: 'Fail-safe edge perception stacks, quadrupeds, and tactical unmanned vehicle flight avionics.',
    lat: 47.8,
    lng: 9.2,
    coords: latLngToVector3(47.8, 9.2, 1.16),
    color: '#22d3a5',
  },
  {
    id: 'eu-nordic-green',
    name: 'Nordic Clean Compute Nodes (Stockholm & Helsinki)',
    continent: 'Europe',
    primarySector: 'Green Compute & Distributed Cloud Fabrics',
    averageSalaryDisplay: '$210,000 USD (€195k / yr)',
    averageSalaryUsd: 210000,
    salaryBand: '€140,000 – €230,000',
    openingsCount: '180+ Active Infrastructure Roles',
    hiringVelocity: 'Expanding (+18% YoY)',
    topSkills: ['Rust', 'eBPF', 'Kubernetes', 'InfiniBand RoCE', 'Zig'],
    topCompanies: ['Sovereign Orbital Compute', 'Spotify Systems', 'Klarna Infra'],
    description: 'Hydro-powered and sub-arctic zero-carbon hyperscale datacenters with customized bare-metal kernel runtimes.',
    lat: 59.3,
    lng: 18.1,
    coords: latLngToVector3(59.3, 18.1, 1.16),
    color: '#38bdf8',
  },
  {
    id: 'asia-east-tokyo',
    name: 'Tokyo & Kanto Mechatronics Zone',
    continent: 'Asia',
    primarySector: 'Humanoid Autonomy & Precision Edge Hardware',
    averageSalaryDisplay: '$225,000 USD (¥32M / yr)',
    averageSalaryUsd: 225000,
    salaryBand: '¥22,000,000 – ¥40,000,000',
    openingsCount: '240+ Active Hardware Roles',
    hiringVelocity: 'Accelerating (+25% YoY)',
    topSkills: ['Embedded C++', 'EtherCAT', 'Brushless Motor FOC', 'Sensor Fusion'],
    topCompanies: ['Sony AI Labs', 'Preferred Networks', 'Toyota Research Institute'],
    description: 'Next-generation humanoid bipedal locomotion, high-density actuators, and embedded neural co-processors.',
    lat: 35.8,
    lng: 139.8,
    coords: latLngToVector3(35.8, 139.8, 1.16),
    color: '#fbbf24',
  },
  {
    id: 'asia-east-seoul',
    name: 'Seoul & Pangyo Silicon Cluster',
    continent: 'Asia',
    primarySector: 'High-Bandwidth Memory (HBM) & Neural Silicons',
    averageSalaryDisplay: '$230,000 USD (₩310M / yr)',
    averageSalaryUsd: 230000,
    salaryBand: '₩240,000,000 – ₩380,000,000',
    openingsCount: '220+ Active Hardware/AI Roles',
    hiringVelocity: 'Surging (+31% YoY)',
    topSkills: ['HBM3e / HBM4', 'CoWoS 3D Packaging', 'PyTorch NPU Acceleration'],
    topCompanies: ['SK Hynix Research', 'Rebellions', 'FuriosaAI', 'Samsung Foundry'],
    description: '3D stacked DRAM packaging for foundation LLM accelerators and low-power edge transformer processors.',
    lat: 37.4,
    lng: 127.1,
    coords: latLngToVector3(37.4, 127.1, 1.16),
    color: '#f87171',
  },
  {
    id: 'asia-sea-singapore',
    name: 'Singapore Financial Tech Hub',
    continent: 'Asia',
    primarySector: 'Institutional Crypto Derivatives & Sovereign Fintech',
    averageSalaryDisplay: '$250,000 USD (S$335k / yr)',
    averageSalaryUsd: 250000,
    salaryBand: 'S$240,000 – S$420,000',
    openingsCount: '195+ Active FinTech Roles',
    hiringVelocity: 'Active (+21% YoY)',
    topSkills: ['Rust', 'Zero-Knowledge Proofs', 'Solanacore', 'Go Microservices'],
    topCompanies: ['Wintermute', 'QCP Capital', 'GIC Tech Systems'],
    description: 'Zero-knowledge settlement protocols, cross-border digital asset custody, and sovereign liquidity engines.',
    lat: 1.3,
    lng: 103.9,
    coords: latLngToVector3(1.3, 103.9, 1.16),
    color: '#34d399',
  },
  {
    id: 'me-gulf-sovereign',
    name: 'Abu Dhabi & Dubai Sovereign AI Hub',
    continent: 'Middle East',
    primarySector: 'Sovereign Supercomputing & Zero-Tax Frontier AI',
    averageSalaryDisplay: '$295,000 USD / yr (Tax-Free)',
    averageSalaryUsd: 295000,
    salaryBand: '$240,000 – $480,000 Net Tax-Free',
    openingsCount: '175+ Active Openings',
    hiringVelocity: 'Exponential (+45% YoY)',
    topSkills: ['Distributed Training', 'Megatron-LM', 'Slurm Orchestration', 'FlashAttention'],
    topCompanies: ['TII (Falcon LLM)', 'G42 Supercompute', 'Hub71 Ventures'],
    description: 'State-backed national foundation model clusters with 100,000+ accelerator reservations and zero personal income tax.',
    lat: 24.5,
    lng: 54.4,
    coords: latLngToVector3(24.5, 54.4, 1.16),
    color: '#fbbf24',
  },
  {
    id: 'oceania-sydney',
    name: 'Sydney & Melbourne Innovation Arc',
    continent: 'Oceania',
    primarySector: 'Enterprise Cloud Observability & Site Reliability',
    averageSalaryDisplay: '$215,000 USD (A$325k / yr)',
    averageSalaryUsd: 215000,
    salaryBand: 'A$240,000 – A$390,000',
    openingsCount: '160+ Active Engineering Roles',
    hiringVelocity: 'Steady (+17% YoY)',
    topSkills: ['Go', 'Kubernetes', 'OpenTelemetry', 'Distributed Consensus'],
    topCompanies: ['Atlassian Core Architecture', 'Canva Infrastructure Labs'],
    description: 'High-availability distributed consensus, multi-region fault tolerance, and developer observability platforms.',
    lat: -33.8,
    lng: 151.2,
    coords: latLngToVector3(-33.8, 151.2, 1.16),
    color: '#38bdf8',
  },
  {
    id: 'sa-saopaulo-fintech',
    name: 'São Paulo FinTech & Scale Corridor',
    continent: 'South America',
    primarySector: 'Instant Payment Rails & Real-Time Banking Scale',
    averageSalaryDisplay: '$175,000 USD / yr',
    averageSalaryUsd: 175000,
    salaryBand: '$130,000 – $240,000 + Equity',
    openingsCount: '140+ Active Openings',
    hiringVelocity: 'Growing (+23% YoY)',
    topSkills: ['Kafka Event Streaming', 'Distributed SQL', 'Rust', 'Java 21'],
    topCompanies: ['Nubank Core Platform', 'Stone Payments Tech'],
    description: 'High-throughput sub-second instant payment infrastructure serving 100M+ retail and enterprise users.',
    lat: -23.5,
    lng: -46.6,
    coords: latLngToVector3(-23.5, -46.6, 1.16),
    color: '#a78bfa',
  },
  {
    id: 'space-avionics-austin',
    name: 'Austin & Space Coast Avionics Arc',
    continent: 'North America',
    primarySector: 'Commercial SpaceTech / Defense Avionics',
    averageSalaryDisplay: '$245,000 USD / yr',
    averageSalaryUsd: 245000,
    salaryBand: '$195,000 – $360,000 + Equity',
    openingsCount: '215+ Active Aerospace Signals',
    hiringVelocity: 'Surging (+38% YoY)',
    topSkills: ['Rad-Hard Avionics', 'DO-178C Flight SW', 'GN&C Guidance', 'Real-Time Telemetry', 'Rust/C++'],
    topCompanies: ['SpaceX Starbase', 'Firefly Aerospace', 'Anduril Industries', 'Apex Space'],
    description: 'Orbital launch avionics, flight-critical embedded RTOS, autonomous interceptors, and high-reliability satellite bus telemetry.',
    lat: 30.27,
    lng: -97.74,
    coords: latLngToVector3(30.27, -97.74, 1.16),
    color: '#f59e0b',
  },
  {
    id: 'genomics-nordic-stockholm',
    name: 'Stockholm & Nordic Genomics Hub',
    continent: 'Europe',
    primarySector: 'Computational Genomics',
    averageSalaryDisplay: '$210,000 USD (SEK 1.5M / yr)',
    averageSalaryUsd: 210000,
    salaryBand: 'SEK 1.1M – 1.8M + Carried Equity',
    openingsCount: '165+ Active Genomics Roles',
    hiringVelocity: 'Accelerating (+33% YoY)',
    topSkills: ['Variant Calling Pipelines', 'AlphaFold3 / PyTorch', 'Nextflow / WDL', 'Single-Cell Transcriptomics', 'Distributed Bio-ML'],
    topCompanies: ['SciLifeLab', 'Illumina Research', 'Karolinska Institute Tech', 'Basecamp Research'],
    description: 'Deep learning for molecular sequence prediction, population-scale genetic variant analysis, and in-silico therapeutic design.',
    lat: 59.33,
    lng: 18.06,
    coords: latLngToVector3(59.33, 18.06, 1.16),
    color: '#10b981',
  },
  {
    id: 'energy-grid-toronto',
    name: 'Toronto Clean Compute & Grid Corridor',
    continent: 'North America',
    primarySector: 'Next-Gen Energy Grid Optimization',
    averageSalaryDisplay: '$225,000 USD (C$300k / yr)',
    averageSalaryUsd: 225000,
    salaryBand: 'C$210,000 – C$340,000',
    openingsCount: '180+ Active CleanTech Roles',
    hiringVelocity: 'High Demand (+35% YoY)',
    topSkills: ['Smart Grid SCADA', 'DERMS Orchestration', 'Power Flow Simulators (OpenDSS)', 'Renewable Load Balancing', 'Reinforcement Learning for Grid'],
    topCompanies: ['Form Energy', 'Stem AI', 'Hydro One Labs', 'Enphase Energy'],
    description: 'Real-time multi-gigawatt power grid orchestration, battery storage dispatch algorithms, and AI compute micro-grid synchronization.',
    lat: 43.65,
    lng: -79.38,
    coords: latLngToVector3(43.65, -79.38, 1.16),
    color: '#06b6d4',
  },
];

interface RadarGlobe3DProps {
  onSelectHub?: (hub: CityHub) => void;
  onSelectSector?: (sector: string, location?: string) => void;
  selectedCity?: string | null;
  liveHubs?: LiveTechHubData[];
  liveDemandData?: MarketRadarData | null;
  isRefreshingLive?: boolean;
  onRefreshTelemetry?: () => void;
}

export default function RadarGlobe3D({
  onSelectHub,
  onSelectSector,
  selectedCity,
  liveHubs,
  liveDemandData,
  isRefreshingLive = false,
  onRefreshTelemetry,
}: RadarGlobe3DProps) {
  // Merge live API hubs with 3D coordinates
  const effectiveHubs: CityHub[] = useMemo(() => {
    if (!liveHubs || liveHubs.length === 0) {
      return GLOBAL_TECH_HUBS;
    }
    return liveHubs.map((h) => ({
      name: h.name,
      country: h.country,
      lat: h.lat,
      lng: h.lng,
      openings: h.openings,
      openingsDelta24h: h.openingsDelta24h,
      salaryBand: h.salaryBand,
      hiringVelocity: h.hiringVelocity,
      topSkills: h.topSkills,
      dominantSector: h.dominantSector,
      status: h.status,
      coords: latLngToVector3(h.lat, h.lng, 1.12),
    }));
  }, [liveHubs]);

  const [activeHub, setActiveHub] = useState<CityHub | null>(effectiveHubs[0]);
  const [activeContinent, setActiveContinent] = useState<MarketContinent | null>(MARKET_CONTINENT_SPHERES[0]);
  const [hoveredContinent, setHoveredContinent] = useState<MarketContinent | null>(null);
  const [isRotating, setIsRotating] = useState(true);

  // Sync activeHub if selectedCity prop changes
  React.useEffect(() => {
    if (selectedCity) {
      const match = effectiveHubs.find((h) => h.name.toLowerCase() === selectedCity.toLowerCase());
      if (match) setActiveHub(match);
    }
  }, [selectedCity, effectiveHubs]);

  const handleHubClick = (hub: CityHub) => {
    setActiveHub(hub);
    if (onSelectHub) {
      onSelectHub(hub);
    }
  };

  const handleContinentClick = (continent: MarketContinent) => {
    setActiveContinent(continent);
  };

  const handleFilterByContinent = (continent: MarketContinent) => {
    if (onSelectSector) {
      onSelectSector(continent.primarySector, continent.name.split(' ')[0]);
    } else if (onSelectHub) {
      const matchingCity = effectiveHubs.find((h) => h.name.toLowerCase().includes(continent.name.toLowerCase().split(' ')[0]));
      if (matchingCity) onSelectHub(matchingCity);
    }
  };

  return (
    <div className="relative w-full h-[450px] bg-[#0a0f14] rounded-xl overflow-hidden border border-[#1e2b36] shadow-xl group">
      {/* Top HUD overlay status */}
      <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-2 bg-[#111a22]/90 border border-[#1e2b36] px-3 py-1.5 rounded-lg text-xs font-mono text-[#7a8b99] pointer-events-auto shadow-md">
        <Radio className="w-3.5 h-3.5 text-[#22d3a5] animate-pulse" />
        <span className="text-[#dce7f0] font-semibold">GEOSPATIAL TALENT RADAR</span>
        {liveDemandData ? (
          <>
            <span className="text-[#3b82f6] hidden sm:inline">|</span>
            <span className="text-[#22d3a5] font-semibold flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#22d3a5]" />
              {liveDemandData.totalOpenings.toLocaleString()} LIVE REQS
            </span>
            <span className="text-[#fbbf24] hidden md:inline text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#fbbf24]/10 border border-[#fbbf24]/30">
              VELOCITY {liveDemandData.globalHiringVelocity} ({liveDemandData.velocityDelta})
            </span>
          </>
        ) : (
          <span className="px-1.5 py-0.2 rounded bg-[#fbbf24]/20 text-[#fbbf24] text-[10px] font-bold">
            STREAMING LIVE RADAR
          </span>
        )}
      </div>

      {/* Rotation & Live Telemetry Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-[#111a22]/90 border border-[#1e2b36] px-2 py-1 rounded-lg text-xs font-mono text-[#7a8b99] pointer-events-auto shadow-md">
        {onRefreshTelemetry && (
          <button
            onClick={onRefreshTelemetry}
            disabled={isRefreshingLive}
            className={`p-1 rounded transition text-[#22d3a5] hover:bg-[#22d3a5]/20 cursor-pointer flex items-center gap-1 ${
              isRefreshingLive ? 'opacity-50' : ''
            }`}
            title="Refresh Real-Time Job Market Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLive ? 'animate-spin' : ''}`} />
            <span className="text-[10px] hidden sm:inline">SYNC</span>
          </button>
        )}
        <button
          onClick={() => setIsRotating(!isRotating)}
          className={`px-2 py-0.5 rounded transition cursor-pointer ${
            isRotating ? 'bg-[#22d3a5]/20 text-[#22d3a5]' : 'bg-[#1e2b36] text-[#7a8b99]'
          }`}
          title="Toggle rotation"
        >
          {isRotating ? 'ROTATE: ON' : 'ROTATE: PAUSED'}
        </button>
      </div>

      {/* Floating Hover Mini Tooltip */}
      {hoveredContinent && !activeContinent && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 bg-[#0a0f14]/95 border border-[#38bdf8]/60 px-3 py-1.5 rounded-lg text-xs font-mono pointer-events-none shadow-xl flex items-center gap-2 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#38bdf8] shrink-0" />
          <span className="text-[#dce7f0] font-bold">{hoveredContinent.name}</span>
          <span className="text-[#38bdf8]">| {hoveredContinent.primarySector}</span>
          <span className="text-[#22d3a5] font-bold">{hoveredContinent.averageSalaryDisplay}</span>
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE MARKET CONTINENT HUD (TRIGGERED ON CLICK OF CONTINENT SPHERE)
         ========================================================================= */}
      {activeContinent && (
        <div className="absolute top-12 left-3 right-3 sm:left-auto sm:right-3 sm:w-96 z-20 bg-[#0d1620]/95 border-2 border-[#22d3a5]/50 backdrop-blur-md rounded-xl p-4 shadow-[0_0_30px_rgba(34,211,165,0.2)] font-mono text-xs pointer-events-auto space-y-3 transition-all animate-in fade-in slide-in-from-top-2">
          {/* HUD Top Bar */}
          <div className="flex items-center justify-between border-b border-[#1e2b36] pb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24] animate-ping" />
              <span className="text-[10px] text-[#fbbf24] font-bold tracking-wider">
                CONTINENT SECTOR TELEMETRY HUD
              </span>
            </div>
            <button
              onClick={() => setActiveContinent(null)}
              className="w-5 h-5 rounded flex items-center justify-center text-[#7a8b99] hover:text-[#dce7f0] hover:bg-[#1e2b36] transition cursor-pointer"
              title="Close HUD"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Continent Title & Region */}
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#38bdf8] uppercase font-semibold">
                {activeContinent.continent} REGIONAL CLUSTER
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#22d3a5]/20 text-[#22d3a5] font-bold border border-[#22d3a5]/40">
                {activeContinent.hiringVelocity}
              </span>
            </div>
            <h4 className="text-sm font-bold text-[#dce7f0] mt-0.5">
              {activeContinent.name}
            </h4>
          </div>

          {/* Primary Industry Sector Box */}
          <div className="p-2.5 bg-[#080d12] rounded-lg border border-[#1e2b36] space-y-1">
            <span className="text-[10px] text-[#7a8b99] block font-semibold flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-[#fbbf24]" />
              PRIMARY INDUSTRY SECTOR:
            </span>
            <div className="text-xs font-bold text-[#fbbf24]">
              {activeContinent.primarySector}
            </div>
          </div>

          {/* Potential Average Salary Band */}
          <div className="grid grid-cols-2 gap-2 bg-[#080d12] p-2.5 rounded-lg border border-[#22d3a5]/30">
            <div>
              <span className="text-[10px] text-[#7a8b99] block">POTENTIAL AVG SALARY:</span>
              <div className="text-sm font-bold text-[#22d3a5]">
                {activeContinent.averageSalaryDisplay}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-[#7a8b99] block">COMPENSATION BAND:</span>
              <div className="text-[11px] font-semibold text-[#dce7f0]">
                {activeContinent.salaryBand}
              </div>
            </div>
          </div>

          {/* Regional Intel & Required Competencies */}
          <div className="space-y-1.5 text-[11px]">
            <p className="text-[#94a3b8] font-sans text-xs leading-relaxed">
              {activeContinent.description}
            </p>

            <div className="pt-1">
              <span className="text-[10px] text-[#7a8b99] block mb-1 font-bold">KEY HIGH-YIELD SKILLS:</span>
              <div className="flex flex-wrap gap-1">
                {activeContinent.topSkills.map((sk, idx) => (
                  <span
                    key={idx}
                    className="px-1.5 py-0.5 rounded bg-[#111a22] border border-[#1e2b36] text-[#22d3a5] text-[10px]"
                  >
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            <div className="text-[10px] text-[#7a8b99] pt-1">
              <strong className="text-[#dce7f0]">Key Employers:</strong> {activeContinent.topCompanies.join(', ')}
            </div>
          </div>

          {/* Action Button: Filter / Search Sector */}
          <div className="pt-2 border-t border-[#1e2b36] flex items-center justify-between gap-2">
            <span className="text-[10px] text-[#22d3a5] font-bold">
              {activeContinent.openingsCount}
            </span>
            <button
              onClick={() => handleFilterByContinent(activeContinent)}
              className="px-3 py-1.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db890] text-black font-bold text-xs flex items-center gap-1.5 transition shadow cursor-pointer"
            >
              <span>Scan Sector Roles</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Tech Hub Pill Selector & Continent Quick Switcher */}
      <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        {/* Active Hub Mini Box */}
        {activeHub && !activeContinent && (
          <div className="bg-[#111a22]/95 border border-[#1e2b36] px-3 py-1.5 rounded-lg text-xs font-mono shadow-lg flex flex-wrap items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[#22d3a5]" />
            <span className="text-[#dce7f0] font-bold">{activeHub.name}:</span>
            <span className="text-[#22d3a5] font-semibold">{activeHub.openings} Openings</span>
            {activeHub.openingsDelta24h && (
              <span className="text-[#38bdf8] text-[10px] px-1 py-0.2 rounded bg-[#38bdf8]/10 border border-[#38bdf8]/30">
                {activeHub.openingsDelta24h}
              </span>
            )}
            <span className="text-[#7a8b99]">({activeHub.salaryBand})</span>
            {activeHub.hiringVelocity && (
              <span className="text-[#fbbf24] text-[10px] hidden sm:inline">
                Velocity: {activeHub.hiringVelocity}/100
              </span>
            )}
          </div>
        )}

        {/* Floating Continent Spheres Quick Selector Pills */}
        <div className="hidden md:flex items-center gap-1 bg-[#111a22]/90 border border-[#1e2b36] p-1 rounded-lg text-[10px] font-mono overflow-x-auto max-w-xl scrollbar-none shadow-lg">
          <span className="text-[#7a8b99] px-1 text-[9px] font-bold">CLICK CONTINENT:</span>
          {MARKET_CONTINENT_SPHERES.slice(0, 5).map((c) => (
            <button
              key={c.id}
              onClick={() => handleContinentClick(c)}
              className={`px-2 py-0.5 rounded transition whitespace-nowrap cursor-pointer ${
                activeContinent?.id === c.id
                  ? 'bg-[#fbbf24] text-black font-bold shadow'
                  : 'text-[#7a8b99] hover:text-[#dce7f0]'
              }`}
            >
              {c.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <Canvas camera={{ position: [0, 0, 3.6] }}>
        <ambientLight intensity={0.65} />
        <directionalLight position={[10, 10, 5]} intensity={1.3} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#3b82f6" />
        <pointLight position={[0, 5, 5]} intensity={0.6} color="#22d3a5" />

        {/* Core Radar Globe */}
        <Sphere args={[1, 64, 64]}>
          <MeshDistortMaterial
            color="#13273e"
            attach="material"
            distort={0.16}
            speed={1.6}
            roughness={0.2}
            metalness={0.85}
          />
        </Sphere>

        {/* Global Tech Hub Coordinates */}
        {effectiveHubs.map((hub) => {
          const isSelected = activeHub?.name === hub.name;
          return (
            <group key={hub.name} position={hub.coords}>
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  handleHubClick(hub);
                }}
                onPointerOver={() => {
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  document.body.style.cursor = 'auto';
                }}
              >
                <sphereGeometry args={[isSelected ? 0.048 : 0.032, 16, 16]} />
                <meshStandardMaterial
                  color={isSelected ? '#22d3a5' : '#059669'}
                  emissive={isSelected ? '#22d3a5' : '#059669'}
                  emissiveIntensity={isSelected ? 0.8 : 0.4}
                />
              </mesh>
            </group>
          );
        })}

        {/* Interactive Floating Market Continent Spheres with Click & Hover */}
        {MARKET_CONTINENT_SPHERES.map((continent) => {
          const isSelected = activeContinent?.id === continent.id;
          const isHovered = hoveredContinent?.id === continent.id;

          return (
            <group key={continent.id} position={continent.coords}>
              <mesh
                onClick={(e) => {
                  e.stopPropagation();
                  handleContinentClick(continent);
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  setHoveredContinent(continent);
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  setHoveredContinent(null);
                  document.body.style.cursor = 'auto';
                }}
              >
                <sphereGeometry args={[isSelected ? 0.062 : isHovered ? 0.052 : 0.038, 16, 16]} />
                <meshStandardMaterial
                  color={isSelected ? '#fbbf24' : isHovered ? '#38bdf8' : continent.color}
                  emissive={isSelected ? '#fbbf24' : isHovered ? '#38bdf8' : continent.color}
                  emissiveIntensity={isSelected ? 0.95 : isHovered ? 0.75 : 0.4}
                  roughness={0.15}
                  metalness={0.8}
                />
              </mesh>

              {/* Orbital Halo Ring around Selected/Hovered Continent Sphere */}
              {(isSelected || isHovered) && (
                <mesh>
                  <ringGeometry args={[0.075, 0.088, 32]} />
                  <meshBasicMaterial
                    color={isSelected ? '#fbbf24' : '#38bdf8'}
                    transparent
                    opacity={0.8}
                    side={2}
                  />
                </mesh>
              )}
            </group>
          );
        })}

        <OrbitControls
          enableZoom={false}
          autoRotate={isRotating}
          autoRotateSpeed={1.8}
          rotateSpeed={0.8}
        />
      </Canvas>
    </div>
  );
}
