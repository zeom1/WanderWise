/* Shared UI: navbar, footer, destination cards, modal, toast */

const WW_NAV_LINKS = [
  { href: 'index.html', label: 'Home' },
  { href: 'quiz.html', label: 'Quiz' },
  { href: 'explore.html', label: 'Explore' },
  { href: 'personalities.html', label: 'Personalities' },
  { href: 'bucket-list.html', label: 'Bucket List' },
  { href: 'planner.html', label: 'Planner' },
];

function renderNavbar(activePage) {
  const root = document.getElementById('navbar-root');
  if (!root) return;
  const links = WW_NAV_LINKS.map(l =>
    `<a class="nav-link${l.href === activePage ? ' active' : ''}" href="${l.href}">${l.label}</a>`
  ).join('');

  root.innerHTML = `
    <nav class="navbar">
      <div class="container navbar-inner">
        <a href="index.html" class="brand">
          <span class="brand-mark">🧭</span> WanderWise
        </a>
        <div class="nav-links" id="nav-links">${links}</div>
        <div class="nav-right">
          <button class="icon-btn" data-theme-toggle title="Toggle theme">🌙</button>
          <button class="nav-toggle" id="nav-toggle" title="Menu">☰</button>
        </div>
      </div>
    </nav>
  `;

  const toggleBtn = document.getElementById('nav-toggle');
  const navLinksEl = document.getElementById('nav-links');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => navLinksEl.classList.toggle('open'));
  }

  if (window.WW_THEME) {
    const themeBtn = root.querySelector('[data-theme-toggle]');
    themeBtn.addEventListener('click', WW_THEME.toggle);
    themeBtn.textContent = WW_THEME.current() === 'dark' ? '☀️' : '🌙';
  }
}

function renderFooter() {
  const root = document.getElementById('footer-root');
  if (!root) return;
  root.innerHTML = `
    <footer>
      <div class="container">
        Discover Yourself To Discover The World — WanderWise, a travel personality &amp; planning companion.
      </div>
    </footer>
  `;
}

/* ---------- Destination card ---------- */
function destCoverStyle(dest) {
  return `background: url('${dest.image}') no-repeat center center; background-size: cover;`;
}

function destCardHTML(dest, opts = {}) {
  const saved = WW.isSaved(dest.slug);
  const matchLabel = opts.matchLabel ? `<span class="dest-match-badge">${opts.matchLabel}</span>` : '';
  const tags = dest.personalities.slice(0, 2).map(p =>
    `<span class="tag tag-accent">${PERSONALITY_EMOJI[p] || ''} ${p}</span>`
  ).join('');
  return `
    <div class="dest-card" data-slug="${dest.slug}">
      <div class="dest-cover" style="${destCoverStyle(dest)}">
        ${matchLabel}
        <button class="save-pin${saved ? ' saved' : ''}" data-save="${dest.slug}" title="Save to bucket list">${saved ? '♥' : '♡'}</button>
      </div>
      <div class="dest-body">
        <h4>${dest.name}</h4>
        <div class="country">${dest.country}</div>
        <div class="dest-tags">${tags}</div>
        <div class="dest-meta">
          <span>💰 ${dest.budgetLabel}</span>
          <span>📅 ${dest.season}</span>
        </div>
      </div>
    </div>
  `;
}

function mountDestGrid(container, destinations, opts = {}) {
  if (!destinations.length) {
    container.innerHTML = `<div class="empty-state"><div class="emoji">🗺️</div><h3>No destinations found</h3><p>Try adjusting your search or filters.</p></div>`;
    return;
  }
  container.innerHTML = destinations.map(d => destCardHTML(d, opts.matchLabels ? { matchLabel: opts.matchLabels[d.slug] } : {})).join('');
  container.querySelectorAll('.save-pin').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dest = DESTINATIONS.find(d => d.slug === btn.dataset.save);
      const nowSaved = WW.toggleSaved(dest);
      btn.classList.toggle('saved', nowSaved);
      btn.textContent = nowSaved ? '♥' : '♡';
      showToast(nowSaved ? `Saved ${dest.name} to bucket list` : `Removed ${dest.name}`);
    });
  });
  container.querySelectorAll('.dest-card').forEach(card => {
    card.addEventListener('click', () => openDestModal(card.dataset.slug));
  });
}

