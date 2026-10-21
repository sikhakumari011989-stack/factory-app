import React from 'react';
import { KpiCards } from './KpiCards';
import { LiveFloorTable } from './LiveFloorTable';
import { MorningAbsenteeismCard } from './MorningAbsenteeismCard';
import { useAuth } from '../../context/AuthContext';
import { useFactory } from '../../context/FactoryContext';
import { Building2, Sparkles, Shield, UserCheck, Clock, Database } from 'lucide-react';
import { isFirebaseConfigured } from '../../lib/firebase';

interface AdminDashboardProps {
  onNavigateToKiosk: () => void;
  onOpenSettings?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToKiosk, onOpenSettings }) => {
  const { role, tenant, user } = useAuth();
  const { shifts, activeFloorWorkers } = useFactory();

  const isContractor = role === 'contractor';
  const initialContractorFilter = isContractor && user?.contractorId ? user.contractorId : 'all';

  return (
    <div className="space-y-6">
      {/* Dashboard Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              {isContractor ? 'Contractor Portal' : 'Live Factory Floor'}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              {role.toUpperCase()}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span>{tenant.name}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500">{tenant.location}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {role !== 'contractor' && (
            <>
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow-md cursor-pointer"
                  title="Configure Firebase Cloud Firestore"
                >
                  <Database className="w-4 h-4 text-amber-400" />
                  <span>Database Settings</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isFirebaseConfigured() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                </button>
              )}

              <button
                onClick={onNavigateToKiosk}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Open Guard Kiosk</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Morning Absenteeism Alert */}
      <MorningAbsenteeismCard />

      {/* KPI Cards */}
      <KpiCards />

      {/* Live Floor Headcount Table */}
      <LiveFloorTable initialContractorFilter={initialContractorFilter} />
    </div>
  );
};

