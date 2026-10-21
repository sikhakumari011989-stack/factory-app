import React, { useState } from 'react';
import { Clock, Plus, Edit, Trash2, Moon, Sun, ShieldCheck, AlertCircle } from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';
import { Shift } from '../../types';

export const ShiftConfigView: React.FC = () => {
  const { shifts, addShift, updateShift, deleteShift } = useFactory();
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('00:00');
  const [crossesMidnight, setCrossesMidnight] = useState(false);
  const [gracePeriodMinutes, setGracePeriodMinutes] = useState(0);
  const [standardHours, setStandardHours] = useState(8);
  const [overtimeMultiplier, setOvertimeMultiplier] = useState(1.5);
  const [color, setColor] = useState('#0284c7');
  const [showAddForm, setShowAddForm] = useState(false);

  const startEdit = (shift: Shift) => {
    setEditingShiftId(shift.id);
    setName(shift.name);
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setCrossesMidnight(shift.crossesMidnight);
    setGracePeriodMinutes(shift.gracePeriodMinutes);
    setStandardHours(shift.standardHours);
    setOvertimeMultiplier(shift.overtimeMultiplier);
    setColor(shift.color);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setEditingShiftId(null);
    setName('');
    setStartTime('00:00');
    setEndTime('00:00');
    setCrossesMidnight(false);
    setGracePeriodMinutes(0);
    setStandardHours(8);
    setOvertimeMultiplier(1.5);
    setColor('#0284c7');
    setShowAddForm(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Shift name is required.');
      return;
    }

    const isNight = crossesMidnight || endTime < startTime;

    if (editingShiftId) {
      updateShift(editingShiftId, {
        name,
        startTime,
        endTime,
        crossesMidnight: isNight,
        gracePeriodMinutes,
        standardHours,
        overtimeMultiplier,
        color,
      });
    } else {
      addShift({
        name,
        code: `SHF-${shifts.length + 1}`,
        startTime,
        endTime,
        crossesMidnight: isNight,
        gracePeriodMinutes,
        standardHours,
        overtimeMultiplier,
        description: `${standardHours}h standard shift with ${gracePeriodMinutes}m grace`,
        color,
      });
    }

    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-100">Shift Configuration Panel</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Set up operating shift schedules, midnight crossovers, grace windows, and overtime multipliers
          </p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Shift</span>
          </button>
        )}
      </div>

      {/* Add / Edit Form Drawer */}
      {showAddForm && (
        <form
          onSubmit={handleSave}
          className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-4 shadow-xl text-xs animate-in fade-in"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="font-bold text-sm text-slate-100">
              {editingShiftId ? 'Edit Shift Settings' : 'Create New Shift'}
            </span>
            <button
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1 col-span-2">
              <label className="font-semibold text-slate-300">Shift Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Charlie Night Shift"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Start Time (HH:mm) *</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">End Time (HH:mm) *</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Grace Period (Minutes)</label>
              <input
                type="number"
                min={0}
                max={60}
                value={gracePeriodMinutes}
                onChange={(e) => setGracePeriodMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Standard Shift (Hours)</label>
              <input
                type="number"
                min={1}
                max={24}
                value={standardHours}
                onChange={(e) => setStandardHours(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300">OT Multiplier</label>
              <input
                type="number"
                step={0.1}
                min={1.0}
                max={3.0}
                value={overtimeMultiplier}
                onChange={(e) => setOvertimeMultiplier(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1 flex flex-col justify-center">
              <label className="font-semibold text-slate-300">Overnight Flag</label>
              <label className="flex items-center gap-2 mt-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={crossesMidnight || endTime < startTime}
                  onChange={(e) => setCrossesMidnight(e.target.checked)}
                  className="rounded accent-indigo-500"
                />
                <span>Crosses Midnight (Next Day)</span>
              </label>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
            >
              Save Shift
            </button>
          </div>
        </form>
      )}

      {/* Shifts Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shifts.length === 0 ? (
          <div className="col-span-full p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-purple-400 mx-auto flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-200 text-sm">No shifts configured yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click "Add Shift" above to configure your factory shift hours, midnight crossover logic, and grace tolerance.
            </p>
          </div>
        ) : (
          shifts.map((shift) => (
            <div
              key={shift.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: shift.color }}
                    />
                    <h4 className="font-bold text-slate-100 text-sm">{shift.name}</h4>
                  </div>
                  {shift.crossesMidnight ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      <Moon className="w-3 h-3" />
                      <span>Overnight</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <Sun className="w-3 h-3" />
                      <span>Day Shift</span>
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs text-slate-300 py-2 border-y border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Timings:</span>
                    <span className="font-mono font-bold text-slate-100">
                      {shift.startTime} → {shift.endTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Grace Tolerance:</span>
                    <span className="font-semibold text-emerald-400">
                      {shift.gracePeriodMinutes} mins tolerance
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Standard Duration:</span>
                    <span className="font-mono text-slate-200">{shift.standardHours} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Overtime Rate:</span>
                    <span className="font-semibold text-amber-400">
                      {shift.overtimeMultiplier}x Base Pay
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 flex items-center justify-end gap-2">
                <button
                  onClick={() => startEdit(shift)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete shift "${shift.name}"?`)) {
                      deleteShift(shift.id);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  title="Delete shift"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

