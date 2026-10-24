import React, { useState, useEffect } from 'react';
import {
  Users,
  Calculator,
  FileSpreadsheet,
  Settings,
  LogIn,
  Layers,
  Database,
  ShieldAlert,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Smartphone,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { Navbar } from '../common/Navbar';
import { Sidebar, ActiveTab } from '../common/Sidebar';
import { OfflineSyncBanner } from '../common/OfflineSyncBanner';
import { PwaInstallBanner } from '../common/PwaInstallBanner';
import { useAuth } from '../../context/AuthContext';
import { MainAppView } from '../../App';

interface DashboardLayoutProps {
  currentView: ActiveTab;
  onNavigateToView: (view: MainAppView) => void;
  onOpenDbModal: () => void;
  onNavigateToCreator: () => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentView,
  onNavigateToView,
  onOpenDbModal,
  onNavigateToCreator,
  children,
}) => {
  // Mobile drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Desktop sidebar collapse state (persisted in localStorage)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('factory_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleDesktopCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('factory_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Offline Sync Status Banner */}
      <OfflineSyncBanner />

      {/* Top Navbar */}
      <Navbar
        isSidebarOpen={isMobileDrawerOpen}
        onToggleSidebar={() => setIsMobileDrawerOpen((prev) => !prev)}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleDesktopCollapse={toggleDesktopCollapse}
        onNavigateToLogin={() => onNavigateToView('owner-login')}
        onOpenDbModal={onOpenDbModal}
        onNavigateToCreator={onNavigateToCreator}
      />

      {/* Quick Access Action Bar with Plain English Labels */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs z-20">
        {/* Module Shortcut Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline mr-1">
            Section:
          </span>

          <button
            onClick={() => onNavigateToView('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-500/50'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
            <span>Live Factory Floor</span>
          </button>

          <button
            onClick={() => onNavigateToView('engine')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              currentView === 'engine'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-500/50'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:text-white'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-purple-400" />
            <span>Salary Calculator</span>
          </button>

          <button
            onClick={() => onNavigateToView('payroll')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              currentView === 'payroll'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 border border-amber-500/50'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
            <span>Payment Reports</span>
          </button>

          <button
            onClick={() => onNavigateToView('registry')}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              currentView === 'registry'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 border border-sky-500/50'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span>Manage Workers</span>
          </button>

          <button
            onClick={() => onNavigateToView('kiosk')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              currentView === 'kiosk'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-500/50'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guard Kiosk</span>
          </button>
        </div>

        {/* Database Settings, Creator Portal & Role Switcher */}
        <div className="flex items-center gap-2">
          {/* Desktop Sidebar Collapse Toggle Shortcut */}
          <button
            onClick={toggleDesktopCollapse}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/50 text-xs font-semibold cursor-pointer transition-colors"
            title={isSidebarCollapsed ? 'Expand Sidebar to full width' : 'Collapse Sidebar to icon rail'}
          >
            {isSidebarCollapsed ? (
              <>
                <PanelLeftOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px]">Expand Sidebar</span>
              </>
            ) : (
              <>
                <PanelLeftClose className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px]">Collapse</span>
              </>
            )}
          </button>

          <button
            onClick={onNavigateToCreator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold cursor-pointer transition-colors shadow-xs"
            title="Super-Admin Creator Portal (/master-creator)"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Creator Portal</span>
          </button>

          <button
            onClick={onOpenDbModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold cursor-pointer transition-colors shadow-xs"
            title="Database & Firebase Cloud Configuration"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Database</span>
          </button>

          <button
            onClick={() => onNavigateToView('owner-login')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold cursor-pointer transition-colors shadow-xs"
            title="Switch User / Sign Out"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content Area with Responsive Collapsible Sidebar */}
      <div className="flex-1 flex relative">
        {/* Responsive Sidebar */}
        <Sidebar
          activeTab={currentView}
          onSelectTab={(tab) => {
            onNavigateToView(tab);
            setIsMobileDrawerOpen(false);
          }}
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleDesktopCollapse}
          onOpenSettings={onOpenDbModal}
          onNavigateToCreator={onNavigateToCreator}
        />

        {/* Content Body: Dynamically shifts left margin on desktop, full width on mobile */}
        <main
          className={`flex-1 p-3.5 sm:p-5 lg:p-7 min-w-0 overflow-x-hidden min-h-[calc(100vh-120px)] w-full transition-[margin] duration-300 ease-in-out ${
            isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
        >
          <div className="max-w-[1720px] mx-auto w-full space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* PWA Install Banner */}
      <PwaInstallBanner />
    </div>
  );
};

