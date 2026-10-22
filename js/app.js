// Oberfläche: zeigt die Formulare, schreibt Eingaben in den Plan, ruft calc.js auf und zeigt die Ergebnisse.
// Die Rechnung selbst steckt ausschliesslich in calc.js, das Speichern in speicher.js.

import { berechnePlan, einstellungen, formatCm } from './calc.js';
import { erzeugeVorschau } from './vorschau.js';
import { t } from './texte.js';
import * as D from './daten.js';
import * as S from './speicher.js';

// --- Zustand ---------------------------------------------------------------

let plan = D.neuerPlan();
let planId = null;
let planListe = []; // [{ id, name, geaendert }]
let aktiveSeiteId = plan.waende[0].seiten[0].id;
let werkFilter = 'alle';
let person = null; // angemeldete Person { email } (nur online)

const $ = (selektor) => document.querySelector(selektor);

// --- Hilfsfunktionen -------------------------------------------------------

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

function aktiverOrt() {
  return D.findeSeite(plan, aktiveSeiteId) ?? D.alleSeiten(plan)[0];
}

// „Wand 1 · innen“ (bei nur einer Seite einfach „Wand 1“)
function seitenName(wand, seite) {
  const wandName = wand.name?.trim() || wand.id;
  return wand.seiten.length > 1 ? `${wandName} · ${seite.bezeichnung?.trim() || seite.id}` : wandName;
}

// Anzeigename eines Werks, einer Gruppe, eines Screens, einer Wand oder Seite
function name(id) {
  if (id === 'plan') return plan.ausstellung.name?.trim() || t('ausstellungOhneName');
  const werk = D.findeWerk(plan, id);
  if (werk) return werk.titel?.trim() || t('werkOhneTitel', { id });
  if (D.findeGruppe(plan, id)) return t('gruppeName', { id });
  const screen = D.findeScreen(plan, id);
  if (screen) return screen.ausrichtung === 'hoch' ? t('screenHoch') : t('screenQuer');
  const wand = D.findeWand(plan, id);
  if (wand) return wand.name?.trim() || id;
  const ort = D.findeSeite(plan, id);
  if (ort) return seitenName(ort.wand, ort.seite);
  return id;
}

// „Gruppe g1 › Titel“ für Werke in Gruppen, sonst nur der Name
function bezeichnung(h) {
  if (!h.elementId && !h.werkId) return h.seiteId ? name(h.seiteId) : '';
  if (h.werkId && h.elementId && h.werkId !== h.elementId) return `${name(h.elementId)} › ${name(h.werkId)}`;
  return name(h.elementId ?? h.werkId);
}

function typ(id) {
  if (D.findeWerk(plan, id)) return 'werk';
  if (D.findeGruppe(plan, id)) return 'gruppe';
  return 'screen';
}

// Name, der sich beim Tippen sofort überall mitändert
function label(id) {
  return `<span data-label="${esc(id)}">${esc(name(id))}</span>`;
}

