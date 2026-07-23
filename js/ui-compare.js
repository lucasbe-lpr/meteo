import { store } from './store.js';
import { formatDate, formatNum } from './utils.js';

export function renderCompare() {
  const typeA = document.getElementById('compareTypeA').value;
  const typeB = document.getElementById('compareTypeB').value;
  const dataA = getPeriodData('A', typeA);
  const dataB = getPeriodData('B', typeB);
  if (!dataA || !dataB) {
    document.getElementById('compareResults').innerHTML = '<p style="color:#999;">Sélectionnez des périodes valides.</p>';
    document.getElementById('compareMethod').innerHTML = '';
    return;
  }
  const compare = comparePeriods(dataA, dataB);
  renderCompareResults(compare, dataA, dataB);
  renderCompareMethod(dataA, dataB);
}

function getPeriodData(prefix, type) {
  const controls = document.getElementById(`compareControls${prefix}`);
  if (type === 'date') {
    const input = controls.querySelector('.compare-date');
    if (!input || !input.value) return null;
    const d = new Date(input.value);
    const rec = store.records.find(r => r.date.getFullYear() === d.getFullYear() &&
                                         r.date.getMonth() === d.getMonth() &&
                                         r.date.getDate() === d.getDate());
    return rec ? [rec] : [];
  } else if (type === 'month') {
    const monthInput = controls.querySelector('.compare-month');
    const yearInput = controls.querySelector('.compare-year');
    if (!monthInput || !yearInput) return null;
    const m = parseInt(monthInput.value, 10);
    const y = parseInt(yearInput.value, 10);
    if (isNaN(m) || isNaN(y)) return null;
    return store.getByMonth(y, m);
  } else if (type === 'year') {
    const yearInput = controls.querySelector('.compare-year');
    if (!yearInput) return null;
    const y = parseInt(yearInput.value, 10);
    if (isNaN(y)) return null;
    return store.getByYear(y);
  } else if (type === 'range') {
    const startInput = controls.querySelector('.compare-start');
    const endInput = controls.querySelector('.compare-end');
    if (!startInput || !endInput || !startInput.value || !endInput.value) return null;
    const start = new Date(startInput.value);
    const end = new Date(endInput.value);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return null;
    return store.records.filter(r => r.date >= start && r.date <= end);
  }
  return null;
}

function comparePeriods(recsA, recsB) {
  const vars = ['RR','TN','TX','TM','TAMPLI','DG','FXI3S'];
  const result = {};
  vars.forEach(v => {
    const aggA = store.aggregate(recsA, v);
    const aggB = store.aggregate(recsB, v);
    result[v] = { A: aggA, B: aggB };
  });
  return result;
}

function renderCompareResults(compare, dataA, dataB) {
  const container = document.getElementById('compareResults');
  const vars = ['RR','TN','TX','TM','TAMPLI','DG','FXI3S'];
  const labels = {
    RR: 'Précipitations (mm)',
    TN: 'TN (°C)',
    TX: 'TX (°C)',
    TM: 'TM (°C)',
    TAMPLI: 'Amplitude (°C)',
    DG: 'Durée de gel (mn)',
    FXI3S: 'Rafale (m/s)'
  };
  let html = `
    <div class="compare-summary">
      <strong>Comparaison :</strong> Période A (${dataA.length} jours) vs Période B (${dataB.length} jours)
    </div>
    <div class="compare-grid">
      <div class="header">Variable</div>
      <div class="header">Période A</div>
      <div class="header">Période B</div>
  `;
  vars.forEach(v => {
    const a = compare[v].A;
    const b = compare[v].B;
    const aVal = a ? a.mean : '—';
    const bVal = b ? b.mean : '—';
    let diff = '';
    if (a && b) {
      const d = a.mean - b.mean;
      diff = d > 0 ? `+${d.toFixed(2)}` : d.toFixed(2);
    }
    html += `
      <div class="cell">${labels[v]}</div>
      <div class="cell">${typeof aVal === 'number' ? aVal.toFixed(1) : aVal}</div>
      <div class="cell">${typeof bVal === 'number' ? bVal.toFixed(1) : bVal}</div>
    `;
    // Ligne d'écart
    if (a && b) {
      html += `
        <div class="cell" style="font-size:0.8rem;color:#777;">Écart</div>
        <div class="cell" style="font-size:0.8rem;" colspan="2">${diff}</div>
      `;
    }
  });
  html += '</div>';
  container.innerHTML = html;
}

function renderCompareMethod(dataA, dataB) {
  const box = document.getElementById('compareMethod');
  box.innerHTML = `
    <strong>Méthode :</strong> Comparaison sur la base de la moyenne quotidienne pour chaque variable.
    Période A : ${dataA.length} jours, Période B : ${dataB.length} jours.
    Les valeurs manquantes sont ignorées.
  `;
}

// Dynamique des contrôles
export function initCompare() {
  ['A','B'].forEach(prefix => {
    const typeEl = document.getElementById(`compareType${prefix}`);
    const container = document.getElementById(`compareControls${prefix}`);
    function updateControls() {
      const type = typeEl.value;
      container.innerHTML = '';
      if (type === 'date') {
        container.innerHTML = `<input type="date" class="compare-date" value="2024-12-31">`;
      } else if (type === 'month') {
        container.innerHTML = `
          <select class="compare-month">
            ${Array.from({length:12}, (_,i) => `<option value="${i+1}">Mois ${i+1}</option>`).join('')}
          </select>
          <select class="compare-year">
            ${store.years.map(y => `<option value="${y}">${y}</option>`).join('')}
          </select>
        `;
      } else if (type === 'year') {
        container.innerHTML = `
          <select class="compare-year">
            ${store.years.map(y => `<option value="${y}">${y}</option>`).join('')}
          </select>
        `;
      } else if (type === 'range') {
        container.innerHTML = `
          <label>Début</label><input type="date" class="compare-start" value="2024-06-01">
          <label>Fin</label><input type="date" class="compare-end" value="2024-07-01">
        `;
      }
    }
    typeEl.addEventListener('change', updateControls);
    updateControls();
  });

  document.getElementById('runCompare').addEventListener('click', renderCompare);
}