import React from 'react';
import { WifiOff, Wifi, RefreshCw, CheckCircle2, Database, ShieldAlert } from 'lucide-react';
import { useOfflineMarket } from '../hooks/useOfflineMarket';

export const OfflineIndicator: React.FC = () => {
  const { isOffline, showReconnectedNotice, isSyncing, metadata, syncForOffline } = useOfflineMarket();

  if (!isOffline && !showReconnectedNotice) {
    return null;
  }

  if (showReconnectedNotice) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#0f241c] border border-[#22d3a5] text-[#22d3a5] shadow-[0_10px_25px_rgba(0,0,0,0.5)] text-xs font-mono animate-in fade-in slide-in-from-bottom-2 duration-300">
        <Wifi className="w-4 h-4 text-[#22d3a5]" />
        <span className="font-semibold">Connectivity Restored</span>
        <span className="text-gray-400">|</span>
        <span>Market analytics and news snippets live-synchronized.</span>
        <CheckCircle2 className="w-4 h-4 text-[#22d3a5]" />
      </div>
    );
  }

  return (
    <aside 
      aria-label="Offline Mode Notice"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[#141d24]/95 backdrop-blur-md border border-amber-500/50 text-[#dce7f0] shadow-[0_12px_30px_rgba(0,0,0,0.6)] text-xs font-mono animate-in fade-in slide-in-from-bottom-3"
    >
      <div className="flex items-start sm:items-center gap-2.5">
        <div className="relative flex items-center justify-center p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <WifiOff className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400 tracking-wide uppercase text-[11px]">
              Offline Mode Active
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Service Worker Cache
            </span>
          </div>
          <p className="text-[11px] text-gray-300 mt-0.5">
            Displaying last refreshed salary trajectories &amp; news intel ({metadata.formattedSalarySync}).
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <button
          onClick={() => syncForOffline()}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e2b36] hover:bg-[#253543] border border-[#2a3f50] text-[#dce7f0] text-[11px] font-semibold transition active:scale-95 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Verifying...' : 'Re-verify Cache'}</span>
        </button>
      </div>
    </aside>
  );
};
