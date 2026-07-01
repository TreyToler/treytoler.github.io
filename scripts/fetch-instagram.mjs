// Fetches Trey's latest Instagram posts via the Instagram Graph API,
// refreshes the long-lived access token if needed, and writes the
// results to data/instagram.json so the static site can render them.
//
// Required env var: INSTAGRAM_ACCESS_TOKEN
// Writes to GITHUB_OUTPUT: token=<possibly refreshed token>

import fs from "fs";

const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;

if (!TOKEN) {
  console.error("Missing INSTAGRAM_ACCESS_TOKEN environment variable.");
  process.exit(1);
}

async function refreshToken(token) {
  const url = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(
    token
  )}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(
        `Token refresh failed (${res.status}), continuing with existing token.`
      );
      return token;
    }
    const data = await res.json();
    return data.access_token || token;
  } catch (err) {
    console.warn("Token refresh request errored, continuing with existing token:", err.message);
    return token;
  }
}

async function fetchMedia(token) {
  const fields = "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp";
  const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=9&access_token=${encodeURIComponent(
    token
  )}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Media fetch failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.data || [];
}

const newToken = await refreshToken(TOKEN);
const posts = await fetchMedia(newToken);

fs.mkdirSync("data", { recursive: true });
fs.writeFileSync(
  "data/instagram.json",
  JSON.stringify({ updatedAt: new Date().toISOString(), posts }, null, 2)
);

console.log(`Wrote ${posts.length} posts to data/instagram.json`);

// Mask the token in logs and pass it to later workflow steps so the
// GitHub secret can be updated if it changed.
if (process.env.GITHUB_OUTPUT) {
  console.log(`::add-mask::${newToken}`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `token=${newToken}\n`);
}
