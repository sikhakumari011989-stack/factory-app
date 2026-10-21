import React, { useState, useEffect, useRef } from 'react';
import {
  LogIn,
  LogOut,
  KeyRound,
  Users,
  Clock,
  Camera,
  CameraOff,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  UserCheck,
} from 'lucide-react';
import { PinPadView } from './PinPadView';
import { PunchConfirmationModal } from './PunchConfirmationModal';
import { useFactory } from '../../context/FactoryContext';
import { Worker, PunchType, TimePunch } from '../../types';
import { sounds } from '../../utils/soundEffects';
import { formatCurrency } from '../../utils/wageEngine';

export const GuardKiosk: React.FC = () => {
  const {
    workers,
    activeFloorWorkers,
    recordPunch,
    getContractorById,
    getShiftById,
    isOfflineMode,
    offlineQueueCount,
  } = useFactory();

  const [punchType, setPunchType] = useState<PunchType>('in');
  const [activeTab, setActiveTab] = useState<'pin' | 'list'>('pin');
  const [searchWorker, setSearchWorker] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Anti-proxy photo verification state
  const [antiProxyEnabled, setAntiProxyEnabled] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Success Modal State
  const [confirmedPunch, setConfirmedPunch] = useState<{
    worker: Worker;
    punch: TimePunch;
  } | null>(null);

  // Live Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Manage anti-proxy device camera stream if enabled
  useEffect(() => {
    if (antiProxyEnabled) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'user', width: 320, height: 240 }, audio: false })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch(() => {
          setAntiProxyEnabled(false);
          alert('Camera permission not available. Anti-proxy photo verification disabled.');
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [antiProxyEnabled]);

  // Capture snapshot from anti-proxy video element if enabled
  const capturePhotoSnapshot = (): string | undefined => {
    if (!antiProxyEnabled || !videoRef.current) return undefined;
    try {
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return undefined;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.65);
    } catch {
      return undefined;
    }
  };

  const handlePunchAttempt = (worker: Worker, method: 'pin' | 'manual' = 'pin') => {
    setErrorMessage(null);
    const photoUrl = capturePhotoSnapshot();
    const result = recordPunch(worker.id, punchType, method, photoUrl);

    if (result.success && result.punch && result.worker) {
      if (punchType === 'in') {
        sounds.playClockInSuccess();
      } else {
        sounds.playClockOutSuccess();
      }
      sounds.vibrate(100);

      setConfirmedPunch({
        worker: result.worker,
        punch: result.punch,
      });
    } else {
      sounds.playErrorTone();
      sounds.vibrate([100, 50, 100]);
      setErrorMessage(result.message || 'Verification failed. Please retry.');
    }
  };

  const handleCloseModal = () => {
    setConfirmedPunch(null);
  };

  const timeString = currentTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const dateString = currentTime.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Filter workers for Tap-to-Select list
  const filteredWorkers = workers.filter((w) => {
    const query = searchWorker.toLowerCase();
    return (
      w.name.toLowerCase().includes(query) ||
      w.workerCode.toLowerCase().includes(query) ||
      w.department.toLowerCase().includes(query)
    );
  });

  const activeWorkerIds = new Set(activeFloorWorkers.map((a) => a.worker.id));

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Hidden background video for anti-proxy capture */}
      {antiProxyEnabled && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="fixed -top-9999px -left-9999px opacity-0 pointer-events-none w-48 h-36"
        />
      )}

      {/* Kiosk Hero & Clock Header */}
      <div className="text-center p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Ambient Top Glow Bar */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-emerald-500 via-cyan-500 to-indigo-500" />

        {/* Top bar with Offline indicator & Anti-proxy toggle */}
        <div className="flex items-center justify-between gap-2 mb-4">
          {/* Offline / Online Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border border-slate-700/80 bg-slate-950/90 shadow-inner">
            {isOfflineMode ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <span className="text-amber-300 font-medium">Offline Gate Mode</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                  {offlineQueueCount}
                </span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-emerald-300 font-medium">Gate Terminal Live</span>
              </>
            )}
          </div>

          {/* Anti-Proxy Photo Verification Toggle */}
          <button
            type="button"
            onClick={() => setAntiProxyEnabled((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
              antiProxyEnabled
                ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-sm'
                : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="When active, takes a fast device snapshot upon punch to prevent proxy attendance"
          >
            {antiProxyEnabled ? (
              <Camera className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            ) : (
              <CameraOff className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>Photo Check: {antiProxyEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Giant Monospaced Clock */}
        <div className="font-mono text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-[0_0_24px_rgba(255,255,255,0.12)]">
          {timeString}
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-2 font-medium tracking-wide">{dateString}</p>
        <p className="text-[11px] font-mono text-slate-500 mt-1 uppercase tracking-widest flex items-center justify-center gap-2">
          <span>Gate Attendance Terminal</span>
          <span>•</span>
          <span className="text-emerald-400">PIN & Tap Entry</span>
        </p>
      </div>

      {/* Primary Punch Mode: Clock In vs Clock Out */}
      <div className="grid grid-cols-2 gap-4">
        {/* Clock In Button */}
        <button
          onClick={() => {
            sounds.playToggleSwitch();
            setPunchType('in');
            setErrorMessage(null);
          }}
          className={`relative h-28 sm:h-32 p-5 rounded-3xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2 active:scale-95 shadow-xl ${
            punchType === 'in'
              ? 'bg-gradient-to-b from-emerald-500/25 via-emerald-600/15 to-emerald-950/80 border-emerald-500 text-emerald-100 shadow-[0_0_35px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/50 scale-[1.02]'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-850'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${
              punchType === 'in'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50 scale-110'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <LogIn className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-lg sm:text-xl font-black tracking-tight text-white">CLOCK IN</span>
          <span className="text-[11px] font-medium text-emerald-300/80">Shift Entry</span>
        </button>

        {/* Clock Out Button */}
        <button
          onClick={() => {
            sounds.playToggleSwitch();
            setPunchType('out');
            setErrorMessage(null);
          }}
          className={`relative h-28 sm:h-32 p-5 rounded-3xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-2 active:scale-95 shadow-xl ${
            punchType === 'out'
              ? 'bg-gradient-to-b from-amber-500/25 via-amber-600/15 to-amber-950/80 border-amber-500 text-amber-100 shadow-[0_0_35px_rgba(245,158,11,0.3)] ring-2 ring-amber-500/50 scale-[1.02]'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-850'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${
              punchType === 'out'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/50 scale-110'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <LogOut className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-lg sm:text-xl font-black tracking-tight text-white">CLOCK OUT</span>
          <span className="text-[11px] font-medium text-amber-300/80">Shift Departure</span>
        </button>
      </div>

      {/* Error Alert Box */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/90 border border-rose-600 text-rose-100 text-sm flex items-start justify-between gap-3 animate-in shake duration-200 shadow-xl shadow-rose-950/50">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-xs font-bold text-rose-300 hover:text-white cursor-pointer px-2 py-1 rounded bg-rose-900/40 hover:bg-rose-900/80 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mode Switcher: 4-Digit PIN vs Tap Worker List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center p-1.5 rounded-2xl bg-slate-950 border border-slate-800/80 mb-6">
          <button
            type="button"
            onClick={() => {
              sounds.playKeypadClick();
              setActiveTab('pin');
            }}
            className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'pin'
                ? 'bg-slate-800 text-white shadow-lg border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>4-Digit PIN Entry</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playKeypadClick();
              setActiveTab('list');
            }}
            className={`flex-1 py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-slate-800 text-white shadow-lg border border-slate-700/80'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-400" />
            <span>Tap-to-Select Worker</span>
          </button>
        </div>

        {/* View Selection */}
        {activeTab === 'pin' ? (
          <PinPadView
            punchType={punchType}
            onPinSuccess={(worker) => handlePunchAttempt(worker, 'pin')}
            onPinError={(msg) => {
              sounds.playErrorTone();
              setErrorMessage(msg);
            }}
          />
        ) : (
          /* Tap-to-Select Worker List */
          <div className="space-y-4">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchWorker}
                onChange={(e) => setSearchWorker(e.target.value)}
                placeholder="Search worker name, code, or department..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Workers Grid */}
            {filteredWorkers.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                <Users className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-300">No matching workers found</p>
                <p className="text-[11px] text-slate-500">
                  Register workers in the Manage Workers panel to punch them in.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredWorkers.map((worker) => {
                  const isOnFloor = activeWorkerIds.has(worker.id);
                  const isReadyToPunch = punchType === 'in' ? !isOnFloor : isOnFloor;

                  return (
                    <div
                      key={worker.id}
                      className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-850 border border-slate-800 transition-all flex items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs truncate">
                            {worker.name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                            {worker.workerCode}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {worker.department}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`inline-block w-2 h-2 rounded-full ${
                              isOnFloor ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]' : 'bg-slate-600'
                            }`}
                          />
                          <span className="text-[10px] text-slate-400 font-mono">
                            {isOnFloor ? 'On Floor' : 'Off Floor'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handlePunchAttempt(worker, 'manual')}
                        className={`px-3 py-2 rounded-xl text-xs font-black cursor-pointer transition-all active:scale-95 shrink-0 ${
                          punchType === 'in'
                            ? isOnFloor
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950'
                            : !isOnFloor
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                            : 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-950'
                        }`}
                      >
                        {punchType === 'in' ? 'CLOCK IN' : 'CLOCK OUT'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmedPunch && (
        <PunchConfirmationModal
          isOpen={true}
          onClose={handleCloseModal}
          worker={confirmedPunch.worker}
          contractor={getContractorById(confirmedPunch.worker.contractorId)}
          shift={getShiftById(confirmedPunch.worker.shiftId)}
          punch={confirmedPunch.punch}
        />
      )}
    </div>
  );
};
