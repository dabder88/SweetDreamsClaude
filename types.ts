
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

export interface User {
  id: string;
  email: string;
  created_at: string;
  name?: string; // Display name
  avatar_url?: string; // Avatar image URL from Supabase Storage
  gender?: 'male' | 'female'; // User's gender
  date_of_birth?: string; // ISO date string (YYYY-MM-DD)
}

export interface JournalEntry {
  id: string;
  user_id?: string; // Optional for backward compatibility with localStorage
  timestamp: number;
  dreamData: DreamData;
  analysis: AnalysisResponse | string; // Support legacy string or new structured object
  imageUrl?: string | null;
  notes?: string;
}

/**
 * Lightweight metadata for dream analysis statistics
 * Stored in Supabase for all analyses (even unsaved ones)
 * Used for cross-device statistics synchronization
 */
export interface AnalysisMetadata {
  id: string;
  user_id: string;
  timestamp: number;
  method: PsychMethod;
  emotion: string;
  recurring: boolean;
  symbols: string[]; // Array of symbol names for frequency tracking
  dream_description?: string; // Brief description of the dream for archetype analysis
  life_situation?: string; // Life context for better analysis
  created_at?: string;
}

export type AppView = 'wizard' | 'landing' | 'dashboard' | 'journal' | 'dreamView' | 'analytics' | 'archetypes' | 'settings' | 'auth';
