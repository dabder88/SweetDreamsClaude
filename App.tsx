
import React, { useState, useRef } from 'react';
import { DreamData, PsychMethod, AppView } from './types';
import StepIndicator from './components/StepIndicator';
import DreamForm from './components/DreamForm';
import ContextForm from './components/ContextForm';
import MethodSelector from './components/MethodSelector';
import AnalysisResult from './components/AnalysisResult';
import DreamJournal from './components/DreamJournal';
import Button from './components/Button';
import Starfield from './components/Starfield';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import { ArrowRight, ArrowLeft, User, Menu, Ghost } from 'lucide-react';
import TiltCard from './components/TiltCard';

const INITIAL_DATA: DreamData = {
  description: '',
  context: {
    emotion: '',
    lifeSituation: '',
    associations: '',
    recurring: false,
    dayResidue: '',
    characterType: '',
    dreamRole: '',
    physicalSensation: ''
  },
  method: PsychMethod.AUTO
};

function App() {
  // Default view is 'wizard' (landing page) per user request
  const [view, setView] = useState<AppView>('wizard');
  const [step, setStep] = useState(1);
  const [dreamData, setDreamData] = useState<DreamData>(INITIAL_DATA);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);
  const blob4Ref = useRef<HTMLDivElement>(null);

  const handleDreamChange = (description: string) => {
    setDreamData(prev => ({ ...prev, description }));
  };

  const handleContextChange = (context: any) => {
    setDreamData(prev => ({ ...prev, context }));
  };

  const handleMethodSelect = (method: PsychMethod) => {
    setDreamData(prev => ({ ...prev, method }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(4);
  };

  const nextStep = () => {
    if (step < 4) {
      setStep(s => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(s => s - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const resetApp = () => {
    setDreamData(INITIAL_DATA);
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isStepValid = () => {
    if (step === 1) return dreamData.description.length > 10;
    if (step === 2) return dreamData.context.emotion.length > 0;
    return true;
  };

  const navigateTo = (newView: AppView) => {
    setView(newView);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- RENDER WIZARD LAYOUT (Current Landing) ---
  const renderWizardLayout = () => (
    <div className="relative z-20 flex flex-col min-h-screen pb-20">
       {/* Header with Cabinet Link */}
       <header className="bg-slate-900/40 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => resetApp()}>
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-transform group-hover:scale-105 border border-indigo-400/30">
                <span className="text-white font-serif font-bold text-xl">M</span>
              </div>
              <h1 className="font-serif text-xl font-bold text-slate-50 tracking-tight group-hover:text-indigo-300 transition-colors">Mindscape</h1>
            </div>
            
            <nav className="flex items-center gap-4">
               <button 
                onClick={() => navigateTo('dashboard')}
                className="flex items-center gap-2 text-sm font-medium text-indigo-200 hover:text-white transition-colors bg-indigo-900/30 hover:bg-indigo-600 px-4 py-2 rounded-full border border-indigo-500/30 hover:border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
               >
                 <User size={16} />
                 <span className="hidden sm:inline">Личный кабинет</span>
               </button>
            </nav>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
              {/* Intro Hero (Only show on Step 1) */}
              {step === 1 && dreamData.description === '' && (
                <div className="text-center mb-16 animate-fade-in mt-8">
                  <h1 className="text-5xl md:text-7xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-slate-300 mb-8 drop-shadow-[0_0_35px_rgba(255,255,255,0.15)] tracking-tight">
                    Мудрость<br/>Сновидений
                  </h1>
                  <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light tracking-wide">
                    Погрузитесь в глубины подсознания. <span className="text-indigo-300 font-normal">Психологический анализ</span> без мистики, основанный на научных подходах.
                  </p>
                </div>
              )}

              {/* Progress */}
              {step < 4 && <StepIndicator currentStep={step} totalSteps={4} />}

              {/* Main Card Area */}
              <div className="bg-transparent">
                {step === 1 && (
                  <DreamForm value={dreamData.description} onChange={handleDreamChange} />
                )}
                {step === 2 && (
                  <ContextForm data={dreamData.context} onChange={handleContextChange} />
                )}
                {step === 3 && (
                  <MethodSelector selected={dreamData.method} onSelect={handleMethodSelect} />
                )}
                {step === 4 && (
                  <AnalysisResult data={dreamData} onReset={resetApp} />
                )}
              </div>

              {/* Navigation Buttons */}
              {step < 3 && (
                <div className="mt-10 flex justify-between items-center">
                  {step > 1 ? (
                    <Button variant="outline" onClick={prevStep} icon={<ArrowLeft size={18} />}>
                      Назад
                    </Button>
                  ) : <div></div>}

                  <Button 
                    variant="primary" 
                    onClick={nextStep} 
                    disabled={!isStepValid()}
                    className={!isStepValid() ? "opacity-50 cursor-not-allowed" : ""}
                  >
                    Далее <ArrowRight size={18} className="ml-2"/>
                  </Button>
                </div>
              )}
              
              {step === 3 && (
                <div className="mt-10 flex justify-start">
                    <Button variant="outline" onClick={prevStep} icon={<ArrowLeft size={18} />}>
                      Назад к контексту
                    </Button>
                </div>
              )}
        </main>
        
        <footer className="text-center py-8 text-slate-500 text-sm relative z-10">
          <p>&copy; {new Date().getFullYear()} Mindscape. Все права защищены.</p>
        </footer>
    </div>
  );

  // --- RENDER DASHBOARD/CABINET LAYOUT ---
  const renderCabinetLayout = () => (
    <div className="flex min-h-screen relative z-20">
      
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Header Toggle */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-slate-900/80 border-b border-white/5 p-4 z-50 flex items-center justify-between backdrop-blur-xl">
         <div className="flex items-center gap-2">
             <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center">
                <span className="font-serif font-bold text-white">M</span>
             </div>
             <span className="font-serif font-bold text-white">Mindscape</span>
         </div>
         <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
            <Menu size={24} />
         </button>
      </div>

      {/* Sidebar (Hidden on mobile unless toggled) */}
      <div className={`fixed md:sticky top-0 left-0 h-screen z-50 transition-transform duration-300 transform 
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <Sidebar currentView={view} onChangeView={navigateTo} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pt-20 md:p-10 overflow-y-auto min-h-screen">
        
        {/* View Router */}
        <div className="max-w-6xl mx-auto">
          {view === 'dashboard' && <Dashboard onNavigate={navigateTo} />}
          {view === 'journal' && <DreamJournal />}
          {view === 'analytics' && <Analytics />}
          {view === 'settings' && <Settings />}
          
          {/* Placeholders for future views */}
          {view === 'archetypes' && (
            <TiltCard className="glass-panel p-10 text-center rounded-2xl bg-slate-900/50">
               <Ghost size={64} className="mx-auto text-slate-600 mb-4" />
               <h2 className="text-2xl font-serif text-white mb-2">Коллекция Архетипов</h2>
               <p className="text-slate-400">Этот раздел находится в разработке. Скоро вы сможете открывать архетипы через свои сны.</p>
            </TiltCard>
          )}
        </div>

      </main>
    </div>
  );

  return (
    <div className="min-h-screen relative w-full overflow-x-hidden bg-slate-950 selection:bg-indigo-500/40 selection:text-white font-sans text-slate-50">
      
      {/* 3D Starfield Background */}
      <Starfield />

      {/* Ambient Background Blobs */}
      <div className="fixed inset-0 w-full h-full z-0 pointer-events-none overflow-hidden">
        <div ref={blob1Ref} className="absolute top-[-10%] left-[-10%] opacity-40">
           <div className="w-[40rem] h-[40rem] bg-indigo-900/40 rounded-full mix-blend-screen filter blur-[80px] animate-blob"></div>
        </div>
        <div ref={blob2Ref} className="absolute top-[-10%] right-[-10%] opacity-30">
           <div className="w-[35rem] h-[35rem] bg-purple-900/30 rounded-full mix-blend-screen filter blur-[80px] animate-blob animation-delay-2000"></div>
        </div>
        <div ref={blob3Ref} className="absolute bottom-[-20%] left-[20%] opacity-40">
           <div className="w-[45rem] h-[45rem] bg-blue-900/30 rounded-full mix-blend-screen filter blur-[80px] animate-blob animation-delay-4000"></div>
        </div>
        <div ref={blob4Ref} className="absolute top-[30%] right-[30%] opacity-20">
           <div className="w-80 h-80 bg-violet-800/30 rounded-full mix-blend-screen filter blur-[60px] animate-blob animation-delay-2000"></div>
        </div>
      </div>

      {/* Route Logic */}
      {view === 'wizard' ? renderWizardLayout() : renderCabinetLayout()}

    </div>
  );
}

export default App;
