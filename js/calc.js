// Berechnungslogik der Hängeplan-App.
// Nur reine Funktionen: kein Zugriff auf die Oberfläche (DOM) oder den Speicher.
// Alle Masse in Zentimetern. Gerundet wird nur bei der Anzeige.
// Warnungen und Fehler werden als Codes zurückgegeben; die Texte dazu stehen in texte.js.

export const STANDARD = {
  mittelhoehe: 150,
  mindestabstand: 10,
  minBodenabstand: 30,
  innenabstand: 5,
};

// --- Anzeige ---------------------------------------------------------------

// Rundet auf 0,5 cm. Nur für die Anzeige verwenden.
export function rundeAufHalbe(wert) {
  return Math.round(wert * 2) / 2;
}

// Formatiert einen Wert für die Anzeige: auf 0,5 cm gerundet, mit Komma, immer eine Nachkommastelle.
export function formatCm(wert) {
  if (wert == null || !Number.isFinite(wert)) return '–';
  return rundeAufHalbe(wert).toFixed(1).replace('.', ',');
}

// --- Hilfsfunktionen -------------------------------------------------------

function istPositiv(wert) {
  return typeof wert === 'number' && Number.isFinite(wert) && wert > 0;
}

function istZahl(wert) {
  return typeof wert === 'number' && Number.isFinite(wert);
}

// --- Einzelwerk ------------------------------------------------------------

// Prüft ein Werk und liefert { fehler: [...], warnungen: [...] }.
export function pruefeWerk(werk) {
  const fehler = [];
  const warnungen = [];

  if (!istPositiv(werk.breite)) fehler.push({ code: 'breiteUngueltig' });
  if (!istPositiv(werk.hoehe)) fehler.push({ code: 'hoeheUngueltig' });

  const a = werk.abstandOben;
  if (!istZahl(a)) {
    warnungen.push({ code: 'aFehlt' });
  } else if (a < 0) {
    warnungen.push({ code: 'aNegativ' });
  } else if (istPositiv(werk.hoehe) && a > werk.hoehe / 2) {
    warnungen.push({ code: 'aZuGross' });
  }

  if (werk.anzahlNaegel === 2) {
    const d = werk.aufhaengerAbstand;
    if (!istPositiv(d)) {
      warnungen.push({ code: 'dFehlt' });
    } else if (istPositiv(werk.breite) && d > werk.breite) {
      warnungen.push({ code: 'dZuGross' });
    }
  }

  return { fehler, warnungen };
}

// Berechnet ein Einzelwerk, dessen Mitte auf der Höhe `mitteY` liegt (Standard: Mittelhöhe M).
// x-Werte der Nägel sind relativ zur horizontalen Werkmitte (xVersatz); die Lage auf der Wand
// kommt erst bei der Verteilung dazu.
// Fehlt a oder ist es negativ, wird mit a = 0 gerechnet (Nagel an der Oberkante) – es gibt dann eine Warnung.
export function berechneEinzelwerk(werk, { mittelhoehe = STANDARD.mittelhoehe, mitteY = mittelhoehe } = {}) {
  const { fehler, warnungen } = pruefeWerk(werk);
  if (fehler.length > 0) {
    return { id: werk.id, ok: false, fehler, warnungen, naegel: [] };
  }

  const oberkante = mitteY + werk.hoehe / 2;
  const unterkante = mitteY - werk.hoehe / 2;
  const a = istZahl(werk.abstandOben) && werk.abstandOben >= 0 ? werk.abstandOben : 0;
  const nagelHoehe = oberkante - a;

  let naegel;
  if (werk.anzahlNaegel === 2) {
    const d = istPositiv(werk.aufhaengerAbstand) ? werk.aufhaengerAbstand : 0;
    naegel = [
      { nr: 1, art: 'nagel', xVersatz: -d / 2, hoehe: nagelHoehe },
      { nr: 2, art: 'nagel', xVersatz: d / 2, hoehe: nagelHoehe },
    ];
  } else {
    naegel = [{ nr: 1, art: 'nagel', xVersatz: 0, hoehe: nagelHoehe }];
  }

  return {
    id: werk.id,
    ok: true,
    fehler,
    warnungen,
    breite: werk.breite,
    hoehe: werk.hoehe,
    oberkante,
    unterkante,
    naegel,
  };
}

