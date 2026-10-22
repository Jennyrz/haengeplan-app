// Datenmodell der Hängeplan-App: neuer Plan, Wände und Seiten, Werke/Gruppen anlegen, Platzierung und Reihenfolge.
// Reine Funktionen ohne Zugriff auf die Oberfläche. Das Format entspricht CLAUDE.md, Abschnitt 7.
// Jedes Element (Werk, Gruppe, Screen) steht auf höchstens einer Wandseite.

import { STANDARD } from './calc.js';

export const FORMAT_VERSION = 1;

export const SCREEN_VORLAGE = { breite: 123.8, hoehe: 70.9, gewicht: 17 };

export const WAND_VORLAGE = { laenge: 400, hoehe: 250 };

function neueSeite(wandId, buchstabe, bezeichnung) {
  return { id: `${wandId}-${buchstabe}`, bezeichnung, bespielbar: true, elemente: [] };
}

function neueWand(id, name) {
  return { id, name, laenge: WAND_VORLAGE.laenge, hoehe: WAND_VORLAGE.hoehe, seiten: [neueSeite(id, 'a', 'innen')] };
}

export function neuerPlan(name = '') {
  return {
    formatVersion: FORMAT_VERSION,
    ausstellung: {
      name,
      mittelhoehe: STANDARD.mittelhoehe,
      mindestabstand: STANDARD.mindestabstand,
      minBodenabstand: STANDARD.minBodenabstand,
    },
    waende: [neueWand('w1', 'Wand 1')],
    werke: [],
    gruppen: [],
    screens: [
      {
        id: 's-quer',
        ausrichtung: 'quer',
        breite: SCREEN_VORLAGE.breite,
        hoehe: SCREEN_VORLAGE.hoehe,
        gewicht: SCREEN_VORLAGE.gewicht,
        halterungOffsetVertikal: 0,
        halterungAbstandHorizontal: 0,
      },
      {
        id: 's-hoch',
        ausrichtung: 'hoch',
        breite: SCREEN_VORLAGE.hoehe,
        hoehe: SCREEN_VORLAGE.breite,
        gewicht: SCREEN_VORLAGE.gewicht,
        halterungOffsetVertikal: 0,
        halterungAbstandHorizontal: 0,
      },
    ],
  };
}

// --- Zugriff ---------------------------------------------------------------

export function findeWand(plan, wandId) {
  return plan.waende.find((w) => w.id === wandId);
}

// Liefert { wand, seite } zu einer Seiten-id (oder undefined).
export function findeSeite(plan, seiteId) {
  for (const wand of plan.waende) {
    const seite = wand.seiten.find((s) => s.id === seiteId);
    if (seite) return { wand, seite };
  }
  return undefined;
}

// Alle Seiten aller Wände in Reihenfolge: [{ wand, seite }, …]
export function alleSeiten(plan) {
  return plan.waende.flatMap((wand) => wand.seiten.map((seite) => ({ wand, seite })));
}

export function findeWerk(plan, id) {
  return plan.werke.find((w) => w.id === id);
}

export function findeGruppe(plan, id) {
  return plan.gruppen.find((g) => g.id === id);
}

export function findeScreen(plan, id) {
  return plan.screens.find((s) => s.id === id);
}

// Gruppe, in deren Raster das Werk steht (oder undefined).
export function gruppeVonWerk(plan, werkId) {
  return plan.gruppen.find((g) => g.raster.some((zeile) => zeile.includes(werkId)));
}

// Wandseite, auf der ein Element steht: { wand, seite } oder undefined
export function platzierungVon(plan, id) {
  return alleSeiten(plan).find(({ seite }) => seite.elemente.includes(id));
}

// Elemente, die auf keiner Seite stehen und auch nicht in einer Gruppe stecken
export function nichtPlatziert(plan) {
  const ids = [
    ...plan.werke.filter((w) => !gruppeVonWerk(plan, w.id)).map((w) => w.id),
    ...plan.gruppen.map((g) => g.id),
    ...plan.screens.map((s) => s.id),
  ];
  return ids.filter((id) => !platzierungVon(plan, id));
}

