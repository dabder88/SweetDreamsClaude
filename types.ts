
export enum PsychMethod {
  AUTO = 'auto',
  JUNGIAN = 'jungian',
  FREUDIAN = 'freudian',
  GESTALT = 'gestalt',
  COGNITIVE = 'cognitive', // CBT oriented
  EXISTENTIAL = 'existential'
}

export interface DreamContext {
  emotion: string;
  lifeSituation: string;
  associations: string;
  recurring: boolean;
  dayResidue: string;
  characterType: string;
  dreamRole: string;
  physicalSensation: string;
}

export interface DreamData {
  description: string;
  context: DreamContext;
  method: PsychMethod;
}

export interface DreamSymbol {
  name: string;
  meaning: string;
}

export interface AnalysisResponse {
  summary: string;
  symbolism: DreamSymbol[];
  analysis: string; // Deep dive text
  advice: string[]; // Array of strings for distinct advice blocks
  questions: string[];
}

export interface JournalEntry {
  id: string;
  timestamp: number;
  dreamData: DreamData;
  analysis: AnalysisResponse | string; // Support legacy string or new structured object
  imageUrl?: string | null;
  notes?: string;
}

export type AppView = 'wizard' | 'landing' | 'dashboard' | 'journal' | 'analytics' | 'archetypes' | 'settings';
