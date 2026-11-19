import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  Download,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  FileCode,
  FileText,
  CheckCircle2,
  X,
  Sparkles,
  GitBranch,
  ShieldCheck,
  FolderGit2,
  Code2,
  Layers,
  HardDrive,
  RefreshCw,
  Globe,
  Server,
  Cloud,
  Network,
  ArrowUpRight,
  Cpu,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import { downloadCodebaseZip } from '../utils/zipExporter';
import { downloadBulkCapabilitiesCsv } from '../utils/bulkCapabilitiesCsv';
import {
  getActiveServerUrl,
  CANONICAL_CLOUD_RUN_HOST,
} from '../utils/serverConfig';

interface GithubRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GithubRepoModal({ isOpen, onClose }: GithubRepoModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'zip_export' | 'cloud_dns' | 'git_setup' | 'readme_preview' | 'file_manifest'>('cloud_dns');
  const [githubUsername, setGithubUsername] = useState('mortyp1125');
  const [repoName, setRepoName] = useState('talent-radar-os');
  const [customDomainInput, setCustomDomainInput] = useState('app.talentradar.ai');
  const [cloudStatus, setCloudStatus] = useState<any>(null);
  const [dnsStatus, setDnsStatus] = useState<any>(null);
  const [loadingCloudStatus, setLoadingCloudStatus] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCloudStatus();
      checkDnsRouting(customDomainInput);
    }
  }, [isOpen]);

  const fetchCloudStatus = async () => {
    setLoadingCloudStatus(true);
    try {
      const res = await fetch('/api/cloud/status');
      if (res.ok) {
        const data = await res.json();
        setCloudStatus(data);
      }
    } catch (err) {
      console.warn('Failed to fetch cloud status:', err);
    } finally {
      setLoadingCloudStatus(false);
    }
  };

  const checkDnsRouting = async (domainToTest: string) => {
    try {
      const res = await fetch('/api/cloud/dns-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainToTest }),
      });
      if (res.ok) {
        const data = await res.json();
        setDnsStatus(data);
      }
    } catch (err) {
      console.warn('Failed to check DNS routing:', err);
    }
  };

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2500);
  };

  const handleDownloadZip = async () => {
    setDownloading(true);
    setDownloadStatus('Packaging complete repository files...');
    try {
      await downloadCodebaseZip((percent, status) => {
        setDownloadStatus(`${status} (${percent}%)`);
      });
      setDownloadStatus('Download initiated successfully!');
      setTimeout(() => {
        setDownloading(false);
        setDownloadStatus(null);
      }, 3500);
    } catch (err) {
      console.error('ZIP download error:', err);
      setDownloadStatus('Failed to generate ZIP archive');
      setDownloading(false);
    }
  };

  const gitCommands = [
    `# 1. Unzip the downloaded talent-radar-os-repository.zip and enter directory`,
    `cd talent-radar-os`,
    ``,
    `# 2. Initialize Git and stage all project files`,
    `git init`,
    `git add .`,
    `git commit -m "feat: initial commit of TalentRadar.OS complete platform"`,
    ``,
    `# 3. Create your repository on GitHub (https://github.com/new)`,
    `# Then link the remote and push to main:`,
    `git branch -M main`,
    `git remote add origin https://github.com/${githubUsername || 'your-username'}/${repoName || 'talent-radar-os'}.git`,
    `git push -u origin main`
  ].join('\n');

  const fileManifest = [
    { path: 'README.md', desc: 'Complete documentation, feature breakdown, setup, and MIT license', type: 'doc' },
    { path: 'package.json', desc: 'Project configuration, dependencies (Three.js, D3, Recharts, Vite)', type: 'config' },
    { path: 'server.ts', desc: 'Full-stack Express server with Vite middleware & ZIP exporter API', type: 'code' },
    { path: 'vite.config.ts', desc: 'Vite build configuration & React plugins', type: 'config' },
    { path: 'tsconfig.json', desc: 'TypeScript strict compiler options', type: 'config' },
    { path: '.gitignore', desc: 'Git rules ignoring node_modules, dist, logs, and secrets', type: 'config' },
    { path: '.env.example', desc: 'Sample environment variables template', type: 'config' },
    { path: 'index.html', desc: 'HTML5 entry with OpenGraph cards & Schema.org JSON-LD', type: 'code' },
    { path: 'src/App.tsx', desc: 'Application container, query param router, and state providers', type: 'code' },
    { path: 'src/components/RadarTab.tsx', desc: '3D geospatial requisition explorer & alert subscriptions', type: 'code' },
    { path: 'src/components/RadarGlobe3D.tsx', desc: 'Interactive Three.js 3D globe with continent tooltips', type: 'code' },
    { path: 'src/components/MarketAnalyticsTab.tsx', desc: 'Recharts multi-sector salary trajectories & CSV export', type: 'code' },
    { path: 'src/components/InteractiveSkillTree.tsx', desc: 'D3 force-directed node graph representing career progression', type: 'code' },
    { path: 'src/components/AISupervisorTab.tsx', desc: 'Autonomous 4-Agent Triad console & collaborative cycles', type: 'code' },
    { path: 'src/components/StealthNetTab.tsx', desc: 'Zero-knowledge anonymous talent mesh & candidate beacons', type: 'code' },
    { path: 'src/components/FinancialPlatformTab.tsx', desc: 'TTC modeling, global tax arbitrage & $145K M&A listing', type: 'code' },
    { path: 'src/components/GrowthAdHubTab.tsx', desc: 'Credible subscriber acquisition playbooks & /r/CODE outreach', type: 'code' },
    { path: 'src/components/GuidedTour.tsx', desc: 'Interactive 6-step guided walkthrough for first-time users', type: 'code' },
    { path: 'src/utils/zipExporter.ts', desc: 'Automated repository ZIP packaging engine', type: 'code' },
    { path: 'src/utils/marketAnalyticsEngine.ts', desc: 'Quantitative compensation modeling & sector calibration', type: 'code' },
    { path: 'src/utils/radarEngine.ts', desc: 'Geospatial requisition indexing & search algorithms', type: 'code' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#0f1720] border-2 border-[#22d3a5]/60 rounded-2xl shadow-[0_0_60px_rgba(34,211,165,0.25)] text-[#dce7f0] font-mono overflow-hidden animate-fadeIn my-6">
        
        {/* Modal Top Header */}
        <div className="p-5 bg-gradient-to-r from-[#111a22] via-[#152330] to-[#111a22] border-b border-[#1e2b36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#22d3a5]/10 border border-[#22d3a5] flex items-center justify-center text-[#22d3a5] shadow-[0_0_20px_rgba(34,211,165,0.2)]">
              <FolderGit2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] font-bold border border-[#22d3a5]/40 tracking-wider">
                  SOURCE CODE REPOSITORY
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] font-bold border border-[#38bdf8]/40">
                  GITHUB READY • MIT LICENSE
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-wide mt-0.5 flex items-center gap-2">
                TALENT_RADAR.OS REPOSITORY &amp; ZIP EXPORTER
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#1e2b36] hover:bg-[#2a3b49] text-[#7a8b99] hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex border-b border-[#1e2b36] bg-[#0a0f14] text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('cloud_dns')}
            className={`flex-1 py-3 px-3 text-center font-bold border-b-2 transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'cloud_dns'
                ? 'border-[#22d3a5] text-[#22d3a5] bg-[#22d3a5]/5'
                : 'border-transparent text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud Hosting &amp; DNS</span>
          </button>
          <button
            onClick={() => setActiveTab('zip_export')}
            className={`flex-1 py-3 px-3 text-center font-bold border-b-2 transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'zip_export'
                ? 'border-[#22d3a5] text-[#22d3a5] bg-[#22d3a5]/5'
                : 'border-transparent text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>1-Click ZIP Export</span>
          </button>
          <button
            onClick={() => setActiveTab('git_setup')}
            className={`flex-1 py-3 px-3 text-center font-bold border-b-2 transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'git_setup'
                ? 'border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/5'
                : 'border-transparent text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>GitHub Setup Guide</span>
          </button>
          <button
            onClick={() => setActiveTab('readme_preview')}
            className={`flex-1 py-3 px-3 text-center font-bold border-b-2 transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'readme_preview'
                ? 'border-[#fbbf24] text-[#fbbf24] bg-[#fbbf24]/5'
                : 'border-transparent text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>README.md</span>
          </button>
          <button
            onClick={() => setActiveTab('file_manifest')}
            className={`flex-1 py-3 px-3 text-center font-bold border-b-2 transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'file_manifest'
                ? 'border-[#a78bfa] text-[#a78bfa] bg-[#a78bfa]/5'
                : 'border-transparent text-[#7a8b99] hover:text-[#dce7f0]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Codebase Manifest</span>
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          
          {/* TAB 0: CLOUD HOSTING & DNS INTEGRATION */}
          {activeTab === 'cloud_dns' && (
            <div className="space-y-5">
              {/* Live Production Environment Telemetry Card */}
              <div className="bg-[#111a22] border-2 border-[#22d3a5]/60 rounded-2xl p-5 shadow-[0_0_30px_rgba(34,211,165,0.2)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#22d3a5]/10 border border-[#22d3a5] flex items-center justify-center text-[#22d3a5] shrink-0">
                      <Cloud className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#22d3a5] animate-ping" />
                          LIVE PRODUCTION CLOUD
                        </span>
                        <span className="text-[10px] text-[#7a8b99]">
                          GOOGLE CLOUD RUN
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-0.5">
                        Production Environment &amp; Hosting Core
                      </h4>
                    </div>
                  </div>

                  <button
                    onClick={fetchCloudStatus}
                    disabled={loadingCloudStatus}
                    className="px-3 py-1.5 rounded-lg bg-[#1e2b36] hover:bg-[#2a3b49] text-xs font-semibold text-[#22d3a5] transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingCloudStatus ? 'animate-spin' : ''}`} />
                    <span>Refresh Telemetry</span>
                  </button>
                </div>

                {/* Primary Production URL Link Box */}
                <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-xl p-3.5 space-y-2">
                  <div className="text-[11px] text-[#7a8b99] flex items-center justify-between">
                    <span className="font-bold text-[#dce7f0]">ACTIVE PRODUCTION ENDPOINT (EUROPE-WEST2):</span>
                    <span className="text-[#22d3a5] text-[10px]">TLS 1.3 256-Bit SSL Active</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 bg-[#111a22] border border-[#1e2b36] rounded-lg px-3 py-2 text-xs text-[#22d3a5] font-mono break-all select-all flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-[#22d3a5] shrink-0" />
                      <span>{cloudStatus?.productionUrl || getActiveServerUrl()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(cloudStatus?.productionUrl || getActiveServerUrl(), 'cloud-prod-url')}
                        className="flex-1 sm:flex-none px-3.5 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db88f] text-black font-bold text-xs transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                      >
                        {copiedKey === 'cloud-prod-url' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy URL</span>
                          </>
                        )}
                      </button>
                      <a
                        href={cloudStatus?.productionUrl || getActiveServerUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-lg bg-[#1e2b36] hover:bg-[#2a3b49] text-white text-xs transition flex items-center justify-center"
                        title="Open live production app"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Cloud Run Specs Telemetry Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-[#0a0f14] p-3 rounded-xl border border-[#1e2b36] space-y-1">
                    <div className="text-[10px] text-[#7a8b99] flex items-center gap-1">
                      <Server className="w-3 h-3 text-[#38bdf8]" />
                      <span>REGION</span>
                    </div>
                    <div className="text-white font-bold">{cloudStatus?.region || 'europe-west2 (London)'}</div>
                  </div>
                  <div className="bg-[#0a0f14] p-3 rounded-xl border border-[#1e2b36] space-y-1">
                    <div className="text-[10px] text-[#7a8b99] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#22d3a5]" />
                      <span>SECURITY</span>
                    </div>
                    <div className="text-[#22d3a5] font-bold">TLS 1.3 / HTTPS</div>
                  </div>
                  <div className="bg-[#0a0f14] p-3 rounded-xl border border-[#1e2b36] space-y-1">
                    <div className="text-[10px] text-[#7a8b99] flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-[#fbbf24]" />
                      <span>MEMORY / CPU</span>
                    </div>
                    <div className="text-[#fbbf24] font-bold">1 GiB / 1 vCPU</div>
                  </div>
                  <div className="bg-[#0a0f14] p-3 rounded-xl border border-[#1e2b36] space-y-1">
                    <div className="text-[10px] text-[#7a8b99] flex items-center gap-1">
                      <Network className="w-3 h-3 text-[#a78bfa]" />
                      <span>SCALING</span>
                    </div>
                    <div className="text-[#a78bfa] font-bold">0 to 10 Autoscaling</div>
                  </div>
                </div>
              </div>

              {/* Custom Domain & DNS Mapping Manager */}
              <div className="bg-[#111a22] border border-[#38bdf8]/40 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#1e2b36]">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40 tracking-wider">
                      DNS CONFIGURATION WIZARD
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">
                      Connect Your Custom Domain (e.g. talentradar.ai)
                    </h4>
                  </div>
                  <span className="text-[11px] text-[#7a8b99]">
                    Cloudflare, Namecheap, GoDaddy, Google Cloud DNS
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] text-[#7a8b99] mb-1">Enter Your Custom Domain or Subdomain:</label>
                    <input
                      type="text"
                      value={customDomainInput}
                      onChange={(e) => setCustomDomainInput(e.target.value)}
                      placeholder="app.yourdomain.com"
                      className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#38bdf8] rounded-lg px-3 py-2 text-white font-mono text-xs outline-none"
                    />
                  </div>
                  <button
                    onClick={() => checkDnsRouting(customDomainInput)}
                    className="self-end px-4 py-2 rounded-lg bg-[#38bdf8] hover:bg-[#0284c7] text-black font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Network className="w-3.5 h-3.5" />
                    <span>Generate DNS Records</span>
                  </button>
                </div>

                {/* DNS Records Table */}
                <div className="bg-[#0a0f14] rounded-xl border border-[#1e2b36] overflow-hidden text-xs">
                  <div className="px-3.5 py-2 bg-[#152330] border-b border-[#1e2b36] flex items-center justify-between font-bold text-[#dce7f0]">
                    <span>REQUIRED DNS RECORDS TO ADD TO YOUR REGISTRAR</span>
                    <span className="text-[#38bdf8] text-[11px]">TTL: Auto / 300</span>
                  </div>

                  <div className="divide-y divide-[#1e2b36]">
                    {/* CNAME Record */}
                    <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] font-bold text-[10px] border border-[#38bdf8]/40">CNAME</span>
                          <span className="text-white font-bold">{customDomainInput.includes('.') ? customDomainInput.split('.')[0] : '@'}</span>
                          <span className="text-[#7a8b99] text-[11px]">(Target Subdomain/Host)</span>
                        </div>
                        <div className="text-[11px] text-[#22d3a5] font-mono break-all">
                          {CANONICAL_CLOUD_RUN_HOST}
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(CANONICAL_CLOUD_RUN_HOST, 'cname-target')}
                        className="px-2.5 py-1.5 rounded bg-[#1e2b36] hover:bg-[#2a3b49] text-xs font-semibold text-white transition flex items-center gap-1 shrink-0"
                      >
                        {copiedKey === 'cname-target' ? <Check className="w-3 h-3 text-[#22d3a5]" /> : <Copy className="w-3 h-3" />}
                        <span>Copy CNAME Target</span>
                      </button>
                    </div>

                    {/* Ownership Verification TXT */}
                    <div className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-[#fbbf24]/20 text-[#fbbf24] font-bold text-[10px] border border-[#fbbf24]/40">TXT</span>
                          <span className="text-white font-bold">_cloud-run-challenge.{customDomainInput}</span>
                        </div>
                        <div className="text-[11px] text-[#fbbf24] font-mono break-all">
                          talent-radar-verification=gcprun-prod-auth-2026
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard('talent-radar-verification=gcprun-prod-auth-2026', 'txt-target')}
                        className="px-2.5 py-1.5 rounded bg-[#1e2b36] hover:bg-[#2a3b49] text-xs font-semibold text-white transition flex items-center gap-1 shrink-0"
                      >
                        {copiedKey === 'txt-target' ? <Check className="w-3 h-3 text-[#22d3a5]" /> : <Copy className="w-3 h-3" />}
                        <span>Copy TXT Value</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0a0f14] p-3 rounded-xl border border-[#1e2b36] text-[11px] text-[#7a8b99] space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#22d3a5]" />
                    <span>Cloudflare Zero-Touch SSL Recommendation:</span>
                  </div>
                  <p>
                    Toggle the Cloudflare Proxy switch ON (Orange Cloud) for instant global Anycast caching, DDoS shielding, and free automatic SSL cert renewal.
                  </p>
                </div>
              </div>

              {/* GitHub Actions CI/CD to Cloud Run Integration */}
              <div className="bg-[#111a22] border border-[#a78bfa]/40 rounded-2xl p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-[#a78bfa]" />
                    <span className="font-bold text-white">GITHUB ACTIONS CI/CD PIPELINE (.github/workflows/deploy.yml)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#a78bfa]/20 text-[#a78bfa] border border-[#a78bfa]/40 font-bold">
                    AUTO-DEPLOY TO PROD
                  </span>
                </div>
                <p className="text-[#7a8b99]">
                  Every push to your GitHub repository's <code>main</code> branch automatically runs TypeScript type-checking, builds the production container via <code>Dockerfile</code>, pushes to Google Artifact Registry, and performs a zero-downtime rolling update on Google Cloud Run.
                </p>

                <div className="bg-[#0a0f14] p-3 rounded-xl border border-[#1e2b36] text-[11px] space-y-2">
                  <div className="font-bold text-[#dce7f0]">Required GitHub Secrets (in Repo Settings &rarr; Secrets and variables &rarr; Actions):</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-mono">
                    <div className="bg-[#111a22] p-2 rounded border border-[#1e2b36] flex items-center justify-between">
                      <span className="text-[#38bdf8] font-bold">GCP_PROJECT_ID</span>
                      <span className="text-[#7a8b99]">Your GCP Project Name</span>
                    </div>
                    <div className="bg-[#111a22] p-2 rounded border border-[#1e2b36] flex items-center justify-between">
                      <span className="text-[#22d3a5] font-bold">GCP_SA_KEY</span>
                      <span className="text-[#7a8b99]">Service Account JSON Key</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: 1-CLICK ZIP EXPORT */}
          {activeTab === 'zip_export' && (
            <div className="space-y-5">
              {/* Primary Download Card */}
              <div className="bg-[#111a22] border-2 border-[#22d3a5]/50 rounded-2xl p-5 shadow-[0_0_30px_rgba(34,211,165,0.15)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#22d3a5]/20 text-[#22d3a5] border border-[#22d3a5]/40 tracking-wider">
                      COMPLETE REPOSITORY ARCHIVE
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">
                      Download talent-radar-os-repository.zip
                    </h4>
                    <p className="text-xs text-[#7a8b99] mt-0.5">
                      Contains 100% of the project source code, configurations, README.md, Three.js 3D Globe, D3 Skill Tree, and Express server.
                    </p>
                  </div>

                  <button
                    onClick={handleDownloadZip}
                    disabled={downloading}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#22d3a5] to-[#38bdf8] hover:from-[#1db88f] hover:to-[#0284c7] disabled:opacity-50 text-black font-bold text-sm transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,165,0.35)] active:scale-95 cursor-pointer shrink-0"
                  >
                    {downloading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Packaging ZIP...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download ZIP (.zip)</span>
                      </>
                    )}
                  </button>
                </div>

                {downloadStatus && (
                  <div className="p-3 rounded-lg bg-[#22d3a5]/10 border border-[#22d3a5]/40 text-xs text-[#22d3a5] flex items-center gap-2 animate-pulse">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{downloadStatus}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-[#1e2b36] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-[#0a0f14] p-2.5 rounded-lg border border-[#1e2b36]">
                    <div className="text-[10px] text-[#7a8b99]">COMPRESSION</div>
                    <div className="text-[#22d3a5] font-bold">Standard Deflate</div>
                  </div>
                  <div className="bg-[#0a0f14] p-2.5 rounded-lg border border-[#1e2b36]">
                    <div className="text-[10px] text-[#7a8b99]">INCLUDES</div>
                    <div className="text-white font-bold">All Code &amp; Assets</div>
                  </div>
                  <div className="bg-[#0a0f14] p-2.5 rounded-lg border border-[#1e2b36]">
                    <div className="text-[10px] text-[#7a8b99]">CLEAN BUILD</div>
                    <div className="text-[#38bdf8] font-bold">No node_modules</div>
                  </div>
                  <div className="bg-[#0a0f14] p-2.5 rounded-lg border border-[#1e2b36]">
                    <div className="text-[10px] text-[#7a8b99]">LICENSE</div>
                    <div className="text-[#fbbf24] font-bold">MIT Open License</div>
                  </div>
                </div>
              </div>

              {/* Bulk Annual Capabilities CSV Download Card */}
              <div className="bg-[#111a22] border-2 border-[#38bdf8]/50 rounded-2xl p-5 shadow-[0_0_30px_rgba(56,189,248,0.15)] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40 tracking-wider flex items-center gap-1.5 w-fit">
                      <Zap className="w-3 h-3 fill-[#38bdf8]" />
                      <span>BULK DATASET EXPORT (.CSV)</span>
                    </span>
                    <h4 className="text-base font-bold text-white mt-1">
                      Download Bulk Annual Capabilities &amp; Projections (.CSV)
                    </h4>
                    <p className="text-xs text-[#7a8b99] mt-0.5">
                      Spreadsheet containing all 8 master intelligence matrices: 2020–2027 salary trajectories across all 6 sectors, seniority percentiles, total comp breakdown, global hubs with COL indices, skill premiums, tax arbitrage net take-home, and platform capabilities audit.
                    </p>
                  </div>

                  <button
                    onClick={() => downloadBulkCapabilitiesCsv()}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#22d3a5] hover:from-[#0284c7] hover:to-[#1db88f] text-black font-bold text-sm transition flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.35)] active:scale-95 cursor-pointer shrink-0"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Download Bulk CSV</span>
                  </button>
                </div>

                <div className="pt-2 border-t border-[#1e2b36] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-[#0a0f14] p-2.5 rounded-lg border border-[#1e2b36]">
                    <div className="text-[10px] text-[#7a8b99]">DATA MATRICES</div>
                    <div className="text-[#38bdf8] font-bold">8 Master Sections</div>
                  </div>
                  <div className="bg-[#0a0f14] p-2.5 rounded-lg border border-[#1e2b36]">
                    <div className="text-[10px] text-[#7a8b99]">TIME HORIZON</div>
                    <div className="text-white font-bold">2020 – 2027 Proj.</div>
                  </div>
                  <div className="bg-[#0a0f14] p-2.5 rounded-lg border border-[#1e2b36]">
                    <div className="text-[10px] text-[#7a8b99]">FORMAT</div>
                    <div className="text-[#22d3a5] font-bold">Excel/Sheets CSV</div>
                  </div>
                  <div className="bg-[#0a0f14] p-2.5 rounded-lg border border-[#1e2b36]">
                    <div className="text-[10px] text-[#7a8b99]">DIRECT API</div>
                    <div className="text-[#fbbf24] font-bold truncate">/api/export/...</div>
                  </div>
                </div>
              </div>

              {/* What happens next guide */}
              <div className="bg-[#0a0f14] border border-[#1e2b36] rounded-xl p-4 space-y-3 text-xs">
                <div className="font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#38bdf8]" />
                  <span>HOW TO RUN LOCALLY AFTER UNZIPPING:</span>
                </div>
                <div className="bg-[#111a22] p-3 rounded-lg border border-[#1e2b36] text-[11px] text-[#22d3a5] font-mono space-y-1">
                  <div><span className="text-[#7a8b99]"># 1. Unzip the file and enter directory</span></div>
                  <div>unzip talent-radar-os-repository.zip -d talent-radar-os</div>
                  <div>cd talent-radar-os</div>
                  <div className="pt-1"><span className="text-[#7a8b99]"># 2. Install dependencies</span></div>
                  <div>npm install</div>
                  <div className="pt-1"><span className="text-[#7a8b99]"># 3. Start development server</span></div>
                  <div>npm run dev</div>
                  <div className="pt-1 text-[#7a8b99]"># Running locally at: http://localhost:3000</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GITHUB SETUP GUIDE */}
          {activeTab === 'git_setup' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-[#111a22] border border-[#38bdf8]/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#38bdf8] font-bold">
                    <GitBranch className="w-4 h-4" />
                    <span>CONFIGURE YOUR GITHUB REPOSITORY TARGET</span>
                  </div>
                  <span className="text-[10px] text-[#7a8b99]">Step-by-step remote push</span>
                </div>

                {/* Input Fields to Customize Git Commands */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-[#7a8b99] mb-1">Your GitHub Username:</label>
                    <input
                      type="text"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      placeholder="e.g. mortyp1125"
                      className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#38bdf8] rounded-lg px-3 py-2 text-white font-mono text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#7a8b99] mb-1">Repository Name:</label>
                    <input
                      type="text"
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value)}
                      placeholder="talent-radar-os"
                      className="w-full bg-[#0a0f14] border border-[#1e2b36] focus:border-[#38bdf8] rounded-lg px-3 py-2 text-white font-mono text-xs outline-none"
                    />
                  </div>
                </div>

                {/* Copyable Terminal Commands */}
                <div className="relative mt-2">
                  <div className="flex items-center justify-between pb-1.5 text-[10px] text-[#7a8b99]">
                    <span>TERMINAL COMMANDS (READY TO PASTE):</span>
                    <button
                      onClick={() => copyToClipboard(gitCommands, 'git-cmds')}
                      className="text-[#38bdf8] hover:text-white transition flex items-center gap-1 font-bold cursor-pointer"
                    >
                      {copiedKey === 'git-cmds' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#22d3a5]" />
                          <span className="text-[#22d3a5]">Copied to Clipboard</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Commands</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-[#0a0f14] p-3.5 rounded-xl border border-[#1e2b36] text-[11px] text-[#38bdf8] font-mono overflow-x-auto leading-relaxed select-all">
                    {gitCommands}
                  </pre>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[#7a8b99] text-[11px]">Need to create the repo on GitHub first?</span>
                  <a
                    href="https://github.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 text-[#38bdf8] border border-[#38bdf8]/40 font-bold transition flex items-center gap-1 text-xs"
                  >
                    <span>Open GitHub New Repo</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: README PREVIEW */}
          {activeTab === 'readme_preview' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e2b36]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#fbbf24]" />
                  <span className="font-bold text-white">README.md (Generated &amp; Bundled in Root)</span>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/README.md');
                      const text = await res.text();
                      copyToClipboard(text, 'readme-text');
                    } catch (_) {
                      copyToClipboard('# TALENT_RADAR.OS', 'readme-text');
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-[#1e2b36] hover:bg-[#2a3b49] text-xs font-semibold text-white transition flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === 'readme-text' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#22d3a5]" />
                      <span className="text-[#22d3a5]">Copied Markdown</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full Markdown</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[#0a0f14] p-4 rounded-xl border border-[#1e2b36] space-y-3 text-[11px] text-[#a0b2c6] max-h-96 overflow-y-auto leading-relaxed">
                <div className="text-white font-bold text-sm border-b border-[#1e2b36] pb-1">
                  # TALENT_RADAR.OS 🌐⚡
                </div>
                <p>
                  Next-Generation 3D Geospatial Career Intelligence, Quantitative Market Analytics, Autonomous AI Triad &amp; Commercial M&amp;A Platform.
                </p>
                <div className="font-bold text-[#22d3a5]">Key Capabilities Included in Repository:</div>
                <ul className="list-disc list-inside space-y-1 text-[#7a8b99]">
                  <li>Interactive Three.js 3D Globe with Continent HUD Telemetry</li>
                  <li>Recharts Multi-Sector Salary Trajectory Projections (2020–2027) with CSV Exporter</li>
                  <li>D3 Force-Directed Skill Tree with Market Premium Scoring</li>
                  <li>Autonomous 4-Agent AI Triad (Commander, Scout, Strategist, Envoy)</li>
                  <li>StealthNet Zero-Knowledge Anonymous Talent Mesh</li>
                  <li>$145K Commercial M&amp;A Buyout Platform &amp; Escrow Engine</li>
                  <li>Credible Subscriber Acquisition Hub &amp; 20% Partner Referral Engine</li>
                </ul>
                <div className="font-bold text-[#38bdf8] pt-2">Quickstart Commands:</div>
                <pre className="bg-[#111a22] p-2.5 rounded border border-[#1e2b36] text-[#22d3a5]">
                  npm install{'\n'}npm run dev{'\n'}npm run build{'\n'}npm start
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: CODEBASE FILE MANIFEST */}
          {activeTab === 'file_manifest' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#1e2b36]">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#a78bfa]" />
                  <span className="font-bold text-white">Repository File Tree &amp; Included Modules</span>
                </div>
                <span className="text-[10px] text-[#7a8b99]">{fileManifest.length} Primary Source Files</span>
              </div>

              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                {fileManifest.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#111a22] border border-[#1e2b36] hover:border-[#22d3a5]/40 transition flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 font-mono">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                        item.type === 'doc'
                          ? 'border-[#fbbf24]/40 text-[#fbbf24] bg-[#fbbf24]/10'
                          : item.type === 'config'
                          ? 'border-[#38bdf8]/40 text-[#38bdf8] bg-[#38bdf8]/10'
                          : 'border-[#22d3a5]/40 text-[#22d3a5] bg-[#22d3a5]/10'
                      }`}>
                        {item.type.toUpperCase()}
                      </span>
                      <span className="text-white font-semibold">{item.path}</span>
                    </div>
                    <span className="text-[11px] text-[#7a8b99] hidden sm:inline max-w-xs truncate text-right">
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-[#0a0f14] border-t border-[#1e2b36] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#7a8b99] text-[11px]">
            <ShieldCheck className="w-4 h-4 text-[#22d3a5]" />
            <span>Ready for GitHub, GitLab, Bitbucket or Self-Hosted Git</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownloadZip}
              disabled={downloading}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-[#22d3a5] hover:bg-[#1db88f] text-black font-bold transition flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(34,211,165,0.3)] active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .ZIP</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#1e2b36] hover:bg-[#2a3b49] text-white font-bold transition"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
