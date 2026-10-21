import React, { useState, useEffect } from 'react';
import {
  Database,
  Check,
  Copy,
  ExternalLink,
  X,
  ShieldCheck,
  Server,
  Key,
  Globe,
  RefreshCw,
  AlertCircle,
  FileCode,
  Sliders,
  CheckCircle2,
  Sparkles,
  Flame,
} from 'lucide-react';
import {
  getFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  testFirebaseConnection,
  isFirebaseConfigured,
  FIRESTORE_SECURITY_RULES,
  FirebaseConfig,
} from '../../lib/firebase';
import { seedFirestoreDefaults } from '../../lib/firestoreService';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'connection' | 'rules' | 'env'>('connection');
  const [config, setConfig] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  });

  const [rawSnippet, setRawSnippet] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);
  const [copiedRules, setCopiedRules] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getFirebaseConfig();
      setConfig(current);
      setTestResult(null);
      setSeedResult(null);
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConnected = isFirebaseConfigured();

  // Parse raw Firebase JS snippet if user pastes it (e.g. const firebaseConfig = { apiKey: ... })
  const handleParseSnippet = (text: string) => {
    setRawSnippet(text);
    try {
      const extract = (key: string) => {
        const regex = new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`);
        const match = text.match(regex);
        return match ? match[1] : '';
      };

      const parsed: FirebaseConfig = {
        apiKey: extract('apiKey') || config.apiKey,
        authDomain: extract('authDomain') || config.authDomain,
        projectId: extract('projectId') || config.projectId,
        storageBucket: extract('storageBucket') || config.storageBucket,
        messagingSenderId: extract('messagingSenderId') || config.messagingSenderId,
        appId: extract('appId') || config.appId,
      };

      if (parsed.apiKey && parsed.projectId) {
        setConfig(parsed);
      }
    } catch {
      // Ignore
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    const result = await testFirebaseConnection(config);
    setTestResult(result);
    setIsTesting(false);
  };

  const handleSave = () => {
    saveFirebaseConfig(config);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      window.location.reload();
    }, 1200);
  };

  const handleClear = () => {
    if (window.confirm('Disconnect from Firebase Cloud Firestore and revert back to Local Offline storage?')) {
      clearFirebaseConfig();
      setConfig({
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
      });
      setTimeout(() => window.location.reload(), 300);
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    try {
      await seedFirestoreDefaults();
      setSeedResult('Successfully seeded default factory plant, shifts, and contractors to Firestore!');
    } catch (err: any) {
      setSeedResult(`Seeding error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSeeding(false);
    }
  };

  const copyRules = () => {
    navigator.clipboard.writeText(FIRESTORE_SECURITY_RULES);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2500);
  };

  const envSnippet = `VITE_FIREBASE_API_KEY=${config.apiKey || 'AIzaSy...'}
VITE_FIREBASE_AUTH_DOMAIN=${config.authDomain || 'your-project.firebaseapp.com'}
VITE_FIREBASE_PROJECT_ID=${config.projectId || 'your-project-id'}
VITE_FIREBASE_STORAGE_BUCKET=${config.storageBucket || 'your-project.appspot.com'}
VITE_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId || '1234567890'}
VITE_FIREBASE_APP_ID=${config.appId || '1:1234567890:web:abcdef'}`;

  const copyEnv = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-md">
              <Flame className="w-5 h-5 fill-amber-400/20 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-100 tracking-tight">
                  Firebase Cloud Firestore
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    isConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {isConnected ? 'Firebase Live' : 'Local Offline Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Google Cloud NoSQL collections, real-time sync, and security rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtabs Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('connection')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'connection'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Connection & Keys</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'rules'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Security Rules (firestore.rules)</span>
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'env'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Environment (.env)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300 flex-1">
          {/* TAB 1: CONNECTION & KEYS */}
          {activeTab === 'connection' && (
            <div className="space-y-5">
              {/* Status Box */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="relative flex h-3 w-3 mt-1 shrink-0">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isConnected ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                    <span
                      className={`relative inline-flex rounded-full h-3 w-3 ${
                        isConnected ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                  </span>
                  <div>
                    <div className="font-bold text-slate-100 text-sm">
                      {isConnected
                        ? 'Connected to Google Firebase Project'
                        : 'Operating in Local Storage Mode'}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isConnected
                        ? `Live sync active for Firestore collections: organizations, users, contractors, workers, shift_config, punch_logs, and wage_calculations.`
                        : 'Using browser local storage and IndexedDB. Paste your Firebase project configuration below to connect.'}
                    </p>
                  </div>
                </div>

                {isConnected && (
                  <button
                    onClick={handleClear}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-200 border border-slate-700 hover:border-rose-700 text-xs font-semibold text-slate-300 transition-all cursor-pointer shrink-0"
                  >
                    Disconnect
                  </button>
                )}
              </div>

              {/* Quick Config Object Auto-Parser */}
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Paste: Firebase SDK Config Snippet</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Auto-populates fields below</span>
                </label>
                <input
                  type="text"
                  value={rawSnippet}
                  onChange={(e) => handleParseSnippet(e.target.value)}
                  placeholder='Paste { apiKey: "...", projectId: "...", ... } from Firebase Console'
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 font-mono text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* 6 Key Inputs Grid */}
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* API Key */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      VITE_FIREBASE_API_KEY *
                    </label>
                    <input
                      type="text"
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="AIzaSy..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  {/* Project ID */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      VITE_FIREBASE_PROJECT_ID *
                    </label>
                    <input
                      type="text"
                      value={config.projectId}
                      onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                      placeholder="my-factory-app"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  {/* Auth Domain */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      VITE_FIREBASE_AUTH_DOMAIN
                    </label>
                    <input
                      type="text"
                      value={config.authDomain}
                      onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
                      placeholder="my-factory-app.firebaseapp.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  {/* Storage Bucket */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      VITE_FIREBASE_STORAGE_BUCKET
                    </label>
                    <input
                      type="text"
                      value={config.storageBucket}
                      onChange={(e) => setConfig({ ...config, storageBucket: e.target.value })}
                      placeholder="my-factory-app.appspot.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  {/* Messaging Sender ID */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      VITE_FIREBASE_MESSAGING_SENDER_ID
                    </label>
                    <input
                      type="text"
                      value={config.messagingSenderId}
                      onChange={(e) => setConfig({ ...config, messagingSenderId: e.target.value })}
                      placeholder="1234567890"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  {/* App ID */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      VITE_FIREBASE_APP_ID *
                    </label>
                    <input
                      type="text"
                      value={config.appId}
                      onChange={(e) => setConfig({ ...config, appId: e.target.value })}
                      placeholder="1:1234567890:web:abcdef..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 font-mono text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Test Feedback Notice */}
                {testResult && (
                  <div
                    className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs animate-in fade-in ${
                      testResult.success
                        ? 'bg-emerald-950/70 border-emerald-600/80 text-emerald-200'
                        : 'bg-rose-950/70 border-rose-600/80 text-rose-200'
                    }`}
                  >
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                {/* Seed Result */}
                {seedResult && (
                  <div className="p-3 rounded-xl bg-blue-950/70 border border-blue-600/80 text-blue-200 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400" />
                    <span>{seedResult}</span>
                  </div>
                )}

                {/* Save Confirmation */}
                {isSaved && (
                  <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Firebase credentials saved! Reloading application...</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleTest}
                      disabled={isTesting || !config.apiKey || !config.projectId}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                      <span>{isTesting ? 'Testing Firestore...' : 'Test Connection'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSeed}
                      disabled={isSeeding || !isConnected}
                      className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
                      title="Seed default plant, shifts, and contractors to Cloud Firestore"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isSeeding ? 'Seeding...' : 'Seed Starter Collections'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!config.apiKey || !config.projectId || isSaved}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-lg shadow-amber-600/30 disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Save & Connect Firebase</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FIRESTORE SECURITY RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <h4 className="font-bold text-slate-100 text-sm">
                    Firestore Security Rules (firestore.rules)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Covers all 7 collections: organizations, users, contractors, workers, shift_config, punch_logs, wage_calculations
                  </p>
                </div>
                <button
                  onClick={copyRules}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-amber-600/20 active:scale-95 shrink-0"
                >
                  {copiedRules ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedRules ? 'Copied Rules!' : 'Copy firestore.rules'}</span>
                </button>
              </div>

              {/* Instructions */}
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-900/50 text-amber-200 text-xs flex items-start gap-2.5">
                <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Instructions:</strong> Open the Firebase Console $\rightarrow$ Firestore Database $\rightarrow$ <strong>Rules</strong> tab $\rightarrow$ Paste these rules $\rightarrow$ Click <strong>Publish</strong>.
                </span>
              </div>

              {/* Code viewer */}
              <div className="relative">
                <pre className="p-4 rounded-2xl bg-slate-950 text-slate-300 font-mono text-xs border border-slate-800 max-h-80 overflow-y-auto whitespace-pre leading-relaxed shadow-inner">
                  {FIRESTORE_SECURITY_RULES}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: ENVIRONMENT (.ENV) */}
          {activeTab === 'env' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-100 text-sm">
                    Local / Production Environment Configuration
                  </h4>
                  <button
                    onClick={copyEnv}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEnv ? 'Copied .env!' : 'Copy .env snippet'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Save this in your <code className="text-amber-400 font-mono">.env</code> file in the project root or configure these variables in your production hosting platform (e.g., Firebase Hosting, Vercel, Netlify).
                </p>
                <div className="p-3.5 rounded-xl bg-slate-900 font-mono text-xs border border-slate-800 text-slate-300 whitespace-pre">
                  {envSnippet}
                </div>
              </div>

              {/* Collections Checklist */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Integrated Firestore Collections
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>organizations</strong> (Factory Root)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>users</strong> (Admin, Guard, Contractor)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>contractors</strong> (Staffing Agencies)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>shift_config</strong> (Shift Timing & Overtime)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>workers</strong> (PINs & Security Badges)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>punch_logs</strong> (Kiosk Punch Events)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 sm:col-span-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>wage_calculations</strong> (Weekly Audited Payroll Ledger)</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/70">
          <div className="text-[11px] text-slate-500 font-mono">
            {isConnected ? 'Status: Firebase Cloud Firestore Active' : 'Status: Local Resilient Storage'}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

