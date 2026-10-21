import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Calendar, Building2, ArrowRight, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Worker, Contractor, Shift, TimePunch } from '../../types';
import { formatCurrency } from '../../utils/wageEngine';

interface PunchConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
  contractor?: Contractor;
  shift?: Shift;
  punch: TimePunch;
}

export const PunchConfirmationModal: React.FC<PunchConfirmationModalProps> = ({
  isOpen,
  onClose,
  worker,
  contractor,
  shift,
  punch,
}) => {
  const [countdown, setCountdown] = useState(4);
  const isClockIn = punch.punchType === 'in';

  useEffect(() => {
    if (!isOpen) {
      setCountdown(4);
      return;
    }

    // Trigger celebratory confetti burst on successful punch
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: isClockIn ? ['#10b981', '#3b82f6', '#06b6d4'] : ['#f59e0b', '#ec4899', '#8b5cf6'],
      });
    } catch {
      // Ignored
    }

    // Auto-dismiss countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isClockIn, onClose]);

  if (!isOpen) return null;

  const punchTime = new Date(punch.timestamp);
  const formattedTime = punchTime.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const formattedDate = punchTime.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
        {/* Top Header Banner */}
        <div
          className={`px-6 py-6 text-center ${
            isClockIn
              ? 'bg-gradient-to-b from-emerald-600/30 via-emerald-600/10 to-transparent'
              : 'bg-gradient-to-b from-amber-600/30 via-amber-600/10 to-transparent'
          }`}
        >
          <div
            className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-3 shadow-xl ${
              isClockIn
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/40 ring-4 ring-emerald-500/20'
                : 'bg-amber-500 text-slate-950 shadow-amber-500/40 ring-4 ring-amber-500/20'
            }`}
          >
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            {isClockIn ? 'CLOCKED IN SUCCESSFULLY' : 'CLOCKED OUT SUCCESSFULLY'}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Gate Kiosk Entry Verified • <strong className="font-mono text-slate-200">{punch.method.toUpperCase()}</strong> AUTH</span>
          </p>
        </div>

        {/* Worker & Shift Details Card */}
        <div className="px-6 py-3 space-y-3.5">
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center gap-4 shadow-sm">
            {punch.photoUrl ? (
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md shrink-0">
                <img
                  src={punch.photoUrl}
                  alt="Anti-Proxy Snapshot"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 inset-x-0 bg-emerald-600/90 text-[7px] font-black text-center text-white uppercase tracking-wider py-0.5">
                  PHOTO OK
                </span>
              </div>
            ) : (
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-slate-950 font-black text-lg shadow-md shrink-0 ${
                  isClockIn
                    ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                    : 'bg-gradient-to-br from-amber-400 to-orange-500'
                }`}
              >
                {worker.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-base truncate">
                  {worker.name}
                </span>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-950 text-emerald-400 border border-slate-700 shadow-inner">
                  {worker.workerCode}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">{worker.department}</p>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-300 font-medium">
                <span className="text-slate-500">Base Wage:</span>
                <span className="font-mono text-emerald-400 font-bold">{formatCurrency(worker.baseHourlyRate)}/hr</span>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" /> Contractor
              </span>
              <p className="font-semibold text-slate-200 mt-1 truncate">
                {contractor ? contractor.name : 'General Contractor'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" /> Assigned Shift
              </span>
              <p className="font-semibold text-slate-200 mt-1 truncate">
                {shift ? shift.name : 'Assigned Shift'}
              </p>
            </div>

            <div className="col-span-2 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" /> Verified Timestamp
                </span>
                <div className="font-mono font-extrabold text-white text-base mt-0.5">
                  {formattedTime}
                </div>
              </div>
              <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                {formattedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button & Auto Dismiss countdown */}
        <div className="p-6 pt-3 space-y-2">
          <button
            onClick={onClose}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xl ${
              isClockIn
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
            }`}
          >
            <span>Ready for Next Worker</span>
            <span className="font-mono text-xs opacity-90">({countdown}s)</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Animated Countdown Progress Bar */}
        <div className="h-1 bg-slate-800 w-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${isClockIn ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${(countdown / 4) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

