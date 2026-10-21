import { Shift, ShiftCalculationResult } from '../types';

/**
 * Format currency in Indian Rupees (INR) or specified currency
 */
export function formatCurrency(amount: number, currency = '₹'): string {
  const rounded = Math.round(amount * 100) / 100;
  return `${currency}${rounded.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format minutes into "Xh Ym"
 */
export function formatDuration(minutes: number): string {
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.floor(Math.abs(minutes) % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

/**
 * Format elapsed seconds into HH:MM:SS
 */
export function formatElapsedSeconds(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Parse a 'HH:mm' time string into minutes from midnight
 */
export function timeStringToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Calculate scheduled duration of a shift in minutes, accounting for midnight crossovers
 */
export function getShiftScheduledMinutes(shift?: Shift | null): number {
  if (!shift || !shift.startTime || !shift.endTime) return 0;
  const startMin = timeStringToMinutes(shift.startTime);
  const endMin = timeStringToMinutes(shift.endTime);

  if (startMin === 0 && endMin === 0) return 0;

  if (shift.crossesMidnight || endMin < startMin) {
    // Crosses midnight, e.g. 20:00 (1200m) to 04:00 (240m)
    return 24 * 60 - startMin + endMin;
  }
  return Math.max(0, endMin - startMin);
}

/**
 * Core Wage and Shift Engine Calculation
 * Takes clockIn and clockOut ISO strings, shift config, and base hourly rate.
 */
export function calculateShiftWage(params: {
  clockInIso: string;
  clockOutIso?: string | null;
  shift: Shift;
  baseHourlyRate: number;
}): ShiftCalculationResult {
  const { clockInIso, clockOutIso, shift, baseHourlyRate } = params;

  const clockInDate = new Date(clockInIso);
  const clockOutDate = clockOutIso ? new Date(clockOutIso) : new Date();

  // If clock in time is invalid, blank, or equals clock out, return zeroed breakdown
  if (
    !clockInIso ||
    isNaN(clockInDate.getTime()) ||
    (clockOutIso && isNaN(clockOutDate.getTime()))
  ) {
    return {
      clockIn: clockInIso || '',
      clockOut: clockOutIso || '',
      shift,
      scheduledMinutes: 0,
      workedMinutes: 0,
      lateArrivalMinutes: 0,
      gracePeriodApplied: false,
      effectiveWorkedHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      baseHourlyRate: isNaN(baseHourlyRate) ? 0 : baseHourlyRate,
      regularWage: 0,
      overtimeWage: 0,
      deductionAmount: 0,
      netPayableWage: 0,
      crossesMidnight: false,
    };
  }

  // Total raw worked duration in milliseconds
  const workedMs = Math.max(0, clockOutDate.getTime() - clockInDate.getTime());
  const rawWorkedMinutes = Math.floor(workedMs / (1000 * 60));

  const scheduledMinutes = getShiftScheduledMinutes(shift);

  // Determine scheduled start for the clock-in day
  const scheduledStart = new Date(clockInDate);
  const [startHour, startMin] = (shift.startTime || '00:00').split(':').map(Number);
  scheduledStart.setHours(startHour || 0, startMin || 0, 0, 0);

  // Late arrival in minutes: if clockIn is after scheduled start (only if scheduled start is set)
  const arrivalDiffMinutes =
    shift.startTime && shift.startTime !== '00:00'
      ? Math.floor((clockInDate.getTime() - scheduledStart.getTime()) / (1000 * 60))
      : 0;
  
  let lateArrivalMinutes = 0;
  let gracePeriodApplied = false;
  let deductionAmount = 0;

  if (arrivalDiffMinutes > 0) {
    if (arrivalDiffMinutes <= (shift.gracePeriodMinutes || 0)) {
      // Within grace tolerance (e.g. within 15 mins) -> No penalty, forgiven
      gracePeriodApplied = true;
      lateArrivalMinutes = arrivalDiffMinutes;
    } else {
      // Exceeded grace tolerance -> penalized for full lateness
      lateArrivalMinutes = arrivalDiffMinutes;
      gracePeriodApplied = false;
      const hourlyFraction = lateArrivalMinutes / 60;
      deductionAmount = Math.round(hourlyFraction * (baseHourlyRate || 0) * 100) / 100;
    }
  }

  // Effective worked minutes:
  // If grace was applied, we credit back the late arrival minutes up to grace
  const effectiveWorkedMinutes = gracePeriodApplied 
    ? rawWorkedMinutes + lateArrivalMinutes 
    : rawWorkedMinutes;

  const effectiveWorkedHours = Math.round((effectiveWorkedMinutes / 60) * 100) / 100;

  // Regular hours vs Overtime hours
  // Standard regular threshold is defined in shift (e.g., 8 hours)
  const standardShiftHours = shift.standardHours || 8;
  const regularHours = Math.min(effectiveWorkedHours, standardShiftHours);
  const overtimeHours = Math.max(0, Math.round((effectiveWorkedHours - standardShiftHours) * 100) / 100);

  const regularWage = Math.round(regularHours * baseHourlyRate * 100) / 100;
  const overtimeWage = Math.round(overtimeHours * baseHourlyRate * shift.overtimeMultiplier * 100) / 100;
  
  const grossWage = regularWage + overtimeWage;
  const netPayableWage = Math.max(0, Math.round((grossWage - deductionAmount) * 100) / 100);

  return {
    clockIn: clockInIso,
    clockOut: clockOutDate.toISOString(),
    shift,
    scheduledMinutes,
    workedMinutes: rawWorkedMinutes,
    lateArrivalMinutes,
    gracePeriodApplied,
    effectiveWorkedHours,
    regularHours,
    overtimeHours,
    baseHourlyRate,
    regularWage,
    overtimeWage,
    deductionAmount,
    netPayableWage,
    crossesMidnight: shift.crossesMidnight || timeStringToMinutes(shift.endTime) < timeStringToMinutes(shift.startTime),
  };
}

