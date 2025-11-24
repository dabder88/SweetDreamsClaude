/**
 * Service for tracking user dream analysis statistics
 * Tracks total analyzed dreams separately from saved journal entries
 */

const STATS_KEY = 'psydream_stats_v1';

export interface UserStats {
  totalAnalyzedDreams: number; // Total number of dreams analyzed (saved or not)
  lastAnalysisTimestamp?: number;
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
    totalAnalyzedDreams: 0
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
