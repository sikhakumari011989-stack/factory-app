import React, { useState, useEffect } from 'react';
import {
  Factory,
  Shield,
  UserCheck,
  Building2,
  Lock,
  KeyRound,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Tenant } from '../../types';

export type AuthMode = 'owner' | 'guard';

interface AuthScreenProps {
  initialMode?: AuthMode;
  onSuccess: (role: 'admin' | 'guard') => void;
  onOpenMasterCreator: () => void;
  onNavigateMode?: (mode: AuthMode) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'owner',
  onSuccess,
  onOpenMasterCreator,
  onNavigateMode,
}) => {
  const {
    loginOwnerWith2Code,
    loginGuardWith2Code,
    tenant,
    provisionedTenants,
  } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);

  // Form inputs
  const [companyCode, setCompanyCode] = useState<string>(tenant?.code || 'APEX-P1');
  const [ownerSecretCode, setOwnerSecretCode] = useState<string>('Factory@123');
  const [guardPinCode, setGuardPinCode] = useState<string>('1234');
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync mode when initialMode prop changes
  useEffect(() => {
    setAuthMode(initialMode);
  }, [initialMode]);

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setErrorMessage(null);
    if (onNavigateMode) {
      onNavigateMode(mode);
    }
  };

  // Find matching tenant for real-time visual feedback
  const cleanCode = companyCode.trim().toUpperCase();
  const matchedTenant = provisionedTenants.find(
    (p) => p.tenant.code.toUpperCase() === cleanCode || p.tenant.id.toUpperCase() === cleanCode
  )?.tenant || (cleanCode === 'APEX-P1' || cleanCode === 'APEX' ? tenant : null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (authMode === 'owner') {
        const res = loginOwnerWith2Code(companyCode, ownerSecretCode);
        if (!res.success) {
          setErrorMessage(res.message || 'Owner authentication failed. Please check your credentials.');
          setIsSubmitting(false);
          return;
        }
        onSuccess('admin');
      } else {
        const res = loginGuardWith2Code(companyCode, guardPinCode);
        if (!res.success) {
          setErrorMessage(res.message || 'Guard authentication failed. Please verify your PIN.');
          setIsSubmitting(false);
          return;
        }
        onSuccess('guard');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-linear-to-br from-emerald-400 via-teal-600 to-indigo-600 text-slate-950 shadow-xl shadow-emerald-500/20 mb-1">
            <Factory className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-100">
            FactorySync PWA
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Multi-Tenant Industrial Labor & Shift Attendance Engine
          </p>
        </div>

        {/* 3 Dedicated Access Portals Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          {/* Owner Tab */}
          <button
            type="button"
            onClick={() => switchMode('owner')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              authMode === 'owner'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Owner Portal</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
              /owner-login
            </span>
          </button>

          {/* Guard Tab */}
          <button
            type="button"
            onClick={() => switchMode('guard')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              authMode === 'guard'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Guard Kiosk</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
              /guard-login
            </span>
          </button>
        </div>

        {/* Main 2-Code Auth Card */}
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Portal Identifier Badge */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  authMode === 'owner' ? 'bg-indigo-400 animate-pulse' : 'bg-emerald-400 animate-pulse'
                }`}
              />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {authMode === 'owner' ? 'Factory Owner 2-Code Access' : 'Security Gate Kiosk 2-Code Access'}
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
              Tenant Scoped
            </span>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs font-bold flex items-start gap-2.5 animate-in shake duration-200 shadow-md">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* 2-Code Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* CODE 1: Company Code */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Code 1: Factory Company Code</span>
                </label>
                {matchedTenant && (
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="truncate max-w-[140px]">{matchedTenant.name}</span>
                  </span>
                )}
              </div>
              <input
                type="text"
                required
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                placeholder="e.g., APEX-P1 or MPC-01"
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white font-mono font-bold text-sm sm:text-base focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 uppercase tracking-wider transition-all placeholder:text-slate-600 shadow-inner"
              />
              {/* Quick Preset Selector Chips */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-[10px] text-slate-500 font-semibold">Quick Select:</span>
                <button
                  type="button"
                  onClick={() => {
                    setCompanyCode('APEX-P1');
                    if (authMode === 'owner') setOwnerSecretCode('Factory@123');
                    else setGuardPinCode('1234');
                  }}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[10px] font-mono cursor-pointer transition-colors"
                >
                  APEX-P1 (Apex Plant)
                </button>
                {provisionedTenants.slice(0, 2).map((p) => (
                  <button
                    key={p.tenant.id}
                    type="button"
                    onClick={() => {
                      setCompanyCode(p.tenant.code);
                      if (authMode === 'owner') setOwnerSecretCode(p.temporaryPassword || 'Factory@123');
                      else setGuardPinCode('1234');
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 text-[10px] font-mono cursor-pointer transition-colors truncate max-w-[150px]"
                  >
                    {p.tenant.code} ({p.tenant.name.slice(0, 12)}..)
                  </button>
                ))}
              </div>
            </div>

            {/* CODE 2: Owner Qualification / Secret Code (when in owner mode) */}
            {authMode === 'owner' && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Code 2: Owner Qualification / Secret Code</span>
                  </label>
                  <span className="text-[10px] text-slate-500">Default: Factory@123</span>
                </div>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    required
                    value={ownerSecretCode}
                    onChange={(e) => setOwnerSecretCode(e.target.value)}
                    placeholder="Enter owner secret password"
                    className="w-full pl-4 pr-11 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white font-mono text-sm sm:text-base focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret((prev) => !prev)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                    aria-label="Toggle secret visibility"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* CODE 2: Guard or Worker PIN Code (when in guard mode) */}
            {authMode === 'guard' && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Code 2: Guard or Worker PIN Code</span>
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">Default: 1234</span>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={8}
                    required
                    value={guardPinCode}
                    onChange={(e) => setGuardPinCode(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white font-mono font-black text-center text-xl tracking-[0.3em] focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:tracking-normal placeholder:text-sm placeholder:text-slate-600 shadow-inner"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Accepts designated Guard Gate PIN (1234) or any registered plant worker PIN.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 px-4 rounded-2xl text-white font-bold text-sm shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                authMode === 'owner'
                  ? 'bg-linear-to-r from-indigo-600 via-indigo-700 to-blue-700 hover:from-indigo-500 hover:to-blue-600 shadow-indigo-900/40'
                  : 'bg-linear-to-r from-emerald-600 via-teal-600 to-indigo-700 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/40'
              }`}
            >
              <span>
                {authMode === 'owner'
                  ? 'Verify & Open Owner Dashboard'
                  : 'Unlock Security Gate Kiosk'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Master Setup Gateway Link */}
          <div className="pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onOpenMasterCreator}
              className="w-full p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer flex items-center justify-between text-xs font-semibold shadow-xs"
              title="Secured SaaS Creator Route: /master-creator"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="font-bold block">SaaS Master Setup Gateway</span>
                  <span className="text-[10px] text-amber-400/80">
                    Route: /master-creator • Secured by master key (ASK&1412)
                  </span>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-amber-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-[11px] text-slate-500">
          FactorySync PWA Enterprise Multi-Tenant Attendance Engine
        </div>
      </div>
    </div>
  );
};
