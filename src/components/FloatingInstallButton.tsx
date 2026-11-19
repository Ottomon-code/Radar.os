import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Monitor,
  CheckCircle2,
  X,
  ExternalLink,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const FloatingInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isMobile, install } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already installed in standalone mode, suppress the floating install widget
  if (isInstalled && !installSuccess) {
    return null;
  }

  // If user dismissed completely for this session
  if (isDismissed && !installSuccess) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      try {
        const result = await install();
        if (result === 'accepted') {
          setInstallSuccess(true);
          setTimeout(() => {
            setInstallSuccess(false);
          }, 6000);
        }
      } finally {
        setIsInstalling(false);
      }
    } else if (isIOS) {
      setShowGuideModal(true);
    } else {
      // If beforeinstallprompt hasn't fired yet (e.g. desktop iframe or browser policy)
      setShowGuideModal(true);
    }
  };

  return (
    <>
      {/* Success Notification Toast */}
      {installSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#0f291e] border border-[#22d3a5] text-[#22d3a5] shadow-[0_10px_35px_rgba(0,0,0,0.6)] font-mono text-xs animate-in fade-in slide-in-from-bottom-4"
        >
          <div className="p-1.5 rounded-lg bg-[#22d3a5]/20 text-[#22d3a5]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white text-[13px]">TalentRadar Installed!</div>
            <div className="text-[11px] text-[#22d3a5]/90">
              Launch directly from your home screen or desktop application launcher.
            </div>
          </div>
          <button
            onClick={() => setInstallSuccess(false)}
            className="p-1 text-[#7a8b99] hover:text-white transition cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Action Trigger */}
      <aside
        aria-label="Install TalentRadar Progressive Web App"
        className="fixed bottom-6 right-6 z-40 font-mono select-none"
      >
        {isMinimized ? (
          /* Minimized Compact Icon Bubble */
          <button
            onClick={() => setIsMinimized(false)}
            className="group relative flex items-center justify-center w-12 h-12 rounded-full bg-[#0f1720]/95 hover:bg-[#162330] border border-[#22d3a5]/60 hover:border-[#22d3a5] text-[#22d3a5] shadow-[0_8px_25px_rgba(0,0,0,0.6),0_0_15px_rgba(34,211,165,0.25)] transition-all duration-200 active:scale-95 cursor-pointer"
            title="Expand PWA Install App widget"
            aria-label="Install App"
          >
            <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22d3a5] opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#22d3a5]" />
            </span>
          </button>
        ) : (
          /* Expanded Sleek Floating Pill */
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0d151d]/95 backdrop-blur-md border border-[#22d3a5]/50 shadow-[0_12px_35px_rgba(0,0,0,0.6),0_0_20px_rgba(34,211,165,0.2)] hover:border-[#22d3a5] transition-all duration-300">
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="flex items-center gap-3 pl-3 pr-4 py-2 rounded-xl bg-gradient-to-r from-[#22d3a5]/20 via-[#38bdf8]/15 to-transparent hover:from-[#22d3a5]/30 hover:to-[#38bdf8]/25 text-white transition active:scale-98 cursor-pointer group text-left"
              title={
                isInstallable
                  ? 'Click to install TalentRadar as a standalone PWA on your device'
                  : 'View installation steps for your device'
              }
            >
              <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-[#22d3a5]/20 border border-[#22d3a5]/60 text-[#22d3a5] group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(34,211,165,0.3)]">
                {isMobile ? (
                  <Smartphone className="w-4 h-4" />
                ) : (
                  <Monitor className="w-4 h-4" />
                )}
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#22d3a5] animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs tracking-wide text-white group-hover:text-[#22d3a5] transition-colors">
                    {isInstalling ? 'INSTALLING...' : 'INSTALL APP'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#22d3a5]/20 text-[#22d3a5] font-semibold border border-[#22d3a5]/40 uppercase tracking-wider">
                    PWA
                  </span>
                </div>
                <div className="text-[10px] text-[#7a8b99] leading-tight mt-0.5 flex items-center gap-1">
                  <span>{isMobile ? 'Mobile Home Screen' : 'Desktop & Standalone'}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-[#22d3a5]">Offline Ready</span>
                </div>
              </div>

              <div className="ml-1 text-[#22d3a5] group-hover:translate-x-0.5 transition-transform">
                <ChevronRight className="w-4 h-4 opacity-75 group-hover:opacity-100" />
              </div>
            </button>

            {/* Controls: Minimize & Dismiss */}
            <div className="flex flex-col gap-0.5 pr-1 border-l border-[#1e2b36] pl-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1 rounded-md text-[#7a8b99] hover:text-[#dce7f0] hover:bg-[#162330] transition cursor-pointer"
                title="Minimize install button"
                aria-label="Minimize"
              >
                <Minimize2 className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 rounded-md text-[#7a8b99] hover:text-red-400 hover:bg-[#162330] transition cursor-pointer"
                title="Dismiss install button for this session"
                aria-label="Dismiss"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Guided Installation Walkthrough Modal */}
      {showGuideModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#0f1720] border border-[#22d3a5]/50 p-6 shadow-2xl text-[#dce7f0] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1e2b36]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#22d3a5]/15 border border-[#22d3a5]/40 text-[#22d3a5]">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    INSTALL TALENTRADAR APP
                  </h3>
                  <p className="text-[11px] text-[#7a8b99]">
                    Standalone Progressive Web Application (PWA)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg text-[#7a8b99] hover:text-white hover:bg-[#162330] transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-4 space-y-4 text-xs">
              {isIOS ? (
                /* iOS Safari Step-by-Step */
                <div className="space-y-3 bg-[#141d24] p-4 rounded-xl border border-[#1e2b36]">
                  <div className="text-[11px] font-bold text-[#38bdf8] uppercase tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Apple iOS Safari Instructions:</span>
                  </div>

                  <div className="space-y-2.5 text-xs text-[#dce7f0]">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#22d3a5]/20 text-[#22d3a5] font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                        1
                      </span>
                      <span>
                        Tap the <strong className="text-white">Share</strong> icon in the Safari toolbar (square with upward arrow).
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#22d3a5]/20 text-[#22d3a5] font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                        2
                      </span>
                      <span>
                        Scroll down the action sheet and select <strong className="text-[#22d3a5]">Add to Home Screen</strong>.
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#22d3a5]/20 text-[#22d3a5] font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                        3
                      </span>
                      <span>
                        Tap <strong className="text-white">Add</strong> in the top right. Launch anytime from your iPhone or iPad home screen with zero browser address bar!
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Chromium / Desktop / Android Step-by-Step */
                <div className="space-y-3 bg-[#141d24] p-4 rounded-xl border border-[#1e2b36]">
                  <div className="text-[11px] font-bold text-[#22d3a5] uppercase tracking-wider flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop &amp; Android Browser Install:</span>
                  </div>

                  <div className="space-y-2.5 text-xs text-[#dce7f0]">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#22d3a5]/20 text-[#22d3a5] font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                        1
                      </span>
                      <span>
                        Look for the <strong className="text-white">Install</strong> icon in your browser's address bar (computer icon with down arrow in Chrome, Edge, or Brave).
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#22d3a5]/20 text-[#22d3a5] font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                        2
                      </span>
                      <span>
                        Alternatively, open the browser menu (<strong className="text-white">⋮</strong> or <strong className="text-white">⋯</strong>) and select <strong className="text-[#22d3a5]">Install TalentRadar</strong> or <strong className="text-[#22d3a5]">Add to Home Screen</strong>.
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#22d3a5]/20 text-[#22d3a5] font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                        3
                      </span>
                      <span>
                        Click <strong className="text-white">Install</strong> to add it directly to your desktop dock or application menu with full offline caching support.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* PWA Benefits Pill Grid */}
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 rounded-lg bg-[#0a0f14] border border-[#1e2b36] flex items-center gap-2 text-[#7a8b99]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#22d3a5]" />
                  <span>Offline Service Worker</span>
                </div>
                <div className="p-2 rounded-lg bg-[#0a0f14] border border-[#1e2b36] flex items-center gap-2 text-[#7a8b99]">
                  <Sparkles className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Instant Full-Screen Launch</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex items-center gap-2">
              {isInstallable && (
                <button
                  onClick={async () => {
                    setShowGuideModal(false);
                    await install();
                  }}
                  className="flex-1 py-2 rounded-xl bg-[#22d3a5] hover:bg-[#1db88f] text-black font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(34,211,165,0.3)]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>TRIGGER INSTALL PROMPT</span>
                </button>
              )}
              <button
                onClick={() => setShowGuideModal(false)}
                className={`py-2 rounded-xl bg-[#1e2b36] hover:bg-[#253545] text-white font-bold text-xs transition cursor-pointer ${
                  isInstallable ? 'px-4' : 'w-full'
                }`}
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
