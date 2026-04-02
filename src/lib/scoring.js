import { normalizeTitle } from './utils.js';

const WAR_KEYWORDS = [
  'war', 'missile', 'drone', 'ceasefire', 'troops', 'sanction', 'nuclear', 'offensive', 'strike', 'gaza', 'ukraine', 'russia', 'iran', 'israel', 'taiwan'
];

const TECH_KEYWORDS = [
  'ai', 'openai', 'nvidia', 'semiconductor', 'chip', 'antitrust', 'funding', 'launch', 'model', 'robot', 'tesla', 'apple', 'google', 'meta', 'microsoft'
];

const PRIORITY_SOURCES = new Set(['Reuters World', 'Reuters Technology', 'AP News World', 'BBC World']);

function isFreshEnough(item, maxAgeHours) {
  if (!item.publishedAt) return true;
  const publishedMs = Date.parse(item.publishedAt);
  if (!publishedMs) return true;
  return (Date.now() - publishedMs) <= maxAgeHours * 60 * 60 * 1000;
}

function keywordScore(text, keywords) {
  const haystack = normalizeTitle(text);
  return keywords.reduce((score, keyword) => score + (haystack.includes(keyword) ? 2 : 0), 0);
}

export function dedupeNews(items) {
  const seen = new Set();
  const deduped = [];

  for (const item of items) {
    const key = normalizeTitle(item.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

export function rankWarNews(items) {
  return [...items]
    .filter((item) => isFreshEnough(item, 168))
    .map((item) => ({
      ...item,
      score:
        keywordScore(`${item.title} ${item.description}`, WAR_KEYWORDS) +
        (PRIORITY_SOURCES.has(item.source) ? 3 : 0),
    }))
    .sort((a, b) => (b.score - a.score) || ((Date.parse(b.publishedAt || '') || 0) - (Date.parse(a.publishedAt || '') || 0)));
}

export function rankTechNews(items) {
  return [...items]
    .filter((item) => isFreshEnough(item, 120))
    .map((item) => ({
      ...item,
      score:
        keywordScore(`${item.title} ${item.description}`, TECH_KEYWORDS) +
        (PRIORITY_SOURCES.has(item.source) ? 3 : 0),
    }))
    .sort((a, b) => (b.score - a.score) || ((Date.parse(b.publishedAt || '') || 0) - (Date.parse(a.publishedAt || '') || 0)));
}
