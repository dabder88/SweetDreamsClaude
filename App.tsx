import React, { useState, useRef, useEffect } from 'react';
import { DreamData, PsychMethod, AppView, User, JournalEntry } from './types';
import StepIndicator from './components/StepIndicator';
import DreamForm from './components/DreamForm';
import ContextForm from './components/ContextForm';
import MethodSelector from './components/MethodSelector';
import AnalysisResult from './components/AnalysisResult';
import DreamJournal from './components/DreamJournal';
import DreamView from './components/DreamView';
import Button from './components/Button';
import Starfield from './components/Starfield';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import Archetypes from './components/Archetypes';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import { ArrowRight, ArrowLeft, User as UserIcon, Menu, Ghost, Moon, Sparkles, AlertCircle, Save } from 'lucide-react';
import TiltCard from './components/TiltCard';
import { getCurrentUser, onAuthStateChange } from './services/authService';
import { isSupabaseConfigured } from './services/supabaseClient';
import { migrateLocalEntriesToSupabase, saveJournalEntry } from './services/supabaseStorageService';

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
  // Start at 'landing' page per user request
  const [view, setView] = useState<AppView>('landing');
  const [step, setStep] = useState(1);
  const [dreamData, setDreamData] = useState<DreamData>(INITIAL_DATA);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedDream, setSelectedDream] = useState<JournalEntry | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [currentAnalysisResult, setCurrentAnalysisResult] = useState<any>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);
  const blob4Ref = useRef<HTMLDivElement>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (isSupabaseConfigured()) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);

        // Migrate local entries to Supabase if user is authenticated
        if (currentUser) {
          const migratedCount = await migrateLocalEntriesToSupabase();
          if (migratedCount > 0) {
            console.log(`Migrated ${migratedCount} entries to Supabase`);
          }
        }
      }
      setAuthLoading(false);
    };

    checkAuth();

    // Subscribe to auth state changes
    if (isSupabaseConfigured()) {
      const { data: authListener } = onAuthStateChange((newUser) => {
        setUser(newUser);
        if (!newUser && view !== 'landing' && view !== 'wizard') {
          // User logged out, redirect to landing
          setView('landing');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setIsSaved(false);
    setAnalysisComplete(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isStepValid = () => {
    if (step === 1) return dreamData.description.length > 10;
    if (step === 2) return dreamData.context.emotion.length > 0;
    return true;
  };

  const navigateTo = (newView: AppView) => {
    // Protect private views - require authentication if Supabase is configured
    const privateViews: AppView[] = ['dashboard', 'journal', 'dreamView', 'analytics', 'settings', 'archetypes'];

    if (isSupabaseConfigured() && privateViews.includes(newView) && !user) {
      setView('auth');
      setMobileMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setView(newView);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = async () => {
    // After successful auth, update user state and navigate to wizard (for dream interpretation)
    if (isSupabaseConfigured()) {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      // Migrate local entries to Supabase if user is authenticated
      if (currentUser) {
        const migratedCount = await migrateLocalEntriesToSupabase();
        if (migratedCount > 0) {
          console.log(`Migrated ${migratedCount} entries to Supabase`);
        }
      }
    }

    // Navigate to wizard to start dream interpretation
    setView('wizard');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewDream = (entry: JournalEntry) => {
    setSelectedDream(entry);
    setView('dreamView');
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToJournal = () => {
    setSelectedDream(null);
    navigateTo('journal');
  };

  // Check if analysis is complete but not saved before navigating away
  const handleNavigateWithCheck = (targetView: AppView) => {
    // If we're on step 4 (analysis result), analysis is complete, but not saved
    if (view === 'wizard' && step === 4 && analysisComplete && !isSaved) {
      setShowExitWarning(true);
    } else {
      navigateTo(targetView);
    }
  };

  const confirmExitWithoutSave = () => {
    setShowExitWarning(false);
    // Reset analysis state when leaving without saving
    setIsSaved(false);
    setAnalysisComplete(false);
    setCurrentAnalysisResult(null);
    setCurrentImageUrl(null);
    navigateTo('dashboard');
  };

  const handleSaveAndExit = async () => {
    // Save the current analysis to journal
    if (currentAnalysisResult) {
      const entry: JournalEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        dreamData: dreamData,
        analysis: currentAnalysisResult,
        imageUrl: currentImageUrl,
        notes: ''
      };

      await saveJournalEntry(entry);
      setIsSaved(true);
      setShowExitWarning(false);
      setCurrentAnalysisResult(null);
      setCurrentImageUrl(null);
      navigateTo('dashboard');
    }
  };

  // --- RENDER WIZARD LAYOUT (Interpretation Process) ---
  const renderWizardLayout = () => (
    <div className="relative z-20 flex flex-col min-h-screen pb-20">
       {/* Simple Header for Wizard */}
       <header className="bg-slate-900/40 backdrop-blur-md border-b border-white/5 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo('landing')}>
              <div className="relative w-9 h-9 flex items-center justify-center bg-gradient-to-tr from-indigo-900 to-slate-900 rounded-lg border border-indigo-500/30 shadow-sm group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all">
                <Moon size={18} className="text-indigo-300 absolute -top-1 -right-1 rotate-12" />
                <Sparkles size={12} className="text-purple-300 absolute bottom-1.5 left-1.5" />
              </div>
              <h1 className="font-serif text-xl font-bold text-slate-50 tracking-tight group-hover:text-indigo-300 transition-colors">PsyDream</h1>
            </div>
            
            <nav className="flex items-center gap-4">
               <button
                onClick={() => handleNavigateWithCheck('dashboard')}
                className="flex items-center gap-2 text-sm font-medium text-indigo-200 hover:text-white transition-colors bg-indigo-900/30 hover:bg-indigo-600 px-4 py-2 rounded-full border border-indigo-500/30 hover:border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
               >
                 <UserIcon size={16} />
                 <span className="hidden sm:inline">Личный кабинет</span>
               </button>
            </nav>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
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
                  <AnalysisResult
                    data={dreamData}
                    onReset={resetApp}
                    onSaveStatusChange={setIsSaved}
                    onAnalysisComplete={() => setAnalysisComplete(true)}
                    onAnalysisResultChange={setCurrentAnalysisResult}
                    onImageUrlChange={setCurrentImageUrl}
                  />
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
             <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-tr from-indigo-900 to-slate-900 rounded-lg border border-indigo-500/30">
                <Moon size={16} className="text-indigo-300" />
             </div>
             <span className="font-serif font-bold text-white tracking-tight">PsyDream</span>
         </div>
         <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-white">
            <Menu size={24} />
         </button>
      </div>

      {/* Sidebar (Hidden on mobile unless toggled) */}
      <div className={`fixed md:sticky top-0 left-0 h-screen z-50 transition-transform duration-300 transform
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <Sidebar currentView={view} onChangeView={navigateTo} user={user} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 pt-20 md:p-10 overflow-y-auto min-h-screen">
        
        {/* View Router */}
        <div className="max-w-6xl mx-auto">
          {view === 'dashboard' && <Dashboard onNavigate={navigateTo} user={user} />}
          {view === 'journal' && <DreamJournal onViewDream={handleViewDream} />}
          {view === 'dreamView' && selectedDream && <DreamView entry={selectedDream} onBack={handleBackToJournal} />}
          {view === 'analytics' && <Analytics />}
          {view === 'archetypes' && <Archetypes user={user} />}
          {view === 'settings' && <Settings user={user} onUserUpdate={setUser} />}
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

      {/* Logic to choose layout based on current View */}
      {authLoading ? (
        <div className="relative z-20 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Moon size={48} className="text-indigo-400 animate-pulse mx-auto mb-4" />
            <p className="text-slate-400">Загрузка...</p>
          </div>
        </div>
      ) : view === 'auth' ? (
        <Auth onAuthSuccess={handleAuthSuccess} />
      ) : view === 'landing' ? (
        <LandingPage
          onStart={() => {
            // Check if user is authenticated when Supabase is configured
            if (isSupabaseConfigured() && !user) {
              // Redirect to auth page if not authenticated
              navigateTo('auth');
            } else {
              // Proceed to wizard if authenticated or Supabase not configured
              navigateTo('wizard');
            }
          }}
          onGoToCabinet={() => navigateTo('dashboard')}
          user={user}
        />
      ) : view === 'wizard' ? (
        renderWizardLayout()
      ) : (
        renderCabinetLayout()
      )}

      {/* --- EXIT WARNING MODAL --- */}
      {showExitWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <TiltCard className="max-w-md w-full bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
                <AlertCircle size={28} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-white mb-2">Толкование не сохранено!</h3>
                <p className="text-slate-300 leading-relaxed">
                  Вы не сохранили толкование в журнал. Если вы продолжите, оно будет потеряно и не будет доступно в личном кабинете.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                onClick={handleSaveAndExit}
                icon={<Save size={20}/>}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400"
              >
                Сохранить в журнал
              </Button>
              <Button
                variant="outline"
                onClick={confirmExitWithoutSave}
                className="flex-1 text-red-400 border-red-500/30 hover:bg-red-900/20"
              >
                Выйти без сохранения
              </Button>
            </div>
          </TiltCard>
        </div>
      )}

    </div>
  );
}

export default App;