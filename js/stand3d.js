// 3D-Ansicht des Stands: Boden, Wände, Werke, Screens und Befestigungspunkte, massstabsgetreu (1 Einheit = 1 cm).
// Drehen/Zoomen mit Finger oder Maus; Antippen einer Wand meldet die Wandseite an die App zurück.
// three.js wird erst geladen, wenn die Ansicht zum ersten Mal gebraucht wird.
//
// Raum: three.js-x = Grundriss-x, three.js-z = Grundriss-y, three.js-y = Höhe ab Boden.

import { punktAufSeite, wandLage, umriss, WANDDICKE } from './raum.js';

let THREE = null;
let OrbitControls = null;
let z = null; // Zustand: { container, renderer, scene, camera, controls, gruppe, waende, planKey, onWahl }

const FARBE = {
  hintergrund: 0xf5f5f3,
  boden: 0xe9e6de,
  stand: 0xd9d4c7,
  wand: 0xfbfaf7,
  wandAktiv: 0xdfe8fb,
  kante: 0x8a8a85,
  punkt: 0xd4202a,
};

async function lade() {
  if (THREE) return;
  const [three, controls] = await Promise.all([import('three'), import('three/addons/controls/OrbitControls.js')]);
  THREE = three;
  OrbitControls = controls.OrbitControls;
}

function zeichne() {
  if (z) z.renderer.render(z.scene, z.camera);
}

function einrichten(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FARBE.hintergrund);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b4a8, 2.2));
  const sonne = new THREE.DirectionalLight(0xffffff, 1.2);
  sonne.position.set(-300, 800, 600);
  scene.add(sonne);

  const camera = new THREE.PerspectiveCamera(45, 1, 5, 50000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.maxPolarAngle = Math.PI / 2 - 0.02; // nicht unter den Boden
  controls.zoomToCursor = true; // dorthin zoomen, wo Maus oder Finger sind
  controls.zoomSpeed = 1.6;
  controls.minDistance = 20;
  controls.screenSpacePanning = true;
  controls.addEventListener('change', zeichne);

  const gruppe = new THREE.Group();
  scene.add(gruppe);

  const groesse = () => {
    const b = container.clientWidth || 300;
    const h = container.clientHeight || 300;
    renderer.setSize(b, h, false);
    camera.aspect = b / h;
    camera.updateProjectionMatrix();
    zeichne();
  };
  new ResizeObserver(groesse).observe(container);

  // Antippen (ohne Ziehen) wählt eine Wandseite
  let start = null;
  renderer.domElement.addEventListener('pointerdown', (e) => (start = { x: e.clientX, y: e.clientY }));
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) return;
    const r = renderer.domElement.getBoundingClientRect();
    const zeiger = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const strahl = new THREE.Raycaster();
    strahl.setFromCamera(zeiger, camera);
    const treffer = strahl.intersectObjects(z.waende, false)[0];
    if (!treffer) return;
    const wand = treffer.object.userData.wand;
    const w = wandLage(wand);
    // Auf welcher Seite der Wandmitte liegt der Treffer?
    const vorne = (treffer.point.x - w.x) * -w.dy + (treffer.point.z - w.y) * w.dx >= 0;
    const seite = wand.seiten[vorne || wand.seiten.length < 2 ? 0 : 1];
    z.onWahl?.(seite.id);
  });

  // ansicht: { art: 'schraeg' | 'oben' | 'innen' | 'wand', seiteId }
  z = { container, renderer, scene, camera, controls, gruppe, waende: [], planKey: null, onWahl: null, ansicht: { art: 'schraeg' } };
  groesse();
}

function leere(gruppe) {
  gruppe.traverse((o) => {
    o.geometry?.dispose();
    const m = o.material;
    if (m) {
      m.map?.dispose();
      m.dispose();
    }
  });
  gruppe.clear();
}

