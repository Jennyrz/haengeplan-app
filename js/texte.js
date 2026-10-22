// Alle Oberflächentexte an einer Stelle. Weitere Sprachen (fr, it, en, es) kommen später dazu.
export const TEXTE = {
  de: {
    appTitel: 'Hängeplan',

    // Fehler (Element wird nicht berechnet)
    breiteUngueltig: 'Breite fehlt oder ist nicht grösser als 0.',
    hoeheUngueltig: 'Höhe fehlt oder ist nicht grösser als 0.',

    // Warnungen (Berechnung läuft trotzdem)
    aFehlt: 'Abstand Oberkante–Aufhänger (a) fehlt. Gerechnet wird mit a = 0.',
    aNegativ: 'Abstand Oberkante–Aufhänger (a) ist negativ. Gerechnet wird mit a = 0.',
    aZuGross: 'Abstand Oberkante–Aufhänger (a) ist grösser als die halbe Werkhöhe – bitte prüfen.',
    dFehlt: 'Abstand zwischen den Aufhängern (d) fehlt. Beide Nägel liegen in der Mitte.',
    dZuGross: 'Abstand zwischen den Aufhängern (d) ist grösser als die Werkbreite – bitte prüfen.',
  },
};
