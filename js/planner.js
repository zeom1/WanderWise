/* Planning Dashboard: destination + countdown, budget & savings, packing checklist, notes, summary */

const BASE_PACKING_ITEMS = [
  { label: 'Passport / ID', cat: 'Essentials' },
  { label: 'Tickets & bookings (printed or offline)', cat: 'Essentials' },
  { label: 'Phone charger', cat: 'Essentials' },
  { label: 'Power bank', cat: 'Essentials' },
  { label: 'Basic first-aid & medication', cat: 'Essentials' },
  { label: 'Reusable water bottle', cat: 'Essentials' },
];

const PERSONALITY_PACKING_ITEMS = {
  Explorer: [{ label: 'Sturdy trekking shoes', cat: 'Gear' }, { label: 'Headlamp / flashlight', cat: 'Gear' }, { label: 'Daypack', cat: 'Gear' }],
  Culture: [{ label: 'Modest clothing for temples & religious sites', cat: 'Clothing' }, { label: 'Offline maps / guidebook', cat: 'Extras' }],
  Beach: [{ label: 'Swimwear', cat: 'Clothing' }, { label: 'Sunscreen (SPF 50+)', cat: 'Toiletries' }, { label: 'Flip-flops', cat: 'Clothing' }],
  Urban: [{ label: 'Comfortable walking shoes', cat: 'Clothing' }, { label: 'Transit card / offline city maps', cat: 'Extras' }],
  Nature: [{ label: 'Insect repellent', cat: 'Toiletries' }, { label: 'Binoculars', cat: 'Gear' }],
  Foodie: [{ label: 'Antacids / digestion aid', cat: 'Toiletries' }, { label: 'Reusable food container', cat: 'Extras' }],
  Luxury: [{ label: 'One formal / dinner outfit', cat: 'Clothing' }, { label: 'Dress shoes', cat: 'Clothing' }],
  Budget: [{ label: 'Universal power adapter', cat: 'Gear' }, { label: 'Foldable duffel bag', cat: 'Extras' }],
  Social: [{ label: 'Portable speaker / extra camera battery', cat: 'Extras' }],
  Slow: [{ label: 'A book or journal', cat: 'Extras' }],
};

const TRIP_TYPE_PACKING_ITEMS = {
  solo: [{ label: 'Personal safety alarm / whistle', cat: 'Solo' }],
  couple: [{ label: 'A shared power strip', cat: 'Couple' }],
  family: [{ label: "Kids' snacks & entertainment", cat: 'Family' }, { label: 'Extra warm layers for children', cat: 'Family' }],
  friends: [{ label: 'Portable speaker', cat: 'Friends' }, { label: 'Group games or cards', cat: 'Friends' }],
};

const COLD_DESTINATIONS = ['Ladakh', 'Spiti', 'Manali', 'Auli', 'Gangtok', 'Iceland', 'Norway', 'Swiss Alps', 'Patagonia', 'Banff', 'Yosemite', 'Yellowstone', 'Alaska', 'Hallstatt', 'Interlaken', 'Queenstown', 'Milford Sound', 'Nainital', 'Darjeeling'];
const COLD_PACKING_ITEMS = [{ label: 'Thermal inner wear', cat: 'Weather' }, { label: 'Warm jacket & gloves', cat: 'Weather' }];

function generatePackingItems(dest, tripType) {
  let items = [...BASE_PACKING_ITEMS];
  if (dest) {
    dest.personalities.forEach(p => { items = items.concat(PERSONALITY_PACKING_ITEMS[p] || []); });
    if (COLD_DESTINATIONS.includes(dest.name)) items = items.concat(COLD_PACKING_ITEMS);
  }
  items = items.concat(TRIP_TYPE_PACKING_ITEMS[tripType] || []);

  const seen = new Set();
  const deduped = [];
  items.forEach(it => { if (!seen.has(it.label)) { seen.add(it.label); deduped.push(it); } });
  return deduped.map(it => ({ id: WW.slugify(it.label), label: it.label, cat: it.cat, checked: false }));
}

let plannerState = null;
let countdownInterval = null;

function getActiveDest() {
  if (!plannerState.destSlug) return null;
  return DESTINATIONS.find(d => d.slug === plannerState.destSlug) || null;
}

