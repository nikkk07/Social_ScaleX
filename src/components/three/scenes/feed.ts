import * as THREE from 'three';
import type { SceneHandle } from '../ThreeStage';
import { onFrame, trackElement } from '@/components/motion/frame';
import type { ReelItem } from '@/components/site/home/reelItems';
import { BRAND } from './brand';

/**
 * Hero: a vertical 3D Reel feed. Cards sit on a helix, like a feed turned
 * into a spiral staircase; scrolling moves the feed up exactly as a thumb
 * swipe moves Reels, the front card faces the visitor, and the card under
 * the pointer lifts towards them.
 *
 * Client cards carry only published figures (PORTFOLIO, via ReelItem) with
 * their capture dates. The other cards are abstract Reel frames (shapes and
 * brand colours, no usernames, captions or numbers).
 */

const CARD_W = 1.6;
const CARD_H = CARD_W * (16 / 9);
const STEP_A = 0.6; // radians between cards around the helix
const STEP_Y = 1.12; // rise per card
const RADIUS = 3.1;

const vertex = /* glsl */ `
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 uNight;
  uniform float uAngle;
  uniform float uFocus;
  uniform float uFade;
  uniform float uAspect;
  uniform vec2 uFog;
  varying vec2 vUv;
  varying float vDepth;
  float rbox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  void main() {
    vec2 p = (vUv - 0.5) * vec2(1.0, uAspect);
    float d = rbox(p, vec2(0.5, 0.5 * uAspect), 0.07);
    float alpha = 1.0 - smoothstep(-0.003, 0.003, d);
    if (alpha <= 0.0) discard;
    vec2 uv = gl_FrontFacing ? vUv : vec2(1.0 - vUv.x, vUv.y);
    vec3 col = texture2D(map, uv).rgb;
    if (!gl_FrontFacing) col = mix(vec3(0.145, 0.133, 0.106), col, 0.08);
    // A glossy band that slides across the card as it turns: glass, not paper.
    float band = (vUv.x * 0.85 + vUv.y * 0.35) - (0.62 + uAngle * 0.9);
    col += exp(-band * band * 60.0) * 0.16;
    // Thin bright rim on the focused card.
    float rim = 1.0 - smoothstep(0.0, 0.012, abs(d));
    col += rim * 0.35 * uFocus;
    // Depth fog into the night background.
    float fog = smoothstep(uFog.x, uFog.y, vDepth);
    col = mix(col, uNight, fog * 0.9);
    // Cards away from the front recede.
    col *= mix(0.55, 1.0, uFocus);
    gl_FragColor = vec4(col, alpha * uFade);
    #include <colorspace_fragment>
  }
`;

