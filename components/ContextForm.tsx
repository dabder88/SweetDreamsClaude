import React from 'react';
import { DreamContext } from '../types';
import { PREBUILT_EMOTIONS } from '../constants';
import TiltCard from './TiltCard';

interface ContextFormProps {
  data: DreamContext;
  onChange: (data: DreamContext) => void;
}

const ContextForm: React.FC<ContextFormProps> = ({ data, onChange }) => {
  
  const handleChange = (field: keyof DreamContext, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  // Typography Constants
  const LABEL_STYLE = "block text-[17px] uppercase tracking-widest font-bold text-indigo-300 mb-4 drop-shadow-md";
  const BTN_STYLE = "text-[14px] md:text-[14px] px-4 py-3 rounded-full font-medium transition-all duration-300 border backdrop-blur-md shadow-md";
  
  // Input Styling
  const inputStyles = "w-full p-4 rounded-xl border border-indigo-500/20 focus:ring-1 focus:ring-indigo-500/60 focus:border-indigo-400 outline-none text-[15px] shadow-[inset_0_2px_6px_rgba(0,0,0,0.5)] focus:shadow-[0_0_20px_rgba(99,102,241,0.15)] text-slate-100 placeholder:text-slate-500 transition-all duration-300";
  const bgStyle = { backgroundColor: 'rgba(30, 41, 79, 0.9)' };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-serif font-semibold text-white mb-2">Психологический контекст</h2>
        <p className="text-slate-300 text-lg">
          Сны очень индивидуальны. Понимание вашей жизни наяву поможет ИИ подобрать правильный ключ к толкованию.
        </p>
      </div>

      <TiltCard className="glass-panel p-8 rounded-2xl space-y-8 animate-border-pulse">
        
        {/* Emotion Selection */}
        <div>
          <label className={LABEL_STYLE}>
            Доминирующая эмоция
          </label>
          <div className="flex flex-wrap gap-3">
            {PREBUILT_EMOTIONS.map((emotion) => (
              <button
                key={emotion}
                onClick={() => handleChange('emotion', emotion)}
                className={`${BTN_STYLE}
                  ${data.emotion === emotion 
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-105' 
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 hover:text-white'}`}
              >
                {emotion}
              </button>
            ))}
            <input 
              type="text" 
              placeholder="Другое..." 
              style={bgStyle}
              className={`px-4 py-3 rounded-full text-sm border text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-32 transition-all placeholder:text-slate-500 shadow-inner border-slate-700
                ${!PREBUILT_EMOTIONS.includes(data.emotion) && data.emotion ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : ''}
              `}
              onChange={(e) => handleChange('emotion', e.target.value)}
              value={PREBUILT_EMOTIONS.includes(data.emotion) ? '' : data.emotion}
            />
          </div>
        </div>

         {/* Dream Role Selection */}
         <div>
          <label className={LABEL_STYLE}>
            Роль во сне
          </label>
          <div className="flex flex-wrap gap-3">
            {["Главный герой", "Наблюдатель", "Другой человек", "Бестелесный дух"].map((role) => (
              <button
                key={role}
                onClick={() => handleChange('dreamRole', role)}
                className={`${BTN_STYLE}
                  ${data.dreamRole === role 
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-105' 
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 hover:text-white'}`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Character Context Selection */}
        <div>
          <label className={LABEL_STYLE}>
            Персонажи сна
          </label>
          <div className="flex flex-wrap gap-3">
            {["Из прошлого", "Из настоящего", "Незнакомцы", "Смешанные"].map((charType) => (
              <button
                key={charType}
                onClick={() => handleChange('characterType', charType)}
                className={`${BTN_STYLE}
                  ${data.characterType === charType 
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)] scale-105' 
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 hover:text-white'}`}
              >
                {charType}
              </button>
            ))}
          </div>
        </div>

        {/* Life Situation */}
        <div>
          <label className={LABEL_STYLE}>
            Текущая жизненная ситуация
          </label>
          <textarea
            value={data.lifeSituation}
            onChange={(e) => handleChange('lifeSituation', e.target.value)}
            className={`${inputStyles} min-h-[120px]`}
            style={bgStyle}
            placeholder="Я недавно начал новую работу и чувствую себя перегруженным..."
          />
        </div>

        {/* Day Residue */}
        <div>
          <label className={LABEL_STYLE}>
            Дневной остаток (впечатления дня)
          </label>
          <textarea
            value={data.dayResidue}
            onChange={(e) => handleChange('dayResidue', e.target.value)}
            className={`${inputStyles} min-h-[80px]`}
            style={bgStyle}
            placeholder="Фильм, разговор, новость или мысль, которая зацепила вчера..."
          />
        </div>

        {/* Physical Sensation */}
        <div>
          <label className={LABEL_STYLE}>
             Ощущения в теле при пробуждении
          </label>
          <input
            type="text"
            value={data.physicalSensation}
            onChange={(e) => handleChange('physicalSensation', e.target.value)}
            className={inputStyles}
            style={bgStyle}
            placeholder="Сердцебиение, слезы, тяжесть в груди, легкость..."
          />
        </div>

        {/* Associations */}
        <div>
          <label className={LABEL_STYLE}>
            Личные ассоциации
          </label>
          <textarea
            value={data.associations}
            onChange={(e) => handleChange('associations', e.target.value)}
            className={`${inputStyles} min-h-[100px]`}
            style={bgStyle}
            placeholder="Стеклянные деревья напоминают мне о хрупкости..."
          />
        </div>

        {/* Recurring Toggle */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-700/50">
          <span className="text-[17px] font-medium text-slate-200">Это повторяющийся сон?</span>
          <button
            onClick={() => handleChange('recurring', !data.recurring)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-inner ${data.recurring ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-800 border border-slate-600'}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-200 ease-in-out shadow-md ${data.recurring ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
        </div>
      </TiltCard>
    </div>
  );
};

export default ContextForm;