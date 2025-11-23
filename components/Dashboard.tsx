
import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, Brain, Calendar, ArrowRight } from 'lucide-react';
import TiltCard from './TiltCard';
import { AppView, User, JournalEntry } from '../types';
import { getJournalEntries } from '../services/supabaseStorageService';

interface DashboardProps {
  onNavigate: (view: AppView) => void;
  user: User | null;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, user }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEntries = async () => {
      try {
        const loadedEntries = await getJournalEntries();
        setEntries(loadedEntries);
      } catch (error) {
        console.error('Error loading entries:', error);
      } finally {
        setLoading(false);
      }
    };
    loadEntries();
  }, []);
  return (
    <div className="animate-fade-in space-y-8">
      
      {/* --- HERO SECTION --- */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 border border-indigo-500/20 shadow-2xl p-5 md:p-6">
         {/* Background FX */}
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full filter blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full filter blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

         <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
               <div className="flex items-center gap-2 mb-2">
                 <Sparkles size={16} className="text-amber-300 animate-pulse" />
                 <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Подсознание активно</span>
               </div>
               <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-2 leading-tight">
                 Добрый вечер{user ? `, ${user.email.split('@')[0]}` : ''}!
               </h2>
               <p className="text-indigo-100/80 text-lg max-w-xl mb-4">
                 {entries.length > 0
                   ? 'Ваше последнее сновидение содержало сильные архетипические образы. Готовы исследовать их значение?'
                   : 'Начните вести дневник снов и получайте персональные инсайты о вашем подсознании.'
                 }
               </p>
               
               <div className="flex flex-wrap gap-3">
                 <button
                   onClick={() => onNavigate('wizard')}
                   className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-2.5 rounded-lg font-bold shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all active:scale-95 flex items-center gap-2"
                 >
                   <Plus size={18} />
                   Растолковать новый сон
                 </button>
                 {entries.length > 0 && (
                   <div className="px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-indigo-200 text-sm flex items-center">
                     {entries.length} {entries.length === 1 ? 'сон' : entries.length < 5 ? 'сна' : 'снов'} в дневнике
                   </div>
                 )}
               </div>
            </div>
         </div>
      </div>

      {/* --- WIDGETS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         
         {/* Quick Insight */}
         <TiltCard className="md:col-span-1 glass-panel p-6 rounded-2xl border-t-4 border-t-amber-400 bg-slate-900/60">
            <div className="flex items-center gap-2 mb-4">
               <Brain className="text-amber-400" size={20}/>
               <h3 className="font-bold text-slate-200 uppercase tracking-widest text-xs">Инсайт дня</h3>
            </div>
            <p className="text-lg font-serif italic text-slate-100 leading-relaxed mb-4">
              "Вода в ваших снах последнее время стала прозрачнее. Это знак того, что эмоции становятся более осознанными."
            </p>
            <button 
               onClick={() => onNavigate('analytics')}
               className="text-amber-400 hover:text-amber-300 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              Смотреть аналитику <ArrowRight size={14}/>
            </button>
         </TiltCard>

         {/* Awareness Level */}
         <TiltCard className="md:col-span-1 glass-panel p-6 rounded-2xl border-t-4 border-t-indigo-500 bg-slate-900/60">
             <div className="flex justify-between items-start mb-2">
                <div>
                   <h3 className="font-bold text-slate-200 uppercase tracking-widest text-xs mb-1">Уровень осознанности</h3>
                   <span className="text-sm text-slate-400">Прогресс уровня</span>
                </div>
                <span className="px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded text-xs font-bold border border-indigo-500/30">ИССЛЕДОВАТЕЛЬ</span>
             </div>
             
             <div className="text-right text-xs text-slate-400 mb-2">{entries.length} / 10 снов</div>
             <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-6">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-500"
                  style={{ width: `${Math.min((entries.length / 10) * 100, 100)}%` }}
                ></div>
             </div>

             <button className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-600/20 to-amber-500/20 border border-amber-500/30 text-amber-200 font-bold text-sm hover:bg-amber-500/30 transition-all flex items-center justify-center gap-2">
                <Sparkles size={16} /> Разблокировать Premium
             </button>
         </TiltCard>

         {/* Calendar Placeholder */}
         <TiltCard className="md:col-span-1 glass-panel p-6 rounded-2xl border-t-4 border-t-emerald-500 bg-slate-900/60 flex flex-col items-center justify-center text-center">
             <div className="w-12 h-12 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400 mb-3">
                <Calendar size={24} />
             </div>
             <h3 className="font-bold text-slate-200 mb-1">Календарь снов</h3>
             <p className="text-slate-500 text-xs">Визуализация частоты ваших сновидений скоро появится.</p>
         </TiltCard>

      </div>

      {/* --- RECENT DREAMS --- */}
      <div>
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-2xl font-serif font-bold text-white">Последние сны</h3>
           <button
             onClick={() => onNavigate('journal')}
             className="text-slate-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
           >
             Показать все <ArrowRight size={14}/>
           </button>
        </div>

        {loading ? (
          <div className="glass-panel border border-dashed border-slate-800 rounded-xl p-12 text-center">
            <p className="text-slate-500">Загрузка...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="glass-panel border border-dashed border-slate-800 rounded-xl p-12 text-center">
            <p className="text-slate-500">У вас пока нет записей. Самое время начать!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.slice(0, 3).map((entry) => {
              const date = new Date(entry.timestamp);
              const dreamText = entry.dreamData.description.substring(0, 150) + (entry.dreamData.description.length > 150 ? '...' : '');

              return (
                <TiltCard
                  key={entry.id}
                  className="glass-panel p-5 rounded-xl border border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer"
                  onClick={() => onNavigate('journal')}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-white text-lg mb-1">
                        {date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-medium border border-indigo-500/30">
                      {entry.dreamData.method === 'jungian' ? 'Юнгианский' :
                       entry.dreamData.method === 'freudian' ? 'Фрейдовский' :
                       entry.dreamData.method === 'gestalt' ? 'Гештальт' :
                       entry.dreamData.method === 'cognitive' ? 'Когнитивный' :
                       entry.dreamData.method === 'existential' ? 'Экзистенциальный' :
                       'Авто'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {dreamText}
                  </p>
                </TiltCard>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
