import React from 'react';
import {
  ShieldAlert,
  Lock,
  Calendar,
  Phone,
  Mail,
  MessageSquare,
  Building2,
  KeyRound,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  LogOut,
} from 'lucide-react';
import { Tenant } from '../../types';

interface SubscriptionLockedScreenProps {
  tenant: Tenant;
  blockReason: 'expired' | 'canceled' | 'suspended' | 'locked';
  message: string;
  onOpenMasterCreator: () => void;
  onSwitchFactory?: () => void;
  onSignOut?: () => void;
}

export const SubscriptionLockedScreen: React.FC<SubscriptionLockedScreenProps> = ({
  tenant,
  blockReason,
  message,
  onOpenMasterCreator,
  onSwitchFactory,
  onSignOut,
}) => {
  const getHeaderInfo = () => {
    switch (blockReason) {
      case 'expired':
        return {
          title: 'Subscription Expired',
          badge: 'LICENSE EXPIRED',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          desc: 'The commercial subscription period for this factory instance has elapsed. Access to all operational modules is locked.',
        };
      case 'canceled':
        return {
          title: 'Subscription Canceled',
          badge: 'ACCESS CANCELED',
          badgeColor: 'bg-rose-600/20 text-rose-300 border-rose-600/50',
          desc: 'The software license for this factory has been canceled by the SaaS Super-Administrator.',
        };
      case 'suspended':
        return {
          title: 'Account Suspended',
          badge: 'TEMPORARILY SUSPENDED',
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          desc: 'Access to this industrial instance has been temporarily paused by the SaaS Super-Administrator.',
        };
      default:
        return {
          title: 'Factory Access Frozen',
          badge: 'MANUALLY LOCKED',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          desc: 'This factory instance has been manually locked in real-time by the SaaS Super-Administrator.',
        };
    }
  };

  const headerInfo = getHeaderInfo();

  const supportPhone = '+91 98200 14120';
  const supportEmail = 'support@factorysync.io';
  const whatsappUrl = `https://wa.me/919820014120?text=${encodeURIComponent(
    `Hello, I am contacting you regarding license renewal / unlocking for factory: ${tenant.name} (${tenant.code}).`
  )}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Main Alert Card */}
        <div className="bg-slate-900/95 backdrop-blur-xl border border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Top Lock Icon & Badge */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-18 h-18 rounded-3xl bg-rose-500/15 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-950">
              <Lock className="w-9 h-9 stroke-[2.2] animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <span
                className={`inline-block px-3 py-1 rounded-full text-[10px] font-mono font-black tracking-wider uppercase border ${headerInfo.badgeColor}`}
              >
                {headerInfo.badge}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {headerInfo.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                {headerInfo.desc}
              </p>
            </div>
          </div>

          {/* Plant Details Partition Card */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Affected Plant Details
              </span>
              <span className="text-rose-400 font-mono font-bold">REAL-TIME LOCK APPLIED</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Factory Name:</span>
              <span className="font-bold text-white text-right">{tenant.name}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Plant Code:</span>
              <span className="font-mono text-indigo-400 font-bold">{tenant.code}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Industrial Area:</span>
              <span className="text-slate-300 text-right">{tenant.location || 'MIDC Tarapur/Palghar'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Expiry Date:</span>
              <span className="font-mono text-rose-400 font-bold">
                {tenant.subscriptionExpiryDate || 'Expired'}
              </span>
            </div>

            {message && (
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-rose-300/90 italic">
                Note: {message}
              </div>
            )}
          </div>

          {/* Modules Blocked Warning */}
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-200 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">All Operational Modules Frozen</span>
              <p className="text-[11px] text-rose-300/80">
                Live Factory Floor, Salary Calculator, Payment Reports, and Guard Kiosk have been restricted to protect data integrity.
              </p>
            </div>
          </div>

          {/* Direct Support & License Renewal Card */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="text-center space-y-1">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Contact SaaS Administrator to Reinstate Access
              </h3>
              <p className="text-[11px] text-slate-500">
                Reach out directly for immediate license extension or account reactivation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <a
                href={`tel:${supportPhone}`}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>Call {supportPhone}</span>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            <div className="text-center">
              <a
                href={`mailto:${supportEmail}?subject=License%20Reactivation%20-%20${encodeURIComponent(tenant.name)}`}
                className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email: {supportEmail}</span>
              </a>
            </div>
          </div>

          {/* Super-Admin Unlock Action */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={onOpenMasterCreator}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              title="Super-Admin Login (Secured by ASK&1412)"
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Super-Admin: Unlock via Master Portal</span>
            </button>

            <div className="flex items-center gap-3">
              {onSwitchFactory && (
                <button
                  type="button"
                  onClick={onSwitchFactory}
                  className="text-slate-400 hover:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Switch Plant
                </button>
              )}

              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="text-slate-400 hover:text-rose-300 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-500">
          FactorySync Enterprise Multi-Tenant Engine • Palghar/Tarapur Industrial Deployment
        </div>
      </div>
    </div>
  );
};

