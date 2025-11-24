import React, { useState, useEffect } from 'react';
import { JournalEntry, AnalysisResponse } from '../types';
import { getJournalEntries, deleteJournalEntry } from '../services/supabaseStorageService';
import { Trash2, Calendar, BookOpen, Filter, Eye, Sparkles } from 'lucide-react';
import { PSYCH_METHODS, PREBUILT_EMOTIONS } from '../constants';
import TiltCard from './TiltCard';

interface DreamJournalProps {
  onViewDream: (entry: JournalEntry) => void;
}

const DreamJournal: React.FC<DreamJournalProps> = ({ onViewDream }) => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterEmotion, setFilterEmotion] = useState<string>('all');

  useEffect(() => {
    const loadEntries = async () => {
      const loadedEntries = await getJournalEntries();
      setEntries(loadedEntries);
    };
    loadEntries();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      const success = await deleteJournalEntry(id);
      if (success) {
        setEntries(entries.filter(entry => entry.id !== id));
      }
    }
  };

  const filteredEntries = entries.filter(entry => {
    const methodMatch = filterMethod === 'all' || entry.dreamData.method === filterMethod;
    const emotionMatch = filterEmotion === 'all' || entry.dreamData.context.emotion === filterEmotion;
    return methodMatch && emotionMatch;
  });

  const getMethodName = (id: string) => {
    return PSYCH_METHODS.find(m => m.id === id)?.name || id;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper to check if analysis is the new structured object or legacy string
  const isStructured = (analysis: any): analysis is AnalysisResponse => {
    return typeof analysis === 'object' && analysis !== null && 'summary' in analysis;
  };

  // Get summary text for preview
  const getSummary = (entry: JournalEntry): string => {
    if (isStructured(entry.analysis)) {
      return entry.analysis.summary;
    }
    // For legacy string analysis, extract first few sentences
    const text = entry.analysis as string;
    const sentences = text.split(/[.!?]\s+/);
    return sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '...' : '');
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-100">Журнал снов</h2>
          <p className="text-slate-400 mt-1 text-sm">Хроники подсознания</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto glass-panel bg-slate-900/80 p-2 rounded-xl border border-slate-700/50 shadow-lg">
          {/* Method Filter */}
          <div className="flex items-center gap-2 px-2 border-r border-slate-700/50 last:border-0">
            <Filter size={14} className="text-indigo-400" />
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-200 focus:outline-none cursor-pointer py-1 min-w-[120px] [&>option]:bg-slate-900"
            >
              <option value="all">Все методы</option>
              {PSYCH_METHODS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Emotion Filter */}
          <div className="flex items-center gap-2 px-2">
            <select
              value={filterEmotion}
              onChange={(e) => setFilterEmotion(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-200 focus:outline-none cursor-pointer py-1 min-w-[120px] [&>option]:bg-slate-900"
            >
              <option value="all">Все эмоции</option>
              {PREBUILT_EMOTIONS.map(emotion => (
                <option key={emotion} value={emotion}>{emotion}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-xl border border-dashed border-slate-700 bg-slate-900/40">
          <BookOpen size={48} className="mx-auto text-slate-700 mb-4" />
          <h3 className="text-lg font-medium text-slate-400">
            {entries.length === 0 ? 'Журнал пока пуст' : 'Записи не найдены'}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredEntries.map((entry) => {
            const summary = getSummary(entry);
            const hasImage = !!entry.imageUrl;

            return (
              <TiltCard
                key={entry.id}
                className="glass-panel rounded-xl border border-slate-700/40 bg-slate-900/60 hover:border-indigo-500/30 transition-all overflow-hidden group"
              >
                {/* Image Preview (if exists) */}
                {hasImage && (
                  <div className="relative h-40 overflow-hidden bg-slate-950">
                    <img
                      src={entry.imageUrl!}
                      alt="Dream visualization"
                      className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                  </div>
                )}

                {/* Card Content */}
                <div className="p-5">
                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-950 text-indigo-300 uppercase tracking-wider border border-indigo-500/30">
                      {getMethodName(entry.dreamData.method)}
                    </span>
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {entry.dreamData.context.emotion}
                    </span>
                    <span className="flex items-center text-xs text-slate-500 ml-auto">
                      <Calendar size={12} className="mr-1" />
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>

                  {/* Dream Title */}
                  <h3 className="text-lg font-serif font-bold text-slate-100 mb-3 line-clamp-2 leading-tight">
                    {entry.dreamData.description}
                  </h3>

                  {/* Summary */}
                  <div className="bg-indigo-900/10 p-3 rounded-lg border border-indigo-500/20 mb-4">
                    <p className="text-sm text-slate-300 italic line-clamp-3">
                      {summary}
                    </p>
                  </div>

                  {/* Context Info */}
                  <div className="space-y-2 mb-4 text-xs">
                    {entry.dreamData.context.lifeSituation && (
                      <div>
                        <span className="text-slate-500 uppercase tracking-wider">Ситуация:</span>
                        <p className="text-slate-300 line-clamp-2">{entry.dreamData.context.lifeSituation}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-700/50">
                    <button
                      onClick={() => onViewDream(entry)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-sm transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                    >
                      <Eye size={16} />
                      Открыть полный анализ
                    </button>
                    <button
                      onClick={(e) => handleDelete(entry.id, e)}
                      className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Удалить запись"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Notes indicator */}
                  {entry.notes && (
                    <div className="mt-3 flex items-center gap-1 text-xs text-amber-400">
                      <Sparkles size={12} />
                      <span>Есть личные заметки</span>
                    </div>
                  )}
                </div>
              </TiltCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DreamJournal;
