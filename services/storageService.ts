import { JournalEntry } from '../types';

const STORAGE_KEY = 'mindscape_journal_v1';

export const getJournalEntries = (): JournalEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load journal", e);
    return [];
  }
};

export const saveJournalEntry = (entry: JournalEntry): void => {
  try {
    const entries = getJournalEntries();
    // Avoid duplicates if possible, though ID generation usually prevents this.
    const newEntries = [entry, ...entries];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
  } catch (e) {
    console.error("Failed to save entry", e);
  }
};

export const deleteJournalEntry = (id: string): void => {
  const entries = getJournalEntries().filter(e => e.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

export const updateJournalEntry = (id: string, updates: Partial<JournalEntry>): void => {
  const entries = getJournalEntries().map(e => 
    e.id === id ? { ...e, ...updates } : e
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};