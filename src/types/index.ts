export type UserRole = 'admin' | 'guard' | 'contractor';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  contractorId?: string; // If role is contractor
  tenantId: string;
}

export type SubscriptionStatus =
  | 'active'
  | 'suspended'
  | 'canceled'
  | 'trial'
  | 'Active'
  | 'Suspended'
  | 'Canceled'
  | 'Trial';

export interface Tenant {
  id: string;
  name: string;
  code: string;
  location: string;
  currency: string;
  ownerEmail?: string;
  ownerName?: string;
  phone?: string;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionExpiryDate?: string; // YYYY-MM-DD
  isLocked?: boolean;
  lockReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProvisionedTenant {
  tenant: Tenant;
  ownerEmail: string;
  temporaryPassword?: string;
  ownerName: string;
  phone?: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiryDate?: string; // YYYY-MM-DD
  isLocked?: boolean;
  lockReason?: string;
  createdAt: string;
  workerCount?: number;
}

export interface Contractor {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  email: string;
  workerCount?: number;
}

export interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string; // '08:00'
  endTime: string;   // '17:00' or '04:00' (night shift)
  crossesMidnight: boolean;
  gracePeriodMinutes: number; // e.g., 15 min late tolerance
  standardHours: number;      // e.g. 8 hours before OT
  overtimeMultiplier: number; // e.g. 1.5x
  description: string;
  color: string;
}

export interface Worker {
  id: string;
  workerCode: string; // e.g., 'WRK-101'
  name: string;
  pin: string; // 4-digit PIN e.g. '1234'
  contractorId: string;
  shiftId: string;
  baseHourlyRate: number; // in local currency (e.g. ₹250)
  dailyWage?: number; // e.g. ₹550 / day
  phone: string;
  department: string; // 'CNC Machining' | 'Assembly Line' | 'Quality Control' | 'Packaging' | 'Welding'
  status: 'active' | 'inactive';
  joinedDate: string;
  cashAdvance?: number; // Weekly advance / Hafta given in cash
  avatarUrl?: string;
}

export type PunchType = 'in' | 'out';
export type PunchMethod = 'qr' | 'pin' | 'manual';

export interface TimePunch {
  id: string;
  workerId: string;
  punchType: PunchType;
  timestamp: string; // ISO
  method: PunchMethod;
  guardId?: string;
  photoUrl?: string; // Anti-proxy verification snapshot
  synced: boolean;
  notes?: string;
}

export interface ActiveFloorWorker {
  worker: Worker;
  contractor: Contractor;
  shift: Shift;
  clockInTime: string; // ISO
  elapsedMinutes: number;
  isOvertime: boolean;
  isWithinGrace: boolean;
  activePunchId: string;
}

export interface ShiftCalculationResult {
  clockIn: string;
  clockOut: string;
  shift: Shift;
  scheduledMinutes: number;
  workedMinutes: number;
  lateArrivalMinutes: number;
  gracePeriodApplied: boolean;
  effectiveWorkedHours: number;
  regularHours: number;
  overtimeHours: number;
  baseHourlyRate: number;
  regularWage: number;
  overtimeWage: number;
  deductionAmount: number;
  netPayableWage: number;
  crossesMidnight: boolean;
}

export interface ShiftRecord {
  id: string;
  workerId: string;
  date: string; // YYYY-MM-DD
  shiftId: string;
  clockIn: string; // ISO
  clockOut: string | null; // ISO
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  baseHourlyRate: number;
  regularWage: number;
  overtimeWage: number;
  penaltyAmount: number;
  netWage: number;
  status: 'in_progress' | 'completed' | 'flagged';
  autoCheckedOut?: boolean; // Flagged by auto-checkout safety rule
  notes?: string;
}

export interface PayrollSummaryItem {
  workerId: string;
  workerName: string;
  workerCode: string;
  contractorId: string;
  contractorName: string;
  department: string;
  shiftsWorked: number;
  totalRegularHours: number;
  totalOtHours: number;
  totalHours: number;
  baseHourlyRate: number;
  regularPay: number;
  otPay: number;
  deductions: number;
  cashAdvance: number; // Mid-week Hafta / cash advance deducted from pay
  netPay: number;
  paymentStatus: 'pending' | 'paid';
  paidAt?: string;
}

export interface OfflinePunchQueueItem {
  id: string;
  workerId: string;
  punchType: PunchType;
  timestamp: string;
  method: PunchMethod;
  queuedAt: string;
  retryCount: number;
}

