// Helpers de date
export function parseDate(val) {
  if (!val) return null;
  if (typeof val === 'number' || /^\d{8}$/.test(String(val))) {
    const s = String(val);
    const y = parseInt(s.substring(0,4), 10);
    const m = parseInt(s.substring(4,6), 10) - 1;
    const d = parseInt(s.substring(6,8), 10);
    return new Date(y, m, d);
  }
  const parts = String(val).split('/');
  if (parts.length === 3) {
    return new Date(parseInt(parts[2],10), parseInt(parts[1],10)-1, parseInt(parts[0],10));
  }
  return null;
}

export function formatDate(d) {
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR');
}

export function dayOfYear(d) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / (1000*60*60*24));
}

export function formatNum(v) {
  if (v === undefined || v === null || isNaN(v)) return '';
  return Number(v).toFixed(1);
}

export function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

// Saison (hémisphère nord)
export function getSeason(month) {
  if (month >= 3 && month <= 5) return 'printemps';
  if (month >= 6 && month <= 8) return 'été';
  if (month >= 9 && month <= 11) return 'automne';
  return 'hiver';
}

// Qualité
export function qualityLabel(q) {
  const map = { '0':'protégée', '1':'validée', '2':'douteuse', '9':'filtrée' };
  return map[q] || q;
}

export function qualityColor(q) {
  const map = { '0':'q0', '1':'q1', '2':'q2', '9':'q9' };
  return map[q] || '';
}

// Percentile (pour boxplot)
export function percentile(arr, p) {
  if (!arr.length) return null;
  const sorted = [...arr].sort((a,b)=>a-b);
  const idx = (p/100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}