// --- Elemente (Einzelwerk, Gruppe, Screen) ---------------------------------
// Jedes Element liefert sein Gesamtrechteck (breite, hoehe, oberkante, unterkante),
// seine sichtbaren Teile (teile) und seine Befestigungspunkte (punkte).
// x-Werte sind hier noch relativ zur linken Kante des Elements (xRel).

function finde(liste, id) {
  return (liste || []).find((x) => x.id === id);
}

function mitKontext(liste, kontext) {
  return liste.map((w) => ({ ...kontext, ...w }));
}

function elementAusWerk(werk, mittelhoehe) {
  const r = berechneEinzelwerk(werk, { mittelhoehe });
  const kontext = { elementId: werk.id, werkId: werk.id };
  const basis = {
    elementId: werk.id,
    typ: 'werk',
    ok: r.ok,
    fehler: mitKontext(r.fehler, kontext),
    warnungen: mitKontext(r.warnungen, kontext),
    teile: [],
    punkte: [],
  };
  if (!r.ok) return basis;
  return {
    ...basis,
    breite: r.breite,
    hoehe: r.hoehe,
    oberkante: r.oberkante,
    unterkante: r.unterkante,
    teile: [{ werkId: werk.id, typ: 'werk', xRel: 0, breite: r.breite, hoehe: r.hoehe, oberkante: r.oberkante }],
    punkte: r.naegel.map((n) => ({
      werkId: werk.id,
      nr: n.nr,
      art: n.art,
      xRel: r.breite / 2 + n.xVersatz,
      hoehe: n.hoehe,
    })),
  };
}

// Gruppe als Raster: Spaltenbreite = breitestes Werk der Spalte, Zeilenhöhe = höchstes Werk der Zeile.
// Die Gruppe wird als Gesamtrechteck mit Mitte auf M behandelt, jedes Werk in seiner Zelle zentriert.
function elementAusGruppe(gruppe, daten, mittelhoehe) {
  const basis = { elementId: gruppe.id, typ: 'gruppe', ok: false, fehler: [], warnungen: [], teile: [], punkte: [] };
  const { zeilen, spalten } = gruppe;
  if (!(Number.isInteger(zeilen) && zeilen > 0 && Number.isInteger(spalten) && spalten > 0)) {
    basis.fehler.push({ code: 'rasterUngueltig', elementId: gruppe.id });
    return basis;
  }
  const g = istZahl(gruppe.innenabstand) && gruppe.innenabstand >= 0 ? gruppe.innenabstand : STANDARD.innenabstand;

  const zellen = [];
  let verborgene = 0;
  for (let r = 0; r < zeilen; r++) {
    for (let c = 0; c < spalten; c++) {
      const werkId = gruppe.raster?.[r]?.[c];
      if (!werkId) continue;
      const werk = finde(daten.werke, werkId);
      if (!werk) {
        basis.fehler.push({ code: 'werkUnbekannt', elementId: gruppe.id, werkId });
        continue;
      }
      if (werk.verborgen) {
        verborgene++;
        continue; // Zelle bleibt leer, das Werk behält aber seinen Platz im Raster
      }
      const pruefung = pruefeWerk(werk);
      basis.fehler.push(...mitKontext(pruefung.fehler, { elementId: gruppe.id, werkId }));
      zellen.push({ r, c, werk });
    }
  }
  // Alle Werke der Gruppe verborgen: Gruppe hängt nicht, ist aber kein Fehler
  if (zellen.length === 0 && verborgene > 0 && basis.fehler.length === 0) return { ...basis, verborgen: true };
  if (zellen.length === 0 && basis.fehler.length === 0) {
    basis.fehler.push({ code: 'gruppeLeer', elementId: gruppe.id });
  }
  if (basis.fehler.length > 0) return basis;

  const spaltenBreite = new Array(spalten).fill(0);
  const zeilenHoehe = new Array(zeilen).fill(0);
  for (const { r, c, werk } of zellen) {
    spaltenBreite[c] = Math.max(spaltenBreite[c], werk.breite);
    zeilenHoehe[r] = Math.max(zeilenHoehe[r], werk.hoehe);
  }
  const summe = (liste) => liste.reduce((s, x) => s + x, 0);
  const breite = summe(spaltenBreite) + (spalten - 1) * g;
  const hoehe = summe(zeilenHoehe) + (zeilen - 1) * g;
  const oberkante = mittelhoehe + hoehe / 2;

  // Linke Kante jeder Spalte (ab linker Gruppenkante) und Abstand jeder Zeile von der Gruppen-Oberkante
  const spaltenLinks = spaltenBreite.map((_, c) => summe(spaltenBreite.slice(0, c)) + c * g);
  const zeilenOben = zeilenHoehe.map((_, r) => summe(zeilenHoehe.slice(0, r)) + r * g);

  for (const { r, c, werk } of zellen) {
    const mitteY = oberkante - zeilenOben[r] - zeilenHoehe[r] / 2;
    const mitteX = spaltenLinks[c] + spaltenBreite[c] / 2;
    const w = berechneEinzelwerk(werk, { mittelhoehe, mitteY });
    basis.warnungen.push(...mitKontext(w.warnungen, { elementId: gruppe.id, werkId: werk.id }));
    basis.teile.push({
      werkId: werk.id,
      typ: 'werk',
      xRel: mitteX - werk.breite / 2,
      breite: werk.breite,
      hoehe: werk.hoehe,
      oberkante: w.oberkante,
    });
    for (const n of w.naegel) {
      basis.punkte.push({ werkId: werk.id, nr: n.nr, art: n.art, xRel: mitteX + n.xVersatz, hoehe: n.hoehe });
    }
  }

  return { ...basis, ok: true, breite, hoehe, oberkante, unterkante: oberkante - hoehe };
}

