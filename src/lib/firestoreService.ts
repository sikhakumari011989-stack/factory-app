import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import {
  Worker,
  Shift,
  Contractor,
  TimePunch,
  ShiftRecord,
  PayrollSummaryItem,
  UserRole,
  Tenant,
  SubscriptionStatus,
} from '../types';

export const COLLECTIONS = {
  ORGANIZATIONS: 'organizations',
  USERS: 'users',
  CONTRACTORS: 'contractors',
  WORKERS: 'workers',
  SHIFT_CONFIG: 'shift_config',
  PUNCH_LOGS: 'punch_logs',
  WAGE_CALCULATIONS: 'wage_calculations',
} as const;

// Default Organization ID used across tenancy
export const DEFAULT_ORG_ID = 'apex-plant-04';

// ==============================================================================
// 1. ORGANIZATIONS SERVICE
// ==============================================================================
export interface OrgDocument {
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

export const getOrganization = async (orgId: string = DEFAULT_ORG_ID): Promise<OrgDocument | null> => {
  if (!isFirebaseConfigured()) return null;
  try {
    const docRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as OrgDocument;
    }
  } catch (err) {
    console.error('Error fetching organization:', err);
  }
  return null;
};

export const subscribeToOrganization = (
  orgId: string,
  onUpdate: (org: OrgDocument | null) => void
): Unsubscribe => {
  if (!isFirebaseConfigured() || !orgId) return () => {};
  const docRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onUpdate({ id: snap.id, ...snap.data() } as OrgDocument);
      } else {
        onUpdate(null);
      }
    },
    (err) => console.warn('Firestore organization listener warning:', err)
  );
};

export const getAllOrganizationsFromFirestore = async (): Promise<OrgDocument[]> => {
  if (!isFirebaseConfigured()) return [];
  try {
    const q = query(collection(db, COLLECTIONS.ORGANIZATIONS), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as OrgDocument));
  } catch (err) {
    console.error('Error fetching organizations:', err);
    return [];
  }
};

export const updateOrganizationInFirestore = async (
  orgId: string,
  updates: Partial<OrgDocument>
): Promise<void> => {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId);
    await updateDoc(docRef, { ...updates, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error updating organization:', err);
  }
};

export const updateOrganizationSubscription = async (
  orgId: string,
  updates: {
    subscriptionStatus?: SubscriptionStatus;
    subscriptionExpiryDate?: string;
    isLocked?: boolean;
    lockReason?: string;
  }
): Promise<void> => {
  await updateOrganizationInFirestore(orgId, updates);
};

export const deleteOrganizationFromFirestore = async (orgId: string): Promise<void> => {
  if (!isFirebaseConfigured()) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.ORGANIZATIONS, orgId));
  } catch (err) {
    console.error('Error deleting organization:', err);
  }
};

export const getWorkerCountForOrganization = async (orgId: string): Promise<number> => {
  if (!isFirebaseConfigured()) {
    try {
      const stored = localStorage.getItem(`factory_workers_${orgId}`);
      if (stored) return JSON.parse(stored).length;
    } catch {}
    return 0;
  }
  try {
    const q = query(collection(db, COLLECTIONS.WORKERS), where('organizationId', '==', orgId));
    const snap = await getDocs(q);
    return snap.size;
  } catch (err) {
    console.error(`Error fetching worker count for ${orgId}:`, err);
    try {
      const stored = localStorage.getItem(`factory_workers_${orgId}`);
      if (stored) return JSON.parse(stored).length;
    } catch {}
    return 0;
  }
};

export const saveOrganizationToFirestore = async (org: OrgDocument): Promise<void> => {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, COLLECTIONS.ORGANIZATIONS, org.id);
    await setDoc(docRef, { ...org, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving organization:', err);
  }
};

// ==============================================================================
// 2. USERS SERVICE
// ==============================================================================
export interface UserDocument {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: UserRole;
  contractorId?: string;
  status: 'active' | 'inactive';
  createdAt?: string;
}

