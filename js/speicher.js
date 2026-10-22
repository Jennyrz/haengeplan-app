// Speicherort der Ausstellungen (Pläne).
// Etappe 1: im Browser (localStorage). Etappe 2 ersetzt nur diese Datei durch einen Online-Speicher
// mit derselben Schnittstelle; alle Funktionen sind deshalb schon jetzt asynchron.

const PRAEFIX = 'artboxy-haengeplan:plan:';
const ZULETZT = 'artboxy-haengeplan:zuletzt';
const ALT = 'artboxy-haengeplan'; // Speicherort der allerersten Version (nur ein Plan)

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

export function neueId() {
  return crypto.randomUUID ? crypto.randomUUID() : `p${Date.now()}${Math.random().toString(16).slice(2)}`;
}

// Liste aller Pläne: [{ id, name, geaendert }], zuletzt geänderte zuerst
export async function listePlaene() {
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
  try {
    return JSON.parse(lies(PRAEFIX + id))?.plan ?? null;
  } catch {
    return null;
  }
}

export async function speicherePlan(id, plan) {
  localStorage.setItem(PRAEFIX + id, JSON.stringify({ geaendert: Date.now(), plan }));
}

export async function loeschePlan(id) {
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
