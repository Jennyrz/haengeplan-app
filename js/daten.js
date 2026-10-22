// Datenmodell der Hängeplan-App: neuer Plan, Werke/Gruppen anlegen, Reihenfolge ändern.
// Reine Funktionen ohne Zugriff auf die Oberfläche. Das Format entspricht CLAUDE.md, Abschnitt 7.
// Stufe 1 arbeitet nur mit der ersten Wand und deren erster Seite.

import { STANDARD, berechnePlan } from './calc.js';

export const FORMAT_VERSION = 1;

export const SCREEN_VORLAGE = { breite: 123.8, hoehe: 70.9, gewicht: 17 };

export function neuerPlan() {
  return {
    formatVersion: FORMAT_VERSION,
    ausstellung: {
      name: '',
      mittelhoehe: STANDARD.mittelhoehe,
      mindestabstand: STANDARD.mindestabstand,
      minBodenabstand: STANDARD.minBodenabstand,
    },
    waende: [
      {
        id: 'w1',
        name: 'Wand 1',
        laenge: 400,
        hoehe: 250,
        seiten: [{ id: 'w1-a', bezeichnung: 'innen', bespielbar: true, elemente: [] }],
      },
    ],
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

export function aktuelleWand(plan) {
  return plan.waende[0];
}

export function aktuelleSeite(plan) {
  return plan.waende[0].seiten[0];
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

export function istAufWand(plan, id) {
  return aktuelleSeite(plan).elemente.includes(id);
}

// Nächste freie id mit Präfix, z. B. e1, e2, … oder g1, g2, …
export function naechsteId(plan, praefix) {
  const belegt = new Set([...plan.werke, ...plan.gruppen, ...plan.screens].map((x) => x.id));
  let n = 1;
  while (belegt.has(`${praefix}${n}`)) n++;
  return `${praefix}${n}`;
}

// --- Wand: Platzierung und Reihenfolge -------------------------------------

export function setzeAufWand(plan, id, aufWand) {
  const seite = aktuelleSeite(plan);
  const drauf = seite.elemente.includes(id);
  if (aufWand && !drauf) seite.elemente.push(id);
  if (!aufWand && drauf) seite.elemente = seite.elemente.filter((x) => x !== id);
}

// Verschiebt ein Element in der Reihenfolge um eine Position (-1 = nach links/oben, +1 = nach rechts/unten).
export function verschiebe(plan, id, richtung) {
  const liste = aktuelleSeite(plan).elemente;
  const i = liste.indexOf(id);
  const j = i + richtung;
  if (i < 0 || j < 0 || j >= liste.length) return;
  [liste[i], liste[j]] = [liste[j], liste[i]];
}

// --- Werke -----------------------------------------------------------------

export function werkHinzufuegen(plan) {
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
  setzeAufWand(plan, werk.id, true);
  return werk;
}

export function werkLoeschen(plan, id) {
  plan.werke = plan.werke.filter((w) => w.id !== id);
  setzeAufWand(plan, id, false);
  for (const g of plan.gruppen) {
    g.raster = g.raster.map((zeile) => zeile.map((x) => (x === id ? null : x)));
  }
}

// --- Gruppen ---------------------------------------------------------------

export function gruppeHinzufuegen(plan) {
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
  setzeAufWand(plan, gruppe.id, true);
  return gruppe;
}

// Löscht die Gruppe; ihre Werke bleiben erhalten, sind danach aber nicht platziert.
export function gruppeLoeschen(plan, id) {
  plan.gruppen = plan.gruppen.filter((g) => g.id !== id);
  setzeAufWand(plan, id, false);
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
    setzeAufWand(plan, werkId, false);
  }
  g.raster[zeile][spalte] = werkId || null;
}

// --- Export und Import -----------------------------------------------------

// Export: der Plan plus die berechneten Befestigungspunkte (für ESP32-Gerät und iPhone-App).
export function erstelleExport(plan) {
  const kopie = JSON.parse(JSON.stringify(plan));
  return { ...kopie, befestigungspunkte: berechnePlan(kopie).befestigungspunkte };
}

// Fehler beim Import; code verweist auf einen Text in texte.js.
export class ImportFehler extends Error {
  constructor(code, werte = {}) {
    super(code);
    this.code = code;
    this.werte = werte;
  }
}

// Liest einen JSON-Text ein und liefert einen vollständigen Plan. Wirft ImportFehler, wenn das nicht geht.
export function leseImport(text) {
  let roh;
  try {
    roh = JSON.parse(text);
  } catch {
    throw new ImportFehler('importKeinJson');
  }
  return normalisierePlan(roh);
}

// Prüft einen eingelesenen Plan und ergänzt fehlende Felder mit Standardwerten.
// Unbekannte Felder bleiben erhalten; befestigungspunkte werden verworfen (sie werden neu berechnet).
export function normalisierePlan(roh) {
  if (!roh || typeof roh !== 'object' || Array.isArray(roh)) throw new ImportFehler('importKeinJson');
  if (roh.formatVersion !== FORMAT_VERSION) {
    throw new ImportFehler('importFalscheVersion', { version: String(roh.formatVersion ?? '–') });
  }
  const leer = neuerPlan();
  const { befestigungspunkte, ...plan } = JSON.parse(JSON.stringify(roh));

  const istListe = (x) => Array.isArray(x);
  if (!istListe(plan.waende) || plan.waende.length === 0 || !istListe(plan.werke)) {
    throw new ImportFehler('importUnvollstaendig');
  }
  for (const wand of plan.waende) {
    if (!istListe(wand.seiten) || wand.seiten.length === 0) throw new ImportFehler('importUnvollstaendig');
    for (const seite of wand.seiten) {
      if (!istListe(seite.elemente)) seite.elemente = [];
    }
  }

  plan.ausstellung = { ...leer.ausstellung, ...(plan.ausstellung || {}) };
  plan.werke = plan.werke.map((w) => ({
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
