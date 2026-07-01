# Getting your live Instagram feed working (one-time setup)

I've already built the automation — a robot (GitHub Action) that checks Instagram every 12 hours and updates your site with your latest posts, for free, forever, with no third-party widget or branding. It lives in `.github/workflows/sync-instagram.yml` and `scripts/fetch-instagram.mjs`.

The only thing I can't do for you is log into your own Instagram and Meta accounts — that has to be you. It's about 15 minutes the first time, and you'll never have to think about it again after that. Go slowly, one step at a time, and it's fine to ask me if any screen doesn't match what's described.

## Step 1: Make your Instagram a "Professional" account (free, 1 minute)
1. Open the Instagram app on your phone, go to your profile.
2. Tap the menu (☰) → **Settings and privacy** → **Account type and tools**.
3. If it doesn't already say "Professional account," tap **Switch to professional account** and choose **Creator**.
3b. You do NOT need a Facebook Page for this — you can skip that if asked.

## Step 2: Create a free Meta Developer app
1. Go to **developers.facebook.com**. The homepage won't show "My Apps" or "Create App" yet — that's normal.
2. Click **Get Started** (top right corner). Log in with the Facebook/Meta account linked to your Instagram (or create one — it's free), and accept the developer terms if asked.
3. Once logged in, **My Apps** appears in the top nav. Click it, then click **Create App**.
4. On the **App details** step, give it any name, like "Trey Toler Site," and your contact email. Click **Next**.
5. On the **Use cases** step, select **Other**. Click **Next**.
6. On the **App type** step, select **Business** (required in order to add the Instagram product, even though this is just for your own personal feed). Click **Next**.
7. You'll land on your new app's dashboard. Scroll until you see the **Instagram** card and click **Set up**. This automatically adds "API setup with Instagram Login," which is what we need.

## Step 3: Connect your Instagram account and get a token
1. On the Instagram product page (left sidebar: **Instagram → API setup with Instagram login**), find the section for adding an account/tester.
2. **Your Instagram account needs to be set to public** for this step to work. If it's currently private, switch it to public in Instagram's privacy settings first (Settings → Privacy).
3. Add your own Instagram account, then confirm/accept from inside the Instagram app itself if prompted (Settings → Apps and Websites → Tester Invites, or a similar notification).
4. Generate an **access token** from that same page. Meta will show you a long string of letters and numbers — copy the whole thing. This is your `INSTAGRAM_ACCESS_TOKEN`.

If any of this looks different from what's described (Meta changes these screens periodically), tell me exactly what you see and I'll help you find the right button.

## Step 4: Add two secrets to your GitHub repo
Secrets are just private passwords GitHub stores for you — nobody can see them, including in the code itself.

1. In your `treytoler.github.io` repo on GitHub, go to **Settings → Secrets and variables → Actions**.
2. Click **New repository secret**.
   - Name: `INSTAGRAM_ACCESS_TOKEN`
   - Value: paste the token from Step 3.
   - Save.
3. Click **New repository secret** again for the second one:
   - Name: `ADMIN_PAT`
   - Value: a GitHub "Personal Access Token" — this lets the robot update your `INSTAGRAM_ACCESS_TOKEN` automatically every couple months when it expires, so you never have to redo Step 3.
     - To create one: click your profile photo (top right on GitHub) → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)** → **Generate new token (classic)**.
     - Check the box for **repo** (full control of private repositories).
     - Set an expiration (1 year is fine — you'll just repeat this step once a year).
     - Click **Generate token**, copy it, and paste it as the `ADMIN_PAT` secret value.

## Step 5: Run it once
1. In your repo, click the **Actions** tab.
2. Click **Sync Instagram Feed** in the left sidebar.
3. Click **Run workflow** → **Run workflow** (green button).
4. Wait about 30 seconds, refresh the page — you should see a green checkmark.
5. Visit your live site and refresh — your Instagram section should now show a real photo grid instead of the "Follow" button.

After this, it just runs automatically every 12 hours. Nothing else to do.

## If something goes wrong
Click into the failed run in the **Actions** tab and copy me the red error text — I can tell you exactly what to fix.
