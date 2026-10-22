// Wandvorschau als SVG: massstabsgetreu, 1 Einheit = 1 cm.
// Reine Funktion: bekommt das Ergebnis einer Wandseite aus calc.js und liefert SVG-Text.

import { formatCm } from './calc.js';

function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, (z) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[z]);
}

const r1 = (n) => Math.round(n * 10) / 10;

// seite: Ergebnis von berechneSeite; optionen: { mittelhoehe, minBodenabstand, name(id), texte: { mittellinie, beschreibung } }
export function erzeugeVorschau(seite, { mittelhoehe, minBodenabstand, name = (id) => id, texte = {} }) {
  const L = seite.laenge > 0 ? seite.laenge : 100;
  const elemente = seite.elemente || [];
  const H = seite.hoehe > 0 ? seite.hoehe : Math.max(250, ...elemente.map((e) => e.oberkante + 20));

  // Sichtbarer Bereich: Wand plus alles, was darüber hinausragt
  const minX = Math.min(0, ...elemente.map((e) => e.x));
  const maxX = Math.max(L, ...elemente.map((e) => e.x + e.breite));
  const maxH = Math.max(H, ...elemente.map((e) => e.oberkante));
  const groesse = Math.max(maxX - minX, maxH);
  const schrift = Math.max(3, groesse / 38);
  const rand = schrift * 2.5;

  const y = (hoehe) => r1(maxH - hoehe); // Höhe ab Boden → SVG-Koordinate (y wächst nach unten)
  const vbX = r1(minX - rand);
  const vbY = r1(-rand);
  const vbB = r1(maxX - minX + 2 * rand);
  const vbH = r1(maxH + 2 * rand + schrift * 1.5);

  const teile = [];

  // Wand und Boden
  teile.push(`<rect x="0" y="${y(H)}" width="${r1(L)}" height="${r1(H)}" fill="#efede7" stroke="#8a8a85" stroke-width="${r1(schrift / 8)}"/>`);
  teile.push(`<line x1="${r1(minX - rand / 2)}" y1="${y(0)}" x2="${r1(maxX + rand / 2)}" y2="${y(0)}" stroke="#555" stroke-width="${r1(schrift / 4)}"/>`);

  // Mindestabstand zum Boden (fein gepunktet)
  if (minBodenabstand > 0) {
    teile.push(`<line x1="0" y1="${y(minBodenabstand)}" x2="${r1(L)}" y2="${y(minBodenabstand)}" stroke="#b0aea6" stroke-width="${r1(schrift / 10)}" stroke-dasharray="${r1(schrift / 3)} ${r1(schrift / 3)}"/>`);
  }

  // Mittelhöhe
  teile.push(`<line x1="0" y1="${y(mittelhoehe)}" x2="${r1(L)}" y2="${y(mittelhoehe)}" stroke="#1d4ed8" stroke-width="${r1(schrift / 7)}" stroke-dasharray="${r1(schrift)} ${r1(schrift / 2)}"/>`);
  teile.push(`<text x="${r1(schrift / 2)}" y="${r1(y(mittelhoehe) - schrift / 3)}" font-size="${r1(schrift * 0.8)}" fill="#1d4ed8">${esc(texte.mittellinie ?? `M = ${formatCm(mittelhoehe)} cm`)}</text>`);

  for (const el of elemente) {
    // Gruppen: gestrichelter Rahmen ums Gesamtrechteck
    if (el.typ === 'gruppe') {
      teile.push(`<rect x="${r1(el.x)}" y="${y(el.oberkante)}" width="${r1(el.breite)}" height="${r1(el.hoehe)}" fill="none" stroke="#1d4ed8" stroke-width="${r1(schrift / 10)}" stroke-dasharray="${r1(schrift / 2)} ${r1(schrift / 3)}"/>`);
    }
    for (const teil of el.teile) {
      const istScreen = teil.typ === 'screen';
      const titel = name(teil.werkId);
      teile.push(`<g><title>${esc(titel)}</title>
        <rect x="${r1(teil.x)}" y="${y(teil.oberkante)}" width="${r1(teil.breite)}" height="${r1(teil.hoehe)}"
          fill="${istScreen ? '#0f766e' : '#ffffff'}" stroke="${istScreen ? '#0b4f4a' : '#333'}" stroke-width="${r1(schrift / 7)}"/>`);
      // Titel: so gross wie möglich, aber in die Breite passend
      const fs = r1(Math.min(schrift * 0.8, (teil.breite * 0.9) / Math.max(1, titel.length * 0.55)));
      teile.push(`<text x="${r1(teil.x + teil.breite / 2)}" y="${r1(y(teil.oberkante - teil.hoehe / 2) + fs / 3)}" font-size="${fs}"
          text-anchor="middle" fill="${istScreen ? '#ffffff' : '#333'}">${esc(titel)}</text></g>`);
    }
    for (const p of el.punkte) {
      teile.push(`<circle cx="${r1(p.x)}" cy="${y(p.hoehe)}" r="${r1(schrift * 0.35)}" fill="#d4202a" stroke="#fff" stroke-width="${r1(schrift / 12)}">
        <title>${esc(name(p.werkId))} · ${p.nr}: x ${formatCm(p.x)} / ${formatCm(p.hoehe)} cm</title></circle>`);
    }
  }

  // Wandlänge unten
  teile.push(`<text x="${r1(L / 2)}" y="${r1(y(0) + schrift * 1.4)}" font-size="${r1(schrift * 0.8)}" text-anchor="middle" fill="#555">${formatCm(L)} cm</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbB} ${vbH}" role="img" aria-label="${esc(texte.beschreibung ?? '')}"
    font-family="-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif">${teile.join('\n')}</svg>`;
}
