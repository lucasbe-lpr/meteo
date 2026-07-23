# Meteo‑Journalist

Outil statique pour journalistes – records, comparaisons et visualisations rapides à partir des données Météo-France.

## Installation

1. Placez le fichier CSV quotidien dans `data/lyon-bron.csv` (séparateur `;`).
2. Ouvrez `index.html` dans un navigateur moderne.
3. Pour GitHub Pages, poussez le dépôt.

## Données MVP

Variables : RR, TN, TX, TM, TAMPLI, DG, FXI3S.
Qualité : 0=protégée, 1=validée, 2=douteuse, 9=filtrée.

## Structure

- `index.html` : point d'entrée
- `css/` : styles
- `js/` : modules ES
- `data/` : CSV

## Extension V2

- Multi‑station
- Autres paramètres (humidité, UV, neige…)
- Export PDF