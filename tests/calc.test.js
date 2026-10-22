// Automatische Tests für js/calc.js. Ausführen mit: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { berechneEinzelwerk, berechnePlan, formatCm, rundeAufHalbe } from '../js/calc.js';

// Vergleich mit kleiner Toleranz, weil Kommazahlen im Computer nicht immer exakt sind.
function nahe(ist, soll, text) {
  assert.ok(Math.abs(ist - soll) < 1e-9, `${text}: erwartet ${soll}, erhalten ${ist}`);
}

function codes(liste) {
  return liste.map((w) => w.code);
}

test('Test 1: Einzelwerk, 1 Nagel', () => {
  const r = berechneEinzelwerk(
    { id: 'e1', breite: 60, hoehe: 80, anzahlNaegel: 1, abstandOben: 10 },
    { mittelhoehe: 150 },
  );
  assert.equal(r.ok, true);
  nahe(r.oberkante, 190, 'Oberkante');
  assert.equal(r.naegel.length, 1);
  nahe(r.naegel[0].hoehe, 180, 'Nagelhöhe');
  nahe(r.naegel[0].xVersatz, 0, 'Nagel in der Werkmitte');
  assert.deepEqual(r.warnungen, []);
});

test('Test 2: Einzelwerk, 2 Nägel', () => {
  const r = berechneEinzelwerk(
    { id: 'e2', breite: 100, hoehe: 70, anzahlNaegel: 2, abstandOben: 8, aufhaengerAbstand: 60 },
    { mittelhoehe: 150 },
  );
  assert.equal(r.ok, true);
  assert.equal(r.naegel.length, 2);
  nahe(r.naegel[0].hoehe, 177, 'Nagel 1 Höhe');
  nahe(r.naegel[1].hoehe, 177, 'Nagel 2 Höhe');
  nahe(r.naegel[0].xVersatz, -30, 'Nagel 1 x');
  nahe(r.naegel[1].xVersatz, 30, 'Nagel 2 x');
  assert.deepEqual(r.warnungen, []);
});

test('Test 6: Rundung nur bei der Anzeige', () => {
  assert.equal(formatCm(171.26), '171,5');
  assert.equal(formatCm(171.24), '171,0');
  assert.equal(rundeAufHalbe(171.26), 171.5);
  // Intern bleibt der genaue Wert erhalten:
  const r = berechneEinzelwerk({ id: 'x', breite: 50, hoehe: 42.52, anzahlNaegel: 1, abstandOben: 0 });
  nahe(r.naegel[0].hoehe, 171.26, 'interner Wert');
  assert.equal(formatCm(r.naegel[0].hoehe), '171,5');
});

test('Test 8: unplausibles a (H 40, a 25) gibt Warnung', () => {
  const r = berechneEinzelwerk({ id: 'x', breite: 30, hoehe: 40, anzahlNaegel: 1, abstandOben: 25 });
  assert.equal(r.ok, true, 'Berechnung läuft trotzdem');
  assert.ok(codes(r.warnungen).includes('aZuGross'));
});

// Zusätzliche Prüfungen aus Abschnitt 6
test('a fehlt oder ist negativ → Warnung', () => {
  const ohneA = berechneEinzelwerk({ id: 'x', breite: 30, hoehe: 40, anzahlNaegel: 1, abstandOben: null });
  assert.ok(codes(ohneA.warnungen).includes('aFehlt'));
  const negativ = berechneEinzelwerk({ id: 'x', breite: 30, hoehe: 40, anzahlNaegel: 1, abstandOben: -2 });
  assert.ok(codes(negativ.warnungen).includes('aNegativ'));
});

test('2 Nägel: d fehlt oder ist grösser als die Werkbreite → Warnung', () => {
  const ohneD = berechneEinzelwerk({ id: 'x', breite: 50, hoehe: 40, anzahlNaegel: 2, abstandOben: 5, aufhaengerAbstand: null });
  assert.ok(codes(ohneD.warnungen).includes('dFehlt'));
  const zuGross = berechneEinzelwerk({ id: 'x', breite: 50, hoehe: 40, anzahlNaegel: 2, abstandOben: 5, aufhaengerAbstand: 60 });
  assert.ok(codes(zuGross.warnungen).includes('dZuGross'));
});

