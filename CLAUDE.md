# Hängeplan-App – Projektbriefing für Claude Code

## 0. Stand und Änderungen (22.10.2026)

Stufe 1 (Abschnitte 3–9) ist gebaut. Danach hat Jenny entschieden:
- **Mehrere Wände mit mehreren Seiten** (innen/aussen) – gebaut.
- **Mehrere Ausstellungen** in der App (anlegen, wechseln, duplizieren, löschen) – gebaut.
- **Kein JSON-Export/-Import in der Oberfläche**, keine Hardware-Anbindung. Das Datenformat (Abschnitt 7) bleibt trotzdem das interne Format.
- **Online-Speicher mit Login**, damit alle Geräte und das Team denselben Stand sehen – gebaut: Supabase-Projekt „haengeplan“ in der Organisation ARTBOXY (Gratisplan, Region Zürich), Login mit E-Mail und Passwort, Selbst-Registrierung aus, alle Angemeldeten sehen alles. Code nur in `js/speicher.js`, Zugangsdaten in `js/config.js`, Tabelle in `supabase/einrichtung.sql`.
- **Online erreichbar unter fester Adresse** – gebaut: https://jennyrz.github.io/haengeplan-app/ (GitHub Pages, Repo Jennyrz/haengeplan-app ist öffentlich).
- **Handytauglich**, weil die App an Messen genutzt wird.

Die Einschränkungen in Abschnitt 3 („NICHT bauen: Login, Server, Datenbank, mehrere Wände“) gelten dafür nicht mehr.

## 1. Wer ich bin und wie wir arbeiten

Ich bin Jenny, CMO bei ARTBOXY. Ich habe keinen Programmierhintergrund, kenne mich aber mit Terminal, Xcode und Claude Code aus.

Arbeitsweise:
- Erkläre jeden Schritt kurz und verständlich, ohne Fachjargon. Wenn ein Fachbegriff nötig ist, erkläre ihn in einem Satz.
- Arbeite in kleinen, testbaren Schritten (siehe Abschnitt 9). Nach jedem Schritt: kurz zusammenfassen, was gebaut wurde, wie ich es teste, und auf mein OK warten.
- Mach nach jedem abgeschlossenen Schritt einen Git-Commit mit verständlicher Nachricht.
- Wenn etwas unklar ist, frag nach, statt Annahmen zu treffen.
- Wenn du einen Fehler in meinen Vorgaben siehst (z. B. in einer Formel oder einem Testfall), sag es offen.

## 2. Worum es geht

ARTBOXY hängt an Ausstellungen und Messen viele Kunstwerke auf. Heute wird pro Werk vor Ort gemessen und im Kopf gerechnet, was langsam und fehleranfällig ist.

Die App berechnet für jedes Werk, wo genau der Nagel hinkommt (x-Position ab Wandkante und Höhe ab Boden), verteilt die Werke auf der Wand und zeigt eine Vorschau.

Langfristige Vision (NICHT jetzt bauen, aber die Architektur soll dafür offen sein):
- Ausstellungen mit vielen Wänden, Messestände mit Innen- und Aussenseiten
- Vor-Ort-Modus auf dem Handy, Nagel für Nagel, offline
- PDF-Hängelisten, QR-Etiketten, Wandbeschriftungen
- Künstlerformular, Teamfunktionen mit Login
- Ein selbstgebautes Markiergerät (ESP32) oder eine iPhone-AR-App liest später die Nagelkoordinaten aus dem JSON-Export

## 3. Umfang JETZT: Stufe 1

Gebaut wird nur:
- Eine Ausstellung, EINE Wand, EINE Seite
- Einzelwerke mit 1 oder 2 Nägeln
- Gruppen als Raster (z. B. 2×2)
- Zwei feste ARTBOXY-Screens (quer und hoch)
- Automatische, gleichmässige Verteilung
- Ergebnis-Tabelle mit allen Befestigungspunkten
- Einfache, massstabsgetreue Wandvorschau (SVG)
- Lokales Speichern im Browser, Export/Import als JSON

Ausdrücklich NICHT bauen: Login, Server, Datenbank, mehrere Wände, Sperrzonen, PDF, AR, Hardware-Anbindung, Drag & Drop. Das kommt später.

## 4. Technik

- Reine Web-App: HTML, CSS, JavaScript. Kein Framework, keine Build-Tools.
- Berechnungslogik in einer eigenen Datei (z. B. `calc.js`) als reine Funktionen ohne Zugriff auf die Oberfläche. Diese Datei ist das Herzstück.
- Automatische Tests für `calc.js` mit dem eingebauten Node-Testrunner (`node --test`), keine zusätzlichen Pakete.
- Zum lokalen Ausprobieren einen einfachen statischen Server verwenden und mir den Befehl dafür nennen.
- Speichern im Browser (localStorage) plus JSON-Export und -Import.
- Oberfläche auf Deutsch. Alle Texte an einer Stelle sammeln, damit später weitere Sprachen (FR, IT, EN, ES) dazukommen können.
- Alle Masse intern in Zentimetern als Zahlen. Gerundet wird NUR bei der Anzeige, auf 0,5 cm.

