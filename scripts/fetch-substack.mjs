// Fetches Trey's latest Substack posts and writes them to
// data/substack.json so the static site can render a "Recent Posts" list
// in the Newsletter section.
//
// Tries the publication's own RSS feed first. Substack sometimes blocks
// requests coming from cloud/datacenter IPs (like GitHub Actions runners)
// with a 403, so if the direct fetch fails, this falls back to the
// rss2json.com proxy, which fetches the same feed from its own servers.

import fs from "fs";

const FEED_URL = "https://thetreytoler.substack.com/feed";
const PROXY_URL = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(FEED_URL)}`;
const POST_COUNT = 3;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/rss+xml, application/xml, text/xml, */*",
  "Accept-Language": "en-US,en;q=0.9",
};

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

async function fetchDirect() {
  const res = await fetch(FEED_URL, { headers: BROWSER_HEADERS });
  if (!res.ok) {
    throw new Error(`Direct feed fetch failed: ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

  return items.slice(0, POST_COUNT).map((block) => {
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
}

async function fetchViaProxy() {
  const res = await fetch(PROXY_URL);
  if (!res.ok) {
    throw new Error(`Proxy feed fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  if (data.status !== "ok" || !Array.isArray(data.items)) {
    throw new Error(`Proxy returned unexpected payload: ${JSON.stringify(data).slice(0, 200)}`);
  }

  return data.items.slice(0, POST_COUNT).map((item) => ({
    title: decodeEntities(item.title || ""),
    link: item.link || "",
    pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : "",
  }));
}

let posts;
try {
  posts = await fetchDirect();
  console.log("Fetched feed directly.");
} catch (directErr) {
  console.warn(`Direct fetch failed (${directErr.message}), trying proxy fallback...`);
  posts = await fetchViaProxy();
  console.log("Fetched feed via rss2json proxy.");
}

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync(
  "data/substack.json",
  JSON.stringify({ updatedAt: new Date().toISOString(), posts }, null, 2)
);

console.log(`Wrote ${posts.length} posts to data/substack.json`);