// Nächste freie id mit Präfix, z. B. e1, e2, … oder g1, g2, …
export function naechsteId(plan, praefix) {
  const belegt = new Set([...plan.werke, ...plan.gruppen, ...plan.screens, ...plan.waende].map((x) => x.id));
  let n = 1;
  while (belegt.has(`${praefix}${n}`)) n++;
  return `${praefix}${n}`;
}

// --- Platzierung und Reihenfolge -------------------------------------------

// Stellt ein Element auf die Seite seiteId (hinten angehängt) oder nimmt es von jeder Wand (seiteId = null).
export function platziere(plan, id, seiteId) {
  const bisher = platzierungVon(plan, id);
  if (bisher && bisher.seite.id === seiteId) return;
  for (const { seite } of alleSeiten(plan)) {
    seite.elemente = seite.elemente.filter((x) => x !== id);
  }
  const ziel = seiteId ? findeSeite(plan, seiteId) : undefined;
  if (ziel) ziel.seite.elemente.push(id);
}

// Verschiebt ein Element auf seiner Seite um eine Position (-1 = weiter links, +1 = weiter rechts).
export function verschiebe(plan, id, richtung) {
  const ort = platzierungVon(plan, id);
  if (!ort) return;
  const liste = ort.seite.elemente;
  const i = liste.indexOf(id);
  const j = i + richtung;
  if (j < 0 || j >= liste.length) return;
  [liste[i], liste[j]] = [liste[j], liste[i]];
}

// --- Wände und Seiten ------------------------------------------------------

export function wandHinzufuegen(plan) {
  const id = naechsteId(plan, 'w');
  const wand = neueWand(id, `Wand ${plan.waende.length + 1}`);
  plan.waende.push(wand);
  return wand;
}

// Löscht eine Wand. Ihre Elemente bleiben erhalten, sind danach aber nicht platziert.
// Die letzte Wand kann nicht gelöscht werden.
export function wandLoeschen(plan, wandId) {
  if (plan.waende.length <= 1) return false;
  plan.waende = plan.waende.filter((w) => w.id !== wandId);
  return true;
}

export function seiteHinzufuegen(plan, wandId) {
  const wand = findeWand(plan, wandId);
  if (!wand) return undefined;
  const belegt = new Set(wand.seiten.map((s) => s.id));
  let n = 0;
  let buchstabe;
  do {
    buchstabe = String.fromCharCode(97 + n++);
  } while (belegt.has(`${wandId}-${buchstabe}`));
  const bezeichnung = wand.seiten.some((s) => s.bezeichnung === 'aussen') ? `Seite ${wand.seiten.length + 1}` : 'aussen';
  const seite = neueSeite(wandId, buchstabe, bezeichnung);
  wand.seiten.push(seite);
  return seite;
}

// Löscht eine Seite. Ihre Elemente sind danach nicht platziert. Die letzte Seite einer Wand bleibt.
export function seiteLoeschen(plan, seiteId) {
  const ort = findeSeite(plan, seiteId);
  if (!ort || ort.wand.seiten.length <= 1) return false;
  ort.wand.seiten = ort.wand.seiten.filter((s) => s.id !== seiteId);
  return true;
}

// --- Werke -----------------------------------------------------------------

// Legt ein Werk an und stellt es (falls angegeben) auf die Seite seiteId.
export function werkHinzufuegen(plan, seiteId = null) {
  const werk = {
    id: naechsteId(plan, 'e'),
    titel: '',
    kuenstler: '',
    breite: null,
    hoehe: null,
    anzahlNaegel: 1,
    abstandOben: null,
    aufhaengerAbstand: null,
    quelleMasse: 'gemessen',
  };
  plan.werke.push(werk);
  platziere(plan, werk.id, seiteId);
  return werk;
}

export function werkLoeschen(plan, id) {
  plan.werke = plan.werke.filter((w) => w.id !== id);
  platziere(plan, id, null);
  for (const g of plan.gruppen) {
    g.raster = g.raster.map((zeile) => zeile.map((x) => (x === id ? null : x)));
  }
}

// --- Gruppen ---------------------------------------------------------------

