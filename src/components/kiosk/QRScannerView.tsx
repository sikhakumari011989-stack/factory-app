import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, QrCode, Scan, Sparkles, AlertCircle } from 'lucide-react';
import { Worker, PunchType } from '../../types';
import { useFactory } from '../../context/FactoryContext';

interface QRScannerViewProps {
  punchType: PunchType;
  onScanSuccess: (worker: Worker) => void;
  onScanError: (msg: string) => void;
}

export const QRScannerView: React.FC<QRScannerViewProps> = ({
  punchType,
  onScanSuccess,
  onScanError,
}) => {
  const { workers, getWorkerByCode } = useFactory();
  const [cameraActive, setCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleCamera = async () => {
    if (cameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setCameraActive(false);
      setCameraError(null);
    } else {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } catch (err) {
        setCameraError('Camera access not granted or unavailable. Use the simulator or badge buttons below.');
        setCameraActive(false);
      }
    }
  };

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    const worker = getWorkerByCode(manualCode);
    if (worker) {
      onScanSuccess(worker);
      setManualCode('');
    } else {
      onScanError(`Worker code "${manualCode}" not recognized in registry`);
    }
  };

  const handleQuickBadgeScan = (worker: Worker) => {
    onScanSuccess(worker);
  };

  const isClockIn = punchType === 'in';

  return (
    <div className="space-y-4">
      {/* Scanner Viewfinder Box */}
      <div className="relative aspect-square max-w-sm mx-auto bg-slate-950 rounded-3xl border-2 border-slate-700/80 overflow-hidden shadow-2xl flex flex-col items-center justify-center p-4">
        {/* Real camera video feed or simulation background */}
        {cameraActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* CRT scanline texture */}
            <div className="absolute inset-0 pointer-events-none scanner-scanline opacity-25" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 flex flex-col items-center justify-center text-slate-500 p-6 text-center">
            {/* Ambient background glow */}
            <div className={`absolute w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none ${isClockIn ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            
            <QrCode className="w-20 h-20 text-slate-700 mb-2 stroke-1 relative z-10" />
            <span className="text-xs text-slate-300 font-semibold relative z-10">
              Align Worker Badge QR Code to the Scanner
            </span>
            <span className="text-[11px] font-mono text-slate-500 mt-1 relative z-10">
              Auto-detect active • Optical Laser Ready
            </span>
          </div>
        )}

        {/* Viewfinder Frame with animated laser */}
        <div className={`relative z-10 w-52 h-52 border-2 border-dashed rounded-2xl flex items-center justify-center pointer-events-none ${
          isClockIn ? 'border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
        }`}>
          {/* Laser scanning beam */}
          <div className={`absolute left-2 right-2 h-0.5 shadow-lg animate-laser ${
            isClockIn
              ? 'bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_16px_#10b981]'
              : 'bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_16px_#f59e0b]'
          }`} />

          {/* Corner accents */}
          <div className={`absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 rounded-tl-lg ${isClockIn ? 'border-emerald-400' : 'border-amber-400'}`} />
          <div className={`absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 rounded-tr-lg ${isClockIn ? 'border-emerald-400' : 'border-amber-400'}`} />
          <div className={`absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 rounded-bl-lg ${isClockIn ? 'border-emerald-400' : 'border-amber-400'}`} />
          <div className={`absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 rounded-br-lg ${isClockIn ? 'border-emerald-400' : 'border-amber-400'}`} />
        </div>

        {/* Bottom scanner overlay banner */}
        <div className="absolute bottom-3 inset-x-3 z-10 flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs shadow-lg">
          <span className="text-slate-300 font-medium flex items-center gap-2">
            <Scan className={`w-4 h-4 animate-pulse ${isClockIn ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>Target:</span>
            <strong className={`uppercase font-bold tracking-wider ${isClockIn ? 'text-emerald-300' : 'text-amber-300'}`}>
              {punchType === 'in' ? 'CLOCK IN' : 'CLOCK OUT'}
            </strong>
          </span>
          <button
            onClick={toggleCamera}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 cursor-pointer transition-colors"
          >
            {cameraActive ? <CameraOff className="w-3.5 h-3.5 text-rose-400" /> : <Camera className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{cameraActive ? 'Stop Cam' : 'Start Cam'}</span>
          </button>
        </div>
      </div>

      {cameraError && (
        <div className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 text-center flex items-center justify-center gap-2 max-w-sm mx-auto shadow-md">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Manual Input / Barcode Scanner gun input */}
      <form onSubmit={handleManualScanSubmit} className="flex gap-2 max-w-sm mx-auto">
        <input
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Scan barcode or type Worker Code (e.g. WRK-101)..."
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 placeholder-slate-500 font-mono text-xs sm:text-sm focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
        />
        <button
          type="submit"
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs cursor-pointer shadow-md border border-slate-700 transition-colors"
        >
          Verify
        </button>
      </form>

      {/* Instant 1-Click Worker Badge Simulator for instant testing */}
      <div className="max-w-md mx-auto pt-2">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Worker Badge Simulator:</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {workers.length} worker{workers.length === 1 ? '' : 's'} registered
          </span>
        </div>
        {workers.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-dashed border-slate-800 text-center space-y-1">
            <p className="text-xs font-semibold text-slate-300">No factory workers registered yet</p>
            <p className="text-[11px] text-slate-500">
              Enroll workers in the Worker Registry to enable one-tap badge punches, or type a badge ID above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {workers.slice(0, 6).map((w) => (
              <button
                key={w.id}
                onClick={() => handleQuickBadgeScan(w)}
                className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-750 border border-slate-700/80 text-left transition-all hover:scale-[1.02] active:scale-95 cursor-pointer group shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    {w.workerCode}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">PIN: {w.pin}</span>
                </div>
                <div className="font-semibold text-slate-200 text-xs truncate mt-1.5 group-hover:text-white transition-colors">
                  {w.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {w.department}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

