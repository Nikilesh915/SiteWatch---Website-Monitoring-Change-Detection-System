import React from 'react';
import { 
  Globe, 
  CheckCircle2, 
  History, 
  Zap, 
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';

const StatsOverview = ({ metrics, totalMonitorsCount = 0 }) => {
  const {
    totalMonitors = 0,
    activeMonitors = 0,
    pausedMonitors = 0,
    errorMonitors = 0,
    changes24h = 0,
    avgResponseTime = 0,
  } = metrics || {};

  const stats = [
    {
      title: 'Monitored Sites',
      value: totalMonitors || totalMonitorsCount,
      subtext: `${activeMonitors} active • ${pausedMonitors} paused`,
      icon: Globe,
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      badge: 'All Systems',
    },
    {
      title: 'Health & Uptime',
      value: errorMonitors === 0 ? '100%' : `${Math.round(((totalMonitors - errorMonitors) / Math.max(1, totalMonitors)) * 100)}%`,
      subtext: errorMonitors === 0 ? 'All endpoints reachable' : `${errorMonitors} site(s) with errors`,
      icon: errorMonitors === 0 ? CheckCircle2 : AlertTriangle,
      iconBg: errorMonitors === 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100',
      badge: errorMonitors === 0 ? 'Healthy' : 'Attention',
    },
    {
      title: '24h Changes Detected',
      value: changes24h,
      subtext: 'Granular content updates logged',
      icon: History,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      badge: 'Alerts Active',
    },
    {
      title: 'Avg Scraping Latency',
      value: avgResponseTime > 0 ? `${avgResponseTime} ms` : '—',
      subtext: 'Average response time',
      icon: Zap,
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      badge: avgResponseTime > 0 && avgResponseTime < 600 ? 'Fast' : 'Normal',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, idx) => {
        const IconComponent = stat.icon;
        return (
          <div 
            key={idx}
            className="glass-card rounded-2xl p-5 border border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{stat.title}</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{stat.value}</h3>
              </div>
              <div className={`p-2.5 rounded-xl border ${stat.iconBg}`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
              <span className="text-slate-500 font-medium truncate max-w-[180px]">{stat.subtext}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                {stat.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsOverview;
