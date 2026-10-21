import React, { useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';

export const OfflineSyncBanner: React.FC = () => {
  const { isOfflineMode, offlineQueueCount, toggleOfflineMode, syncOfflineQueue } = useFactory();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    try {
      const count = await syncOfflineQueue();
      setSyncSuccessMsg(`Successfully synced ${count} queued records!`);
      setTimeout(() => setSyncSuccessMsg(null), 3500);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOfflineMode && offlineQueueCount === 0 && !syncSuccessMsg) {
    return null;
  }

  return (
    <div
      className={`px-4 py-2.5 border-b text-xs sm:text-sm font-medium flex flex-wrap items-center justify-between gap-3 transition-colors ${
        isOfflineMode
          ? 'bg-amber-950/80 border-amber-800/80 text-amber-200'
          : syncSuccessMsg
          ? 'bg-emerald-950/80 border-emerald-800/80 text-emerald-200'
          : 'bg-blue-950/80 border-blue-800/80 text-blue-200'
      }`}
    >
      <div className="flex items-center gap-2">
        {isOfflineMode ? (
          <>
            <WifiOff className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span>
              <strong>Offline Mode Active:</strong> Guard kiosk punches are being queued locally in IndexedDB / Storage.
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-xs font-semibold border border-amber-500/30">
              {offlineQueueCount} queued
            </span>
          </>
        ) : syncSuccessMsg ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncSuccessMsg}</span>
          </>
        ) : (
          <>
            <ShieldAlert className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong>Online:</strong> {offlineQueueCount} pending punch records ready to sync.
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {offlineQueueCount > 0 && !isOfflineMode && (
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow disabled:opacity-50 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync to Cloud Now'}
          </button>
        )}

        <button
          onClick={toggleOfflineMode}
          className={`px-2.5 py-1 rounded text-xs font-semibold border transition-all cursor-pointer ${
            isOfflineMode
              ? 'bg-amber-800/60 hover:bg-amber-700/60 border-amber-600 text-amber-100'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
          }`}
          title="Toggle network simulation"
        >
          {isOfflineMode ? 'Reconnect Network' : 'Simulate Offline'}
        </button>
      </div>
    </div>
  );
};

