/**
 * Service for tracking user dream analysis statistics
 * Tracks total analyzed dreams separately from saved journal entries
 */

import { PsychMethod } from '../types';

const STATS_KEY = 'psydream_stats_v1';

export interface MethodUsageStats {
  [key: string]: number; // methodId -> count
}

export interface EmotionRecord {
  emotion: string;
  timestamp: number;
}

export interface SymbolFrequency {
  [symbol: string]: number; // symbol name -> count
}

export interface UserStats {
  totalAnalyzedDreams: number; // Total number of dreams analyzed (saved or not)
  lastAnalysisTimestamp?: number;
  methodUsage?: MethodUsageStats; // Track which methods were used and how many times
  emotionHistory?: EmotionRecord[]; // Track emotions over time
  symbolFrequency?: SymbolFrequency; // Track symbol occurrences
  unlockedAchievements?: string[]; // Array of unlocked achievement IDs
}

/**
 * Get current user statistics
 */
export const getUserStats = (): UserStats => {
  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load user stats:', e);
  }

  return {
    totalAnalyzedDreams: 0,
    methodUsage: {},
    emotionHistory: [],
    symbolFrequency: {},
    unlockedAchievements: []
  };
};

/**
 * Increment the analyzed dreams counter
 * Called whenever a dream analysis completes, regardless of whether it's saved
 */
export const incrementAnalyzedDreams = (): void => {
  try {
    const stats = getUserStats();
    stats.totalAnalyzedDreams += 1;
    stats.lastAnalysisTimestamp = Date.now();
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    console.log('✅ Incremented analyzed dreams count:', stats.totalAnalyzedDreams);
  } catch (e) {
    console.error('Failed to increment analyzed dreams:', e);
  }
};

/**
 * Reset statistics (for testing or user request)
 */
export const resetStats = (): void => {
  localStorage.removeItem(STATS_KEY);
  console.log('✅ Stats reset');
};

/**
 * Get total analyzed dreams count
 */
export const getTotalAnalyzedDreams = (): number => {
  return getUserStats().totalAnalyzedDreams;
};

/**
 * Record usage of a specific psychological method
 * Called whenever a dream is analyzed with a specific method
 */
export const recordMethodUsage = (method: PsychMethod): void => {
  try {
    const stats = getUserStats();

    // Initialize methodUsage if it doesn't exist
    if (!stats.methodUsage) {
      stats.methodUsage = {};
    }

    // Increment count for this method
    stats.methodUsage[method] = (stats.methodUsage[method] || 0) + 1;

    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    console.log(`✅ Recorded method usage: ${method} (total: ${stats.methodUsage[method]})`);
  } catch (e) {
    console.error('Failed to record method usage:', e);
  }
};

/**
 * Get method usage statistics
 */
export const getMethodUsage = (): MethodUsageStats => {
  const stats = getUserStats();
  return stats.methodUsage || {};
};

/**
 * Record an emotion for a dream analysis
 * Called whenever a dream is analyzed with emotional context
 */
export const recordEmotion = (emotion: string): void => {
  try {
    const stats = getUserStats();

    // Initialize emotionHistory if it doesn't exist
    if (!stats.emotionHistory) {
      stats.emotionHistory = [];
    }

    // Add emotion record with timestamp
    stats.emotionHistory.push({
      emotion,
      timestamp: Date.now()
    });

    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    console.log(`✅ Recorded emotion: ${emotion} (total emotions: ${stats.emotionHistory.length})`);
  } catch (e) {
    console.error('Failed to record emotion:', e);
  }
};

/**
 * Get emotion history
 */
export const getEmotionHistory = (): EmotionRecord[] => {
  const stats = getUserStats();
  return stats.emotionHistory || [];
};

/**
 * Record symbols from dream analysis
 * Called whenever a dream is analyzed with symbols
 */
export const recordSymbols = (symbolNames: string[]): void => {
  try {
    const stats = getUserStats();

    // Initialize symbolFrequency if it doesn't exist
    if (!stats.symbolFrequency) {
      stats.symbolFrequency = {};
    }

    // Increment count for each symbol
    symbolNames.forEach(symbol => {
      stats.symbolFrequency![symbol] = (stats.symbolFrequency![symbol] || 0) + 1;
    });

    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    console.log(`✅ Recorded ${symbolNames.length} symbols (total unique: ${Object.keys(stats.symbolFrequency).length})`);
  } catch (e) {
    console.error('Failed to record symbols:', e);
  }
};

/**
 * Get symbol frequency statistics
 */
export const getSymbolFrequency = (): SymbolFrequency => {
  const stats = getUserStats();
  return stats.symbolFrequency || {};
};

/**
 * Unlock an achievement
 * Returns true if achievement was newly unlocked, false if already unlocked
 */
export const unlockAchievement = (achievementId: string): boolean => {
  try {
    const stats = getUserStats();

    // Initialize unlockedAchievements if it doesn't exist
    if (!stats.unlockedAchievements) {
      stats.unlockedAchievements = [];
    }

    // Check if already unlocked
    if (stats.unlockedAchievements.includes(achievementId)) {
      return false;
    }

    // Unlock the achievement
    stats.unlockedAchievements.push(achievementId);
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    console.log(`🏆 Achievement unlocked: ${achievementId}`);
    return true;
  } catch (e) {
    console.error('Failed to unlock achievement:', e);
    return false;
  }
};

/**
 * Check if an achievement is unlocked
 */
export const isAchievementUnlocked = (achievementId: string): boolean => {
  const stats = getUserStats();
  return stats.unlockedAchievements?.includes(achievementId) || false;
};

/**
 * Get all unlocked achievement IDs
 */
export const getUnlockedAchievements = (): string[] => {
  const stats = getUserStats();
  return stats.unlockedAchievements || [];
};
