import React, { useState } from 'react';
import { ShiftCalculatorSimulator } from './ShiftCalculatorSimulator';
import { useFactory } from '../../context/FactoryContext';
import { formatCurrency } from '../../utils/wageEngine';
import { Clock, Search, Filter, Calendar, CheckCircle2, Moon, Sun } from 'lucide-react';

export const WageEngineView: React.FC = () => {
  const { shiftRecords, getWorkerById, getShiftById, shifts } = useFactory();
  const [search, setSearch] = useState('');
  const [filterShift, setFilterShift] = useState('all');

  const filteredRecords = shiftRecords.filter((rec) => {
    const worker = getWorkerById(rec.workerId);
    const matchesSearch =
      !search ||
      (worker && worker.name.toLowerCase().includes(search.toLowerCase())) ||
      (worker && worker.workerCode.toLowerCase().includes(search.toLowerCase()));

    const matchesShift = filterShift === 'all' || rec.shiftId === filterShift;

    return matchesSearch && matchesShift;
  });

  return (
    <div className="space-y-6">
      {/* Interactive Simulator */}
      <ShiftCalculatorSimulator />

      {/* Completed Shifts Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-100 tracking-tight">
              Shift Salary Logs
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily shift work hours and calculated wages
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search worker..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">All Shifts</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Worker</th>
                <th className="py-3.5 px-4">Shift</th>
                <th className="py-3.5 px-4">Punch In / Out</th>
                <th className="py-3.5 px-4 text-center">Regular Hrs</th>
                <th className="py-3.5 px-4 text-center">OT Hrs (1.5x)</th>
                <th className="py-3.5 px-4 text-right">Regular Pay</th>
                <th className="py-3.5 px-4 text-right">Overtime Pay</th>
                <th className="py-3.5 px-4 text-right">Total Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center mb-3">
                      <Clock className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-slate-300 text-sm">No shift salary logs found</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Completed worker shift punches recorded at the Guard Kiosk will automatically calculate and appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.slice(0, 15).map((rec) => {
                const worker = getWorkerById(rec.workerId);
                const shift = getShiftById(rec.shiftId);

                const inTime = new Date(rec.clockIn).toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                });
                const outTime = rec.clockOut
                  ? new Date(rec.clockOut).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })
                  : 'N/A';

                return (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {rec.date}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-100">
                        {worker ? worker.name : 'Unknown Worker'}
                      </div>
                      <span className="font-mono text-[10px] text-indigo-400">
                        {worker ? worker.workerCode : rec.workerId}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-200">
                        {shift?.crossesMidnight ? (
                          <Moon className="w-3.5 h-3.5 text-purple-400" />
                        ) : (
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>{shift ? shift.name : 'Standard Shift'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {inTime} → {outTime}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-blue-400">
                      {rec.regularHours}h
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-amber-400">
                      {rec.overtimeHours > 0 ? `+${rec.overtimeHours}h` : '0h'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      {formatCurrency(rec.regularWage)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-amber-400">
                      {formatCurrency(rec.overtimeWage)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(rec.netWage)}
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

