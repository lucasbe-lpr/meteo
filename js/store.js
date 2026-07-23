import { getSeason, percentile } from './utils.js';

export const store = {
  _records: [],
  _years: [],
  _indexed: false,

  setRecords(recs) {
    this._records = recs;
    const ySet = new Set(recs.map(r => r.year));
    this._years = Array.from(ySet).sort();
    this._indexed = false;
    this.buildIndex();
  },

  get records() { return this._records; },
  get years() { return this._years; },

  // Indexation pour accélérer les requêtes
  buildIndex() {
    this._byYear = {};
    this._byMonth = {};
    this._bySeason = {};
    this._byDayOfYear = {};
    this._records.forEach(r => {
      if (!this._byYear[r.year]) this._byYear[r.year] = [];
      this._byYear[r.year].push(r);
      const key = `${r.year}-${String(r.month).padStart(2,'0')}`;
      if (!this._byMonth[key]) this._byMonth[key] = [];
      this._byMonth[key].push(r);
      const season = getSeason(r.month);
      if (!this._bySeason[season]) this._bySeason[season] = [];
      this._bySeason[season].push(r);
      const doy = r.dayOfYear;
      if (!this._byDayOfYear[doy]) this._byDayOfYear[doy] = [];
      this._byDayOfYear[doy].push(r);
    });
    this._indexed = true;
  },

  getByYear(year) { return this._byYear[year] || []; },
  getByMonth(year, month) {
    const key = `${year}-${String(month).padStart(2,'0')}`;
    return this._byMonth[key] || [];
  },
  getBySeason(season) { return this._bySeason[season] || []; },
  getByDayOfYear(doy) { return this._byDayOfYear[doy] || []; },

  // Filtrer par qualité (sur une variable donnée)
  filterByQuality(records, varName, quality) {
    if (quality === 'all') return records;
    const qField = 'Q' + varName;
    return records.filter(r => r[qField] === quality);
  },

  // Classement (top N pour max, bottom N pour min)
  rank(records, varName, mode = 'max', limit = 50) {
    const valid = records.filter(r => r[varName] !== undefined && !isNaN(r[varName]));
    const sorted = [...valid].sort((a,b) => {
      const va = a[varName], vb = b[varName];
      return mode === 'max' ? vb - va : va - vb;
    });
    const top = sorted.slice(0, limit);
    const absVal = mode === 'max' ? sorted[0]?.[varName] : sorted[0]?.[varName];
    return top.map((r, idx) => {
      const rank = idx + 1;
      const diff = mode === 'max' ? r[varName] - absVal : r[varName] - absVal;
      return { ...r, rank, diffToRecord: diff };
    });
  },

  // Agrégats pour Comparer
  aggregate(records, varName) {
    const valid = records.filter(r => r[varName] !== undefined && !isNaN(r[varName]));
    if (!valid.length) return null;
    const vals = valid.map(r => r[varName]);
    const sum = vals.reduce((a,b) => a+b, 0);
    return {
      count: valid.length,
      sum,
      mean: sum / valid.length,
      min: Math.min(...vals),
      max: Math.max(...vals),
      median: percentile(vals, 50),
      values: vals
    };
  },

  // Boxplot mensuel : pour chaque mois, distribution de la variable
  monthlyBoxplot(varName, yearFilter = null) {
    const months = Array.from({length:12}, (_,i) => i+1);
    const result = {};
    months.forEach(m => {
      let recs = this._records.filter(r => r.month === m);
      if (yearFilter) {
        recs = recs.filter(r => r.year === yearFilter);
      }
      const valid = recs.filter(r => r[varName] !== undefined && !isNaN(r[varName]));
      if (valid.length) {
        const vals = valid.map(r => r[varName]).sort((a,b)=>a-b);
        result[m] = {
          min: vals[0],
          q1: percentile(vals, 25),
          median: percentile(vals, 50),
          q3: percentile(vals, 75),
          max: vals[vals.length-1],
          all: vals,
          count: vals.length
        };
      } else {
        result[m] = null;
      }
    });
    return result;
  }
};