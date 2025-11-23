
import React, { useState, useEffect } from 'react';
import { JournalEntry, AnalysisResponse } from '../types';
import { getJournalEntries, deleteJournalEntry, updateJournalEntry } from '../services/storageService';
import { Trash2, Calendar, BookOpen, ChevronDown, ChevronUp, MessageSquare, Filter, Sparkles, Key, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PSYCH_METHODS, PREBUILT_EMOTIONS } from '../constants';
import TiltCard from './TiltCard';

const DreamJournal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterEmotion, setFilterEmotion] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    setEntries(getJournalEntries());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      deleteJournalEntry(id);
      setEntries(entries.filter(entry => entry.id !== id));
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSaveNote = (id: string) => {
    updateJournalEntry(id, { notes: noteText });
    setEntries(entries.map(e => e.id === id ? { ...e, notes: noteText } : e));
    setEditingNoteId(null);
  };

  const startEditingNote = (entry: JournalEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNoteId(entry.id);
    setNoteText(entry.notes || '');
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

  const renderStructuredAnalysis = (data: AnalysisResponse) => {
    return (
      <div className="space-y-8">
        {/* Summary */}
        <div className="bg-indigo-900/20 p-5 rounded-xl border border-indigo-500/20">
          <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">Суть</h5>
          <p className="text-slate-200 font-serif italic text-lg">"{data.summary}"</p>
        </div>

        {/* Symbolism Grid */}
        <div>
           <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
             <Key size={14}/> Символы
           </h5>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {data.symbolism.map((s, idx) => (
               <div key={idx} className="bg-slate-900/40 p-3 rounded-lg border border-slate-700/50">
                 <span className="block font-serif font-medium text-indigo-200 mb-1">{s.name}</span>
                 <span className="text-xs text-slate-400 leading-tight block">{s.meaning}</span>
               </div>
             ))}
           </div>
        </div>

        {/* Deep Dive */}
        <div>
          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
             <Layers size={14}/> Разбор
           </h5>
          <div className="prose prose-sm prose-invert prose-indigo max-w-none text-slate-300">
            <ReactMarkdown>{data.analysis}</ReactMarkdown>
          </div>
        </div>

        {/* Advice */}
        <div className="space-y-3">
            <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-2">
               <Sparkles size={14}/> Советы
            </h5>
            {Array.isArray(data.advice) ? (
                data.advice.map((tip, i) => (
                   <div key={i} className="bg-emerald-900/10 p-3 rounded-lg border border-emerald-500/20 text-emerald-100/90 text-sm italic">
                      {tip}
                   </div>
                ))
            ) : (
                <div className="bg-emerald-900/10 p-4 rounded-xl border border-emerald-500/20">
                    <p className="text-emerald-100/90 text-sm italic">{data.advice}</p>
                </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-slate-100">Журнал</h2>
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
        <div className="space-y-6">
          {filteredEntries.map((entry) => (
            <TiltCard 
              key={entry.id} 
              className={`glass-panel rounded-xl border transition-all duration-300 overflow-hidden
                ${expandedId === entry.id ? 'border-indigo-500/30 ring-1 ring-indigo-500/20 bg-slate-800/80 shadow-[0_0_30px_rgba(99,102,241,0.15)]' : 'border-slate-700/40 bg-slate-900/60 hover:border-slate-600'}
              `}
            >
              {/* Header Card */}
              <div 
                onClick={() => toggleExpand(entry.id)}
                className="p-6 cursor-pointer flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="text-xs font-bold px-2 py-1 rounded bg-indigo-950 text-indigo-300 uppercase tracking-wider border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                      {getMethodName(entry.dreamData.method)}
                    </span>
                    
                    <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-900 text-slate-400 border border-slate-700">
                      {entry.dreamData.context.emotion}
                    </span>

                    <span className="flex items-center text-xs text-slate-500 ml-auto sm:ml-0">
                      <Calendar size={12} className="mr-1" />
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>
                  <h3 className="text-lg font-serif font-semibold text-slate-100 line-clamp-1 mb-1 tracking-wide">
                    {entry.dreamData.description}
                  </h3>
                  <p className="text-slate-500 text-sm line-clamp-2">
                    {expandedId === entry.id ? 'Нажмите, чтобы свернуть' : 'Нажмите, чтобы развернуть полный анализ...'}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={(e) => handleDelete(entry.id, e)}
                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-full transition-colors"
                    title="Удалить запись"
                  >
                    <Trash2 size={18} />
                  </button>
                  {expandedId === entry.id ? <ChevronUp size={20} className="text-indigo-400"/> : <ChevronDown size={20} className="text-slate-600"/>}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === entry.id && (
                <div className="border-t border-slate-700/50 bg-slate-950/40 backdrop-blur-sm">
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column: Details & Image */}
                    <div className="space-y-6">
                      {/* Image Thumbnail */}
                      {entry.imageUrl && (
                        <div className="rounded-lg overflow-hidden shadow-lg border border-slate-700/50 group">
                          <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                             <img 
                                src={entry.imageUrl} 
                                alt="Dream visualization" 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" 
                             />
                          </div>
                        </div>
                      )}

                      {/* Original Request Info */}
                      <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-700/50 text-sm space-y-3 shadow-inner">
                        <h4 className="font-semibold text-slate-400 border-b border-slate-700/50 pb-2 text-xs uppercase tracking-wider">Исходные данные</h4>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1">Сон</span>
                          <p className="text-slate-300 italic font-light leading-relaxed">"{entry.dreamData.description}"</p>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase tracking-wider mb-1">Контекст</span>
                          <p className="text-slate-300">{entry.dreamData.context.lifeSituation || "—"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Analysis & Notes */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* Analysis Content */}
                      <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-xl border border-slate-700/30 shadow-sm">
                         {isStructured(entry.analysis) ? (
                            renderStructuredAnalysis(entry.analysis)
                         ) : (
                            <div className="prose prose-sm prose-invert prose-indigo max-w-none text-slate-300">
                                <ReactMarkdown>{entry.analysis as string}</ReactMarkdown>
                            </div>
                         )}
                      </div>

                      {/* User Notes Section */}
                      <div className="bg-amber-950/20 backdrop-blur-md p-5 rounded-xl border border-amber-700/20 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-amber-500/80 flex items-center gap-2 text-sm uppercase tracking-wide">
                            <MessageSquare size={16} />
                            Заметки
                          </h4>
                          {editingNoteId !== entry.id && (
                            <button 
                              onClick={(e) => startEditingNote(entry, e)}
                              className="text-xs font-medium text-amber-500 hover:text-amber-400 transition-colors"
                            >
                              {entry.notes ? 'Редактировать' : 'Добавить'}
                            </button>
                          )}
                        </div>

                        {editingNoteId === entry.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              className="w-full p-3 rounded-lg bg-slate-950/80 border border-amber-500/30 focus:ring-1 focus:ring-amber-500/50 outline-none text-sm text-slate-200 shadow-inner"
                              rows={3}
                              placeholder="Мои мысли..."
                              autoFocus
                            />
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => setEditingNoteId(null)}
                                className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-300"
                              >
                                Отмена
                              </button>
                              <button 
                                onClick={() => handleSaveNote(entry.id)}
                                className="px-3 py-1 text-xs font-medium bg-amber-700 text-white rounded-md hover:bg-amber-600 shadow-md"
                              >
                                Сохранить
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400 italic pl-1 font-light">
                            {entry.notes || "Нет заметок."}
                          </p>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              )}
            </TiltCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default DreamJournal;
