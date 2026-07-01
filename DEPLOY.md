# Getting your site live on GitHub Pages

## Files in this folder
- `index.html`, `styles.css`, `script.js` — the site
- `assets/cover.png` — Good Damage book cover (pulled from your tip sheet)
- `assets/author.jpg` — your author photo (pulled from your tip sheet)
- `data/instagram.json` — feed data, kept updated automatically (see below)
- `.github/workflows/sync-instagram.yml` + `scripts/fetch-instagram.mjs` — the robot that refreshes your Instagram feed every 12 hours

## 1. Create the repo
1. Go to github.com and sign in (create a free account if needed).
2. Click **New repository**.
3. Name it `treytoler.github.io` (using your exact GitHub username before `.github.io` gives you the cleanest URL — e.g. if your username is `treytoler`, the repo must be named exactly `treytoler.github.io`).
4. Leave it public, don't initialize with a README.

## 2. Upload the files
Easiest path (no command line):
1. Open the new repo page, click **Add file > Upload files**.
2. Drag in everything from this folder — `index.html`, `styles.css`, `script.js`, `DEPLOY.md`, `INSTAGRAM_SETUP.md`, and the `assets`, `data`, `.github`, and `scripts` folders (drag the whole folder in Finder/Explorer and GitHub will keep the structure).
3. Commit directly to the `main` branch.

Note: some file browsers hide folders starting with a dot (`.github`). If it doesn't show up when you drag the folder, use **Add file > Upload files** and drag `.github` specifically, or unhide hidden files/folders in your file manager first.

## 3. Turn on Pages
1. In the repo, go to **Settings > Pages**.
2. Under "Build and deployment," set Source to **Deploy from a branch**.
3. Branch: `main`, folder: `/ (root)`. Save.
4. Wait 1–2 minutes — your site will be live at `https://<your-username>.github.io`.

## 4. Custom domain (optional)
If you own a domain (e.g. treytoler.com):
1. In **Settings > Pages**, enter it under "Custom domain."
2. At your domain registrar, add a CNAME record pointing to `<your-username>.github.io`.
3. GitHub will auto-generate an HTTPS certificate after DNS propagates (can take a few hours).

## Updating content later
Edit `index.html` directly in GitHub (pencil icon on the file) or re-upload after editing locally — every commit to `main` republishes the live site automatically.

## Live Instagram feed
This site pulls your real posts with no third-party widget — a free GitHub Action checks Instagram every 12 hours and updates `data/instagram.json`, which the page reads automatically. It's already built and wired up; the only remaining step is connecting your own Instagram/Meta account, which I can't do on your behalf. Full walkthrough: **INSTAGRAM_SETUP.md**.

Until that one-time setup is done, the site shows a styled "Follow on Instagram" button, so nothing is broken in the meantime.

## Newsletter
The Newsletter section links to:
- Substack: **treytoler1.substack.com** ("Bright Things Grow in the Dark")
- LinkedIn: **linkedin.com/in/treytoler1** — LinkedIn newsletters don't have a separate public URL I can verify without logging in, so this points to your profile. If you have the direct newsletter link (looks like `linkedin.com/newsletters/bright-things-grow-in-the-dark-.../`), swap it in for the LinkedIn button in the Newsletter section of `index.html`.
