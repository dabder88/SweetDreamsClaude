
import React, { useState, useEffect } from 'react';
import TiltCard from './TiltCard';
import Tooltip from './Tooltip';
import { Activity, BookOpen, Image, Calendar, Lightbulb, TrendingUp, Target, Sparkles, Award, Lock } from 'lucide-react';
import { getTotalAnalyzedDreams, getMethodUsage, getEmotionHistory, getSymbolFrequency, getUnlockedAchievements, unlockAchievement, EmotionRecord, SymbolFrequency } from '../services/statsService';
import { getJournalEntries } from '../services/supabaseStorageService';
import { JournalEntry, PsychMethod } from '../types';
import { PSYCH_METHODS } from '../constants';
import { ACHIEVEMENTS, Achievement } from '../constants/achievements';

interface Recommendation {
  icon: any;
  text: string;
  type: 'method' | 'streak' | 'emotion' | 'progress';
  color: string;
  bgColor: string;
}

interface MethodStat {
  methodId: PsychMethod;
  methodName: string;
  count: number;
  percentage: number;
  color: string;
  icon: any;
}

interface EmotionStat {
  emotion: string;
  count: number;
  percentage: number;
  color: string;
}

interface InsightStats {
  recurringPercentage: number;
  recurringCount: number;
  bestTimeToRecord: string;
  avgDescriptionLength: number;
  longestDream: {
    length: number;
    date: string;
  } | null;
}

interface SymbolStat {
  symbol: string;
  count: number;
  percentage: number;
}

/**
 * Генерирует умные рекомендации на основе данных пользователя
 */