export const getUsers = async (orgId: string = DEFAULT_ORG_ID): Promise<UserDocument[]> => {
  if (!isFirebaseConfigured()) return [];
  try {
    const q = query(collection(db, COLLECTIONS.USERS), where('organizationId', '==', orgId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as UserDocument));
  } catch (err) {
    console.error('Error fetching users:', err);
    return [];
  }
};

export const saveUserToFirestore = async (user: UserDocument): Promise<void> => {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, COLLECTIONS.USERS, user.id);
    await setDoc(docRef, { ...user, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving user:', err);
  }
};

export const deleteUserFromFirestore = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured()) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.USERS, id));
  } catch (err) {
    console.error('Error deleting user:', err);
  }
};

// ==============================================================================
// 3. CONTRACTORS SERVICE
// ==============================================================================
export const getContractorsFromFirestore = async (
  orgId: string = DEFAULT_ORG_ID
): Promise<Contractor[]> => {
  if (!isFirebaseConfigured()) return [];
  try {
    const q = query(collection(db, COLLECTIONS.CONTRACTORS), where('organizationId', '==', orgId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Contractor));
  } catch (err) {
    console.error('Error fetching contractors:', err);
    return [];
  }
};

export const saveContractorToFirestore = async (
  contractor: Contractor,
  orgId: string = DEFAULT_ORG_ID
): Promise<void> => {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, COLLECTIONS.CONTRACTORS, contractor.id);
    await setDoc(docRef, { ...contractor, organizationId: orgId, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving contractor:', err);
  }
};

export const deleteContractorFromFirestore = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured()) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.CONTRACTORS, id));
  } catch (err) {
    console.error('Error deleting contractor:', err);
  }
};

// ==============================================================================
// 4. SHIFTS SERVICE
// ==============================================================================
export const getShiftsFromFirestore = async (
  orgId: string = DEFAULT_ORG_ID
): Promise<Shift[]> => {
  if (!isFirebaseConfigured()) return [];
  try {
    const q = query(collection(db, COLLECTIONS.SHIFT_CONFIG), where('organizationId', '==', orgId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Shift));
  } catch (err) {
    console.error('Error fetching shifts:', err);
    return [];
  }
};

export const saveShiftToFirestore = async (
  shift: Shift,
  orgId: string = DEFAULT_ORG_ID
): Promise<void> => {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, COLLECTIONS.SHIFT_CONFIG, shift.id);
    await setDoc(docRef, { ...shift, organizationId: orgId, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving shift:', err);
  }
};

export const deleteShiftFromFirestore = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured()) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.SHIFT_CONFIG, id));
  } catch (err) {
    console.error('Error deleting shift:', err);
  }
};

// ==============================================================================
// 5. WORKERS SERVICE
// ==============================================================================
export const getWorkersFromFirestore = async (
  orgId: string = DEFAULT_ORG_ID
): Promise<Worker[]> => {
  if (!isFirebaseConfigured()) return [];
  try {
    const q = query(collection(db, COLLECTIONS.WORKERS), where('organizationId', '==', orgId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Worker));
  } catch (err) {
    console.error('Error fetching workers:', err);
    return [];
  }
};

export const saveWorkerToFirestore = async (
  worker: Worker,
  orgId: string = DEFAULT_ORG_ID
): Promise<void> => {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, COLLECTIONS.WORKERS, worker.id);
    await setDoc(docRef, { ...worker, organizationId: orgId, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving worker:', err);
  }
};

export const deleteWorkerFromFirestore = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured()) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.WORKERS, id));
  } catch (err) {
    console.error('Error deleting worker:', err);
  }
};

// ==============================================================================
// 6. PUNCH_LOGS SERVICE (Kiosk Events)
// ==============================================================================
export const getPunchesFromFirestore = async (
  orgId: string = DEFAULT_ORG_ID
): Promise<TimePunch[]> => {
  if (!isFirebaseConfigured()) return [];
  try {
    const q = query(
      collection(db, COLLECTIONS.PUNCH_LOGS),
      where('organizationId', '==', orgId),
      orderBy('timestamp', 'desc'),
      limit(200)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TimePunch));
  } catch (err) {
    console.error('Error fetching punches:', err);
    return [];
  }
};