export function gruppeHinzufuegen(plan, seiteId = null) {
  const gruppe = {
    id: naechsteId(plan, 'g'),
    zeilen: 2,
    spalten: 2,
    innenabstand: STANDARD.innenabstand,
    raster: [
      [null, null],
      [null, null],
    ],
  };
  plan.gruppen.push(gruppe);
  platziere(plan, gruppe.id, seiteId);
  return gruppe;
}

// Löscht die Gruppe; ihre Werke bleiben erhalten, sind danach aber nicht platziert.
export function gruppeLoeschen(plan, id) {
  plan.gruppen = plan.gruppen.filter((g) => g.id !== id);
  platziere(plan, id, null);
}

// Ändert Zeilen/Spalten. Bestehende Zuordnungen bleiben erhalten, soweit sie ins neue Raster passen.
export function setzeRastergroesse(plan, gruppeId, zeilen, spalten) {
  const g = findeGruppe(plan, gruppeId);
  if (!g) return;
  g.raster = Array.from({ length: zeilen }, (_, r) =>
    Array.from({ length: spalten }, (_, c) => g.raster[r]?.[c] ?? null),
  );
  g.zeilen = zeilen;
  g.spalten = spalten;
}

// Setzt ein Werk in eine Rasterzelle. Ein Werk kann nur an einer Stelle hängen:
// es wird aus anderen Zellen entfernt und als Einzelelement von der Wand genommen.
export function setzeRasterZelle(plan, gruppeId, zeile, spalte, werkId) {
  const g = findeGruppe(plan, gruppeId);
  if (!g) return;
  if (werkId) {
    for (const andere of plan.gruppen) {
      andere.raster = andere.raster.map((z) => z.map((x) => (x === werkId ? null : x)));
    }
    platziere(plan, werkId, null);
  }
  g.raster[zeile][spalte] = werkId || null;
}

// --- Plan kopieren und prüfen ----------------------------------------------

export function kopiere(plan) {
  return JSON.parse(JSON.stringify(plan));
}

// Prüft einen gespeicherten Plan und ergänzt fehlende Felder mit Standardwerten.
// Unbekannte Felder bleiben erhalten. Wirft einen Fehler, wenn der Plan unbrauchbar ist.
export function normalisierePlan(roh) {
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) throw new Error('planUngueltig');
  if (roh.formatVersion !== FORMAT_VERSION) throw new Error('planUngueltig');
  const leer = neuerPlan();
  const { befestigungspunkte, ...plan } = kopiere(roh);

  const istListe = (x) => Array.isArray(x);
  plan.waende = istListe(plan.waende) && plan.waende.length ? plan.waende : leer.waende;
  for (const wand of plan.waende) {
    if (!istListe(wand.seiten) || wand.seiten.length === 0) wand.seiten = [neueSeite(wand.id, 'a', 'innen')];
    for (const seite of wand.seiten) {
      if (!istListe(seite.elemente)) seite.elemente = [];
      if (seite.bespielbar === undefined) seite.bespielbar = true;
    }
  }

  plan.ausstellung = { ...leer.ausstellung, ...(plan.ausstellung || {}) };
  plan.werke = (istListe(plan.werke) ? plan.werke : []).map((w) => ({
    titel: '',
    kuenstler: '',
    anzahlNaegel: 1,
    abstandOben: null,
    aufhaengerAbstand: null,
    quelleMasse: 'gemessen',
    ...w,
  }));
  plan.gruppen = (istListe(plan.gruppen) ? plan.gruppen : []).map((g) => {
    const zeilen = Number.isInteger(g.zeilen) && g.zeilen > 0 ? g.zeilen : 1;
    const spalten = Number.isInteger(g.spalten) && g.spalten > 0 ? g.spalten : 1;
    const raster = Array.from({ length: zeilen }, (_, r) =>
      Array.from({ length: spalten }, (_, c) => g.raster?.[r]?.[c] ?? null),
    );
    return { innenabstand: STANDARD.innenabstand, ...g, zeilen, spalten, raster };
  });

  // Die beiden ARTBOXY-Screens sind immer vorhanden.
  plan.screens = istListe(plan.screens) ? plan.screens : [];
  for (const vorlage of leer.screens) {
    if (!plan.screens.some((s) => s.id === vorlage.id)) plan.screens.push(vorlage);
  }

  return plan;
}
