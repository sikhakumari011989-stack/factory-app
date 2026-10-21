import React, { useState } from 'react';
import {
  Factory,
  Shield,
  UserCheck,
  Building2,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  Layers,
  CheckCircle2,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { useFactory } from '../../context/FactoryContext';
import { MasterProvisioningModal } from './MasterProvisioningModal';

interface AuthScreenProps {
  onSuccess: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const { login, loginWithCredentials, tenant, provisionedTenants, selectTenant } = useAuth();
  const { contractors } = useFactory();

  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('admin@apexfactory.com');
  const [password, setPassword] = useState('••••••••');
  const [contractorId, setContractorId] = useState(contractors[0]?.id || 'cnt-direct');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);

  const handleRoleQuickSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage(null);
    if (role === 'admin') {
      setEmail(tenant.ownerEmail || 'admin@apexfactory.com');
      setPassword('••••••••');
    } else if (role === 'guard') {
      setEmail('gate2.guard@apexfactory.com');
      setPassword('••••••••');
    } else if (role === 'contractor') {
      setEmail(contractors[0]?.email || 'agency@factorymanpower.in');
      setPassword('••••••••');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // If password is not dummy dots, verify credentials
    if (password && password !== '••••••••') {
      const res = loginWithCredentials(email, password);
      if (!res.success) {
        setErrorMessage(res.message || 'Login failed. Please check your credentials.');
        return;
      }
    } else {
      login(selectedRole, selectedRole === 'contractor' ? contractorId : undefined, email);
    }

    onSuccess();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-linear-to-br from-indigo-500 via-blue-600 to-sky-400 text-white shadow-xl shadow-blue-500/20 mb-2">
            <Factory className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-100">
            FactorySync PWA
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Factory Labor & Attendance System
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Active Factory Instance Banner / Switcher */}
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Active Factory Instance
                </span>
                <span className="text-xs font-bold text-white truncate block">
                  {tenant.name}
                </span>
              </div>
            </div>

            {provisionedTenants.length > 0 && (
              <select
                value={tenant.id}
                onChange={(e) => selectTenant(e.target.value)}
                aria-label="Switch factory instance"
                className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="tenant-apex-1">Apex Plant (Default)</option>
                {provisionedTenants.map((p) => (
                  <option key={p.tenant.id} value={p.tenant.id}>
                    {p.tenant.name} ({p.tenant.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Quick Role Selection Tiles */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Select Role
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Admin */}
              <button
                type="button"
                onClick={() => handleRoleQuickSelect('admin')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  selectedRole === 'admin'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-950'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-bold">Admin</span>
                <span className="text-[10px] text-slate-500 leading-tight">Factory Owner / HR</span>
              </button>

              {/* Guard */}
              <button
                type="button"
                onClick={() => handleRoleQuickSelect('guard')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  selectedRole === 'guard'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold">Guard</span>
                <span className="text-[10px] text-slate-500 leading-tight">Gate Kiosk (Locked)</span>
              </button>

              {/* Contractor */}
              <button
                type="button"
                onClick={() => handleRoleQuickSelect('contractor')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  selectedRole === 'contractor'
                    ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-md shadow-amber-950'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold">Contractor</span>
                <span className="text-[10px] text-slate-500 leading-tight">Staffing Agency</span>
              </button>
            </div>
          </div>

          {/* Error notice */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600 text-rose-200 text-xs text-center font-semibold animate-in shake duration-200">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            {/* If contractor, select agency */}
            {selectedRole === 'contractor' && (
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Contractor Agency</label>
                <select
                  value={contractorId}
                  onChange={(e) => setContractorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {contractors.length > 0 ? (
                    contractors.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))
                  ) : (
                    <option value="cnt-direct">Direct Workforce / General Agency</option>
                  )}
                </select>
              </div>
            )}

            {/* Email input */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Work Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Password / Access Key</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                  : selectedRole === 'guard'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
              }`}
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* SaaS Creator Action: Provision New Factory */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setIsProvisionModalOpen(true)}
              className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>SaaS Creator: Provision New Factory</span>
            </button>

            <span className="text-[11px] text-slate-500 font-mono">
              v2.0 Palghar Ready
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500">
          Factory Labor Tracker PWA • Production Ready • Tarapur/Palghar Local Deployment
        </div>
      </div>

      {/* Master Provisioning Modal */}
      <MasterProvisioningModal
        isOpen={isProvisionModalOpen}
        onClose={() => setIsProvisionModalOpen(false)}
        onSuccessLogin={() => onSuccess()}
      />
    </div>
  );
};
