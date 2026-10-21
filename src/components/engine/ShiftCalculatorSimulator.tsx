import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Moon,
  Clock,
  Sparkles,
  ShieldCheck,
  Banknote,
  RotateCcw,
} from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';
import { calculateShiftWage, formatCurrency, formatDuration, getShiftScheduledMinutes } from '../../utils/wageEngine';
import { Shift } from '../../types';
import { DEFAULT_FALLBACK_SHIFT } from '../../utils/mockData';

export const ShiftCalculatorSimulator: React.FC = () => {
  const { shifts } = useFactory();

  // Selected shift for simulation (starts unselected / manual)
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const currentShift = shifts.find((s) => s.id === selectedShiftId) || null;

  // Simulator controls - zeroed out & blank by default
  const [clockInTime, setClockInTime] = useState<string>('');
  const [clockOutTime, setClockOutTime] = useState<string>('');
  const [hourlyRate, setHourlyRate] = useState<number>(0);
  const [gracePeriod, setGracePeriod] = useState<number>(0);
  const [overtimeMultiplier] = useState<number>(1.5);
  const [crossesMidnight, setCrossesMidnight] = useState<boolean>(false);

  // When shift selection changes, sync if chosen, or reset to zero if manual
  const handleShiftChange = (shiftId: string) => {
    setSelectedShiftId(shiftId);
    const s = shifts.find((x) => x.id === shiftId);
    if (s) {
      setClockInTime(s.startTime || '00:00');
      setClockOutTime(s.endTime || '00:00');
      setGracePeriod(s.gracePeriodMinutes || 0);
      setCrossesMidnight(Boolean(s.crossesMidnight));
    } else {
      setClockInTime('');
      setClockOutTime('');
      setGracePeriod(0);
      setCrossesMidnight(false);
    }
  };

  // Full reset back to zero state
  const handleReset = () => {
    setSelectedShiftId('');
    setClockInTime('');
    setClockOutTime('');
    setHourlyRate(0);
    setGracePeriod(0);
    setCrossesMidnight(false);
  };

  // Real-time wage calculation - starts completely zeroed out
  const calculationResult = useMemo(() => {
    const isBlank =
      !clockInTime ||
      !clockOutTime ||
      clockInTime.trim() === '' ||
      clockOutTime.trim() === '';

    const isZeroTimes = clockInTime === '00:00' && clockOutTime === '00:00';

    if (isBlank || isZeroTimes) {
      return {
        clockIn: clockInTime ? `2026-10-18T${clockInTime}:00` : '',
        clockOut: clockOutTime ? `2026-10-18T${clockOutTime}:00` : '',
        shift: currentShift || DEFAULT_FALLBACK_SHIFT,
        scheduledMinutes: currentShift ? getShiftScheduledMinutes(currentShift) : 0,
        workedMinutes: 0,
        lateArrivalMinutes: 0,
        gracePeriodApplied: false,
        effectiveWorkedHours: 0,
        regularHours: 0,
        overtimeHours: 0,
        baseHourlyRate: hourlyRate || 0,
        regularWage: 0,
        overtimeWage: 0,
        deductionAmount: 0,
        netPayableWage: 0,
        crossesMidnight: false,
      };
    }

    const baseDay = '2026-10-18';
    const nextDay = '2026-10-19';

    const clockInIso = `${baseDay}T${clockInTime}:00`;
    const isOvernight = crossesMidnight || clockOutTime < clockInTime;
    const clockOutIso = `${isOvernight ? nextDay : baseDay}T${clockOutTime}:00`;

    const simulatedShift: Shift = {
      ...(currentShift || DEFAULT_FALLBACK_SHIFT),
      startTime: currentShift?.startTime || clockInTime,
      endTime: currentShift?.endTime || clockOutTime,
      crossesMidnight: isOvernight,
      gracePeriodMinutes: gracePeriod,
      overtimeMultiplier,
      standardHours: 8,
    };

    return calculateShiftWage({
      clockInIso,
      clockOutIso,
      shift: simulatedShift,
      baseHourlyRate: Number(hourlyRate) || 0,
    });
  }, [clockInTime, clockOutTime, currentShift, crossesMidnight, gracePeriod, overtimeMultiplier, hourlyRate]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">
              Salary Calculator
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Test shift hours, late grace period, and overtime pay calculation
          </p>
        </div>

        {/* Preset Shift Switcher & Reset Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors shadow-sm active:scale-95"
            title="Reset all simulator inputs to zero"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset to Zero</span>
          </button>

          <span className="text-xs text-slate-400 font-medium">Preset Shift:</span>
          <select
            value={selectedShiftId}
            onChange={(e) => handleShiftChange(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer font-semibold"
          >
            <option value="">Manual / Custom (Zeroed)</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.startTime} - {s.endTime})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Simulator Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Clock In Time */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Clock-In Time</span>
            </label>
            <span className="text-[10px] text-slate-500">Day 1</span>
          </div>
          <input
            type="time"
            value={clockInTime}
            onChange={(e) => setClockInTime(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-mono text-base font-bold text-slate-100 focus:outline-none focus:border-emerald-500"
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setClockInTime('00:00')}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 cursor-pointer"
            >
              00:00
            </button>
            <button
              type="button"
              onClick={() => setClockInTime('')}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 cursor-pointer"
            >
              Blank
            </button>
            {currentShift && currentShift.startTime && (
              <button
                type="button"
                onClick={() => setClockInTime(currentShift.startTime)}
                className="text-[10px] px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 cursor-pointer truncate max-w-[130px]"
                title={`Set to shift start (${currentShift.startTime})`}
              >
                Shift ({currentShift.startTime})
              </button>
            )}
          </div>
        </div>

        {/* Clock Out Time */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Clock-Out Time</span>
            </label>
            <span className="text-[10px] text-slate-500 font-medium">
              {calculationResult.crossesMidnight ? 'Day 2 (+1d)' : 'Day 1'}
            </span>
          </div>
          <input
            type="time"
            value={clockOutTime}
            onChange={(e) => setClockOutTime(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-mono text-base font-bold text-slate-100 focus:outline-none focus:border-amber-500"
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setClockOutTime('00:00')}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 cursor-pointer"
            >
              00:00
            </button>
            <button
              type="button"
              onClick={() => setClockOutTime('')}
              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700 cursor-pointer"
            >
              Blank
            </button>
            {currentShift && currentShift.endTime && (
              <button
                type="button"
                onClick={() => setClockOutTime(currentShift.endTime)}
                className="text-[10px] px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 cursor-pointer truncate max-w-[130px]"
                title={`Set to shift end (${currentShift.endTime})`}
              >
                Shift ({currentShift.endTime})
              </button>
            )}
          </div>
        </div>

        {/* Base Hourly Rate */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5 text-indigo-400" />
            <span>Hourly Pay Rate (₹)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
            <input
              type="number"
              min={0}
              max={5000}
              step={10}
              value={hourlyRate === 0 ? '' : hourlyRate}
              placeholder="0"
              onChange={(e) => {
                const val = e.target.value === '' ? 0 : Number(e.target.value);
                setHourlyRate(isNaN(val) ? 0 : Math.max(0, val));
              }}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-mono text-base font-bold text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <span className="text-[11px] text-slate-500 block">Enter hourly wage rate in ₹</span>
        </div>

        {/* Grace & Overtime Rules */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold">Late Grace Window:</span>
            <span className="font-mono font-bold text-indigo-400">{gracePeriod} mins</span>
          </div>
          <input
            type="range"
            min={0}
            max={45}
            step={5}
            value={gracePeriod}
            onChange={(e) => setGracePeriod(Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-300 font-semibold">OT Multiplier:</span>
            <span className="font-mono font-bold text-amber-400">{overtimeMultiplier}x</span>
          </div>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={crossesMidnight}
                onChange={(e) => setCrossesMidnight(e.target.checked)}
                className="rounded accent-indigo-500"
              />
              <span>Crosses Midnight</span>
            </label>
          </div>
        </div>
      </div>

      {/* Real-Time Calculation Breakdown Display */}
      <div className="p-6 rounded-2xl bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950/30 border border-indigo-500/30 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm text-slate-100 uppercase tracking-wide">
              Salary Calculation Breakdown
            </span>
          </div>
          {calculationResult.crossesMidnight && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Moon className="w-3.5 h-3.5" />
              <span>Midnight Shift Math Validated</span>
            </span>
          )}
        </div>

        {/* Calculation Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          {/* Scheduled */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Scheduled</span>
            <span className="font-mono text-base font-extrabold text-slate-200 mt-1 block">
              {formatDuration(calculationResult.scheduledMinutes)}
            </span>
          </div>

          {/* Actual Worked */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Actual Worked</span>
            <span className="font-mono text-base font-extrabold text-slate-100 mt-1 block">
              {formatDuration(calculationResult.workedMinutes)}
            </span>
          </div>

          {/* Grace Status */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Grace Rule</span>
            {calculationResult.workedMinutes === 0 ? (
              <span className="text-xs font-bold text-slate-500 mt-1 block">-</span>
            ) : calculationResult.lateArrivalMinutes === 0 ? (
              <span className="text-xs font-bold text-emerald-400 mt-1 block">On Time (0m)</span>
            ) : calculationResult.gracePeriodApplied ? (
              <span className="text-xs font-bold text-emerald-400 mt-1 block">
                Waived (+{calculationResult.lateArrivalMinutes}m)
              </span>
            ) : (
              <span className="text-xs font-bold text-rose-400 mt-1 block">
                Deducted ({calculationResult.lateArrivalMinutes}m)
              </span>
            )}
          </div>

          {/* Regular Hours */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Regular Hrs (1.0x)</span>
            <span className="font-mono text-base font-extrabold text-blue-300 mt-1 block">
              {calculationResult.regularHours}h
            </span>
          </div>

          {/* Overtime Hours */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">OT Hours (1.5x)</span>
            <span className="font-mono text-base font-extrabold text-amber-400 mt-1 block">
              {calculationResult.overtimeHours}h
            </span>
          </div>

          {/* Deductions */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Deductions</span>
            <span className="font-mono text-base font-extrabold text-rose-400 mt-1 block">
              {formatCurrency(calculationResult.deductionAmount)}
            </span>
          </div>
        </div>

        {/* Wage Math Formula Breakdown Banner */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 text-xs">
            <div className="text-slate-400">
              <strong>Calculation Formula:</strong> Regular ({calculationResult.regularHours}h × {formatCurrency(hourlyRate)}) + OT ({calculationResult.overtimeHours}h × {formatCurrency(hourlyRate * overtimeMultiplier)}) − Penalty ({formatCurrency(calculationResult.deductionAmount)})
            </div>
            <div className="text-slate-400 font-mono text-[11px]">
              {formatCurrency(calculationResult.regularWage)} + {formatCurrency(calculationResult.overtimeWage)} − {formatCurrency(calculationResult.deductionAmount)} = <span className="text-emerald-400 font-bold">{formatCurrency(calculationResult.netPayableWage)}</span>
            </div>
          </div>

          {/* Net Payable Highlight Badge */}
          <div className="p-3 px-5 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950 flex items-center justify-between md:justify-center gap-4 shrink-0">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">
                Total Salary
              </span>
              <div className="font-mono text-2xl font-black">
                {formatCurrency(calculationResult.netPayableWage)}
              </div>
            </div>
            <ShieldCheck className="w-7 h-7 opacity-80" />
          </div>
        </div>
      </div>
    </div>
  );
};
