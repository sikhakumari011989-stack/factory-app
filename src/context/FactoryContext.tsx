import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Worker,
  Shift,
  Contractor,
  TimePunch,
  ShiftRecord,
  ActiveFloorWorker,
  PayrollSummaryItem,
  PunchType,
  PunchMethod,
} from '../types';
import {
  DEFAULT_FALLBACK_SHIFT,
  DEFAULT_FALLBACK_CONTRACTOR,
  INITIAL_CONTRACTORS,
  INITIAL_SHIFTS,
  INITIAL_WORKERS,
  getInitialActivePunches,
  getInitialHistoricalShifts,
} from '../utils/mockData';
import { calculateShiftWage } from '../utils/wageEngine';
import { OfflineQueueManager } from '../lib/offlineQueue';
import { isFirebaseConfigured } from '../lib/firebase';
import {
  saveWorkerToFirestore,
  deleteWorkerFromFirestore,
  saveContractorToFirestore,
  deleteContractorFromFirestore,
  saveShiftToFirestore,
  deleteShiftFromFirestore,
  savePunchToFirestore,
  saveWageCalculationToFirestore,
  subscribeToWorkers,
  subscribeToPunches,
  getContractorsFromFirestore,
  getShiftsFromFirestore,
} from '../lib/firestoreService';

interface FactoryContextType {
  workers: Worker[];
  shifts: Shift[];
  contractors: Contractor[];
  timePunches: TimePunch[];
  shiftRecords: ShiftRecord[];
  activeFloorWorkers: ActiveFloorWorker[];
  payrollSummary: PayrollSummaryItem[];

  // Offline sync simulation state
  isOfflineMode: boolean;
  offlineQueueCount: number;
  toggleOfflineMode: () => void;
  syncOfflineQueue: () => Promise<number>;

  // Actions
  recordPunch: (
    workerId: string,
    punchType: PunchType,
    method?: PunchMethod,
    photoUrl?: string
  ) => { success: boolean; worker?: Worker; punch?: TimePunch; message?: string };
  forceClockOut: (workerId: string) => void;
  runAutoCheckoutSafetyCheck: () => number;

  // Worker CRUD
  addWorker: (worker: Omit<Worker, 'id'>) => void;
  updateWorker: (id: string, updates: Partial<Worker>) => void;
  deleteWorker: (id: string) => void;

  // Contractor CRUD
  addContractor: (contractor: Omit<Contractor, 'id'>) => void;
  updateContractor: (id: string, updates: Partial<Contractor>) => void;
  deleteContractor: (id: string) => void;

  // Shift CRUD
  addShift: (shift: Omit<Shift, 'id'>) => void;
  updateShift: (id: string, updates: Partial<Shift>) => void;
  deleteShift: (id: string) => void;

  // Payroll Status Actions
  togglePaymentStatus: (workerId: string) => void;
  markAllAsPaid: (contractorId?: string) => void;
  resetDemoData: () => void;
  clearAllData: () => void;

  // Lookup helpers
  getWorkerById: (id: string) => Worker | undefined;
  getWorkerByCode: (code: string) => Worker | undefined;
  getWorkerByPin: (pin: string) => Worker | undefined;
  getContractorById: (id: string) => Contractor;
  getShiftById: (id: string) => Shift;
}

const FactoryContext = createContext<FactoryContextType | undefined>(undefined);

