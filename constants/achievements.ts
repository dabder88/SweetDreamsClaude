import { Sparkles, BookOpen, Calendar, Layers, Image, Target, Award, TrendingUp } from 'lucide-react';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  condition: (stats: any, entries: any[]) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_dream',
    name: 'Первый сон',
    description: 'Проанализируйте свой первый сон',
    icon: Sparkles,
    color: 'text-purple-300',
    bgColor: 'bg-purple-900/30',
    borderColor: 'border-purple-500/30',
    condition: (stats) => stats.totalAnalyzedDreams >= 1
  },
  {
    id: 'first_save',
    name: 'Начало пути',
    description: 'Сохраните первый сон в журнал',
    icon: BookOpen,
    color: 'text-emerald-300',
    bgColor: 'bg-emerald-900/30',
    borderColor: 'border-emerald-500/30',
    condition: (stats, entries) => entries.length >= 1
  },
  {
    id: 'ten_dreams',
    name: '10 снов',
    description: 'Сохраните 10 снов в журнал',
    icon: Target,
    color: 'text-indigo-300',
    bgColor: 'bg-indigo-900/30',
    borderColor: 'border-indigo-500/30',
    condition: (stats, entries) => entries.length >= 10
  },
  {
    id: 'month_journaling',
    name: 'Месяц ведения',
    description: 'Ведите дневник снов целый месяц',
    icon: Calendar,
    color: 'text-amber-300',
    bgColor: 'bg-amber-900/30',
    borderColor: 'border-amber-500/30',
    condition: (stats, entries) => {
      if (entries.length === 0) return false;
      const timestamps = entries.map(e => e.timestamp).sort((a, b) => a - b);
      const firstDate = timestamps[0];
      const lastDate = timestamps[timestamps.length - 1];
      const daysDiff = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24));
      return daysDiff >= 30;
    }
  },
  {
    id: 'method_explorer',
    name: 'Исследователь методов',
    description: 'Используйте все психологические методы',
    icon: Layers,
    color: 'text-teal-300',
    bgColor: 'bg-teal-900/30',
    borderColor: 'border-teal-500/30',
    condition: (stats) => {
      const methodUsage = stats.methodUsage || {};
      const usedMethods = Object.keys(methodUsage).length;
      // 6 методов: AUTO, JUNGIAN, GESTALT, COGNITIVE, FREUDIAN, EXISTENTIAL
      return usedMethods >= 6;
    }
  },
  {
    id: 'visualizer',
    name: 'Визуализатор',
    description: 'Создайте 5 AI-визуализаций',
    icon: Image,
    color: 'text-pink-300',
    bgColor: 'bg-pink-900/30',
    borderColor: 'border-pink-500/30',
    condition: (stats, entries) => {
      const withImages = entries.filter(e => e.imageUrl).length;
      return withImages >= 5;
    }
  },
  {
    id: 'symbol_collector',
    name: 'Коллекционер символов',
    description: 'Соберите 50 уникальных символов',
    icon: Award,
    color: 'text-cyan-300',
    bgColor: 'bg-cyan-900/30',
    borderColor: 'border-cyan-500/30',
    condition: (stats) => {
      const symbolFrequency = stats.symbolFrequency || {};
      const uniqueSymbols = Object.keys(symbolFrequency).length;
      return uniqueSymbols >= 50;
    }
  },
  {
    id: 'active_analyzer',
    name: 'Активный аналитик',
    description: 'Проанализируйте 50 снов',
    icon: TrendingUp,
    color: 'text-blue-300',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-500/30',
    condition: (stats) => stats.totalAnalyzedDreams >= 50
  }
];
