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

**Wichtig:** Jeder Browser speichert seinen eigenen Plan. Laptop und Handy sehen also nicht automatisch denselben Stand. Plan auf dem Laptop **exportieren**, Datei aufs Handy bringen (z. B. über Dropbox oder AirDrop) und dort **importieren**.

## 2. Tests ausführen

```bash
cd ~/"ARTBOX.GROUPS GmbH Dropbox/Jenny-Rose Zenklusen/haengeplan-app"
npm test
```

Am Ende muss `fail 0` stehen. Die Tests prüfen alle Testfälle aus `CLAUDE.md` (Einzelwerke, Verteilung, Gruppe, Screen, Rundung, Warnungen) sowie Export und Import.

## 3. Eine Wand planen

1. **Ausstellung:** Name eingeben. Mittelhöhe (Standard 150 cm), Mindestabstand (10 cm) und Mindestabstand zum Boden (30 cm) bei Bedarf anpassen.
2. **Wand:** Wandlänge L und Wandhöhe eingeben.
3. **Werke:** Für jedes Werk „+ Werk hinzufügen“ und ausfüllen:
   - Breite B und Höhe H
   - **a** = Abstand von der Oberkante des Werks bis zum **gespannten** Draht bzw. zur Öse
   - Aufhängung: 1 Nagel oder 2 Nägel. Bei 2 Nägeln zusätzlich **d** = Abstand zwischen den beiden Aufhängern
   - Masse „gemessen“ oder „vom Künstler (unsicher)“
   - Kommazahlen mit Komma oder Punkt, z. B. `70,9`
4. **Gruppen** (z. B. 2×2): „+ Gruppe hinzufügen“, Zeilen und Spalten wählen, dann in den Feldern die Werke **zeilenweise** zuordnen (oben links beginnen). Ein Werk in einer Gruppe hängt nicht mehr zusätzlich einzeln an der Wand.
5. **Screens:** Bei „Screen quer“ oder „Screen hoch“ das Häkchen **auf der Wand** setzen. Halterungsmasse eintragen:
   - **v** = wie weit die Schraubpunkte über (+) oder unter (–) der Screenmitte liegen
   - **s** = Abstand zwischen den beiden Schraubpunkten
6. **Reihenfolge:** In „Reihenfolge auf der Wand“ mit ↑ ↓ sortieren (oben = ganz links an der Wand). Mit × wird ein Element von der Wand genommen, aber nicht gelöscht.
7. **Ergebnis ablesen:**
   - **Wandvorschau:** massstabsgetreu, blaue gestrichelte Linie = Mittelhöhe, rote Punkte = Nägel/Schrauben
   - **Hinweise:** gelb = Warnung (Berechnung läuft trotzdem), rot = Fehler (Element wird nicht berechnet)
   - **Befestigungspunkte:** pro Nagel/Schraube x ab linker Wandkante und Höhe ab Boden, auf 0,5 cm gerundet

## 4. Speichern

- Alles wird **automatisch im Browser** gespeichert (oben rechts steht „Automatisch im Browser gespeichert“).
- **JSON exportieren** lädt den Plan als Datei herunter, inklusive aller berechneten Befestigungspunkte. Diese Datei ist auch das Format für das spätere Markiergerät bzw. die iPhone-App.
- **JSON importieren** lädt eine exportierte Datei wieder.
- **Neuer Plan** verwirft den aktuellen Stand (vorher exportieren!).

Tipp: Nach jeder Planung exportieren und die Datei in Dropbox ablegen. Der Browser-Speicher kann verloren gehen, z. B. wenn der Verlauf gelöscht wird.

## 5. Ordnerstruktur

| Datei | Inhalt |
|---|---|
| `index.html` | die Seite |
| `css/style.css` | Aussehen (inkl. Handy-Ansicht) |
| `js/calc.js` | **die ganze Berechnung** (Formeln aus `CLAUDE.md`) |
| `js/daten.js` | Datenformat, Werke/Gruppen anlegen, Export/Import |
| `js/vorschau.js` | Wandvorschau (SVG) |
| `js/texte.js` | alle Texte der Oberfläche (für weitere Sprachen) |
| `js/app.js` | verbindet Oberfläche und Berechnung |
| `tests/` | automatische Tests |
