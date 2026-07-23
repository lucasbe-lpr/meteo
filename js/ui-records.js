import { store } from './store.js';
import { formatDate, formatNum, qualityColor, getSeason } from './utils.js';

let currentRecordConfig = { var: 'TX', scope: 'absolu', subset: '', quality: 'all' };

export function renderRecords() {
  const config = getRecordConfig();
  currentRecordConfig = config;
  let pool = [];
  const varName = config.var;
  const mode = (varName === 'TN') ? 'min' : 'max';

  // Sélection du sous-ensemble
  if (config.scope === 'absolu') {
    pool = store.records;
  } else if (config.scope === 'month') {
    const m = parseInt(config.subset, 10);
    if (!isNaN(m)) pool = store.records.filter(r => r.month === m);
    else pool = store.records;
  } else if (config.scope === 'season') {
    pool = store.records.filter(r => getSeason(r.month) === config.subset);
  } else if (config.scope === 'decade') {
    const decade = parseInt(config.subset, 10);
    if (!isNaN(decade)) {
      pool = store.records.filter(r => r.year >= decade && r.year < decade + 10);
    } else pool = store.records;
  } else if (config.scope === 'dayOfYear') {
    // on prend une date de référence : on utilise le subset comme jour de l'année (1-366)
    const doy = parseInt(config.subset, 10);
    if (!isNaN(doy)) pool = store.records.filter(r => r.dayOfYear === doy);
    else pool = store.records;
  }

  // Filtre qualité
  if (config.quality !== 'all') {
    const qField = 'Q' + varName;
    pool = pool.filter(r => r[qField] === config.quality);
  }

  // Classement
  const ranked = store.rank(pool, varName, mode, 50);
  renderRecordTable(ranked, varName, mode);
  renderRecordMethod(config, pool.length, ranked);
}

function getRecordConfig() {
  const varEl = document.getElementById('recordVar');
  const scopeEl = document.getElementById('recordScope');
  const subsetEl = document.getElementById('recordSubset');
  const qualityEl = document.getElementById('recordQuality');
  return {
    var: varEl.value,
    scope: scopeEl.value,
    subset: subsetEl.value,
    quality: qualityEl.value
  };
}

function renderRecordTable(ranked, varName, mode) {
  const thead = document.querySelector('#recordsTable thead tr');
  const tbody = document.querySelector('#recordsTable tbody');
  const label = mode === 'max' ? 'Record max' : 'Record min';
  thead.innerHTML = `
    <th>Rang</th>
    <th>Date</th>
    <th>${varName}</th>
    <th>Écart au record</th>
    <th>Qualité</th>
  `;
  tbody.innerHTML = '';
  if (!ranked.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:1rem;">Aucune donnée</td></tr>';
    return;
  }
  const absVal = ranked[0]?.[varName];
  ranked.forEach((r, idx) => {
    const tr = document.createElement('tr');
    const diff = mode === 'max' ? r[varName] - absVal : r[varName] - absVal;
    const diffStr = diff === 0 ? 'Record' : (diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1));
    const qField = 'Q' + varName;
    const q = r[qField] || '';
    tr.innerHTML = `
      <td>${r.rank}</td>
      <td>${formatDate(r.date)}</td>
      <td><strong>${formatNum(r[varName])}</strong> ${diff === 0 ? '🏆' : ''}</td>
      <td>${diffStr}</td>
      <td><span class="badge ${qualityColor(q)}">${q}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderRecordMethod(config, total, ranked) {
  const box = document.getElementById('recordsMethod');
  const varName = config.var;
  const mode = (varName === 'TN') ? 'minimum' : 'maximum';
  let scopeDesc = '';
  if (config.scope === 'absolu') scopeDesc = 'toutes les données disponibles';
  else if (config.scope === 'month') scopeDesc = `le mois ${config.subset}`;
  else if (config.scope === 'season') scopeDesc = `la saison ${config.subset}`;
  else if (config.scope === 'decade') scopeDesc = `la décennie ${config.subset}`;
  else if (config.scope === 'dayOfYear') scopeDesc = `le jour de l'année ${config.subset}`;
  const qualityDesc = config.quality === 'all' ? 'toutes qualités' : `qualité ${config.quality}`;
  const recordCount = ranked.length;
  const absRecord = ranked[0]?.[varName];
  box.innerHTML = `
    <strong>Méthode :</strong> Top 50 des ${varName} ${mode} sur ${scopeDesc}.
    Filtre qualité : ${qualityDesc}. Total de jours analysés : ${total}.
    Record absolu : ${absRecord !== undefined ? formatNum(absRecord) : '—'}.
    Les ex-æquo sont inclus dans le classement.
  `;
}

// Remplir les sous-ensembles dynamiques
export function initRecords() {
  const scopeEl = document.getElementById('recordScope');
  const subsetEl = document.getElementById('recordSubset');

  function updateSubset() {
    const scope = scopeEl.value;
    subsetEl.innerHTML = '';
    if (scope === 'month') {
      for (let m=1; m<=12; m++) {
        const opt = document.createElement('option');
        opt.value = String(m);
        opt.textContent = `Mois ${m}`;
        subsetEl.appendChild(opt);
      }
    } else if (scope === 'season') {
      ['hiver','printemps','été','automne'].forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        subsetEl.appendChild(opt);
      });
    } else if (scope === 'decade') {
      const years = store.years;
      if (years.length) {
        const start = Math.floor(years[0]/10)*10;
        const end = Math.floor(years[years.length-1]/10)*10;
        for (let d=start; d<=end; d+=10) {
          const opt = document.createElement('option');
          opt.value = String(d);
          opt.textContent = `${d}s`;
          subsetEl.appendChild(opt);
        }
      }
    } else if (scope === 'dayOfYear') {
      for (let d=1; d<=366; d++) {
        const opt = document.createElement('option');
        opt.value = String(d);
        opt.textContent = `Jour ${d}`;
        subsetEl.appendChild(opt);
      }
    } else {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '—';
      subsetEl.appendChild(opt);
    }
  }

  scopeEl.addEventListener('change', () => {
    updateSubset();
    renderRecords();
  });
  document.getElementById('recordVar').addEventListener('change', renderRecords);
  document.getElementById('recordSubset').addEventListener('change', renderRecords);
  document.getElementById('recordQuality').addEventListener('change', renderRecords);

  // initialisation
  updateSubset();
}