import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { getActiveServerUrl, getPublicShareBaseUrl, BRANDED_CUSTOM_URL } from '../utils/serverConfig';

interface FunctionalQRCodeProps {
  value?: string;
  size?: number;
  title?: string;
  subtitle?: string;
  showControls?: boolean;
  darkColor?: string;
  lightColor?: string;
  className?: string;
}

export default function FunctionalQRCode({
  value,
  size = 180,
  title = 'Mobile Ingress QR Code',
  subtitle = 'Scan with any smartphone camera to open instantly',
  showControls = true,
  darkColor = '#000000',
  lightColor = '#ffffff',
  className = '',
}: FunctionalQRCodeProps) {
  const defaultUrl = value || getActiveServerUrl() || BRANDED_CUSTOM_URL;
  const [dataUrl, setDataUrl] = useState<string>('');
  const [svgString, setSvgString] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeUrl, setActiveUrl] = useState(defaultUrl);
  const [presetKey, setPresetKey] = useState<'live' | 'domain' | 'radar' | 'playstore' | 'custom'>('live');
  const [customInput, setCustomInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync activeUrl with prop value when it changes
  useEffect(() => {
    if (value) {
      setActiveUrl(value);
    }
  }, [value]);

  // Generate functional QR Code whenever activeUrl or colors change
  useEffect(() => {
    let isSubscribed = true;
    setIsGenerating(true);

    async function generateCodes() {
      try {
        const target = activeUrl.trim() || 'https://talentradar.io';

        // 1. Generate high-res DataURL PNG (scale 8 for crisp 1080p display and download)
        const pngUrl = await QRCode.toDataURL(target, {
          width: size * 3,
          margin: 2,
          color: {
            dark: darkColor,
            light: lightColor,
          },
          errorCorrectionLevel: 'M',
        });

        // 2. Generate clean vector SVG
        const svg = await QRCode.toString(target, {
          type: 'svg',
          margin: 2,
          color: {
            dark: darkColor,
            light: lightColor,
          },
          errorCorrectionLevel: 'M',
        });

        if (isSubscribed) {
          setDataUrl(pngUrl);
          setSvgString(svg);
        }
      } catch (err) {
        console.error('Failed to generate functional QR code:', err);
      } finally {
        if (isSubscribed) {
          setIsGenerating(false);
        }
      }
    }

    generateCodes();

    return () => {
      isSubscribed = false;
    };
  }, [activeUrl, size, darkColor, lightColor]);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(activeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPng = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `TalentRadar-QRCode-${activeUrl.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadSvg = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TalentRadar-QRCode-${activeUrl.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '_')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSelectPreset = (key: 'live' | 'domain' | 'radar' | 'playstore' | 'custom') => {
    setPresetKey(key);
    const serverUrl = getPublicShareBaseUrl();
    if (key === 'live') {
      setActiveUrl(serverUrl);
    } else if (key === 'domain') {
      setActiveUrl(BRANDED_CUSTOM_URL);
    } else if (key === 'radar') {
      setActiveUrl(`${serverUrl}/radar`);
    } else if (key === 'playstore') {
      setActiveUrl(`${serverUrl}/.well-known/assetlinks.json`);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      let url = customInput.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      setActiveUrl(url);
    }
  };

  return (
    <div className={`bg-[#0f171e] border border-[#1e2b36] rounded-xl p-4 sm:p-5 text-[#dce7f0] font-mono ${className}`}>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
        {/* QR Code Canvas / Visual Matrix Container */}
        <div className="relative group shrink-0">
          <div
            className="p-3 bg-white rounded-xl shadow-[0_0_20px_rgba(34,211,165,0.2)] border-2 border-[#22d3a5]/40 flex items-center justify-center transition-transform hover:scale-[1.02]"
            style={{ width: size + 24, height: size + 24 }}
          >
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center text-slate-800 text-xs font-bold gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-[#22d3a5]" />
                <span>Encoding Matrix...</span>
              </div>
            ) : dataUrl ? (
              <img
                src={dataUrl}
                alt={`Functional QR code for ${activeUrl}`}
                className="w-full h-full object-contain select-none"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              <div className="text-gray-400 text-xs">Error generating QR</div>
            )}
          </div>

          {/* Quick scan pulse badge */}
          <div className="absolute -top-2 -right-2 bg-[#22d3a5] text-black text-[9px] font-bold px-2 py-0.5 rounded-full shadow flex items-center gap-1 border border-black/20">
            <Smartphone className="w-2.5 h-2.5" />
            <span>SCANNABLE</span>
          </div>
        </div>

        {/* QR Metadata & Action Controls */}
        <div className="flex-1 space-y-3 w-full">
          <div>
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#22d3a5]" />
              <h4 className="text-sm font-bold text-[#dce7f0]">{title}</h4>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                ISO/IEC 18004
              </span>
            </div>
            <p className="text-xs text-[#7a8b99] font-sans mt-0.5">{subtitle}</p>
          </div>

          {/* Target URL Display */}
          <div className="p-2.5 bg-[#0a0f14] border border-[#1e2b36] rounded-lg flex items-center justify-between gap-2 text-xs">
            <div className="truncate font-mono text-[#38bdf8] flex items-center gap-1.5 min-w-0">
              <ExternalLink className="w-3.5 h-3.5 shrink-0 text-[#7a8b99]" />
              <span className="truncate">{activeUrl}</span>
            </div>
            <button
              onClick={handleCopyUrl}
              className="px-2 py-1 rounded bg-[#1e2b36] hover:bg-[#22d3a5]/20 hover:text-[#22d3a5] text-[11px] font-bold flex items-center gap-1 transition shrink-0 cursor-pointer"
              title="Copy Target URL"
            >
              {copied ? <Check className="w-3 h-3 text-[#22d3a5]" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Preset Buttons */}
          {showControls && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-[10px] text-[#7a8b99] uppercase mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('live')}
                  className={`px-2 py-0.5 rounded border transition cursor-pointer ${
                    presetKey === 'live'
                      ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5] font-bold'
                      : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
                  }`}
                  title="Encode active live Cloud Run host for instant mobile camera testing"
                >
                  Live App
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('domain')}
                  className={`px-2 py-0.5 rounded border transition cursor-pointer ${
                    presetKey === 'domain'
                      ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5] font-bold'
                      : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
                  }`}
                  title="Encode production branded domain talentradar.io"
                >
                  talentradar.io
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('radar')}
                  className={`px-2 py-0.5 rounded border transition cursor-pointer ${
                    presetKey === 'radar'
                      ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5] font-bold'
                      : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
                  }`}
                >
                  3D Radar
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('playstore')}
                  className={`px-2 py-0.5 rounded border transition cursor-pointer ${
                    presetKey === 'playstore'
                      ? 'bg-[#22d3a5]/20 border-[#22d3a5] text-[#22d3a5] font-bold'
                      : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
                  }`}
                >
                  AssetLinks
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('custom')}
                  className={`px-2 py-0.5 rounded border transition cursor-pointer ${
                    presetKey === 'custom'
                      ? 'bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8] font-bold'
                      : 'bg-[#0a0f14] border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0]'
                  }`}
                >
                  Custom URL
                </button>
              </div>

              {presetKey === 'custom' && (
                <form onSubmit={handleApplyCustom} className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter custom URL or path..."
                    className="flex-1 bg-[#0a0f14] border border-[#1e2b36] focus:border-[#38bdf8] rounded px-2.5 py-1 text-xs text-[#dce7f0] outline-none"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 rounded bg-[#38bdf8] hover:bg-[#0ea5e9] text-black font-bold text-xs cursor-pointer"
                  >
                    Generate
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Action Download Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1e2b36]">
            <button
              onClick={handleDownloadPng}
              className="px-3 py-1.5 rounded-lg bg-[#22d3a5] hover:bg-[#1db88f] text-black font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(34,211,165,0.25)]"
              title="Download high-resolution 1080p PNG for mobile flyers and client decks"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD PNG</span>
            </button>
            <button
              onClick={handleDownloadSvg}
              className="px-3 py-1.5 rounded-lg bg-[#111a22] hover:bg-[#1a2938] border border-[#22d3a5]/50 text-[#22d3a5] font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Download vector SVG for lossless scalable printing"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>DOWNLOAD SVG</span>
            </button>
            <a
              href={activeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#111a22] hover:bg-[#1a2938] border border-[#1e2b36] text-[#7a8b99] hover:text-[#dce7f0] text-xs flex items-center gap-1 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open URL</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
