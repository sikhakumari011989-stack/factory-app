import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Download,
  Plus,
  Search,
  Upload,
  Calendar,
  Phone,
  Clock,
  Sparkles,
  Building2,
  DollarSign,
  TrendingUp,
  AlertCircle,
  LogOut,
  Database,
  ShieldAlert,
  Menu,
  X,
  Filter,
  Check,
  Zap,
  Edit2,
  Trash2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useFactory } from '../../context/FactoryContext';
import { useAuth } from '../../context/AuthContext';
import { Worker } from '../../types';
import { formatCurrency } from '../../utils/wageEngine';
import { BulkWorkerImportModal } from '../registry/BulkWorkerImportModal';
import { WorkerModal } from '../registry/WorkerModal';

interface UnifiedFactoryDashboardProps {
  isGuardMode?: boolean;
  onOpenSettings?: () => void;
  onNavigateToCreator?: () => void;
  onSignOut: () => void;
}

export const UnifiedFactoryDashboard: React.FC<UnifiedFactoryDashboardProps> = ({
  isGuardMode = false,
  onOpenSettings,
  onNavigateToCreator,
  onSignOut,
}) => {
  const { tenant } = useAuth();
  const {
    workers,
    activeFloorWorkers,
    toggleAttendance,
    markAllAttendance,
    addWorker,
    updateWorker,
    deleteWorker,
    bulkAddWorkers,
    shifts,
  } = useFactory();

  // Mobile menu drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent'>('all');

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddWorkerModalOpen, setIsAddWorkerModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Present workers lookup set & map
  const activeWorkerMap = useMemo(() => {
    const map = new Map<string, { clockInTime: string }>();
    activeFloorWorkers.forEach((a) => {
      map.set(a.worker.id, { clockInTime: a.clockInTime });
    });
    return map;
  }, [activeFloorWorkers]);

  const presentCount = activeFloorWorkers.length;
  const totalCount = workers.length;
  const absentCount = Math.max(0, totalCount - presentCount);

  // Compute Today's Total Wages Accrued (sum of daily wages or hourly*8 of all present workers)
  const todayWagesAccrued = useMemo(() => {
    return activeFloorWorkers.reduce((acc, curr) => {
      const daily = curr.worker.dailyWage || (curr.worker.baseHourlyRate ? curr.worker.baseHourlyRate * 8 : 500);
      return acc + daily;
    }, 0);
  }, [activeFloorWorkers]);

  // Estimated Weekly Total (assuming 6 working days)
  const weeklyEstimatedTotal = useMemo(() => {
    const baseDailySum = workers.reduce((acc, w) => {
      const daily = w.dailyWage || (w.baseHourlyRate ? w.baseHourlyRate * 8 : 500);
      return acc + daily;
    }, 0);
    return baseDailySum * 6;
  }, [workers]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // 1-Tap Attendance Toggle
  const handleToggle = (worker: Worker) => {
    const res = toggleAttendance(worker.id);
    if (res.success) {
      showNotification(`${worker.name} marked ${res.isPresent ? 'PRESENT' : 'ABSENT'}`);
    } else if (res.message) {
      showNotification(res.message);
    }
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    if (window.confirm('Mark ALL workers as PRESENT for today?')) {
      const count = markAllAttendance(true);
      showNotification(`Marked ${count} worker(s) present!`);
    }
  };

  // Mark all absent
  const handleMarkAllAbsent = () => {
    if (window.confirm('Mark ALL workers as ABSENT / clock-out all for today?')) {
      const count = markAllAttendance(false);
      showNotification(`Clocked out ${count} worker(s)!`);
    }
  };

  // Filtered workers
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        w.name.toLowerCase().includes(query) ||
        w.workerCode.toLowerCase().includes(query) ||
        (w.phone && w.phone.includes(query));

      const isPresent = activeWorkerMap.has(w.id);

      if (statusFilter === 'present') return matchesSearch && isPresent;
      if (statusFilter === 'absent') return matchesSearch && !isPresent;
      return matchesSearch;
    });
  }, [workers, searchQuery, statusFilter, activeWorkerMap]);

  // Export Daily Attendance to Excel
  const handleExportDailyAttendance = () => {
    const dateStr = new Date().toISOString().split('T')[0];
    const data = workers.map((w, idx) => {
      const isPresent = activeWorkerMap.has(w.id);
      const activeInfo = activeWorkerMap.get(w.id);
      const dailyWage = w.dailyWage || (w.baseHourlyRate ? w.baseHourlyRate * 8 : 500);

      return {
        'Sr. No': idx + 1,
        'Worker Code': w.workerCode,
        'Worker Name': w.name,
        'Phone Number': w.phone || 'N/A',
        'Daily Wage (₹)': dailyWage,
        'Today Status': isPresent ? 'PRESENT' : 'ABSENT',
        'Clock In Time': activeInfo
          ? new Date(activeInfo.clockInTime).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })
          : '-',
        'Date': dateStr,
        'Plant': tenant.name,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Attendance');
    XLSX.writeFile(workbook, `${tenant.code || 'Factory'}_Attendance_${dateStr}.xlsx`);
    showNotification('Daily attendance report downloaded!');
  };

  // Formatted date string
  const formattedToday = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen bg-slate-950 text-slate-100 font-sans pb-16 select-none">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-3 duration-200">
          <div className="px-4 py-2.5 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-2xl shadow-emerald-500/40 flex items-center gap-2 border border-emerald-400">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
        </div>
      )}

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* Mobile Side Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:hidden ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-white text-sm block leading-tight">{tenant.name}</span>
                <span className="text-[10px] font-mono text-emerald-400">{tenant.code} • Plant Menu</span>
              </div>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {!isGuardMode && (
              <>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsImportModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Import Workers (Excel/CSV)</span>
                </button>

                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleExportDailyAttendance();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs"
                >
                  <Download className="w-4 h-4 text-indigo-400" />
                  <span>Download Attendance Excel</span>
                </button>

                {onOpenSettings && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs"
                  >
                    <Database className="w-4 h-4 text-amber-400" />
                    <span>Database Settings</span>
                  </button>
                )}

                {onNavigateToCreator && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigateToCreator();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Creator Master Gate</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            setIsMobileMenuOpen(false);
            onSignOut();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-800/80 font-bold text-xs transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out / Switch Portal</span>
        </button>
      </aside>

      {/* Sticky Mobile/Desktop Topbar */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        {/* Left: Mobile hamburger + Factory Branding */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors lg:hidden shrink-0 cursor-pointer"
            aria-label="Open mobile menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-600 to-indigo-600 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <Building2 className="w-5 h-5 text-slate-950 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-black text-white text-sm sm:text-base tracking-tight truncate">
                  {tenant.name}
                </h1>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded font-mono text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {tenant.code}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{formattedToday}</span>
                <span className="hidden sm:inline">• {tenant.location || 'MIDC Tarapur/Boisar'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!isGuardMode ? (
            <>
              {/* Import Excel Button */}
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Excel/CSV</span>
              </button>

              {/* Add Single Worker */}
              <button
                onClick={() => {
                  setEditingWorker(null);
                  setIsAddWorkerModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-950 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Worker</span>
              </button>

              {/* Download Excel Report */}
              <button
                onClick={handleExportDailyAttendance}
                className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs transition-colors cursor-pointer"
                title="Download today's attendance in Excel format"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Export Report</span>
              </button>

              {/* Sign Out */}
              <button
                onClick={onSignOut}
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-950 hover:text-rose-200 text-slate-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <button
              onClick={onSignOut}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Gate Sign Out</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Single Scrollable Dashboard Container */}
      <main className="max-w-6xl mx-auto p-3.5 sm:p-5 lg:p-6 space-y-5">
        {/* Guard Mode Notice Banner */}
        {isGuardMode && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold">Security Gate Daily Attendance Mode</span>
            </div>
            <span className="text-[11px] font-mono font-bold bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-200">
              Tap worker to toggle Present/Absent
            </span>
          </div>
        )}

        {/* 1. Top KPI Summary Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Workers */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Workers
              </span>
              <div className="p-1.5 rounded-xl bg-slate-800 text-slate-400">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">{totalCount}</span>
              <span className="text-xs text-slate-500 font-semibold">Registered</span>
            </div>
          </div>

          {/* Card 2: Present Today */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-emerald-500/40 shadow-lg shadow-emerald-950/20 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Present Today
              </span>
              <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                {presentCount}
              </span>
              <span className="text-xs text-emerald-400/80 font-bold">
                ({totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}%)
              </span>
            </div>
          </div>

          {/* Card 3: Absent Today */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Absent Today
              </span>
              <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-400">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">
                {absentCount}
              </span>
              <span className="text-xs text-slate-500 font-semibold">Workers</span>
            </div>
          </div>

          {/* Card 4: Today's Total Wages Accrued (Owner only) */}
          {!isGuardMode ? (
            <div className="p-4 rounded-3xl bg-slate-900/90 border border-indigo-500/40 shadow-lg shadow-indigo-950/20 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                  Today's Wages
                </span>
                <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-indigo-300 font-mono">
                  {formatCurrency(todayWagesAccrued)}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1">
                Est. Week: {formatCurrency(weeklyEstimatedTotal)}
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Gate Shift
                </span>
                <div className="p-1.5 rounded-xl bg-slate-800 text-slate-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">Active</span>
                <span className="text-xs text-slate-400">Gate #1</span>
              </div>
            </div>
          )}
        </section>

        {/* 2. Worker List & Daily Attendance Control Panel */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search worker by name or phone..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>

            {/* Attendance Status Filter Pills */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('present')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'present'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-emerald-400'
                }`}
              >
                Present ({presentCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('absent')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'absent'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-rose-400'
                }`}
              >
                Absent ({absentCount})
              </button>
            </div>
          </div>

          {/* Quick Bulk Attendance Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleMarkAllPresent}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mark All Present</span>
              </button>

              <button
                type="button"
                onClick={handleMarkAllAbsent}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Mark All Absent</span>
              </button>
            </div>

            {/* Mobile Prominent Import Shortcut */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="sm:hidden px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Excel</span>
              </button>

              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Tap button on right to mark attendance
              </span>
            </div>
          </div>

          {/* Worker Attendance List - Clean, Mobile-First Cards */}
          <div className="space-y-2.5 divide-y divide-slate-800/60">
            {filteredWorkers.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-3">
                <Users className="w-12 h-12 mx-auto text-slate-700 stroke-1" />
                <p className="font-bold text-slate-300 text-sm">
                  {searchQuery ? 'No workers match your search.' : 'No workers registered yet.'}
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsImportModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Import Excel / CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingWorker(null);
                      setIsAddWorkerModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Single Worker</span>
                  </button>
                </div>
              </div>
            ) : (
              filteredWorkers.map((worker) => {
                const isPresent = activeWorkerMap.has(worker.id);
                const activeInfo = activeWorkerMap.get(worker.id);
                const dailyWage = worker.dailyWage || (worker.baseHourlyRate ? worker.baseHourlyRate * 8 : 500);

                return (
                  <div
                    key={worker.id}
                    className="pt-2.5 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl hover:bg-slate-800/40 transition-colors border border-transparent hover:border-slate-800"
                  >
                    {/* Worker Info */}
                    <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md ${
                          isPresent
                            ? 'bg-linear-to-br from-emerald-500 to-teal-700 shadow-emerald-950/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {worker.name.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm sm:text-base truncate">
                            {worker.name}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800 shrink-0">
                            {worker.workerCode}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-0.5">
                          {worker.phone && worker.phone !== 'N/A' && (
                            <a
                              href={`tel:${worker.phone}`}
                              className="text-slate-300 hover:text-emerald-400 font-mono text-[11px] flex items-center gap-1 transition-colors"
                            >
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{worker.phone}</span>
                            </a>
                          )}
                          {!isGuardMode && (
                            <span className="font-mono text-emerald-400 font-bold text-[11px]">
                              ₹{dailyWage}/day
                            </span>
                          )}
                          {isPresent && activeInfo && (
                            <span className="text-[11px] text-emerald-400/90 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-emerald-500" />
                              <span>
                                In:{' '}
                                {new Date(activeInfo.clockInTime).toLocaleTimeString('en-IN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                })}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Attendance Toggle & Quick Edit (Right side on desktop, full width on phone) */}
                    <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto shrink-0 pt-1 sm:pt-0 border-t sm:border-0 border-slate-800/60">
                      {/* 1-Tap Big Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggle(worker)}
                        className={`flex-1 sm:flex-none min-h-[44px] px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-95 ${
                          isPresent
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40 border border-emerald-400/50'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80'
                        }`}
                      >
                        {isPresent ? (
                          <>
                            <Check className="w-4 h-4 stroke-[2.5]" />
                            <span>PRESENT</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-slate-500" />
                            <span>ABSENT</span>
                          </>
                        )}
                      </button>

                      {/* Edit / Delete actions for Owner */}
                      {!isGuardMode && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWorker(worker);
                              setIsAddWorkerModalOpen(true);
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Edit worker"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete ${worker.name} from factory records?`)) {
                                deleteWorker(worker.id);
                                showNotification(`Removed ${worker.name}`);
                              }
                            }}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Delete worker"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* 3. Bottom Wage & Payout Summary Section (Owner Only) */}
        {!isGuardMode && (
          <section className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-400" />
                  <span>Wage & Settlement Overview</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct factory wage records for daily and weekly payroll reconciliation
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportDailyAttendance}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Complete Payroll (Excel)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block font-semibold">Today's Total Daily Pay</span>
                <span className="text-xl sm:text-2xl font-black text-indigo-300 font-mono mt-1 block">
                  {formatCurrency(todayWagesAccrued)}
                </span>
                <span className="text-[10px] text-slate-500">For {presentCount} active workers</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block font-semibold">Weekly Factory Payroll (6-Day)</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1 block">
                  {formatCurrency(weeklyEstimatedTotal)}
                </span>
                <span className="text-[10px] text-slate-500">Full roster weekly projection</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 block font-semibold">Average Worker Daily Rate</span>
                <span className="text-xl sm:text-2xl font-black text-white font-mono mt-1 block">
                  {totalCount > 0
                    ? formatCurrency(
                        Math.round(
                          workers.reduce(
                            (a, w) => a + (w.dailyWage || (w.baseHourlyRate ? w.baseHourlyRate * 8 : 500)),
                            0
                          ) / totalCount
                        )
                      )
                    : '₹0'}
                </span>
                <span className="text-[10px] text-slate-500">Direct labor wage scale</span>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Bulk Worker Import Modal (CSV / Excel) */}
      <BulkWorkerImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={(count) => {
          showNotification(`Successfully imported ${count} workers!`);
        }}
        bulkAddWorkers={bulkAddWorkers}
      />

      {/* Add / Edit Worker Modal (Simplified: No contractor dropdowns!) */}
      {isAddWorkerModalOpen && (
        <SimplifiedWorkerModal
          isOpen={isAddWorkerModalOpen}
          initialWorker={editingWorker}
          onClose={() => {
            setIsAddWorkerModalOpen(false);
            setEditingWorker(null);
          }}
          onSave={(workerData) => {
            if (editingWorker) {
              updateWorker(editingWorker.id, workerData);
              showNotification(`Updated ${workerData.name}`);
            } else {
              const startCode = workers.length + 101;
              addWorker({
                ...workerData,
                department: 'Production Floor',
                workerCode: `WRK-${startCode}`,
                pin: String(Math.floor(1000 + Math.random() * 9000)),
                contractorId: 'cnt-direct',
                shiftId: shifts[0]?.id || 'shf-default',
                status: 'active',
                joinedDate: new Date().toISOString().split('T')[0],
              });
              showNotification(`Added ${workerData.name}`);
            }
            setIsAddWorkerModalOpen(false);
            setEditingWorker(null);
          }}
        />
      )}
    </div>
  );
};

// Simplified Worker Add/Edit Modal (Direct Factory -> Worker, NO contractor complexity!)
interface SimplifiedWorkerModalProps {
  isOpen: boolean;
  initialWorker: Worker | null;
  onClose: () => void;
  onSave: (data: { name: string; phone: string; dailyWage: number; baseHourlyRate: number }) => void;
}

const SimplifiedWorkerModal: React.FC<SimplifiedWorkerModalProps> = ({
  isOpen,
  initialWorker,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(initialWorker?.name || '');
  const [phone, setPhone] = useState(initialWorker?.phone !== 'N/A' ? initialWorker?.phone || '' : '');
  const [dailyWage, setDailyWage] = useState(
    initialWorker?.dailyWage || (initialWorker?.baseHourlyRate ? initialWorker.baseHourlyRate * 8 : 550)
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      phone: phone.trim() || 'N/A',
      dailyWage: Number(dailyWage) || 500,
      baseHourlyRate: Math.round((Number(dailyWage) || 500) / 8),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {initialWorker ? 'Edit Worker Details' : 'Add New Factory Worker'}
              </h3>
              <p className="text-[11px] text-slate-400">Direct factory workforce registry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">Worker Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Kumar"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-300">Phone / Mobile Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 98200 11223"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-300">Daily Wage (₹ / Day) *</label>
              <span className="text-[10px] text-slate-500">Standard 8h day</span>
            </div>
            <input
              type="number"
              required
              min={100}
              step={10}
              value={dailyWage}
              onChange={(e) => setDailyWage(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono font-bold text-emerald-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-950"
            >
              {initialWorker ? 'Save Changes' : 'Add to Factory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
