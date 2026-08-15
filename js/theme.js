/* Theme: light/dark mode, persisted in localStorage */
(function () {
  const KEY = 'ww_theme';

  function getStored() {
    return localStorage.getItem(KEY);
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function current() {
    return document.documentElement.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }

  // Apply stored theme immediately (before paint) to avoid flash
  const stored = getStored();
  if (stored) apply(stored);

  function toggle() {
    const next = current() === 'dark' ? 'light' : 'dark';
    apply(next);
    localStorage.setItem(KEY, next);
    updateIcon();
  }

  function updateIcon() {
    const btn = document.querySelector('[data-theme-toggle]');
    if (!btn) return;
    btn.textContent = current() === 'dark' ? '☀️' : '🌙';
  }

  window.WW_THEME = { toggle, current, updateIcon };
})();
