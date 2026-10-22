# Hängeplan – Anleitung

Die App berechnet für jedes Werk, wo genau der Nagel hinkommt: **x ab der linken Wandkante** (so wie man vor der Wand steht) und **Höhe ab Boden**, beide in cm.

## 1. App öffnen

Auf jedem Gerät (Laptop, Handy, Tablet) im Browser: **https://jennyrz.github.io/haengeplan-app/**

Anmelden mit E-Mail und Passwort. Tipp fürs Handy: Seite zum Home-Bildschirm hinzufügen (Safari: Teilen → „Zum Home-Bildschirm“).

### Neue Person ins Team holen

Im Supabase-Projekt **haengeplan** (Organisation ARTBOXY): Authentication → Users → **Add user**
- „Send invitation“: Die Person bekommt eine E-Mail, klickt den Link und legt in der App ihr Passwort fest.
- oder „Create new user“ mit E-Mail, Passwort und Haken bei „Auto Confirm User“.

Selbst registrieren kann sich niemand. Alle Angemeldeten sehen und bearbeiten alle Ausstellungen.
Passwort vergessen: in der App auf „Passwort vergessen?“ tippen.

### Änderungen am Programm veröffentlichen

Der Code liegt auf GitHub (Jennyrz/haengeplan-app, öffentlich – eure Daten liegen nicht dort, sondern geschützt in Supabase). Nach `git push` ist die neue Version in 1–2 Minuten online.

### Lokal ausprobieren (für Programmänderungen)

```bash
cd ~/"ARTBOX.GROUPS GmbH Dropbox/Jenny-Rose Zenklusen/haengeplan-app"
python3 -m http.server 8000
```

Dann **http://localhost:8000** öffnen. Auch lokal wird online in Supabase gespeichert (dieselben Daten wie online).

## 2. Tests ausführen

```bash
cd ~/"ARTBOX.GROUPS GmbH Dropbox/Jenny-Rose Zenklusen/haengeplan-app"
npm test
```

Am Ende muss `fail 0` stehen. Die Tests prüfen alle Testfälle aus `CLAUDE.md` (Einzelwerke, Verteilung, Gruppe, Screen, Rundung, Warnungen) sowie Export und Import.

## 3. Eine Ausstellung planen

1. **Ausstellung wählen oder anlegen:** Oben bei „Ausstellung“ zwischen deinen Ausstellungen wechseln. „+ Neue Ausstellung“ legt eine leere an, „Duplizieren“ kopiert die aktuelle (praktisch, wenn eine Messe ähnlich wie letztes Jahr wird).
2. **Ausstellung:** Name, Mittelhöhe (Standard 150 cm), Mindestabstand (10 cm) und Mindestabstand zum Boden (30 cm).
3. **Wände:** Jede Wand ist ein Reiter. „+ Wand“ legt eine neue an. Für die gewählte Wand Bezeichnung, Wandlänge L und Wandhöhe eingeben.
4. **Seiten:** Eine Wand hat zuerst eine Seite („innen“). Mit „+ Seite“ kommt z. B. „aussen“ dazu – jede Seite hat ihre eigene Hängung. Nicht nutzbare Seiten: Häkchen „bespielbar“ wegnehmen.
5. **Werke:** „+ Werk hinzufügen“ legt ein Werk auf der gerade gewählten Wandseite an. Ausfüllen:
   - Breite B und Höhe H
   - **a** = Abstand von der Oberkante des Werks bis zum **gespannten** Draht bzw. zur Öse
   - Aufhängung: 1 Nagel oder 2 Nägel. Bei 2 Nägeln zusätzlich **d** = Abstand zwischen den beiden Aufhängern
   - Masse „gemessen“ oder „vom Künstler (unsicher)“
   - **Hängt an:** auf welcher Wand/Seite das Werk hängt (oder „nicht platziert“)
   - Kommazahlen mit Komma oder Punkt, z. B. `70,9`
   - Mit „Anzeigen“ blendest du nur die Werke der gewählten Wandseite oder nur die noch nicht platzierten ein.
6. **Gruppen** (z. B. 2×2): „+ Gruppe hinzufügen“, Zeilen und Spalten wählen, dann die Werke **zeilenweise** zuordnen (oben links beginnen). Ein Werk in einer Gruppe hängt nicht zusätzlich einzeln an der Wand.
7. **Screens:** Bei „Screen quer“ bzw. „Screen hoch“ unter „Hängt an“ die Wandseite wählen. Halterungsmasse eintragen:
   - **v** = wie weit die Schraubpunkte über (+) oder unter (–) der Screenmitte liegen
   - **s** = Abstand zwischen den beiden Schraubpunkten
8. **Reihenfolge:** Zeigt die gewählte Wandseite. Mit ↑ ↓ sortieren (oben = ganz links an der Wand), mit × von der Wand nehmen. Über „Element auf diese Wandseite holen …“ holst du nicht platzierte Werke, Gruppen oder Screens dazu.
9. **Ergebnis ablesen** (immer für die gewählte Wandseite):
   - **Wandvorschau:** massstabsgetreu, blaue gestrichelte Linie = Mittelhöhe, rote Punkte = Nägel/Schrauben
   - **Hinweise:** gelb = Warnung (Berechnung läuft trotzdem), rot = Fehler (Element wird nicht berechnet). Die Zahl am Wand-Reiter zeigt, wie viele Hinweise es auf dieser Wand gibt.
   - **Befestigungspunkte:** pro Nagel/Schraube x ab linker Wandkante und Höhe ab Boden, auf 0,5 cm gerundet

## 4. Speichern

Alles wird **automatisch gespeichert**, kurz nach jeder Änderung (oben steht „Gespeichert“). Es gibt keinen Speichern-Knopf.

Gespeichert wird online (Supabase). Alle Geräte und das ganze Team sehen denselben Stand – nach dem Neuladen der Seite. Bearbeiten zwei Personen gleichzeitig dieselbe Ausstellung, gilt die zuletzt gespeicherte Änderung. Ohne Internet erscheint „Speichern fehlgeschlagen!“.

## 5. Ordnerstruktur

| Datei | Inhalt |
|---|---|
| `index.html` | die Seite |
| `css/style.css` | Aussehen (inkl. Handy-Ansicht) |
| `js/calc.js` | **die ganze Berechnung** (Formeln aus `CLAUDE.md`) |
| `js/daten.js` | Datenmodell: Wände, Seiten, Werke, Gruppen |
| `js/speicher.js` | wo die Ausstellungen gespeichert werden |
| `js/vorschau.js` | Wandvorschau (SVG) |
| `js/texte.js` | alle Texte der Oberfläche (für weitere Sprachen) |
| `js/app.js` | verbindet Oberfläche und Berechnung |
| `tests/` | automatische Tests |
