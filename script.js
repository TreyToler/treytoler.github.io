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
