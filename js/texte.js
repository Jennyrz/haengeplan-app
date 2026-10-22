// Alle Oberflächentexte an einer Stelle. Weitere Sprachen (fr, it, en, es) kommen später dazu:
// einfach einen weiteren Block mit denselben Schlüsseln ergänzen.
// Platzhalter in {geschweiften Klammern} werden beim Anzeigen ersetzt; Zahlen als cm-Wert gerundet.

import { formatCm } from './calc.js';

export const TEXTE = {
  de: {
    appTitel: 'Hängeplan',
    untertitel: 'ARTBOXY · Nagelpositionen berechnen',

    // Navigation (Handy)
    navEingaben: 'Eingaben',
    navVorschau: 'Vorschau',
    navPunkte: 'Nägel',

    // Abschnitte
    abschnittAusstellung: 'Ausstellung',
    abschnittWand: 'Wand',
    abschnittWaende: 'Wände',
    abschnittReihenfolge: 'Reihenfolge',
    reihenfolgeHilfe: 'Von links nach rechts, so wie man vor der Wand steht. Verschieben mit ↑ ↓ (Knöpfe oder Pfeiltasten).',
    abschnittWerke: 'Werke',
    abschnittGruppen: 'Gruppen',
    abschnittScreens: 'ARTBOXY-Screens',
    abschnittVorschau: 'Wandvorschau',
    abschnittHinweise: 'Hinweise',
    abschnittErgebnis: 'Befestigungspunkte',

    // Ausstellung und Wand
    ausstellungName: 'Name der Ausstellung',
    mittelhoehe: 'Mittelhöhe M (cm)',
    mindestabstand: 'Mindestabstand (cm)',
    minBodenabstand: 'Min. Abstand zum Boden (cm)',
    wandName: 'Bezeichnung',
    wandLaenge: 'Wandlänge L (cm)',
    wandHoehe: 'Wandhöhe (cm)',
    wandNeu: '+ Wand',
    wandLoeschen: 'Wand löschen',
    wandLoeschenFrage: '„{name}“ löschen? Die Werke darauf bleiben erhalten, sind dann aber nicht platziert.',
    seiten: 'Seiten dieser Wand',
    seiteNeu: '+ Seite',
    seiteBezeichnung: 'Bezeichnung der Seite',
    seiteBespielbar: 'bespielbar',
    seiteLoeschen: 'Seite löschen',
    seiteLoeschenFrage: 'Seite „{name}“ löschen? Die Werke darauf bleiben erhalten, sind dann aber nicht platziert.',
    seiteNichtBespielbar: 'Diese Seite ist als nicht bespielbar markiert.',
    hinweiseAndereWaende: 'Weitere Hinweise auf anderen Wänden: {anzahl}',

    // Werke
    werkHinzufuegen: '+ Werk hinzufügen',
    loeschen: 'Löschen',
    werkLoeschenFrage: '„{name}“ wirklich löschen?',
    werkOhneTitel: 'Werk {id}',
    titel: 'Titel',
    kuenstler: 'Künstler/in',
    breite: 'Breite B (cm)',
    hoehe: 'Höhe H (cm)',
    anzahlNaegel: 'Aufhängung',
    einNagel: '1 Nagel',
    zweiNaegel: '2 Nägel',
    abstandOben: 'a: Oberkante bis Aufhänger (cm)',
    aufhaengerAbstand: 'd: Abstand der Aufhänger (cm)',
    quelleMasse: 'Masse',
    quelleGemessen: 'gemessen',
    quelleKuenstler: 'vom Künstler (unsicher)',
    platzierung: 'Hängt an',
    nichtPlatziert: '– nicht platziert –',
    filter: 'Anzeigen',
    filterAlle: 'alle Werke',
    filterSeite: 'nur diese Wandseite',
    filterOffen: 'nur nicht platzierte',
    keineTreffer: 'Keine Werke für diese Auswahl.',
    elementHinzufuegen: 'Element auf diese Wandseite holen …',
    inGruppe: 'in {gruppe}',
    keineWerke: 'Noch keine Werke erfasst.',
    zahlUngueltig: 'Bitte eine Zahl eingeben',

    // Gruppen
    gruppeHinzufuegen: '+ Gruppe hinzufügen',
    gruppeLoeschenFrage: '{name} wirklich löschen? Die Werke bleiben erhalten.',
    gruppeName: 'Gruppe {id}',
    zeilen: 'Zeilen',
    spalten: 'Spalten',
    innenabstand: 'Innenabstand g (cm)',
    rasterHilfe: 'Werke zeilenweise zuordnen. Ein Werk in einer Gruppe hängt nicht mehr einzeln an der Wand.',
    zelleLeer: '– leer –',
    zelle: 'Zeile {zeile}, Spalte {spalte}',
    keineGruppen: 'Noch keine Gruppen.',

    // Screens
    screenQuer: 'Screen quer',
    screenHoch: 'Screen hoch',
    gewicht: 'Gewicht (kg)',
    halterungOffsetVertikal: 'v: Schraubpunkte über Screenmitte (cm, + = oberhalb)',
    halterungAbstandHorizontal: 's: Abstand der Schraubpunkte (cm)',

    // Reihenfolge
    nachLinks: 'Weiter nach links',
    nachRechts: 'Weiter nach rechts',
    vonWandNehmen: 'Von der Wand nehmen',
    keineElemente: 'Noch keine Elemente auf der Wand.',
    typWerk: 'Werk',
    typGruppe: 'Gruppe',
    typScreen: 'Screen',

    // Ergebnis
    abstandInfo: 'Abstand zwischen den Elementen und zu den Wandenden: {abstand} cm',
    keineHinweise: 'Keine Hinweise – alles plausibel.',
    keinePunkte: 'Noch keine Befestigungspunkte.',
    spalteElement: 'Element',
    spalteNr: 'Nr.',
    spalteArt: 'Art',
    spalteX: 'x ab linker Wandkante (cm)',
    spalteXKurz: 'x (cm)',
    spalteHoehe: 'Höhe ab Boden (cm)',
    spalteHoeheKurz: 'Höhe (cm)',
    nagel: 'Nagel',
    schraube: 'Schraube',
    fehler: 'Fehler',
    warnung: 'Warnung',

    // Vorschau
    vorschauMittellinie: 'M = {m} cm',
    vorschauBeschreibung: 'Massstabsgetreue Vorschau der Wand mit allen Elementen und Befestigungspunkten',
    vorschauLegendeWerk: 'Werk',
    vorschauLegendeScreen: 'Screen',
    vorschauLegendePunkt: 'Befestigungspunkt',

    // Ausstellungen und Speichern
    ausstellungWaehlen: 'Ausstellung',
    ausstellungNeu: '+ Neue Ausstellung',
    ausstellungNeuFrage: 'Name der neuen Ausstellung:',
    ausstellungDuplizieren: 'Duplizieren',
    ausstellungKopie: '{name} (Kopie)',
    ausstellungLoeschen: 'Löschen',
    ausstellungLoeschenFrage: 'Ausstellung „{name}“ mit allen Wänden und Werken endgültig löschen?',
    ausstellungOhneName: 'Ausstellung ohne Namen',
    speichertGerade: 'Wird gespeichert …',
    gespeichert: 'Gespeichert',
    speichernFehlgeschlagen: 'Speichern fehlgeschlagen!',
    ladenFehlgeschlagen: 'Die Ausstellung konnte nicht geladen werden.',
    listeFehlgeschlagen: 'Die Ausstellungen konnten nicht geladen werden. Bitte Internetverbindung prüfen und Seite neu laden.',

    // Anmeldung
    anmeldenTitel: 'Anmelden',
    anmeldenHilfe: 'Mit der E-Mail-Adresse und dem Passwort, die du bei der Einladung festgelegt hast.',
    email: 'E-Mail',
    passwort: 'Passwort',
    anmelden: 'Anmelden',
    anmeldenFehlgeschlagen: 'Anmeldung fehlgeschlagen. E-Mail oder Passwort stimmt nicht.',
    abmelden: 'Abmelden',
    angemeldetAls: 'Angemeldet als {email}',
    passwortVergessen: 'Passwort vergessen?',
    passwortVergessenTitel: 'Passwort vergessen',
    passwortVergessenHilfe: 'Du bekommst eine E-Mail mit einem Link. Darüber legst du ein neues Passwort fest.',
    linkSenden: 'Link senden',
    linkGesendet: 'Falls es für diese Adresse ein Konto gibt, ist die E-Mail unterwegs.',
    zurueckZurAnmeldung: 'Zurück zur Anmeldung',
    passwortFestlegenTitel: 'Passwort festlegen',
    passwortFestlegenHilfe: 'Wähle ein Passwort mit mindestens 8 Zeichen. Damit meldest du dich künftig an.',
    neuesPasswort: 'Neues Passwort',
    passwortSpeichern: 'Passwort speichern',
    passwortZuKurz: 'Das Passwort braucht mindestens 8 Zeichen.',
    passwortFehlgeschlagen: 'Das Passwort konnte nicht gespeichert werden. Der Link ist vielleicht abgelaufen – bitte „Passwort vergessen?“ nutzen.',
    bitteWarten: 'Bitte warten …',

    // Fehler (Element wird nicht berechnet)
    breiteUngueltig: 'Breite fehlt oder ist nicht grösser als 0.',
    hoeheUngueltig: 'Höhe fehlt oder ist nicht grösser als 0.',
    elementUnbekannt: 'Element ist unbekannt.',
    werkUnbekannt: 'Werk in der Gruppe ist unbekannt.',
    rasterUngueltig: 'Zeilen und Spalten müssen ganze Zahlen grösser als 0 sein.',
    gruppeLeer: 'Gruppe enthält noch keine Werke.',
    wandLaengeUngueltig: 'Wandlänge fehlt oder ist nicht grösser als 0.',

    // Warnungen (Berechnung läuft trotzdem)
    aFehlt: 'Abstand Oberkante–Aufhänger (a) fehlt. Gerechnet wird mit a = 0.',
    aNegativ: 'Abstand Oberkante–Aufhänger (a) ist negativ. Gerechnet wird mit a = 0.',
    aZuGross: 'Abstand Oberkante–Aufhänger (a) ist grösser als die halbe Werkhöhe – bitte prüfen.',
    dFehlt: 'Abstand zwischen den Aufhängern (d) fehlt. Beide Nägel liegen in der Mitte.',
    dZuGross: 'Abstand zwischen den Aufhängern (d) ist grösser als die Werkbreite – bitte prüfen.',
    passtNicht: 'Die Elemente passen nicht auf die Wand (Abstand {abstand} cm).',
    abstandZuKlein: 'Abstand zwischen den Elementen nur {abstand} cm (Mindestabstand {mindestabstand} cm).',
    zuHoch: 'Oberkante {oberkante} cm liegt über der Wandhöhe ({wandhoehe} cm).',
    zuTief: 'Unterkante {unterkante} cm liegt tiefer als {minBodenabstand} cm über Boden.',
    halterungFehlt: 'Halterungsmasse (v, s) fehlen – beide Schrauben liegen in der Screenmitte.',
    screenNichtPlatziert: 'Screen ist noch nicht platziert.',
  },
};

let sprache = 'de';

export function setzeSprache(neu) {
  if (TEXTE[neu]) sprache = neu;
}

// Liefert den Text zum Schlüssel und ersetzt Platzhalter. Zahlen werden als cm-Wert formatiert.
export function t(schluessel, werte = {}) {
  const vorlage = TEXTE[sprache][schluessel] ?? TEXTE.de[schluessel] ?? schluessel;
  return vorlage.replace(/\{(\w+)\}/g, (_, name) => {
    const wert = werte[name];
    if (typeof wert === 'number') return formatCm(wert);
    return wert ?? '';
  });
}
