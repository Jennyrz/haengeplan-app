// Automatische Tests für js/daten.js (Datenmodell, Export und Import). Ausführen mit: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../js/daten.js';

function beispielPlan() {
  const plan = D.neuerPlan();
  plan.ausstellung.name = 'Messe Basel';
  const a = D.werkHinzufuegen(plan);
  Object.assign(a, { titel: 'Abendlicht', kuenstler: 'A. Muster', breite: 60, hoehe: 80, abstandOben: 10 });
  const b = D.werkHinzufuegen(plan);
  Object.assign(b, { titel: 'Fluss', breite: 100, hoehe: 70, anzahlNaegel: 2, abstandOben: 8, aufhaengerAbstand: 60, quelleMasse: 'kuenstler' });
  const g = D.gruppeHinzufuegen(plan);
  for (const [r, c] of [[0, 0], [0, 1], [1, 0], [1, 1]]) {
    const w = D.werkHinzufuegen(plan);
    Object.assign(w, { breite: 30, hoehe: 40, abstandOben: 5 });
    D.setzeRasterZelle(plan, g.id, r, c, w.id);
  }
  D.setzeAufWand(plan, 's-quer', true);
  Object.assign(D.findeScreen(plan, 's-quer'), { halterungOffsetVertikal: 10, halterungAbstandHorizontal: 40 });
  return plan;
}

test('Werke in einer Gruppe hängen nicht zusätzlich einzeln an der Wand', () => {
  const plan = beispielPlan();
  assert.deepEqual(D.aktuelleSeite(plan).elemente, ['e1', 'e2', 'g1', 's-quer']);
  assert.equal(D.gruppeVonWerk(plan, 'e3').id, 'g1');
});

test('Reihenfolge verschieben', () => {
  const plan = beispielPlan();
  D.verschiebe(plan, 's-quer', -1);
  assert.deepEqual(D.aktuelleSeite(plan).elemente, ['e1', 'e2', 's-quer', 'g1']);
  D.verschiebe(plan, 'e1', -1); // ganz links: bleibt
  assert.equal(D.aktuelleSeite(plan).elemente[0], 'e1');
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

test('Schritt 8: Export → Import ergibt denselben Plan', () => {
  const plan = beispielPlan();
  const exportiert = D.erstelleExport(plan);
  assert.equal(exportiert.formatVersion, 1);
  assert.equal(exportiert.befestigungspunkte.length, 1 + 2 + 4 + 2);
  assert.deepEqual(exportiert.befestigungspunkte[0], {
    wandId: 'w1', seiteId: 'w1-a', elementId: 'e1', werkId: 'e1', nr: 1, art: 'nagel', x: exportiert.befestigungspunkte[0].x, hoehe: 180,
  });

  const text = JSON.stringify(exportiert, null, 2);
  const importiert = D.leseImport(text);
  assert.deepEqual(importiert, plan);
  assert.deepEqual(D.erstelleExport(importiert), exportiert);
});

test('Import: Beispiel aus CLAUDE.md wird gelesen', () => {
  const beispiel = {
    formatVersion: 1,
    ausstellung: { name: 'Beispiel', mittelhoehe: 150, mindestabstand: 10, minBodenabstand: 30 },
    waende: [{ id: 'w1', name: 'Wand 1', laenge: 400, hoehe: 250, seiten: [{ id: 'w1-a', bezeichnung: 'innen', bespielbar: true, elemente: ['e1'] }] }],
    werke: [{ id: 'e1', titel: '', kuenstler: '', breite: 60, hoehe: 80, anzahlNaegel: 1, abstandOben: 10, aufhaengerAbstand: null, quelleMasse: 'gemessen' }],
    gruppen: [],
    screens: [],
    befestigungspunkte: [{ alt: true }],
  };
  const plan = D.leseImport(JSON.stringify(beispiel));
  assert.equal(plan.befestigungspunkte, undefined, 'alte Punkte werden verworfen');
  assert.deepEqual(plan.screens.map((s) => s.id), ['s-quer', 's-hoch'], 'Screens werden ergänzt');
  assert.equal(D.erstelleExport(plan).befestigungspunkte[0].hoehe, 180);
});

test('Import: ungültige Dateien werden abgelehnt', () => {
  assert.throws(() => D.leseImport('kein json'), { code: 'importKeinJson' });
  assert.throws(() => D.leseImport('{"formatVersion": 2}'), { code: 'importFalscheVersion' });
  assert.throws(() => D.leseImport('{"formatVersion": 1, "werke": []}'), { code: 'importUnvollstaendig' });
});