export const savePunchToFirestore = async (
  punch: TimePunch,
  orgId: string = DEFAULT_ORG_ID
): Promise<void> => {
  if (!isFirebaseConfigured()) return;
  try {
    const docRef = doc(db, COLLECTIONS.PUNCH_LOGS, punch.id);
    await setDoc(docRef, { ...punch, organizationId: orgId, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error('Error saving punch log:', err);
  }
};

// ==============================================================================
// 7. WAGE_CALCULATIONS SERVICE
// ==============================================================================
export const saveWageCalculationToFirestore = async (
  calc: PayrollSummaryItem | ShiftRecord,
  orgId: string = DEFAULT_ORG_ID
): Promise<void> => {
  if (!isFirebaseConfigured()) return;
  try {
    const docId = 'id' in calc ? (calc as ShiftRecord).id : (calc as PayrollSummaryItem).workerId;
    const docRef = doc(db, COLLECTIONS.WAGE_CALCULATIONS, docId);
    await setDoc(docRef, {
      ...calc,
      organizationId: orgId,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error saving wage calculation:', err);
  }
};

export const getWageCalculationsFromFirestore = async (
  orgId: string = DEFAULT_ORG_ID
): Promise<PayrollSummaryItem[]> => {
  if (!isFirebaseConfigured()) return [];
  try {
    const q = query(collection(db, COLLECTIONS.WAGE_CALCULATIONS), where('organizationId', '==', orgId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data() } as PayrollSummaryItem));
  } catch (err) {
    console.error('Error fetching wage calculations:', err);
    return [];
  }
};

export const deleteWageCalculationFromFirestore = async (workerId: string): Promise<void> => {
  if (!isFirebaseConfigured()) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.WAGE_CALCULATIONS, workerId));
  } catch (err) {
    console.error('Error deleting wage calculation:', err);
  }
};

// ==============================================================================
// REALTIME SNAPSHOT LISTENERS
// ==============================================================================
export const subscribeToWorkers = (
  onUpdate: (workers: Worker[]) => void,
  orgId: string = DEFAULT_ORG_ID
): Unsubscribe => {
  if (!isFirebaseConfigured()) return () => {};
  const q = query(collection(db, COLLECTIONS.WORKERS), where('organizationId', '==', orgId));
  return onSnapshot(
    q,
    (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Worker));
      onUpdate(data);
    },
    (err) => console.warn('Firestore workers listener warning:', err)
  );
};

export const subscribeToPunches = (
  onUpdate: (punches: TimePunch[]) => void,
  orgId: string = DEFAULT_ORG_ID
): Unsubscribe => {
  if (!isFirebaseConfigured()) return () => {};
  const q = query(collection(db, COLLECTIONS.PUNCH_LOGS), where('organizationId', '==', orgId));
  return onSnapshot(
    q,
    (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TimePunch));
      onUpdate(data);
    },
    (err) => console.warn('Firestore punch_logs listener warning:', err)
  );
};

