// Automatische Tests für js/calc.js. Ausführen mit: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { berechneEinzelwerk, formatCm, rundeAufHalbe } from '../js/calc.js';

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
