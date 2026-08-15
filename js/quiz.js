/* Quiz flow: intro -> question loop -> analysis -> quick guess -> Travel DNA reveal */

const ANALYSIS_MESSAGES = [
  'Mapping your travel instincts…',
  'Weighing adventure against comfort…',
  'Cross-referencing 90 destinations…',
  'Untangling your hidden traveler…',
  'Calculating your Travel DNA…',
];

let quizQuestions = [];
let quizIndex = 0;
let quizAnswers = []; // { qId, optionKey, points }
let quizResult = null;

const views = ['view-intro', 'view-question', 'view-analysis', 'view-guess', 'view-result'];
function showView(id) {
  views.forEach(v => { document.getElementById(v).style.display = (v === id) ? '' : 'none'; });
}

function startQuiz() {
  quizQuestions = pickRandomQuestions(20);
  quizIndex = 0;
  quizAnswers = new Array(quizQuestions.length).fill(null);
  showView('view-question');
  renderQuestion();
}

function renderQuestion() {
  const q = quizQuestions[quizIndex];
  const total = quizQuestions.length;
  document.getElementById('q-counter').textContent = `Question ${quizIndex + 1} of ${total}`;
  const pct = Math.round(((quizIndex + 1) / total) * 100);
  document.getElementById('q-percent').textContent = pct + '%';
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('q-text').textContent = q.text;

  const optionsEl = document.getElementById('q-options');
  const existing = quizAnswers[quizIndex];
  optionsEl.innerHTML = q.options.map(opt => `
    <div class="quiz-option${existing && existing.optionKey === opt.key ? ' selected' : ''}" data-key="${opt.key}">
      <span class="opt-letter">${opt.key}</span>
      <span>${opt.text}</span>
    </div>
  `).join('');

  optionsEl.querySelectorAll('.quiz-option').forEach(el => {
    el.addEventListener('click', () => selectOption(el.dataset.key));
  });

  document.getElementById('back-btn').style.visibility = quizIndex === 0 ? 'hidden' : 'visible';
  document.getElementById('next-btn').disabled = !existing;
  document.getElementById('next-btn').textContent = (quizIndex === total - 1) ? 'See My Results →' : 'Next →';
}

function selectOption(key) {
  const q = quizQuestions[quizIndex];
  const opt = q.options.find(o => o.key === key);
  quizAnswers[quizIndex] = { qId: q.id, optionKey: key, points: opt.points };
  document.querySelectorAll('#q-options .quiz-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.key === key);
  });
  document.getElementById('next-btn').disabled = false;
}

function goNext() {
  if (!quizAnswers[quizIndex]) return; // no skipping
  if (quizIndex < quizQuestions.length - 1) {
    quizIndex++;
    renderQuestion();
  } else {
    finishQuiz();
  }
}

function goBack() {
  if (quizIndex === 0) return;
  quizIndex--;
  renderQuestion();
}

function computeResult() {
  const scores = {};
  const primaryPicks = {};
  PERSONALITIES.forEach(p => { scores[p.key] = 0; primaryPicks[p.key] = 0; });

  quizAnswers.forEach(a => {
    if (!a) return;
    let topKey = null, topVal = -1;
    Object.entries(a.points).forEach(([key, val]) => {
      scores[key] = (scores[key] || 0) + val;
      if (val > topVal) { topVal = val; topKey = key; }
    });
    if (topKey) primaryPicks[topKey] += 1;
  });

  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const ranked = PERSONALITIES.map(p => ({
    key: p.key,
    score: scores[p.key],
    pct: Math.round((scores[p.key] / total) * 1000) / 10,
    picks: primaryPicks[p.key],
  })).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.picks !== a.picks) return b.picks - a.picks;
    return 0;
  });

  const radar = {};
  RADAR_CATEGORIES.forEach(cat => {
    let val = 0;
    ranked.forEach(r => { val += (r.pct / 100) * (RADAR_WEIGHTS[r.key][cat] || 0); });
    radar[cat] = Math.min(100, Math.round(val));
  });

  return {
    ranked,
    primary: ranked[0],
    secondary: ranked[1],
    hidden: ranked[2],
    radar,
    takenAt: Date.now(),
  };
}

function finishQuiz() {
  showView('view-analysis');
  let i = 0;
  const msgEl = document.getElementById('analysis-msg');
  const interval = setInterval(() => {
    i = (i + 1) % ANALYSIS_MESSAGES.length;
    msgEl.style.opacity = 0;
    setTimeout(() => { msgEl.textContent = ANALYSIS_MESSAGES[i]; msgEl.style.opacity = 1; }, 180);
  }, 620);

  setTimeout(() => {
    clearInterval(interval);
    quizResult = computeResult();
    showQuickGuess();
  }, 2400);
}