test('fehlende oder nicht-positive Masse → Fehler, keine Berechnung', () => {
  const r = berechneEinzelwerk({ id: 'x', breite: 0, hoehe: null, anzahlNaegel: 1, abstandOben: 5 });
  assert.equal(r.ok, false);
  assert.deepEqual(codes(r.fehler), ['breiteUngueltig', 'hoeheUngueltig']);
  assert.deepEqual(r.naegel, []);
});

// Hilfsfunktion: Plan mit einer Wand und einer Seite
function planMit({ laenge, hoehe = 250, elemente, werke = [], gruppen = [], screens = [], ausstellung = {} }) {
  return {
    formatVersion: 1,
    ausstellung: { name: 'Test', mittelhoehe: 150, mindestabstand: 10, minBodenabstand: 30, ...ausstellung },
    waende: [{ id: 'w1', name: 'Wand 1', laenge, hoehe, seiten: [{ id: 'w1-a', bezeichnung: 'innen', bespielbar: true, elemente }] }],
    werke,
    gruppen,
    screens,
  };
}

const WERK_TEST1 = { id: 'A', breite: 60, hoehe: 80, anzahlNaegel: 1, abstandOben: 10, aufhaengerAbstand: null };
const WERK_TEST2 = { id: 'B', breite: 100, hoehe: 70, anzahlNaegel: 2, abstandOben: 8, aufhaengerAbstand: 60 };

test('Test 3: Verteilung auf der Wand', () => {
  const plan = berechnePlan(planMit({ laenge: 400, elemente: ['A', 'B'], werke: [WERK_TEST1, WERK_TEST2] }));
  const seite = plan.seiten[0];
  nahe(seite.abstand, 80, 'Abstand');
  const [a, b] = seite.elemente;
  nahe(a.x, 80, 'A links');
  nahe(a.x + a.breite, 140, 'A rechts');
  nahe(a.punkte[0].x, 110, 'A Nagel x');
  nahe(a.punkte[0].hoehe, 180, 'A Nagel Höhe');
  nahe(b.x, 220, 'B links');
  nahe(b.x + b.breite, 320, 'B rechts');
  nahe(b.punkte[0].x, 240, 'B Nagel 1 x');
  nahe(b.punkte[1].x, 300, 'B Nagel 2 x');
  nahe(b.punkte[0].hoehe, 177, 'B Nagel Höhe');
  assert.equal(plan.befestigungspunkte.length, 3);
  assert.deepEqual(plan.befestigungspunkte[0], {
    wandId: 'w1', seiteId: 'w1-a', elementId: 'A', werkId: 'A', nr: 1, art: 'nagel', x: 110, hoehe: 180,
  });
  assert.deepEqual(codes(plan.warnungen), []);
});

test('Test 7: passt nicht auf die Wand', () => {
  const w1 = { id: 'A', breite: 60, hoehe: 40, anzahlNaegel: 1, abstandOben: 5 };
  const w2 = { id: 'B', breite: 60, hoehe: 40, anzahlNaegel: 1, abstandOben: 5 };
  const plan = berechnePlan(planMit({ laenge: 100, elemente: ['A', 'B'], werke: [w1, w2] }));
  assert.ok(codes(plan.warnungen).includes('passtNicht'));
  assert.equal(plan.befestigungspunkte.length, 2, 'Berechnung läuft trotzdem');
});

test('Abstand kleiner als Mindestabstand → Warnung', () => {
  const w1 = { id: 'A', breite: 60, hoehe: 40, anzahlNaegel: 1, abstandOben: 5 };
  const w2 = { id: 'B', breite: 60, hoehe: 40, anzahlNaegel: 1, abstandOben: 5 };
  const plan = berechnePlan(planMit({ laenge: 135, elemente: ['A', 'B'], werke: [w1, w2] }));
  assert.ok(codes(plan.warnungen).includes('abstandZuKlein'));
  assert.ok(!codes(plan.warnungen).includes('passtNicht'));
});

test('Oberkante über Wandhöhe und Unterkante zu tief → Warnungen', () => {
  const gross = { id: 'A', breite: 60, hoehe: 260, anzahlNaegel: 1, abstandOben: 10 };
  const plan = berechnePlan(planMit({ laenge: 300, hoehe: 250, elemente: ['A'], werke: [gross] }));
  assert.ok(codes(plan.warnungen).includes('zuHoch'));
  assert.ok(codes(plan.warnungen).includes('zuTief'));
});

