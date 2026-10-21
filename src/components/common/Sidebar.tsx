import {
  Users,
  Calculator,
  FileSpreadsheet,
  Settings,
  LogIn,
  Layers,
  Database,
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
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  onOpenSettings,
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

  const visibleItems = navItems.filter((item) => item.allowedRoles.includes(role as 'admin' | 'contractor'));

  const handleItemClick = (id: ActiveTab) => {
    onSelectTab(id);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Header */}
        <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-100 text-sm tracking-wide block leading-tight">
                FACTORY ADMIN
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Control Panel</span>
            </div>
          </div>
        </div>

        {/* Navigation List - 4 Clear, Single-Line Items */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Menu
          </div>

          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full text-left flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all cursor-pointer relative group ${
                  isActive
                    ? 'bg-slate-800 text-white font-bold shadow-md border border-slate-700'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white border border-transparent font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-xl shrink-0 transition-colors ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800/70 text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm truncate">{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Switch Role / Logout Action */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
          {onOpenSettings && (
            <button
              onClick={() => {
                onOpenSettings();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Database Settings</span>
              </div>
              <span
                className={`w-2 h-2 rounded-full ${
                  isFirebaseConfigured() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            </button>
          )}

          <button
            onClick={() => handleItemClick('login')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
            }`}
          >
            <LogIn className="w-4 h-4 text-indigo-400" />
            <span>Switch Role / Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
