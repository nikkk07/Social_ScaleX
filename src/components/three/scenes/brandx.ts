import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { SceneHandle } from '../ThreeStage';
import { trackElement, onFrame } from '@/components/motion/frame';
import { buildMark, studioEnvironment } from './mark';

/**
 * "How we work": the mark turns a quarter turn for each process step as the
 * visitor scrolls the section the host sits in (the nearest <section>).
 */
export function mount(canvas: HTMLCanvasElement, host: HTMLElement, onReady: () => void, _data?: unknown): SceneHandle {
  void _data;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;

  const scene = new THREE.Scene();
  const room = new RoomEnvironment();
  scene.environment = studioEnvironment(renderer, room);
  scene.environmentIntensity = 0.7;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  const mark = buildMark(4);
  scene.add(mark.group);
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(-3, 4, 6);
  scene.add(key);

  const size = () => {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  size();
  const ro = new ResizeObserver(size);
  ro.observe(host);

  const section = trackElement(host.closest('section') ?? host);
  const STEPS = Number(host.dataset.steps ?? '4');
  const g = mark.group;

  let ready = false;
  let unsub: (() => void) | undefined;
  const tick = (t: number) => {
    const r = { top: section.top(), height: section.box.height };
    const vh = window.innerHeight || 1;
    // 0 when the section top reaches mid-screen, 1 when its bottom does.
    const p = Math.min(1, Math.max(0, (vh / 2 - r.top) / Math.max(1, r.height)));
    const step = Math.min(STEPS - 1, Math.floor(p * STEPS));
    g.rotation.z += (-step * (Math.PI / 2) - g.rotation.z) * 0.08;
    g.rotation.x = Math.sin(t / 2200) * 0.22 - 0.1;
    g.rotation.y = Math.cos(t / 2600) * 0.32;
    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
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
      unsub?.();
      ro.disconnect();
      section.dispose();
      mark.dispose();
      scene.environment?.dispose();
      room.dispose();
      renderer.dispose();
    },
  };
}