test('Element mit Fehler wird nicht verteilt, die anderen schon', () => {
  const kaputt = { id: 'A', breite: 0, hoehe: 40, anzahlNaegel: 1, abstandOben: 5 };
  const plan = berechnePlan(planMit({ laenge: 400, elemente: ['A', 'B'], werke: [kaputt, WERK_TEST2] }));
  assert.ok(codes(plan.fehler).includes('breiteUngueltig'));
  assert.equal(plan.seiten[0].elemente.length, 1);
  nahe(plan.seiten[0].abstand, 150, 'B allein auf 400 cm');
});

test('Test 4: Gruppe 2×2', () => {
  const werke = ['e2', 'e3', 'e4', 'e5'].map((id) => ({ id, breite: 30, hoehe: 40, anzahlNaegel: 1, abstandOben: 5 }));
  const gruppe = { id: 'g1', zeilen: 2, spalten: 2, innenabstand: 5, raster: [['e2', 'e3'], ['e4', 'e5']] };
  const plan = berechnePlan(planMit({ laenge: 200, elemente: ['g1'], werke, gruppen: [gruppe] }));
  const g = plan.seiten[0].elemente[0];
  nahe(g.breite, 65, 'Gruppenbreite');
  nahe(g.hoehe, 85, 'Gruppenhöhe');
  nahe(g.oberkante, 192.5, 'Oberkante Gruppe');
  nahe(g.x, 67.5, 'Gruppe links');
  nahe(g.x + g.breite, 132.5, 'Gruppe rechts');

  const nagel = (werkId) => g.punkte.find((p) => p.werkId === werkId);
  nahe(nagel('e2').hoehe, 187.5, 'obere Zeile Höhe');
  nahe(nagel('e3').hoehe, 187.5, 'obere Zeile Höhe');
  nahe(nagel('e4').hoehe, 142.5, 'untere Zeile Höhe');
  nahe(nagel('e5').hoehe, 142.5, 'untere Zeile Höhe');
  nahe(nagel('e2').x, 82.5, 'linke Spalte x');
  nahe(nagel('e4').x, 82.5, 'linke Spalte x');
  nahe(nagel('e3').x, 117.5, 'rechte Spalte x');
  nahe(nagel('e5').x, 117.5, 'rechte Spalte x');
  assert.equal(plan.befestigungspunkte.length, 4);
  assert.ok(plan.befestigungspunkte.every((p) => p.elementId === 'g1'));
});

test('Gruppe: unterschiedlich grosse Werke werden in der Zelle zentriert', () => {
  const werke = [
    { id: 'a', breite: 40, hoehe: 50, anzahlNaegel: 1, abstandOben: 5 },
    { id: 'b', breite: 20, hoehe: 30, anzahlNaegel: 1, abstandOben: 5 },
  ];
  const gruppe = { id: 'g1', zeilen: 2, spalten: 1, innenabstand: 10, raster: [['a'], ['b']] };
  const plan = berechnePlan(planMit({ laenge: 100, elemente: ['g1'], werke, gruppen: [gruppe] }));
  const g = plan.seiten[0].elemente[0];
  nahe(g.breite, 40, 'Spaltenbreite = breitestes Werk');
  nahe(g.hoehe, 90, '50 + 10 + 30');
  const b = g.teile.find((t) => t.werkId === 'b');
  nahe(b.x, 30 + 10, 'b horizontal zentriert');
  nahe(b.oberkante, 195 - 50 - 10, 'b oben in seiner Zeile (gleich hoch wie Zeile)');
});

test('Gruppe ohne Werke oder mit ungültigem Werk → Fehler', () => {
  const leer = { id: 'g1', zeilen: 1, spalten: 2, innenabstand: 5, raster: [[null, null]] };
  const p1 = berechnePlan(planMit({ laenge: 200, elemente: ['g1'], gruppen: [leer] }));
  assert.ok(codes(p1.fehler).includes('gruppeLeer'));
  const kaputt = { id: 'g2', zeilen: 1, spalten: 1, innenabstand: 5, raster: [['x']] };
  const p2 = berechnePlan(planMit({ laenge: 200, elemente: ['g2'], gruppen: [kaputt], werke: [{ id: 'x', breite: 30, hoehe: 0 }] }));
  assert.ok(codes(p2.fehler).includes('hoeheUngueltig'));
});
