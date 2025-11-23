import React from 'react';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="w-full mb-12 px-2">
      <div className="flex items-center justify-between relative">
        {/* Background Track */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-[2px] bg-slate-800/50 -z-10 rounded-full"></div>
        
        {/* Active Progress Line with Gradient & Glow */}
        <div 
          className="absolute left-0 top-1/2 transform -translate-y-1/2 h-[2px] bg-gradient-to-r from-indigo-600 via-purple-500 to-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.8)] -z-10 transition-all duration-700 ease-out rounded-full"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        ></div>
        
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;

          return (
            <div key={index} className="flex flex-col items-center relative z-10">
              {/* The Circle */}
              <div 
                className={`
                  w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all duration-500
                  ${isCompleted 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] scale-100' 
                    : ''}
                  ${isCurrent 
                    ? 'bg-slate-950 border-indigo-400 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-110 ring-4 ring-indigo-500/10' 
                    : ''}
                  ${!isCompleted && !isCurrent 
                    ? 'bg-slate-950 border-slate-800 text-slate-600 shadow-sm' 
                    : ''}
                `}
              >
                {isCompleted ? (
                  <Check size={20} strokeWidth={3} />
                ) : (
                  <span className={`text-base font-bold ${isCurrent ? 'animate-pulse' : ''}`}>{stepNum}</span>
                )}
              </div>

              {/* Label */}
              <div className={`absolute -bottom-8 flex flex-col items-center transition-all duration-300 w-24
                 ${isCurrent ? 'translate-y-0 opacity-100' : isCompleted ? 'translate-y-0 opacity-80' : 'translate-y-1 opacity-50'}
              `}>
                <span 
                  className={`
                    text-[10px] uppercase tracking-[0.15em] font-bold whitespace-nowrap
                    ${isCurrent ? 'text-indigo-300' : isCompleted ? 'text-slate-400' : 'text-slate-600'}
                  `}
                >
                  {stepNum === 1 && 'Сон'}
                  {stepNum === 2 && 'Контекст'}
                  {stepNum === 3 && 'Метод'}
                  {stepNum === 4 && 'Анализ'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;