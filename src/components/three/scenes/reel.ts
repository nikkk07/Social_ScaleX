import * as THREE from 'three';
import { onFrame, type trackElement } from '@/components/motion/frame';
import type { ReelItem } from '@/components/site/home/reelItems';
import { BRAND } from './brand';

/**
 * The results reel in WebGL: the same client cards as the HTML row, laid on a
 * cylinder so the side cards bend away, with a colour split and a slight
 * stretch that follow scroll speed. One scene unit is one CSS pixel at the
 * focal plane, so the cards sit exactly where the HTML cards are.
 */

const vertex = /* glsl */ `
  uniform float uRadius;
  uniform float uVel;
  varying vec2 vUv;
  varying float vSide;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    float ang = world.x / uRadius;
    world.z += uRadius * (cos(ang) - 1.0);
    world.x = uRadius * sin(ang);
    // Scroll speed bows the strip slightly, like a reel under tension.
    world.y *= 1.0 + abs(uVel) * 0.06 * (1.0 - abs(ang) * 0.5);
    vSide = clamp(abs(ang) * 1.6, 0.0, 1.0);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D map;
  uniform vec2 uSize;
  uniform float uVel;
  uniform float uRound;
  uniform vec3 uNight;
  varying vec2 vUv;
  varying float vSide;
  float rbox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    float d = rbox(p, uSize * 0.5, uRound);
    float alpha = 1.0 - smoothstep(-1.0, 0.5, d);
    if (alpha <= 0.0) discard;
    float off = clamp(uVel, -1.0, 1.0) * 0.006;
    vec3 col;
    col.r = texture2D(map, vUv + vec2(off, 0.0)).r;
    col.g = texture2D(map, vUv).g;
    col.b = texture2D(map, vUv - vec2(off, 0.0)).b;
    col = mix(col, uNight, vSide * 0.55);
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

function cssVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.body).getPropertyValue(name).trim();
  return v || fallback;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Shrinks the font until the text fits `max` pixels. */
function fit(g: CanvasRenderingContext2D, text: string, weight: string, size: number, family: string, max: number): number {
  let s = size;
  g.font = `${weight} ${s}px ${family}`;
  while (s > 8 && g.measureText(text).width > max) {
    s -= 2;
    g.font = `${weight} ${s}px ${family}`;
  }
  return s;
}

/** Draws one card in CSS-pixel units at `scale`, mirroring the HTML card. */
function drawCard(it: ReelItem, w: number, h: number, scale: number, avatar: HTMLImageElement | null, display: string, sans: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale);
  c.height = Math.round(h * scale);
  const g = c.getContext('2d')!;
  g.scale(scale, scale);
  const pad = w < 500 ? 24 : 36;

  g.fillStyle = '#25221B';
  g.fillRect(0, 0, w, h);
  // The client's photo as a soft colour wash: drawn tiny, then scaled up.
  if (avatar) {
    const t = document.createElement('canvas');
    t.width = t.height = 12;
    t.getContext('2d')!.drawImage(avatar, 0, 0, 12, 12);
    g.save();
    g.globalAlpha = 0.35;
    g.imageSmoothingEnabled = true;
    g.imageSmoothingQuality = 'high';
    g.filter = 'saturate(1.5)';
    g.drawImage(t, -w * 0.125, -h * 0.125, w * 1.25, h * 1.25);
    g.restore();
  }
  const shade = g.createLinearGradient(0, 0, w * 0.45, h);
  shade.addColorStop(0, 'rgba(37,34,27,0.55)');
  shade.addColorStop(0.55, 'rgba(37,34,27,0.92)');
  shade.addColorStop(1, '#25221B');
  g.fillStyle = shade;
  g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(250,248,244,0.07)';
  for (let y = 11; y < h; y += 22) for (let x = 11; x < w; x += 22) g.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
  const glow = g.createRadialGradient(w - 40, 40, 0, w - 40, 40, Math.max(w, h) * 0.55);
  glow.addColorStop(0, 'rgba(224,70,43,0.28)');
  glow.addColorStop(1, 'rgba(224,70,43,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, w, h);

  // Avatar.
  const av = w < 500 ? 56 : 64;
  g.save();
  g.beginPath();
  g.arc(pad + av / 2, pad + av / 2, av / 2, 0, Math.PI * 2);
  g.clip();
  if (avatar) g.drawImage(avatar, pad, pad, av, av);
  else {
    g.fillStyle = BRAND.ink;
    g.fillRect(pad, pad, av, av);
  }
  g.restore();
  g.strokeStyle = 'rgba(250,248,244,0.15)';
  g.lineWidth = 2;
  g.beginPath();
  g.arc(pad + av / 2, pad + av / 2, av / 2 + 1, 0, Math.PI * 2);
  g.stroke();

  const tx = pad + av + 16;
  const badge = it.status === 'Active' ? 'Active client' : 'Past client';
  let badgeW = 0;
  if (w >= 500) {
    g.font = `600 12px ${sans}`;
    badgeW = g.measureText(badge).width + 26;
    const bx = w - pad - badgeW;
    const by = pad + av / 2 - 14;
    g.strokeStyle = 'rgba(250,248,244,0.2)';
    g.lineWidth = 1;
    g.beginPath();
    g.roundRect(bx, by, badgeW, 28, 14);
    g.stroke();
    g.fillStyle = '#BDB6A8';
    g.textBaseline = 'middle';
    g.fillText(badge, bx + 13, by + 14.5);
  }
  g.textBaseline = 'alphabetic';
  g.fillStyle = BRAND.paper;
  fit(g, it.client, '400', w < 500 ? 24 : 30, display, w - tx - pad - badgeW - 12);
  g.fillText(it.client, tx, pad + av / 2 + 2);
  g.fillStyle = '#BDB6A8';
  g.font = `400 14px ${sans}`;
  g.fillText(`@${it.handle}`, tx, pad + av / 2 + 22);

  // Bottom block, laid out upwards from the bottom edge. Narrow cards put
  // the date on its own line, as the HTML card wraps it.
  const narrow = w < 500;
  const bottom = h - pad;
  g.font = `400 12px ${sans}`;
  g.fillStyle = '#BDB6A8';
  g.textAlign = narrow ? 'left' : 'right';
  g.fillText(it.date, narrow ? pad : w - pad, bottom);
  g.textAlign = 'left';
  const extraY = narrow ? bottom - 26 : bottom;
  if (it.extra) {
    g.font = `400 24px ${display}`;
    g.fillStyle = BRAND.paper;
    g.fillText(it.extra.value, pad, extraY);
    const ew = g.measureText(it.extra.value).width;
    g.font = `400 14px ${sans}`;
    g.fillStyle = '#BDB6A8';
    g.fillText(` ${it.extra.label.toLowerCase()}`, pad + ew, extraY);
  }
  const rule = (narrow && it.extra ? extraY : bottom) - 36;
  g.fillStyle = 'rgba(250,248,244,0.1)';
  g.fillRect(pad, rule, w - pad * 2, 1);

  g.font = `400 ${w < 500 ? 16 : 18}px ${sans}`;
  g.fillStyle = '#BDB6A8';
  g.fillText(it.label, pad, rule - 22);

  if (it.bars) {
    const bw = w * (w < 500 ? 0.38 : 0.3);
    const bx = w - pad - bw;
    const by = h * (w < 500 ? 0.24 : 0.26);
    const bh = h * 0.34;
    const capH = 24;
    const col = (bw - 12) / 2;
    const area = bh - capH - 20;
    const fromH = Math.max(0.06, it.bars.from / it.bars.to) * area;
    const base = by + bh - capH;
    g.fillStyle = 'rgba(250,248,244,0.2)';
    g.beginPath();
    g.roundRect(bx, base - fromH, col, fromH, [8, 8, 0, 0]);
    g.fill();
    const grad = g.createLinearGradient(0, base, 0, base - area);
    grad.addColorStop(0, BRAND.coral);
    grad.addColorStop(1, BRAND.coralOnNight);
    g.save();
    g.shadowColor = 'rgba(240,122,94,0.35)';
    g.shadowBlur = 32;
    g.fillStyle = grad;
    g.beginPath();
    g.roundRect(bx + col + 12, base - area, col, area, [8, 8, 0, 0]);
    g.fill();
    g.restore();
    g.font = `400 12px ${sans}`;
    g.textAlign = 'center';
    g.fillStyle = '#BDB6A8';
    g.fillText(it.bars.fromText, bx + col / 2, base - fromH - 7);
    g.font = `600 12px ${sans}`;
    g.fillStyle = BRAND.paper;
    g.fillText(it.bars.toText, bx + col * 1.5 + 12, base - area - 7);
    g.fillStyle = 'rgba(250,248,244,0.15)';
    g.fillRect(bx, base + 8, bw, 1);
    g.font = `400 11px ${sans}`;
    g.fillStyle = '#BDB6A8';
    g.textAlign = 'right';
    g.fillText(`${it.bars.label} · ${it.bars.period}`, bx + bw, base + 24);
    g.textAlign = 'left';
  }
  const valueBase = rule - 52;
  const icon = it.growth ? Math.min(56, h * 0.11) : 0;
  const vs = fit(g, it.value, '400', Math.min(120, w * 0.17), display, w - pad * 2 - icon - 12);
  g.fillStyle = it.growth ? BRAND.coralOnNight : BRAND.paper;
  if (it.growth) {
    // Trending-up arrow, drawn as the Lucide icon's two strokes.
    const ix = pad;
    const iy = valueBase - vs * 0.72;
    const k = icon / 24;
    g.save();
    g.translate(ix, iy);
    g.scale(k, k);
    g.strokeStyle = BRAND.coralOnNight;
    g.lineWidth = 2.25;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(22, 7);
    g.lineTo(13.5, 15.5);
    g.lineTo(8.5, 10.5);
    g.lineTo(2, 17);
    g.moveTo(16, 7);
    g.lineTo(22, 7);
    g.lineTo(22, 13);
    g.stroke();
    g.restore();
  }
  g.font = `400 ${vs}px ${display}`;
  g.fillText(it.value, pad + (icon ? icon + 12 : 0), valueBase);
  return c;
}

export function mount(opts: {
  canvas: HTMLCanvasElement;
  stage: HTMLElement;
  row: HTMLElement;
  tracked: ReturnType<typeof trackElement>;
  items: ReelItem[];
  onReady: () => void;
}) {
  const { canvas, stage, row, tracked, items, onReady } = opts;
  const n = items.length;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const FOV = 30;
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 10000);
  const geo = new THREE.PlaneGeometry(1, 1, 48, 1);
  const night = new THREE.Color(BRAND.ink);

  const shared = { uRadius: { value: 2000 }, uVel: { value: 0 } };
  const meshes = items.map(() => {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        ...shared,
        map: { value: null as THREE.Texture | null },
        uSize: { value: new THREE.Vector2(1, 1) },
        uRound: { value: 28 },
        uNight: { value: night },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
    });
    const m = new THREE.Mesh(geo, mat);
    scene.add(m);
    return m;
  });

  let cardW = 1;
  let cardH = 1;
  let step = 1;
  let rowY = 0;
  let textures: THREE.CanvasTexture[] = [];
  let ready = false;
  let drawn = 0;

  const fonts = {
    display: cssVar('--font-fraunces', 'Georgia, serif'),
    sans: cssVar('--font-inter', 'system-ui, sans-serif'),
  };
  const avatars = Promise.all(items.map((it) => loadImage(it.avatar)));
  const fontsReady = Promise.all([
    document.fonts.load(`400 40px ${fonts.display}`),
    document.fonts.load(`400 16px ${fonts.sans}`),
    document.fonts.load(`600 12px ${fonts.sans}`),
  ]).catch(() => undefined);

  const paint = async () => {
    const token = ++drawn;
    const [imgs] = await Promise.all([avatars, fontsReady]);
    if (token !== drawn) return;
    const scale = Math.min(dpr, 2048 / cardW);
    textures.forEach((t) => t.dispose());
    textures = items.map((it, i) => {
      const t = new THREE.CanvasTexture(drawCard(it, cardW, cardH, scale, imgs[i] ?? null, fonts.display, fonts.sans));
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      t.minFilter = THREE.LinearMipmapLinearFilter;
      return t;
    });
    meshes.forEach((m, i) => {
      const u = (m.material as THREE.ShaderMaterial).uniforms.map;
      if (u) u.value = textures[i] ?? null;
    });
    if (!ready) {
      ready = true;
      render(performance.now());
      onReady();
    }
  };

  const measure = () => {
    const sw = stage.clientWidth || 1;
    const sh = stage.clientHeight || 1;
    renderer.setSize(sw, sh, false);
    camera.aspect = sw / sh;
    camera.position.set(0, 0, sh / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    camera.updateProjectionMatrix();
    const a = row.children[0] as HTMLElement | undefined;
    const b = row.children[1] as HTMLElement | undefined;
    if (!a) return;
    const prevW = cardW;
    const prevH = cardH;
    cardW = a.offsetWidth;
    cardH = a.offsetHeight;
    step = b ? b.offsetLeft - a.offsetLeft : cardW;
    const sr = stage.getBoundingClientRect();
    const ar = a.getBoundingClientRect();
    rowY = sr.top + sh / 2 - (ar.top + cardH / 2);
    shared.uRadius.value = Math.max(900, sw * 1.15);
    meshes.forEach((m) => {
      m.scale.set(cardW, cardH, 1);
      (m.material as THREE.ShaderMaterial).uniforms.uSize?.value.set(cardW, cardH);
    });
    if (cardW !== prevW || cardH !== prevH) void paint();
  };
  measure();
  const ro = new ResizeObserver(measure);
  ro.observe(stage);

  let lastP = -1;
  let vel = 0;
  const render = (t: number) => {
    void t;
    const span = tracked.box.height - window.innerHeight;
    const p = span > 0 ? Math.min(1, Math.max(0, -tracked.top() / span)) : 0;
    const dp = lastP < 0 ? 0 : p - lastP;
    lastP = p;
    // Speed in cards per frame, eased so the effect swells and settles.
    vel += (Math.max(-1, Math.min(1, dp * (n - 1) * 4)) - vel) * 0.1;
    shared.uVel.value = vel;
    const offset = p * (n - 1) * step;
    meshes.forEach((m, i) => {
      m.position.set(i * step - offset, rowY, 0);
      m.visible = Math.abs(m.position.x) < shared.uRadius.value * 1.4;
    });
    renderer.render(scene, camera);
  };

  let unsub: (() => void) | undefined;
  return {
    setVisible(visible: boolean) {
      if (visible && !unsub) unsub = onFrame((t) => ready && render(t));
      if (!visible && unsub) {
        unsub();
        unsub = undefined;
      }
    },
    dispose() {
      unsub?.();
      ro.disconnect();
      drawn++;
      textures.forEach((x) => x.dispose());
      meshes.forEach((m) => (m.material as THREE.Material).dispose());
      geo.dispose();
      renderer.dispose();
    },
  };
}
