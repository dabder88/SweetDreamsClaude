import React from 'react';
import { Moon } from 'lucide-react';
import TiltCard from './TiltCard';

interface DreamFormProps {
  value: string;
  onChange: (val: string) => void;
}

const DreamForm: React.FC<DreamFormProps> = ({ value, onChange }) => {
  return (
    <TiltCard className="glass-panel rounded-2xl p-1 animate-border-pulse">
      <div className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-medium text-white mb-3 drop-shadow-lg">Опишите свой сон</h2>
          <p className="text-slate-300 font-normal text-lg">
            Будьте максимально подробны. Опишите цвета, людей, места и действия. 
            Даже мелкие детали могут иметь важное психологическое значение.
          </p>
        </div>

        <div className="relative group">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Я шел по густому лесу, но деревья были сделаны из темного стекла..."
            style={{ backgroundColor: 'rgba(30, 41, 79, 0.9)' }}
            className="w-full h-72 p-6 
              border border-indigo-500/20 
              rounded-xl 
              focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-400 
              outline-none 
              text-lg leading-relaxed resize-none 
              shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] 
              focus:shadow-[0_0_25px_rgba(99,102,241,0.15)]
              text-slate-100 placeholder:text-slate-400 
              transition-all duration-300"
          />
          <div className="absolute top-4 right-4 text-indigo-500/50 group-focus-within:text-indigo-400 group-focus-within:drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all duration-300">
            <Moon size={24} />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <span className={`text-sm font-medium transition-colors ${value.length > 50 ? 'text-emerald-400 drop-shadow-sm' : 'text-amber-400/80'}`}>
             {value.length === 0 ? 'Начните печатать...' : value.length < 50 ? 'Продолжайте описывать...' : 'Отличная длина для анализа'}
          </span>
        </div>
      </div>
    </TiltCard>
  );
};

export default DreamForm;