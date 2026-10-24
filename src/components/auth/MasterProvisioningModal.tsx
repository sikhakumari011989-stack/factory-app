import React, { useState } from 'react';
import {
  Factory,
  ShieldAlert,
  Building2,
  Mail,
  Lock,
  User,
  MapPin,
  CheckCircle2,
  Copy,
  Sparkles,
  X,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ProvisionedTenant, SubscriptionStatus } from '../../types';

interface MasterProvisioningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: () => void;
}

const getDefault30DaysExpiry = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
};

export const MasterProvisioningModal: React.FC<MasterProvisioningModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
}) => {
  const { registerProvisionedFactory } = useAuth();

  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [location, setLocation] = useState('MIDC Tarapur Industrial Estate, Boisar, Palghar');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('Tarapur@2026');
  const [subscriptionExpiryDate, setSubscriptionExpiryDate] = useState<string>(getDefault30DaysExpiry());
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [provisionedResult, setProvisionedResult] = useState<ProvisionedTenant | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCompanyName(val);
    if (!companyCode || companyCode.startsWith('FAC-')) {
      const acronym = val
        .split(' ')
        .filter(Boolean)
        .map((w) => w[0]?.toUpperCase())
        .join('')
        .slice(0, 4);
      if (acronym) setCompanyCode(acronym);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !ownerEmail.trim() || !ownerName.trim()) {
      alert('Please fill out Company Name, Owner Name, and Owner Email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerProvisionedFactory({
        name: companyName.trim(),
        code: companyCode.trim() || 'PLANT-01',
        location: location.trim(),
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim().toLowerCase(),
        password: password.trim() || 'Factory@123',
        subscriptionStatus,
        subscriptionExpiryDate,
        isLocked: false,
        currency: '₹',
      });
      setProvisionedResult(result);
    } catch (err) {
      console.error('Provisioning failed:', err);
      alert('Failed to provision factory. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!provisionedResult) return;
    const text = `FactorySync Credentials:\nCompany: ${provisionedResult.tenant.name}\nCode: ${provisionedResult.tenant.code}\nOwner: ${provisionedResult.ownerName}\nEmail: ${provisionedResult.ownerEmail}\nPassword: ${provisionedResult.temporaryPassword}\nSubscription Expiry: ${provisionedResult.tenant.subscriptionExpiryDate || subscriptionExpiryDate}\nLogin URL: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnterInstance = () => {
    onClose();
    if (onSuccessLogin) onSuccessLogin();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Master SaaS Factory Provisioning
              </h3>
              <p className="text-xs text-slate-400">
                Instantly provision a multi-tenant factory instance in Firebase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {provisionedResult ? (
          /* Success Screen */
          <div className="p-6 sm:p-8 space-y-5 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950">
              <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl font-black text-white">Factory Provisioned Successfully!</h4>
              <p className="text-xs text-slate-400">
                Created multi-tenant factory workspace and owner administrator account.
              </p>
            </div>

            {/* Credentials Card */}
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 text-left space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800 text-slate-400">
                <span className="font-sans font-bold text-slate-200">Access Credentials</span>
                <span className="text-[10px] text-emerald-400">ACTIVE IN FIREBASE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Company:</span>
                <span className="text-white font-bold">{provisionedResult.tenant.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Code / ID:</span>
                <span className="text-indigo-400 font-bold">{provisionedResult.tenant.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Owner Name:</span>
                <span className="text-slate-200">{provisionedResult.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Login Email:</span>
                <span className="text-emerald-400 font-bold">{provisionedResult.ownerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Password:</span>
                <span className="text-amber-400 font-bold">{provisionedResult.temporaryPassword}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800/80">
                <span className="text-slate-500">Subscription Expiry:</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {provisionedResult.tenant.subscriptionExpiryDate || subscriptionExpiryDate}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Copy className="w-4 h-4 text-slate-400" />
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>

              <button
                type="button"
                onClick={handleEnterInstance}
                className="flex-1 py-3 px-4 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950 transition-all"
              >
                <span>Enter Factory as Owner</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Factory / Company Name *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={handleNameChange}
                    placeholder="e.g. Tarapur Precision Castings"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Factory Code *</label>
                <input
                  type="text"
                  required
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TPC-01"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Industrial Area / Location</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. MIDC Tarapur, Boisar, Palghar"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Factory Owner / Administrator Credentials
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Owner Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g. Ramesh Patel"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Owner Work Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="e.g. ramesh@tarapurprecision.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 flex items-center justify-between">
                    <span>Subscription Expiry Date *</span>
                    <span className="text-[10px] text-amber-400 font-mono">Manual Control</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      value={subscriptionExpiryDate}
                      onChange={(e) => setSubscriptionExpiryDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Defaults to 30 days. Locks factory when date passes.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Initial Subscription Status</label>
                  <select
                    value={subscriptionStatus}
                    onChange={(e) => setSubscriptionStatus(e.target.value as SubscriptionStatus)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500 text-xs cursor-pointer font-semibold"
                  >
                    <option value="active">Active (Full Commercial License)</option>
                    <option value="trial">Trial (Evaluation Access)</option>
                    <option value="suspended">Suspended (Temporarily Frozen)</option>
                    <option value="canceled">Canceled (Completely Blocked)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 mt-3">
                <label className="font-semibold text-slate-300">Temporary Initial Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="e.g. Tarapur@2026"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  The factory owner can change this password upon their first login.
                </span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-950 disabled:opacity-50 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isSubmitting ? 'Provisioning Factory...' : '🚀 Provision Factory Now'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

