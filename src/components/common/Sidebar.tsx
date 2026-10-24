import React from 'react';
import {
  Users,
  Calculator,
  FileSpreadsheet,
  Settings,
  LogIn,
  Layers,
  Database,
  ShieldAlert,
  X,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFactory } from '../../context/FactoryContext';
import { isFirebaseConfigured } from '../../lib/firebase';

export type ActiveTab = 'dashboard' | 'engine' | 'payroll' | 'registry' | 'kiosk' | 'login';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenSettings?: () => void;
  onNavigateToCreator?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
  onOpenSettings,
  onNavigateToCreator,
}) => {
  const { role } = useAuth();
  const { activeFloorWorkers } = useFactory();

  // Exactly 4 clean, simplified admin items with plain English
  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    badge?: string | number;
    allowedRoles: ('admin' | 'contractor')[];
  }[] = [
    {
      id: 'dashboard',
      label: 'Live Factory Floor',
      icon: Users,
      badge: activeFloorWorkers.length > 0 ? activeFloorWorkers.length : undefined,
      allowedRoles: ['admin', 'contractor'],
    },
    {
      id: 'engine',
      label: 'Salary Calculator',
      icon: Calculator,
      allowedRoles: ['admin', 'contractor'],
    },
    {
      id: 'payroll',
      label: 'Payment Reports',
      icon: FileSpreadsheet,
      allowedRoles: ['admin', 'contractor'],
    },
    {
      id: 'registry',
      label: 'Manage Workers',
      icon: Settings,
      allowedRoles: ['admin'],
    },
  ];

  const visibleItems = navItems.filter((item) =>
    item.allowedRoles.includes(role as 'admin' | 'contractor')
  );

  const handleItemClick = (id: ActiveTab) => {
    onSelectTab(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Responsive Collapsible Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-2xl shadow-black/80 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* Brand / Header */}
        <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            {(!isCollapsed || isOpen) && (
              <div className="min-w-0 transition-opacity duration-200">
                <span className="font-extrabold text-slate-100 text-xs tracking-wider block leading-tight truncate">
                  FACTORY ADMIN
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Control Panel</span>
              </div>
            )}
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors lg:hidden cursor-pointer"
            aria-label="Close mobile sidebar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Desktop Collapse Toggle in Header */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label="Toggle sidebar collapse"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-indigo-400" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}
        </div>

        {/* Navigation List - 4 Clear Items */}
        <nav className="flex-1 p-2.5 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {(!isCollapsed || isOpen) && (
            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Navigation
            </div>
          )}

          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                title={isCollapsed && !isOpen ? item.label : undefined}
                className={`w-full text-left flex items-center rounded-2xl transition-all cursor-pointer relative group ${
                  isCollapsed && !isOpen
                    ? 'justify-center p-3'
                    : 'justify-between px-3.5 py-3'
                } ${
                  isActive
                    ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-600/30 border border-indigo-500/50'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent font-medium'
                }`}
              >
                <div className={`flex items-center gap-3 min-w-0 ${isCollapsed && !isOpen ? 'justify-center' : ''}`}>
                  <div
                    className={`p-2 rounded-xl shrink-0 transition-colors ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'bg-slate-800/70 text-slate-400 group-hover:text-slate-200 group-hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  {(!isCollapsed || isOpen) && (
                    <span className="text-xs sm:text-sm truncate">{item.label}</span>
                  )}
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isCollapsed && !isOpen
                        ? 'absolute top-1.5 right-1.5 w-2.5 h-2.5 p-0 bg-emerald-400 border border-slate-900 rounded-full'
                        : isActive
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {isCollapsed && !isOpen ? '' : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Utility Actions */}
        <div className="p-2.5 border-t border-slate-800 bg-slate-950/60 space-y-1.5 shrink-0">
          {onNavigateToCreator && (
            <button
              onClick={() => {
                onNavigateToCreator();
                onClose();
              }}
              title="Super-Admin Creator Portal (/master-creator)"
              className={`w-full flex items-center rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                isCollapsed && !isOpen ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                {(!isCollapsed || isOpen) && <span>Creator Portal</span>}
              </div>
              {(!isCollapsed || isOpen) && (
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                  Gate
                </span>
              )}
            </button>
          )}

          {onOpenSettings && (
            <button
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
              title="Database & Firebase Cloud Configuration"
              className={`w-full flex items-center rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                isCollapsed && !isOpen ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
              }`}
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                {(!isCollapsed || isOpen) && <span>Database</span>}
              </div>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isFirebaseConfigured() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </button>
          )}

          <button
            onClick={() => handleItemClick('login')}
            title="Switch Role / Sign Out"
            className={`w-full flex items-center rounded-xl border text-xs font-semibold transition-all cursor-pointer bg-slate-800/60 hover:bg-rose-950/40 text-slate-300 hover:text-rose-200 border-slate-700/60 hover:border-rose-800/50 ${
              isCollapsed && !isOpen ? 'justify-center p-2.5' : 'justify-start gap-2.5 px-3 py-2'
            }`}
          >
            <LogIn className="w-4 h-4 text-indigo-400 shrink-0" />
            {(!isCollapsed || isOpen) && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
