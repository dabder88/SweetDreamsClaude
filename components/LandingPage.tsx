import React from 'react';
import { ArrowRight, User, Sparkles, Moon } from 'lucide-react';
import Button from './Button';
import TiltCard from './TiltCard';
import { AppView, User as UserType } from '../types';

interface LandingPageProps {
  onStart: () => void;
  onGoToCabinet: () => void;
  user: UserType | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart, onGoToCabinet, user }) => {
  return (
    <div className="relative z-20 flex flex-col min-h-screen">
       {/* Transparent Header */}
       <header className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-50">
          {/* LOGO - TOP LEFT */}
          <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-tr from-indigo-900 to-slate-900 rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)] group-hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all duration-500">
                 <Moon size={20} className="text-indigo-300 absolute -top-1 -right-1 rotate-12 group-hover:rotate-0 transition-transform duration-500" />
                 <Sparkles size={16} className="text-purple-300 absolute bottom-2 left-2 opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <h1 className="font-serif text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-100 to-indigo-300 tracking-tight group-hover:to-white transition-all duration-500">
                PsyDream
              </h1>
          </div>

          {/* CABINET LINK - TOP RIGHT */}
          <button
            onClick={onGoToCabinet}
            className="flex items-center gap-2 text-sm font-medium text-indigo-200 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full border border-white/10 hover:border-indigo-400/50 backdrop-blur-md"
          >
            <User size={18} />
            <span className="hidden sm:inline">Личный кабинет</span>
          </button>
       </header>

       <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 relative">

          {/* Hero Content */}
          <div className="max-w-4xl mx-auto animate-fade-in space-y-8 mt-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">
                 <Sparkles size={14} className="animate-pulse"/>
                 Психоанализ сновидений 2.0
              </div>

              <h1 className="text-6xl md:text-8xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-indigo-100 to-slate-400 drop-shadow-[0_0_45px_rgba(255,255,255,0.1)] tracking-tight leading-tight">
                Мудрость<br/>Сновидений
              </h1>

              <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed font-light tracking-wide">
                Погрузитесь в глубины подсознания. <span className="text-indigo-300 font-normal border-b border-indigo-500/30 pb-1">Научный подход</span> к толкованию ваших снов с помощью искусственного интеллекта.
              </p>

              <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
                 <button
                   onClick={onStart}
                   className="group relative px-8 py-5 bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-bold rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:shadow-[0_0_50px_rgba(79,70,229,0.6)] transition-all duration-300 active:scale-95 flex items-center gap-3 overflow-hidden"
                 >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <span>Начать толкование</span>
                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform"/>
                 </button>

                 <div className="flex items-center gap-4 text-slate-500 text-sm font-medium">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Юнг</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Фрейд</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-400"></span> Гештальт</span>
                 </div>
              </div>
          </div>
       </main>

       <footer className="w-full text-center py-8 text-slate-600 text-xs uppercase tracking-widest">
          PsyDream © {new Date().getFullYear()}
       </footer>
    </div>
  );
};

export default LandingPage;