function cssVar(name: string, fallback: string): string {
  return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function fitFont(g: CanvasRenderingContext2D, text: string, size: number, family: string, max: number): number {
  let s = size;
  g.font = `400 ${s}px ${family}`;
  while (s > 10 && g.measureText(text).width > max) {
    s -= 2;
    g.font = `400 ${s}px ${family}`;
  }
  return s;
}

const W = 360;
const H = 640;

function canvasFor(scale: number) {
  const c = document.createElement('canvas');
  c.width = Math.round(W * scale);
  c.height = Math.round(H * scale);
  const g = c.getContext('2d')!;
  g.scale(scale, scale);
  return { c, g };
}

function reelBar(g: CanvasRenderingContext2D, share: number) {
  g.fillStyle = 'rgba(250,248,244,0.25)';
  g.fillRect(0, H - 6, W, 6);
  g.fillStyle = BRAND.coral;
  g.fillRect(0, H - 6, W * share, 6);
}

/** A client's proof card, portrait like a Reel. */
function clientCard(it: ReelItem, avatar: HTMLImageElement | null, scale: number, display: string, sans: string, i: number) {
  const { c, g } = canvasFor(scale);
  g.fillStyle = '#25221B';
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W, 0, 0, W, 0, H * 0.75);
  glow.addColorStop(0, 'rgba(224,70,43,0.42)');
  glow.addColorStop(1, 'rgba(224,70,43,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);

  const pad = 28;
  const av = 64;
  g.save();
  g.beginPath();
  g.arc(pad + av / 2, pad + av / 2, av / 2, 0, Math.PI * 2);
  g.clip();
  if (avatar) g.drawImage(avatar, pad, pad, av, av);
  g.restore();
  g.strokeStyle = 'rgba(250,248,244,0.2)';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(pad + av / 2, pad + av / 2, av / 2 + 1, 0, Math.PI * 2);
  g.stroke();

  const tx = pad + av + 14;
  g.fillStyle = BRAND.paper;
  fitFont(g, it.client, 26, display, W - tx - pad);
  g.fillText(it.client, tx, pad + 30);
  g.font = `400 14px ${sans}`;
  g.fillStyle = '#BDB6A8';
  g.fillText(`@${it.handle}`.slice(0, 26), tx, pad + 52);

  // Headline figure.
  const vs = fitFont(g, it.value, 116, display, W - pad * 2);
  g.fillStyle = it.growth ? BRAND.coralOnNight : BRAND.paper;
  g.fillText(it.value, pad, H * 0.58);
  g.font = `400 18px ${sans}`;
  g.fillStyle = '#D8D2C6';
  const label = it.label.length > 34 ? `${it.label.slice(0, 33)}…` : it.label;
  g.fillText(label, pad, H * 0.58 + 34);
  void vs;

  g.fillStyle = 'rgba(250,248,244,0.12)';
  g.fillRect(pad, H - 132, W - pad * 2, 1);
  if (it.extra) {
    g.font = `400 26px ${display}`;
    g.fillStyle = BRAND.paper;
    g.fillText(it.extra.value, pad, H - 92);
    const ew = g.measureText(it.extra.value).width;
    g.font = `400 14px ${sans}`;
    g.fillStyle = '#BDB6A8';
    g.fillText(` ${it.extra.label.toLowerCase()}`.slice(0, 30), pad + ew, H - 92);
  }
  g.font = `400 12px ${sans}`;
  g.fillStyle = '#BDB6A8';
  g.fillText(it.date, pad, H - 58);
  reelBar(g, 0.3 + (i % 5) * 0.12);
  return c;
}

const PALETTES: [string, string, string][] = [
  [BRAND.coral, BRAND.paper2, BRAND.ink],
  [BRAND.ink, BRAND.coralOnNight, BRAND.paper],
  [BRAND.positive, BRAND.paper, BRAND.coral],
  [BRAND.paper2, BRAND.coralTint, BRAND.ink],
];

/** An abstract Reel frame: shapes and brand colours, no words or numbers. */
function abstractCard(v: number, scale: number) {
  const { c, g } = canvasFor(scale);
  const [a, b, ink] = PALETTES[v % PALETTES.length] ?? PALETTES[0]!;
  const bg = g.createLinearGradient(0, 0, W * 0.4, H);
  bg.addColorStop(0, b);
  bg.addColorStop(1, a);
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.fillStyle = ink;
  g.globalAlpha = 0.9;
  if (v % 2 === 0) {
    g.beginPath();
    g.arc(W * 0.62, H * 0.34, W * 0.3, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.roundRect(W * 0.1, H * 0.45, W * 0.5, H * 0.2, 26);
    g.fill();
  } else {
    g.beginPath();
    g.roundRect(W * 0.14, H * 0.2, W * 0.72, H * 0.42, 30);
    g.fill();
    g.fillStyle = a;
    g.beginPath();
    g.arc(W * 0.5, H * 0.41, W * 0.16, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  g.fillStyle = 'rgba(250,248,244,0.92)';
  g.beginPath();
  g.arc(W / 2, H * 0.5, 34, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = BRAND.ink;
  g.beginPath();
  g.moveTo(W / 2 - 10, H * 0.5 - 16);
  g.lineTo(W / 2 + 17, H * 0.5);
  g.lineTo(W / 2 - 10, H * 0.5 + 16);
  g.closePath();
  g.fill();
  g.fillStyle = 'rgba(22,20,15,0.55)';
  for (let k = 0; k < 3; k++) {
    g.beginPath();
    g.arc(W - 34, H * 0.66 + k * 48, 13, 0, Math.PI * 2);
    g.fill();
  }
  g.beginPath();
  g.roundRect(26, H - 92, W * 0.58, 14, 7);
  g.fill();
  g.beginPath();
  g.roundRect(26, H - 66, W * 0.38, 14, 7);
  g.fill();
  reelBar(g, 0.2 + v * 0.15);
  return c;
}

export function mount(canvas: HTMLCanvasElement, host: HTMLElement, onReady: () => void, data?: unknown): SceneHandle {
  const items = (Array.isArray(data) ? data : []) as ReelItem[];
  const small = window.matchMedia('(max-width: 1023px)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  const CAM_D = 8.2;

  // Feed order: client, abstract, client, abstract…
  const order: ({ kind: 'client'; item: ReelItem } | { kind: 'abstract'; v: number })[] = [];
  const COUNT = 14;
  for (let i = 0, c = 0, a = 0; i < COUNT; i++) {
    if (i % 2 === 0 && items.length) order.push({ kind: 'client', item: items[c++ % items.length]! });
    else order.push({ kind: 'abstract', v: a++ });
  }

  const geo = new THREE.PlaneGeometry(CARD_W, CARD_H);
  const night = new THREE.Color(BRAND.ink);
  const blank = new THREE.DataTexture(new Uint8Array([37, 34, 27, 255]), 1, 1);
  blank.needsUpdate = true;
  const helix = new THREE.Group();
  const fogRange = { value: new THREE.Vector2(7, 14) };
  const cards = order.map((_, i) => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: blank as THREE.Texture },
        uNight: { value: night },
        uAngle: { value: 0 },
        uFocus: { value: 0 },
        uFade: { value: 1 },
        uAspect: { value: CARD_H / CARD_W },
        uFog: fogRange,
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const pivot = new THREE.Group();
    pivot.rotation.y = i * STEP_A;
    pivot.position.y = -i * STEP_Y;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = RADIUS;
    pivot.add(mesh);
    helix.add(pivot);
    return { mesh, mat, lift: 0 };
  });
  // The rig places the feed in the full-width hero: right of the text on wide
  // screens, below it on tall ones.
  const rig = new THREE.Group();
  rig.add(helix);
  scene.add(rig);

  // Soft coral light behind the front card.
  const glowTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    r.addColorStop(0, 'rgba(240,122,94,0.55)');
    r.addColorStop(1, 'rgba(240,122,94,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  })();
  const glowMat = new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const glowGeo = new THREE.PlaneGeometry(5, 5);
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(0, 0, RADIUS - 1.2);
  rig.add(glow);

  // Fine dust for depth.
  const DUST = small ? 110 : 220;
  const pos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 16;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dustMat = new THREE.PointsMaterial({ color: BRAND.paper, size: 0.03, transparent: true, opacity: 0.4, depthWrite: false });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // Textures: drawn once fonts and avatars are ready.
  const textures: THREE.Texture[] = [];
  let ready = false;
  const scale = Math.min(dpr, 1.5);
  const display = cssVar('--font-fraunces', 'Georgia, serif');
  const sans = cssVar('--font-inter', 'system-ui, sans-serif');
  void Promise.all([
    Promise.all(items.map((it) => loadImage(it.avatar))),
    Promise.all([document.fonts.load(`400 40px ${display}`), document.fonts.load(`400 16px ${sans}`)]).catch(() => undefined),
  ]).then(([avatars]) => {
    if (disposed) return;
    order.forEach((o, i) => {
      const c =
        o.kind === 'client'
          ? clientCard(o.item, avatars[items.indexOf(o.item)] ?? null, scale, display, sans, i)
          : abstractCard(o.v, Math.min(scale, 1));
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      textures.push(t);
      const u = cards[i]?.mat.uniforms.map;
      if (u) u.value = t;
    });
    ready = true;
  });

  let camD = CAM_D;
  const size = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    if (camera.aspect >= 1) {
      // Wide: the feed fills the right of the hero, its outer cards reaching behind the text.
      camD = CAM_D;
      const visW = 2 * tan * camD * camera.aspect;
      rig.position.set(visW * 0.23, 0, 0);
    } else {
      // Tall (phones): size by width, and sit the feed in the lower part, under the text.
      const visW = 3.6;
      camD = visW / camera.aspect / (2 * tan);
      const visH = 2 * tan * camD;
      rig.position.set(0, -visH / 2 + CARD_H * 0.95, 0);
    }
    // Fog starts just behind the front card, wherever the camera sits.
    fogRange.value.set(camD - 1.2, camD + 6);
  };
  size();
  const ro = new ResizeObserver(size);
  ro.observe(host);

  // Pointer: camera parallax, and hover lift via raycasting.
  const pointer = new THREE.Vector2(9, 9);
  const look = { x: 0, y: 0 };
  let pointerDirty = false;
  const hostBox = trackElement(host);
  const onMove = (e: PointerEvent) => {
    const top = hostBox.top();
    const left = hostBox.box.left - window.scrollX;
    pointer.set(((e.clientX - left) / host.clientWidth) * 2 - 1, -((e.clientY - top) / hostBox.box.height) * 2 + 1);
    look.x = (e.clientX / window.innerWidth - 0.5) * 2;
    look.y = (e.clientY / window.innerHeight - 0.5) * 2;
    pointerDirty = true;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  const ray = new THREE.Raycaster();
  let hovered = -1;

  const section = trackElement(host.closest('section') ?? host);
  const smooth = { f: 0, x: 0, y: 0 };
  let ready2 = false;
  let disposed = false;
  let unsub: (() => void) | undefined;
  let lastOpacity = '';
  const meshes: THREE.Object3D[] = cards.map((c) => c.mesh);

  const progress = () => {
    const vh = window.innerHeight || 1;
    const top = section.top();
    const height = section.box.height;
    const span = height - vh;
    // Pinned on large screens (tall section): 0 → 1 across the pin.
    if (span > vh * 0.3) return { p: Math.min(1, Math.max(0, -top / span)), away: Math.min(1, Math.max(0, (-top - span) / vh)) };
    // Otherwise: 0 → 1 as the section passes through the viewport.
    const p = Math.min(1, Math.max(0, (vh - top) / (vh + height)));
    return { p, away: Math.min(1, Math.max(0, -top / Math.max(1, height))) };
  };

  const tick = (t: number) => {
    if (!ready) return;
    const { p, away } = progress();
    // Start on a client card; the pin walks the feed through eight more, ending on a client.
    const target = p * 4 + Math.sin(t / 2600) * 0.08;
    smooth.f += (target - smooth.f) * 0.085;
    smooth.x += (look.x - smooth.x) * 0.05;
    smooth.y += (look.y - smooth.y) * 0.05;

    helix.rotation.y = -smooth.f * STEP_A;
    helix.position.y = smooth.f * STEP_Y;
    helix.rotation.z = -0.06 + smooth.x * 0.03;

    camera.position.set(smooth.x * 0.45, -smooth.y * 0.3, RADIUS + camD + away * 2);
    camera.lookAt(smooth.x * 0.15, 0, RADIUS - 1);

    if (pointerDirty) {
      pointerDirty = false;
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(meshes, false)[0];
      hovered = hit ? meshes.indexOf(hit.object) : -1;
    }

    cards.forEach((c, i) => {
      const off = i - smooth.f;
      const focus = Math.max(0, 1 - Math.abs(off) * 0.75);
      c.lift += ((i === hovered ? 1 : 0) - c.lift) * 0.12;
      c.mesh.position.z = RADIUS + c.lift * 0.45 + focus * 0.15;
      const s = 0.9 + focus * 0.1 + c.lift * 0.05;
      c.mesh.scale.set(s, s, 1);
      c.mesh.rotation.x = c.lift * -0.06;
      const u = c.mat.uniforms;
      if (u.uAngle) u.uAngle.value = off * STEP_A;
      if (u.uFocus) u.uFocus.value = Math.max(focus, c.lift);
      if (u.uFade) u.uFade.value = 1 - away * 0.9;
    });
    glow.position.x = smooth.x * 0.2;
    dust.rotation.y = t / 50000;
    dust.position.y = smooth.f * 0.25;

    const op = ready2 ? (1 - away * 0.8).toFixed(2) : '';
    if (op !== lastOpacity) canvas.style.opacity = lastOpacity = op;
    renderer.render(scene, camera);
    if (!ready2) {
      ready2 = true;
      onReady();
    }
  };

  return {
    setVisible(visible) {
      if (visible && !unsub) unsub = onFrame(tick);
      if (!visible && unsub) {
        unsub();
        unsub = undefined;
      }
    },
    dispose() {
      disposed = true;
      unsub?.();
      ro.disconnect();
      section.dispose();
      hostBox.dispose();
      window.removeEventListener('pointermove', onMove);
      textures.forEach((x) => x.dispose());
      cards.forEach((c) => c.mat.dispose());
      geo.dispose();
      blank.dispose();
      glowTex.dispose();
      glowMat.dispose();
      glowGeo.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      renderer.dispose();
    },
  };
}