/* ---------- Destination modal ---------- */
function ensureModalRoot() {
  let el = document.getElementById('dest-modal-root');
  if (!el) {
    el = document.createElement('div');
    el.id = 'dest-modal-root';
    document.body.appendChild(el);
  }
  return el;
}

function openDestModal(slug) {
  const dest = DESTINATIONS.find(d => d.slug === slug);
  if (!dest) return;
  const root = ensureModalRoot();
  const saved = WW.isSaved(dest.slug);
  const tags = dest.personalities.map(p => `<span class="tag tag-accent">${PERSONALITY_EMOJI[p] || ''} ${p}</span>`).join('');

  root.innerHTML = `
    <div class="modal-overlay open" id="dest-modal-overlay">
      <div class="modal">
        <div class="modal-cover" style="${destCoverStyle(dest)}">
          <button class="modal-close" id="dest-modal-close">✕</button>
        </div>
        <div class="modal-body">
          <h2>${dest.name}</h2>
          <div class="country">${dest.country}</div>
          <div class="dest-tags">${tags}</div>
          <div class="detail-grid">
            <div class="detail-item"><div class="k">Best Season</div><div class="v"><span class="icon">📅</span>${dest.season}</div></div>
            <div class="detail-item"><div class="k">Budget (per trip)</div><div class="v"><span class="icon">💰</span>${dest.budgetLabel}</div></div>
            <div class="detail-item"><div class="k">Stay</div><div class="v"><span class="icon">🏨</span>${dest.stay}</div></div>
            <div class="detail-item"><div class="k">Transport</div><div class="v"><span class="icon">🚗</span>${dest.transport}</div></div>
            <div class="detail-item"><div class="k">Signature Cuisine</div><div class="v"><span class="icon">🍽️</span>${dest.cuisine}</div></div>
            <div class="detail-item"><div class="k">Festival</div><div class="v"><span class="icon">🎊</span>${dest.festival}</div></div>
          </div>
          <div class="detail-item"><div class="k">Top Attractions</div><div class="v"><span class="icon">📍</span>${dest.attractions.join(', ')}</div></div>
          <p class="dna-interp" style="margin-top:16px;">💡 <strong>Tip:</strong> ${dest.tip}</p>
          <div class="modal-actions">
            <button class="btn btn-primary" id="dest-modal-save">${saved ? '♥ Saved to Bucket List' : '♡ Save to Bucket List'}</button>
            <button class="btn btn-secondary" id="dest-modal-plan">📊 Plan This Trip</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const overlay = document.getElementById('dest-modal-overlay');
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDestModal(); });
  document.getElementById('dest-modal-close').addEventListener('click', closeDestModal);
  document.getElementById('dest-modal-save').addEventListener('click', (e) => {
    const nowSaved = WW.toggleSaved(dest);
    e.target.textContent = nowSaved ? '♥ Saved to Bucket List' : '♡ Save to Bucket List';
    showToast(nowSaved ? `Saved ${dest.name}` : `Removed ${dest.name}`);
    document.querySelectorAll(`.save-pin[data-save="${dest.slug}"]`).forEach(btn => {
      btn.classList.toggle('saved', nowSaved);
      btn.textContent = nowSaved ? '♥' : '♡';
    });
  });
  document.getElementById('dest-modal-plan').addEventListener('click', () => {
    WW.setPlanner({ destSlug: dest.slug });
    window.location.href = 'planner.html';
  });
}

function closeDestModal() {
  const overlay = document.getElementById('dest-modal-overlay');
  if (overlay) overlay.classList.remove('open');
}

/* ---------- Toast ---------- */
function showToast(msg, duration = 2200) {
  let el = document.getElementById('ww-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'ww-toast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), duration);
}

document.addEventListener('DOMContentLoaded', () => {
  renderFooter();
});
