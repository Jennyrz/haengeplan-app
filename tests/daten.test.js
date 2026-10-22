// Automatische Tests für js/daten.js (Datenmodell, Wände und Seiten). Ausführen mit: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../js/daten.js';
import { berechnePlan } from '../js/calc.js';

function beispielPlan() {
  const plan = D.neuerPlan('Messe Basel');
  const a = D.werkHinzufuegen(plan, 'w1-a');
  Object.assign(a, { titel: 'Abendlicht', breite: 60, hoehe: 80, abstandOben: 10 });
  const b = D.werkHinzufuegen(plan, 'w1-a');
  Object.assign(b, { titel: 'Fluss', breite: 100, hoehe: 70, anzahlNaegel: 2, abstandOben: 8, aufhaengerAbstand: 60 });
  const g = D.gruppeHinzufuegen(plan, 'w1-a');
  for (const [r, c] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
    const w = D.werkHinzufuegen(plan, 'w1-a');
    Object.assign(w, { breite: 30, hoehe: 40, abstandOben: 5 });
    D.setzeRasterZelle(plan, g.id, r, c, w.id);
  }
  D.platziere(plan, 's-quer', 'w1-a');
  return plan;
}

test('Werke in einer Gruppe hängen nicht zusätzlich einzeln an der Wand', () => {
  const plan = beispielPlan();
  assert.deepEqual(plan.waende[0].seiten[0].elemente, ['e1', 'e2', 'g1', 's-quer']);
  assert.equal(D.gruppeVonWerk(plan, 'e3').id, 'g1');
});

test('Reihenfolge verschieben', () => {
  const plan = beispielPlan();
  D.verschiebe(plan, 's-quer', -1);
  assert.deepEqual(plan.waende[0].seiten[0].elemente, ['e1', 'e2', 's-quer', 'g1']);
  D.verschiebe(plan, 'e1', -1); // ganz links: bleibt
  assert.equal(plan.waende[0].seiten[0].elemente[0], 'e1');
});

test('Werk löschen entfernt es von der Wand und aus Gruppen', () => {
  const plan = beispielPlan();
  D.werkLoeschen(plan, 'e3');
  assert.equal(D.findeWerk(plan, 'e3'), undefined);
  assert.equal(D.findeGruppe(plan, 'g1').raster[0][0], null);
});

test('Rastergrösse ändern behält bestehende Zuordnungen', () => {
  const plan = beispielPlan();
  D.setzeRastergroesse(plan, 'g1', 1, 3);
  assert.deepEqual(D.findeGruppe(plan, 'g1').raster, [['e3', 'e4', null]]);
});

test('Neue Wand mit zweiter Seite; Elemente wandern zwischen Seiten', () => {
  const plan = beispielPlan();
  const w2 = D.wandHinzufuegen(plan);
  assert.equal(w2.id, 'w2');
  assert.equal(w2.name, 'Wand 2');
  const aussen = D.seiteHinzufuegen(plan, 'w2');
  assert.equal(aussen.id, 'w2-b');
  assert.equal(aussen.bezeichnung, 'aussen');

  D.platziere(plan, 'e2', 'w2-b');
  assert.equal(D.platzierungVon(plan, 'e2').seite.id, 'w2-b');
  assert.ok(!plan.waende[0].seiten[0].elemente.includes('e2'), 'nur an einer Stelle');

  const ergebnis = berechnePlan(plan);
  assert.deepEqual(ergebnis.seiten.map((s) => s.seiteId), ['w1-a', 'w2-a', 'w2-b']);
  const punkteW2 = ergebnis.befestigungspunkte.filter((p) => p.seiteId === 'w2-b');
  assert.equal(punkteW2.length, 2);
  assert.equal(punkteW2[0].wandId, 'w2');
});

test('Wand oder Seite löschen: Elemente sind danach nicht platziert, letzte Wand/Seite bleibt', () => {
  const plan = beispielPlan();
  D.wandHinzufuegen(plan);
  D.platziere(plan, 'e1', 'w2-a');
  assert.equal(D.wandLoeschen(plan, 'w2'), true);
  assert.equal(D.platzierungVon(plan, 'e1'), undefined);
  assert.ok(D.nichtPlatziert(plan).includes('e1'));
  assert.equal(D.wandLoeschen(plan, 'w1'), false, 'letzte Wand bleibt');
  assert.equal(D.seiteLoeschen(plan, 'w1-a'), false, 'letzte Seite bleibt');
});

test('Nicht platzierte Elemente', () => {
  const plan = beispielPlan();
  assert.deepEqual(D.nichtPlatziert(plan), ['s-hoch']);
});

test('Gespeicherter Plan wird geprüft und ergänzt', () => {
  const roh = {
    formatVersion: 1,
    ausstellung: { name: 'Beispiel' },
    waende: [{ id: 'w1', name: 'Wand 1', laenge: 400, hoehe: 250, seiten: [{ id: 'w1-a', bezeichnung: 'innen', elemente: ['e1'] }] }],
    werke: [{ id: 'e1', breite: 60, hoehe: 80, abstandOben: 10 }],
    befestigungspunkte: [{ alt: true }],
  };
  const plan = D.normalisierePlan(roh);
  assert.equal(plan.befestigungspunkte, undefined);
  assert.equal(plan.ausstellung.mittelhoehe, 150);
  assert.equal(plan.waende[0].seiten[0].bespielbar, true);
  assert.deepEqual(plan.screens.map((s) => s.id), ['s-quer', 's-hoch']);
  assert.equal(berechnePlan(plan).befestigungspunkte[0].hoehe, 180);
  assert.throws(() => D.normalisierePlan({ formatVersion: 2 }));
});