// Bild mit Text (für Werke, Screens und Wandnamen)
function schild(text, { breite, hoehe, hg, vg, rand }) {
  const massstab = 512 / Math.max(breite, hoehe);
  const c = document.createElement('canvas');
  c.width = Math.max(16, Math.round(breite * massstab));
  c.height = Math.max(16, Math.round(hoehe * massstab));
  const g = c.getContext('2d');
  g.fillStyle = hg;
  g.fillRect(0, 0, c.width, c.height);
  if (rand) {
    g.strokeStyle = rand;
    g.lineWidth = Math.max(2, c.width / 60);
    g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, c.width - g.lineWidth, c.height - g.lineWidth);
  }
  if (text) {
    let fs = Math.min(c.height / 5, 48);
    g.font = `600 ${fs}px -apple-system, Helvetica, Arial, sans-serif`;
    const passt = (c.width * 0.9) / Math.max(1, g.measureText(text).width);
    if (passt < 1) fs *= passt;
    g.font = `600 ${fs}px -apple-system, Helvetica, Arial, sans-serif`;
    g.fillStyle = vg;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, c.width / 2, c.height / 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function flaeche(breite, hoehe, textur, x, h, y, nx, ny) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(breite, hoehe), new THREE.MeshStandardMaterial({ map: textur, roughness: 0.9 }));
  m.position.set(x, h, y);
  m.rotation.y = Math.atan2(nx, ny);
  return m;
}

function baue(plan, ergebnis, { aktiveSeiteId, name }) {
  const { gruppe } = z;
  leere(gruppe);
  z.waende = [];
  const a = plan.ausstellung || {};

  // Boden und Standfläche
  const u = umriss(plan);
  const rand = 200;
  const boden = new THREE.Mesh(
    new THREE.PlaneGeometry(u.maxX - u.minX + 2 * rand, u.maxY - u.minY + 2 * rand),
    new THREE.MeshStandardMaterial({ color: FARBE.boden, roughness: 1 }),
  );
  boden.rotation.x = -Math.PI / 2;
  boden.position.set((u.minX + u.maxX) / 2, -0.5, (u.minY + u.maxY) / 2);
  gruppe.add(boden);
  if (a.standBreite > 0 && a.standTiefe > 0) {
    const stand = new THREE.Mesh(new THREE.PlaneGeometry(a.standBreite, a.standTiefe), new THREE.MeshStandardMaterial({ color: FARBE.stand, roughness: 1 }));
    stand.rotation.x = -Math.PI / 2;
    stand.position.set(a.standBreite / 2, 0, a.standTiefe / 2);
    gruppe.add(stand);
  }

  // Schriftgrösse der Wandnamen passt sich der Standgrösse an
  const k = Math.max(1, Math.max(u.maxX - u.minX, u.maxY - u.minY) / 500);

  // Wände
  const aktiveWandId = plan.waende.find((w) => w.seiten.some((s) => s.id === aktiveSeiteId))?.id;
  for (const wand of plan.waende) {
    const w = wandLage(wand);
    if (w.laenge <= 0) continue;
    const hoehe = wand.hoehe > 0 ? wand.hoehe : 250;
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(w.laenge, hoehe, WANDDICKE),
      new THREE.MeshStandardMaterial({ color: wand.id === aktiveWandId ? FARBE.wandAktiv : FARBE.wand, roughness: 0.95 }),
    );
    box.position.set(w.x + (w.dx * w.laenge) / 2, hoehe / 2, w.y + (w.dy * w.laenge) / 2);
    box.rotation.y = -Math.atan2(w.dy, w.dx);
    box.userData.wand = wand;
    box.userData.wandId = wand.id;
    const kanten = new THREE.LineSegments(new THREE.EdgesGeometry(box.geometry), new THREE.LineBasicMaterial({ color: FARBE.kante }));
    box.add(kanten);
    gruppe.add(box);
    z.waende.push(box);

    // Wandname über der Wand
    const titel = wand.name?.trim() || wand.id;
    const sb = Math.min(160, Math.max(60, titel.length * 9));
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: schild(titel, { breite: sb, hoehe: 24, hg: '#ffffff', vg: '#1c1c1e', rand: '#8a8a85' }), depthTest: false }));
    sprite.scale.set(sb * k, 24 * k, 1);
    sprite.position.set(box.position.x, hoehe + 20 + 12 * k, box.position.z);
    sprite.userData.wandId = wand.id;
    gruppe.add(sprite);
  }

  // Werke, Screens und Befestigungspunkte
  const kugel = new THREE.SphereGeometry(2.2, 12, 8);
  const rot = new THREE.MeshStandardMaterial({ color: FARBE.punkt });
  for (const s of ergebnis.seiten) {
    const wand = plan.waende.find((w) => w.id === s.wandId);
    const index = wand?.seiten.findIndex((x) => x.id === s.seiteId) ?? -1;
    if (!wand || index < 0) continue;
    const idx = index === 0 ? 0 : 1;
    for (const el of s.elemente) {
      for (const teil of el.teile) {
        const p = punktAufSeite(wand, idx, teil.x + teil.breite / 2);
        if (teil.typ === 'pult') {
          // Möbel am Boden vor der Wand, Länge entlang der Wand
          const tiefe = teil.tiefe || 60;
          const pult = new THREE.Mesh(
            new THREE.BoxGeometry(teil.breite, teil.hoehe, tiefe),
            new THREE.MeshStandardMaterial({ color: 0xc9a27a, roughness: 0.8 }),
          );
          pult.position.set(p.x + p.nx * (tiefe / 2 + 2), teil.hoehe / 2, p.y + p.ny * (tiefe / 2 + 2));
          pult.rotation.y = Math.atan2(p.nx, p.ny);
          pult.add(new THREE.LineSegments(new THREE.EdgesGeometry(pult.geometry), new THREE.LineBasicMaterial({ color: 0x8b5e34 })));
          pult.userData.wandId = wand.id;
          gruppe.add(pult);
          continue;
        }
        const istScreen = teil.typ === 'screen';
        const tex = schild(name(teil.werkId), {
          breite: teil.breite,
          hoehe: teil.hoehe,
          hg: istScreen ? '#0f766e' : '#ffffff',
          vg: istScreen ? '#ffffff' : '#333333',
          rand: istScreen ? '#0b4f4a' : '#333333',
        });
        const h = teil.oberkante - teil.hoehe / 2;
        const bild = flaeche(teil.breite, teil.hoehe, tex, p.x + p.nx * 1.5, h, p.y + p.ny * 1.5, p.nx, p.ny);
        bild.userData.wandId = wand.id;
        gruppe.add(bild);
      }
      for (const pkt of el.punkte) {
        const p = punktAufSeite(wand, idx, pkt.x);
        const k = new THREE.Mesh(kugel, rot);
        k.position.set(p.x + p.nx * 3, pkt.hoehe, p.y + p.ny * 3);
        k.userData.wandId = wand.id;
        gruppe.add(k);
      }
    }
  }
}