## 5. Hängeregeln und Formeln

Begriffe:
- M = Mittelhöhe, Standard 150 cm (pro Ausstellung einstellbar)
- H = Höhe des Werks, B = Breite des Werks
- a = Abstand von der Oberkante des Werks bis zum gespannten Aufhänger (Draht oder Öse)

**Einzelwerk, 1 Nagel**
- Oberkante = M + H/2
- Nagelhöhe = Oberkante − a
- Nagel x = horizontale Mitte des Werks

**Einzelwerk, 2 Nägel**
- Nagelhöhe wie oben (gleiches a für beide)
- Zusätzliche Eingabe: d = Abstand zwischen den beiden Aufhängern
- Nagel 1 x = Werkmitte − d/2, Nagel 2 x = Werkmitte + d/2

**Gruppe (Raster)**
- Eingaben: Zeilen, Spalten, Innenabstand g (Standard 5 cm), Werke zeilenweise zugeordnet
- Spaltenbreite = breitestes Werk der Spalte, Zeilenhöhe = höchstes Werk der Zeile
- Gruppenbreite = Summe der Spaltenbreiten + (Spalten − 1) × g
- Gruppenhöhe = Summe der Zeilenhöhen + (Zeilen − 1) × g
- Die Gruppe wird wie ein Gesamtrechteck behandelt: Mitte der Gruppe auf M, Oberkante der Gruppe = M + Gruppenhöhe/2
- Jedes Werk wird in seiner Rasterzelle horizontal und vertikal zentriert
- Danach Nagel pro Werk mit dessen eigenem a (und ggf. d) berechnen

**ARTBOXY-Screens**
- Zwei feste Elemente, in jeder Ausstellung automatisch vorhanden: Screen quer und Screen hoch
- Standardmasse (als änderbare Vorlage, ich messe unsere Geräte noch nach): quer 123,8 × 70,9 cm, hoch 70,9 × 123,8 cm, Gewicht ca. 17 kg
- Screenmitte auf M
- Statt Nägeln: Schraubpunkte der Wandhalterung
- Eingaben pro Screen: v = vertikaler Abstand der Schraubpunkte zur Screenmitte (positiv = oberhalb), s = horizontaler Abstand zwischen den beiden Schraubpunkten
- Schraubhöhe = M + v, Schraube 1 x = Screenmitte − s/2, Schraube 2 x = Screenmitte + s/2
- Screens können in der Liste der Elemente auf der Wand stehen oder als „noch nicht platziert“ markiert sein

**Verteilung auf der Wand**
- Eingabe: Wandlänge L, Wandhöhe
- Elemente (Einzelwerke, Gruppen, Screens) in einer festen Reihenfolge, die ich mit Pfeiltasten hoch/runter ändern kann
- Gleichmässige Verteilung: gleiche Abstände zwischen den Elementen UND zu beiden Wandenden
- Abstand = (L − Summe der Elementbreiten) / (Anzahl Elemente + 1)
- Alle x-Werte werden ab der linken Wandkante gemessen, so wie man vor der Wand steht

## 6. Prüfungen und Warnungen

Warnungen anzeigen, aber die Berechnung trotzdem durchführen:
- Abstand zwischen Elementen kleiner als der Mindestabstand (Standard 10 cm) oder negativ (passt nicht auf die Wand)
- Oberkante eines Elements höher als die Wandhöhe
- Unterkante eines Elements tiefer als 30 cm über Boden (einstellbar)
- a fehlt, ist negativ oder grösser als die halbe Werkhöhe (unplausibel)
- Bei 2 Nägeln: d fehlt oder ist grösser als die Werkbreite
- Ein Screen ist noch nicht platziert

Fehler (keine Berechnung für dieses Element): fehlende oder nicht-positive Breite/Höhe.

## 7. Datenformat (JSON)

Dieses Format ist verbindlich, weil später ein ESP32-Gerät und eine iPhone-App es lesen sollen. Es kennt bereits mehrere Wände und Seiten, auch wenn Stufe 1 nur eine nutzt. Felder dürfen ergänzt, aber nicht umbenannt werden, ohne mich zu fragen.

