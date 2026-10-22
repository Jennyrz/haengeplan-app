// Automatische Tests für js/raum.js (Lage der Wände im Stand). Ausführen mit: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { punktAufSeite, umriss, lageFuerNeueWand, WANDDICKE } from '../js/raum.js';
import * as D from '../js/daten.js';

const nah = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);
const halb = WANDDICKE / 2;

// Stand Paris (A0), 360 × 1000 cm: Rückwand oben, lange Wand rechts
const rueckwand = { laenge: 360, posX: 0, posY: 0, richtung: 0 };
const rechts = { laenge: 1000, posX: 360, posY: 0, richtung: 90 };

test('Rückwand (→): erste Seite zeigt nach vorne in den Stand', () => {
  const p = punktAufSeite(rueckwand, 0, 100);
  nah(p.x, 100);
  nah(p.y, halb);
  nah(p.nx, 0);
  nah(p.ny, 1);
});

test('Rechte Wand (↓): erste Seite zeigt nach links in den Stand, x läuft von hinten nach vorne', () => {
  const p = punktAufSeite(rechts, 0, 300);
  nah(p.x, 360 - halb);
  nah(p.y, 300);
  nah(p.nx, -1);
  nah(p.ny, 0);
});

test('Zweite Seite: gegenüber, x läuft in Gegenrichtung', () => {
  const p = punktAufSeite(rueckwand, 1, 100); // von hinten gesehen 100 cm ab links = 260 cm ab Startpunkt
  nah(p.x, 260);
  nah(p.y, -halb);
  nah(p.ny, -1);
});

test('Umriss umfasst Stand und Wände', () => {
  const plan = { ausstellung: { standBreite: 360, standTiefe: 1000 }, waende: [rueckwand, rechts] };
  assert.deepEqual(umriss(plan), { minX: 0, minY: 0, maxX: 360, maxY: 1000 });
});

test('Neue Wand kommt 50 cm rechts neben die bisherigen', () => {
  assert.deepEqual(lageFuerNeueWand({ waende: [rueckwand] }), { posX: 410, posY: 0, richtung: 0 });
  const plan = D.neuerPlan();
  const w2 = D.wandHinzufuegen(plan);
  assert.equal(w2.posX, 450);
});

test('Alte Pläne ohne Lage bekommen beim Laden eine Lage nebeneinander', () => {
  const alt = D.neuerPlan();
  delete alt.waende[0].posX;
  delete alt.waende[0].posY;
  delete alt.waende[0].richtung;
  alt.waende.push({ id: 'w2', name: 'Wand 2', laenge: 300, hoehe: 250, seiten: [] });
  const plan = D.normalisierePlan(alt);
  assert.deepEqual([plan.waende[0].posX, plan.waende[0].posY, plan.waende[0].richtung], [0, 0, 0]);
  assert.deepEqual([plan.waende[1].posX, plan.waende[1].posY], [450, 0]);
});
