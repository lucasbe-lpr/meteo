import { store } from './store.js';
import { formatDate, formatNum, qualityColor, qualityLabel } from './utils.js';

let currentPage = 1;
const pageSize = 50;
let currentFilters = { var: '', threshold: '', quality: 'all' };

export function renderExplorer() {
  const filters = getFilters();
  currentFilters = filters;
  let records = store.records;
  // filtre qualité (sur toutes les variables : on garde si au moins une qualité correspond)
  if (filters.quality !== 'all') {
    records = records.filter(r => {
      const qFields = ['QRR','QTN','QTX','QTM','QTAMPLI','QDG','QFXI3S'];
      return qFields.some(f => r[f] === filters.quality);
    });
  }
  // filtre seuil
  if (filters.var && filters.threshold !== '' && !isNaN(filters.threshold)) {
    const thr = parseFloat(filters.threshold);
    records = records.filter(r => {
      const val = r[filters.var];
      return val !== undefined && !isNaN(val) && val >= thr;
    });
  }
  // tri par date décroissante
  const sorted = [...records].sort((a,b) => b.date - a.date);
  const total = sorted.length;
  const paginated = sorted.slice((currentPage-1)*pageSize, currentPage*pageSize);
  renderTable(paginated);
  renderFooter(total);
}

function getFilters() {
  const varEl = document.getElementById('varFilter');
  const thresholdEl = document.getElementById('threshold');
  const qualityEl = document.getElementById('qualityFilter');
  return {
    var: varEl.value,
    threshold: thresholdEl.value,
    quality: qualityEl.value
  };
}

function renderTable(records) {
  const thead = document.querySelector('#dataTable thead tr');
  const tbody = document.querySelector('#dataTable tbody');
  thead.innerHTML = `
    <th data-sort="date">Date</th>
    <th data-sort="RR">RR (mm)</th>
    <th data-sort="TN">TN (°C)</th>
    <th data-sort="TX">TX (°C)</th>
    <th data-sort="TM">TM (°C)</th>
    <th data-sort="TAMPLI">Ampl. (°C)</th>
    <th data-sort="DG">DG (mn)</th>
    <th data-sort="FXI3S">Rafale (m/s)</th>
  `;
  tbody.innerHTML = '';
  if (!records.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:1rem;">Aucun enregistrement</td></tr>';
    return;
  }
  records.forEach(r => {
    const tr = document.createElement('tr');
    const isDoubtful = ['QRR','QTN','QTX','QTM','QTAMPLI','QDG','QFXI3S'].some(f => r[f] === '2');
    if (isDoubtful) tr.classList.add('doubtful');
    tr.innerHTML = `
      <td>${formatDate(r.date)}</td>
      <td>${formatNum(r.RR)} <span class="badge ${qualityColor(r.QRR)}">${r.QRR}</span></td>
      <td>${formatNum(r.TN)} <span class="badge ${qualityColor(r.QTN)}">${r.QTN}</span></td>
      <td>${formatNum(r.TX)} <span class="badge ${qualityColor(r.QTX)}">${r.QTX}</span></td>
      <td>${formatNum(r.TM)} <span class="badge ${qualityColor(r.QTM)}">${r.QTM}</span></td>
      <td>${formatNum(r.TAMPLI)} <span class="badge ${qualityColor(r.QTAMPLI)}">${r.QTAMPLI}</span></td>
      <td>${formatNum(r.DG)} <span class="badge ${qualityColor(r.QDG)}">${r.QDG}</span></td>
      <td>${formatNum(r.FXI3S)} <span class="badge ${qualityColor(r.QFXI3S)}">${r.QFXI3S}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderFooter(total) {
  const start = (currentPage-1)*pageSize + 1;
  const end = Math.min(currentPage*pageSize, total);
  document.getElementById('tableFooter').textContent =
    total > 0 ? `Affichage ${start}–${end} sur ${total} jours filtrés.` : 'Aucune donnée.';
}

// Événements
export function initExplorer() {
  const select = document.getElementById('varFilter');
  ['RR','TN','TX','TM','TAMPLI','DG','FXI3S'].forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });

  document.querySelectorAll('.quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('varFilter').value = btn.dataset.var;
      document.getElementById('threshold').value = btn.dataset.threshold;
      currentPage = 1;
      renderExplorer();
    });
  });

  document.getElementById('resetFilters').addEventListener('click', () => {
    document.getElementById('varFilter').value = '';
    document.getElementById('threshold').value = '';
    document.getElementById('qualityFilter').value = 'all';
    currentPage = 1;
    renderExplorer();
  });

  document.getElementById('qualityFilter').addEventListener('change', () => { currentPage = 1; renderExplorer(); });
  document.getElementById('threshold').addEventListener('input', () => { currentPage = 1; renderExplorer(); });
  document.getElementById('varFilter').addEventListener('change', () => { currentPage = 1; renderExplorer(); });

  // Tri sur clic en-tête (simplifié : on refait un tri simple)
  document.querySelector('#dataTable thead').addEventListener('click', (e) => {
    const th = e.target.closest('th');
    if (!th) return;
    const key = th.dataset.sort;
    if (!key) return;
    const records = store.records;
    const sorted = [...records].sort((a,b) => {
      const va = a[key] ?? (key === 'date' ? a.date.getTime() : -Infinity);
      const vb = b[key] ?? (key === 'date' ? b.date.getTime() : -Infinity);
      if (typeof va === 'string') return va.localeCompare(vb);
      return va - vb;
    });
    // Re-render avec tri (on ignore les filtres pour la simplicité)
    // Dans une V2 on applique les filtres puis tri
    renderTable(sorted.slice(0, pageSize));
  });
}