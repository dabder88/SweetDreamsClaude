
import React from 'react';
import TiltCard from './TiltCard';
import { Activity, Heart, Moon, TrendingUp } from 'lucide-react';

const Analytics: React.FC = () => {
  return (
    <div className="animate-fade-in space-y-8">
      <div className="mb-8">
        <h2 className="text-3xl font-serif font-bold text-white mb-2">Аналитика психики</h2>
        <p className="text-slate-400">Визуализация паттернов вашего подсознания</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TiltCard className="glass-panel p-4 rounded-xl bg-slate-900/60">
           <div className="text-slate-500 text-xs uppercase font-bold mb-2 flex items-center gap-2">
             <Moon size={14} className="text-indigo-400"/> Всего снов
           </div>
           <div className="text-3xl font-serif text-white">12</div>
           <div className="text-xs text-emerald-400 mt-1">+2 на этой неделе</div>
        </TiltCard>
        
        <TiltCard className="glass-panel p-4 rounded-xl bg-slate-900/60">
           <div className="text-slate-500 text-xs uppercase font-bold mb-2 flex items-center gap-2">
             <Heart size={14} className="text-rose-400"/> Частая эмоция
           </div>
           <div className="text-xl font-serif text-white truncate">Тревога</div>
           <div className="text-xs text-slate-500 mt-1">45% снов</div>
        </TiltCard>

        <TiltCard className="glass-panel p-4 rounded-xl bg-slate-900/60">
           <div className="text-slate-500 text-xs uppercase font-bold mb-2 flex items-center gap-2">
             <Activity size={14} className="text-amber-400"/> Интенсивность
           </div>
           <div className="text-3xl font-serif text-white">7.5</div>
           <div className="text-xs text-slate-500 mt-1">из 10</div>
        </TiltCard>

        <TiltCard className="glass-panel p-4 rounded-xl bg-slate-900/60">
           <div className="text-slate-500 text-xs uppercase font-bold mb-2 flex items-center gap-2">
             <TrendingUp size={14} className="text-emerald-400"/> Осознанность
           </div>
           <div className="text-3xl font-serif text-white">15%</div>
           <div className="text-xs text-emerald-400 mt-1">Растет</div>
        </TiltCard>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Emotional Pulse Chart (Mock SVG) */}
        <TiltCard className="glass-panel p-6 rounded-2xl bg-slate-900/60">
           <h3 className="text-lg font-bold text-slate-200 mb-6">Эмоциональный пульс</h3>
           <div className="h-48 w-full relative flex items-end justify-between gap-2 px-2">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                 <div className="border-t border-slate-500 w-full"></div>
                 <div className="border-t border-slate-500 w-full"></div>
                 <div className="border-t border-slate-500 w-full"></div>
              </div>
              
              {/* Bars */}
              {[30, 50, 45, 70, 60, 80, 55, 40, 65, 90].map((h, i) => (
                <div key={i} className="w-full bg-indigo-500/20 rounded-t-sm relative group">
                   <div 
                    style={{ height: `${h}%` }} 
                    className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-md group-hover:opacity-100 transition-all"
                   ></div>
                   {/* Tooltip mock */}
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      День {i+1}
                   </div>
                </div>
              ))}
           </div>
        </TiltCard>

        {/* Methods Spectrum */}
        <TiltCard className="glass-panel p-6 rounded-2xl bg-slate-900/60">
           <h3 className="text-lg font-bold text-slate-200 mb-6">Спектр методов</h3>
           <div className="space-y-4">
              <div>
                 <div className="flex justify-between text-sm mb-1">
                    <span className="text-indigo-300">Юнгианский анализ</span>
                    <span className="text-slate-400">60%</span>
                 </div>
                 <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[60%] bg-indigo-500 rounded-full"></div>
                 </div>
              </div>
              <div>
                 <div className="flex justify-between text-sm mb-1">
                    <span className="text-rose-300">Фрейдистский анализ</span>
                    <span className="text-slate-400">25%</span>
                 </div>
                 <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[25%] bg-rose-500 rounded-full"></div>
                 </div>
              </div>
              <div>
                 <div className="flex justify-between text-sm mb-1">
                    <span className="text-teal-300">Гештальт</span>
                    <span className="text-slate-400">15%</span>
                 </div>
                 <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[15%] bg-teal-500 rounded-full"></div>
                 </div>
              </div>
           </div>
        </TiltCard>
      </div>
    </div>
  );
};

export default Analytics;
