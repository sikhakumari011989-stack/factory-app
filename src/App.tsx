import React, { useState, useEffect } from 'react';
import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FactoryProvider } from './context/FactoryContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar, ActiveTab } from './components/common/Sidebar';
import { OfflineSyncBanner } from './components/common/OfflineSyncBanner';
import { GuardKiosk } from './components/kiosk/GuardKiosk';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { WageEngineView } from './components/engine/WageEngineView';
import { PayrollView } from './components/payroll/PayrollView';
import { WorkerRegistryView } from './components/registry/WorkerRegistryView';
import { AuthScreen } from './components/auth/AuthScreen';
import { FirebaseConfigModal } from './components/common/FirebaseConfigModal';
import { PwaInstallBanner } from './components/common/PwaInstallBanner';
import {
  Smartphone,
  LayoutDashboard,
  Calculator,
  FileSpreadsheet,
  Users,
  LogIn,
  Database,
} from 'lucide-react';

export type MainAppView = ActiveTab | 'login';

const MainAppContent: React.FC = () => {
  const { user, role, logout } = useAuth();
  const [currentView, setCurrentView] = useState<MainAppView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);

  // Automatically adjust default view when role changes
  useEffect(() => {
    if (role === 'guard') {
      setCurrentView('kiosk');
    } else if (role === 'contractor') {
      setCurrentView('dashboard');
    }
  }, [role]);

  // If user is not logged in or explicitly selected login view, render the industrial login screen
  if (!user || currentView === 'login') {
    return (
      <div className="relative min-h-screen">
        {user && (
          <div className="absolute top-4 right-4 z-50">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-lg backdrop-blur-md transition-all cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              <span>Back to Factory Floor</span>
            </button>
          </div>
        )}
        <AuthScreen
          onSuccess={() => {
            if (role === 'guard') setCurrentView('kiosk');
            else setCurrentView('dashboard');
          }}
        />
      </div>
    );
  }

  // 1. SECURITY & GUARD LOCKDOWN:
  // When logged in as Guard, completely remove Navbar, Sidebar, and Switch Role buttons.
  // The screen is 100% locked to the touch Clock In / Clock Out kiosk interface.
  if (role === 'guard') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
        <OfflineSyncBanner />

        {/* Minimal Discrete Guard Topbar: Only shows gate status and clean End Shift button */}
        <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-slate-200 tracking-wide">Security Gate Kiosk (Locked)</span>
          </div>
          <button
            onClick={() => {
              logout();
              setCurrentView('login');
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-rose-950 hover:text-rose-200 hover:border-rose-700/80 border border-slate-700/80 text-slate-300 text-xs font-semibold cursor-pointer transition-all"
            title="End Shift and Return to Login"
          >
            End Shift / Sign Out
          </button>
        </div>

        {/* Main Kiosk Punch Area */}
        <main className="flex-1 p-4 sm:p-6 flex flex-col justify-center items-center">
          <GuardKiosk />
        </main>

        {/* True PWA Install Banner */}
        <PwaInstallBanner />
      </div>
    );
  }

  // Admin and Contractor View
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Offline Sync Banner */}
      <OfflineSyncBanner />

      {/* Topbar Navbar */}
      <Navbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onNavigateToLogin={() => setCurrentView('login')}
        onOpenDbModal={() => setShowDbModal(true)}
      />

      {/* Quick Access Action Bar with Plain English Labels */}
      <div className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Module Shortcut Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline mr-1">
            Section:
          </span>

          <button
            onClick={() => setCurrentView('dashboard')}
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
            onClick={() => setCurrentView('engine')}
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
            onClick={() => setCurrentView('payroll')}
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
            onClick={() => setCurrentView('registry')}
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
            onClick={() => setCurrentView('kiosk')}
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

        {/* Database Settings & Role Switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDbModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold cursor-pointer transition-colors shadow-xs"
            title="Database & Firebase Cloud Configuration"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Database Settings</span>
          </button>

          <button
            onClick={() => setCurrentView('login')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold cursor-pointer transition-colors shadow-xs"
            title="Switch User / Sign Out"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-400" />
            <span>Switch Role / Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          activeTab={currentView}
          onSelectTab={(tab) => setCurrentView(tab)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenSettings={() => setShowDbModal(true)}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:ml-64 overflow-x-hidden min-h-[calc(100vh-110px)] max-w-[1720px] w-full">
          {currentView === 'kiosk' && <GuardKiosk />}
          {currentView === 'dashboard' && (
            <AdminDashboard
              onNavigateToKiosk={() => setCurrentView('kiosk')}
              onOpenSettings={() => setShowDbModal(true)}
            />
          )}
          {currentView === 'engine' && <WageEngineView />}
          {currentView === 'payroll' && <PayrollView />}
          {currentView === 'registry' && <WorkerRegistryView />}
        </main>
      </div>

      {/* Firebase Cloud Firestore Settings Modal */}
      <FirebaseConfigModal
        isOpen={showDbModal}
        onClose={() => setShowDbModal(false)}
      />

      {/* True PWA Install Banner */}
      <PwaInstallBanner />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <FactoryProvider>
        <MainAppContent />
      </FactoryProvider>
    </AuthProvider>
  );
}
