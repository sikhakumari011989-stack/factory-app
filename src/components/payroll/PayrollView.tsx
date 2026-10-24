import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Filter,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/wageEngine';
import { exportPayrollToExcel, exportPayrollToCsv } from '../../utils/excelExport';

export const PayrollView: React.FC = () => {
  const { payrollSummary, contractors, togglePaymentStatus, markAllAsPaid } = useFactory();
  const { role, user, tenant } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedContractor, setSelectedContractor] = useState(
    role === 'contractor' && user?.contractorId ? user.contractorId : 'all'
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'csv'>('excel');

  // Filter items
  const filteredItems = payrollSummary.filter((item) => {
    const matchesSearch =
      item.workerName.toLowerCase().includes(search.toLowerCase()) ||
      item.workerCode.toLowerCase().includes(search.toLowerCase()) ||
      item.department.toLowerCase().includes(search.toLowerCase());

    const matchesContractor =
      selectedContractor === 'all' || item.contractorId === selectedContractor;

    return matchesSearch && matchesContractor;
  });

  // Group by contractor with safe fallback for direct/unmatched workers
  const groupedByContractor = useMemo(() => {
    const groups: {
      contractor: { id: string; name: string; code: string; contactPerson: string; phone: string };
      items: typeof filteredItems;
      totalNet: number;
      totalRegular: number;
      totalOt: number;
      paidCount: number;
    }[] = [];

    const processedContractorIds = new Set<string>();

    contractors.forEach((contractor) => {
      if (selectedContractor !== 'all' && contractor.id !== selectedContractor) return;
      processedContractorIds.add(contractor.id);
      const items = filteredItems.filter((i) => i.contractorId === contractor.id);
      if (items.length > 0) {
        groups.push({
          contractor,
          items,
          totalNet: items.reduce((sum, i) => sum + i.netPay, 0),
          totalRegular: items.reduce((sum, i) => sum + i.regularPay, 0),
          totalOt: items.reduce((sum, i) => sum + i.otPay, 0),
          paidCount: items.filter((i) => i.paymentStatus === 'paid').length,
        });
      }
    });

    // Also include any items that belong to direct hire / unmatched agency
    const orphanItems = filteredItems.filter((i) => !processedContractorIds.has(i.contractorId));
    if (orphanItems.length > 0 && (selectedContractor === 'all' || selectedContractor === 'cnt-direct')) {
      groups.push({
        contractor: {
          id: 'cnt-direct',
          name: 'Direct Plant Workforce',
          code: 'DIR',
          contactPerson: 'Internal HR',
          phone: 'N/A',
        },
        items: orphanItems,
        totalNet: orphanItems.reduce((sum, i) => sum + i.netPay, 0),
        totalRegular: orphanItems.reduce((sum, i) => sum + i.regularPay, 0),
        totalOt: orphanItems.reduce((sum, i) => sum + i.otPay, 0),
        paidCount: orphanItems.filter((i) => i.paymentStatus === 'paid').length,
      });
    }

    return groups;
  }, [contractors, filteredItems, selectedContractor]);

  const handleExport = (type: 'excel' | 'csv') => {
    setIsExporting(true);
    try {
      if (type === 'excel') {
        exportPayrollToExcel(filteredItems, tenant.name);
      } else {
        exportPayrollToCsv(filteredItems, tenant.name);
      }
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
  };

  const totalPayrollAmount = filteredItems.reduce((acc, i) => acc + i.netPay, 0);
  const totalAdvanceAmount = filteredItems.reduce((acc, i) => acc + (i.cashAdvance || 0), 0);
  const totalPaidAmount = filteredItems
    .filter((i) => i.paymentStatus === 'paid')
    .reduce((acc, i) => acc + i.netPay, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Actions */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-md">
              <FileSpreadsheet className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Payment Reports
              </h2>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                Weekly Worker Pay Summary
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-2 ml-1">
            Worker pay grouped by contractor with 1-click Excel download
          </p>
        </div>

        {/* 1-Click Export Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleExport('excel')}
            disabled={isExporting || filteredItems.length === 0}
            className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm transition-all shadow-xl shadow-emerald-600/30 disabled:opacity-50 cursor-pointer active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
            <span>{isExporting && exportType === 'excel' ? 'Exporting...' : 'Export to Excel (.xlsx)'}</span>
          </button>

          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting || filteredItems.length === 0}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm transition-all disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Aggregate Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 backdrop-blur-xl shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Weekly Pay
            </span>
            <div className="font-mono text-3xl sm:text-4xl font-black text-white mt-1.5 tracking-tight">
              {formatCurrency(totalPayrollAmount)}
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between font-medium">
            <span>{filteredItems.length} workers</span>
            {totalAdvanceAmount > 0 && (
              <span className="text-amber-400 font-mono text-[11px]">
                Hafta Advance: -{formatCurrency(totalAdvanceAmount)}
              </span>
            )}
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/30 backdrop-blur-xl shadow-xl flex flex-col justify-between shadow-[0_0_20px_rgba(16,185,129,0.08)]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                Paid Amount
              </span>
              <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {Math.round((totalPaidAmount / (totalPayrollAmount || 1)) * 100)}% Settled
              </span>
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-black text-emerald-400 mt-1.5 tracking-tight">
              {formatCurrency(totalPaidAmount)}
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 pt-3 border-t border-slate-800/80">
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#10b981]"
                style={{ width: `${Math.round((totalPaidAmount / (totalPayrollAmount || 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-amber-500/30 backdrop-blur-xl shadow-xl flex flex-col justify-between shadow-[0_0_20px_rgba(245,158,11,0.08)]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Pending Amount
              </span>
              <span className="px-2 py-0.5 rounded-full font-mono text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Awaiting
              </span>
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-black text-amber-400 mt-1.5 tracking-tight">
              {formatCurrency(totalPayrollAmount - totalPaidAmount)}
            </div>
          </div>
          <span className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80 block font-medium">
            Pending payment authorization
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span className="text-xs sm:text-sm font-bold text-slate-200">Filter Payment Reports:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search worker name or ID..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
            />
          </div>

          {role !== 'contractor' && (
            <select
              value={selectedContractor}
              onChange={(e) => setSelectedContractor(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer transition-colors shadow-inner"
            >
              <option value="all">All Contractors ({contractors.length})</option>
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Contractor Grouped Tables */}
      <div className="space-y-6">
        {groupedByContractor.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-amber-400 mx-auto flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-200 text-base">No payment records to display</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Add workers in Manage Workers and complete shift punch-outs at the Guard Kiosk to generate payment reports and Excel sheets.
            </p>
          </div>
        ) : (
          groupedByContractor.map(({ contractor, items, totalNet, totalRegular, totalOt, paidCount }) => (
          <div
            key={contractor.id}
            className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl"
          >
            {/* Contractor Section Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-black text-white">
                    {contractor.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-emerald-300 border border-slate-700">
                    {contractor.code}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Designated Officer: {contractor.contactPerson} • Phone: {contractor.phone}
                </p>
              </div>

              {/* Subtotal & Bulk Actions */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                    Agency Total
                  </span>
                  <div className="font-mono text-xl font-black text-emerald-400">
                    {formatCurrency(totalNet)}
                  </div>
                </div>

                {role === 'admin' && (
                  <button
                    onClick={() => markAllAsPaid(contractor.id)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-emerald-950/80 hover:text-emerald-200 hover:border-emerald-600 border border-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    Mark All Paid ({items.length})
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-xs text-slate-300">
                <thead className="bg-slate-950/90 text-slate-400 uppercase font-bold text-[11px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-5">Worker</th>
                    <th className="py-4 px-5">Department</th>
                    <th className="py-4 px-5 text-center">Shifts</th>
                    <th className="py-4 px-5 text-center">Regular Hrs</th>
                    <th className="py-4 px-5 text-center">OT Hrs (1.5x)</th>
                    <th className="py-4 px-5 text-right">Regular Pay</th>
                    <th className="py-4 px-5 text-right">OT Pay</th>
                    <th className="py-4 px-5 text-right">Advance (Hafta)</th>
                    <th className="py-4 px-5 text-right">Total Pay</th>
                    <th className="py-4 px-5 text-center">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {items.map((item) => {
                    const isPaid = item.paymentStatus === 'paid';

                    return (
                      <tr key={item.workerId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-5">
                          <div className="font-bold text-white text-sm">
                            {item.workerName}
                          </div>
                          <span className="font-mono text-[11px] text-emerald-400 font-bold bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                            {item.workerCode}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-slate-300 font-medium">
                          {item.department}
                        </td>

                        <td className="py-4 px-5 text-center font-mono font-bold text-slate-200">
                          {item.shiftsWorked}
                        </td>

                        <td className="py-4 px-5 text-center font-mono font-semibold text-slate-300">
                          {item.totalRegularHours}h
                        </td>

                        <td className="py-4 px-5 text-center font-mono font-bold text-amber-400">
                          {item.totalOtHours > 0 ? `+${item.totalOtHours}h` : '0h'}
                        </td>

                        <td className="py-4 px-5 text-right font-mono text-slate-300">
                          {formatCurrency(item.regularPay)}
                        </td>

                        <td className="py-4 px-5 text-right font-mono font-semibold text-amber-400">
                          {formatCurrency(item.otPay)}
                        </td>

                        <td className="py-4 px-5 text-right font-mono text-rose-400 font-semibold">
                          {item.cashAdvance > 0 ? `-${formatCurrency(item.cashAdvance)}` : '₹0'}
                        </td>

                        <td className="py-4 px-5 text-right font-mono font-extrabold text-emerald-400 text-sm">
                          {formatCurrency(item.netPay)}
                        </td>

                        {/* Payment status toggle button */}
                        <td className="py-4 px-5 text-center">
                          <button
                            onClick={() => togglePaymentStatus(item.workerId)}
                            disabled={role === 'contractor'}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                              isPaid
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 shadow-xs'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 shadow-xs'
                            }`}
                            title={
                              isPaid
                                ? `Paid on ${item.paidAt ? new Date(item.paidAt).toLocaleDateString('en-IN') : 'Recently'}`
                                : 'Click to toggle payment state'
                            }
                          >
                            {isPaid ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Paid</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-3.5 h-3.5" />
                                <span>Pending</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )))}
      </div>
    </div>
  );
};

