import { useEffect, useState } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Module-level early listener to capture beforeinstallprompt before React mounts
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as unknown as { __deferredPwaPrompt?: BeforeInstallPromptEvent }).__deferredPwaPrompt =
      e as BeforeInstallPromptEvent;
  });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined') {
      return (
        (window as unknown as { __deferredPwaPrompt?: BeforeInstallPromptEvent }).__deferredPwaPrompt ||
        null
      );
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed)
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true);
    setIsInstalled(Boolean(isStandalone));

    // Detect iOS & Mobile devices
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOSDevice =
        /iphone|ipad|ipod/.test(userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOS(isIOSDevice);
      setIsMobile(/android|iphone|ipad|ipod|mobile/i.test(userAgent));

      // Check if global prompt was captured
      const globalPrompt = (window as unknown as { __deferredPwaPrompt?: BeforeInstallPromptEvent })
        .__deferredPwaPrompt;
      if (globalPrompt && !deferredPrompt) {
        setDeferredPrompt(globalPrompt);
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const pwaEvent = e as BeforeInstallPromptEvent;
      (window as unknown as { __deferredPwaPrompt?: BeforeInstallPromptEvent }).__deferredPwaPrompt =
        pwaEvent;
      setDeferredPrompt(pwaEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (typeof window !== 'undefined') {
        delete (window as unknown as { __deferredPwaPrompt?: BeforeInstallPromptEvent })
          .__deferredPwaPrompt;
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const install = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable';
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        if (typeof window !== 'undefined') {
          delete (window as unknown as { __deferredPwaPrompt?: BeforeInstallPromptEvent })
            .__deferredPwaPrompt;
        }
        return 'accepted';
      }
      return 'dismissed';
    } catch (err) {
      console.warn('PWA install prompt error:', err);
      return 'unavailable';
    }
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isMobile,
    install,
  };
}
