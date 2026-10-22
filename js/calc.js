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
