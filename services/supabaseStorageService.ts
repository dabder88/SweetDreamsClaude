import { supabase, isSupabaseConfigured } from './supabaseClient';
import { JournalEntry } from '../types';
import * as localStorageService from './storageService';

const TABLE_NAME = 'dream_entries';

/**
 * Get all journal entries for the current user from Supabase
 */
export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  console.log('🔵 [GetEntries] Starting fetch process...');

  // Fallback to localStorage if Supabase not configured
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ [GetEntries] Supabase not configured, using localStorage');
    const localEntries = localStorageService.getJournalEntries();
    console.log('🔵 [GetEntries] Loaded from localStorage:', localEntries.length, 'entries');
    return localEntries;
  }

  console.log('✅ [GetEntries] Supabase is configured');

  try {
    console.log('🔵 [GetEntries] Getting current user...');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.warn('⚠️ [GetEntries] No authenticated user - returning empty array');
      return [];
    }

    console.log('✅ [GetEntries] User authenticated:', user.email);
    console.log('🔵 [GetEntries] Fetching entries from table:', TABLE_NAME);

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('❌ [GetEntries] Error fetching entries:', error);
      console.error('❌ [GetEntries] Error code:', error.code);
      console.error('❌ [GetEntries] Error message:', error.message);
      return [];
    }

    console.log('✅ [GetEntries] Successfully fetched from Supabase');
    console.log('🔵 [GetEntries] Found', data?.length || 0, 'entries');

    // Transform database format to app format
    const entries = (data || []).map(entry => ({
      id: entry.id,
      user_id: entry.user_id,
      timestamp: entry.timestamp,
      dreamData: entry.dream_data,
      analysis: entry.analysis,
      imageUrl: entry.image_url,
      notes: entry.notes,
    }));

    console.log('✅ [GetEntries] Transformed', entries.length, 'entries to app format');
    return entries;
  } catch (e) {
    console.error('❌ [GetEntries] Exception caught:', e);
    console.error('❌ [GetEntries] Error details:', JSON.stringify(e, null, 2));
    return [];
  }
};

/**
 * Save a new journal entry to Supabase
 */
export const saveJournalEntry = async (entry: JournalEntry): Promise<boolean> => {
  console.log('🔵 [SaveEntry] Starting save process...');
  console.log('🔵 [SaveEntry] Entry ID:', entry.id);
  console.log('🔵 [SaveEntry] Timestamp:', new Date(entry.timestamp).toLocaleString());

  // Fallback to localStorage if Supabase not configured
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ [SaveEntry] Supabase not configured, falling back to localStorage');
    localStorageService.saveJournalEntry(entry);
    return true;
  }

  console.log('✅ [SaveEntry] Supabase is configured');

  try {
    console.log('🔵 [SaveEntry] Getting current user...');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('❌ [SaveEntry] No authenticated user found');
      console.error('❌ [SaveEntry] User needs to login first');
      return false;
    }

    console.log('✅ [SaveEntry] User authenticated:', user.email);
    console.log('🔵 [SaveEntry] User ID:', user.id);

    const dataToInsert = {
      id: entry.id,
      user_id: user.id,
      timestamp: entry.timestamp,
      dream_data: entry.dreamData,
      analysis: entry.analysis,
      image_url: entry.imageUrl,
      notes: entry.notes,
    };

    console.log('🔵 [SaveEntry] Inserting into Supabase table:', TABLE_NAME);
    console.log('🔵 [SaveEntry] Data structure:', {
      id: dataToInsert.id,
      user_id: dataToInsert.user_id,
      timestamp: dataToInsert.timestamp,
      has_dream_data: !!dataToInsert.dream_data,
      has_analysis: !!dataToInsert.analysis,
      has_image: !!dataToInsert.image_url,
    });

    const { error } = await supabase
      .from(TABLE_NAME)
      .insert([dataToInsert]);

    if (error) {
      console.error('❌ [SaveEntry] Supabase insert error:', error);
      console.error('❌ [SaveEntry] Error code:', error.code);
      console.error('❌ [SaveEntry] Error message:', error.message);
      console.error('❌ [SaveEntry] Error details:', error.details);
      return false;
    }

    console.log('✅ [SaveEntry] Successfully saved to Supabase!');
    console.log('✅ [SaveEntry] Entry can be viewed in Supabase Dashboard');
    return true;
  } catch (e) {
    console.error('❌ [SaveEntry] Exception caught:', e);
    console.error('❌ [SaveEntry] Error type:', typeof e);
    console.error('❌ [SaveEntry] Error details:', JSON.stringify(e, null, 2));
    return false;
  }
};

/**
 * Delete a journal entry from Supabase
 */
export const deleteJournalEntry = async (id: string): Promise<boolean> => {
  // Fallback to localStorage if Supabase not configured
  if (!isSupabaseConfigured()) {
    localStorageService.deleteJournalEntry(id);
    return true;
  }

  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting journal entry:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Failed to delete entry from Supabase:', e);
    return false;
  }
};

/**
 * Update a journal entry in Supabase
 */