const generateRecommendations = (entries: JournalEntry[], totalAnalyzed: number): Recommendation[] => {
  const recommendations: Recommendation[] = [];

  // Если нет сохранённых записей, но есть проанализированные сны
  if (entries.length === 0 && totalAnalyzed > 0) {
    return [{
      icon: BookOpen,
      text: `Вы проанализировали ${totalAnalyzed} ${totalAnalyzed === 1 ? 'сон' : 'снов'}, но не сохранили ${totalAnalyzed === 1 ? 'его' : 'их'} в журнал. Сохраняйте толкования, чтобы отслеживать паттерны!`,
      type: 'progress',
      color: 'text-amber-300',
      bgColor: 'bg-amber-900/20'
    }];
  }

  // Если вообще ничего нет
  if (entries.length === 0 && totalAnalyzed === 0) {
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

  // 4. Проверка на несохранённые анализы
  const unsavedCount = totalAnalyzed - entries.length;
  if (unsavedCount >= 3) {
    recommendations.push({
      icon: BookOpen,
      text: `У вас ${unsavedCount} несохранённых ${unsavedCount >= 5 ? 'анализов' : 'анализа'}! Сохраняйте толкования в журнал для отслеживания паттернов`,
      type: 'progress',
      color: 'text-amber-300',
      bgColor: 'bg-amber-900/20'
    });
  }

  // 5. Поощрение прогресса
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
  const [methodStats, setMethodStats] = useState<MethodStat[]>([]);
  const [emotionStats, setEmotionStats] = useState<EmotionStat[]>([]);
  const [insights, setInsights] = useState<InsightStats>({
    recurringPercentage: 0,
    recurringCount: 0,
    bestTimeToRecord: 'N/A',
    avgDescriptionLength: 0,
    longestDream: null
  });
  const [symbolStats, setSymbolStats] = useState<SymbolStat[]>([]);
  const [achievements, setAchievements] = useState<{ achievement: Achievement; unlocked: boolean }[]>([]);

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

        // Calculate method statistics from ALL analyzed dreams (not just saved ones)
        const allMethodUsage = getMethodUsage();
        const totalMethodCount = Object.values(allMethodUsage).reduce((sum, count) => sum + count, 0);

        const methodStatsData: MethodStat[] = Object.entries(allMethodUsage)
          .map(([methodId, count]) => {
            const methodInfo = PSYCH_METHODS.find(m => m.id === methodId);
            return {
              methodId: methodId as PsychMethod,
              methodName: methodInfo?.name || methodId,
              count,
              percentage: totalMethodCount > 0 ? (count / totalMethodCount) * 100 : 0,
              color: methodInfo?.color || 'text-slate-300',
              icon: methodInfo?.icon || Activity
            };
          })
          .sort((a, b) => b.count - a.count); // Сортировка по убыванию

        setMethodStats(methodStatsData);

        // Calculate emotion statistics from ALL analyzed dreams
        const emotionHistory = getEmotionHistory();
        const emotionCounts = new Map<string, number>();

        emotionHistory.forEach(record => {
          const emotion = record.emotion;
          emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1);
        });

        const totalEmotions = emotionHistory.length;

        // Color mapping for emotions
        const emotionColors: { [key: string]: string } = {
          'Тревога/Страх': 'text-red-400',
          'Радость/Экстаз': 'text-yellow-400',
          'Замешательство': 'text-purple-400',
          'Грусть/Горе': 'text-blue-400',
          'Гнев': 'text-orange-400',
          'Покой/Облегчение': 'text-green-400',
          'Стыд/Вина': 'text-pink-400'
        };

        const emotionStatsData: EmotionStat[] = Array.from(emotionCounts.entries())
          .map(([emotion, count]) => ({
            emotion,
            count,
            percentage: totalEmotions > 0 ? (count / totalEmotions) * 100 : 0,
            color: emotionColors[emotion] || 'text-slate-400'
          }))
          .sort((a, b) => b.count - a.count);

        setEmotionStats(emotionStatsData);

        // Calculate symbol statistics from ALL analyzed dreams
        const symbolFrequency = getSymbolFrequency();
        const totalSymbols = Object.values(symbolFrequency).reduce((sum, count) => sum + count, 0);

        const symbolStatsData: SymbolStat[] = Object.entries(symbolFrequency)
          .map(([symbol, count]) => ({
            symbol,
            count,
            percentage: totalSymbols > 0 ? (count / totalSymbols) * 100 : 0
          }))
          .sort((a, b) => b.count - a.count);

        setSymbolStats(symbolStatsData);

        // Calculate insights and patterns
        if (entries.length > 0) {
          // 1. Recurring dreams percentage
          const recurringDreams = entries.filter(e => e.dreamData.context.recurring);
          const recurringCount = recurringDreams.length;
          const recurringPercentage = (recurringCount / entries.length) * 100;

          // 2. Best time to record (time of day analysis)
          const timeSlots = { morning: 0, afternoon: 0, evening: 0, night: 0 };
          entries.forEach(entry => {
            const hour = new Date(entry.timestamp).getHours();
            if (hour >= 6 && hour < 12) timeSlots.morning++;
            else if (hour >= 12 && hour < 18) timeSlots.afternoon++;
            else if (hour >= 18 && hour < 22) timeSlots.evening++;
            else timeSlots.night++;
          });

          const maxSlot = Object.entries(timeSlots).reduce((a, b) => a[1] > b[1] ? a : b);
          const timeLabels: { [key: string]: string } = {
            morning: 'Утро (6:00-12:00)',
            afternoon: 'День (12:00-18:00)',
            evening: 'Вечер (18:00-22:00)',
            night: 'Ночь (22:00-6:00)'
          };
          const bestTime = timeLabels[maxSlot[0]];

          // 3. Average description length
          const totalLength = entries.reduce((sum, e) => sum + e.dreamData.description.length, 0);
          const avgLength = Math.round(totalLength / entries.length);

          // 4. Longest dream
          const longest = entries.reduce((max, e) =>
            e.dreamData.description.length > max.length
              ? { length: e.dreamData.description.length, date: new Date(e.timestamp).toLocaleDateString('ru-RU') }
              : max
          , { length: 0, date: '' });

          setInsights({
            recurringPercentage,
            recurringCount,
            bestTimeToRecord: bestTime,
            avgDescriptionLength: avgLength,
            longestDream: longest.length > 0 ? longest : null
          });
        }

        // Generate recommendations
        const recs = generateRecommendations(entries, analyzed);
        setRecommendations(recs);

        // Check and unlock achievements
        const stats = {
          totalAnalyzedDreams: analyzed,
          methodUsage: allMethodUsage,
          emotionHistory,
          symbolFrequency
        };

        const unlockedIds = getUnlockedAchievements();
        const achievementData = ACHIEVEMENTS.map(achievement => {
          const isUnlocked = unlockedIds.includes(achievement.id);
          const meetsCondition = achievement.condition(stats, entries);

          // Auto-unlock if condition is met but not yet unlocked
          if (meetsCondition && !isUnlocked) {
            unlockAchievement(achievement.id);
            return { achievement, unlocked: true };
          }

          return { achievement, unlocked: isUnlocked };
        });

        setAchievements(achievementData);

        console.log('📊 Analytics loaded:', {
          analyzed,
          entriesCount: entries.length,
          recommendations: recs.length,
          methods: methodStatsData.length,
          unlockedAchievements: achievementData.filter(a => a.unlocked).length
        });

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
        <Tooltip content="Общее количество снов, которые вы проанализировали с помощью ИИ, включая несохранённые" position="bottom">
          <TiltCard className="glass-panel p-4 rounded-xl bg-slate-900/60 cursor-help">
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
        </Tooltip>

        <Tooltip content="Количество снов, сохранённых в вашем журнале для долгосрочного отслеживания" position="bottom">
          <TiltCard className="glass-panel p-4 rounded-xl bg-slate-900/60 cursor-help">
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
        </Tooltip>

        <Tooltip content="Количество AI-визуализаций, созданных для ваших снов" position="bottom">
          <TiltCard className="glass-panel p-4 rounded-xl bg-slate-900/60 cursor-help">
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
        </Tooltip>

        <Tooltip content="Сколько дней прошло с вашей первой записи до последней в журнале" position="bottom">
          <TiltCard className="glass-panel p-4 rounded-xl bg-slate-900/60 cursor-help">
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
        </Tooltip>
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

        {/* Emotional Map */}
        <TiltCard className="glass-panel p-6 rounded-2xl bg-slate-900/60">
           <div className="flex items-center gap-2 mb-6">
             <h3 className="text-lg font-bold text-slate-200">Эмоциональная карта</h3>
             <Tooltip content="Топ-5 эмоций из всех ваших анализов. Показывает эмоциональные паттерны подсознания" position="right">
               <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-bold cursor-help hover:bg-slate-600 transition-colors">
                 ?
               </div>
             </Tooltip>
           </div>

           {loading || emotionStats.length === 0 ? (
             <div className="flex items-center justify-center h-48 text-slate-500">
               {loading ? '...' : 'Нет данных об эмоциях'}
             </div>
           ) : (
             <div className="space-y-4">
               {/* Top 5 Emotions */}
               <div className="space-y-3">
                 {emotionStats.slice(0, 5).map((stat, idx) => (
                   <div key={idx} className="space-y-2">
                     <div className="flex items-center justify-between text-sm">
                       <span className={`font-medium ${stat.color}`}>{stat.emotion}</span>
                       <div className="flex items-center gap-2">
                         <span className="text-slate-400">{stat.count} {stat.count === 1 ? 'раз' : 'раз'}</span>
                         <span className="text-white font-bold">{stat.percentage.toFixed(0)}%</span>
                       </div>
                     </div>
                     {/* Progress bar */}
                     <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                       <div
                         className={`h-full rounded-full transition-all duration-500 ${
                           stat.emotion === 'Тревога/Страх' ? 'bg-red-500' :
                           stat.emotion === 'Радость/Экстаз' ? 'bg-yellow-500' :
                           stat.emotion === 'Замешательство' ? 'bg-purple-500' :
                           stat.emotion === 'Грусть/Горе' ? 'bg-blue-500' :
                           stat.emotion === 'Гнев' ? 'bg-orange-500' :
                           stat.emotion === 'Покой/Облегчение' ? 'bg-green-500' :
                           stat.emotion === 'Стыд/Вина' ? 'bg-pink-500' :
                           'bg-slate-500'
                         }`}
                         style={{ width: `${stat.percentage}%` }}
                       ></div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
           )}
        </TiltCard>

        {/* Methods Analysis */}
        <TiltCard className="glass-panel p-6 rounded-2xl bg-slate-900/60">
           <div className="flex items-center gap-2 mb-6">
             <h3 className="text-lg font-bold text-slate-200">Анализ по методам</h3>
             <Tooltip content="Статистика использования психологических методов. Помогает понять, какие подходы вы предпочитаете" position="right">
               <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-bold cursor-help hover:bg-slate-600 transition-colors">
                 ?
               </div>
             </Tooltip>
           </div>

           {loading || methodStats.length === 0 ? (
             <div className="flex items-center justify-center h-48 text-slate-500">
               {loading ? '...' : 'Нет данных о методах'}
             </div>
           ) : (
             <div className="space-y-6">
               {/* Simple Pie Chart Visualization */}
               <div className="flex items-center justify-center">
                 <div className="relative w-48 h-48">
                   <svg viewBox="0 0 200 200" className="transform -rotate-90">
                     {(() => {
                       let currentAngle = 0;
                       const colors = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6'];

                       return methodStats.map((stat, idx) => {
                         const angle = (stat.percentage / 100) * 360;
                         const startAngle = currentAngle;
                         currentAngle += angle;

                         // Convert to radians
                         const startRad = (startAngle * Math.PI) / 180;
                         const endRad = (currentAngle * Math.PI) / 180;

                         // Calculate path
                         const x1 = 100 + 80 * Math.cos(startRad);
                         const y1 = 100 + 80 * Math.sin(startRad);
                         const x2 = 100 + 80 * Math.cos(endRad);
                         const y2 = 100 + 80 * Math.sin(endRad);

                         const largeArc = angle > 180 ? 1 : 0;

                         return (
                           <path
                             key={idx}
                             d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                             fill={colors[idx % colors.length]}
                             opacity="0.8"
                             className="hover:opacity-100 transition-opacity"
                           />
                         );
                       });
                     })()}
                     {/* Center circle */}
                     <circle cx="100" cy="100" r="50" fill="#0f172a" />
                   </svg>
                 </div>
               </div>

               {/* Top 3 Methods List */}
               <div className="space-y-3">
                 <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Топ-3 метода</h4>
                 {methodStats.slice(0, 3).map((stat, idx) => {
                   const Icon = stat.icon;
                   return (
                     <div key={idx} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                       <div className="flex items-center gap-3">
                         <div className="flex items-center justify-center w-8 h-8 bg-slate-900 rounded-lg">
                           <span className="text-lg font-bold text-indigo-400">#{idx + 1}</span>
                         </div>
                         <Icon size={18} className={stat.color} />
                         <span className="text-slate-200 font-medium">{stat.methodName}</span>
                       </div>
                       <div className="flex items-center gap-3">
                         <span className="text-slate-400 text-sm">{stat.count} {stat.count === 1 ? 'сон' : 'снов'}</span>
                         <span className="text-indigo-300 font-bold">{stat.percentage.toFixed(0)}%</span>
                       </div>
                     </div>
                   );
                 })}
               </div>
             </div>
           )}
        </TiltCard>
      </div>

      {/* Insights and Patterns Section */}
      {!loading && savedCount > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-serif font-bold text-white mb-4 flex items-center gap-2">
            <Lightbulb size={20} className="text-indigo-400" />
            Инсайты и паттерны
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recurring Dreams */}
            <Tooltip content="Процент снов, которые повторяются. Высокий процент может указывать на важные жизненные темы" position="top">
              <TiltCard className="glass-panel p-5 rounded-xl bg-slate-900/60 border border-slate-700/50 cursor-help">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Activity size={20} className="text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Повторяющиеся</div>
                    <div className="text-2xl font-bold text-white">{insights.recurringPercentage.toFixed(0)}%</div>
                    <div className="text-xs text-slate-400 mt-1">{insights.recurringCount} {insights.recurringCount === 1 ? 'сон' : 'снов'}</div>
                  </div>
                </div>
              </TiltCard>
            </Tooltip>

            {/* Best Time to Record */}
            <Tooltip content="Время суток, когда вы чаще всего записываете сны. Помогает найти оптимальный режим" position="top">
              <TiltCard className="glass-panel p-5 rounded-xl bg-slate-900/60 border border-slate-700/50 cursor-help">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <Calendar size={20} className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Лучшее время</div>
                    <div className="text-sm font-bold text-white leading-tight">{insights.bestTimeToRecord}</div>
                    <div className="text-xs text-slate-400 mt-1">для записи снов</div>
                  </div>
                </div>
              </TiltCard>
            </Tooltip>

            {/* Average Description Length */}
            <Tooltip content="Средняя длина описания ваших снов. Более детальные описания ведут к более глубокому анализу" position="top">
              <TiltCard className="glass-panel p-5 rounded-xl bg-slate-900/60 border border-slate-700/50 cursor-help">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <BookOpen size={20} className="text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Средняя длина</div>
                    <div className="text-2xl font-bold text-white">{insights.avgDescriptionLength}</div>
                    <div className="text-xs text-slate-400 mt-1">символов</div>
                  </div>
                </div>
              </TiltCard>
            </Tooltip>

            {/* Longest Dream */}
            <Tooltip content="Ваш самый подробный сон. Обычно длинные описания содержат богатый символический материал" position="top">
              <TiltCard className="glass-panel p-5 rounded-xl bg-slate-900/60 border border-slate-700/50 cursor-help">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-amber-900/30 rounded-lg flex items-center justify-center">
                    <Target size={20} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">Самый длинный</div>
                    {insights.longestDream ? (
                      <>
                        <div className="text-2xl font-bold text-white">{insights.longestDream.length}</div>
                        <div className="text-xs text-slate-400 mt-1">{insights.longestDream.date}</div>
                      </>
                    ) : (
                      <div className="text-sm text-slate-500">Нет данных</div>
                    )}
                  </div>
                </div>
              </TiltCard>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Symbolism and Themes Section */}
      {!loading && symbolStats.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-serif font-bold text-white">Символика и темы</h3>
            <Tooltip content="Самые частые символы из всех проанализированных снов. Показывает повторяющиеся темы подсознания" position="right">
              <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-bold cursor-help hover:bg-slate-600 transition-colors">
                ?
              </div>
            </Tooltip>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Symbol Cloud */}
            <TiltCard className="glass-panel p-6 rounded-2xl bg-slate-900/60">
              <h4 className="text-md font-bold text-slate-300 mb-4 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-400" />
                Облако символов
              </h4>

              {symbolStats.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-slate-500">
                  Нет данных о символах
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 justify-center items-center min-h-[200px] p-4">
                  {symbolStats.slice(0, 20).map((stat, idx) => {
                    // Calculate font size based on frequency (12px to 32px)
                    const minSize = 12;
                    const maxSize = 32;
                    const maxCount = symbolStats[0].count;
                    const fontSize = minSize + ((stat.count / maxCount) * (maxSize - minSize));

                    // Color variation based on frequency
                    const colors = [
                      'text-indigo-300',
                      'text-purple-300',
                      'text-pink-300',
                      'text-blue-300',
                      'text-cyan-300',
                      'text-teal-300',
                      'text-emerald-300',
                      'text-amber-300'
                    ];
                    const color = colors[idx % colors.length];

                    return (
                      <Tooltip
                        key={idx}
                        content={`${stat.symbol}: ${stat.count} раз (${stat.percentage.toFixed(1)}%)`}
                        position="top"
                      >
                        <span
                          className={`${color} font-serif font-bold cursor-help hover:scale-110 transition-transform duration-200`}
                          style={{ fontSize: `${fontSize}px` }}
                        >
                          {stat.symbol}
                        </span>
                      </Tooltip>
                    );
                  })}
                </div>
              )}
            </TiltCard>

            {/* Top Symbols List */}
            <TiltCard className="glass-panel p-6 rounded-2xl bg-slate-900/60">
              <h4 className="text-md font-bold text-slate-300 mb-4 flex items-center gap-2">
                <Target size={16} className="text-amber-400" />
                Топ-10 символов
              </h4>

              <div className="space-y-3">
                {symbolStats.slice(0, 10).map((stat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-8 h-8 bg-slate-900 rounded-lg flex-shrink-0">
                        <span className="text-sm font-bold text-indigo-400">#{idx + 1}</span>
                      </div>
                      <span className="text-slate-200 font-medium truncate">{stat.symbol}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-slate-400 text-sm">{stat.count} {stat.count === 1 ? 'раз' : 'раз'}</span>
                      <span className="text-indigo-300 font-bold min-w-[40px] text-right">{stat.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </TiltCard>
          </div>
        </div>
      )}

      {/* Achievements Section */}
      {!loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-xl font-serif font-bold text-white">Персональные достижения</h3>
            <Tooltip content="Разблокируйте достижения, продолжая вести дневник снов и исследовать своё подсознание" position="right">
              <div className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 text-xs font-bold cursor-help hover:bg-slate-600 transition-colors">
                ?
              </div>
            </Tooltip>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="text-slate-400 text-sm">
              Разблокировано: <span className="text-white font-bold">{achievements.filter(a => a.unlocked).length}</span> из <span className="text-white font-bold">{achievements.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 transition-all duration-500"
                  style={{ width: `${(achievements.filter(a => a.unlocked).length / achievements.length) * 100}%` }}
                />
              </div>
              <span className="text-amber-400 font-bold text-sm">
                {Math.round((achievements.filter(a => a.unlocked).length / achievements.length) * 100)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map(({ achievement, unlocked }, idx) => {
              const Icon = achievement.icon;
              return (
                <Tooltip
                  key={idx}
                  content={achievement.description}
                  position="top"
                >
                  <TiltCard
                    className={`p-5 rounded-xl border transition-all duration-300 ${
                      unlocked
                        ? `${achievement.bgColor} ${achievement.borderColor} hover:border-opacity-60`
                        : 'bg-slate-900/40 border-slate-800 opacity-60 grayscale'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center ${
                          unlocked ? achievement.bgColor : 'bg-slate-800'
                        } border-2 ${unlocked ? achievement.borderColor : 'border-slate-700'}`}
                      >
                        {unlocked ? (
                          <Icon size={32} className={achievement.color} />
                        ) : (
                          <Lock size={32} className="text-slate-600" />
                        )}
                      </div>

                      <div>
                        <h4 className={`font-bold text-sm mb-1 ${unlocked ? 'text-white' : 'text-slate-500'}`}>
                          {achievement.name}
                        </h4>
                        <p className={`text-xs ${unlocked ? 'text-slate-400' : 'text-slate-600'}`}>
                          {achievement.description}
                        </p>
                      </div>

                      {unlocked && (
                        <div className="mt-2 flex items-center gap-1">
                          <Award size={14} className="text-amber-400" />
                          <span className="text-xs text-amber-400 font-bold">Разблокировано</span>
                        </div>
                      )}
                    </div>
                  </TiltCard>
                </Tooltip>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
