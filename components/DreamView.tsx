import React, { useState } from 'react';
import { JournalEntry, AnalysisResponse, DreamSymbol } from '../types';
import { ArrowLeft, Calendar, Sparkles, Key, Layers, Compass, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PSYCH_METHODS } from '../constants';
import TiltCard from './TiltCard';

interface DreamViewProps {
  entry: JournalEntry;
  onBack: () => void;
}

type Tab = 'symbolism' | 'analysis' | 'guidance';

// --- COMPONENT: SYMBOL ACCORDION ---
const SymbolAccordion: React.FC<{ item: DreamSymbol; index: number }> = ({ item, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const contentStyle = "text-base md:text-[17px] leading-relaxed text-slate-200 font-normal not-italic";

  return (
    <div className="mb-4 last:mb-0 rounded-xl border border-indigo-500/30 bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300">
      {/* Header - Div acting as interactive element */}
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
            e.preventDefault();
            setIsExpanded(!isExpanded);
        }}
        onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsExpanded(!isExpanded);
            }
        }}
        className={`
          w-full flex items-center justify-between p-5 cursor-pointer select-none transition-all duration-300 outline-none border-b
          ${isExpanded
            ? 'bg-indigo-900 border-indigo-500 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)]'
            : 'bg-indigo-950 border-indigo-500/30 hover:bg-indigo-900 hover:border-indigo-400'}
        `}
      >
        <div className="flex items-center gap-5 text-left">
          {/* Number Badge */}
          <div className={`
            w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg border font-serif text-lg font-bold transition-all duration-300 shadow-md
            ${isExpanded
              ? 'bg-indigo-500 text-white border-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.6)]'
              : 'bg-indigo-900 text-indigo-200 border-indigo-700 group-hover:border-indigo-500'}
          `}>
            {index + 1}
          </div>

          {/* Title */}
          <div className="flex-1">
            <h4 className={`text-lg md:text-xl font-serif font-medium transition-colors duration-300 ${isExpanded ? 'text-white' : 'text-indigo-100'}`}>
              {item.name}
            </h4>
            {!isExpanded && (
              <span className="text-xs text-indigo-400/70 uppercase tracking-wider mt-1 block font-medium group-hover:text-indigo-300">
                Нажмите, чтобы раскрыть
              </span>
            )}
          </div>
        </div>

        {/* Icon */}
        <div className={`transition-transform duration-500 transform bg-slate-950/30 p-2 rounded-full border border-indigo-500/20 ${isExpanded ? 'rotate-180 text-indigo-200 bg-indigo-800/50' : 'text-indigo-400'}`}>
          <ChevronDown size={20} strokeWidth={3} />
        </div>
      </div>

      {/* Content Area */}
      {isExpanded && (
        <div className="animate-fade-in p-6 md:p-8 bg-slate-950">
          <div className={contentStyle}>
            <ReactMarkdown
              components={{
                p: ({node, ...props}) => <p className="mb-4 last:mb-0 leading-relaxed" {...props} />
              }}
            >
              {item.meaning}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

const DreamView: React.FC<DreamViewProps> = ({ entry, onBack }) => {
  const [activeTab, setActiveTab] = useState<Tab>('symbolism');

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

  const isStructured = (analysis: any): analysis is AnalysisResponse => {
    return typeof analysis === 'object' && analysis !== null && 'summary' in analysis;
  };

  const BODY_TEXT_STYLE = "text-base md:text-[17px] leading-relaxed text-slate-200 font-normal not-italic";

  const result = isStructured(entry.analysis) ? entry.analysis : null;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-10 pb-20">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Назад к журналу</span>
      </button>

      {/* Dream Header Info */}
      <div className="glass-panel bg-slate-900/60 p-6 rounded-2xl border border-slate-700/50">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-950 text-indigo-300 uppercase tracking-wider border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
            {getMethodName(entry.dreamData.method)}
          </span>
          {entry.dreamData.context.emotion && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              {entry.dreamData.context.emotion}
            </span>
          )}
          {entry.dreamData.context.dreamRole && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {entry.dreamData.context.dreamRole}
            </span>
          )}
          {entry.dreamData.context.characterType && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              {entry.dreamData.context.characterType}
            </span>
          )}
          {entry.dreamData.context.recurring && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
              Повторяющийся
            </span>
          )}
          <span className="flex items-center text-xs text-slate-500 ml-auto">
            <Calendar size={14} className="mr-2" />
            {formatDate(entry.timestamp)}
          </span>
        </div>

        <h1 className="text-3xl font-serif font-bold text-white mb-3 leading-tight">
          {entry.dreamData.description}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-700/50">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Жизненная ситуация</h4>
            <p className="text-slate-300">{entry.dreamData.context.lifeSituation || "Не указана"}</p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ассоциации</h4>
            <p className="text-slate-300">{entry.dreamData.context.associations || "Не указаны"}</p>
          </div>
          {entry.dreamData.context.dayResidue && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Дневной остаток</h4>
              <p className="text-slate-300">{entry.dreamData.context.dayResidue}</p>
            </div>
          )}
          {entry.dreamData.context.physicalSensation && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Физические ощущения</h4>
              <p className="text-slate-300">{entry.dreamData.context.physicalSensation}</p>
            </div>
          )}
        </div>
      </div>

      {/* Dream Visualization */}
      {entry.imageUrl && (
        <TiltCard className="rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl">
          <div className="relative aspect-video bg-slate-950">
            <img
              src={entry.imageUrl}
              alt="Визуализация сна"
              className="w-full h-full object-cover"
            />
          </div>
        </TiltCard>
      )}

      {/* --- SECTION 1: SUMMARY (Top) --- */}
      {result && (
        <TiltCard className="bg-gradient-to-br from-slate-900/90 to-indigo-950/90 p-10 rounded-3xl border border-indigo-500/20 shadow-2xl animate-border-pulse relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full filter blur-[80px]"></div>

          <div className="relative z-10">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-400 mb-6 flex items-center gap-2">
              <Sparkles size={16}/> Ключевая суть сновидения
            </h2>
            <div className="text-xl md:text-2xl font-serif text-slate-50 leading-relaxed italic">
              "{result.summary}"
            </div>
          </div>
        </TiltCard>
      )}

      {/* --- SECTION 2: TABS NAVIGATION --- */}
      {result && (
        <div>
          <div className="flex flex-col sm:flex-row gap-4 border-b border-slate-800/50 pb-6">
            <button
              type="button"
              onClick={() => setActiveTab('symbolism')}
              className={`flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-md
                ${activeTab === 'symbolism'
                  ? 'bg-indigo-600 text-white border border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-[1.02]'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-700 hover:text-indigo-200 hover:border-indigo-500/50 hover:bg-slate-800'}`}
            >
              <Key size={20} />
              Символизм
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analysis')}
              className={`flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-md
                ${activeTab === 'analysis'
                  ? 'bg-indigo-600 text-white border border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-[1.02]'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-700 hover:text-indigo-200 hover:border-indigo-500/50 hover:bg-slate-800'}`}
            >
              <Layers size={20} />
              Глубина
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('guidance')}
              className={`flex-1 px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-md
                ${activeTab === 'guidance'
                  ? 'bg-indigo-600 text-white border border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-[1.02]'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-700 hover:text-indigo-200 hover:border-indigo-500/50 hover:bg-slate-800'}`}
            >
              <Compass size={20} />
              Практика
            </button>
          </div>

          {/* --- SECTION 3: TAB CONTENT --- */}
          <div className="pt-6 min-h-[200px]">

            {/* TAB 1: SYMBOLISM (Accordions) */}
            {activeTab === 'symbolism' && (
              <div className="animate-fade-in">
                {result.symbolism.map((item, idx) => (
                  <SymbolAccordion
                    key={idx}
                    item={item}
                    index={idx}
                  />
                ))}
              </div>
            )}

            {/* TAB 2: ANALYSIS */}
            {activeTab === 'analysis' && (
              <TiltCard className="animate-fade-in bg-slate-900/40 border border-slate-700/40 p-8 md:p-10 rounded-2xl">
                <div className="text-slate-200">
                  <ReactMarkdown
                    components={{
                      p: ({node, ...props}) => <p className={`${BODY_TEXT_STYLE} mb-6 last:mb-0`} {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg md:text-[20px] font-bold text-indigo-200 mt-[30px] mb-[20px] font-serif border-b border-indigo-500/20 pb-2" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-6 space-y-2" {...props} />,
                      li: ({node, ...props}) => <li className={BODY_TEXT_STYLE} {...props} />,
                      strong: ({node, ...props}) => <strong className="text-white font-bold" {...props} />
                    }}
                  >
                    {result.analysis || ""}
                  </ReactMarkdown>
                </div>
              </TiltCard>
            )}

            {/* TAB 3: GUIDANCE */}
            {activeTab === 'guidance' && (
              <div className="animate-fade-in space-y-8">

                {/* Separate Cards for Each Advice */}
                <div className="space-y-4">
                  {result.advice.map((item, idx) => (
                    <TiltCard key={idx} className="bg-gradient-to-br from-emerald-950/40 to-slate-900/60 border border-emerald-500/30 p-6 rounded-2xl shadow-lg">
                      <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm mb-3 flex items-center gap-2">
                        <Sparkles size={16}/> Совет #{idx + 1}
                      </h3>
                      <div className={BODY_TEXT_STYLE}>
                        {item}
                      </div>
                    </TiltCard>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="text-slate-400 font-bold uppercase tracking-wider text-sm ml-2 mb-2">Вопросы для рефлексии</h3>
                  {result.questions.map((q, idx) => (
                    <div key={idx} className="bg-slate-900/60 border border-slate-700/60 p-6 rounded-2xl flex items-start gap-5 transition-all hover:bg-slate-800/80 hover:border-indigo-500/20">
                      <div className="w-1.5 h-full min-h-[3rem] bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)]"></div>
                      <p className={BODY_TEXT_STYLE}>{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Legacy string analysis fallback */}
      {!result && (
        <div className="glass-panel bg-slate-900/40 p-8 rounded-2xl border border-slate-700/50">
          <div className="prose prose-lg prose-invert prose-indigo max-w-none text-slate-200">
            <ReactMarkdown>{entry.analysis as string}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* User Notes */}
      {entry.notes && (
        <div className="bg-amber-950/20 backdrop-blur-md p-6 rounded-2xl border border-amber-700/30">
          <h4 className="font-bold text-amber-400 mb-3 text-sm uppercase tracking-wider">Личные заметки</h4>
          <p className="text-slate-300 leading-relaxed">{entry.notes}</p>
        </div>
      )}
    </div>
  );
};

export default DreamView;
