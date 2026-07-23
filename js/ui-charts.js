import { store } from './store.js';
import { formatDate, formatNum, getSeason } from './utils.js';

let chartInstance = null;

export function renderChart() {
  const varName = document.getElementById('chartVar').value;
  const type = document.getElementById('chartType').value;
  const period = document.getElementById('chartPeriod').value;
  let records = store.records;

  // Période
  if (period === 'year') {
    const currentYear = new Date().getFullYear();
    records = records.filter(r => r.year === currentYear);
  } else if (period === 'range') {
    const start = document.getElementById('chartStart').value;
    const end = document.getElementById('chartEnd').value;
    if (start && end) {
      const s = new Date(start);
      const e = new Date(end);
      records = records.filter(r => r.date >= s && r.date <= e);
    }
  }

  const valid = records.filter(r => r[varName] !== undefined && !isNaN(r[varName]));
  if (!valid.length) {
    document.getElementById('chartMethod').textContent = 'Aucune donnée pour cette sélection.';
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    return;
  }

  const canvas = document.getElementById('chartCanvas');
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  if (type === 'line') {
    chartInstance = drawLine(canvas, valid, varName);
  } else if (type === 'bar') {
    const sorted = [...valid].sort((a,b) => b[varName] - a[varName]).slice(0, 10);
    chartInstance = drawBar(canvas, sorted, varName);
  } else if (type === 'boxplot') {
    const yearFilter = (period === 'year') ? new Date().getFullYear() : null;
    const boxData = store.monthlyBoxplot(varName, yearFilter);
    chartInstance = drawBoxplot(canvas, boxData, varName);
  }

  document.getElementById('chartMethod').textContent =
    `Graphique ${type} de ${varName} sur ${valid.length} jours.`;
}

function drawLine(canvas, data, varName) {
  const sorted = [...data].sort((a,b) => a.date - b.date);
  const labels = sorted.map(r => formatDate(r.date));
  const values = sorted.map(r => r[varName]);
  const ctx = canvas.getContext('2d');
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: varName,
        data: values,
        borderColor: '#1e1e1e',
        backgroundColor: 'rgba(30,30,30,0.1)',
        pointRadius: 1.5,
        borderWidth: 2,
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `${ctx.parsed.y.toFixed(1)}` } }
      },
      scales: { x: { ticks: { maxRotation: 30, font: { size: 9 } } } }
    }
  });
}

function drawBar(canvas, data, varName) {
  const labels = data.map(r => formatDate(r.date));
  const values = data.map(r => r[varName]);
  const ctx = canvas.getContext('2d');
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: varName,
        data: values,
        backgroundColor: '#1e1e1e',
        borderRadius: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `${ctx.parsed.y.toFixed(1)}` } }
      }
    }
  });
}

function drawBoxplot(canvas, boxData, varName) {
  const ctx = canvas.getContext('2d');
  const months = Array.from({length:12}, (_,i) => i+1);
  const labels = months.map(m => `M${m}`);
  // Préparer données pour boxplot (min, q1, median, q3, max)
  const minVals = [], q1Vals = [], medianVals = [], q3Vals = [], maxVals = [];
  months.forEach(m => {
    const b = boxData[m];
    if (b) {
      minVals.push(b.min);
      q1Vals.push(b.q1);
      medianVals.push(b.median);
      q3Vals.push(b.q3);
      maxVals.push(b.max);
    } else {
      minVals.push(null);
      q1Vals.push(null);
      medianVals.push(null);
      q3Vals.push(null);
      maxVals.push(null);
    }
  });

  // Chart.js n'a pas de boxplot natif ; on utilise un scatter avec des barres d'erreur
  // Solution simplifiée : on dessine des barres pour médiane avec min/max en erreur
  // Pour rester simple, on utilise un line avec remplissage pour simuler l'IQR
  // Version plus robuste : on utilise chartjs-chart-boxplot mais on reste vanilla.
  // Ici on fait un line avec 3 séries (min, median, max) pour visualiser l'étendue.
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Min', data: minVals, borderColor: '#888', borderDash: [2,2], pointRadius: 0, fill: false },
        { label: 'Médiane', data: medianVals, borderColor: '#1e1e1e', borderWidth: 2, pointRadius: 2 },
        { label: 'Max', data: maxVals, borderColor: '#888', borderDash: [2,2], pointRadius: 0, fill: false }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top', labels: { boxWidth: 12 } },
        tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y?.toFixed(1) || '—'}` } }
      },
      scales: { y: { title: { display: true, text: varName } } }
    }
  });
}

export function initCharts() {
  document.getElementById('chartPeriod').addEventListener('change', (e) => {
    const rangeControls = document.getElementById('chartRangeControls');
    rangeControls.style.display = e.target.value === 'range' ? 'flex' : 'none';
  });
  document.getElementById('drawChart').addEventListener('click', renderChart);
  // Initial draw
  setTimeout(renderChart, 100);
}