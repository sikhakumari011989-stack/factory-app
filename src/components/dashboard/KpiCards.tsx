import React from 'react';
import { Users, UserCheck, Clock, Banknote, TrendingUp, Activity, AlertCircle, Zap } from 'lucide-react';
import { useFactory } from '../../context/FactoryContext';
import { formatCurrency } from '../../utils/wageEngine';

export const KpiCards: React.FC = () => {
  const { workers, contractors, activeFloorWorkers, payrollSummary } = useFactory();

  const totalWorkersCount = workers.length;
  const activeOnFloorCount = activeFloorWorkers.length;
  const overtimeWorkersCount = activeFloorWorkers.filter((a) => a.isOvertime).length;

  // Accrued weekly payroll sum across all workers
  const totalAccruedPayroll = payrollSummary.reduce((acc, curr) => acc + curr.netPay, 0);

  const cards = [
    {
      title: 'Total Workers',
      value: totalWorkersCount.toString(),
      subtext: `Across ${contractors.length} contractor agenc${contractors.length === 1 ? 'y' : 'ies'}`,
      icon: Users,
      glowColor: 'from-sky-500/15 via-slate-900/90 to-slate-950 border-sky-500/30',
      iconBg: 'bg-sky-500/10 text-sky-400 border border-sky-500/30',
      badge: 'Registered',
      badgeColor: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
      trend: `${totalWorkersCount} Enrolled`,
      trendPositive: true,
    },
    {
      title: 'Live Factory Floor',
      value: activeOnFloorCount.toString(),
      subtext: totalWorkersCount > 0
        ? `${Math.round((activeOnFloorCount / totalWorkersCount) * 100)}% of workers on shift`
        : '0 on floor (No active shift)',
      icon: UserCheck,
      glowColor: 'from-emerald-500/20 via-slate-900/90 to-slate-950 border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.12)]',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      badge: 'Active Now',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      trend: 'Live Ticking',
      trendPositive: true,
      hasPulse: true,
    },
    {
      title: 'Overtime Workers',
      value: overtimeWorkersCount.toString(),
      subtext: 'Working over 8 regular hours',
      icon: Clock,
      glowColor: 'from-amber-500/20 via-slate-900/90 to-slate-950 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.12)]',
      iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      badge: '1.5x Pay',
      badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      trend: 'Auto-Calculated',
      trendPositive: false,
    },
    {
      title: 'Total Weekly Pay',
      value: formatCurrency(totalAccruedPayroll),
      subtext: 'Regular and overtime pay',
      icon: Banknote,
      glowColor: 'from-indigo-500/20 via-slate-900/90 to-slate-950 border-indigo-500/40 shadow-[0_0_25px_rgba(99,102,241,0.12)]',
      iconBg: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
      badge: 'This Week',
      badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      trend: 'Instant Export',
      trendPositive: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-5 sm:p-6 rounded-3xl bg-gradient-to-b ${card.glowColor} border backdrop-blur-xl shadow-xl flex flex-col justify-between transition-all duration-200 hover:translate-y-[-2px] relative overflow-hidden group`}
          >
            {/* Top Row: Metric Title & Icon */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
                  {card.title}
                </span>
                <div className="text-3xl sm:text-4xl font-mono font-black text-white tracking-tight mt-1.5 flex items-center gap-2">
                  <span>{card.value}</span>
                  {card.hasPulse && (
                    <span className="flex h-3 w-3 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-2xl ${card.iconBg} shadow-md shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>

            {/* Bottom Row: Context Subtext & High-contrast Badge */}
            <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 truncate max-w-[160px] text-[11px] font-medium">{card.subtext}</span>
              <div className="flex items-center gap-1.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${card.badgeColor}`}>
                  {card.badge}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