export const updateJournalEntry = async (id: string, updates: Partial<JournalEntry>): Promise<boolean> => {
  // Fallback to localStorage if Supabase not configured
  if (!isSupabaseConfigured()) {
    localStorageService.updateJournalEntry(id, updates);
    return true;
  }

  try {
    // Transform app format to database format
    const dbUpdates: any = {};
    if (updates.dreamData !== undefined) dbUpdates.dream_data = updates.dreamData;
    if (updates.analysis !== undefined) dbUpdates.analysis = updates.analysis;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.timestamp !== undefined) dbUpdates.timestamp = updates.timestamp;

    const { error } = await supabase
      .from(TABLE_NAME)
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating journal entry:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Failed to update entry in Supabase:', e);
    return false;
  }
};

/**
 * Migrate local storage entries to Supabase for authenticated user
 */
export const migrateLocalEntriesToSupabase = async (): Promise<number> => {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return 0;
    }

    // Get local entries
    const localEntries = localStorageService.getJournalEntries();

    if (localEntries.length === 0) {
      return 0;
    }

    // Check if user already has entries in Supabase
    const { data: existingEntries } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('user_id', user.id);

    // If user already has entries, don't migrate (avoid duplicates)
    if (existingEntries && existingEntries.length > 0) {
      return 0;
    }

    // Insert all local entries
    const entriesToInsert = localEntries.map(entry => ({
      id: entry.id,
      user_id: user.id,
      timestamp: entry.timestamp,
      dream_data: entry.dreamData,
      analysis: entry.analysis,
      image_url: entry.imageUrl,
      notes: entry.notes,
    }));

    const { error } = await supabase
      .from(TABLE_NAME)
      .insert(entriesToInsert);

    if (error) {
      console.error('Error migrating entries:', error);
      return 0;
    }

    return localEntries.length;
  } catch (e) {
    console.error('Failed to migrate entries:', e);
    return 0;
  }
};

/**
 * Delete ALL user data from Supabase (journal entries and analysis metadata)
 * WARNING: This is irreversible!
 */
export const deleteAllUserData = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    // If no Supabase, just clear localStorage
    localStorage.clear();
    return true;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    // Delete all journal entries
    const { error: entriesError } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('user_id', user.id);

    if (entriesError) {
      console.error('Error deleting journal entries:', entriesError);
      throw entriesError;
    }

    // Delete all analysis metadata
    const { error: metadataError } = await supabase
      .from('analysis_metadata')
      .delete()
      .eq('user_id', user.id);

    if (metadataError) {
      console.error('Error deleting analysis metadata:', metadataError);
      // Don't throw - metadata deletion is less critical
    }

    // Also clear localStorage
    localStorage.clear();

    return true;
  } catch (e) {
    console.error('Failed to delete all user data:', e);
    return false;
  }
};

/**
 * ==========================================
 * ARCHETYPE PROFILE STORAGE
 * ==========================================
 */

const ARCHETYPE_PROFILE_KEY = 'psydream_archetype_profile_v1';

export interface ArchetypeProfile {
  scores: any; // ArchetypeScores from geminiService
  topArchetypes: { archetype: any; score: number }[];
  lastAnalyzed: number;
  analyzedDreamsCount: number;
}

/**
 * Save archetype profile to localStorage (fallback) or user metadata
 */
export const saveArchetypeProfile = async (profile: ArchetypeProfile): Promise<boolean> => {
  console.log('💾 Saving archetype profile:', profile);

  // Always save to localStorage as fallback
  try {
    localStorage.setItem(ARCHETYPE_PROFILE_KEY, JSON.stringify(profile));
    console.log('✅ Successfully saved archetype profile to localStorage');
  } catch (e) {
    console.error('❌ Failed to save archetype profile to localStorage:', e);
    return false;
  }

  // If Supabase is configured, also save to user metadata (for future use)
  if (!isSupabaseConfigured()) {
    return true;
  }

  // For now, we're only using localStorage
  // In future, we could save to a separate 'archetype_profiles' table in Supabase
  return true;
};

/**
 * Load archetype profile from localStorage or Supabase
 */
export const loadArchetypeProfile = async (): Promise<ArchetypeProfile | null> => {
  console.log('📂 Loading archetype profile from localStorage...');

  // Try localStorage first
  try {
    const stored = localStorage.getItem(ARCHETYPE_PROFILE_KEY);
    if (stored) {
      const profile = JSON.parse(stored);
      console.log('✅ Successfully loaded archetype profile:', profile);
      return profile;
    } else {
      console.log('⚠️ No saved archetype profile found');
    }
  } catch (e) {
    console.error('❌ Failed to load archetype profile from localStorage:', e);
  }

  // In future, we could load from Supabase here
  return null;
};

/**
 * Mark archetype profile as stale (needs re-analysis)
 * Called after each new dream analysis to trigger profile refresh
 */
export const markArchetypeProfileAsStale = (): void => {
  try {
    localStorage.setItem('psydream_archetype_profile_stale', 'true');
    console.log('✅ Marked archetype profile as stale - will trigger refresh');
  } catch (e) {
    console.error('❌ Failed to mark profile as stale:', e);
  }
};

/**
 * Check if archetype profile needs refresh
 */
export const isArchetypeProfileStale = (): boolean => {
  try {
    const isStale = localStorage.getItem('psydream_archetype_profile_stale') === 'true';
    return isStale;
  } catch (e) {
    return false;
  }
};

/**
 * Clear stale flag after profile refresh
 */
export const clearArchetypeProfileStaleFlag = (): void => {
  try {
    localStorage.removeItem('psydream_archetype_profile_stale');
    console.log('✅ Cleared archetype profile stale flag');
  } catch (e) {
    console.error('❌ Failed to clear stale flag:', e);
  }
};
