import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  QrCode,
  Edit,
  Trash2,
  Search,
  Building2,
  Clock,
  ShieldCheck,
  Plus,
  Phone,
  Mail,
  UserCheck,
} from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';
import { useAuth } from '../../context/AuthContext';
import { Worker, Contractor } from '../../types';
import { formatCurrency } from '../../utils/wageEngine';
import { WorkerModal } from './WorkerModal';
import { WorkerBadgeModal } from './WorkerBadgeModal';
import { ContractorModal } from './ContractorModal';
import { ShiftConfigView } from './ShiftConfigView';

export const WorkerRegistryView: React.FC = () => {
  const {
    workers,
    contractors,
    shifts,
    deleteWorker,
    deleteContractor,
    getContractorById,
    getShiftById,
  } = useFactory();
  const { tenant } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'workers' | 'contractors' | 'shifts'>('workers');
  const [search, setSearch] = useState('');
  const [filterContractor, setFilterContractor] = useState('all');

  // Worker Modal state
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  // Contractor Modal state
  const [isContractorModalOpen, setIsContractorModalOpen] = useState(false);
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null);

  // Badge Modal state
  const [badgeWorker, setBadgeWorker] = useState<Worker | null>(null);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);

  const filteredWorkers = workers.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.workerCode.toLowerCase().includes(search.toLowerCase()) ||
      w.department.toLowerCase().includes(search.toLowerCase());

    const matchesContractor =
      filterContractor === 'all' || w.contractorId === filterContractor;

    return matchesSearch && matchesContractor;
  });

  const handleOpenBadge = (worker: Worker) => {
    setBadgeWorker(worker);
    setIsBadgeModalOpen(true);
  };

  const handleEditWorker = (worker: Worker) => {
    setEditingWorker(worker);
    setIsWorkerModalOpen(true);
  };

  const handleAddNewWorker = () => {
    setEditingWorker(null);
    setIsWorkerModalOpen(true);
  };

  const handleDeleteWorker = (worker: Worker) => {
    if (window.confirm(`Are you sure you want to remove worker ${worker.name} (${worker.workerCode})?`)) {
      deleteWorker(worker.id);
    }
  };

  const handleAddNewContractor = () => {
    setEditingContractor(null);
    setIsContractorModalOpen(true);
  };

  const handleEditContractor = (contractor: Contractor) => {
    setEditingContractor(contractor);
    setIsContractorModalOpen(true);
  };

  const handleDeleteContractor = (contractor: Contractor) => {
    const count = workers.filter((w) => w.contractorId === contractor.id).length;
    if (
      window.confirm(
        `Are you sure you want to delete agency "${contractor.name}"? ${
          count > 0 ? `Warning: ${count} worker(s) are assigned to this contractor.` : ''
        }`
      )
    ) {
      deleteContractor(contractor.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Subtab Toggle Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => setActiveSubTab('workers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'workers'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Workers List ({workers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('contractors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'contractors'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Contractors ({contractors.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('shifts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'shifts'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Shifts ({shifts.length})</span>
          </button>
        </div>

        {/* Dynamic Action Buttons based on active subtab */}
        <div>
          {activeSubTab === 'workers' && (
            <button
              onClick={handleAddNewWorker}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Worker</span>
            </button>
          )}

          {activeSubTab === 'contractors' && (
            <button
              onClick={handleAddNewContractor}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Contractor</span>
            </button>
          )}
        </div>
      </div>

      {/* View Content */}
      {activeSubTab === 'shifts' ? (
        <ShiftConfigView />
      ) : activeSubTab === 'contractors' ? (
        /* Contractor Agencies Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Contractor Agencies</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage labor agencies, contact persons, and assigned workers
              </p>
            </div>
            <button
              onClick={handleAddNewContractor}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-600/90 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-xs cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Contractor</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Contractor Agency</th>
                  <th className="py-3.5 px-4 text-center">Agency Code</th>
                  <th className="py-3.5 px-4">Designated Contact</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4 text-center">Workforce Assigned</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {contractors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 px-4 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 text-amber-400 mx-auto flex items-center justify-center mb-3">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-300 text-sm">No contractors added yet</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Click "Add Contractor" above to register labor contractors.
                      </p>
                    </td>
                  </tr>
                ) : (
                  contractors.map((contractor) => {
                    const assignedWorkersCount = workers.filter(
                      (w) => w.contractorId === contractor.id
                    ).length;

                    return (
                      <tr key={contractor.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
                              {contractor.code.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-100 text-sm">
                                {contractor.name}
                              </div>
                              <span className="font-mono text-[10px] text-slate-400">
                                ID: {contractor.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                            {contractor.code}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-200">
                            {contractor.contactPerson}
                          </span>
                        </td>

                        <td className="py-4 px-4 font-mono text-slate-300">
                          {contractor.phone || 'N/A'}
                        </td>

                        <td className="py-4 px-4 text-slate-400">
                          {contractor.email || 'N/A'}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <span className="font-mono font-bold px-2.5 py-1 rounded-full text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {assignedWorkersCount} worker{assignedWorkersCount === 1 ? '' : 's'}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEditContractor(contractor)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer transition-colors"
                              title="Edit contractor"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteContractor(contractor)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs cursor-pointer transition-colors"
                              title="Delete contractor"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Workers Table View */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          {/* Controls Bar */}
          <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Manage Workers</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage worker credentials, PIN codes, assigned contractor, and printable QR badges
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search workers..."
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={filterContractor}
                onChange={(e) => setFilterContractor(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">All Contractors ({contractors.length})</option>
                {contractors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Worker</th>
                  <th className="py-3.5 px-4 text-center">Kiosk PIN</th>
                  <th className="py-3.5 px-4">Contractor</th>
                  <th className="py-3.5 px-4">Assigned Shift</th>
                  <th className="py-3.5 px-4">Hourly Rate</th>
                  <th className="py-3.5 px-4 text-center">Advance (Hafta)</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Badge & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 px-4 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 mx-auto flex items-center justify-center mb-3">
                        <Users className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-slate-300 text-sm">No workers added yet</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Click "Add Worker" above to add personnel. You can assign them to a contractor, set hourly wages, and generate a printable security badge.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => {
                    const contractor = getContractorById(worker.contractorId);
                    const shift = getShiftById(worker.shiftId);

                    return (
                      <tr key={worker.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-xs shrink-0">
                              {worker.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-100 text-sm">
                                {worker.name}
                              </div>
                              <span className="font-mono text-indigo-400 font-bold text-[11px]">
                                {worker.workerCode}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                            {worker.pin}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-200">
                            {contractor ? contractor.name : 'Direct'}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {contractor?.contactPerson}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-medium text-slate-200">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: shift?.color || '#0284c7' }}
                            />
                            <span>{shift ? shift.name : 'Standard Shift'}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {shift?.startTime} - {shift?.endTime}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                          {formatCurrency(worker.baseHourlyRate)}/hr
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono">
                          {worker.cashAdvance && worker.cashAdvance > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              -{formatCurrency(worker.cashAdvance)}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">₹0</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-300">
                          {worker.department}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              worker.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {worker.status.toUpperCase()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenBadge(worker)}
                              className="p-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              title="View and print QR ID badge"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Badge</span>
                            </button>
                            <button
                              onClick={() => handleEditWorker(worker)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer transition-colors"
                              title="Edit worker"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteWorker(worker)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs cursor-pointer transition-colors"
                              title="Delete worker"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Worker Add/Edit Modal */}
      <WorkerModal
        isOpen={isWorkerModalOpen}
        onClose={() => setIsWorkerModalOpen(false)}
        workerToEdit={editingWorker}
      />

      {/* Contractor Add/Edit Modal */}
      <ContractorModal
        isOpen={isContractorModalOpen}
        onClose={() => setIsContractorModalOpen(false)}
        contractorToEdit={editingContractor}
      />

      {/* Worker Badge Preview Modal */}
      {badgeWorker && (
        <WorkerBadgeModal
          isOpen={isBadgeModalOpen}
          onClose={() => setIsBadgeModalOpen(false)}
          worker={badgeWorker}
          contractor={getContractorById(badgeWorker.contractorId) || null}
          shift={getShiftById(badgeWorker.shiftId) || null}
          factoryName={tenant.name}
        />
      )}
    </div>
  );
};
