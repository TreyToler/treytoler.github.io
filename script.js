document.getElementById('year').textContent = new Date().getFullYear();

const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Live Instagram feed — reads data/instagram.json, which the
// "Sync Instagram Feed" GitHub Action keeps refreshed. Falls back to the
// "Follow on Instagram" card (already in the HTML) if there's no data yet.
(async function loadInstagramFeed() {
  const container = document.getElementById('instagramFeed');
  if (!container) return;

  try {
    const res = await fetch('data/instagram.json', { cache: 'no-store' });
    if (!res.ok) return;
    const { posts } = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) return;

    const grid = document.createElement('div');
    grid.className = 'insta-grid';

    posts.slice(0, 9).forEach(post => {
      const img = post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url;
      if (!img) return;

      const a = document.createElement('a');
      a.className = 'insta-post';
      a.href = post.permalink || 'https://www.instagram.com/Toler_the_Trey';
      a.target = '_blank';
      a.rel = 'noopener';

      const image = document.createElement('img');
      image.src = img;
      image.alt = post.caption ? post.caption.slice(0, 120) : 'Instagram post';
      image.loading = 'lazy';

      a.appendChild(image);
      grid.appendChild(a);
    });

    if (grid.children.length > 0) {
      container.innerHTML = '';
      container.appendChild(grid);
    }
  } catch (err) {
    // Silently keep the fallback follow-button card.
    console.warn('Instagram feed not loaded yet:', err.message);
  }
})();

// Recent Substack posts — reads data/substack.json, which the
// "Sync Substack Feed" GitHub Action keeps refreshed from the public RSS
// feed. If there's no data yet, the list just stays empty.
(async function loadSubstackFeed() {
  const list = document.getElementById('substackFeed');
  if (!list) return;

  try {
    const res = await fetch('data/substack.json', { cache: 'no-store' });
    if (!res.ok) return;
    const { posts } = await res.json();
    if (!Array.isArray(posts) || posts.length === 0) return;

    const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    posts.forEach(post => {
      if (!post.title || !post.link) return;

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = post.link;
      a.target = '_blank';
      a.rel = 'noopener';

      const title = document.createElement('span');
      title.className = 'substack-title';
      title.textContent = post.title;

      const date = document.createElement('span');
      date.className = 'substack-date';
      const parsed = post.pubDate ? new Date(post.pubDate) : null;
      date.textContent = parsed && !isNaN(parsed) ? formatter.format(parsed) : '';

      a.appendChild(title);
      a.appendChild(date);
      li.appendChild(a);
      list.appendChild(li);
    });
  } catch (err) {
    console.warn('Substack feed not loaded yet:', err.message);
  }
})();
