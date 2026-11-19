import { useState, useEffect, useCallback } from 'react';
import {
  isOnline,
  getOfflineCacheMetadata,
  seedAndRefreshAllMarketDataOffline,
} from '../utils/offlineMarketCache';

export function useOfflineMarket() {
  const [online, setOnline] = useState<boolean>(() => isOnline());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [metadata, setMetadata] = useState(() => getOfflineCacheMetadata());
  const [showReconnectedNotice, setShowReconnectedNotice] = useState<boolean>(false);

  const refreshMetadata = useCallback(() => {
    setMetadata(getOfflineCacheMetadata());
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      setShowReconnectedNotice(true);
      refreshMetadata();
      const timer = setTimeout(() => setShowReconnectedNotice(false), 5000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setOnline(false);
      setShowReconnectedNotice(false);
      refreshMetadata();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check and auto-seed if first time
    if (!localStorage.getItem('talentradar_last_global_sync')) {
      seedAndRefreshAllMarketDataOffline().then(() => refreshMetadata());
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshMetadata]);

  const syncForOffline = async () => {
    setIsSyncing(true);
    try {
      const res = await seedAndRefreshAllMarketDataOffline();
      refreshMetadata();
      return res;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline: online,
    isOffline: !online,
    showReconnectedNotice,
    isSyncing,
    metadata,
    syncForOffline,
    refreshMetadata,
  };
}