function feld(beschriftung, ziel, wert, art = 'zahl') {
  const wertText = art === 'zahl' ? zahlText(wert) : wert ?? '';
  const extra = art === 'zahl' ? ' inputmode="decimal" autocomplete="off"' : ' autocomplete="off"';
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

// Auswahl, auf welcher Wandseite ein Element hängt
function platzWahl(id) {
  const aktuell = D.platzierungVon(plan, id)?.seite.id ?? '';
  const optionen = [['', t('nichtPlatziert')], ...D.alleSeiten(plan).map(({ wand, seite }) => [seite.id, seitenName(wand, seite)])];
  return `<label class="feld platz"><span>${esc(t('platzierung'))}</span>
    <select data-platz="${esc(id)}">${optionen
      .map(([v, txt]) => `<option value="${esc(v)}"${v === aktuell ? ' selected' : ''}${v ? ` data-label="${esc(v)}"` : ''}>${esc(txt)}</option>`)
      .join('')}</select></label>`;
}

function knopf(aktion, inhalt, { id = '', titel = '', klasse = '', extra = '' } = {}) {
  const attr = titel ? ` title="${esc(titel)}" aria-label="${esc(titel)}"` : '';
  return `<button type="button" class="${klasse}" data-aktion="${aktion}" data-id="${esc(id)}"${attr}${extra}>${inhalt}</button>`;
}

function zielObjekt(art, id) {
  if (art === 'ausstellung') return plan.ausstellung;
  if (art === 'wand') return D.findeWand(plan, id);
  if (art === 'seite') return D.findeSeite(plan, id)?.seite;
  if (art === 'werk') return D.findeWerk(plan, id);
  if (art === 'gruppe') return D.findeGruppe(plan, id);
  if (art === 'screen') return D.findeScreen(plan, id);
  return null;
}

// --- Kopfzeile: Ausstellungen ----------------------------------------------

function renderKopf() {
  const optionen = planListe
    .map((p) => {
      const istAktiv = p.id === planId;
      const text = istAktiv ? name('plan') : p.name || t('ausstellungOhneName');
      return `<option value="${esc(p.id)}"${istAktiv ? ' selected data-label="plan"' : ''}>${esc(text)}</option>`;
    })
    .join('');
  $('#werkzeuge').innerHTML = `
    <label class="feld planwahl"><span>${esc(t('ausstellungWaehlen'))}</span><select id="planwahl">${optionen}</select></label>
    <div class="werkzeug-knoepfe">
      ${knopf('ausstellungNeu', esc(t('ausstellungNeu')), { klasse: 'primaer' })}
      ${knopf('ausstellungDuplizieren', esc(t('ausstellungDuplizieren')))}
      ${knopf('ausstellungLoeschen', esc(t('ausstellungLoeschen')), { klasse: 'gefahr' })}
    </div>
    <span class="status" id="status" role="status"></span>
    ${person ? `<span class="person">${esc(t('angemeldetAls', { email: person.email }))} ${knopf('abmelden', esc(t('abmelden')))}</span>` : ''}`;
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

function renderWaende() {
  const { wand, seite } = aktiverOrt();
  const wandTabs = plan.waende
    .map((w) => `<button type="button" role="tab" class="tab${w.id === wand.id ? ' aktiv' : ''}" aria-selected="${w.id === wand.id}"
        data-aktion="wandWaehlen" data-id="${esc(w.id)}">${label(w.id)}<span class="badge" data-badge="${esc(w.id)}"></span></button>`)
    .join('');
  const seitenTabs = wand.seiten
    .map((s) => `<button type="button" role="tab" class="tab klein${s.id === seite.id ? ' aktiv' : ''}" aria-selected="${s.id === seite.id}"
        data-aktion="seiteWaehlen" data-id="${esc(s.id)}"><span data-label="${esc(s.id)}-bez">${esc(s.bezeichnung || s.id)}</span></button>`)
    .join('');
  $('#waende').innerHTML = `<h2>${esc(t('abschnittWaende'))}</h2>
    <div class="tabs" role="tablist">${wandTabs}${knopf('wandNeu', esc(t('wandNeu')), { klasse: 'tab tab-neu' })}</div>
    <div class="felder">
      ${feld(t('wandName'), `wand:${wand.id}:name`, wand.name, 'text')}
      ${feld(t('wandLaenge'), `wand:${wand.id}:laenge`, wand.laenge)}
      ${feld(t('wandHoehe'), `wand:${wand.id}:hoehe`, wand.hoehe)}
    </div>
    <div class="seiten-block">
      <span class="unterlabel">${esc(t('seiten'))}</span>
      <div class="tabs" role="tablist">${seitenTabs}${knopf('seiteNeu', esc(t('seiteNeu')), { id: wand.id, klasse: 'tab klein tab-neu' })}</div>
      <div class="felder">
        ${feld(t('seiteBezeichnung'), `seite:${seite.id}:bezeichnung`, seite.bezeichnung, 'text')}
        <label class="schalter"><input type="checkbox" data-bespielbar="${esc(seite.id)}"${seite.bespielbar !== false ? ' checked' : ''}> ${esc(t('seiteBespielbar'))}</label>
      </div>
    </div>
    <div class="leise-knoepfe">
      ${wand.seiten.length > 1 ? knopf('seiteLoeschen', esc(t('seiteLoeschen')), { id: seite.id, klasse: 'klein gefahr' }) : ''}
      ${plan.waende.length > 1 ? knopf('wandLoeschen', esc(t('wandLoeschen')), { id: wand.id, klasse: 'klein gefahr' }) : ''}
    </div>`;
}

function renderReihenfolge() {
  const { seite } = aktiverOrt();
  const liste = seite.elemente;
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
  const offen = D.nichtPlatziert(plan);
  const holen = offen.length
    ? `<select class="holen" data-holen="1" aria-label="${esc(t('elementHinzufuegen'))}">
        <option value="">${esc(t('elementHinzufuegen'))}</option>
        ${offen.map((id) => `<option value="${esc(id)}" data-label="${esc(id)}">${esc(name(id))}</option>`).join('')}</select>`
    : '';
  $('#reihenfolge').innerHTML = `<h2>${esc(t('abschnittReihenfolge'))}: ${label(seite.id)}</h2>
    <p class="hilfe">${esc(t('reihenfolgeHilfe'))}</p>${inhalt}${holen}`;
}

function werkSichtbar(w) {
  if (werkFilter === 'alle') return true;
  const gruppe = D.gruppeVonWerk(plan, w.id);
  const ort = D.platzierungVon(plan, gruppe ? gruppe.id : w.id);
  if (werkFilter === 'offen') return !ort;
  return ort?.seite.id === aktiveSeiteId;
}

function renderWerke() {
  const sichtbar = plan.werke.filter(werkSichtbar);
  const karten = sichtbar
    .map((w) => {
      const gruppe = D.gruppeVonWerk(plan, w.id);
      const platz = gruppe
        ? `<span class="hinweis-klein">${esc(t('inGruppe', { gruppe: name(gruppe.id) }))}</span>`
        : platzWahl(w.id);
      return `<article class="karte" data-werk="${esc(w.id)}">
        <header><h3>${label(w.id)}</h3>
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
          ${platz}
        </div></article>`;
    })
    .join('');
  const filter = plan.werke.length
    ? `<label class="feld filter"><span>${esc(t('filter'))}</span><select data-filter="1">
        ${[['alle', t('filterAlle')], ['seite', t('filterSeite')], ['offen', t('filterOffen')]]
          .map(([v, txt]) => `<option value="${v}"${v === werkFilter ? ' selected' : ''}>${esc(txt)}</option>`)
          .join('')}</select></label>`
    : '';
  const leer = plan.werke.length ? t('keineTreffer') : t('keineWerke');
  $('#werke').innerHTML = `<h2>${esc(t('abschnittWerke'))} <span class="anzahl">${plan.werke.length}</span></h2>
    ${filter}
    ${karten || `<p class="leer">${esc(leer)}</p>`}
    ${knopf('werkNeu', esc(t('werkHinzufuegen')), { klasse: 'hinzufuegen' })}`;
}

function renderGruppen() {
  const bis6 = [1, 2, 3, 4, 5, 6];
  const karten = plan.gruppen
    .map((g) => {
      // Wählbar: Werke, die in keiner Gruppe stecken, plus die Werke dieser Gruppe
      const frei = plan.werke.filter((w) => {
        const drin = D.gruppeVonWerk(plan, w.id);
        return !drin || drin.id === g.id;
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
        <header><h3>${label(g.id)}</h3>
          ${knopf('gruppeLoeschen', esc(t('loeschen')), { id: g.id, klasse: 'klein gefahr' })}</header>
        <div class="felder">
          ${platzWahl(g.id)}
          <label class="feld"><span>${esc(t('zeilen'))}</span><select data-rastergroesse="${esc(g.id)}:zeilen">
            ${bis6.map((v) => `<option${v === g.zeilen ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
          <label class="feld"><span>${esc(t('spalten'))}</span><select data-rastergroesse="${esc(g.id)}:spalten">
            ${bis6.map((v) => `<option${v === g.spalten ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
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
        <header><h3>${label(s.id)}</h3></header>
        <div class="felder">
          ${platzWahl(s.id)}
          ${feld(t('breite'), `screen:${s.id}:breite`, s.breite)}
          ${feld(t('hoehe'), `screen:${s.id}:hoehe`, s.hoehe)}
          ${feld(t('gewicht'), `screen:${s.id}:gewicht`, s.gewicht)}
          ${feld(t('halterungOffsetVertikal'), `screen:${s.id}:halterungOffsetVertikal`, s.halterungOffsetVertikal)}
          ${feld(t('halterungAbstandHorizontal'), `screen:${s.id}:halterungAbstandHorizontal`, s.halterungAbstandHorizontal)}
        </div></article>`)
    .join('');
  $('#screens').innerHTML = `<h2>${esc(t('abschnittScreens'))}</h2>${karten}`;
}

// --- Ergebnisse (immer für die gewählte Wandseite) -------------------------

function renderHinweise(ergebnis) {
  const alle = [
    ...ergebnis.fehler.map((f) => ({ ...f, stufe: 'fehler' })),
    ...ergebnis.warnungen.map((w) => ({ ...w, stufe: 'warnung' })),
  ];
  // Hier: Hinweise dieser Seite plus allgemeine (z. B. nicht platzierte Screens)
  const eintraege = alle.filter((h) => !h.seiteId || h.seiteId === aktiveSeiteId);
  const andere = alle.length - eintraege.length;

  // Zähler an den Wand-Reitern
  document.querySelectorAll('[data-badge]').forEach((el) => {
    const n = alle.filter((h) => h.wandId === el.dataset.badge).length;
    el.textContent = n ? String(n) : '';
  });

  const liste = eintraege.length
    ? `<ul class="hinweise">${eintraege
        .map((h) => `<li class="${h.stufe}"><span class="stufe">${esc(t(h.stufe))}</span>
          <strong>${esc(bezeichnung(h))}:</strong> ${esc(t(h.code, h.werte))}</li>`)
        .join('')}</ul>`
    : `<p class="alles-ok">${esc(t('keineHinweise'))}</p>`;
  const weitere = andere ? `<p class="info">${esc(t('hinweiseAndereWaende', { anzahl: String(andere) }))}</p>` : '';
  const anzahl = eintraege.length ? ` <span class="zaehler">${eintraege.length}</span>` : '';
  $('#hinweise').innerHTML = `<h2>${esc(t('abschnittHinweise'))}${anzahl}</h2>${liste}${weitere}`;
}

function renderTabelle(seite) {
  const abstand = seite && seite.abstand != null ? `<p class="info">${esc(t('abstandInfo', { abstand: seite.abstand }))}</p>` : '';
  const gruppen = (seite?.elemente || [])
    .map((el) => `<tbody>${el.punkte
      .map((p) => `<tr>
        <td>${esc(bezeichnung({ elementId: el.elementId, werkId: p.werkId }))}</td>
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
  $('#ergebnis').innerHTML = `<h2>${esc(t('abschnittErgebnis'))}: ${label(aktiveSeiteId)}</h2>${abstand}${tabelle}`;
}

function renderVorschau(seite) {
  const e = einstellungen(plan);
  const inhalt = seite
    ? `<div class="vorschau-rahmen">${erzeugeVorschau(seite, {
        mittelhoehe: e.mittelhoehe,
        minBodenabstand: e.minBodenabstand,
        name,
        texte: { mittellinie: t('vorschauMittellinie', { m: e.mittelhoehe }), beschreibung: t('vorschauBeschreibung') },
      })}</div>
      <div class="legende">
        <span><i class="werk"></i>${esc(t('vorschauLegendeWerk'))}</span>
        <span><i class="screen"></i>${esc(t('vorschauLegendeScreen'))}</span>
        <span><i class="punkt"></i>${esc(t('vorschauLegendePunkt'))}</span>
      </div>`
    : `<p class="leer">${esc(t('seiteNichtBespielbar'))}</p>`;
  $('#vorschau').innerHTML = `<h2>${esc(t('abschnittVorschau'))}: ${label(aktiveSeiteId)}</h2>${inhalt}`;
}

function renderErgebnis() {
  const ergebnis = berechnePlan(plan);
  const seite = ergebnis.seiten.find((s) => s.seiteId === aktiveSeiteId);
  renderVorschau(seite);
  renderHinweise(ergebnis);
  renderTabelle(seite);
}

function aktualisiereLabels() {
  document.querySelectorAll('[data-label]').forEach((el) => {
    const id = el.dataset.label;
    if (id.endsWith('-bez')) {
      const seite = D.findeSeite(plan, id.slice(0, -4))?.seite;
      el.textContent = seite?.bezeichnung || seite?.id || '';
    } else {
      el.textContent = name(id);
    }
  });
}

// Merkt sich das fokussierte Feld, damit es nach dem Neuzeichnen wieder aktiv ist.
function fokusSchluessel(el) {
  if (!el || el === document.body) return null;
  for (const attr of ['ziel', 'raster', 'rastergroesse', 'platz', 'bespielbar', 'filter']) {
    if (el.dataset[attr]) return `[data-${attr}="${CSS.escape(el.dataset[attr])}"]`;
  }
  if (el.dataset.aktion) {
    return `[data-aktion="${CSS.escape(el.dataset.aktion)}"][data-id="${CSS.escape(el.dataset.id || '')}"]`;
  }
  return null;
}

function renderAlles() {
  if (!D.findeSeite(plan, aktiveSeiteId)) aktiveSeiteId = D.alleSeiten(plan)[0].seite.id;
  const fokus = fokusSchluessel(document.activeElement);
  renderKopf();
  renderAusstellung();
  renderWaende();
  renderReihenfolge();
  renderWerke();
  renderGruppen();
  renderScreens();
  renderErgebnis();
  if (fokus) document.querySelector(fokus)?.focus({ preventScroll: true });
}

// --- Speichern -------------------------------------------------------------

let speicherTimer = null;
let speicherLaeuft = Promise.resolve();

function zeigeStatus(text, problem = false) {
  const el = $('#status');
  if (!el) return;
  el.textContent = text;
  el.classList.toggle('problem', problem);
}

// Speichert kurz nach der letzten Änderung (damit nicht bei jedem Tastendruck)
function speichernBald() {
  zeigeStatus(t('speichertGerade'));
  clearTimeout(speicherTimer);
  speicherTimer = setTimeout(speichernJetzt, 400);
}

function speichernJetzt() {
  clearTimeout(speicherTimer);
  speicherTimer = null;
  const id = planId;
  const daten = D.kopiere(plan);
  speicherLaeuft = speicherLaeuft
    .then(() => S.speicherePlan(id, daten))
    .then(() => {
      const eintrag = planListe.find((p) => p.id === id);
      if (eintrag) eintrag.name = daten.ausstellung.name;
      if (id === planId) zeigeStatus(t('gespeichert'));
    })
    .catch(() => zeigeStatus(t('speichernFehlgeschlagen'), true));
  return speicherLaeuft;
}

// Vor dem Wechseln der Ausstellung: noch offene Änderungen sicher speichern
async function ausstehendesSpeichern() {
  if (speicherTimer) await speichernJetzt();
  await speicherLaeuft;
}

// --- Ausstellungen öffnen, anlegen, löschen --------------------------------

async function ladeListe() {
  planListe = await S.listePlaene();
}

async function oeffnePlan(id) {
  await ausstehendesSpeichern();
  let neu;
  try {
    neu = D.normalisierePlan(await S.ladePlan(id));
  } catch {
    alert(t('ladenFehlgeschlagen'));
    return;
  }
  plan = neu;
  planId = id;
  aktiveSeiteId = D.alleSeiten(plan)[0].seite.id;
  werkFilter = 'alle';
  S.merkeZuletzt(id);
  renderAlles();
  zeigeStatus(t('gespeichert'));
}

async function legePlanAn(neuerPlan) {
  await ausstehendesSpeichern();
  planId = S.neueId();
  plan = neuerPlan;
  aktiveSeiteId = D.alleSeiten(plan)[0].seite.id;
  werkFilter = 'alle';
  planListe.unshift({ id: planId, name: plan.ausstellung.name, geaendert: Date.now() });
  S.merkeZuletzt(planId);
  await speichernJetzt();
  renderAlles();
  zeigeStatus(t('gespeichert'));
}

// --- Aktionen --------------------------------------------------------------

// Rückgabe false = nichts geändert; eine Funktion = danach ausführen (z. B. Fokus setzen)
const aktionen = {
  hoch: (id) => D.verschiebe(plan, id, -1),
  runter: (id) => D.verschiebe(plan, id, +1),
  entfernen: (id) => D.platziere(plan, id, null),

  wandWaehlen: (id) => {
    aktiveSeiteId = D.findeWand(plan, id).seiten[0].id;
    return 'nurAnzeige';
  },
  seiteWaehlen: (id) => {
    aktiveSeiteId = id;
    return 'nurAnzeige';
  },
  wandNeu: () => {
    const wand = D.wandHinzufuegen(plan);
    aktiveSeiteId = wand.seiten[0].id;
    return () => document.querySelector(`[data-ziel="wand:${wand.id}:name"]`)?.select();
  },
  wandLoeschen: (id) => {
    if (!confirm(t('wandLoeschenFrage', { name: name(id) }))) return false;
    D.wandLoeschen(plan, id);
  },
  seiteNeu: (wandId) => {
    const seite = D.seiteHinzufuegen(plan, wandId);
    aktiveSeiteId = seite.id;
  },
  seiteLoeschen: (id) => {
    if (!confirm(t('seiteLoeschenFrage', { name: name(id) }))) return false;
    D.seiteLoeschen(plan, id);
  },

  werkNeu: () => {
    const werk = D.werkHinzufuegen(plan, aktiveSeiteId);
    if (werkFilter === 'offen') werkFilter = 'alle';
    return () => document.querySelector(`[data-ziel="werk:${werk.id}:titel"]`)?.focus();
  },
  werkLoeschen: (id) => {
    if (!confirm(t('werkLoeschenFrage', { name: name(id) }))) return false;
    D.werkLoeschen(plan, id);
  },
  gruppeNeu: () => {
    D.gruppeHinzufuegen(plan, aktiveSeiteId);
  },
  gruppeLoeschen: (id) => {
    if (!confirm(t('gruppeLoeschenFrage', { name: name(id) }))) return false;
    D.gruppeLoeschen(plan, id);
  },

  ausstellungNeu: async () => {
    const eingabe = prompt(t('ausstellungNeuFrage'), '');
    if (eingabe === null) return false;
    await legePlanAn(D.neuerPlan(eingabe.trim()));
    return false;
  },
  ausstellungDuplizieren: async () => {
    const kopie = D.kopiere(plan);
    kopie.ausstellung.name = t('ausstellungKopie', { name: name('plan') });
    await legePlanAn(kopie);
    return false;
  },
  ausstellungLoeschen: async () => {
    if (!confirm(t('ausstellungLoeschenFrage', { name: name('plan') }))) return false;
    clearTimeout(speicherTimer);
    speicherTimer = null;
    await speicherLaeuft;
    await S.loeschePlan(planId);
    planListe = planListe.filter((p) => p.id !== planId);
    if (planListe.length) await oeffnePlan(planListe[0].id);
    else await legePlanAn(D.neuerPlan());
    return false;
  },
  abmelden: async () => {
    await ausstehendesSpeichern();
    await S.abmelden();
    location.reload();
    return false;
  },
};

async function fuehreAus(aktion, id) {
  const danach = await aktionen[aktion]?.(id);
  if (danach === false) return;
  if (danach !== 'nurAnzeige') speichernBald();
  renderAlles();
  if (typeof danach === 'function') danach();
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

// Strukturänderung: speichern und alles neu zeichnen
function strukturGeaendert() {
  speichernBald();
  renderAlles();
}

// --- Ereignisse ------------------------------------------------------------

document.addEventListener('input', (e) => {
  const el = e.target;
  if (el.matches('input[type="text"][data-ziel]')) {
    setzeFeld(el);
    speichernBald();
    aktualisiereLabels();
    renderErgebnis();
  }
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.id === 'planwahl') {
    oeffnePlan(el.value);
  } else if (el.matches('select[data-ziel]')) {
    setzeFeld(el);
    strukturGeaendert();
  } else if (el.dataset.platz) {
    D.platziere(plan, el.dataset.platz, el.value || null);
    strukturGeaendert();
  } else if (el.dataset.holen && el.value) {
    D.platziere(plan, el.value, aktiveSeiteId);
    strukturGeaendert();
  } else if (el.dataset.bespielbar) {
    D.findeSeite(plan, el.dataset.bespielbar).seite.bespielbar = el.checked;
    strukturGeaendert();
  } else if (el.dataset.filter) {
    werkFilter = el.value;
    renderAlles();
  } else if (el.dataset.raster) {
    const [gruppeId, r, c] = el.dataset.raster.split(':');
    D.setzeRasterZelle(plan, gruppeId, Number(r), Number(c), el.value || null);
    strukturGeaendert();
  } else if (el.dataset.rastergroesse) {
    const [gruppeId, welche] = el.dataset.rastergroesse.split(':');
    const g = D.findeGruppe(plan, gruppeId);
    const n = Number(el.value);
    D.setzeRastergroesse(plan, gruppeId, welche === 'zeilen' ? n : g.zeilen, welche === 'spalten' ? n : g.spalten);
    strukturGeaendert();
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

// Beim Schliessen oder Wegwechseln: offene Änderung sofort speichern
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && speicherTimer) speichernJetzt();
});
window.addEventListener('pagehide', () => {
  if (speicherTimer) speichernJetzt();
});

// --- Anmeldung -------------------------------------------------------------

// modus: 'anmelden' | 'vergessen' | 'festlegen'
function renderAnmeldung(modus, meldung = '', problem = false) {
  const felder = {
    anmelden: `${anmeldeFeld('email', 'email', 'username')}${anmeldeFeld('passwort', 'password', 'current-password')}`,
    vergessen: anmeldeFeld('email', 'email', 'username'),
    festlegen: anmeldeFeld('neuesPasswort', 'password', 'new-password'),
  }[modus];
  const titel = { anmelden: 'anmeldenTitel', vergessen: 'passwortVergessenTitel', festlegen: 'passwortFestlegenTitel' }[modus];
  const hilfe = { anmelden: 'anmeldenHilfe', vergessen: 'passwortVergessenHilfe', festlegen: 'passwortFestlegenHilfe' }[modus];
  const absenden = { anmelden: 'anmelden', vergessen: 'linkSenden', festlegen: 'passwortSpeichern' }[modus];
  const link = {
    anmelden: `<button type="button" class="link" data-modus="vergessen">${esc(t('passwortVergessen'))}</button>`,
    vergessen: `<button type="button" class="link" data-modus="anmelden">${esc(t('zurueckZurAnmeldung'))}</button>`,
    festlegen: '',
  }[modus];
  const el = $('#anmeldung');
  el.hidden = false;
  el.innerHTML = `<form class="anmeldeformular" data-modus="${modus}">
      <h2>${esc(t(titel))}</h2>
      <p class="hilfe">${esc(t(hilfe))}</p>
      ${felder}
      <p class="meldung${problem ? ' problem' : ''}" role="status">${esc(meldung)}</p>
      <button type="submit" class="primaer">${esc(t(absenden))}</button>
      ${link}
    </form>`;
  el.querySelector('input')?.focus();
}

function anmeldeFeld(text, typ, autocomplete) {
  return `<label class="feld"><span>${esc(t(text))}</span><input type="${typ}" name="${typ}" autocomplete="${autocomplete}" required></label>`;
}

document.addEventListener('submit', async (e) => {
  const form = e.target.closest('.anmeldeformular');
  if (!form) return;
  e.preventDefault();
  const modus = form.dataset.modus;
  const email = form.elements.email?.value.trim();
  const passwort = form.elements.password?.value;
  if (modus === 'festlegen' && passwort.length < 8) return renderAnmeldung(modus, t('passwortZuKurz'), true);
  form.querySelector('button[type="submit"]').disabled = true;
  form.querySelector('.meldung').textContent = t('bitteWarten');
  try {
    if (modus === 'anmelden') await S.anmelden(email, passwort);
    if (modus === 'festlegen') await S.passwortFestlegen(passwort);
    if (modus === 'vergessen') {
      await S.passwortVergessen(email);
      return renderAnmeldung('vergessen', t('linkGesendet'));
    }
  } catch {
    const fehler = { anmelden: 'anmeldenFehlgeschlagen', festlegen: 'passwortFehlgeschlagen', vergessen: 'speichernFehlgeschlagen' }[modus];
    return renderAnmeldung(modus, t(fehler), true);
  }
  starteApp();
});

document.addEventListener('click', (e) => {
  const k = e.target.closest('.anmeldeformular button[data-modus]');
  if (k) renderAnmeldung(k.dataset.modus);
});

// --- Start -----------------------------------------------------------------

async function start() {
  document.title = t('appTitel');
  document.querySelectorAll('[data-text]').forEach((el) => {
    el.textContent = t(el.dataset.text);
  });
  if (S.istOnline) {
    person = await S.angemeldetePerson();
    if (S.mussPasswortFestlegen && person) return renderAnmeldung('festlegen');
    if (!person) return renderAnmeldung('anmelden');
  }
  await starteApp();
}

async function starteApp() {
  if (S.istOnline) person = await S.angemeldetePerson();
  $('#anmeldung').hidden = true;
  $('#app').hidden = false;
  $('#sprungleiste').hidden = false;
  try {
    await ladeListe();
  } catch {
    $('#app').innerHTML = `<p class="meldung problem">${esc(t('listeFehlgeschlagen'))}</p>`;
    return;
  }
  const zuletzt = S.zuletztGeoeffnet();
  const id = planListe.some((p) => p.id === zuletzt) ? zuletzt : planListe[0]?.id;
  if (id) await oeffnePlan(id);
  else await legePlanAn(D.neuerPlan());
}

start();