export const FactoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Workers: initialized as empty array [], stripping out any old mock seed data
  const [workers, setWorkers] = useState<Worker[]>(() => {
    try {
      const saved = localStorage.getItem('factory_workers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // If stored data contains the legacy mock workers (wrk-101 etc.), purge them
          const hasLegacyMock = parsed.some((w: Worker) => w.id && w.id.startsWith('wrk-10'));
          if (!hasLegacyMock) return parsed;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_WORKERS;
  });

  // Shifts: initialized as empty array [], stripping out legacy seed data
  const [shifts, setShifts] = useState<Shift[]>(() => {
    try {
      const saved = localStorage.getItem('factory_shifts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const hasLegacyMock = parsed.some((s: Shift) => s.id && s.id.startsWith('shf-morning'));
          if (!hasLegacyMock) return parsed;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_SHIFTS;
  });

  // Contractors: initialized as empty array [], stripping out legacy seed data
  const [contractors, setContractors] = useState<Contractor[]>(() => {
    try {
      const saved = localStorage.getItem('factory_contractors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const hasLegacyMock = parsed.some((c: Contractor) => c.id && c.id.startsWith('cnt-'));
          if (!hasLegacyMock) return parsed;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_CONTRACTORS;
  });

  // Time punches: initialized as empty array []
  const [timePunches, setTimePunches] = useState<TimePunch[]>(() => {
    try {
      const saved = localStorage.getItem('factory_punches');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const hasLegacyMock = parsed.some((p: TimePunch) => p.id && p.id.startsWith('punch-active-'));
          if (!hasLegacyMock) return parsed;
        }
      }
    } catch {
      // fallback
    }
    return getInitialActivePunches();
  });

  // Completed shift records: initialized as empty array []
  const [shiftRecords, setShiftRecords] = useState<ShiftRecord[]>(() => {
    try {
      const saved = localStorage.getItem('factory_shift_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const hasLegacyMock = parsed.some((r: ShiftRecord) => r.id && r.id.startsWith('rec-hist-'));
          if (!hasLegacyMock) return parsed;
        }
      }
    } catch {
      // fallback
    }
    return getInitialHistoricalShifts();
  });

  // Paid worker map for weekly payroll tracking { workerId: ISO timestamp }
  const [paidStatusMap, setPaidStatusMap] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('factory_paid_status_map');
    return saved ? JSON.parse(saved) : {};
  });

  // Offline simulation state
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(() => {
    return OfflineQueueManager.getQueue().length;
  });

  // Clock tick every 1000ms for live floor headcount timers
  const [currentTick, setCurrentTick] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTick(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cloud Firestore Real-Time Synchronization
  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    getShiftsFromFirestore().then((remoteShifts) => {
      if (remoteShifts && remoteShifts.length > 0) setShifts(remoteShifts);
    });

    getContractorsFromFirestore().then((remoteContractors) => {
      if (remoteContractors && remoteContractors.length > 0) setContractors(remoteContractors);
    });

    const unsubWorkers = subscribeToWorkers((remoteWorkers) => {
      if (remoteWorkers && remoteWorkers.length > 0) setWorkers(remoteWorkers);
    });

    const unsubPunches = subscribeToPunches((remotePunches) => {
      if (remotePunches && remotePunches.length > 0) setTimePunches(remotePunches);
    });

    return () => {
      unsubWorkers();
      unsubPunches();
    };
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('factory_workers', JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem('factory_shifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('factory_contractors', JSON.stringify(contractors));
  }, [contractors]);

  useEffect(() => {
    localStorage.setItem('factory_punches', JSON.stringify(timePunches));
  }, [timePunches]);

  useEffect(() => {
    localStorage.setItem('factory_shift_records', JSON.stringify(shiftRecords));
  }, [shiftRecords]);

  useEffect(() => {
    localStorage.setItem('factory_paid_status_map', JSON.stringify(paidStatusMap));
  }, [paidStatusMap]);

  // Fast lookups with safe fallbacks
  const getWorkerById = useCallback((id: string) => workers.find((w) => w.id === id), [workers]);

  const getWorkerByCode = useCallback(
    (code: string) => workers.find((w) => w.workerCode.trim().toLowerCase() === code.trim().toLowerCase()),
    [workers]
  );

  const getWorkerByPin = useCallback(
    (pin: string) => workers.find((w) => w.pin.trim() === pin.trim()),
    [workers]
  );

  const getContractorById = useCallback(
    (id: string): Contractor => contractors.find((c) => c.id === id) || DEFAULT_FALLBACK_CONTRACTOR,
    [contractors]
  );

  const getShiftById = useCallback(
    (id: string): Shift => shifts.find((s) => s.id === id) || DEFAULT_FALLBACK_SHIFT,
    [shifts]
  );

  // Compute Active Floor Workers dynamically
  const activeFloorWorkers = useMemo<ActiveFloorWorker[]>(() => {
    const workerLatestPunch = new Map<string, TimePunch>();

    // Sort punches chronologically ascending
    const sorted = [...timePunches].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sorted.forEach((punch) => {
      workerLatestPunch.set(punch.workerId, punch);
    });

    const activeList: ActiveFloorWorker[] = [];

    workerLatestPunch.forEach((punch, workerId) => {
      if (punch.punchType === 'in') {
        const worker = getWorkerById(workerId);
        if (!worker) return;

        const contractor = getContractorById(worker.contractorId);
        const shift = getShiftById(worker.shiftId);

        const clockInDate = new Date(punch.timestamp);
        const elapsedMinutes = Math.max(
          0,
          Math.floor((currentTick - clockInDate.getTime()) / (1000 * 60))
        );

        const standardHours = shift.standardHours || 8;
        const isOvertime = elapsedMinutes > (standardHours * 60);

        // Check if clocked in within grace period
        const scheduledStart = new Date(clockInDate);
        const [shHour, shMin] = (shift.startTime || '08:00').split(':').map(Number);
        scheduledStart.setHours(shHour, shMin, 0, 0);

        const diffMinutes = Math.floor((clockInDate.getTime() - scheduledStart.getTime()) / (1000 * 60));
        const graceMins = shift.gracePeriodMinutes || 15;
        const isWithinGrace = diffMinutes <= graceMins;

        activeList.push({
          worker,
          contractor,
          shift,
          clockInTime: punch.timestamp,
          elapsedMinutes,
          isOvertime,
          isWithinGrace,
          activePunchId: punch.id,
        });
      }
    });

    return activeList.sort((a, b) => b.elapsedMinutes - a.elapsedMinutes);
  }, [timePunches, getWorkerById, getContractorById, getShiftById, currentTick]);

  // Compute Weekly Payroll Summary
  const payrollSummary = useMemo<PayrollSummaryItem[]>(() => {
    const summaryMap = new Map<
      string,
      {
        worker: Worker;
        contractor: Contractor;
        shiftsWorked: number;
        regularHours: number;
        otHours: number;
        regularPay: number;
        otPay: number;
        deductions: number;
        netPay: number;
      }
    >();

    // Initialize with all registered workers so everyone appears
    workers.forEach((worker) => {
      const contractor = getContractorById(worker.contractorId);
      summaryMap.set(worker.id, {
        worker,
        contractor,
        shiftsWorked: 0,
        regularHours: 0,
        otHours: 0,
        regularPay: 0,
        otPay: 0,
        deductions: 0,
        netPay: 0,
      });
    });

    // Aggregate completed shift records
    shiftRecords.forEach((record) => {
      const item = summaryMap.get(record.workerId);
      if (item) {
        item.shiftsWorked += 1;
        item.regularHours += record.regularHours;
        item.otHours += record.overtimeHours;
        item.regularPay += record.regularWage;
        item.otPay += record.overtimeWage;
        item.deductions += record.penaltyAmount;
        item.netPay += record.netWage;
      }
    });

    return Array.from(summaryMap.values()).map(({ worker, contractor, ...stats }) => {
      const isPaid = Boolean(paidStatusMap[worker.id]);
      const totalHours = Math.round((stats.regularHours + stats.otHours) * 100) / 100;
      const advance = Math.round(Number(worker.cashAdvance) || 0);
      const gross = stats.regularPay + stats.otPay - stats.deductions;
      const finalNet = Math.max(0, Math.round(gross - advance));

      return {
        workerId: worker.id,
        workerName: worker.name,
        workerCode: worker.workerCode,
        contractorId: contractor.id,
        contractorName: contractor.name,
        department: worker.department,
        shiftsWorked: stats.shiftsWorked,
        totalRegularHours: Math.round(stats.regularHours * 100) / 100,
        totalOtHours: Math.round(stats.otHours * 100) / 100,
        totalHours,
        baseHourlyRate: worker.baseHourlyRate,
        regularPay: Math.round(stats.regularPay),
        otPay: Math.round(stats.otPay),
        deductions: Math.round(stats.deductions),
        cashAdvance: advance,
        netPay: finalNet,
        paymentStatus: isPaid ? 'paid' : 'pending',
        paidAt: paidStatusMap[worker.id],
      };
    });
  }, [workers, shiftRecords, getContractorById, paidStatusMap]);

  // Record Punch (In or Out)
  const recordPunch = (
    workerId: string,
    punchType: PunchType,
    method: PunchMethod = 'pin',
    photoUrl?: string
  ): { success: boolean; worker?: Worker; punch?: TimePunch; message?: string } => {
    const worker = getWorkerById(workerId);
    if (!worker) {
      return { success: false, message: 'Worker record not found' };
    }

    // Check if worker already has this status
    const isCurrentlyActive = activeFloorWorkers.some((a) => a.worker.id === workerId);
    if (punchType === 'in' && isCurrentlyActive) {
      return {
        success: false,
        worker,
        message: `${worker.name} is ALREADY clocked in on the floor!`,
      };
    }

    if (punchType === 'out' && !isCurrentlyActive) {
      return {
        success: false,
        worker,
        message: `${worker.name} is NOT currently clocked in.`,
      };
    }

    const nowIso = new Date().toISOString();
    const newPunch: TimePunch = {
      id: `punch-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      workerId,
      punchType,
      timestamp: nowIso,
      method,
      photoUrl,
      synced: !isOfflineMode,
    };

    // If offline mode is simulated, enqueue to offline queue
    if (isOfflineMode) {
      OfflineQueueManager.enqueue(newPunch);
      setOfflineQueueCount(OfflineQueueManager.getQueue().length);
    }

    // Update in-memory time punches
    setTimePunches((prev) => [...prev, newPunch]);

    // Sync to Cloud Firestore if online
    if (!isOfflineMode) {
      savePunchToFirestore(newPunch);
    }

    // If punchType is 'out', close the shift record and compute final wage
    if (punchType === 'out') {
      const activeWorkerInfo = activeFloorWorkers.find((a) => a.worker.id === workerId);
      const clockInIso = activeWorkerInfo
        ? activeWorkerInfo.clockInTime
        : new Date(Date.now() - 8 * 3600 * 1000).toISOString();
      const shift = getShiftById(worker.shiftId);

      const wageCalc = calculateShiftWage({
        clockInIso,
        clockOutIso: nowIso,
        shift,
        baseHourlyRate: worker.baseHourlyRate,
      });

      const newRecord: ShiftRecord = {
        id: `rec-${Date.now()}-${worker.id}`,
        workerId: worker.id,
        date: nowIso.split('T')[0],
        shiftId: shift.id,
        clockIn: clockInIso,
        clockOut: nowIso,
        regularHours: wageCalc.regularHours,
        overtimeHours: wageCalc.overtimeHours,
        totalHours: wageCalc.effectiveWorkedHours,
        baseHourlyRate: worker.baseHourlyRate,
        regularWage: wageCalc.regularWage,
        overtimeWage: wageCalc.overtimeWage,
        penaltyAmount: wageCalc.deductionAmount,
        netWage: wageCalc.netPayableWage,
        status: 'completed',
      };

      setShiftRecords((prev) => [newRecord, ...prev]);

      if (!isOfflineMode) {
        saveWageCalculationToFirestore(newRecord);
      }
    }

    return {
      success: true,
      worker,
      punch: newPunch,
      message: `Successfully clocked ${punchType.toUpperCase()}`,
    };
  };

  // Force clock out an active worker
  const forceClockOut = (workerId: string) => {
    recordPunch(workerId, 'out', 'manual');
  };

  // Auto-Checkout Safety Rule: Automatically flag and close unclosed runaway shifts (>14h)
  const runAutoCheckoutSafetyCheck = useCallback((): number => {
    let closedCount = 0;
    const MAX_SHIFT_MINUTES = 14 * 60; // 14 hours limit to prevent runaway overtime math

    activeFloorWorkers.forEach((item) => {
      if (item.elapsedMinutes > MAX_SHIFT_MINUTES) {
        const clockInDate = new Date(item.clockInTime);
        const cappedDurationMs = ((item.shift.standardHours || 8) + 4) * 3600 * 1000;
        const autoOutTime = new Date(clockInDate.getTime() + cappedDurationMs).toISOString();

        const autoPunch: TimePunch = {
          id: `punch-auto-${Date.now()}-${item.worker.id}`,
          workerId: item.worker.id,
          punchType: 'out',
          timestamp: autoOutTime,
          method: 'manual',
          notes: 'Auto-Checkout: Exceeded 14h safety window',
          synced: !isOfflineMode,
        };

        const wageCalc = calculateShiftWage({
          clockInIso: item.clockInTime,
          clockOutIso: autoOutTime,
          shift: item.shift,
          baseHourlyRate: item.worker.baseHourlyRate,
        });

        const autoRecord: ShiftRecord = {
          id: `rec-auto-${Date.now()}-${item.worker.id}`,
          workerId: item.worker.id,
          date: item.clockInTime.split('T')[0],
          shiftId: item.shift.id,
          clockIn: item.clockInTime,
          clockOut: autoOutTime,
          regularHours: wageCalc.regularHours,
          overtimeHours: wageCalc.overtimeHours,
          totalHours: wageCalc.regularHours + wageCalc.overtimeHours,
          baseHourlyRate: item.worker.baseHourlyRate,
          regularWage: wageCalc.regularWage,
          overtimeWage: wageCalc.overtimeWage,
          penaltyAmount: wageCalc.deductionAmount,
          netWage: wageCalc.netPayableWage,
          status: 'flagged',
          autoCheckedOut: true,
          notes: 'Auto-Checkout Safety Rule Applied (14h Cap)',
        };

        setTimePunches((prev) => [...prev, autoPunch]);
        setShiftRecords((prev) => [autoRecord, ...prev]);

        if (!isOfflineMode) {
          savePunchToFirestore(autoPunch);
          saveWageCalculationToFirestore(autoRecord);
        }
        closedCount++;
      }
    });

    return closedCount;
  }, [activeFloorWorkers, isOfflineMode]);

  // Toggle offline simulation mode
  const toggleOfflineMode = () => {
    setIsOfflineMode((prev) => !prev);
  };

  // Sync offline queue
  const syncOfflineQueue = async (): Promise<number> => {
    const queue = OfflineQueueManager.getQueue();
    const count = queue.length;
    if (count === 0) return 0;

    // Simulate network latency sync
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Mark existing unsynced punches as synced
    setTimePunches((prev) =>
      prev.map((p) => ({
        ...p,
        synced: true,
      }))
    );

    OfflineQueueManager.clearQueue();
    setOfflineQueueCount(0);
    return count;
  };

  // Worker CRUD
  const addWorker = (workerData: Omit<Worker, 'id'>) => {
    const newWorker: Worker = {
      ...workerData,
      id: `wrk-${Date.now()}`,
    };
    setWorkers((prev) => [newWorker, ...prev]);
    saveWorkerToFirestore(newWorker);
  };

  const updateWorker = (id: string, updates: Partial<Worker>) => {
    setWorkers((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const updated = { ...w, ...updates };
          saveWorkerToFirestore(updated);
          return updated;
        }
        return w;
      })
    );
  };

  const deleteWorker = (id: string) => {
    setWorkers((prev) => prev.filter((w) => w.id !== id));
    setTimePunches((prev) => prev.filter((p) => p.workerId !== id));
    deleteWorkerFromFirestore(id);
  };

  // Contractor CRUD
  const addContractor = (contractorData: Omit<Contractor, 'id'>) => {
    const newContractor: Contractor = {
      ...contractorData,
      id: `cnt-${Date.now()}`,
    };
    setContractors((prev) => [...prev, newContractor]);
    saveContractorToFirestore(newContractor);
  };

  const updateContractor = (id: string, updates: Partial<Contractor>) => {
    setContractors((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates };
          saveContractorToFirestore(updated);
          return updated;
        }
        return c;
      })
    );
  };

  const deleteContractor = (id: string) => {
    setContractors((prev) => prev.filter((c) => c.id !== id));
    deleteContractorFromFirestore(id);
  };

  // Shift CRUD
  const addShift = (shiftData: Omit<Shift, 'id'>) => {
    const newShift: Shift = {
      ...shiftData,
      id: `shf-${Date.now()}`,
    };
    setShifts((prev) => [...prev, newShift]);
    saveShiftToFirestore(newShift);
  };

  const updateShift = (id: string, updates: Partial<Shift>) => {
    setShifts((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, ...updates };
          saveShiftToFirestore(updated);
          return updated;
        }
        return s;
      })
    );
  };

  const deleteShift = (id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
    deleteShiftFromFirestore(id);
  };

  // Payment status toggle
  const togglePaymentStatus = (workerId: string) => {
    setPaidStatusMap((prev) => {
      const next = { ...prev };
      if (next[workerId]) {
        delete next[workerId];
      } else {
        next[workerId] = new Date().toISOString();
      }
      return next;
    });
  };

  const markAllAsPaid = (contractorId?: string) => {
    setPaidStatusMap((prev) => {
      const next = { ...prev };
      const nowIso = new Date().toISOString();
      workers.forEach((w) => {
        if (!contractorId || w.contractorId === contractorId) {
          next[w.id] = nowIso;
        }
      });
      return next;
    });
  };

  // Clear all data back to fresh empty state []
  const clearAllData = () => {
    localStorage.removeItem('factory_workers');
    localStorage.removeItem('factory_shifts');
    localStorage.removeItem('factory_contractors');
    localStorage.removeItem('factory_punches');
    localStorage.removeItem('factory_shift_records');
    localStorage.removeItem('factory_paid_status_map');
    setWorkers([]);
    setShifts([]);
    setContractors([]);
    setTimePunches([]);
    setShiftRecords([]);
    setPaidStatusMap({});
  };

  const resetDemoData = () => {
    clearAllData();
  };

  return (
    <FactoryContext.Provider
      value={{
        workers,
        shifts,
        contractors,
        timePunches,
        shiftRecords,
        activeFloorWorkers,
        payrollSummary,
        isOfflineMode,
        offlineQueueCount,
        toggleOfflineMode,
        syncOfflineQueue,
        recordPunch,
        forceClockOut,
        runAutoCheckoutSafetyCheck,
        addWorker,
        updateWorker,
        deleteWorker,
        addContractor,
        updateContractor,
        deleteContractor,
        addShift,
        updateShift,
        deleteShift,
        togglePaymentStatus,
        markAllAsPaid,
        resetDemoData,
        clearAllData,
        getWorkerById,
        getWorkerByCode,
        getWorkerByPin,
        getContractorById,
        getShiftById,
      }}
    >
      {children}
    </FactoryContext.Provider>
  );
};

export const useFactory = () => {
  const context = useContext(FactoryContext);
  if (!context) {
    throw new Error('useFactory must be used within a FactoryProvider');
  }
  return context;
};
