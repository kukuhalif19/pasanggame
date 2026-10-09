import { INDONESIAN_DICTIONARY } from './dictionary';
import type { GameLanguage } from '../types';

// Kamus Inggris sengaja tidak di-import statis agar tidak masuk bundle awal.
let englishDictionary: Set<string> | null = null;
let englishLoading: Promise<Set<string>> | null = null;

export async function ensureDictionaryLoaded(language: GameLanguage): Promise<void> {
  if (language === 'id') return;

  if (!englishDictionary) {
    englishLoading ??= import('./dictionary-en').then((module) => {
      englishDictionary = module.ENGLISH_DICTIONARY;
      return englishDictionary;
    });
    await englishLoading;
  }
}

export function isValidWordForLanguage(word: string, language: GameLanguage): boolean {
  const normalized = word.toLowerCase().trim();
  const isIndonesian = INDONESIAN_DICTIONARY.has(normalized);
  if (language === 'id') return isIndonesian;

  // Guard: caller wajib memanggil ensureDictionaryLoaded sebelum gameplay.
  const isEnglish = englishDictionary?.has(normalized) ?? false;
  return language === 'mix' ? isIndonesian || isEnglish : isEnglish;
}

export function isEnglishDictionaryLoaded(): boolean {
  return englishDictionary !== null;
}
