// Lage der Wände im Stand (Grundriss) – reine Rechenfunktionen ohne Oberfläche.
//
// Grundriss von oben, alle Masse in cm:
//   x = nach rechts, y = nach unten (so wie auf dem gezeichneten Plan), Nullpunkt = obere linke Ecke des Stands.
// Jede Wand hat einen Startpunkt (posX, posY) und eine Richtung in Grad (0 = →, 90 = ↓, 180 = ←, 270 = ↑).
// Der Startpunkt ist das LINKE Ende, wenn man vor der ersten Seite der Wand steht.
// Die erste Seite zeigt deshalb (in Laufrichtung gesehen) nach rechts, alle weiteren Seiten zur Gegenseite.

export const WANDDICKE = 10;
export const RICHTUNGEN = [0, 90, 180, 270];

const istZahl = (x) => typeof x === 'number' && Number.isFinite(x);

// Startpunkt, Laufrichtung (Einheitsvektor) und Länge einer Wand
export function wandLage(wand) {
  const grad = istZahl(wand.richtung) ? wand.richtung : 0;
  const rad = (grad * Math.PI) / 180;
  const runde = (n) => Math.round(n * 1e9) / 1e9; // cos(90°) = 0 statt 6e-17
  return {
    x: istZahl(wand.posX) ? wand.posX : 0,
    y: istZahl(wand.posY) ? wand.posY : 0,
    dx: runde(Math.cos(rad)),
    dy: runde(Math.sin(rad)),
    laenge: istZahl(wand.laenge) && wand.laenge > 0 ? wand.laenge : 0,
  };
}

// Punkt auf einer Wandseite im Grundriss.
// u = cm ab der linken Kante dieser Seite (so wie in der Ergebnistabelle), seitenIndex 0 = erste Seite.
// Liefert die Lage auf der Wandoberfläche { x, y } und die Blickrichtung der Seite { nx, ny } (zeigt in den Raum).
export function punktAufSeite(wand, seitenIndex, u) {
  const w = wandLage(wand);
  const vorne = seitenIndex === 0;
  const ab = vorne ? u : w.laenge - u;
  const nx = vorne ? -w.dy : w.dy;
  const ny = vorne ? w.dx : -w.dx;
  return {
    x: w.x + w.dx * ab + nx * (WANDDICKE / 2),
    y: w.y + w.dy * ab + ny * (WANDDICKE / 2),
    nx,
    ny,
  };
}

// Rechteck, das alle Wände und den Stand umschliesst: { minX, minY, maxX, maxY }
export function umriss(plan) {
  const xs = [0];
  const ys = [0];
  const a = plan.ausstellung || {};
  if (istZahl(a.standBreite) && a.standBreite > 0) xs.push(a.standBreite);
  if (istZahl(a.standTiefe) && a.standTiefe > 0) ys.push(a.standTiefe);
  for (const wand of plan.waende || []) {
    const w = wandLage(wand);
    xs.push(w.x, w.x + w.dx * w.laenge);
    ys.push(w.y, w.y + w.dy * w.laenge);
  }
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}

// Lage für eine neue Wand: 50 cm rechts neben der bisher rechtesten Wand, Richtung →
export function lageFuerNeueWand(plan) {
  const waende = plan.waende || [];
  if (waende.length === 0) return { posX: 0, posY: 0, richtung: 0 };
  return { posX: Math.round(umriss({ waende }).maxX + 50), posY: 0, richtung: 0 };
}