// ==============================================================================
// SEED STARTER DATA TO CLOUD FIRESTORE
// ==============================================================================
export const seedFirestoreDefaults = async (orgId: string = DEFAULT_ORG_ID): Promise<void> => {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not yet configured. Please enter your Firebase API credentials.');
  }

  // 1. Seed Organization
  await setDoc(doc(db, COLLECTIONS.ORGANIZATIONS, orgId), {
    id: orgId,
    name: 'Apex Industrial Plant #4',
    code: 'APEX-04',
    location: 'Sector 12, Heavy Industrial Corridor',
    currency: '₹',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 2. Seed Default Shifts
  const defaultShifts: Shift[] = [
    {
      id: 'shf-morning',
      name: 'Morning General Shift',
      code: 'SHF-DAY',
      startTime: '08:00',
      endTime: '17:00',
      crossesMidnight: false,
      gracePeriodMinutes: 15,
      standardHours: 8.0,
      overtimeMultiplier: 1.5,
      description: 'Standard daytime machining and assembly shift',
      color: '#0284c7',
    },
    {
      id: 'shf-night',
      name: 'Overnight Night Shift',
      code: 'SHF-NIGHT',
      startTime: '20:00',
      endTime: '05:00',
      crossesMidnight: true,
      gracePeriodMinutes: 15,
      standardHours: 8.0,
      overtimeMultiplier: 1.5,
      description: 'Overnight shift with midnight crossing calculation',
      color: '#8b5cf6',
    },
  ];

  for (const shift of defaultShifts) {
    await saveShiftToFirestore(shift, orgId);
  }

  // 3. Seed Starter Contractors
  const defaultContractors: Contractor[] = [
    {
      id: 'cnt-direct',
      name: 'Direct Plant Workforce',
      code: 'DIR',
      contactPerson: 'Operations HR',
      phone: '+91 98111 00001',
      email: 'hr@apexfactory.com',
    },
    {
      id: 'cnt-bharat',
      name: 'Bharat Industrial Manpower',
      code: 'BIM',
      contactPerson: 'Rajesh Sharma',
      phone: '+91 98222 00002',
      email: 'contact@bharatmanpower.in',
    },
  ];

  for (const contractor of defaultContractors) {
    await saveContractorToFirestore(contractor, orgId);
  }

  // 4. Seed Users
  await setDoc(doc(db, COLLECTIONS.USERS, 'usr-admin'), {
    organizationId: orgId,
    email: 'admin@apexfactory.com',
    name: 'Factory Admin',
    role: 'admin',
    status: 'active',
    createdAt: new Date().toISOString(),
  });

  await setDoc(doc(db, COLLECTIONS.USERS, 'usr-guard'), {
    organizationId: orgId,
    email: 'gate2.guard@apexfactory.com',
    name: 'Gate Kiosk Guard',
    role: 'guard',
    status: 'active',
    createdAt: new Date().toISOString(),
  });
};

// ==============================================================================
// 9. MASTER CREATOR / SAAS TENANT PROVISIONING
// ==============================================================================
export interface ProvisionFactoryParams {
  name: string;
  code: string;
  location: string;
  ownerName: string;
  ownerEmail: string;
  phone?: string;
  password?: string;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionExpiryDate?: string; // YYYY-MM-DD
  isLocked?: boolean;
  lockReason?: string;
  currency?: string;
}

export const provisionNewFactory = async (
  params: ProvisionFactoryParams
): Promise<{
  tenant: Tenant;
  ownerUser: UserDocument;
  guardUser: UserDocument;
}> => {
  const cleanCode = (params.code || 'PLANT').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const orgId = `org-${cleanCode.toLowerCase()}-${Date.now().toString(36)}`;
  const currency = params.currency || '₹';
  const now = new Date().toISOString();
  const subscriptionStatus = params.subscriptionStatus || 'active';

  // Default to 30 days out if not manually specified
  const default30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const subscriptionExpiryDate = params.subscriptionExpiryDate?.trim() || default30Days;
  const isLocked = params.isLocked ?? false;

  const orgDoc: OrgDocument = {
    id: orgId,
    name: params.name.trim(),
    code: cleanCode,
    location: params.location.trim() || 'MIDC Industrial Estate, Tarapur/Palghar',
    currency,
    ownerEmail: params.ownerEmail.trim().toLowerCase(),
    ownerName: params.ownerName.trim(),
    phone: params.phone?.trim() || '',
    subscriptionStatus,
    subscriptionExpiryDate,
    isLocked,
    lockReason: params.lockReason || '',
    createdAt: now,
    updatedAt: now,
  };

  const ownerUser: UserDocument = {
    id: `usr-owner-${Date.now().toString(36)}`,
    organizationId: orgId,
    email: params.ownerEmail.trim().toLowerCase(),
    name: params.ownerName.trim(),
    role: 'admin',
    status: 'active',
    createdAt: now,
  };

  const guardUser: UserDocument = {
    id: `usr-guard-${Date.now().toString(36)}`,
    organizationId: orgId,
    email: `guard.${cleanCode.toLowerCase()}@factory.local`,
    name: `Gate Guard (${cleanCode})`,
    role: 'guard',
    status: 'active',
    createdAt: now,
  };

  const directContractor: Contractor = {
    id: `cnt-direct-${orgId}`,
    name: 'Direct Plant Workforce',
    code: 'DIR',
    contactPerson: params.ownerName,
    phone: params.phone?.trim() || '',
    email: params.ownerEmail,
  };

  // Seed standard default shifts for the new plant
  const defaultShifts: Shift[] = [
    {
      id: `shf-day-${orgId}`,
      name: 'General Day Shift (8h)',
      code: 'GEN-01',
      startTime: '08:00',
      endTime: '17:00',
      crossesMidnight: false,
      gracePeriodMinutes: 15,
      standardHours: 8,
      overtimeMultiplier: 1.5,
      description: 'Standard 8-hour general manufacturing shift',
      color: '#0284c7',
    },
    {
      id: `shf-night-${orgId}`,
      name: 'Night Production Shift (8h)',
      code: 'NGT-02',
      startTime: '20:00',
      endTime: '04:00',
      crossesMidnight: true,
      gracePeriodMinutes: 15,
      standardHours: 8,
      overtimeMultiplier: 1.5,
      description: 'Night operations shift crossing midnight',
      color: '#8b5cf6',
    },
  ];

  if (isFirebaseConfigured()) {
    try {
      await saveOrganizationToFirestore(orgDoc);
      await saveUserToFirestore(ownerUser);
      await saveUserToFirestore(guardUser);
      await saveContractorToFirestore(directContractor, orgId);
      for (const shift of defaultShifts) {
        await saveShiftToFirestore(shift, orgId);
      }
    } catch (e) {
      console.warn('Firestore write failed during provisioning, saving locally:', e);
    }
  }

  // Pre-seed local storage for this tenant
  try {
    localStorage.setItem(`factory_shifts_${orgId}`, JSON.stringify(defaultShifts));
    localStorage.setItem(`factory_contractors_${orgId}`, JSON.stringify([directContractor]));
    localStorage.setItem(`factory_workers_${orgId}`, JSON.stringify([]));
    localStorage.setItem(`factory_punches_${orgId}`, JSON.stringify([]));
    localStorage.setItem(`factory_shift_records_${orgId}`, JSON.stringify([]));

    const existingStr = localStorage.getItem('factory_provisioned_tenants');
    const existing = existingStr ? JSON.parse(existingStr) : [];
    existing.push({
      tenant: {
        id: orgDoc.id,
        name: orgDoc.name,
        code: orgDoc.code,
        location: orgDoc.location,
        currency: orgDoc.currency,
        ownerEmail: params.ownerEmail,
        ownerName: params.ownerName,
        phone: params.phone?.trim() || '',
        subscriptionStatus,
        subscriptionExpiryDate,
        isLocked,
        lockReason: params.lockReason || '',
        createdAt: now,
      },
      ownerEmail: params.ownerEmail,
      temporaryPassword: params.password || 'Factory@123',
      ownerName: params.ownerName,
      phone: params.phone?.trim() || '',
      subscriptionStatus,
      subscriptionExpiryDate,
      isLocked,
      lockReason: params.lockReason || '',
      createdAt: now,
      workerCount: 0,
    });
    localStorage.setItem('factory_provisioned_tenants', JSON.stringify(existing));
  } catch (e) {
    console.error('Error saving provisioned tenant to localStorage:', e);
  }

  return {
    tenant: {
      id: orgDoc.id,
      name: orgDoc.name,
      code: orgDoc.code,
      location: orgDoc.location,
      currency: orgDoc.currency,
      ownerEmail: params.ownerEmail,
      ownerName: params.ownerName,
      phone: params.phone?.trim() || '',
      subscriptionStatus,
      subscriptionExpiryDate,
      isLocked,
      lockReason: params.lockReason || '',
      createdAt: now,
    },
    ownerUser,
    guardUser,
  };
};
