import React, { useState } from 'react';
import { Wifi, WifiOff, HardDriveDownload, Check, Database, Sparkles } from 'lucide-react';
import { useOfflineMarket } from '../hooks/useOfflineMarket';

interface OfflineCacheStatusBadgeProps {
  label?: string;
  category?: 'salary' | 'news' | 'all';
}

export const OfflineCacheStatusBadge: React.FC<OfflineCacheStatusBadgeProps> = ({
  label,
  category = 'all',
}) => {
  const { isOffline, isSyncing, metadata, syncForOffline } = useOfflineMarket();
  const [justSynced, setJustSynced] = useState(false);

  const handleManualSync = async () => {
    await syncForOffline();
    setJustSynced(true);
    setTimeout(() => setJustSynced(false), 3000);
  };

  const syncTime = category === 'news' ? metadata.formattedNewsSync : metadata.formattedSalarySync;

  if (isOffline) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
        <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="font-semibold">Offline Intel:</span>
        <span className="text-gray-300">{syncTime}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold">
          CACHED
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111a22] border border-[#1e2b36] text-xs font-mono text-gray-400">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22d3a5] animate-pulse" />
        <span className="text-gray-300">Offline Ready:</span>
        <span className="text-[#22d3a5] font-semibold">{syncTime}</span>
      </div>

      <button
        onClick={handleManualSync}
        disabled={isSyncing}
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1e2b36] hover:bg-[#253543] border border-[#22d3a5]/30 hover:border-[#22d3a5]/60 text-xs font-mono text-[#dce7f0] transition active:scale-95 cursor-pointer disabled:opacity-50"
        title="Cache all salary trends and market news snippets for offline access"
      >
        {justSynced ? (
          <>
            <Check className="w-3.5 h-3.5 text-[#22d3a5]" />
            <span className="text-[#22d3a5] font-bold">Cached!</span>
          </>
        ) : (
          <>
            <HardDriveDownload className={`w-3.5 h-3.5 text-[#22d3a5] ${isSyncing ? 'animate-bounce' : ''}`} />
            <span>{isSyncing ? 'Caching...' : (label || 'Save Offline')}</span>
          </>
        )}
      </button>
    </div>
  );
};