function populateDestSelect() {
  const select = document.getElementById('dest-select');
  const bucket = WW.getBucketList();
  const pool = bucket.length
    ? bucket.map(s => DESTINATIONS.find(d => d.slug === s.slug)).filter(Boolean)
    : [...DESTINATIONS].sort((a, b) => a.name.localeCompare(b.name));

  select.innerHTML = '<option value="">— Select a destination —</option>' +
    pool.map(d => `<option value="${d.slug}">${d.name}, ${d.country}</option>`).join('');

  if (plannerState.destSlug && pool.some(d => d.slug === plannerState.destSlug)) {
    select.value = plannerState.destSlug;
  }
}

function renderCountdown() {
  const grid = document.getElementById('countdown-grid');
  const label = document.getElementById('countdown-label');
  if (!plannerState.tripDate) {
    grid.innerHTML = '';
    label.textContent = 'Set a trip date to start the countdown.';
    return;
  }
  const target = new Date(plannerState.tripDate + 'T00:00:00').getTime();
  const now = Date.now();
  const diff = target - now;

  if (diff <= 0) {
    grid.innerHTML = '';
    label.textContent = "🎉 It's trip time — safe travels!";
    return;
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  grid.innerHTML = [
    { n: days, l: 'Days' }, { n: hours, l: 'Hrs' }, { n: mins, l: 'Min' }, { n: secs, l: 'Sec' },
  ].map(c => `<div class="countdown-cell"><div class="n">${c.n}</div><div class="l">${c.l}</div></div>`).join('');
  label.textContent = '';
}

function renderBudget() {
  const total = plannerState.budgetTotal || 0;
  const goal = plannerState.savingsGoal || total || 0;
  const saved = plannerState.savingsSaved || 0;
  const pct = goal ? Math.min(100, Math.round((saved / goal) * 100)) : 0;

  document.getElementById('savings-saved-label').textContent = WW.formatINR(saved);
  document.getElementById('savings-fill').style.width = pct + '%';
  document.getElementById('savings-pct-label').textContent = goal
    ? `${pct}% of your ₹${goal.toLocaleString('en-IN')} goal saved`
    : 'Set a savings goal to track progress.';
}

function renderPacking(regenerate) {
  const dest = getActiveDest();
  const sub = document.getElementById('packing-sub');
  sub.textContent = dest
    ? `Tailored for ${dest.name} (${dest.personalities.join(', ')}) — ${plannerState.tripType || 'solo'} trip.`
    : 'Select a destination to generate a tailored checklist.';

  let stored = WW.getPacking();
  const freshItems = generatePackingItems(dest, plannerState.tripType || 'solo');

  if (regenerate || !stored || stored.destSlug !== plannerState.destSlug) {
    stored = { destSlug: plannerState.destSlug, items: freshItems };
  } else {
    // Preserve checked state for items that still exist; add any new ones
    const prevChecked = Object.fromEntries(stored.items.map(i => [i.id, i.checked]));
    stored = { destSlug: plannerState.destSlug, items: freshItems.map(i => ({ ...i, checked: !!prevChecked[i.id] })) };
  }
  WW.setPacking(stored);

  const listEl = document.getElementById('packing-checklist');
  listEl.innerHTML = stored.items.map(it => `
    <label class="check-item${it.checked ? ' checked' : ''}" data-id="${it.id}">
      <input type="checkbox" ${it.checked ? 'checked' : ''}>
      <span class="txt">${it.label}</span>
      <span class="cat">${it.cat}</span>
    </label>
  `).join('');

  listEl.querySelectorAll('.check-item').forEach(row => {
    row.querySelector('input').addEventListener('change', (e) => {
      const id = row.dataset.id;
      const data = WW.getPacking();
      const item = data.items.find(i => i.id === id);
      item.checked = e.target.checked;
      WW.setPacking(data);
      row.classList.toggle('checked', item.checked);
      renderPackingProgress();
      renderSummary();
    });
  });

  renderPackingProgress();
}

function renderPackingProgress() {
  const data = WW.getPacking();
  const total = data.items.length;
  const done = data.items.filter(i => i.checked).length;
  document.getElementById('packing-progress-label').textContent = total ? `${done} / ${total} packed` : '';
}

function renderSummary() {
  const dest = getActiveDest();
  const quiz = WW.getQuizResult();
  const packing = WW.getPacking();
  const packedPct = packing.items.length ? Math.round((packing.items.filter(i => i.checked).length / packing.items.length) * 100) : 0;
  const savingsPct = plannerState.savingsGoal ? Math.min(100, Math.round(((plannerState.savingsSaved || 0) / plannerState.savingsGoal) * 100)) : 0;

  let daysLeft = '—';
  if (plannerState.tripDate) {
    const diff = new Date(plannerState.tripDate + 'T00:00:00').getTime() - Date.now();
    daysLeft = diff > 0 ? Math.floor(diff / 86400000) : '🎉';
  }

  const items = [
    { k: 'Destination', v: dest ? `${dest.emoji} ${dest.name}` : 'Not selected' },
    { k: 'Travel Personality', v: quiz ? PERSONALITY_MAP[quiz.primary].name : 'Take the quiz' },
    { k: 'Days Until Trip', v: daysLeft },
    { k: 'Savings Progress', v: savingsPct + '%' },
    { k: 'Packing Progress', v: packedPct + '%' },
  ];

  document.getElementById('summary-grid').innerHTML = items.map(i => `
    <div class="summary-item"><div class="k">${i.k}</div><div class="v">${i.v}</div></div>
  `).join('');
}

function saveField(fields) {
  plannerState = Object.assign(plannerState, fields);
  WW.setPlanner(fields);
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('planner.html');
  plannerState = WW.getPlanner();

  populateDestSelect();
  document.getElementById('trip-date').value = plannerState.tripDate || '';
  document.getElementById('trip-type').value = plannerState.tripType || 'solo';
  document.getElementById('budget-total').value = plannerState.budgetTotal || '';
  document.getElementById('savings-goal').value = plannerState.savingsGoal || '';

  // Prefill budget from destination if empty
  if (!plannerState.budgetTotal) {
    const dest = getActiveDest();
    if (dest) {
      const mid = Math.round((dest.budgetMin + (dest.budgetMax || dest.budgetMin * 1.5)) / 2);
      document.getElementById('budget-total').value = mid;
      saveField({ budgetTotal: mid });
    }
  }

  renderCountdown();
  renderBudget();
  renderPacking(false);
  renderSummary();

  countdownInterval = setInterval(renderCountdown, 1000);

  document.getElementById('dest-select').addEventListener('change', (e) => {
    saveField({ destSlug: e.target.value || null });
    const dest = getActiveDest();
    if (dest && !document.getElementById('budget-total').value) {
      const mid = Math.round((dest.budgetMin + (dest.budgetMax || dest.budgetMin * 1.5)) / 2);
      document.getElementById('budget-total').value = mid;
      saveField({ budgetTotal: mid });
      renderBudget();
    }
    renderPacking(false);
    renderSummary();
  });

  document.getElementById('trip-date').addEventListener('change', (e) => {
    saveField({ tripDate: e.target.value || null });
    renderCountdown();
    renderSummary();
  });

  document.getElementById('trip-type').addEventListener('change', (e) => {
    saveField({ tripType: e.target.value });
    renderPacking(false);
    renderSummary();
  });

  document.getElementById('budget-total').addEventListener('input', (e) => {
    saveField({ budgetTotal: Number(e.target.value) || null });
  });

  document.getElementById('savings-goal').addEventListener('input', (e) => {
    saveField({ savingsGoal: Number(e.target.value) || null });
    renderBudget();
    renderSummary();
  });

  document.getElementById('add-funds-btn').addEventListener('click', () => {
    const input = document.getElementById('add-funds-input');
    const amt = Number(input.value);
    if (!amt || amt <= 0) return;
    const newSaved = (plannerState.savingsSaved || 0) + amt;
    saveField({ savingsSaved: newSaved });
    input.value = '';
    renderBudget();
    renderSummary();
    showToast(`Added ${WW.formatINR(amt)} to savings`);
  });

  let notesTimer;
  document.getElementById('trip-notes').value = plannerState.notes || '';
  document.getElementById('trip-notes').addEventListener('input', (e) => {
    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => saveField({ notes: e.target.value }), 400);
  });

  document.getElementById('regen-packing-btn').addEventListener('click', () => {
    renderPacking(true);
    renderSummary();
    showToast('Packing checklist reset');
  });
});
