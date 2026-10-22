// Oberfläche: zeigt die Formulare, schreibt Eingaben in den Plan, ruft calc.js auf und zeigt die Ergebnisse.
// Die Rechnung selbst steckt ausschliesslich in calc.js.

import { berechnePlan, einstellungen, formatCm } from './calc.js';
import { erzeugeVorschau } from './vorschau.js';
import { t } from './texte.js';
import * as D from './daten.js';

let plan = D.neuerPlan();

// --- Hilfsfunktionen -------------------------------------------------------

const $ = (selektor) => document.querySelector(selektor);

function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, (z) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[z]);
}

// Zahl → Text fürs Eingabefeld (mit Komma, ungerundet)
function zahlText(wert) {
  return wert == null ? '' : String(wert).replace('.', ',');
}

// Text aus dem Eingabefeld → Zahl (Komma oder Punkt erlaubt); leer oder ungültig → null
function leseZahl(text) {
  const s = String(text).trim().replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// Anzeigename eines Werks, einer Gruppe oder eines Screens
function name(id) {
  const werk = D.findeWerk(plan, id);
  if (werk) return werk.titel?.trim() || t('werkOhneTitel', { id });
  if (D.findeGruppe(plan, id)) return t('gruppeName', { id });
  const screen = D.findeScreen(plan, id);
  if (screen) return screen.ausrichtung === 'hoch' ? t('screenHoch') : t('screenQuer');
  return id;
}

// „Gruppe g1 › Titel“ für Werke in Gruppen, sonst nur der Name
function bezeichnung(elementId, werkId) {
  if (!elementId && !werkId) return D.aktuelleWand(plan).name || t('abschnittWand');
  if (werkId && elementId && werkId !== elementId) return `${name(elementId)} › ${name(werkId)}`;
  return name(elementId ?? werkId);
}

function typ(id) {
  if (D.findeWerk(plan, id)) return 'werk';
  if (D.findeGruppe(plan, id)) return 'gruppe';
  return 'screen';
}

// Name, der sich beim Tippen des Titels sofort mitändert
function label(id) {
  return `<span data-label="${esc(id)}">${esc(name(id))}</span>`;
}

function feld(beschriftung, ziel, wert, art = 'zahl') {
  const wertText = art === 'zahl' ? zahlText(wert) : wert ?? '';
  const extra = art === 'zahl' ? ' inputmode="decimal" autocomplete="off"' : '';
  return `<label class="feld"><span>${esc(beschriftung)}</span>
    <input type="text"${extra} data-ziel="${esc(ziel)}" data-art="${art}" value="${esc(wertText)}"></label>`;
}

function auswahl(beschriftung, ziel, wert, optionen, art = 'text') {
  const opts = optionen
    .map(([v, txt]) => `<option value="${esc(v)}"${String(v) === String(wert) ? ' selected' : ''}>${esc(txt)}</option>`)
    .join('');
  return `<label class="feld"><span>${esc(beschriftung)}</span>
    <select data-ziel="${esc(ziel)}" data-art="${art}">${opts}</select></label>`;
}

function aufWandSchalter(id) {
  return `<label class="schalter"><input type="checkbox" data-aufwand="${esc(id)}"${D.istAufWand(plan, id) ? ' checked' : ''}> ${esc(t('aufWand'))}</label>`;
}

function knopf(aktion, inhalt, { id = '', titel = '', klasse = '' } = {}) {
  const attr = titel ? ` title="${esc(titel)}" aria-label="${esc(titel)}"` : '';
  return `<button type="button" class="${klasse}" data-aktion="${aktion}" data-id="${esc(id)}"${attr}>${inhalt}</button>`;
}

function zielObjekt(art, id) {
  if (art === 'ausstellung') return plan.ausstellung;
  if (art === 'wand') return D.aktuelleWand(plan);
  if (art === 'werk') return D.findeWerk(plan, id);
  if (art === 'gruppe') return D.findeGruppe(plan, id);
  if (art === 'screen') return D.findeScreen(plan, id);
  return null;
}

// --- Formulare -------------------------------------------------------------

function renderAusstellung() {
  const a = plan.ausstellung;
  $('#ausstellung').innerHTML = `<h2>${esc(t('abschnittAusstellung'))}</h2>
    <div class="felder">
      ${feld(t('ausstellungName'), 'ausstellung::name', a.name, 'text')}
      ${feld(t('mittelhoehe'), 'ausstellung::mittelhoehe', a.mittelhoehe)}
      ${feld(t('mindestabstand'), 'ausstellung::mindestabstand', a.mindestabstand)}
      ${feld(t('minBodenabstand'), 'ausstellung::minBodenabstand', a.minBodenabstand)}
    </div>`;
}

function renderWand() {
  const w = D.aktuelleWand(plan);
  $('#wand').innerHTML = `<h2>${esc(t('abschnittWand'))}</h2>
    <div class="felder">
      ${feld(t('wandName'), 'wand::name', w.name, 'text')}
      ${feld(t('wandLaenge'), 'wand::laenge', w.laenge)}
      ${feld(t('wandHoehe'), 'wand::hoehe', w.hoehe)}
    </div>`;
}

function renderReihenfolge() {
  const liste = D.aktuelleSeite(plan).elemente;
  const typText = { werk: t('typWerk'), gruppe: t('typGruppe'), screen: t('typScreen') };
  const inhalt = liste.length
    ? `<ol class="reihenfolge">${liste
        .map((id) => {
          const art = typ(id);
          return `<li data-element="${esc(id)}">
            <span class="marke marke-${art}">${esc(typText[art])}</span>
            <span class="name">${label(id)}</span>
            <span class="knoepfe">
              ${knopf('hoch', '↑', { id, titel: t('nachLinks') })}
              ${knopf('runter', '↓', { id, titel: t('nachRechts') })}
              ${knopf('entfernen', '×', { id, titel: t('vonWandNehmen') })}
            </span></li>`;
        })
        .join('')}</ol>`
    : `<p class="leer">${esc(t('keineElemente'))}</p>`;
  $('#reihenfolge').innerHTML = `<h2>${esc(t('abschnittReihenfolge'))}</h2>
    <p class="hilfe">${esc(t('reihenfolgeHilfe'))}</p>${inhalt}`;
}

function renderWerke() {
  const karten = plan.werke
    .map((w) => {
      const gruppe = D.gruppeVonWerk(plan, w.id);
      const platz = gruppe
        ? `<span class="hinweis-klein">${esc(t('inGruppe', { gruppe: name(gruppe.id) }))}</span>`
        : aufWandSchalter(w.id);
      return `<article class="karte" data-werk="${esc(w.id)}">
        <header><h3>${label(w.id)}</h3>${platz}
          ${knopf('werkLoeschen', esc(t('loeschen')), { id: w.id, klasse: 'klein gefahr' })}</header>
        <div class="felder">
          ${feld(t('titel'), `werk:${w.id}:titel`, w.titel, 'text')}
          ${feld(t('kuenstler'), `werk:${w.id}:kuenstler`, w.kuenstler, 'text')}
          ${feld(t('breite'), `werk:${w.id}:breite`, w.breite)}
          ${feld(t('hoehe'), `werk:${w.id}:hoehe`, w.hoehe)}
          ${auswahl(t('anzahlNaegel'), `werk:${w.id}:anzahlNaegel`, w.anzahlNaegel, [[1, t('einNagel')], [2, t('zweiNaegel')]], 'zahl')}
          ${feld(t('abstandOben'), `werk:${w.id}:abstandOben`, w.abstandOben)}
          ${w.anzahlNaegel === 2 ? feld(t('aufhaengerAbstand'), `werk:${w.id}:aufhaengerAbstand`, w.aufhaengerAbstand) : ''}
          ${auswahl(t('quelleMasse'), `werk:${w.id}:quelleMasse`, w.quelleMasse, [['gemessen', t('quelleGemessen')], ['kuenstler', t('quelleKuenstler')]])}
        </div></article>`;
    })
    .join('');
  $('#werke').innerHTML = `<h2>${esc(t('abschnittWerke'))}</h2>
    ${karten || `<p class="leer">${esc(t('keineWerke'))}</p>`}
    ${knopf('werkNeu', esc(t('werkHinzufuegen')), { klasse: 'hinzufuegen' })}`;
}

function renderGruppen() {
  const bis6 = [1, 2, 3, 4, 5, 6].map((n) => [n, String(n)]);
  const karten = plan.gruppen
    .map((g) => {
      // Wählbar: Werke, die in keiner Gruppe stecken, plus die Werke dieser Gruppe
      const frei = plan.werke.filter((w) => {
        const in_ = D.gruppeVonWerk(plan, w.id);
        return !in_ || in_.id === g.id;
      });
      const zellen = [];
      for (let r = 0; r < g.zeilen; r++) {
        for (let c = 0; c < g.spalten; c++) {
          const aktuell = g.raster[r][c];
          const optionen = frei
            .filter((w) => w.id === aktuell || !g.raster.some((z) => z.includes(w.id)))
            .map((w) => `<option value="${esc(w.id)}" data-label="${esc(w.id)}"${w.id === aktuell ? ' selected' : ''}>${esc(name(w.id))}</option>`)
            .join('');
          const titel = t('zelle', { zeile: String(r + 1), spalte: String(c + 1) });
          zellen.push(`<select data-raster="${esc(g.id)}:${r}:${c}" title="${esc(titel)}" aria-label="${esc(titel)}">
            <option value="">${esc(t('zelleLeer'))}</option>${optionen}</select>`);
        }
      }
      return `<article class="karte">
        <header><h3>${label(g.id)}</h3>${aufWandSchalter(g.id)}
          ${knopf('gruppeLoeschen', esc(t('loeschen')), { id: g.id, klasse: 'klein gefahr' })}</header>
        <div class="felder">
          <label class="feld"><span>${esc(t('zeilen'))}</span><select data-rastergroesse="${esc(g.id)}:zeilen">
            ${bis6.map(([v]) => `<option${v === g.zeilen ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
          <label class="feld"><span>${esc(t('spalten'))}</span><select data-rastergroesse="${esc(g.id)}:spalten">
            ${bis6.map(([v]) => `<option${v === g.spalten ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
          ${feld(t('innenabstand'), `gruppe:${g.id}:innenabstand`, g.innenabstand)}
        </div>
        <p class="hilfe">${esc(t('rasterHilfe'))}</p>
        <div class="raster" style="grid-template-columns: repeat(${g.spalten}, minmax(0, 1fr))">${zellen.join('')}</div>
      </article>`;
    })
    .join('');
  $('#gruppen').innerHTML = `<h2>${esc(t('abschnittGruppen'))}</h2>
    ${karten || `<p class="leer">${esc(t('keineGruppen'))}</p>`}
    ${knopf('gruppeNeu', esc(t('gruppeHinzufuegen')), { klasse: 'hinzufuegen' })}`;
}

function renderScreens() {
  const karten = plan.screens
    .map((s) => `<article class="karte karte-screen">
        <header><h3>${label(s.id)}</h3>${aufWandSchalter(s.id)}</header>
        <div class="felder">
          ${feld(t('breite'), `screen:${s.id}:breite`, s.breite)}
          ${feld(t('hoehe'), `screen:${s.id}:hoehe`, s.hoehe)}
          ${feld(t('gewicht'), `screen:${s.id}:gewicht`, s.gewicht)}
          ${feld(t('halterungOffsetVertikal'), `screen:${s.id}:halterungOffsetVertikal`, s.halterungOffsetVertikal)}
          ${feld(t('halterungAbstandHorizontal'), `screen:${s.id}:halterungAbstandHorizontal`, s.halterungAbstandHorizontal)}
        </div></article>`)
    .join('');
  $('#screens').innerHTML = `<h2>${esc(t('abschnittScreens'))}</h2>${karten}`;
}

// --- Ergebnisse ------------------------------------------------------------

function renderHinweise(ergebnis) {
  const eintraege = [
    ...ergebnis.fehler.map((f) => ({ ...f, stufe: 'fehler' })),
    ...ergebnis.warnungen.map((w) => ({ ...w, stufe: 'warnung' })),
  ];
  const liste = eintraege.length
    ? `<ul class="hinweise">${eintraege
        .map((h) => `<li class="${h.stufe}"><span class="stufe">${esc(t(h.stufe))}</span>
          <strong>${esc(bezeichnung(h.elementId, h.werkId))}:</strong> ${esc(t(h.code, h.werte))}</li>`)
        .join('')}</ul>`
    : `<p class="alles-ok">${esc(t('keineHinweise'))}</p>`;
  const anzahl = eintraege.length ? ` <span class="zaehler">${eintraege.length}</span>` : '';
  $('#hinweise').innerHTML = `<h2>${esc(t('abschnittHinweise'))}${anzahl}</h2>${liste}`;
}

function renderTabelle(ergebnis) {
  const seite = ergebnis.seiten[0];
  const abstand = seite && seite.abstand != null ? `<p class="info">${esc(t('abstandInfo', { abstand: seite.abstand }))}</p>` : '';
  const gruppen = (seite?.elemente || [])
    .map((el) => `<tbody>${el.punkte
      .map((p) => `<tr>
        <td>${esc(bezeichnung(el.elementId, p.werkId))}</td>
        <td class="zahl">${p.nr}</td>
        <td>${esc(t(p.art))}</td>
        <td class="zahl">${formatCm(p.x)}</td>
        <td class="zahl">${formatCm(p.hoehe)}</td></tr>`)
      .join('')}</tbody>`)
    .join('');
  const tabelle = gruppen
    ? `<div class="tabelle-rahmen"><table>
        <thead><tr><th>${esc(t('spalteElement'))}</th><th class="zahl">${esc(t('spalteNr'))}</th><th>${esc(t('spalteArt'))}</th>
          <th class="zahl"><span class="lang">${esc(t('spalteX'))}</span><span class="kurz">${esc(t('spalteXKurz'))}</span></th>
          <th class="zahl"><span class="lang">${esc(t('spalteHoehe'))}</span><span class="kurz">${esc(t('spalteHoeheKurz'))}</span></th></tr></thead>
        ${gruppen}</table></div>`
    : `<p class="leer">${esc(t('keinePunkte'))}</p>`;
  $('#ergebnis').innerHTML = `<h2>${esc(t('abschnittErgebnis'))}</h2>${abstand}${tabelle}`;
}

function renderVorschau(ergebnis) {
  const seite = ergebnis.seiten[0];
  const e = einstellungen(plan);
  const svg = seite
    ? erzeugeVorschau(seite, {
        mittelhoehe: e.mittelhoehe,
        minBodenabstand: e.minBodenabstand,
        name,
        texte: { mittellinie: t('vorschauMittellinie', { m: e.mittelhoehe }), beschreibung: t('vorschauBeschreibung') },
      })
    : '';
  $('#vorschau').innerHTML = `<h2>${esc(t('abschnittVorschau'))}</h2>
    <div class="vorschau-rahmen">${svg}</div>
    <div class="legende">
      <span><i class="werk"></i>${esc(t('vorschauLegendeWerk'))}</span>
      <span><i class="screen"></i>${esc(t('vorschauLegendeScreen'))}</span>
      <span><i class="punkt"></i>${esc(t('vorschauLegendePunkt'))}</span>
    </div>`;
}

function renderErgebnis() {
  const ergebnis = berechnePlan(plan);
  renderVorschau(ergebnis);
  renderHinweise(ergebnis);
  renderTabelle(ergebnis);
}

function aktualisiereLabels() {
  document.querySelectorAll('[data-label]').forEach((el) => {
    el.textContent = name(el.dataset.label);
  });
}

// Merkt sich das fokussierte Feld, damit es nach dem Neuzeichnen wieder aktiv ist.
function fokusSchluessel(el) {
  if (!el || el === document.body) return null;
  for (const attr of ['ziel', 'raster', 'rastergroesse', 'aufwand']) {
    if (el.dataset[attr]) return `[data-${attr}="${CSS.escape(el.dataset[attr])}"]`;
  }
  if (el.dataset.aktion) {
    return `[data-aktion="${CSS.escape(el.dataset.aktion)}"][data-id="${CSS.escape(el.dataset.id || '')}"]`;
  }
  return null;
}

function renderAlles() {
  const fokus = fokusSchluessel(document.activeElement);
  renderAusstellung();
  renderWand();
  renderReihenfolge();
  renderWerke();
  renderGruppen();
  renderScreens();
  renderErgebnis();
  if (fokus) document.querySelector(fokus)?.focus();
}

// --- Änderungen ------------------------------------------------------------

function speichern() {}

// struktur = Formulare neu zeichnen (z. B. neues Werk); sonst nur Ergebnisse und Namen aktualisieren
function geaendert({ struktur = false } = {}) {
  speichern();
  if (struktur) {
    renderAlles();
  } else {
    aktualisiereLabels();
    renderErgebnis();
  }
}

function setzeFeld(el) {
  const [art, id, feldName] = el.dataset.ziel.split(':');
  const ziel = zielObjekt(art, id);
  if (!ziel) return;
  if (el.dataset.art === 'zahl') {
    const zahl = leseZahl(el.value);
    const ungueltig = el.value.trim() !== '' && zahl === null;
    el.classList.toggle('ungueltig', ungueltig);
    el.title = ungueltig ? t('zahlUngueltig') : '';
    ziel[feldName] = zahl;
  } else {
    ziel[feldName] = el.value;
  }
}

const aktionen = {
  hoch: (id) => D.verschiebe(plan, id, -1),
  runter: (id) => D.verschiebe(plan, id, +1),
  entfernen: (id) => D.setzeAufWand(plan, id, false),
  werkNeu: () => {
    const werk = D.werkHinzufuegen(plan);
    return () => document.querySelector(`[data-ziel="werk:${werk.id}:titel"]`)?.focus();
  },
  werkLoeschen: (id) => {
    if (!confirm(t('werkLoeschenFrage', { name: name(id) }))) return false;
    D.werkLoeschen(plan, id);
  },
  gruppeNeu: () => {
    D.gruppeHinzufuegen(plan);
  },
  gruppeLoeschen: (id) => {
    if (!confirm(t('gruppeLoeschenFrage', { name: name(id) }))) return false;
    D.gruppeLoeschen(plan, id);
  },
};

function fuehreAus(aktion, id) {
  const danach = aktionen[aktion]?.(id);
  if (danach === false) return;
  geaendert({ struktur: true });
  if (typeof danach === 'function') danach();
}

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.matches('input[type="text"][data-ziel]')) {
    setzeFeld(el);
    geaendert();
  }
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.matches('select[data-ziel]')) {
    setzeFeld(el);
    geaendert({ struktur: true });
  } else if (el.dataset.aufwand) {
    D.setzeAufWand(plan, el.dataset.aufwand, el.checked);
    geaendert({ struktur: true });
  } else if (el.dataset.raster) {
    const [gruppeId, r, c] = el.dataset.raster.split(':');
    D.setzeRasterZelle(plan, gruppeId, Number(r), Number(c), el.value || null);
    geaendert({ struktur: true });
  } else if (el.dataset.rastergroesse) {
    const [gruppeId, welche] = el.dataset.rastergroesse.split(':');
    const g = D.findeGruppe(plan, gruppeId);
    const n = Number(el.value);
    D.setzeRastergroesse(plan, gruppeId, welche === 'zeilen' ? n : g.zeilen, welche === 'spalten' ? n : g.spalten);
    geaendert({ struktur: true });
  }
});

document.addEventListener('click', (e) => {
  const k = e.target.closest('button[data-aktion]');
  if (k) fuehreAus(k.dataset.aktion, k.dataset.id);
});

// Pfeiltasten in der Reihenfolge-Liste: ↑/↓ verschiebt das Element, auf dem der Fokus steht.
document.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
  const zeile = e.target.closest?.('.reihenfolge li');
  if (!zeile) return;
  e.preventDefault();
  fuehreAus(e.key === 'ArrowUp' ? 'hoch' : 'runter', zeile.dataset.element);
});

// --- Start -----------------------------------------------------------------

function start() {
  document.title = t('appTitel');
  document.querySelectorAll('[data-text]').forEach((el) => {
    el.textContent = t(el.dataset.text);
  });
  renderAlles();
}

start();
