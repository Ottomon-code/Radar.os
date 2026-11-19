import React, { useState } from 'react';
import { Download, Smartphone, Check, X, ShieldCheck, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ variant?: 'button' | 'banner' }> = ({
  variant = 'button',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  // If already running inside an installed standalone PWA, hide install prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className="bg-gradient-to-r from-[#111a22] via-[#152330] to-[#111a22] border-b border-[#22d3a5]/40 px-4 py-2 text-xs font-mono text-[#dce7f0] flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#22d3a5]" />
            <span>
              Install <strong>Global Job &amp; Career Radar</strong> as a native Android / Desktop app
            </span>
          </div>
          <button
            onClick={handleInstallClick}
            disabled={installing}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#22d3a5] hover:bg-[#1db88f] text-black font-bold transition shadow-[0_0_10px_rgba(34,211,165,0.3)] active:scale-95 cursor-pointer text-[11px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{installing ? 'INSTALLING...' : 'INSTALL APP'}</span>
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleInstallClick}
        disabled={installing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22d3a5]/20 hover:bg-[#22d3a5]/30 border border-[#22d3a5] text-[#22d3a5] font-bold transition shadow-[0_0_12px_rgba(34,211,165,0.2)] active:scale-95 cursor-pointer text-xs"
        title="Install Global Job & Career Radar on your device"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>{installing ? 'INSTALLING...' : 'INSTALL APP'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111a22] hover:bg-[#1e2b36] border border-[#22d3a5]/40 text-[#22d3a5] font-bold transition text-xs cursor-pointer"
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>INSTALL APP</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
            <div className="w-full max-w-sm rounded-2xl bg-[#0f1720] border border-[#22d3a5]/50 p-6 shadow-2xl text-[#dce7f0]">
              <div className="flex items-center justify-between pb-3 border-b border-[#1e2b36]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#22d3a5]" />
                  <span>INSTALL ON IPHONE / IPAD</span>
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded text-[#7a8b99] hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-[#7a8b99] leading-relaxed">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#22d3a5]/20 text-[#22d3a5] font-bold flex items-center justify-center shrink-0 text-[10px]">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong> icon in the Safari navigation bar at the bottom.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#22d3a5]/20 text-[#22d3a5] font-bold flex items-center justify-center shrink-0 text-[10px]">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong>Add to Home Screen</strong>.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#22d3a5]/20 text-[#22d3a5] font-bold flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </span>
                  <span>
                    Confirm <strong>Add</strong>. Launch the app directly from your home screen in full standalone mode!
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-[#22d3a5] hover:bg-[#1db88f] py-2 text-xs font-bold text-black transition cursor-pointer"
              >
                GOT IT
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
