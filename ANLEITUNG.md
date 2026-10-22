# Hängeplan – Anleitung

Die App berechnet für jedes Werk, wo genau der Nagel hinkommt: **x ab der linken Wandkante** (so wie man vor der Wand steht) und **Höhe ab Boden**, beide in cm.

## 1. App starten

Im Terminal:

```bash
cd ~/"ARTBOX.GROUPS GmbH Dropbox/Jenny-Rose Zenklusen/haengeplan-app"
python3 -m http.server 8000
```

Dann im Browser öffnen: **http://localhost:8000**

Beenden: im Terminal `Ctrl + C`.

> Warum ein Server? Der Browser lädt die Programmteile (`calc.js` usw.) aus Sicherheitsgründen nur über eine Webadresse, nicht per Doppelklick auf `index.html`.

### Auf dem Handy (z. B. an der Messe)

1. Laptop und Handy im **selben WLAN** (oder Handy-Hotspot, mit dem sich der Laptop verbindet).
2. Server auf dem Laptop wie oben starten.
3. IP-Adresse des Laptops herausfinden:
   ```bash
   ipconfig getifaddr en0
   ```
4. Auf dem Handy im Browser öffnen: `http://<diese-Adresse>:8000`, z. B. `http://192.168.1.23:8000`
5. Fragt der Mac, ob „python3“ eingehende Verbindungen erlauben darf: **Erlauben**.

Unten auf dem Handy gibt es eine Leiste, um direkt zu **Eingaben**, **Vorschau** oder **Nägel** (Liste der Befestigungspunkte) zu springen.

**Wichtig (bis der Online-Speicher eingerichtet ist):** Jeder Browser speichert seine eigenen Ausstellungen. Laptop und Handy sehen also noch nicht denselben Stand.

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

Im Moment liegt alles im Browser des jeweiligen Geräts. Sobald der Online-Speicher eingerichtet ist, sehen alle Geräte und das ganze Team denselben Stand.

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
