/**
 * Service for tracking user dream analysis statistics
 * Tracks total analyzed dreams separately from saved journal entries
 */

import { PsychMethod } from '../types';

const STATS_KEY = 'psydream_stats_v1';

export interface MethodUsageStats {
  [key: string]: number; // methodId -> count
}

export interface UserStats {
  totalAnalyzedDreams: number; // Total number of dreams analyzed (saved or not)
  lastAnalysisTimestamp?: number;
  methodUsage?: MethodUsageStats; // Track which methods were used and how many times
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
    methodUsage: {}
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
