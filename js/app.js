// Oberfläche: liest Eingaben, ruft calc.js auf und zeigt Ergebnisse an.
import { TEXTE } from './texte.js';

const t = TEXTE.de;
document.title = t.appTitel;
document.querySelector('h1').textContent = t.appTitel;
