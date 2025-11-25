import { supabase } from './supabaseClient';
import { AnalysisMetadata } from '../types';

/**
 * Save analysis metadata to Supabase
 * This stores lightweight stats data for ALL analyses (even unsaved ones)
 * Enables cross-device statistics synchronization
 */
export const saveAnalysisMetadata = async (metadata: Omit<AnalysisMetadata, 'created_at'>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('analysis_metadata')
      .insert({
        id: metadata.id,
        user_id: metadata.user_id,
        timestamp: metadata.timestamp,
        method: metadata.method,
        emotion: metadata.emotion,
        recurring: metadata.recurring,
        symbols: metadata.symbols,
        dream_description: metadata.dream_description,
        life_situation: metadata.life_situation,
      });

    if (error) {
      console.error('Error saving analysis metadata:', error);
      throw error;
    }
  } catch (err) {
    console.error('Failed to save analysis metadata:', err);
    // Don't throw - fail silently to not disrupt user experience
  }
};

/**
 * Get all analysis metadata for current user
 */
export const getAnalysisMetadata = async (): Promise<AnalysisMetadata[]> => {
  try {
    const { data, error } = await supabase
      .from('analysis_metadata')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching analysis metadata:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Failed to fetch analysis metadata:', err);
    return [];
  }
};

/**
 * Get analysis metadata within a date range
 */
export const getAnalysisMetadataByDateRange = async (
  startTimestamp: number,
  endTimestamp: number
): Promise<AnalysisMetadata[]> => {
  try {
    const { data, error } = await supabase
      .from('analysis_metadata')
      .select('*')
      .gte('timestamp', startTimestamp)
      .lte('timestamp', endTimestamp)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching analysis metadata by date:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Failed to fetch analysis metadata by date:', err);
    return [];
  }
};

/**
 * Delete analysis metadata by ID
 */
export const deleteAnalysisMetadata = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('analysis_metadata')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting analysis metadata:', error);
      throw error;
    }
  } catch (err) {
    console.error('Failed to delete analysis metadata:', err);
  }
};

/**
 * Migrate localStorage stats to Supabase metadata
 */
export const migrateLocalStatsToSupabase = async (userId: string): Promise<number> => {
  try {
    // Check if migration already happened
    const existingData = await getAnalysisMetadata();
    if (existingData.length > 0) {
      console.log('Metadata already exists in Supabase, skipping migration');
      return 0;
    }

    // Get localStorage stats
    const statsJson = localStorage.getItem('mindscape_user_stats');
    if (!statsJson) {
      return 0;
    }

    const stats = JSON.parse(statsJson);
    let migratedCount = 0;

    // Migrate emotion history to metadata
    if (stats.emotionHistory && Array.isArray(stats.emotionHistory)) {
      const metadataPromises = stats.emotionHistory.map((record: any) => {
        const metadata: Omit<AnalysisMetadata, 'created_at'> = {
          id: `migrated-${record.timestamp || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          user_id: userId,
          timestamp: record.timestamp || Date.now(),
          method: 'auto', // Default for migrated data
          emotion: record.emotion || '',
          recurring: false,
          symbols: [],
        };
        return saveAnalysisMetadata(metadata);
      });

      await Promise.all(metadataPromises);
      migratedCount = stats.emotionHistory.length;
    }

    console.log(`Migrated ${migratedCount} stat records to Supabase`);
    return migratedCount;
  } catch (err) {
    console.error('Error migrating local stats:', err);
    return 0;
  }
};
