import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  getDocs,
  limit,
  query,
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export const STORAGE_KEY_FIREBASE_CONFIG = 'factory_firebase_config';

/**
 * Load Firebase configuration from:
 * 1. Browser localStorage (allows user to paste keys directly in UI)
 * 2. Vite environment variables (.env file)
 */
export const getFirebaseConfig = (): FirebaseConfig => {
  let savedConfig: Partial<FirebaseConfig> = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (raw) {
      savedConfig = JSON.parse(raw);
    }
  } catch {
    // Ignore storage parse error
  }

  const clean = (val: string | undefined) => (val || '').trim().replace(/^["']|["']$/g, '');

  const apiKey = clean(savedConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY);
  const authDomain = clean(savedConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
  const projectId = clean(savedConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID);
  const storageBucket = clean(savedConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
  const messagingSenderId = clean(savedConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
  const appId = clean(savedConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID);

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
};

/**
 * Check if a valid, non-placeholder Firebase configuration is present
 */
export const isFirebaseConfigured = (): boolean => {
  const config = getFirebaseConfig();
  return Boolean(
    config.apiKey &&
    config.projectId &&
    config.appId &&
    !config.apiKey.includes('your-') &&
    !config.projectId.includes('your-project') &&
    config.apiKey.length > 15
  );
};

// Safe fallback credentials when Firebase is not yet configured (prevents app crash)
const DUMMY_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: 'AIzaSyDummyKeyForOfflineFallbackMode123456',
  authDomain: 'factory-labor-tracker-offline.firebaseapp.com',
  projectId: 'factory-labor-tracker-offline',
  storageBucket: 'factory-labor-tracker-offline.appspot.com',
  messagingSenderId: '100000000000',
  appId: '1:100000000000:web:dummy1234567890abcdef',
};

/**
 * Initialize and get Firebase App instance
 */
export const getFirebaseApp = (): FirebaseApp => {
  const config = isFirebaseConfigured() ? getFirebaseConfig() : DUMMY_FIREBASE_CONFIG;
  if (!getApps().length) {
    return initializeApp(config);
  }
  return getApp();
};

export const app = getFirebaseApp();
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);

/**
 * Save custom Firebase configuration to browser localStorage
 */
export const saveFirebaseConfig = (config: FirebaseConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save Firebase config in localStorage:', err);
  }
};

/**
 * Clear stored Firebase configuration
 */
export const clearFirebaseConfig = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_FIREBASE_CONFIG);
  } catch (err) {
    console.error('Failed to clear Firebase config from localStorage:', err);
  }
};

/**
 * Test connectivity with Firebase Firestore
 */
export const testFirebaseConnection = async (
  config: FirebaseConfig
): Promise<{ success: boolean; message: string }> => {
  if (!config.apiKey || config.apiKey.length < 15) {
    return { success: false, message: 'Invalid or missing Firebase API Key.' };
  }
  if (!config.projectId || config.projectId.includes('your-')) {
    return { success: false, message: 'Invalid or missing Firebase Project ID.' };
  }
  if (!config.appId) {
    return { success: false, message: 'Invalid or missing Firebase App ID.' };
  }

  try {
    // Try pinging Firestore REST API endpoint
    const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/(default)/documents?key=${config.apiKey}`;
    const response = await fetch(url, { method: 'GET' });

    if (response.status === 200) {
      return {
        success: true,
        message: 'Successfully connected to Google Cloud Firestore!',
      };
    } else if (response.status === 403 || response.status === 401) {
      const data = await response.json().catch(() => ({}));
      const reason = data.error?.message || 'Access denied. Check API Key or Firestore Security Rules.';
      return {
        success: false,
        message: `Firestore returned status ${response.status}: ${reason}`,
      };
    } else if (response.status === 404) {
      return {
        success: false,
        message: `Project "${config.projectId}" not found or Firestore database is not yet created in the Firebase Console.`,
      };
    }

    return {
      success: true,
      message: 'Connection verified! Firebase Cloud services responded.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Connection failed: ${err.message || 'Network unreachable'}`,
    };
  }
};

/**
 * Production-ready Firestore Security Rules (firestore.rules)
 */
export const FIRESTORE_SECURITY_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions for Multi-Tenant Role-Based Access Control
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function getUserRole() {
      return getUserData().role;
    }

    function getUserOrgId() {
      return getUserData().organizationId;
    }

    function getUserContractorId() {
      return getUserData().contractorId;
    }

    // 1. ORGANIZATIONS (Factory Root)
    match /organizations/{orgId} {
      allow read: if true; // Allow guard kiosk and workers to see factory branding
      allow write: if isAuthenticated() && (getUserOrgId() == orgId && getUserRole() == 'admin');
    }

    // 2. USERS (Admin, Guard, Contractor accounts)
    match /users/{userId} {
      allow read: if true;
      allow write: if isAuthenticated() && getUserRole() == 'admin';
    }

    // 3. CONTRACTORS (Staffing Agencies)
    match /contractors/{contractorId} {
      allow read: if true;
      allow write: if isAuthenticated() && getUserRole() == 'admin';
    }

    // 4. SHIFT_CONFIG (Shift Timing & Overtime Rules)
    match /shift_config/{shiftId} {
      allow read: if true; // Guards, workers and supervisors need shift timing
      allow write: if isAuthenticated() && getUserRole() == 'admin';
    }

    // 5. WORKERS (Personnel Registry & PINs)
    match /workers/{workerId} {
      allow read: if true; // Guard kiosk reads worker PINs and badges for clock-in/out
      allow write: if isAuthenticated() && getUserRole() == 'admin';
    }

    // 6. PUNCH_LOGS (Kiosk Clock In/Out Real-Time Events)
    match /punch_logs/{punchId} {
      allow read: if true;
      allow create: if true; // Guard Kiosks can record punches even in gate mode
      allow update, delete: if isAuthenticated() && getUserRole() == 'admin';
    }

    // 7. WAGE_CALCULATIONS (Weekly Audited Payroll Ledger)
    match /wage_calculations/{calcId} {
      allow read: if isAuthenticated() && (
        getUserRole() == 'admin' ||
        (getUserRole() == 'contractor' && resource.data.contractorId == getUserContractorId())
      );
      allow write: if isAuthenticated() && getUserRole() == 'admin';
    }
  }
}`;