// ARTBOXY-Screen: Mitte auf M, statt Nägeln zwei Schraubpunkte der Wandhalterung.
// v = vertikaler Abstand der Schraubpunkte zur Screenmitte (positiv = oberhalb),
// s = horizontaler Abstand zwischen den beiden Schraubpunkten.
function elementAusScreen(screen, mittelhoehe) {
  const kontext = { elementId: screen.id, werkId: screen.id };
  const basis = { elementId: screen.id, typ: 'screen', ok: false, fehler: [], warnungen: [], teile: [], punkte: [] };
  if (!istPositiv(screen.breite)) basis.fehler.push({ ...kontext, code: 'breiteUngueltig' });
  if (!istPositiv(screen.hoehe)) basis.fehler.push({ ...kontext, code: 'hoeheUngueltig' });
  if (basis.fehler.length > 0) return basis;

  const v = istZahl(screen.halterungOffsetVertikal) ? screen.halterungOffsetVertikal : 0;
  const s = istPositiv(screen.halterungAbstandHorizontal) ? screen.halterungAbstandHorizontal : 0;
  if (s === 0) basis.warnungen.push({ ...kontext, code: 'halterungFehlt' });

  const oberkante = mittelhoehe + screen.hoehe / 2;
  const schraubHoehe = mittelhoehe + v;
  const mitte = screen.breite / 2;
  return {
    ...basis,
    ok: true,
    breite: screen.breite,
    hoehe: screen.hoehe,
    oberkante,
    unterkante: oberkante - screen.hoehe,
    teile: [{ werkId: screen.id, typ: 'screen', xRel: 0, breite: screen.breite, hoehe: screen.hoehe, oberkante }],
    punkte: [
      { werkId: screen.id, nr: 1, art: 'schraube', xRel: mitte - s / 2, hoehe: schraubHoehe },
      { werkId: screen.id, nr: 2, art: 'schraube', xRel: mitte + s / 2, hoehe: schraubHoehe },
    ],
  };
}

// Pult (Möbel am Boden, vor der Wand): keine Befestigungspunkte.
// Es belegt seine Länge plus freiraum links und rechts; in diesem Bereich hängt kein Werk.
function elementAusPult(pult) {
  const kontext = { elementId: pult.id, werkId: pult.id };
  const basis = { elementId: pult.id, typ: 'pult', ok: false, fehler: [], warnungen: [], teile: [], punkte: [], stehtAmBoden: true };
  if (!istPositiv(pult.breite)) basis.fehler.push({ ...kontext, code: 'breiteUngueltig' });
  if (!istPositiv(pult.hoehe)) basis.fehler.push({ ...kontext, code: 'hoeheUngueltig' });
  if (basis.fehler.length > 0) return basis;
  const frei = istZahl(pult.freiraum) && pult.freiraum > 0 ? pult.freiraum : 0;
  const tiefe = istPositiv(pult.tiefe) ? pult.tiefe : 60;
  return {
    ...basis,
    ok: true,
    breite: pult.breite + 2 * frei,
    hoehe: pult.hoehe,
    oberkante: pult.hoehe,
    unterkante: 0,
    freiraum: frei,
    teile: [{ werkId: pult.id, typ: 'pult', xRel: frei, breite: pult.breite, hoehe: pult.hoehe, oberkante: pult.hoehe, tiefe }],
  };
}

