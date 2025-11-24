
import React, { useState, useEffect } from 'react';
import TiltCard from './TiltCard';
import { Activity, BookOpen, Image, Calendar, Lightbulb, TrendingUp, Target, Sparkles } from 'lucide-react';
import { getTotalAnalyzedDreams } from '../services/statsService';
import { getJournalEntries } from '../services/supabaseStorageService';
import { JournalEntry, PsychMethod } from '../types';
import { PSYCH_METHODS } from '../constants';

interface Recommendation {
  icon: any;
  text: string;
  type: 'method' | 'streak' | 'emotion' | 'progress';
  color: string;
  bgColor: string;
}

/**
 * Генерирует умные рекомендации на основе данных пользователя
 */
const generateRecommendations = (entries: JournalEntry[]): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  if (entries.length === 0) {
    return [{
      icon: Sparkles,
      text: 'Начните свой путь самопознания - запишите первый сон!',
      type: 'progress',
      color: 'text-purple-300',
      bgColor: 'bg-purple-900/20'
    }];
  }

  // 1. Проверка неиспользованных методов
  const usedMethods = new Set(entries.map(e => e.dreamData.method));
  const unusedMethods = PSYCH_METHODS.filter(m =>
    m.id !== PsychMethod.AUTO && !usedMethods.has(m.id)
  );

  if (unusedMethods.length > 0) {
    const method = unusedMethods[0];
    recommendations.push({
      icon: method.icon,
      text: `Попробуйте ${method.name} - вы ещё не использовали этот подход!`,
      type: 'method',
      color: method.color,
      bgColor: method.bgColor
    });
  }

  // 2. Проверка серии записей (streak)
  const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);
  let consecutiveDays = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedEntries.length; i++) {
    const entryDate = new Date(sortedEntries[i].timestamp);
    entryDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff === consecutiveDays) {
      consecutiveDays++;
    } else {
      break;
    }
  }

  if (consecutiveDays >= 3) {
    recommendations.push({
      icon: TrendingUp,
      text: `Отличная работа! Вы записываете сны уже ${consecutiveDays} ${consecutiveDays === 3 || consecutiveDays === 4 ? 'дня' : 'дней'} подряд! Продолжайте!`,
      type: 'streak',
      color: 'text-emerald-300',
      bgColor: 'bg-emerald-900/20'
    });
  }

  // 3. Анализ частых эмоций (тревога/стресс)
  const emotions = entries.map(e => e.dreamData.context.emotion.toLowerCase());
  const anxietyCount = emotions.filter(em =>
    em.includes('тревог') || em.includes('страх') || em.includes('стресс')
  ).length;

  if (anxietyCount >= entries.length * 0.5 && entries.length >= 3) {
    recommendations.push({
      icon: Target,
      text: 'Ваши сны часто содержат тревогу - возможно, стоит обратить внимание на уровень стресса в жизни',
      type: 'emotion',
      color: 'text-amber-300',
      bgColor: 'bg-amber-900/20'
    });
  }

  // 4. Поощрение прогресса
  if (entries.length >= 5 && entries.length < 10) {
    recommendations.push({
      icon: Lightbulb,
      text: `У вас уже ${entries.length} записей! Продолжайте вести дневник для более глубокого понимания паттернов`,
      type: 'progress',
      color: 'text-indigo-300',
      bgColor: 'bg-indigo-900/20'
    });
  } else if (entries.length >= 10) {
    recommendations.push({
      icon: Sparkles,
      text: `Впечатляющий прогресс! ${entries.length} записей - вы серьёзно подходите к самоанализу!`,
      type: 'progress',
      color: 'text-purple-300',
      bgColor: 'bg-purple-900/20'
    });
  }

  return recommendations.slice(0, 3); // Максимум 3 рекомендации
};

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [totalAnalyzed, setTotalAnalyzed] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [visualizationsCount, setVisualizationsCount] = useState(0);
  const [daysOfJournaling, setDaysOfJournaling] = useState(0);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Get total analyzed dreams from stats service
        const analyzed = getTotalAnalyzedDreams();
        setTotalAnalyzed(analyzed);

        // Get journal entries
        const entries: JournalEntry[] = await getJournalEntries();
        setSavedCount(entries.length);

        // Count entries with images
        const withImages = entries.filter(entry => entry.imageUrl).length;
        setVisualizationsCount(withImages);

        // Calculate days of journaling (from first to last entry)
        if (entries.length > 0) {
          const timestamps = entries.map(e => e.timestamp).sort((a, b) => a - b);
          const firstDate = timestamps[0];
          const lastDate = timestamps[timestamps.length - 1];
          const days = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1;
          setDaysOfJournaling(days);
        }

        // Generate recommendations
        const recs = generateRecommendations(entries);
        setRecommendations(recs);

      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

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
             <Activity size={14} className="text-indigo-400"/> Проанализировано
           </div>
           {loading ? (
             <div className="text-2xl font-serif text-slate-600">...</div>
           ) : (
             <>
               <div className="text-3xl font-serif text-white">{totalAnalyzed}</div>
               <div className="text-xs text-indigo-400 mt-1">всего снов</div>
             </>
           )}
        </TiltCard>

        <TiltCard className="glass-panel p-4 rounded-xl bg-slate-900/60">
           <div className="text-slate-500 text-xs uppercase font-bold mb-2 flex items-center gap-2">
             <BookOpen size={14} className="text-emerald-400"/> Сохранено
           </div>
           {loading ? (
             <div className="text-2xl font-serif text-slate-600">...</div>
           ) : (
             <>
               <div className="text-3xl font-serif text-white">{savedCount}</div>
               <div className="text-xs text-emerald-400 mt-1">в журнале</div>
             </>
           )}
        </TiltCard>

        <TiltCard className="glass-panel p-4 rounded-xl bg-slate-900/60">
           <div className="text-slate-500 text-xs uppercase font-bold mb-2 flex items-center gap-2">
             <Image size={14} className="text-purple-400"/> Визуализаций
           </div>
           {loading ? (
             <div className="text-2xl font-serif text-slate-600">...</div>
           ) : (
             <>
               <div className="text-3xl font-serif text-white">{visualizationsCount}</div>
               <div className="text-xs text-purple-400 mt-1">создано</div>
             </>
           )}
        </TiltCard>

        <TiltCard className="glass-panel p-4 rounded-xl bg-slate-900/60">
           <div className="text-slate-500 text-xs uppercase font-bold mb-2 flex items-center gap-2">
             <Calendar size={14} className="text-amber-400"/> Дней ведения
           </div>
           {loading ? (
             <div className="text-2xl font-serif text-slate-600">...</div>
           ) : (
             <>
               <div className="text-3xl font-serif text-white">{daysOfJournaling}</div>
               <div className="text-xs text-amber-400 mt-1">дневник</div>
             </>
           )}
        </TiltCard>
      </div>

      {/* Recommendations Section */}
      {!loading && recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-serif font-bold text-white mb-4 flex items-center gap-2">
            <Lightbulb size={20} className="text-amber-400" />
            Рекомендации для вас
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, idx) => {
              const Icon = rec.icon;
              return (
                <TiltCard
                  key={idx}
                  className={`${rec.bgColor} border border-slate-700/40 p-5 rounded-xl hover:border-slate-600/60 transition-all duration-300`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 ${rec.bgColor} rounded-lg flex items-center justify-center border border-slate-700/40`}>
                      <Icon size={20} className={rec.color} />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-200 text-sm leading-relaxed">
                        {rec.text}
                      </p>
                    </div>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </div>
      )}

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
