import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, CheckCircle2, Share2, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('pwa_banner_dismissed') === 'true';
  });
  const [isIos, setIsIos] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);

  useEffect(() => {
    // Check if already in standalone (installed) mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Capture standard PWA install prompt on Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
        }
      } catch (err) {
        console.error('Install prompt error:', err);
      } finally {
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide((prev) => !prev);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  // If already installed or dismissed, do not render
  if (isInstalled || isDismissed) {
    return null;
  }

  // Render floating PWA banner
  return (
    <aside
      aria-label="Install Application"
      className="fixed bottom-4 right-4 sm:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/95 border-2 border-emerald-500/60 shadow-[0_10px_40px_rgba(16,185,129,0.25)] backdrop-blur-xl relative overflow-hidden text-slate-100 space-y-3">
        {/* Top Accent Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-emerald-400 via-teal-400 to-indigo-500" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-white">Factory Labor PWA</span>
                <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  OFFLINE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                Install as a native standalone app for fast gate punches
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss install banner"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* iOS Step-by-Step Guide */}
        {showIosGuide && (
          <div className="p-3 rounded-2xl bg-slate-950/90 border border-emerald-500/30 text-xs text-slate-300 space-y-1.5 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 font-bold text-emerald-400">
              <Share2 className="w-3.5 h-3.5" />
              <span>How to install on iPhone/iPad:</span>
            </div>
            <ol className="list-decimal list-inside text-[11px] space-y-1 text-slate-400">
              <li>Tap the <strong className="text-white">Share</strong> button at bottom of Safari.</li>
              <li>Scroll down and tap <strong className="text-white">"Add to Home Screen" ➕</strong>.</li>
            </ol>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleInstallClick}
            className="flex-1 py-2.5 px-4 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>📱 Install App Now</span>
          </button>

          <button
            onClick={handleDismiss}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-700/80 cursor-pointer transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </aside>
  );
};