```json
{
  "formatVersion": 1,
  "ausstellung": {
    "name": "Beispiel",
    "mittelhoehe": 150,
    "mindestabstand": 10,
    "minBodenabstand": 30
  },
  "waende": [
    {
      "id": "w1",
      "name": "Wand 1",
      "laenge": 400,
      "hoehe": 250,
      "seiten": [
        { "id": "w1-a", "bezeichnung": "innen", "bespielbar": true, "elemente": ["e1", "g1", "s-quer"] }
      ]
    }
  ],
  "werke": [
    {
      "id": "e1",
      "titel": "",
      "kuenstler": "",
      "breite": 60,
      "hoehe": 80,
      "anzahlNaegel": 1,
      "abstandOben": 10,
      "aufhaengerAbstand": null,
      "quelleMasse": "gemessen"
    }
  ],
  "gruppen": [
    { "id": "g1", "zeilen": 2, "spalten": 2, "innenabstand": 5, "raster": [["e2", "e3"], ["e4", "e5"]] }
  ],
  "screens": [
    { "id": "s-quer", "ausrichtung": "quer", "breite": 123.8, "hoehe": 70.9, "gewicht": 17, "halterungOffsetVertikal": 0, "halterungAbstandHorizontal": 0 },
    { "id": "s-hoch", "ausrichtung": "hoch", "breite": 70.9, "hoehe": 123.8, "gewicht": 17, "halterungOffsetVertikal": 0, "halterungAbstandHorizontal": 0 }
  ],
  "befestigungspunkte": [
    { "wandId": "w1", "seiteId": "w1-a", "elementId": "e1", "werkId": "e1", "nr": 1, "art": "nagel", "x": 110, "hoehe": 180 }
  ]
}
```

`quelleMasse` ist entweder `"kuenstler"` (vom Künstler angegeben, unsicher) oder `"gemessen"`. `befestigungspunkte` wird von der App berechnet und beim Export mitgeschrieben.

## 8. Testfälle (müssen als automatische Tests existieren und bestehen)

Prüfe zuerst selbst, ob meine erwarteten Werte stimmen. Wenn nicht, sag es mir, bevor du Tests anpasst.

1. **Einzelwerk, 1 Nagel:** B 60, H 80, a 10, M 150 → Oberkante 190, Nagelhöhe 180.
2. **Einzelwerk, 2 Nägel:** B 100, H 70, a 8, d 60, M 150 → Nagelhöhe 177, Nägel bei Werkmitte −30 und +30.
3. **Verteilung:** Wand 400 cm, Element A = Test 1 (B 60), Element B = Test 2 (B 100) → Abstand 80. A liegt bei x 80–140, Nagel bei x 110, Höhe 180. B liegt bei x 220–320, Nägel bei x 240 und 300, Höhe 177.
4. **Gruppe 2×2:** vier Werke je B 30, H 40, a 5, Innenabstand 5, M 150, Gruppe allein auf einer 200-cm-Wand → Gruppe 65 × 85, Oberkante 192,5. Nägel obere Zeile Höhe 187,5, untere Zeile Höhe 142,5. Gruppe liegt bei x 67,5–132,5, Spaltenmitten bei x 82,5 und 117,5.
5. **Screen quer:** M 150, v +10, s 40, Screen allein auf einer 300-cm-Wand → Screen bei x 88,1–211,9, Mitte 150. Schrauben auf Höhe 160 bei x 130 und 170.
6. **Rundung:** 171,26 wird als 171,5 angezeigt, 171,24 als 171,0. Intern bleibt der genaue Wert.
7. **Passt nicht:** Wand 100 cm, zwei Werke je B 60 → Warnung „passt nicht auf die Wand“.
8. **Unplausibles a:** H 40, a 25 → Warnung.

## 9. Arbeitsschritte (nach jedem Schritt stoppen und auf mein OK warten)

1. Projektstruktur anlegen, Git initialisieren, mir die Ordnerstruktur in drei Sätzen erklären.
2. `calc.js` für Einzelwerke (1 und 2 Nägel) plus Tests 1, 2, 6, 8.
3. Verteilung auf der Wand plus Tests 3 und 7.
4. Gruppen plus Test 4.
5. Screens plus Test 5.
6. Einfache Oberfläche: Formulare für Ausstellung, Wand, Werke, Gruppen, Screens; Reihenfolge mit Pfeiltasten; Ergebnistabelle (Element, Nagel-Nr., Art, x, Höhe); Warnungen gut sichtbar.
7. Wandvorschau als SVG: Wand, 150-cm-Linie, Elemente als Rechtecke mit Titel, Befestigungspunkte als Punkte, Screens farblich unterscheidbar.
8. Speichern im Browser, JSON-Export und -Import. Test: exportieren, Seite leeren, importieren, alles wieder da.
9. Kurze Anleitung `ANLEITUNG.md` auf Deutsch: wie ich die App starte, Tests ausführe und eine Wand plane.

Nach Schritt 9 teste ich die App an einer echten Wand. Erst danach planen wir Stufe 2.
