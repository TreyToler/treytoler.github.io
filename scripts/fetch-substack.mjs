// Fetches Trey's latest Substack posts from the publication's public RSS
// feed (no API key needed) and writes them to data/substack.json so the
// static site can render a "Recent Posts" list in the Newsletter section.

import fs from "fs";

const FEED_URL = "https://thetreytoler.substack.com/feed";
const POST_COUNT = 3;

function decodeEntities(str) {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeEntities(match[1]) : "";
}

const res = await fetch(FEED_URL, {
  headers: { "User-Agent": "Mozilla/5.0 (compatible; treytoler-site-sync/1.0)" },
});

if (!res.ok) {
  throw new Error(`Feed fetch failed: ${res.status} ${res.statusText}`);
}

const xml = await res.text();
const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

const posts = items.slice(0, POST_COUNT).map((block) => {
  const title = extractTag(block, "title");
  const link = extractTag(block, "link");
  const pubDateRaw = extractTag(block, "pubDate");
  let pubDate = pubDateRaw;
  try {
    pubDate = new Date(pubDateRaw).toISOString();
  } catch {
    // keep raw string if it doesn't parse
  }
  return { title, link, pubDate };
});

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync(
  "data/substack.json",
  JSON.stringify({ updatedAt: new Date().toISOString(), posts }, null, 2)
);

console.log(`Wrote ${posts.length} posts to data/substack.json`);