// Berechnet ein Element anhand seiner id (Werk, Gruppe, Screen oder Pult).
export function berechneElement(id, daten, mittelhoehe = STANDARD.mittelhoehe) {
  const werk = finde(daten.werke, id);
  // Verborgenes Werk: wird nicht gehängt, behält aber seinen Platz in der Reihenfolge
  if (werk?.verborgen) return { elementId: id, typ: 'werk', ok: false, verborgen: true, fehler: [], warnungen: [], teile: [], punkte: [] };
  if (werk) return elementAusWerk(werk, mittelhoehe);
  const gruppe = finde(daten.gruppen, id);
  if (gruppe) return elementAusGruppe(gruppe, daten, mittelhoehe);
  const screen = finde(daten.screens, id);
  if (screen) return elementAusScreen(screen, mittelhoehe);
  const pult = finde(daten.pulte, id);
  if (pult) return elementAusPult(pult);
  return {
    elementId: id,
    typ: 'unbekannt',
    ok: false,
    fehler: [{ code: 'elementUnbekannt', elementId: id }],
    warnungen: [],
    teile: [],
    punkte: [],
  };
}

// --- Verteilung auf der Wand -----------------------------------------------

// Gleichmässige Verteilung: gleiche Abstände zwischen den Elementen und zu beiden Wandenden.
// Liefert den Abstand und die linke Kante jedes Elements (ab linker Wandkante).
export function verteile(breiten, laenge) {
  const summe = breiten.reduce((s, b) => s + b, 0);
  const abstand = (laenge - summe) / (breiten.length + 1);
  const positionen = [];
  let x = abstand;
  for (const b of breiten) {
    positionen.push(x);
    x += b + abstand;
  }
  return { abstand, positionen };
}

// Einstellungen der Ausstellung, fehlende Werte mit Standardwerten ergänzt.
export function einstellungen(daten) {
  const a = daten.ausstellung || {};
  return {
    mittelhoehe: istZahl(a.mittelhoehe) ? a.mittelhoehe : STANDARD.mittelhoehe,
    mindestabstand: istZahl(a.mindestabstand) ? a.mindestabstand : STANDARD.mindestabstand,
    minBodenabstand: istZahl(a.minBodenabstand) ? a.minBodenabstand : STANDARD.minBodenabstand,
  };
}

// Berechnet eine Wandseite: Elemente in der gespeicherten Reihenfolge, gleichmässig verteilt.
// Alle x-Werte im Ergebnis gelten ab der linken Wandkante (so wie man vor der Wand steht).
export function berechneSeite(daten, wand, seite) {
  const e = einstellungen(daten);
  const ort = { wandId: wand.id, seiteId: seite.id };
  const elemente = (seite.elemente || []).map((id) => berechneElement(id, daten, e.mittelhoehe));
  const fehler = elemente.flatMap((el) => mitKontext(el.fehler, ort));
  const warnungen = [];

  const ergebnis = {
    ...ort,
    laenge: wand.laenge,
    hoehe: wand.hoehe,
    abstand: null,
    elemente: [],
    befestigungspunkte: [],
    warnungen,
    fehler,
  };

  if (!istPositiv(wand.laenge)) {
    fehler.push({ ...ort, code: 'wandLaengeUngueltig' });
    return ergebnis;
  }

  const platziert = elemente.filter((el) => el.ok);
  if (platziert.length === 0) return ergebnis;

  const { abstand, positionen } = verteile(platziert.map((el) => el.breite), wand.laenge);
  ergebnis.abstand = abstand;

  // Der freie Bereich eines Pults zählt als Abstand zu seinen Nachbarn bzw. zur Wandkante.
  const frei = (el) => (el && el.freiraum) || 0;
  const kleinsterAbstand = Math.min(
    ...Array.from({ length: platziert.length + 1 }, (_, i) => abstand + frei(platziert[i - 1]) + frei(platziert[i])),
  );
  if (abstand < 0) {
    warnungen.push({ ...ort, code: 'passtNicht', werte: { abstand } });
  } else if (kleinsterAbstand < e.mindestabstand) {
    warnungen.push({ ...ort, code: 'abstandZuKlein', werte: { abstand: kleinsterAbstand, mindestabstand: e.mindestabstand } });
  }

  platziert.forEach((el, i) => {
    const xLinks = positionen[i];
    const kontext = { ...ort, elementId: el.elementId };
    warnungen.push(...mitKontext(el.warnungen, ort));
    if (istPositiv(wand.hoehe) && el.oberkante > wand.hoehe) {
      warnungen.push({ ...kontext, code: 'zuHoch', werte: { oberkante: el.oberkante, wandhoehe: wand.hoehe } });
    }
    if (!el.stehtAmBoden && el.unterkante < e.minBodenabstand) {
      warnungen.push({ ...kontext, code: 'zuTief', werte: { unterkante: el.unterkante, minBodenabstand: e.minBodenabstand } });
    }
    const punkte = el.punkte.map((p) => ({ ...p, x: xLinks + p.xRel }));
    ergebnis.elemente.push({
      ...el,
      x: xLinks,
      teile: el.teile.map((t) => ({ ...t, x: xLinks + t.xRel })),
      punkte,
    });
    for (const p of punkte) {
      ergebnis.befestigungspunkte.push({
        ...ort,
        elementId: el.elementId,
        werkId: p.werkId,
        nr: p.nr,
        art: p.art,
        x: p.x,
        hoehe: p.hoehe,
      });
    }
  });

  return ergebnis;
}

