import { Contractor, Shift, Worker, TimePunch, ShiftRecord, Tenant } from '../types';

export const INITIAL_TENANT: Tenant = {
  id: 'tenant-apex-1',
  name: 'Apex Heavy Engineering & Castings Plant',
  code: 'APEX-P1',
  location: 'MIDC Industrial Estate, Pune, India',
  currency: '₹',
};

export const DEFAULT_FALLBACK_SHIFT: Shift = {
  id: 'shf-default',
  name: 'Standard Shift',
  code: 'STD-01',
  startTime: '00:00',
  endTime: '00:00',
  crossesMidnight: false,
  gracePeriodMinutes: 0,
  standardHours: 8,
  overtimeMultiplier: 1.5,
  description: 'Standard 8-hour shift',
  color: '#0284c7',
};

export const DEFAULT_FALLBACK_CONTRACTOR: Contractor = {
  id: 'cnt-direct',
  name: 'Direct Plant Workforce',
  code: 'DIR',
  contactPerson: 'Internal HR',
  phone: 'N/A',
  email: 'hr@factory.com',
};

// Initial state initialized as empty arrays []
export const INITIAL_CONTRACTORS: Contractor[] = [];

export const INITIAL_SHIFTS: Shift[] = [];

export const INITIAL_WORKERS: Worker[] = [];

export function getInitialActivePunches(): TimePunch[] {
  return [];
}

export function getInitialHistoricalShifts(): ShiftRecord[] {
  return [];
}
