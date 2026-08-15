/* Shared localStorage + formatting helpers */
const WW = (() => {
  const KEYS = {
    quizResult: 'ww_quiz_result',
    bucketList: 'ww_bucket_list',
    planner: 'ww_planner',
    packing: 'ww_packing',
  };

  function get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function remove(key) {
    localStorage.removeItem(key);
  }

  // ---- Quiz result ----
  function getQuizResult() { return get(KEYS.quizResult, null); }
  function setQuizResult(result) { set(KEYS.quizResult, result); }

  // ---- Bucket list ----
  function getBucketList() { return get(KEYS.bucketList, []); }
  function isSaved(slug) { return getBucketList().some(d => d.slug === slug); }
  function toggleSaved(dest) {
    const list = getBucketList();
    const idx = list.findIndex(d => d.slug === dest.slug);
    if (idx >= 0) {
      list.splice(idx, 1);
      set(KEYS.bucketList, list);
      return false;
    } else {
      list.push({ slug: dest.slug, name: dest.name, country: dest.country, savedAt: Date.now() });
      set(KEYS.bucketList, list);
      return true;
    }
  }
  function removeSaved(slug) {
    set(KEYS.bucketList, getBucketList().filter(d => d.slug !== slug));
  }

  // ---- Planner ----
  function getPlanner() {
    return get(KEYS.planner, {
      destSlug: null,
      tripDate: null,
      budgetTotal: null,
      savingsGoal: null,
      savingsSaved: 0,
      notes: '',
    });
  }
  function setPlanner(data) {
    set(KEYS.planner, Object.assign(getPlanner(), data));
  }

  // ---- Packing checklist (per active destination) ----
  function getPacking() { return get(KEYS.packing, { destSlug: null, items: [] }); }
  function setPacking(data) { set(KEYS.packing, data); }

  // ---- Formatting ----
  function formatINR(n) {
    if (n == null || isNaN(n)) return '—';
    if (n >= 100000) return '₹' + (n / 100000).toFixed(n % 100000 === 0 ? 0 : 1) + 'L';
    if (n >= 1000) return '₹' + Math.round(n / 1000) + 'k';
    return '₹' + n;
  }

  function slugify(str) {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  return {
    KEYS, get, set, remove,
    getQuizResult, setQuizResult,
    getBucketList, isSaved, toggleSaved, removeSaved,
    getPlanner, setPlanner,
    getPacking, setPacking,
    formatINR, slugify, qs,
  };
})();