// Hängeanleitung mit kurzen Massen für eine berechnete Wandseite.
// Jeder Nagel wird ab einer sichtbaren Kante gemessen: beim ersten Element ab der linken Wandkante,
// sonst ab der rechten Kante des vorherigen Elements (bei Gruppen: äusserstes Bild, beim Pult: das Pult selbst).
// Liefert { schritte: [{ elementId, typ, vorherId, naegel: [{ werkId, nr, art, ab, hoehe }], pultAb }], rest } oder null.
export function haengeSchritte(seite) {
  if (!seite || !seite.elemente || seite.elemente.length === 0) return null;
  const rechteKante = (el) => Math.max(...el.teile.map((t) => t.x + t.breite));
  const schritte = seite.elemente.map((el, i) => {
    const vorher = i === 0 ? null : seite.elemente[i - 1];
    const bezug = vorher ? rechteKante(vorher) : 0;
    return {
      elementId: el.elementId,
      typ: el.typ,
      vorherId: vorher ? vorher.elementId : null,
      naegel: el.punkte.map((p) => ({ werkId: p.werkId, nr: p.nr, art: p.art, ab: p.x - bezug, hoehe: p.hoehe })),
      pultAb: el.typ === 'pult' ? el.teile[0].x - bezug : null,
    };
  });
  const letztes = seite.elemente[seite.elemente.length - 1];
  return { schritte, rest: seite.laenge - rechteKante(letztes) };
}

// Berechnet den ganzen Plan (alle Wände und bespielbaren Seiten).
export function berechnePlan(daten) {
  const seiten = [];
  for (const wand of daten.waende || []) {
    for (const seite of wand.seiten || []) {
      if (seite.bespielbar === false) continue;
      seiten.push(berechneSeite(daten, wand, seite));
    }
  }
  // Screens, die auf keiner Wandseite stehen, sind „noch nicht platziert“.
  const platzierteIds = new Set(
    (daten.waende || []).flatMap((w) => (w.seiten || []).flatMap((s) => s.elemente || [])),
  );
  const nichtPlatziert = (daten.screens || [])
    .filter((s) => !platzierteIds.has(s.id))
    .map((s) => ({ code: 'screenNichtPlatziert', elementId: s.id, werkId: s.id }))
    .concat(
      (daten.pulte || [])
        .filter((p) => !platzierteIds.has(p.id))
        .map((p) => ({ code: 'pultNichtPlatziert', elementId: p.id, werkId: p.id })),
    );

  return {
    seiten,
    warnungen: [...seiten.flatMap((s) => s.warnungen), ...nichtPlatziert],
    fehler: seiten.flatMap((s) => s.fehler),
    befestigungspunkte: seiten.flatMap((s) => s.befestigungspunkte),
  };
}
