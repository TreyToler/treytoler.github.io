// Fetches Trey's latest Substack posts and writes them to
// data/substack.json so the static site can render a "Recent Posts" list
// in the Newsletter section.
//
// Tries the publication's own RSS feed first. Substack sometimes blocks
// requests coming from cloud/datacenter IPs (like GitHub Actions runners)
// with a 403, so if the direct fetch fails, this falls through a chain of
// public read-through proxies (each fetches the feed from its own server,
// which usually has a different IP reputation than GitHub's runners).
// If every proxy is unavailable in a given run, we log the failure and
// exit cleanly rather than failing the whole workflow — the site just
// keeps showing the last successfully-fetched posts until the next run.

import fs from "fs";

const FEED_URL = "https://thetreytoler.substack.com/feed";
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

function parseRssXml(xml) {
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

async function fetchDirect() {
  const res = await fetch(FEED_URL, { headers: BROWSER_HEADERS });
  if (!res.ok) {
    throw new Error(`Direct feed fetch failed: ${res.status} ${res.statusText}`);
  }
  return parseRssXml(await res.text());
}

// Plain read-through proxies: each just mirrors the raw feed bytes, so we
// can reuse the same XML parser for all of them. Tried in order; any one
// having a bad day doesn't take down the sync.
const XML_PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

async function fetchViaXmlProxy(buildUrl) {
  const res = await fetch(buildUrl(FEED_URL));
  if (!res.ok) {
    throw new Error(`Proxy feed fetch failed: ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();
  const posts = parseRssXml(xml);
  if (!posts.length) {
    throw new Error("Proxy returned no parseable <item> blocks");
  }
  return posts;
}

// Last-resort JSON-transform proxy (needs its own parsing shape).
async function fetchViaRss2Json() {
  const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(FEED_URL)}`;
  const res = await fetch(proxyUrl);
  if (!res.ok) {
    throw new Error(`rss2json fetch failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (data.status !== "ok" || !Array.isArray(data.items)) {
    throw new Error(`rss2json returned unexpected payload: ${JSON.stringify(data).slice(0, 200)}`);
  }
  return data.items.slice(0, POST_COUNT).map((item) => ({
    title: decodeEntities(item.title || ""),
    link: item.link || "",
    pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : "",
  }));
}

async function fetchWithFallbacks() {
  try {
    const posts = await fetchDirect();
    console.log("Fetched feed directly.");
    return posts;
  } catch (directErr) {
    console.warn(`Direct fetch failed (${directErr.message}).`);
  }

  for (const buildUrl of XML_PROXIES) {
    try {
      const posts = await fetchViaXmlProxy(buildUrl);
      console.log(`Fetched feed via proxy: ${buildUrl(FEED_URL).split("?")[0]}`);
      return posts;
    } catch (proxyErr) {
      console.warn(`Proxy fetch failed (${buildUrl(FEED_URL).split("?")[0]}): ${proxyErr.message}`);
    }
  }

  try {
    const posts = await fetchViaRss2Json();
    console.log("Fetched feed via rss2json proxy.");
    return posts;
  } catch (rss2jsonErr) {
    console.warn(`rss2json fetch failed: ${rss2jsonErr.message}`);
  }

  return null;
}

const posts = await fetchWithFallbacks();

if (!posts) {
  console.error(
    "All fetch methods failed this run (direct feed + every proxy). Leaving data/substack.json untouched and exiting cleanly so this doesn't spam failure emails — will retry next scheduled run."
  );
  process.exit(0);
}

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync(
  "data/substack.json",
  JSON.stringify({ updatedAt: new Date().toISOString(), posts }, null, 2)
);

console.log(`Wrote ${posts.length} posts to data/substack.json`);
