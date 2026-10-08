import React from 'react';
import { CalendarCheck, Users, ShieldCheck, Star } from 'lucide-react';
import { STATS_LIST } from '../../data/mockEvents';

export const StatsSection: React.FC = () => {
  const icons = [
    <CalendarCheck className="w-5 h-5 text-indigo-400" />,
    <Users className="w-5 h-5 text-purple-400" />,
    <ShieldCheck className="w-5 h-5 text-emerald-400" />,
    <Star className="w-5 h-5 text-amber-400" />,
  ];

  return (
    <div className="py-12 border-y border-slate-800/80 bg-slate-900/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS_LIST.map((stat, index) => (
            <div
              key={stat.label}
              className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/60 hover:border-slate-700 transition-all"
            >
              <div className="inline-flex p-2.5 rounded-xl bg-slate-850 mb-3 border border-slate-800">
                {icons[index % icons.length]}
              </div>
              <div className="font-outfit text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
