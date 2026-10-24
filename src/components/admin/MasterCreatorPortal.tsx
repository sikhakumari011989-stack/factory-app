import React, { useState, useEffect, useMemo } from 'react';
import {
  Factory,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Building2,
  Users,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Trash2,
  ArrowRight,
  ExternalLink,
  Search,
  Filter,
  PlusCircle,
  RefreshCw,
  Sparkles,
  ChevronRight,
  LogOut,
  Database,
  Eye,
  EyeOff,
  Layers,
  Calendar,
  Clock,
  Ban,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ProvisionedTenant, SubscriptionStatus } from '../../types';
import { getWorkerCountForOrganization } from '../../lib/firestoreService';

interface MasterCreatorPortalProps {
  onExit: () => void;
  onEnterAsOwner?: (tenantId: string) => void;
}

const getDefault30DaysExpiry = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
};

export const MasterCreatorPortal: React.FC<MasterCreatorPortalProps> = ({
  onExit,
  onEnterAsOwner,
}) => {
  const {
    provisionedTenants,
    selectTenant,
    registerProvisionedFactory,
    updateTenantExpiryDate,
    updateTenantStatus,
    toggleTenantLock,
    deleteTenant,
    refreshTenants,
  } = useAuth();

  // 1. Master Security Gate Authentication State (Strict master key: ASK&1412)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('master_creator_auth') === 'true';
  });
  const [masterPassInput, setMasterPassInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // 2. Active Tab: 'overview' or 'provision'
  const [activeTab, setActiveTab] = useState<'overview' | 'provision'>('overview');

  // 3. Company Setup Form State
  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [location, setLocation] = useState('MIDC Tarapur Industrial Estate, Boisar, Palghar');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [phone, setPhone] = useState('+91 98');
  const [temporaryPassword, setTemporaryPassword] = useState('Tarapur@2026');
  const [subscriptionExpiryDate, setSubscriptionExpiryDate] = useState<string>(getDefault30DaysExpiry());
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('active');
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [provisionSuccessResult, setProvisionSuccessResult] = useState<ProvisionedTenant | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 4. Overview Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked' | 'expired'>('all');
  const [workerCounts, setWorkerCounts] = useState<Record<string, number>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Fetch worker counts for all provisioned tenants
  const updateWorkerCounts = async () => {
    setIsRefreshing(true);
    const counts: Record<string, number> = {};
    for (const item of provisionedTenants) {
      try {
        const count = await getWorkerCountForOrganization(item.tenant.id);
        counts[item.tenant.id] = count;
      } catch {
        counts[item.tenant.id] = item.workerCount || 0;
      }
    }
    setWorkerCounts(counts);
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      updateWorkerCounts();
    }
  }, [isAuthenticated, provisionedTenants]);

  // Master Password Gate Handler (Strict password: ASK&1412)
  const handleGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (masterPassInput.trim() === 'ASK&1412') {
      setIsAuthenticated(true);
      sessionStorage.setItem('master_creator_auth', 'true');
      setMasterPassInput('');
    } else {
      setAuthError('Access Denied: Incorrect Master Password.');
    }
  };

  const handleLockPortal = () => {
    sessionStorage.removeItem('master_creator_auth');
    setIsAuthenticated(false);
    setMasterPassInput('');
  };

  // Auto-generate code from company name
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCompanyName(val);
    if (!companyCode || companyCode.length < 5) {
      const clean = val
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0]?.toUpperCase())
        .join('')
        .slice(0, 4);
      if (clean) setCompanyCode(clean + '-01');
    }
  };

  // Tenant Provisioning Form Submit Handler
  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !ownerName.trim() || !ownerEmail.trim()) {
      alert('Please fill out Company Name, Owner Name, and Owner Email.');
      return;
    }

    setIsProvisioning(true);
    try {
      const result = await registerProvisionedFactory({
        name: companyName.trim(),
        code: companyCode.trim() || 'PLANT-01',
        location: location.trim(),
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim().toLowerCase(),
        phone: phone.trim(),
        password: temporaryPassword.trim() || 'Factory@123',
        subscriptionStatus,
        subscriptionExpiryDate,
        isLocked: false,
        currency: '₹',
      });

      setProvisionSuccessResult(result);
      await refreshTenants();
      await updateWorkerCounts();

      // Reset form fields with new 30-day default
      setCompanyName('');
      setCompanyCode('');
      setOwnerName('');
      setOwnerEmail('');
      setPhone('+91 98');
      setTemporaryPassword('Tarapur@2026');
      setSubscriptionExpiryDate(getDefault30DaysExpiry());
      setSubscriptionStatus('active');
      showToast('Factory successfully provisioned and cloud partition seeded!');
    } catch (err) {
      console.error('Factory provisioning error:', err);
      alert('Failed to provision factory. Check console or Firebase settings.');
    } finally {
      setIsProvisioning(false);
    }
  };

  // Quick date extension handler (+30d, +90d, +1y)
  const handleExtendExpiry = async (
    tenantId: string,
    currentExpiry: string | undefined,
    daysToAdd: number
  ) => {
    const base =
      currentExpiry && new Date(`${currentExpiry}T23:59:59`).getTime() > Date.now()
        ? new Date(currentExpiry)
        : new Date();
    base.setDate(base.getDate() + daysToAdd);
    const newDateStr = base.toISOString().split('T')[0];
    await updateTenantExpiryDate(tenantId, newDateStr);
    showToast(`Subscription extended to ${newDateStr} (+${daysToAdd} days)`);
    await refreshTenants();
  };

  const handleDateChange = async (tenantId: string, newDateStr: string) => {
    if (!newDateStr) return;
    await updateTenantExpiryDate(tenantId, newDateStr);
    showToast(`Updated expiry date to ${newDateStr}`);
    await refreshTenants();
  };

  const handleStatusChange = async (tenantId: string, newStatus: SubscriptionStatus) => {
    await updateTenantStatus(tenantId, newStatus);
    showToast(`Status updated to ${newStatus.toUpperCase()}`);
    await refreshTenants();
  };

  const handleToggleLock = async (
    tenantId: string,
    currentLocked: boolean | undefined,
    currentStatus: string | undefined
  ) => {
    const isCurrentlyBlocked = Boolean(
      currentLocked ||
      currentStatus?.toLowerCase() === 'canceled' ||
      currentStatus?.toLowerCase() === 'suspended'
    );
    if (isCurrentlyBlocked) {
      await toggleTenantLock(tenantId, false);
      await updateTenantStatus(tenantId, 'active');
      showToast('Factory access reinstated! Floor & Kiosk unlocked.');
    } else {
      await toggleTenantLock(tenantId, true, 'Immediate freeze by Super-Admin');
      showToast('Factory FROZEN immediately in real-time!');
    }
    await refreshTenants();
  };

  const handleCopyCredentials = (item: ProvisionedTenant) => {
    const expiry = item.tenant.subscriptionExpiryDate || item.subscriptionExpiryDate || 'N/A';
    const status = (item.tenant.subscriptionStatus || item.subscriptionStatus || 'active').toUpperCase();
    const text = `🏭 FactorySync PWA Credentials:
Company: ${item.tenant.name} (${item.tenant.code})
Location: ${item.tenant.location}
Owner: ${item.ownerName}
Email: ${item.ownerEmail}
Password: ${item.temporaryPassword || 'Factory@123'}
Phone: ${item.phone || 'N/A'}
Subscription Status: ${status}
Subscription Expiry: ${expiry}
Login URL: ${window.location.origin}`;

    navigator.clipboard.writeText(text);
    setCopiedId(item.tenant.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleEnterInstance = (tenantId: string) => {
    selectTenant(tenantId);
    if (onEnterAsOwner) {
      onEnterAsOwner(tenantId);
    } else {
      onExit();
    }
  };

  const handleDeleteFactory = async (tenantId: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${name}" and all its isolated factory data? This cannot be undone.`
      )
    ) {
      await deleteTenant(tenantId);
      await updateWorkerCounts();
      showToast(`Factory "${name}" permanently deleted.`);
    }
  };

  // Expiry badge helper
  const getExpiryBadge = (expiryDate?: string, isLocked?: boolean, status?: string) => {
    if (isLocked || status?.toLowerCase() === 'canceled') {
      return {
        label: 'CANCELED / LOCKED',
        color: 'bg-rose-950/80 border-rose-600 text-rose-300 font-bold',
        isBlocked: true,
      };
    }
    if (status?.toLowerCase() === 'suspended') {
      return {
        label: 'SUSPENDED',
        color: 'bg-amber-950/80 border-amber-600 text-amber-300 font-bold',
        isBlocked: true,
      };
    }
    if (!expiryDate) {
      return {
        label: 'NO EXPIRY DATE',
        color: 'bg-slate-800 border-slate-700 text-slate-400',
        isBlocked: false,
      };
    }
    const diffMs = new Date(`${expiryDate}T23:59:59`).getTime() - Date.now();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return {
        label: `EXPIRED (${Math.abs(diffDays)}d ago)`,
        color: 'bg-rose-600/30 border-rose-500 text-rose-300 font-black animate-pulse',
        isBlocked: true,
      };
    }
    if (diffDays <= 7) {
      return {
        label: `EXPIRING (${diffDays}d left)`,
        color: 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold',
        isBlocked: false,
      };
    }
    return {
      label: `ACTIVE (${diffDays}d left)`,
      color: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-bold',
      isBlocked: false,
    };
  };

  // Filtered tenants list
  const filteredTenants = useMemo(() => {
    return provisionedTenants.filter((item) => {
      const matchesSearch =
        item.tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tenant.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.tenant.location && item.tenant.location.toLowerCase().includes(searchTerm.toLowerCase()));

      const isBlocked =
        Boolean(item.tenant.isLocked) ||
        (item.tenant.subscriptionStatus || item.subscriptionStatus)?.toLowerCase() === 'canceled' ||
        (item.tenant.subscriptionStatus || item.subscriptionStatus)?.toLowerCase() === 'suspended';

      const expiry = item.tenant.subscriptionExpiryDate || item.subscriptionExpiryDate;
      const isExpired = expiry ? new Date(`${expiry}T23:59:59`).getTime() < Date.now() : false;

      if (!matchesSearch) return false;

      if (statusFilter === 'active') {
        return !isBlocked && !isExpired;
      }
      if (statusFilter === 'blocked') {
        return isBlocked;
      }
      if (statusFilter === 'expired') {
        return isExpired && !isBlocked;
      }
      return true;
    });
  }, [provisionedTenants, searchTerm, statusFilter]);

  // Aggregate Metrics
  const totalFactories = provisionedTenants.length;
  const activeCount = provisionedTenants.filter((p) => {
    const isBlocked =
      Boolean(p.tenant.isLocked) ||
      (p.tenant.subscriptionStatus || p.subscriptionStatus)?.toLowerCase() === 'canceled' ||
      (p.tenant.subscriptionStatus || p.subscriptionStatus)?.toLowerCase() === 'suspended';
    const expiry = p.tenant.subscriptionExpiryDate || p.subscriptionExpiryDate;
    const isExpired = expiry ? new Date(`${expiry}T23:59:59`).getTime() < Date.now() : false;
    return !isBlocked && !isExpired;
  }).length;

  const blockedCount = provisionedTenants.filter((p) => {
    return (
      Boolean(p.tenant.isLocked) ||
      (p.tenant.subscriptionStatus || p.subscriptionStatus)?.toLowerCase() === 'canceled' ||
      (p.tenant.subscriptionStatus || p.subscriptionStatus)?.toLowerCase() === 'suspended'
    );
  }).length;

  const expiredCount = provisionedTenants.filter((p) => {
    const expiry = p.tenant.subscriptionExpiryDate || p.subscriptionExpiryDate;
    const isExpired = expiry ? new Date(`${expiry}T23:59:59`).getTime() < Date.now() : false;
    const isBlocked =
      Boolean(p.tenant.isLocked) ||
      (p.tenant.subscriptionStatus || p.subscriptionStatus)?.toLowerCase() === 'canceled' ||
      (p.tenant.subscriptionStatus || p.subscriptionStatus)?.toLowerCase() === 'suspended';
    return isExpired && !isBlocked;
  }).length;

  const totalTrackedWorkers = Object.values(workerCounts).reduce((acc, curr) => acc + curr, 0);

  // ==============================================================================
  // VIEW 1: GATE / PASSWORD SCREEN (When not authenticated)
  // ==============================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 text-slate-950 shadow-xl shadow-amber-500/20 mb-2">
              <ShieldAlert className="w-8 h-8 text-white stroke-[2.2]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-100">
              Creator Master Gate
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Restricted SaaS Provisioning & Multi-Tenant Infrastructure
            </p>
          </div>

          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
              <KeyRound className="w-5 h-5 shrink-0 text-amber-400" />
              <div>
                <span className="font-bold block">Super-Admin Access Restricted</span>
                <span className="text-[11px] text-amber-400/80">
                  Enter master security key to provision client factories and inspect global tenancy.
                </span>
              </div>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs text-center font-bold flex items-center justify-center gap-2 animate-in shake duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleGateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                  Master Creator Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={masterPassInput}
                    onChange={(e) => setMasterPassInput(e.target.value)}
                    placeholder="Enter Master Key"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-lg shadow-amber-600/30 transition-all cursor-pointer font-sans"
              >
                <Unlock className="w-4 h-4" />
                <span>Verify Access Key</span>
              </button>
            </form>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={onExit}
                className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                <span>Return to Factory Floor</span>
              </button>
              <span className="text-[11px] font-mono text-slate-500">v2.0 Super-Admin</span>
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-500">
            FactorySync Multi-Tenant Infrastructure • Isolated Tenant Workspaces
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================================
  // VIEW 2: AUTHENTICATED MASTER CREATOR PORTAL
  // ==============================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-900 border border-emerald-500 text-emerald-300 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ShieldCheck className="w-5 h-5 text-slate-950 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-white text-base sm:text-lg tracking-tight">
                Super-Admin Creator Portal
              </span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-mono font-bold tracking-wider rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                SaaS Fleet Control
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-Time Cloud Enforcement</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-slate-400">Master Verified</span>
            </p>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => updateWorkerCounts()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
            title="Refresh Client Tenants Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold cursor-pointer transition-all shadow-xs"
            title="Exit to Factory Floor App"
          >
            <Factory className="w-3.5 h-3.5 text-emerald-400" />
            <span>Factory Floor</span>
          </button>

          <button
            onClick={handleLockPortal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-rose-200 text-xs font-semibold cursor-pointer transition-all shadow-xs"
            title="Lock Creator Portal & Clear Session"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Lock Portal</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Total Client Factories */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Factories
              </span>
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">{totalFactories}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Deployed instances</div>
          </div>

          {/* Active Paid Subscriptions */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Active Paid
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-400">{activeCount}</div>
            <div className="text-[10px] text-emerald-400/80 mt-0.5">Live unlocked plants</div>
          </div>

          {/* Locked / Canceled Accounts */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Locked / Canceled
              </span>
              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-400">{blockedCount}</div>
            <div className="text-[10px] text-rose-400/80 mt-0.5">Frozen access instances</div>
          </div>

          {/* Overdue / Expired Accounts */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Expired License
              </span>
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-400">{expiredCount}</div>
            <div className="text-[10px] text-amber-400/80 mt-0.5">Passed cutoff date</div>
          </div>

          {/* Total Tracked Workers */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 relative overflow-hidden col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Tracked Workers
              </span>
              <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-sky-400">{totalTrackedWorkers}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Across all factories</div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Fleet Management & License Control ({provisionedTenants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('provision')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === 'provision'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Provision New Factory</span>
          </button>
        </div>

        {/* TAB 1: PROVISION NEW FACTORY (Manual Expiry Date Field & Status) */}
        {activeTab === 'provision' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Provisioning Success Credentials Card */}
            {provisionSuccessResult && (
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/50 shadow-xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        Factory Instance Successfully Provisioned!
                      </h3>
                      <p className="text-xs text-emerald-400">
                        Root organization created with manual expiration date and owner administrator account.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyCredentials(provisionSuccessResult)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer shadow-md transition-all"
                    >
                      {copiedId === provisionSuccessResult.tenant.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Client Credentials</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleEnterInstance(provisionSuccessResult.tenant.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Enter as Owner</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-emerald-500/20 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-900/40">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Company</span>
                    <span className="font-bold text-white truncate block">{provisionSuccessResult.tenant.name}</span>
                    <span className="text-[11px] text-emerald-400 font-mono block">Code: {provisionSuccessResult.tenant.code}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-900/40">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Owner & Phone</span>
                    <span className="font-bold text-white truncate block">{provisionSuccessResult.ownerName}</span>
                    <span className="text-[11px] text-slate-400 block">{provisionSuccessResult.phone || 'N/A'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-900/40">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Owner Email</span>
                    <span className="font-mono text-indigo-300 font-semibold truncate block">{provisionSuccessResult.ownerEmail}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-900/40">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Temporary Password</span>
                    <span className="font-mono text-amber-300 font-bold block">{provisionSuccessResult.temporaryPassword}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-emerald-900/40">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Subscription Expiry</span>
                    <span className="font-mono text-emerald-400 font-bold block">
                      {provisionSuccessResult.tenant.subscriptionExpiryDate || subscriptionExpiryDate}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Form Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-amber-400" />
                  <span>Onboard New Industrial Client Factory</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Provision an isolated multi-tenant database partition, owner login credentials, and manual subscription expiration date.
                </p>
              </div>

              <form onSubmit={handleProvisionSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Company Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Company / Factory Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={companyName}
                        onChange={handleCompanyNameChange}
                        placeholder="e.g. Mahavir Precision Castings Pvt Ltd"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Plant Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Plant Identification Code <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={companyCode}
                      onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                      placeholder="e.g. MPC-01"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-amber-500 uppercase"
                    />
                  </div>

                  {/* Industrial Location / MIDC */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-slate-300">
                      Industrial Location / MIDC Corridor <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Plot F-12, MIDC Tarapur Industrial Area, Boisar, Palghar - 401506"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Owner Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Owner / Managing Director Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder="e.g. Mahendra Parmar"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Owner Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Owner Work Email <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={ownerEmail}
                        onChange={(e) => setOwnerEmail(e.target.value)}
                        placeholder="owner@mahavircasting.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Contact Phone */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Contact Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98200 12345"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Temporary Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Temporary Owner Password <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={temporaryPassword}
                        onChange={(e) => setTemporaryPassword(e.target.value)}
                        placeholder="Tarapur@2026"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* MANUAL EXPIRY DATE FIELD (Default: 30 days out) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        <span>Subscription Expiry Date <span className="text-rose-400">*</span></span>
                      </span>
                      <span className="text-[10px] text-amber-400 font-mono">Manual Date Picker</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={subscriptionExpiryDate}
                      onChange={(e) => setSubscriptionExpiryDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      Defaults to 30 days from today. Access automatically locks once this cutoff date elapses.
                    </span>
                  </div>

                  {/* Initial Access Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Initial Subscription Status
                    </label>
                    <select
                      value={subscriptionStatus}
                      onChange={(e) => setSubscriptionStatus(e.target.value as SubscriptionStatus)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-bold text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="active">Active (Full Commercial License)</option>
                      <option value="trial">Trial (Evaluation Period)</option>
                      <option value="suspended">Suspended (Temporarily Frozen)</option>
                      <option value="canceled">Canceled (Access Denied)</option>
                    </select>
                    <span className="text-[10px] text-slate-500 block">
                      Super-Admin can change or freeze this status at any time from the fleet table.
                    </span>
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('overview')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isProvisioning}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isProvisioning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Provisioning Cloud Instance...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        <span>Provision Factory Instance Now</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: CLIENT FACTORIES OVERVIEW & ABSOLUTE CONTROL FLEET TABLE */}
        {activeTab === 'overview' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Filter & Search Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search factories by company name, plant code, owner, location..."
                    className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                    statusFilter === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({provisionedTenants.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                    statusFilter === 'active' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => setStatusFilter('blocked')}
                  className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                    statusFilter === 'blocked' ? 'bg-rose-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Locked / Canceled ({blockedCount})
                </button>
                <button
                  onClick={() => setStatusFilter('expired')}
                  className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition-colors ${
                    statusFilter === 'expired' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Expired ({expiredCount})
                </button>
              </div>
            </div>

            {/* Factories Master Fleet Cards */}
            {filteredTenants.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
                <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-300">No Client Factories Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {searchTerm
                    ? 'No factory matches your search filter. Try clearing the search query.'
                    : 'Get started by clicking "Provision New Factory" to onboard your first industrial plant.'}
                </p>
                <button
                  onClick={() => setActiveTab('provision')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Provision First Factory</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredTenants.map((item) => {
                  const workerCount = workerCounts[item.tenant.id] ?? (item.workerCount || 0);
                  const expiry = item.tenant.subscriptionExpiryDate || item.subscriptionExpiryDate;
                  const currentStatus = item.tenant.subscriptionStatus || item.subscriptionStatus || 'active';
                  const isLocked = Boolean(item.tenant.isLocked);
                  const expiryBadge = getExpiryBadge(expiry, isLocked, currentStatus);
                  const isCurrentlyBlocked = Boolean(
                    isLocked ||
                    currentStatus.toLowerCase() === 'canceled' ||
                    currentStatus.toLowerCase() === 'suspended'
                  );

                  return (
                    <div
                      key={item.tenant.id}
                      className={`bg-slate-900/90 border rounded-2xl p-4 sm:p-5 transition-all shadow-md space-y-4 group ${
                        isCurrentlyBlocked
                          ? 'border-rose-900/60 bg-gradient-to-br from-rose-950/20 to-slate-900/90'
                          : expiryBadge.isBlocked
                          ? 'border-amber-900/60 bg-gradient-to-br from-amber-950/10 to-slate-900/90'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Header: Company Name & Live Urgency Badge */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-black text-white text-base tracking-tight truncate">
                              {item.tenant.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-amber-400 font-mono text-[11px] font-bold">
                              {item.tenant.code}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider border ${expiryBadge.color}`}
                            >
                              {expiryBadge.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate max-w-sm">{item.tenant.location || 'MIDC Tarapur/Palghar'}</span>
                            </span>
                            <span className="text-slate-600 hidden sm:inline">•</span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                              <span className="font-semibold text-slate-200">{workerCount} Active Workers</span>
                            </span>
                          </div>
                        </div>

                        {/* Quick Client Actions */}
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <button
                            onClick={() => handleCopyCredentials(item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer shadow-xs"
                            title="Copy credentials card"
                          >
                            {copiedId === item.tenant.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy Info</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleEnterInstance(item.tenant.id)}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                            title="Enter plant as Factory Owner"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Enter Plant</span>
                          </button>

                          <button
                            onClick={() => handleDeleteFactory(item.tenant.id, item.tenant.name)}
                            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800/80 border border-slate-700 text-slate-400 transition-colors cursor-pointer"
                            title="Permanently delete factory instance"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Super-Admin Absolute Control Panel (Expiry Date & Access Status) */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
                        {/* Editable Expiry Date Picker & Extension Buttons */}
                        <div className="md:col-span-5 space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3 h-3 text-amber-400" />
                              <span>Editable Expiry Date</span>
                            </span>
                            <span className="text-slate-500 font-mono text-[10px]">Real-time cloud sync</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="date"
                              value={expiry || ''}
                              onChange={(e) => handleDateChange(item.tenant.id, e.target.value)}
                              className="flex-1 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                            />
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleExtendExpiry(item.tenant.id, expiry, 30)}
                                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-amber-300 font-bold text-[11px] cursor-pointer transition-colors"
                                title="Add 30 Days"
                              >
                                +30d
                              </button>
                              <button
                                onClick={() => handleExtendExpiry(item.tenant.id, expiry, 90)}
                                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-amber-300 font-bold text-[11px] cursor-pointer transition-colors"
                                title="Add 90 Days"
                              >
                                +90d
                              </button>
                              <button
                                onClick={() => handleExtendExpiry(item.tenant.id, expiry, 365)}
                                className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-amber-300 font-bold text-[11px] cursor-pointer transition-colors"
                                title="Add 1 Year"
                              >
                                +1y
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Status Manager Dropdown (Active / Canceled / Suspended / Trial) */}
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block">
                            Subscription Status Manager
                          </label>
                          <select
                            value={currentStatus.toLowerCase()}
                            onChange={(e) => handleStatusChange(item.tenant.id, e.target.value as SubscriptionStatus)}
                            className={`w-full px-2.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer focus:outline-none transition-colors ${
                              currentStatus.toLowerCase() === 'active'
                                ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                                : currentStatus.toLowerCase() === 'suspended'
                                ? 'bg-amber-950/80 border-amber-600 text-amber-300'
                                : 'bg-rose-950/80 border-rose-600 text-rose-300'
                            }`}
                          >
                            <option value="active">Active (Authorized)</option>
                            <option value="suspended">Suspended (Paused)</option>
                            <option value="canceled">Canceled (Frozen)</option>
                            <option value="trial">Trial (Evaluation)</option>
                          </select>
                        </div>

                        {/* 1-Click Instant Cancel / Lock Access Button */}
                        <div className="md:col-span-4 space-y-1">
                          <label className="text-[10px] uppercase font-bold text-slate-400 block">
                            Real-Time App Access Lock
                          </label>
                          {isCurrentlyBlocked ? (
                            <button
                              onClick={() => handleToggleLock(item.tenant.id, item.tenant.isLocked, currentStatus)}
                              className="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 cursor-pointer transition-colors"
                              title="Reinstate factory access and activate license"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Reinstate / Unlock Access</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleLock(item.tenant.id, item.tenant.isLocked, currentStatus)}
                              className="w-full py-1.5 px-3 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-950 cursor-pointer transition-colors"
                              title="Immediately freeze this factory's application in real-time"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Instant Cancel / Lock Access</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Detail Footer Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80 text-[11px]">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-slate-400">Owner:</span>
                          <span className="font-semibold text-slate-200 truncate">{item.ownerName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-slate-400">Email:</span>
                          <span className="font-mono text-indigo-300 truncate">{item.ownerEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="text-slate-400">Phone:</span>
                          <span className="text-slate-300">{item.phone || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-500">
        FactorySync Enterprise • Super-Admin Master Tenant Provisioning System • Palghar/Tarapur Industrial Deployment
      </footer>
    </div>
  );
};
