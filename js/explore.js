/* Explore Destinations: recommendations + search/filter grid + Surprise Me */

let activePersonalityFilter = null;

function renderRecommendations() {
  const root = document.getElementById('recs-root');
  const result = WW.getQuizResult();

  if (!result) {
    root.innerHTML = `
      <div class="card" style="padding:24px 26px; margin-bottom:32px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap;">
        <div>
          <h3 style="font-size:1.02rem; margin-bottom:4px;">Take the quiz to unlock personalized matches</h3>
          <p class="muted small">We'll sort these 90 destinations into Perfect Matches, Hidden Gems, and more — based on your Travel DNA.</p>
        </div>
        <a href="quiz.html" class="btn btn-primary btn-sm">Take the Quiz</a>
      </div>
    `;
    return;
  }

  const primary = result.primary, secondary = result.secondary, hidden = result.hidden;
  const leastKey = [...result.ranked].sort((a, b) => a.score - b.score)[0].key;

  const perfect = DESTINATIONS.filter(d => d.personalities.includes(primary));
  const great = DESTINATIONS.filter(d => !d.personalities.includes(primary) && d.personalities.includes(secondary));
  const gems = DESTINATIONS.filter(d => !d.personalities.includes(primary) && !d.personalities.includes(secondary) && d.personalities.includes(hidden));
  const outside = DESTINATIONS.filter(d => d.personalities.includes(leastKey) && !d.personalities.includes(primary));

  const rows = [
    { title: `✨ Perfect Matches`, sub: `Built for ${PERSONALITY_MAP[primary].name}s`, list: perfect },
    { title: `👍 Great Matches`, sub: `A strong fit for your ${PERSONALITY_MAP[secondary].name.toLowerCase()} side`, list: great },
    { title: `💎 Hidden Gems`, sub: `Speaks to your hidden ${PERSONALITY_MAP[hidden].name.toLowerCase()} trait`, list: gems },
    { title: `🚀 Outside Your Comfort Zone`, sub: `A stretch — try a ${PERSONALITY_MAP[leastKey].name.toLowerCase()} trip for once`, list: outside },
  ].filter(r => r.list.length);

  root.innerHTML = rows.map(r => `
    <div class="rec-row">
      <div class="rec-row-head">
        <div><h3>${r.title}</h3><p>${r.sub}</p></div>
      </div>
      <div class="hscroll" data-row="${r.title}"></div>
    </div>
  `).join('');

  rows.forEach(r => {
    const el = root.querySelector(`.hscroll[data-row="${r.title.replace(/"/g, '\\"')}"]`);
    el.innerHTML = r.list.slice(0, 10).map(d => destCardHTML(d)).join('');
  });

  root.querySelectorAll('.save-pin').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dest = DESTINATIONS.find(d => d.slug === btn.dataset.save);
      const nowSaved = WW.toggleSaved(dest);
      btn.classList.toggle('saved', nowSaved);
      btn.textContent = nowSaved ? '♥' : '♡';
      showToast(nowSaved ? `Saved ${dest.name}` : `Removed ${dest.name}`);
    });
  });
  root.querySelectorAll('.dest-card').forEach(card => {
    card.addEventListener('click', () => openDestModal(card.dataset.slug));
  });
}

function populateFilterOptions() {
  const countrySel = document.getElementById('country-filter');
  const countries = [...new Set(DESTINATIONS.map(d => d.country))].sort();
  countries.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    countrySel.appendChild(opt);
  });

  const pillsEl = document.getElementById('personality-pills');
  const allPill = `<button class="pill active" data-key="">All</button>`;
  const pills = PERSONALITIES.map(p => `<button class="pill" data-key="${p.key}">${p.emoji} ${p.name.replace('The ', '')}</button>`).join('');
  pillsEl.innerHTML = allPill + pills;
  pillsEl.querySelectorAll('.pill').forEach(btn => {
    btn.addEventListener('click', () => {
      pillsEl.querySelectorAll('.pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activePersonalityFilter = btn.dataset.key || null;
      applyFilters();
    });
  });
}

function applyFilters() {
  const q = document.getElementById('search-input').value.trim().toLowerCase();
  const country = document.getElementById('country-filter').value;
  const budgetRange = document.getElementById('budget-filter').value;
  const sort = document.getElementById('sort-filter').value;

  let list = DESTINATIONS.filter(d => {
    if (q && !(d.name.toLowerCase().includes(q) || d.country.toLowerCase().includes(q))) return false;
    if (country && d.country !== country) return false;
    if (activePersonalityFilter && !d.personalities.includes(activePersonalityFilter)) return false;
    if (budgetRange) {
      const [min, max] = budgetRange.split('-').map(Number);
      if (d.budgetMin < min || d.budgetMin > max) return false;
    }
    return true;
  });

  if (sort === 'budget-asc') list.sort((a, b) => a.budgetMin - b.budgetMin);
  else if (sort === 'budget-desc') list.sort((a, b) => b.budgetMin - a.budgetMin);
  else list.sort((a, b) => a.name.localeCompare(b.name));

  mountDestGrid(document.getElementById('all-dest-grid'), list);
}

function surpriseMe(mode) {
  const result = WW.getQuizResult();
  let pool = DESTINATIONS;

  if (mode === 'personality' && result) {
    pool = DESTINATIONS.filter(d => d.personalities.includes(result.primary));
  } else if (mode === 'challenge' && result) {
    const leastKey = [...result.ranked].sort((a, b) => a.score - b.score)[0].key;
    pool = DESTINATIONS.filter(d => d.personalities.includes(leastKey));
  }
  if (!pool.length) pool = DESTINATIONS;

  const pick = pool[Math.floor(Math.random() * pool.length)];
  showToast(`🎲 How about ${pick.name}, ${pick.country}?`);
  openDestModal(pick.slug);
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('explore.html');
  renderRecommendations();
  populateFilterOptions();
  applyFilters();

  document.getElementById('search-input').addEventListener('input', applyFilters);
  document.getElementById('country-filter').addEventListener('change', applyFilters);
  document.getElementById('budget-filter').addEventListener('change', applyFilters);
  document.getElementById('sort-filter').addEventListener('change', applyFilters);

  document.getElementById('surprise-random').addEventListener('click', () => surpriseMe('random'));
  document.getElementById('surprise-personality').addEventListener('click', () => surpriseMe('personality'));
  document.getElementById('surprise-challenge').addEventListener('click', () => surpriseMe('challenge'));

  if (WW.qs('matched') === '1') {
    document.getElementById('recs-root').scrollIntoView({ behavior: 'smooth' });
  }
});
