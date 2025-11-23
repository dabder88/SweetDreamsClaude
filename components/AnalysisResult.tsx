
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { analyzeDream, visualizeDream } from '../services/geminiService';
import { saveJournalEntry } from '../services/storageService';
import { DreamData, JournalEntry, AnalysisResponse, DreamSymbol } from '../types';
import { RefreshCw, Image as ImageIcon, Check, Save, Sparkles, Layers, Compass, Key, ChevronDown } from 'lucide-react';
import Button from './Button';
import TiltCard from './TiltCard';

interface AnalysisResultProps {
  data: DreamData;
  onReset: () => void;
}

const LOADING_MESSAGES = [
  "Связываемся с глубинами подсознания...",
  "Расшифровываем метафоры и символы...",
  "Анализируем эмоциональные паттерны...",
  "Ищем архетипические связи...",
  "Структурируем психологический портрет...",
  "Формируем карту вашего внутреннего мира..."
];

type Tab = 'symbolism' | 'analysis' | 'guidance';

// --- COMPONENT: SYMBOL ACCORDION ---
// Independent component definition using DIVs for interaction to prevent button conflicts
const SymbolAccordion: React.FC<{ item: DreamSymbol; index: number }> = ({ item, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Typography style for inner content
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

const AnalysisResult: React.FC<AnalysisResultProps> = ({ data, onReset }) => {
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('symbolism');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const analysisData = await analyzeDream(data);
        setResult(analysisData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка при анализе.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, []);

  const handleGenerateImage = async () => {
    if (imageUrl) return;
    setImageLoading(true);
    try {
      const url = await visualizeDream(data.description);
      setImageUrl(url);
    } catch (err) {
      console.error(err);
      alert("Не удалось сгенерировать изображение. Попробуйте снова.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleSave = () => {
    if (isSaved || !result) return;
    
    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      dreamData: data,
      analysis: result,
      imageUrl: imageUrl,
      notes: ''
    };
    
    saveJournalEntry(entry);
    setIsSaved(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] animate-fade-in">
        <div className="relative mb-16">
          <div className="w-40 h-40 bg-indigo-500/20 rounded-full mix-blend-screen filter blur-2xl animate-blob"></div>
          <div className="w-40 h-40 bg-purple-500/20 rounded-full mix-blend-screen filter blur-2xl animate-blob animation-delay-2000 absolute top-0 left-6"></div>
          <div className="absolute inset-0 flex items-center justify-center z-10">
             <Sparkles className="text-indigo-200 animate-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]" size={48} />
          </div>
        </div>
        <h3 className="text-3xl font-serif text-slate-100 font-medium text-center transition-all duration-500 h-10 drop-shadow-lg px-4">
          {LOADING_MESSAGES[loadingMsgIndex]}
        </h3>
        <p className="text-indigo-300/80 mt-6 text-sm uppercase tracking-[0.25em] font-bold">
          Gemini 3 Pro анализирует...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <TiltCard className="text-center p-12 bg-red-950/30 backdrop-blur-xl rounded-2xl border border-red-500/30 shadow-xl">
        <h3 className="text-red-200 font-serif font-semibold text-2xl mb-4">Ошибка связи</h3>
        <p className="text-red-300/80 mb-8 text-lg">{error}</p>
        <Button onClick={onReset} variant="outline">Попробовать снова</Button>
      </TiltCard>
    );
  }

  const BODY_TEXT_STYLE = "text-base md:text-[17px] leading-relaxed text-slate-200 font-normal not-italic";

  return (
    <div className="animate-fade-in space-y-10 pb-20" ref={contentRef}>
      
      {/* --- SECTION 1: SUMMARY (Top) --- */}
      <TiltCard className="bg-gradient-to-br from-slate-900/90 to-indigo-950/90 p-10 rounded-3xl border border-indigo-500/20 shadow-2xl animate-border-pulse relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full filter blur-[80px]"></div>
        
        <div className="relative z-10">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-400 mb-6 flex items-center gap-2">
            <Sparkles size={16}/> Ключевая суть сновидения
          </h2>
          <div className="text-xl md:text-2xl font-serif text-slate-50 leading-relaxed italic">
            "{result?.summary}"
          </div>
        </div>
      </TiltCard>

      {/* --- SECTION 2: TABS NAVIGATION --- */}
      <div>
        <div className="flex flex-col sm:flex-row gap-4 border-b border-slate-800/50 pb-6">
          <button
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
              {result?.symbolism.map((item, idx) => (
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
                    {result?.analysis || ""}
                  </ReactMarkdown>
               </div>
            </TiltCard>
          )}

          {/* TAB 3: GUIDANCE */}
          {activeTab === 'guidance' && (
            <div className="animate-fade-in space-y-8">
              
              {/* Separate Cards for Each Advice */}
              <div className="space-y-4">
                 {result?.advice.map((item, idx) => (
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
                {result?.questions.map((q, idx) => (
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

      {/* --- SECTION 4: IMAGE --- */}
      <div className="mt-12 pt-12 border-t border-slate-800/50">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
           <div className="lg:col-span-1">
              <h3 className="text-2xl font-serif text-white mb-3">Визуализация сна</h3>
              <p className="text-slate-400 text-lg leading-relaxed mb-6">
                Нейросеть может воссоздать образы из вашего сна, чтобы вы могли взглянуть на них со стороны.
              </p>
              {!imageUrl && (
                <Button 
                  onClick={handleGenerateImage} 
                  isLoading={imageLoading} 
                  variant="secondary"
                  className="w-full md:w-auto text-base py-4"
                  icon={<ImageIcon size={20}/>}
                >
                  Сгенерировать арт
                </Button>
              )}
           </div>
           
           <div className="lg:col-span-2">
              <TiltCard className="w-full min-h-[300px] bg-slate-900/40 rounded-2xl border border-slate-700/50 flex items-center justify-center overflow-hidden relative">
                 {imageUrl ? (
                    <div className="relative w-full h-full group animate-fade-in">
                      <img 
                        src={imageUrl} 
                        alt="Dream visualization" 
                        className="w-full h-full object-cover rounded-xl shadow-2xl" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                         <a href={imageUrl} download="dream-vision.png" className="text-white underline hover:text-indigo-300">Скачать изображение</a>
                      </div>
                    </div>
                 ) : (
                    <div className="text-slate-600 flex flex-col items-center p-12 opacity-50">
                       <ImageIcon size={64} strokeWidth={1} className="mb-4"/>
                       <span className="text-sm uppercase tracking-widest">Место для изображения</span>
                    </div>
                 )}
                 {imageLoading && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-20">
                        <div className="flex flex-col items-center">
                           <Sparkles className="animate-spin text-indigo-400 mb-4" size={32}/>
                           <span className="text-indigo-200 font-serif text-lg animate-pulse">Рисуем ваш сон...</span>
                        </div>
                    </div>
                 )}
              </TiltCard>
           </div>
        </div>
      </div>

      {/* --- FOOTER --- */}
      <div className="border-t border-slate-800/50 pt-8 flex flex-wrap gap-6 justify-between items-center mt-8">
        <div className="text-slate-500 text-sm">
          Анализ выполнен Gemini 3.0 Pro Preview
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button 
            variant={isSaved ? "secondary" : "outline"}
            className={`w-full sm:w-auto text-base py-3 ${isSaved ? 'text-emerald-400 border-emerald-500/30 bg-emerald-900/10' : ''}`}
            icon={isSaved ? <Check size={20}/> : <Save size={20}/>}
            onClick={handleSave}
            disabled={isSaved}
          >
            {isSaved ? 'Сохранено в журнал' : 'Сохранить в журнал'}
          </Button>
          <Button onClick={onReset} variant="primary" icon={<RefreshCw size={20}/>} className="w-full sm:w-auto text-base py-3">
            Новый анализ
          </Button>
        </div>
      </div>

    </div>
  );
};

export default AnalysisResult;