const AUGENHOEHE = 160;

// Schneiden sich die Strecken a–b und c–d (im Grundriss)?
function schneiden(a, b, c, d) {
  const kreuz = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const d1 = kreuz(c, d, a);
  const d2 = kreuz(c, d, b);
  const d3 = kreuz(a, b, c);
  const d4 = kreuz(a, b, d);
  return d1 * d2 < 0 && d3 * d4 < 0;
}

// Blendet Wände (samt Werken und Namen) aus, die zwischen Kamera und der gezeigten Wandseite stehen
function blendeAus(plan) {
  const art = z.ansicht.art;
  const versteckt = new Set();
  const ort = art === 'wand' ? seitenOrt(plan, z.ansicht.seiteId) : null;
  if (ort) {
    const kamera = { x: z.camera.position.x, y: z.camera.position.z };
    const w = wandLage(ort.wand);
    const ziele = [0.03, 0.5, 0.97].map((f) => punktAufSeite(ort.wand, ort.idx, w.laenge * f));
    for (const andere of plan.waende) {
      if (andere.id === ort.wand.id) continue;
      const l = wandLage(andere);
      const a = { x: l.x, y: l.y };
      const b = { x: l.x + l.dx * l.laenge, y: l.y + l.dy * l.laenge };
      if (ziele.some((p) => schneiden(kamera, p, a, b))) versteckt.add(andere.id);
    }
  }
  z.gruppe.traverse((o) => {
    if (o.userData.wandId) o.visible = !versteckt.has(o.userData.wandId);
  });
}

// { wand, idx } zu einer Seiten-id (idx 0 = erste Seite, 1 = Gegenseite)
function seitenOrt(plan, seiteId) {
  for (const wand of plan.waende) {
    const i = wand.seiten.findIndex((s) => s.id === seiteId);
    if (i >= 0) return { wand, idx: i === 0 ? 0 : 1 };
  }
  return null;
}

function steuerung({ zoom = true, verschieben = true, drehtempo = 1, polar = [0, Math.PI / 2 - 0.02] } = {}) {
  const c = z.controls;
  c.enableZoom = zoom;
  c.enablePan = verschieben;
  c.rotateSpeed = drehtempo;
  [c.minPolarAngle, c.maxPolarAngle] = polar;
}

