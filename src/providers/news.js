import { fetchRssFeed } from '../lib/rss.js';
import { dedupeNews, rankTechNews, rankWarNews } from '../lib/scoring.js';

async function collectFeeds(feeds) {
  const results = await Promise.allSettled(feeds.map((feed) => fetchRssFeed(feed)));
  const items = [];
  const errors = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      items.push(...result.value);
    } else {
      errors.push(`${feeds[index].name}: ${result.reason.message}`);
    }
  });

  return { items, errors };
}

export async function fetchNews(config) {
  const warData = await collectFeeds(config.feeds.wars);
  const techData = await collectFeeds(config.feeds.tech);

  return {
    wars: rankWarNews(dedupeNews(warData.items)).slice(0, 8),
    tech: rankTechNews(dedupeNews(techData.items)).slice(0, 8),
    errors: [...warData.errors, ...techData.errors],
  };
}
