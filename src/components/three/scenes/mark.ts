import * as THREE from 'three';
import { BRAND } from './brand';

/**
 * The Social ScaleX mark as geometry, built from the logo's own two strokes
 * (public/logo.png, 512 px): a wide paper bar from top-left to bottom-right,
 * crossed by a rounded coral stroke rising to the right. Positions, angles and
 * widths are measured from the file; nothing is restyled. One logo pixel is
 * `size / 512` scene units.
 */
export function buildMark(size = 4) {
  const PX = size / 512;
  const depth = size * 0.085;

  const barGeo = new THREE.BoxGeometry(Math.hypot(211, 329) * PX, 78 * PX, depth);
  const barMat = new THREE.MeshPhysicalMaterial({ color: BRAND.paper, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.3 });
  const bar = new THREE.Mesh(barGeo, barMat);
  bar.rotation.z = Math.atan2(-329, 211);
  bar.position.set(-20 * PX, -5 * PX, 0);

  const coralLen = Math.hypot(247, 307) * PX;
  const coralGeo = new THREE.CapsuleGeometry(22 * PX, coralLen - 44 * PX, 10, 32);
  const coralMat = new THREE.MeshPhysicalMaterial({ color: BRAND.coralOnNight, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15 });
  const coral = new THREE.Mesh(coralGeo, coralMat);
  coral.rotation.z = Math.atan2(307, 247) - Math.PI / 2; // capsule axis is Y
  coral.position.set(14 * PX, 15 * PX, depth * 0.7);

  const group = new THREE.Group();
  group.add(bar, coral);
  return {
    group,
    dispose() {
      barGeo.dispose();
      barMat.dispose();
      coralGeo.dispose();
      coralMat.dispose();
    },
  };
}

/** Soft studio reflections without downloading an HDR file. */
export function studioEnvironment(renderer: THREE.WebGLRenderer, room: THREE.Scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(room, 0.04).texture;
  pmrem.dispose();
  return env;
}
