import { fetchText, safeDate, stripHtml } from './utils.js';

function matchTag(block, tagName) {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
  const match = block.match(regex);
  return match ? stripHtml(match[1]) : '';
}

function parseItems(xml) {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  const entries = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
  return items.length ? items : entries;
}

function parseLink(block) {
  const atomHref = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*\/?>/i);
  if (atomHref) return atomHref[1];
  return matchTag(block, 'link');
}

export async function fetchRssFeed(feed) {
  const xml = await fetchText(feed.url);
  const blocks = parseItems(xml);

  return blocks.map((block) => {
    const title = matchTag(block, 'title');
    const description = matchTag(block, 'description') || matchTag(block, 'summary') || matchTag(block, 'content');
    const publishedAt =
      safeDate(matchTag(block, 'pubDate')) ||
      safeDate(matchTag(block, 'published')) ||
      safeDate(matchTag(block, 'updated'));

    return {
      source: feed.name,
      title,
      description,
      link: parseLink(block),
      publishedAt: publishedAt ? publishedAt.toISOString() : null,
    };
  }).filter((item) => item.title && item.link);
}
