import React, { useState, useEffect } from 'react';
import { Delete, CheckCircle2, UserCheck, ShieldCheck, Sparkles, Building2 } from 'lucide-react';
import { Worker, PunchType } from '../../types';
import { useFactory } from '../../context/FactoryContext';
import { sounds } from '../../utils/soundEffects';
import { formatCurrency } from '../../utils/wageEngine';

interface PinPadViewProps {
  punchType: PunchType;
  onPinSuccess: (worker: Worker) => void;
  onPinError: (msg: string) => void;
}

export const PinPadView: React.FC<PinPadViewProps> = ({
  punchType,
  onPinSuccess,
  onPinError,
}) => {
  const { workers, getWorkerByPin, getContractorById } = useFactory();
  const [pin, setPin] = useState('');
  const [matchedWorker, setMatchedWorker] = useState<Worker | null>(null);

  const isClockIn = punchType === 'in';

  // Check pin when it reaches 4 digits
  useEffect(() => {
    if (pin.length === 4) {
      const worker = getWorkerByPin(pin);
      if (worker) {
        setMatchedWorker(worker);
        sounds.playToggleSwitch();
      } else {
        setMatchedWorker(null);
        sounds.playErrorTone();
        onPinError(`No active worker found with PIN: ${pin}`);
        setTimeout(() => setPin(''), 1000);
      }
    } else {
      setMatchedWorker(null);
    }
  }, [pin, getWorkerByPin, onPinError]);

  const handleDigit = (digit: string) => {
    sounds.playKeypadClick();
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleClear = () => {
    sounds.playKeypadClick();
    setPin('');
    setMatchedWorker(null);
  };

  const handleBackspace = () => {
    sounds.playKeypadClick();
    setPin((prev) => prev.slice(0, -1));
  };

  const handleConfirm = () => {
    if (matchedWorker) {
      onPinSuccess(matchedWorker);
      setPin('');
      setMatchedWorker(null);
    }
  };

  return (
    <div className="max-w-sm mx-auto space-y-4">
      {/* PIN dots & status display */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 text-center shadow-inner relative overflow-hidden">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          <span>Worker Keypad Entry</span>
          <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${isClockIn ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
            {isClockIn ? 'ACTION: CLOCK IN' : 'ACTION: CLOCK OUT'}
          </span>
        </div>

        {/* 4 PIN Dots */}
        <div className="flex items-center justify-center gap-4 my-3">
          {[0, 1, 2, 3].map((index) => {
            const hasVal = pin.length > index;
            return (
              <div
                key={index}
                className={`w-5 h-5 rounded-full transition-all duration-200 flex items-center justify-center ${
                  hasVal
                    ? isClockIn
                      ? 'bg-emerald-400 scale-125 shadow-[0_0_14px_rgba(16,185,129,0.7)]'
                      : 'bg-amber-400 scale-125 shadow-[0_0_14px_rgba(245,158,11,0.7)]'
                    : 'bg-slate-900 border-2 border-slate-700/80'
                }`}
              >
                {hasVal && (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                )}
              </div>
            );
          })}
        </div>

        {/* Worker preview once identified */}
        {matchedWorker ? (
          <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-emerald-500/50 text-emerald-200 text-xs animate-in zoom-in-95 duration-200 shadow-lg">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-sm shrink-0">
                {matchedWorker.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-100 flex items-center gap-2 truncate">
                  <span>{matchedWorker.name}</span>
                  <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-slate-800 text-emerald-400 border border-slate-700">
                    {matchedWorker.workerCode}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">
                  {matchedWorker.department} • Rate: {formatCurrency(matchedWorker.baseHourlyRate)}/hr
                </div>
              </div>
            </div>
          </div>
        ) : workers.length === 0 ? (
          <p className="text-[11px] font-mono text-amber-400/90 mt-2">
            No workers enrolled yet. Enroll personnel in Worker Registry first.
          </p>
        ) : (
          <p className="text-[11px] font-mono text-slate-500 mt-2">
            Enter worker's assigned 4-digit security PIN
          </p>
        )}
      </div>

      {/* Numeric Touch Keypad */}
      <div className="grid grid-cols-3 gap-2.5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="h-16 sm:h-17 rounded-2xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 active:scale-90 text-2xl font-mono font-bold text-slate-100 transition-all cursor-pointer shadow-md flex items-center justify-center select-none active:bg-slate-700 active:shadow-inner"
          >
            {digit}
          </button>
        ))}

        {/* Clear Button */}
        <button
          type="button"
          onClick={handleClear}
          className="h-16 sm:h-17 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-750 active:scale-90 text-xs font-bold text-slate-400 hover:text-slate-200 transition-all cursor-pointer flex items-center justify-center uppercase tracking-wider select-none shadow-sm"
        >
          Clear
        </button>

        {/* Zero */}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-16 sm:h-17 rounded-2xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 active:scale-90 text-2xl font-mono font-bold text-slate-100 transition-all cursor-pointer shadow-md flex items-center justify-center select-none active:bg-slate-700 active:shadow-inner"
        >
          0
        </button>

        {/* Backspace or Confirm Punch */}
        {matchedWorker ? (
          <button
            type="button"
            onClick={handleConfirm}
            className={`h-16 sm:h-17 rounded-2xl active:scale-90 text-sm font-black text-white transition-all cursor-pointer shadow-xl flex items-center justify-center gap-1.5 select-none animate-pulse ${
              isClockIn
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/40'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/40'
            }`}
          >
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
            <span>PUNCH</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleBackspace}
            className="h-16 sm:h-17 rounded-2xl bg-slate-850 hover:bg-slate-800 border border-slate-750 active:scale-90 text-slate-400 hover:text-slate-200 transition-all cursor-pointer flex items-center justify-center select-none shadow-sm"
            aria-label="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Registered Worker PIN Helper (Only when workers exist) */}
      {workers.length > 0 && (
        <div className="pt-2 text-center">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1.5">
            Registered Worker PINs:
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {workers.slice(0, 4).map((w) => (
              <button
                key={w.id}
                onClick={() => {
                  sounds.playKeypadClick();
                  setPin(w.pin);
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white cursor-pointer transition-colors shadow-xs"
              >
                {w.name.split(' ')[0]}: <span className="text-emerald-400 font-bold">{w.pin}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

