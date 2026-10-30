import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { SceneHandle } from '../ThreeStage';
import { trackElement, onFrame, scrollState } from '@/components/motion/frame';
import { BRAND } from './brand';
import { buildMark, studioEnvironment } from './mark';

/**
 * Hero: the mark floats at the centre of a tilted ring of vertical Reel
 * cards. The ring turns slowly on its own and faster while the visitor
 * scrolls; the camera leans toward the pointer; scrolling the hero away
 * pulls the camera through the ring.
 *
 * The Reel cards are abstract (shapes and brand colours only: no usernames,
 * captions or numbers), so nothing in them can be mistaken for client work.
 */

const PALETTES: [string, string, string][] = [
  [BRAND.coral, BRAND.paper2, BRAND.ink],
  [BRAND.ink, BRAND.coralOnNight, BRAND.paper],
  [BRAND.positive, BRAND.paper, BRAND.coral],
  [BRAND.paper2, BRAND.coralTint, BRAND.ink],
];

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

/** One abstract Reel frame, 9:16, with rounded corners baked into alpha. */
function reelTexture(variant: number): THREE.CanvasTexture {
  const W = 288;
  const H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const [a, b, ink] = PALETTES[variant % PALETTES.length] ?? PALETTES[0]!;
  roundRect(g, 0, 0, W, H, 34);
  g.clip();
  const bg = g.createLinearGradient(0, 0, W * 0.4, H);
  bg.addColorStop(0, b);
  bg.addColorStop(1, a);
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  g.globalAlpha = 0.9;
  g.fillStyle = ink;
  if (variant % 2 === 0) {
    g.beginPath();
    g.arc(W * 0.62, H * 0.36, W * 0.3, 0, Math.PI * 2);
    g.fill();
    roundRect(g, W * 0.1, H * 0.46, W * 0.48, H * 0.2, 22);
    g.fill();
  } else {
    roundRect(g, W * 0.16, H * 0.2, W * 0.68, H * 0.42, 26);
    g.fill();
    g.fillStyle = a;
    g.beginPath();
    g.arc(W * 0.5, H * 0.41, W * 0.17, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  // Play glyph.
  g.fillStyle = 'rgba(250,248,244,0.92)';
  g.beginPath();
  g.arc(W / 2, H * 0.5, 30, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = BRAND.ink;
  g.beginPath();
  g.moveTo(W / 2 - 9, H * 0.5 - 14);
  g.lineTo(W / 2 + 15, H * 0.5);
  g.lineTo(W / 2 - 9, H * 0.5 + 14);
  g.closePath();
  g.fill();

  // Action column and caption bars, no text.
  g.fillStyle = 'rgba(22,20,15,0.6)';
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.arc(W - 30, H * 0.64 + i * 42, 11, 0, Math.PI * 2);
    g.fill();
  }
  roundRect(g, 22, H - 78, W * 0.58, 12, 6);
  g.fill();
  roundRect(g, 22, H - 56, W * 0.38, 12, 6);
  g.fill();
  // Progress bar.
  g.fillStyle = 'rgba(250,248,244,0.5)';
  g.fillRect(0, H - 6, W, 6);
  g.fillStyle = BRAND.coral;
  g.fillRect(0, H - 6, W * (0.25 + 0.15 * variant), 6);

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const cardVertex = /* glsl */ `
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const cardFragment = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 night;
  uniform vec3 back;
  uniform float fade;
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    vec4 tex = texture2D(map, gl_FrontFacing ? vUv : vec2(1.0 - vUv.x, vUv.y));
    if (tex.a < 0.02) discard;
    vec3 col = gl_FrontFacing ? tex.rgb : mix(back, tex.rgb, 0.12);
    // Depth fog into the night background: far cards recede.
    float fog = smoothstep(9.0, 17.0, vDepth);
    col = mix(col, night, fog * 0.85);
    gl_FragColor = vec4(col, tex.a * fade);
    #include <colorspace_fragment>
  }
`;

export function mount(canvas: HTMLCanvasElement, host: HTMLElement, onReady: () => void): SceneHandle {
  const small = window.matchMedia('(max-width: 767px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  const room = new RoomEnvironment();
  scene.environment = studioEnvironment(renderer, room);
  scene.environmentIntensity = 0.7;

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  const CAM_Z = 12.5;
  camera.position.set(0, 0.4, CAM_Z);

  // The mark.
  const mark = buildMark(3.6);
  scene.add(mark.group);
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-4, 5, 7);
  scene.add(key);
  const rim = new THREE.PointLight(new THREE.Color(BRAND.coralOnNight), 18, 14);
  rim.position.set(3, -2, 2);
  scene.add(rim);

  // The ring of Reels.
  const COUNT = small ? 8 : 12;
  const RADIUS = small ? 3.9 : 4.6;
  const textures = PALETTES.map((_, i) => reelTexture(i));
  const cardGeo = new THREE.PlaneGeometry(1.15, 1.15 * (16 / 9));
  const nightColor = new THREE.Color(BRAND.ink);
  const materials = textures.map(
    (map) =>
      new THREE.ShaderMaterial({
        uniforms: { map: { value: map }, night: { value: nightColor }, back: { value: new THREE.Color('#25221B') }, fade: { value: 1 } },
        vertexShader: cardVertex,
        fragmentShader: cardFragment,
        side: THREE.DoubleSide,
        transparent: true,
      }),
  );
  const ring = new THREE.Group();
  for (let i = 0; i < COUNT; i++) {
    const a = (i / COUNT) * Math.PI * 2;
    const card = new THREE.Mesh(cardGeo, materials[i % materials.length]);
    card.position.set(Math.sin(a) * RADIUS, Math.sin(a * 2) * 0.25, Math.cos(a) * RADIUS);
    card.rotation.y = a; // faces outward, so the near side faces the camera
    ring.add(card);
  }
  const tilt = new THREE.Group();
  tilt.rotation.set(0.32, 0, -0.16);
  tilt.add(ring);
  scene.add(tilt);

  // A slow drift of fine dust, for depth.
  const DUST = small ? 120 : 260;
  const dustPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 18;
    dustPos[i * 3 + 1] = (Math.random() - 0.5) * 10;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 14;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({ color: BRAND.paper, size: 0.035, transparent: true, opacity: 0.45, depthWrite: false });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  let zBase = CAM_Z;
  const size = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Keep the whole ring in frame on narrow stages.
    zBase = CAM_Z * Math.max(1, 1.05 / camera.aspect);
    camera.updateProjectionMatrix();
  };
  size();
  const ro = new ResizeObserver(size);
  ro.observe(host);

  const pointer = { x: 0, y: 0 };
  const smooth = { x: 0, y: 0 };
  const onMove = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  const section = trackElement(host.closest('section') ?? host);
  let spin = 0;
  let lastOpacity = '';
  let last = 0;
  let ready = false;
  let unsub: (() => void) | undefined;

  const tick = (t: number) => {
    const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016);
    last = t;
    const r = { top: section.top(), height: section.box.height };
    const away = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));

    // Idle turn plus a push from scroll speed, eased so it never jerks.
    spin += dt * (0.14 + Math.min(1.6, Math.abs(scrollState.velocity) * 0.02));
    ring.rotation.y = spin;

    const g = mark.group;
    g.rotation.y = Math.sin(t / 2400) * 0.45 + smooth.x * 0.35;
    g.rotation.x = Math.cos(t / 2900) * 0.12 - smooth.y * 0.2;
    g.position.y = Math.sin(t / 1800) * 0.08;

    smooth.x += (pointer.x - smooth.x) * 0.05;
    smooth.y += (pointer.y - smooth.y) * 0.05;
    camera.position.x = smooth.x * 0.9;
    camera.position.y = 0.4 - smooth.y * 0.5 + away * 1.2;
    camera.position.z = Math.max(4, zBase - away * 6);
    camera.lookAt(0, away * 0.6, 0);

    dust.rotation.y = t / 40000;
    const fade = 1 - away * 0.85;
    materials.forEach((m) => {
      const u = m.uniforms.fade;
      if (u) u.value = fade;
    });
    const op = ready ? (1 - away * 0.7).toFixed(2) : '';
    if (op !== lastOpacity) canvas.style.opacity = lastOpacity = op;

    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      onReady();
    }
  };

  return {
    setVisible(visible) {
      if (visible && !unsub) {
        last = 0;
        unsub = onFrame(tick);
      }
      if (!visible && unsub) {
        unsub();
        unsub = undefined;
      }
    },
    dispose() {
      unsub?.();
      ro.disconnect();
      section.dispose();
      window.removeEventListener('pointermove', onMove);
      mark.dispose();
      textures.forEach((x) => x.dispose());
      materials.forEach((x) => x.dispose());
      cardGeo.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      scene.environment?.dispose();
      room.dispose();
      renderer.dispose();
    },
  };
}
