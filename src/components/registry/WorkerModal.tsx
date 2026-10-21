import React, { useState, useEffect } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import { Worker } from '../../types';
import { useFactory } from '../../context/FactoryContext';

interface WorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workerToEdit?: Worker | null;
}

export const WorkerModal: React.FC<WorkerModalProps> = ({
  isOpen,
  onClose,
  workerToEdit,
}) => {
  const { contractors, shifts, addWorker, updateWorker, workers } = useFactory();

  const [name, setName] = useState('');
  const [workerCode, setWorkerCode] = useState('');
  const [pin, setPin] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [shiftId, setShiftId] = useState('');
  const [baseHourlyRate, setBaseHourlyRate] = useState(0);
  const [cashAdvance, setCashAdvance] = useState(0);
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('CNC Machining');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  useEffect(() => {
    if (workerToEdit) {
      setName(workerToEdit.name);
      setWorkerCode(workerToEdit.workerCode);
      setPin(workerToEdit.pin);
      setContractorId(workerToEdit.contractorId);
      setShiftId(workerToEdit.shiftId);
      setBaseHourlyRate(workerToEdit.baseHourlyRate);
      setCashAdvance(workerToEdit.cashAdvance || 0);
      setPhone(workerToEdit.phone);
      setDepartment(workerToEdit.department);
      setStatus(workerToEdit.status);
    } else {
      // Auto-suggest next worker code e.g. WRK-101
      const nextNum = 100 + workers.length + 1;
      setWorkerCode(`WRK-${nextNum}`);
      setPin(Math.floor(1000 + Math.random() * 9000).toString());
      setName('');
      setContractorId(contractors[0]?.id || '');
      setShiftId(shifts[0]?.id || '');
      setBaseHourlyRate(0);
      setCashAdvance(0);
      setPhone('');
      setDepartment('CNC Machining');
      setStatus('active');
    }
  }, [workerToEdit, isOpen, contractors, shifts, workers.length]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !workerCode.trim() || !pin.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    if (pin.length !== 4 || isNaN(Number(pin))) {
      alert('PIN must be exactly 4 numeric digits.');
      return;
    }

    const finalContractorId = contractorId || (contractors[0]?.id ?? 'cnt-direct');
    const finalShiftId = shiftId || (shifts[0]?.id ?? 'shf-default');

    if (workerToEdit) {
      updateWorker(workerToEdit.id, {
        name: name.trim(),
        workerCode: workerCode.trim().toUpperCase(),
        pin: pin.trim(),
        contractorId: finalContractorId,
        shiftId: finalShiftId,
        baseHourlyRate,
        cashAdvance,
        phone,
        department,
        status,
      });
    } else {
      addWorker({
        name: name.trim(),
        workerCode: workerCode.trim().toUpperCase(),
        pin: pin.trim(),
        contractorId: finalContractorId,
        shiftId: finalShiftId,
        baseHourlyRate,
        cashAdvance,
        phone,
        department,
        status,
        joinedDate: new Date().toISOString().split('T')[0],
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                {workerToEdit ? 'Edit Worker Profile' : 'Enroll New Factory Worker'}
              </h3>
              <p className="text-xs text-slate-400">Worker ID, Kiosk PIN & contractor assignment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            {/* Full Name */}
            <div className="col-span-2 space-y-1">
              <label className="font-semibold text-slate-300">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anand Shinde"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Worker Code */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Worker Code (Badge ID) *</label>
              <input
                type="text"
                required
                value={workerCode}
                onChange={(e) => setWorkerCode(e.target.value)}
                placeholder="e.g. WRK-114"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-mono text-slate-100 uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* 4-Digit PIN */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">4-Digit Kiosk PIN *</label>
              <input
                type="text"
                maxLength={4}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="e.g. 1014"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Contractor */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Contractor Agency *</label>
              <select
                value={contractorId}
                onChange={(e) => setContractorId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {contractors.length > 0 ? (
                  contractors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))
                ) : (
                  <option value="">Direct Plant Workforce (Internal)</option>
                )}
              </select>
            </div>

            {/* Assigned Shift */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Assigned Shift *</label>
              <select
                value={shiftId}
                onChange={(e) => setShiftId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {shifts.length > 0 ? (
                  shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime}-{s.endTime})
                    </option>
                  ))
                ) : (
                  <option value="">-- No Shifts Configured --</option>
                )}
              </select>
            </div>

            {/* Base Hourly Rate */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Base Hourly Rate (₹) *</label>
              <input
                type="number"
                min={0}
                max={5000}
                required
                value={baseHourlyRate === 0 ? '' : baseHourlyRate}
                placeholder="0"
                onChange={(e) => setBaseHourlyRate(e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Advance Payment / Hafta */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">Weekly Cash Advance / Hafta (₹)</label>
                <span className="text-[10px] text-amber-400 font-medium">Auto-deducted</span>
              </div>
              <input
                type="number"
                min={0}
                max={50000}
                value={cashAdvance === 0 ? '' : cashAdvance}
                placeholder="0"
                onChange={(e) => setCashAdvance(e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 font-mono text-amber-300 focus:outline-none focus:border-amber-500"
              />
              <span className="text-[10px] text-slate-500 block">
                Mid-week cash advance, subtracted from final weekly payment report
              </span>
            </div>

            {/* Department */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Department / Trade</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="CNC Machining">CNC Machining</option>
                <option value="Assembly Line">Assembly Line</option>
                <option value="Welding & Fabrication">Welding & Fabrication</option>
                <option value="Quality Inspection">Quality Inspection</option>
                <option value="Furnace & Melting">Furnace & Melting</option>
                <option value="Heavy Press Operations">Heavy Press Operations</option>
                <option value="Packaging & Dispatch">Packaging & Dispatch</option>
              </select>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Contact Phone</label>
              <input
                type="text"
                value={phone}
                placeholder="Enter contact phone..."
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="active">Active (Permitted on Floor)</option>
                <option value="inactive">Inactive (Suspended/Departed)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer transition-all shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>{workerToEdit ? 'Save Changes' : 'Enroll Worker'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