function showQuickGuess() {
  const primary = PERSONALITY_MAP[quizResult.primary.key];
  const others = PERSONALITIES.filter(p => p.key !== primary.key);
  const decoy = others[Math.floor(Math.random() * others.length)];
  const pair = Math.random() < 0.5 ? [primary, decoy] : [decoy, primary];

  const el = document.getElementById('guess-options');
  el.innerHTML = pair.map(p => `
    <button class="btn btn-secondary" data-key="${p.key}" style="flex-direction:column; height:auto; padding:20px 26px; gap:6px;">
      <span style="font-size:28px;">${p.emoji}</span>
      <span>${p.name}</span>
    </button>
  `).join('');

  el.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const guessedRight = btn.dataset.key === primary.key;
      showResult(guessedRight);
    });
  });

  showView('view-guess');
}

function buildRadarSVG(values) {
  const size = 260, center = size / 2, maxR = 92;
  const cats = RADAR_CATEGORIES;
  const n = cats.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const pointAt = (i, r) => {
    const a = angle(i);
    return [center + r * Math.cos(a), center + r * Math.sin(a)];
  };

  let grid = '';
  [0.25, 0.5, 0.75, 1].forEach(f => {
    const pts = cats.map((_, i) => pointAt(i, maxR * f).join(',')).join(' ');
    grid += `<polygon points="${pts}" fill="none" stroke="var(--border)" stroke-width="1"/>`;
  });

  let axes = '';
  let labels = '';
  cats.forEach((cat, i) => {
    const [x, y] = pointAt(i, maxR);
    axes += `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="var(--border)" stroke-width="1"/>`;
    const [lx, ly] = pointAt(i, maxR + 20);
    labels += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-size="10.5" fill="var(--text-muted)">${cat}</text>`;
  });

  const dataPts = cats.map((cat, i) => pointAt(i, (values[cat] / 100) * maxR).join(',')).join(' ');
  const shape = `<polygon points="${dataPts}" fill="var(--accent)" fill-opacity="0.25" stroke="var(--accent)" stroke-width="2"/>`;

  return `<svg width="${size + 60}" height="${size + 60}" viewBox="-30 -30 ${size + 60} ${size + 60}">
    <g>${grid}${axes}${shape}${labels}</g>
  </svg>`;
}

function showResult(guessedRight) {
  const r = quizResult;
  const primary = PERSONALITY_MAP[r.primary.key];
  const secondary = PERSONALITY_MAP[r.secondary.key];
  const hidden = PERSONALITY_MAP[r.hidden.key];

  document.getElementById('dna-icon').textContent = primary.emoji;
  document.getElementById('dna-primary-name').textContent = primary.name;
  document.getElementById('dna-primary-desc').textContent = primary.description;

  const guessNote = document.getElementById('dna-guess-note');
  if (typeof guessedRight === 'boolean') {
    guessNote.style.display = 'inline-flex';
    guessNote.textContent = guessedRight ? '🎯 Good guess — you called it!' : '👀 Plot twist — not what you guessed';
  }

  const breakdownEl = document.getElementById('dna-breakdown');
  const rows = [
    { label: 'Primary', item: r.primary, p: primary },
    { label: 'Secondary', item: r.secondary, p: secondary },
    { label: 'Hidden Trait', item: r.hidden, p: hidden },
  ];
  breakdownEl.innerHTML = rows.map(row => `
    <div class="dna-bar-row">
      <div class="name">${row.p.emoji} ${row.p.name.replace('The ', '')}</div>
      <div class="track"><div class="fill" style="width:${Math.min(100, row.item.pct)}%; background:${row.p.color};"></div></div>
      <div class="pct">${row.item.pct}%</div>
    </div>
  `).join('');

  document.getElementById('radar-wrap').innerHTML = buildRadarSVG(r.radar);
  document.getElementById('dna-interp').innerHTML =
    `<strong>Your Travel DNA:</strong> ${generateDnaInterpretation(r.primary.key, r.secondary.key, r.hidden.key)}`;

  WW.setQuizResult({
    primary: r.primary.key, secondary: r.secondary.key, hidden: r.hidden.key,
    ranked: r.ranked, radar: r.radar, takenAt: r.takenAt,
  });

  showView('view-result');
}

function initZodiac() {
  const select = document.getElementById('zodiac-select');
  Object.keys(ZODIAC_TRAVEL).forEach(sign => {
    const opt = document.createElement('option');
    opt.value = sign; opt.textContent = sign;
    select.appendChild(opt);
  });
  document.getElementById('zodiac-toggle').addEventListener('click', () => {
    document.getElementById('zodiac-box').classList.toggle('hidden');
  });
  select.addEventListener('change', () => {
    document.getElementById('zodiac-result').textContent = ZODIAC_TRAVEL[select.value] || '';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('quiz.html');
  initZodiac();

  document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);
  document.getElementById('next-btn').addEventListener('click', goNext);
  document.getElementById('back-btn').addEventListener('click', goBack);
  document.getElementById('retake-btn').addEventListener('click', startQuiz);

  showView('view-intro');
});