// Kamera setzen. art: 'schraeg' | 'oben' (ganzer Stand), 'innen' (Augenhöhe in der Standmitte),
// 'wand' (frontal vor der Wandseite seiteId, verdeckende Wände ausgeblendet)
export function setzeAnsicht(plan, art = 'schraeg', seiteId = null) {
  if (!z) return;
  z.ansicht = { art, seiteId };
  // Innen weiter Blickwinkel wie das Auge, sonst normal
  z.camera.fov = art === 'innen' ? 75 : 45;
  z.camera.updateProjectionMatrix();
  const u = umriss(plan);
  const a = plan.ausstellung || {};
  const cx = (u.minX + u.maxX) / 2;
  const cy = (u.minY + u.maxY) / 2;
  const groesse = Math.max(u.maxX - u.minX, u.maxY - u.minY, 300);
  const halbVertikal = (z.camera.fov * Math.PI) / 360;
  const abstand = (groesse / (2 * Math.tan(halbVertikal))) * 1.15;
  const ort = seitenOrt(plan, seiteId);

  if (art === 'innen') {
    // Standmitte (oder Mitte aller Wände), Blick zur gewählten Wandseite
    const mx = a.standBreite > 0 ? a.standBreite / 2 : cx;
    const my = a.standTiefe > 0 ? a.standTiefe / 2 : cy;
    let blick = { x: 0, y: -1 };
    if (ort) {
      const p = punktAufSeite(ort.wand, ort.idx, wandLage(ort.wand).laenge / 2);
      const l = Math.hypot(p.x - mx, p.y - my) || 1;
      blick = { x: (p.x - mx) / l, y: (p.y - my) / l };
    }
    z.camera.position.set(mx, AUGENHOEHE, my);
    z.controls.target.set(mx + blick.x, AUGENHOEHE, my + blick.y);
    steuerung({ zoom: false, verschieben: false, drehtempo: -0.4, polar: [Math.PI * 0.3, Math.PI * 0.7] });
  } else if (art === 'wand' && ort) {
    // So weit weg, dass die ganze Wandseite ins Bild passt, mindestens 2,5 m
    const w = wandLage(ort.wand);
    const p = punktAufSeite(ort.wand, ort.idx, w.laenge / 2);
    const halbHorizontal = Math.atan(Math.tan(halbVertikal) * z.camera.aspect);
    const d = Math.max(250, (w.laenge * 0.58) / Math.tan(halbHorizontal));
    z.camera.position.set(p.x + p.nx * d, AUGENHOEHE, p.y + p.ny * d);
    z.controls.target.set(p.x, 140, p.y);
    steuerung({ polar: [Math.PI * 0.2, Math.PI / 2 - 0.02] });
  } else if (art === 'oben') {
    z.ansicht.art = 'oben';
    z.camera.position.set(cx, abstand + 250, cy + 0.01);
    z.controls.target.set(cx, 80, cy);
    steuerung();
  } else {
    // Von links vorne und recht steil, damit man in den Stand hineinsieht
    z.ansicht.art = 'schraeg';
    z.camera.position.set(cx - groesse * 0.35, abstand * 0.9, cy + abstand * 0.55);
    z.controls.target.set(cx, 80, cy);
    steuerung();
  }
  z.controls.update();
  blendeAus(plan);
  zeichne();
}

// Baut die Szene (neu) auf. Gibt false zurück, wenn three.js nicht geladen werden konnte.
export async function zeigeStand(container, plan, ergebnis, { planKey, aktiveSeiteId, name, onWahl }) {
  try {
    await lade();
  } catch {
    return false;
  }
  if (!z || z.container !== container) einrichten(container);
  z.onWahl = onWahl;
  baue(plan, ergebnis, { aktiveSeiteId, name });
  if (z.planKey !== planKey) {
    z.planKey = planKey;
    setzeAnsicht(plan);
  } else if (z.ansicht.art === 'wand' && z.ansicht.seiteId !== aktiveSeiteId) {
    setzeAnsicht(plan, 'wand', aktiveSeiteId); // andere Wand angetippt: Kamera geht mit
  } else {
    blendeAus(plan);
  }
  zeichne();
  return true;
}
