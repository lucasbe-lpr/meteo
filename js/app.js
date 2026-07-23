import { loadData } from './data-loader.js';
import { store } from './store.js';
import { renderExplorer, initExplorer } from './ui-explorer.js';
import { renderRecords, initRecords } from './ui-records.js';
import { renderCompare, initCompare } from './ui-compare.js';
import { renderChart, initCharts } from './ui-charts.js';

// Gestion des onglets
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(btn.dataset.tab);
    panel.classList.add('active');
    // Re-render au besoin
    const tab = btn.dataset.tab;
    if (tab === 'explorer') renderExplorer();
    else if (tab === 'records') renderRecords();
    else if (tab === 'compare') renderCompare();
    else if (tab === 'charts') renderChart();
  });
});

// Chargement et initialisation
loadData('data/lyon-bron.csv')
  .then(() => {
    const info = document.getElementById('stationInfo');
    const first = store.records[0];
    const last = store.records[store.records.length - 1];
    info.textContent = `Lyon-Bron · ${store.records.length} jours · ${first ? first.year : '—'}–${last ? last.year : '—'}`;
    initExplorer();
    initRecords();
    initCompare();
    initCharts();
    renderExplorer();
    renderRecords();
    renderCompare();
    renderChart();
  })
  .catch(err => {
    document.getElementById('stationInfo').textContent = '⚠️ Erreur chargement';
    console.error(err);
  });