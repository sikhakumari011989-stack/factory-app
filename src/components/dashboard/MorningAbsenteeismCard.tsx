import React, { useState } from 'react';
import { UserX, Phone, Building2, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';

export const MorningAbsenteeismCard: React.FC = () => {
  const { workers, activeFloorWorkers, timePunches, getContractorById } = useFactory();
  const [isExpanded, setIsExpanded] = useState(false);

  // Today's date YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  // Active registered workers
  const activeWorkers = workers.filter((w) => w.status === 'active');

  // Workers who have clocked in today (either currently active or have a punch 'in' today)
  const clockedInWorkerIds = new Set([
    ...activeFloorWorkers.map((a) => a.worker.id),
    ...timePunches
      .filter((p) => p.punchType === 'in' && p.timestamp.startsWith(today))
      .map((p) => p.workerId),
  ]);

  // Absent workers = active registered workers who haven't clocked in today
  const absentWorkers = activeWorkers.filter((w) => !clockedInWorkerIds.has(w.id));

  // If no workers registered yet, don't show the alert
  if (activeWorkers.length === 0) {
    return null;
  }

  const isAllPresent = absentWorkers.length === 0;

  return (
    <div className={`rounded-3xl border transition-all duration-200 overflow-hidden shadow-xl ${
      isAllPresent
        ? 'bg-slate-900/80 border-slate-800'
        : 'bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-900/90 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.08)]'
    }`}>
      {/* Top Bar */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
            isAllPresent
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
          }`}>
            {isAllPresent ? <CheckCircle2 className="w-6 h-6 stroke-[2.2]" /> : <UserX className="w-6 h-6 stroke-[2.2]" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">
                Morning Attendance Check
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                isAllPresent
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {isAllPresent ? '100% Present' : `${absentWorkers.length} Absent`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAllPresent
                ? `All ${activeWorkers.length} enrolled workers have punched in for their shift today.`
                : `${absentWorkers.length} of ${activeWorkers.length} enrolled personnel haven't punched in at the gate kiosk yet.`}
            </p>
          </div>
        </div>

        {!isAllPresent && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
          >
            <span>{isExpanded ? 'Hide Absent List' : `View ${absentWorkers.length} Absent Personnel`}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Expandable Absenteeism Roster */}
      {isExpanded && !isAllPresent && (
        <div className="border-t border-slate-800 bg-slate-950/60 p-4 sm:p-5 space-y-2.5 animate-in slide-in-from-top-2 duration-200">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Workers Not Yet Clocked In (Today):
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {absentWorkers.map((worker) => {
              const contractor = getContractorById(worker.contractorId);

              return (
                <div
                  key={worker.id}
                  className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs truncate">
                        {worker.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-slate-800 text-amber-300 border border-slate-700">
                        {worker.workerCode}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {worker.department} • {contractor.name}
                    </div>
                  </div>

                  {/* Quick Call Action */}
                  {worker.phone ? (
                    <a
                      href={`tel:${worker.phone}`}
                      className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors shrink-0"
                      title={`Call ${worker.name} (${worker.phone})`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  ) : contractor.phone ? (
                    <a
                      href={`tel:${contractor.phone}`}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 transition-colors shrink-0"
                      title={`Call Contractor Agency (${contractor.phone})`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

