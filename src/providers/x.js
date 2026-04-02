import { fetchJson } from '../lib/utils.js';

function buildUrl(query, maxResults) {
  const params = new URLSearchParams({
    query,
    max_results: String(maxResults),
    'tweet.fields': 'created_at,author_id,public_metrics,text',
    expansions: 'author_id',
    'user.fields': 'username,name',
  });

  return `https://api.x.com/2/tweets/search/recent?${params.toString()}`;
}

export async function fetchXSignals(config) {
  if (!config.x.bearerToken || config.x.queries.length === 0) {
    return {
      enabled: false,
      items: [],
      errors: [],
    };
  }

  const results = await Promise.allSettled(
    config.x.queries.map(async (query) => {
      const payload = await fetchJson(buildUrl(query, config.x.maxResults), {
        headers: {
          Authorization: `Bearer ${config.x.bearerToken}`,
        },
      });

      const users = new Map((payload.includes?.users || []).map((user) => [user.id, user]));
      return (payload.data || []).map((tweet) => {
        const author = users.get(tweet.author_id);
        return {
          query,
          id: tweet.id,
          text: tweet.text,
          createdAt: tweet.created_at,
          authorName: author?.name || 'Unknown',
          username: author?.username || 'unknown',
          url: `https://x.com/${author?.username || 'i'}/status/${tweet.id}`,
        };
      });
    })
  );

  const items = [];
  const errors = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      items.push(...result.value);
    } else {
      errors.push(`X query failed (${config.x.queries[index]}): ${result.reason.message}`);
    }
  });

  items.sort((a, b) => (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0));

  return {
    enabled: true,
    items: items.slice(0, 10),
    errors,
  };
}
