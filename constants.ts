import { PsychMethod } from './types';
import { Brain, User, Layers, Lightbulb, Compass, Sparkles } from 'lucide-react';

export const PSYCH_METHODS = [
  {
    id: PsychMethod.AUTO,
    name: 'Рекомендация ИИ',
    description: 'Позвольте ИИ выбрать лучшую психологическую концепцию на основе вашего сна.',
    icon: Sparkles,
    color: 'text-purple-300',
    bgColor: 'bg-purple-900/30',
    borderColor: 'border-purple-500/30'
  },
  {
    id: PsychMethod.JUNGIAN,
    name: 'Юнгианский анализ',
    description: 'Фокус на архетипах, коллективном бессознательном и пути к индивидуации.',
    icon: Layers,
    color: 'text-indigo-300',
    bgColor: 'bg-indigo-900/30',
    borderColor: 'border-indigo-500/30'
  },
  {
    id: PsychMethod.GESTALT,
    name: 'Гештальт-терапия',
    description: 'Рассматривает каждого персонажа и объект во сне как фрагментированную часть вас.',
    icon: User,
    color: 'text-teal-300',
    bgColor: 'bg-teal-900/30',
    borderColor: 'border-teal-500/30'
  },
  {
    id: PsychMethod.COGNITIVE,
    name: 'Когнитивный (КПТ)',
    description: 'Анализирует, как сон отражает ваши мысли, убеждения и проблемы реальной жизни.',
    icon: Brain,
    color: 'text-blue-300',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-500/30'
  },
  {
    id: PsychMethod.FREUDIAN,
    name: 'Фрейдистский анализ',
    description: 'Исследует вытесненные желания, детские воспоминания и скрытые конфликты.',
    icon: Lightbulb, 
    color: 'text-rose-300',
    bgColor: 'bg-rose-900/30',
    borderColor: 'border-rose-500/30'
  },
  {
    id: PsychMethod.EXISTENTIAL,
    name: 'Экзистенциальный',
    description: 'Исследует темы свободы, ответственности, смертности и поиска смысла.',
    icon: Compass,
    color: 'text-amber-300',
    bgColor: 'bg-amber-900/30',
    borderColor: 'border-amber-500/30'
  },
];

export const PREBUILT_EMOTIONS = [
  "Тревога/Страх", "Радость/Экстаз", "Замешательство", "Грусть/Горе", "Гнев", "Покой/Облегчение", "Стыд/Вина"
];