import React, { useState } from 'react';
import {
  Factory,
  Shield,
  UserCheck,
  Building2,
  Database,
  Wifi,
  WifiOff,
  Menu,
  ChevronDown,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFactory } from '../../context/FactoryContext';
import { isFirebaseConfigured } from '../../lib/firebase';
import { FirebaseConfigModal } from './FirebaseConfigModal';
import { UserRole } from '../../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onNavigateToLogin?: () => void;
  onOpenDbModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onNavigateToLogin,
  onOpenDbModal,
}) => {
  const { user, role, tenant, switchRole, logout } = useAuth();
  const { isOfflineMode, offlineQueueCount, toggleOfflineMode, resetDemoData } = useFactory();
  const [showDbModal, setShowDbModal] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const isConfigured = isFirebaseConfigured();

  const handleRoleSelect = (newRole: UserRole) => {
    switchRole(newRole);
    setShowRoleMenu(false);
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return { label: 'Admin (Factory Owner/HR)', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', icon: Shield };
      case 'guard':
        return { label: 'Guard Kiosk Operator', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', icon: UserCheck };
      case 'contractor':
        return { label: 'Contractor (Wage Oversight)', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', icon: Building2 };
    }
  };

  const currentBadge = getRoleBadge(role);
  const RoleIcon = currentBadge.icon;

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-7 py-3.5 flex items-center justify-between gap-4 shadow-sm">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3.5">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors lg:hidden cursor-pointer"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Factory className="w-5 h-5 text-slate-950 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white tracking-tight text-base sm:text-lg">
                  FactorySync
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-mono font-bold tracking-wider rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  PWA Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[180px] sm:max-w-xs flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-medium text-slate-300">{tenant.name}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Firebase Database Settings button */}
          <button
            onClick={() => {
              if (onOpenDbModal) onOpenDbModal();
              else setShowDbModal(true);
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 transition-all cursor-pointer shadow-xs"
            title="Configure Firebase Cloud Firestore"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{isConfigured ? 'Firebase Cloud' : 'Database Settings'}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>

          {/* Clear All Data button */}
          <button
            onClick={() => {
              if (window.confirm('Clear all registered workers, contractor agencies, shifts, and punch records back to clean empty state?')) {
                resetDemoData();
              }
            }}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-xs font-medium text-slate-300 transition-all cursor-pointer"
            title="Clear all stored data back to empty state"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden xl:inline">Clear All Data</span>
          </button>

          {/* Network status toggle pill */}
          <button
            onClick={toggleOfflineMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              isOfflineMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
            }`}
            title="Click to toggle simulated network offline mode"
          >
            {isOfflineMode ? (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Offline</span>
                {offlineQueueCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-[10px]">
                    {offlineQueueCount}
                  </span>
                )}
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Online</span>
              </>
            )}
          </button>

          {/* Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition-all cursor-pointer ${currentBadge.color}`}
            >
              <RoleIcon className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{currentBadge.label}</span>
              <span className="lg:hidden capitalize">{role}</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Switch Active Role
                </div>
                <button
                  onClick={() => handleRoleSelect('admin')}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                    role === 'admin' ? 'bg-indigo-600/20 text-indigo-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="font-semibold">Admin (Owner/HR)</div>
                    <div className="text-[10px] text-slate-400">Full floor oversight, wages & exports</div>
                  </div>
                </button>
                <button
                  onClick={() => handleRoleSelect('guard')}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                    role === 'guard' ? 'bg-emerald-600/20 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold">Guard (Kiosk Operator)</div>
                    <div className="text-[10px] text-slate-400">Touch clock-in/out, QR & PIN pad</div>
                  </div>
                </button>
                <button
                  onClick={() => handleRoleSelect('contractor')}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 transition-colors cursor-pointer ${
                    role === 'contractor' ? 'bg-amber-600/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-semibold">Contractor Supervisor</div>
                    <div className="text-[10px] text-slate-400">View-only wage oversight & worker list</div>
                  </div>
                </button>

                {onNavigateToLogin && (
                  <div className="pt-1.5 mt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        onNavigateToLogin();
                      }}
                      className="w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 text-indigo-400 hover:bg-slate-800/80 transition-colors cursor-pointer font-semibold"
                    >
                      <Factory className="w-4 h-4" />
                      <span>Switch Account / Open Login</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Avatar & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <button
              onClick={() => {
                if (onNavigateToLogin) onNavigateToLogin();
              }}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center font-bold text-xs text-slate-200 transition-colors cursor-pointer"
              title={`${user?.name || 'User'} - Click to switch user`}
            >
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
            </button>
          </div>
        </div>
      </header>

      {/* Firebase modal */}
      <FirebaseConfigModal isOpen={showDbModal} onClose={() => setShowDbModal(false)} />
    </>
  );
};

