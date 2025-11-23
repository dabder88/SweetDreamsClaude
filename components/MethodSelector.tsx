import React from 'react';
import { PsychMethod } from '../types';
import { PSYCH_METHODS } from '../constants';
import TiltCard from './TiltCard';

interface MethodSelectorProps {
  selected: PsychMethod;
  onSelect: (method: PsychMethod) => void;
}

const MethodSelector: React.FC<MethodSelectorProps> = ({ selected, onSelect }) => {
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-serif font-semibold text-white mb-3">Выберите метод толкования</h2>
        <p className="text-slate-300 text-lg">
          Выберите конкретную психологическую школу или позвольте ИИ определить лучший подход.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {PSYCH_METHODS.map((method) => {
          const Icon = method.icon;
          const isSelected = selected === method.id;
          
          return (
            <TiltCard key={method.id}>
              <button
                onClick={() => onSelect(method.id)}
                className={`w-full relative p-6 rounded-xl border text-left transition-all duration-300 flex items-start gap-4 h-full group
                  ${isSelected 
                    ? `border-indigo-500 bg-indigo-900/30 shadow-[0_0_25px_rgba(99,102,241,0.2)]` 
                    : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-800/70'
                  }`}
              >
                <div className={`p-3 rounded-lg ${method.bgColor} ${method.color} shrink-0 border border-white/10 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={26} />
                </div>
                <div>
                  <h3 className={`font-semibold text-xl mb-1 ${isSelected ? 'text-indigo-200' : 'text-slate-100'}`}>
                    {method.name}
                  </h3>
                  <p className={`text-sm leading-relaxed ${isSelected ? 'text-indigo-200/80' : 'text-slate-400 group-hover:text-slate-300 transition-colors'}`}>
                    {method.description}
                  </p>
                </div>
              </button>
            </TiltCard>
          );
        })}
      </div>
    </div>
  );
};

export default MethodSelector;