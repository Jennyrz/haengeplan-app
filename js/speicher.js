// Speicherort der Ausstellungen (Pläne) und Anmeldung.
// Online (Supabase), sobald in config.js Adresse und Schlüssel stehen; sonst nur im Browser (localStorage).
// Beide Varianten haben dieselbe Schnittstelle, der Rest der App merkt keinen Unterschied.

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const PRAEFIX = 'artboxy-haengeplan:plan:';
const ZULETZT = 'artboxy-haengeplan:zuletzt';
const ALT = 'artboxy-haengeplan'; // Speicherort der allerersten Version (nur ein Plan)
const TABELLE = 'ausstellungen';

export const istOnline = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Kam die Person über einen Einladungs- oder „Passwort vergessen“-Link? Dann muss sie ein Passwort festlegen.
// Muss vor dem Verbinden gelesen werden, weil Supabase die Adresse danach aufräumt.
export const mussPasswortFestlegen = /type=(invite|recovery)/.test(location.hash);

let supabase = null;
async function verbindung() {
  if (!supabase) {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm');
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

// Wirft bei einer Antwort mit Fehler, damit die App „Speichern fehlgeschlagen“ zeigen kann
function pruefe({ data, error }) {
  if (error) throw error;
  return data;
}

// --- Anmeldung (nur online) ------------------------------------------------

// Angemeldete Person { email } oder null
export async function angemeldetePerson() {
  if (!istOnline) return null;
  const sb = await verbindung();
  const { data } = await sb.auth.getSession();
  return data.session ? { email: data.session.user.email } : null;
}

export async function anmelden(email, passwort) {
  const sb = await verbindung();
  pruefe(await sb.auth.signInWithPassword({ email, password: passwort }));
}

export async function abmelden() {
  const sb = await verbindung();
  await sb.auth.signOut();
}

export async function passwortFestlegen(passwort) {
  const sb = await verbindung();
  pruefe(await sb.auth.updateUser({ password: passwort }));
}

// Schickt einen Link per E-Mail; er führt zurück in die App, wo ein neues Passwort festgelegt wird
export async function passwortVergessen(email) {
  const sb = await verbindung();
  pruefe(await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }));
}

// --- Pläne -----------------------------------------------------------------

export function neueId() {
  return crypto.randomUUID ? crypto.randomUUID() : `p${Date.now()}${Math.random().toString(16).slice(2)}`;
}

// Liste aller Pläne: [{ id, name, geaendert }], zuletzt geänderte zuerst
export async function listePlaene() {
  if (istOnline) {
    const sb = await verbindung();
    const zeilen = pruefe(await sb.from(TABELLE).select('id, name, geaendert').order('geaendert', { ascending: false }));
    return zeilen.map((z) => ({ id: z.id, name: z.name, geaendert: Date.parse(z.geaendert) }));
  }
  uebernehmeAltenPlan();
  const liste = [];
  for (const schluessel of alleSchluessel()) {
    try {
      const eintrag = JSON.parse(lies(schluessel));
      liste.push({ id: schluessel.slice(PRAEFIX.length), name: eintrag.plan?.ausstellung?.name || '', geaendert: eintrag.geaendert || 0 });
    } catch {
      // beschädigten Eintrag überspringen
    }
  }
  return liste.sort((a, b) => b.geaendert - a.geaendert);
}

// Rohdaten eines Plans (noch ungeprüft) oder null
export async function ladePlan(id) {
  if (istOnline) {
    const sb = await verbindung();
    return pruefe(await sb.from(TABELLE).select('daten').eq('id', id).maybeSingle())?.daten ?? null;
  }
  try {
    return JSON.parse(lies(PRAEFIX + id))?.plan ?? null;
  } catch {
    return null;
  }
}

export async function speicherePlan(id, plan) {
  if (istOnline) {
    const sb = await verbindung();
    const zeile = { id, name: plan.ausstellung?.name || '', daten: plan, geaendert: new Date().toISOString() };
    pruefe(await sb.from(TABELLE).upsert(zeile));
    return;
  }
  localStorage.setItem(PRAEFIX + id, JSON.stringify({ geaendert: Date.now(), plan }));
}

export async function loeschePlan(id) {
  if (istOnline) {
    const sb = await verbindung();
    pruefe(await sb.from(TABELLE).delete().eq('id', id));
    return;
  }
  localStorage.removeItem(PRAEFIX + id);
}

// Merkt sich, welcher Plan zuletzt offen war (pro Gerät)
export function zuletztGeoeffnet() {
  return lies(ZULETZT);
}

export function merkeZuletzt(id) {
  try {
    localStorage.setItem(ZULETZT, id);
  } catch {
    // egal, nur Komfort
  }
}

// --- Hilfsfunktionen Browser-Speicher --------------------------------------

function lies(schluessel) {
  try {
    return localStorage.getItem(schluessel);
  } catch {
    return null;
  }
}

function alleSchluessel() {
  try {
    return Object.keys(localStorage).filter((k) => k.startsWith(PRAEFIX));
  } catch {
    return [];
  }
}

// Einmalig: Plan aus der ersten Version (ein einziger Plan) in die Liste übernehmen
function uebernehmeAltenPlan() {
  const alt = lies(ALT);
  if (!alt) return;
  try {
    localStorage.setItem(PRAEFIX + neueId(), JSON.stringify({ geaendert: Date.now(), plan: JSON.parse(alt) }));
    localStorage.removeItem(ALT);
  } catch {
    // Übernahme nicht möglich: alten Eintrag stehen lassen
  }
}
