export interface WordDefinition {
  definition: string;
  partOfSpeech?: string;
}

const REQUEST_TIMEOUT_MS = 5000;
const definitionCache = new Map<string, Promise<WordDefinition | null>>();

export function parseEnglishDefinition(data: unknown): WordDefinition | null {
  if (!Array.isArray(data)) return null;

  for (const entry of data) {
    if (!entry || typeof entry !== 'object') continue;
    const meanings = (entry as { meanings?: unknown }).meanings;
    if (!Array.isArray(meanings)) continue;
    for (const meaning of meanings) {
      if (!meaning || typeof meaning !== 'object') continue;
      const definitions = (meaning as { definitions?: unknown }).definitions;
      if (!Array.isArray(definitions)) continue;
      for (const item of definitions) {
        if (!item || typeof item !== 'object') continue;
        const definition = (item as { definition?: unknown }).definition;
        if (typeof definition === 'string' && definition.trim()) {
          const partOfSpeech = (meaning as { partOfSpeech?: unknown }).partOfSpeech;
          return {
            definition: definition.trim(),
            ...(typeof partOfSpeech === 'string' ? { partOfSpeech } : {}),
          };
        }
      }
    }
  }
  return null;
}

export function parseIndonesianDefinition(data: unknown): WordDefinition | null {
  if (!data || typeof data !== 'object') return null;
  const query = (data as { query?: unknown }).query;
  if (!query || typeof query !== 'object') return null;
  const pages = (query as { pages?: unknown }).pages;
  if (!pages || typeof pages !== 'object') return null;

  for (const page of Object.values(pages)) {
    if (!page || typeof page !== 'object') continue;
    const extract = (page as { extract?: unknown }).extract;
    if (typeof extract !== 'string') continue;

    // Wiktionary extract format: heading, pronunciation, then the first meaning.
    const indonesianSection = extract.split(/\n==\s*Bahasa Indonesia\s*==/i)[1] ?? extract;
    const withoutOtherLanguages = indonesianSection.split(/\n==\s*Bahasa /i)[0];
    const lines = withoutOtherLanguages
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => !/^=+/.test(line))
      .filter((line) => !/^[·‧.-]+$/.test(line));

    // Skip the headword/pronunciation; use a meaningful definition line.
    const definition = lines.find((line) =>
      !/^\(?[a-z]+[·‧-][a-z]+\)?$/i.test(line) &&
      !/^\(?[a-z]+\)?$/i.test(line) &&
      !/^\d+\.?$/.test(line)
    );
    if (definition) return { definition };
  }
  return null;
}

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchDefinition(word: string, language: 'id' | 'en'): Promise<WordDefinition | null> {
  const normalized = word.toLowerCase().trim();
  if (!normalized || !/^[a-z]+$/.test(normalized)) return null;

  if (language === 'en') {
    const data = await fetchJson(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalized)}`
    );
    return parseEnglishDefinition(data);
  }

  const data = await fetchJson(
    `https://id.wiktionary.org/w/api.php?action=query&prop=extracts&explaintext=true&titles=${encodeURIComponent(normalized)}&format=json&origin=*`
  );
  return parseIndonesianDefinition(data);
}

export function getWordDefinition(
  word: string,
  language: 'id' | 'en' | 'mix'
): Promise<WordDefinition | null> {
  const normalized = word.toLowerCase().trim();

  if (language === 'mix') {
    // Untuk MIX: coba ID dulu; kalau tidak ada coba EN (masing-masing di-cache terpisah).
    const keyId = `id:${normalized}`;
    if (!definitionCache.has(keyId)) {
      const req = fetchDefinition(normalized, 'id').then((defId) => {
        if (defId) return defId;
        return fetchDefinition(normalized, 'en');
      });
      definitionCache.set(keyId, req);
    }
    return definitionCache.get(keyId)!;
  }

  const sourceLanguage = language === 'en' ? 'en' : 'id';
  const key = `${sourceLanguage}:${normalized}`;
  if (!definitionCache.has(key)) {
    definitionCache.set(key, fetchDefinition(normalized, sourceLanguage));
  }
  return definitionCache.get(key)!;
}
