import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Clock,
  LogOut,
  ShieldCheck,
  Zap,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';
import { ActiveFloorWorker } from '../../types';
import { formatElapsedSeconds } from '../../utils/wageEngine';

interface LiveFloorTableProps {
  initialContractorFilter?: string;
}

export const LiveFloorTable: React.FC<LiveFloorTableProps> = ({ initialContractorFilter = 'all' }) => {
  const { activeFloorWorkers, contractors, shifts, forceClockOut, runAutoCheckoutSafetyCheck } = useFactory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContractor, setSelectedContractor] = useState(initialContractorFilter);
  const [selectedShift, setSelectedShift] = useState('all');
  const [autoCheckoutNotice, setAutoCheckoutNotice] = useState<string | null>(null);

  // Real-time ticking timestamp for high-precision live elapsed timers
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRunAutoCheckout = () => {
    const closed = runAutoCheckoutSafetyCheck();
    if (closed > 0) {
      setAutoCheckoutNotice(`Successfully auto-closed ${closed} overdue open shift${closed === 1 ? '' : 's'} (>14h safety limit).`);
    } else {
      setAutoCheckoutNotice('All active shifts are within standard safety limits (under 14 hours).');
    }
    setTimeout(() => setAutoCheckoutNotice(null), 4000);
  };

  const filteredWorkers = activeFloorWorkers.filter((item) => {
    const matchesSearch =
      item.worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.worker.workerCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.worker.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesContractor =
      selectedContractor === 'all' || item.contractor.id === selectedContractor;

    const matchesShift =
      selectedShift === 'all' || item.shift.id === selectedShift;

    return matchesSearch && matchesContractor && matchesShift;
  });

  const handleForceOut = (worker: ActiveFloorWorker) => {
    if (
      window.confirm(
        `Are you sure you want to force clock-out ${worker.worker.name} (${worker.worker.workerCode})? Their elapsed shift hours will be logged and finalized.`
      )
    ) {
      forceClockOut(worker.worker.id);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Table Header & Controls */}
      <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <h3 className="text-xl font-black text-white tracking-tight">
              Live Factory Floor
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
              {filteredWorkers.length} Workers on Floor
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            Workers currently clocked in, shift timers, and overtime hours
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search worker or ID badge..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
            />
          </div>

          {/* Contractor Filter */}
          <div className="relative">
            <select
              value={selectedContractor}
              onChange={(e) => setSelectedContractor(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer transition-colors shadow-inner"
            >
              <option value="all">All Contractors ({contractors.length})</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Shift Filter */}
          <div className="relative">
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer transition-colors shadow-inner"
            >
              <option value="all">All Shifts ({shifts.length})</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Auto-Checkout Safety Rule Action */}
          <button
            type="button"
            onClick={handleRunAutoCheckout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Auto-Checkout any worker with over 14 hours elapsed to prevent broken overtime math"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Safety Auto-Checkout</span>
          </button>
        </div>
      </div>

      {/* Auto-Checkout Banner Notice */}
      {autoCheckoutNotice && (
        <div className="mx-6 my-2 p-3 rounded-2xl bg-slate-950 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in duration-200 shadow-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{autoCheckoutNotice}</span>
          </div>
          <button
            onClick={() => setAutoCheckoutNotice(null)}
            className="text-slate-400 hover:text-white text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-xs text-slate-300">
          <thead className="bg-slate-950/90 text-slate-400 uppercase font-bold text-[11px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-4 px-5">Worker & ID</th>
              <th className="py-4 px-5">Contractor</th>
              <th className="py-4 px-5">Assigned Shift</th>
              <th className="py-4 px-5">Clocked In At</th>
              <th className="py-4 px-5">Time on Floor</th>
              <th className="py-4 px-5">Floor Status</th>
              <th className="py-4 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredWorkers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-14 text-center text-slate-500">
                  <Users className="w-12 h-12 mx-auto text-slate-700 mb-2.5 stroke-1" />
                  <p className="font-bold text-slate-300 text-sm">No workers currently on the factory floor</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Clock in workers from the Guard Kiosk or adjust filters above.
                  </p>
                </td>
              </tr>
            ) : (
              filteredWorkers.map((item) => {
                const clockInMs = new Date(item.clockInTime).getTime();
                const elapsedSeconds = Math.max(0, Math.floor((nowMs - clockInMs) / 1000));
                const formattedTimer = formatElapsedSeconds(elapsedSeconds);
                const isOt = elapsedSeconds > item.shift.standardHours * 3600;

                const clockInFormatted = new Date(item.clockInTime).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                });

                return (
                  <tr key={item.worker.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Worker */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white font-black text-xs shadow-md shrink-0">
                          {item.worker.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{item.worker.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="font-mono text-emerald-400 font-bold bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                              {item.worker.workerCode}
                            </span>
                            <span>•</span>
                            <span>{item.worker.department}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contractor */}
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-200 text-sm">{item.contractor.name}</div>
                      <span className="text-[11px] font-mono text-slate-500">Agency Code: {item.contractor.code}</span>
                    </td>

                    {/* Shift */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2 font-semibold text-slate-200">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: item.shift.color }}
                        />
                        <span>{item.shift.name}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono mt-0.5 block">
                        {item.shift.startTime} - {item.shift.endTime} {item.shift.crossesMidnight ? '(Overnight)' : ''}
                      </span>
                    </td>

                    {/* Clock In */}
                    <td className="py-4 px-5">
                      <div className="font-mono font-bold text-slate-200 text-sm">{clockInFormatted}</div>
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Gate #2 Terminal</span>
                    </td>

                    {/* Live Elapsed Duration */}
                    <td className="py-4 px-5">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-bold text-sm border shadow-sm ${
                          isOt
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        }`}
                      >
                        <Clock className={`w-4 h-4 ${isOt ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
                        <span>{formattedTimer}</span>
                      </div>
                    </td>

                    {/* Floor Status */}
                    <td className="py-4 px-5">
                      {isOt ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs">
                          <Zap className="w-3.5 h-3.5 text-amber-400" />
                          <span>Overtime (1.5x)</span>
                        </span>
                      ) : item.isWithinGrace ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>On Time</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs">
                          <span>Regular Shift</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleForceOut(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/80 hover:text-rose-200 hover:border-rose-600 border border-slate-700 text-xs font-bold text-slate-300 transition-all cursor-pointer shadow-sm active:scale-95"
                        title="Force Clock Out worker"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Clock Out</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

