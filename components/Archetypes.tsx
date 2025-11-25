import React, { useState, useEffect } from 'react';
import TiltCard from './TiltCard';
import Button from './Button';
import { User as UserType, JournalEntry, AnalysisResponse } from '../types';
import { ARCHETYPES, Archetype, getArchetypeById } from '../constants/archetypes';
import { analyzeArchetypes, ArchetypeScores } from '../services/geminiService';
import {
  getJournalEntries,
  saveArchetypeProfile,
  loadArchetypeProfile,
  ArchetypeProfile
} from '../services/supabaseStorageService';
import {
  Sparkles, TrendingUp, Book, X, ChevronRight, Loader2
} from 'lucide-react';

interface ArchetypesProps {
  user: UserType | null;
}

const Archetypes: React.FC<ArchetypesProps> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [archetypeScores, setArchetypeScores] = useState<ArchetypeScores | null>(null);
  const [selectedArchetype, setSelectedArchetype] = useState<Archetype | null>(null);
  const [topArchetypes, setTopArchetypes] = useState<{ archetype: Archetype; score: number }[]>([]);

  // Load saved archetype profile on mount
  useEffect(() => {
    const loadSavedProfile = async () => {
      const savedProfile = await loadArchetypeProfile();
      if (savedProfile) {
        setArchetypeScores(savedProfile.scores);
        setTopArchetypes(savedProfile.topArchetypes);
      }
    };
    loadSavedProfile();
  }, []);

  // Analyze user's dream journal for archetypes
  const analyzeUserArchetypes = async () => {
    setLoading(true);
    try {
      const entries = await getJournalEntries();

      if (entries.length === 0) {
        alert('Для анализа архетипов нужен хотя бы один сохранённый сон');
        return;
      }

      // Aggregate archetype scores from all dreams
      const aggregatedScores: ArchetypeScores = {
        hero: 0,
        sage: 0,
        explorer: 0,
        rebel: 0,
        creator: 0,
        ruler: 0,
        magician: 0,
        lover: 0,
        caregiver: 0,
        jester: 0,
        everyman: 0,
        innocent: 0
      };

      // Analyze up to 10 most recent dreams to avoid rate limits
      const recentEntries = entries.slice(0, 10);

      for (const entry of recentEntries) {
        const dreamDescription = entry.dreamData.description;
        const dreamContext = `Эмоция: ${entry.dreamData.context.emotion}, Жизненная ситуация: ${entry.dreamData.context.lifeSituation}`;

        try {
          const scores = await analyzeArchetypes(dreamDescription, dreamContext);

          // Accumulate scores
          Object.keys(scores).forEach((key) => {
            aggregatedScores[key as keyof ArchetypeScores] += scores[key as keyof ArchetypeScores];
          });
        } catch (err) {
          console.error('Failed to analyze dream', err);
        }
      }

      // Average the scores
      const dreamCount = recentEntries.length;
      Object.keys(aggregatedScores).forEach((key) => {
        aggregatedScores[key as keyof ArchetypeScores] = Math.round(
          aggregatedScores[key as keyof ArchetypeScores] / dreamCount
        );
      });

      setArchetypeScores(aggregatedScores);

      // Calculate top 3 archetypes
      const sortedArchetypes = Object.entries(aggregatedScores)
        .map(([id, score]) => ({
          archetype: getArchetypeById(id)!,
          score
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      setTopArchetypes(sortedArchetypes);

      // Save profile to storage
      const profile: ArchetypeProfile = {
        scores: aggregatedScores,
        topArchetypes: sortedArchetypes,
        lastAnalyzed: Date.now(),
        analyzedDreamsCount: dreamCount
      };
      await saveArchetypeProfile(profile);

    } catch (error) {
      console.error('Analysis error:', error);
      alert('Ошибка при анализе архетипов');
    } finally {
      setLoading(false);
    }
  };

  // Common styles
  const sectionTitleStyle = "text-2xl font-serif font-bold text-white mb-6 flex items-center gap-3";
  const cardStyle = "bg-slate-950/50 border border-white/10 backdrop-blur-sm p-8";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-4xl font-serif font-bold text-white mb-3">
          Архетипы сновидений
        </h2>
        <p className="text-slate-400 text-lg max-w-3xl">
          Откройте глубинные паттерны вашего подсознания через призму 12 юнгианских архетипов.
          Каждый архетип представляет универсальный образ коллективного бессознательного.
        </p>
      </div>

      {/* Analysis Section */}
      {!archetypeScores ? (
        <TiltCard className={cardStyle}>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(99,102,241,0.4)]">
              <Sparkles size={48} className="text-white" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-white mb-3">
              Анализ архетипического профиля
            </h3>
            <p className="text-slate-400 mb-6 max-w-2xl">
              Проанализируйте ваши сохранённые сны, чтобы определить доминирующие архетипы в вашем подсознании.
              AI изучит символы, темы и эмоции ваших снов для создания персонального архетипического профиля.
            </p>
            <Button
              onClick={analyzeUserArchetypes}
              isLoading={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Анализирую сны...</span>
                </>
              ) : (
                <>
                  <TrendingUp size={20} />
                  <span>Создать профиль архетипов</span>
                </>
              )}
            </Button>
          </div>
        </TiltCard>
      ) : (
        <>
          {/* Top 3 Archetypes */}
          <div>
            <h3 className={sectionTitleStyle}>
              <Sparkles className="text-indigo-400" />
              Ваши доминирующие архетипы
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topArchetypes.map((item, index) => (
                <div
                  key={item.archetype.id}
                  className="bg-slate-950/50 border border-white/10 backdrop-blur-sm p-6 cursor-pointer hover:border-indigo-500/50 transition-all rounded-2xl"
                  onClick={() => {
                    console.log('Clicked top archetype:', item.archetype.name);
                    setSelectedArchetype(item.archetype);
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold"
                      style={{ backgroundColor: item.archetype.color + '30', color: item.archetype.color }}
                    >
                      {index + 1}
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-white">{item.score}</div>
                      <div className="text-xs text-slate-500">балл</div>
                    </div>
                  </div>
                  <h4 className="text-xl font-serif font-bold text-white mb-2">
                    {item.archetype.name}
                  </h4>
                  <p className="text-sm text-slate-400 mb-4 line-clamp-3">
                    {item.archetype.description}
                  </p>
                  <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium">
                    <span>Подробнее</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Radar Chart Placeholder */}
          <TiltCard className={cardStyle}>
            <h3 className="text-xl font-serif font-bold text-white mb-4">
              Полный профиль архетипов
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {ARCHETYPES.map((archetype) => {
                const score = archetypeScores[archetype.id as keyof ArchetypeScores];
                return (
                  <div
                    key={archetype.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-white/5 hover:border-white/20 transition-all cursor-pointer"
                    onClick={() => setSelectedArchetype(archetype)}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex-shrink-0"
                      style={{ backgroundColor: archetype.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {archetype.name}
                      </div>
                      <div className="text-xs text-slate-500">{score} баллов</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TiltCard>
        </>
      )}

      {/* Archetype Library */}
      <div>
        <h3 className={sectionTitleStyle}>
          <Book className="text-indigo-400" />
          Библиотека архетипов
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ARCHETYPES.map((archetype) => (
            <div
              key={archetype.id}
              className="bg-slate-950/50 border border-white/10 backdrop-blur-sm p-6 cursor-pointer hover:border-indigo-500/50 transition-all rounded-2xl"
              onClick={() => {
                console.log('Clicked archetype:', archetype.name);
                setSelectedArchetype(archetype);
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex-shrink-0"
                  style={{ backgroundColor: archetype.color }}
                />
                <h4 className="text-lg font-serif font-bold text-white">
                  {archetype.name}
                </h4>
              </div>
              <p className="text-sm text-slate-400 line-clamp-3 mb-4">
                {archetype.description}
              </p>
              <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium">
                <span>Изучить архетип</span>
                <ChevronRight size={16} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Archetype Detail Modal */}
      {selectedArchetype && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedArchetype(null)}
        >
          <div
            className="bg-slate-900 border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedArchetype(null)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={24} className="text-slate-400" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-full flex-shrink-0"
                style={{ backgroundColor: selectedArchetype.color }}
              />
              <div>
                <h3 className="text-3xl font-serif font-bold text-white">
                  {selectedArchetype.name}
                </h3>
                <p className="text-slate-400">{selectedArchetype.nameEn}</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-bold text-white mb-2">Описание</h4>
                <p className="text-slate-300">{selectedArchetype.description}</p>
              </div>

              {/* Traits */}
              <div>
                <h4 className="text-lg font-bold text-white mb-3">Ключевые черты</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedArchetype.traits.map((trait, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 rounded-full text-sm font-medium border"
                      style={{
                        backgroundColor: selectedArchetype.color + '20',
                        borderColor: selectedArchetype.color + '40',
                        color: selectedArchetype.color
                      }}
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              {/* Dream Symbols */}
              <div>
                <h4 className="text-lg font-bold text-white mb-3">Символы в снах</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedArchetype.dreamSymbols.map((symbol, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-300 text-sm border border-white/10"
                    >
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>

              {/* Light & Shadow */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/30">
                  <h4 className="text-lg font-bold text-emerald-400 mb-2">Светлая сторона</h4>
                  <p className="text-slate-300 text-sm">{selectedArchetype.lightSide}</p>
                </div>
                <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30">
                  <h4 className="text-lg font-bold text-red-400 mb-2">Теневая сторона</h4>
                  <p className="text-slate-300 text-sm">{selectedArchetype.shadowSide}</p>
                </div>
              </div>

              {/* Advice */}
              <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/30">
                <h4 className="text-lg font-bold text-indigo-400 mb-2">Рекомендации</h4>
                <p className="text-slate-300 text-sm">{selectedArchetype.advice}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Archetypes;
