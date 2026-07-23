import { store } from './store.js';
import { parseDate, formatNum } from './utils.js';

export async function loadData(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const csvText = await response.text();
  const result = Papa.parse(csvText, {
    delimiter: ';',
    header: true,
    dynamicTyping: false,
    skipEmptyLines: true
  });
  if (result.errors.length) console.warn('Parsing errors', result.errors);
  const raw = result.data;
  const records = raw.map(row => {
    const date = parseDate(row.AAAAMMJJ);
    if (!date || isNaN(date.getTime())) return null;
    const r = {
      date,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      dayOfYear: dayOfYear(date),
      // variables
      RR: parseFloat(row.RR),
      TN: parseFloat(row.TN),
      TX: parseFloat(row.TX),
      TM: parseFloat(row.TM),
      TAMPLI: parseFloat(row.TAMPLI),
      DG: parseFloat(row.DG),
      FXI3S: parseFloat(row.FXI3S),
      // qualités
      QRR: row.QRR || '',
      QTN: row.QTN || '',
      QTX: row.QTX || '',
      QTM: row.QTM || '',
      QTAMPLI: row.QTAMPLI || '',
      QDG: row.QDG || '',
      QFXI3S: row.QFXI3S || '',
      // métadonnées
      NUM_POSTE: row.NUM_POSTE || '',
      NOM_USUEL: row.NOM_USUEL || '',
      LAT: parseFloat(row.LAT),
      LON: parseFloat(row.LON),
      ALTI: parseFloat(row.ALTI)
    };
    return r;
  }).filter(r => r !== null);

  store.setRecords(records);
  return records;
}