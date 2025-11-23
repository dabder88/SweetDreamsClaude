import { supabase, isSupabaseConfigured } from './supabaseClient';
import { JournalEntry } from '../types';
import * as localStorageService from './storageService';

const TABLE_NAME = 'dream_entries';

/**
 * Get all journal entries for the current user from Supabase
 */
export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  // Fallback to localStorage if Supabase not configured
  if (!isSupabaseConfigured()) {
    return localStorageService.getJournalEntries();
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // Not authenticated - return empty array
      return [];
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching journal entries:', error);
      return [];
    }

    // Transform database format to app format
    return (data || []).map(entry => ({
      id: entry.id,
      user_id: entry.user_id,
      timestamp: entry.timestamp,
      dreamData: entry.dream_data,
      analysis: entry.analysis,
      imageUrl: entry.image_url,
      notes: entry.notes,
    }));
  } catch (e) {
    console.error('Failed to load journal from Supabase:', e);
    return [];
  }
};

/**
 * Save a new journal entry to Supabase
 */
export const saveJournalEntry = async (entry: JournalEntry): Promise<boolean> => {
  // Fallback to localStorage if Supabase not configured
  if (!isSupabaseConfigured()) {
    localStorageService.saveJournalEntry(entry);
    return true;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('No authenticated user');
      return false;
    }

    const { error } = await supabase
      .from(TABLE_NAME)
      .insert([{
        id: entry.id,
        user_id: user.id,
        timestamp: entry.timestamp,
        dream_data: entry.dreamData,
        analysis: entry.analysis,
        image_url: entry.imageUrl,
        notes: entry.notes,
      }]);

    if (error) {
      console.error('Error saving journal entry:', error);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Failed to save entry to Supabase:', e);
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
