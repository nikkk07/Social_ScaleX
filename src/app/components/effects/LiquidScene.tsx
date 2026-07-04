import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

/*
 * Caps the render loop at `fps`, and stops rendering entirely once the
 * user scrolls well past the hero (the shapes have drifted out of the
 * visible gaps by then). Below the fold the page costs zero GPU per
 * frame — the canvas simply holds its last frame. The loop also skips
 * while the tab is hidden.
 */
function FrameLimiter({ fps = 60 }: { fps?: number }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const interval = 1000 / fps;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      if (window.scrollY > window.innerHeight * 1.6) return;
      if (t - last >= interval - 1) {
        last = t;
        invalidate();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fps, invalidate]);
  return null;
}

/* ── Soft glow blobs (refracted by the glass shapes) ────────────── */

function makeGlowTexture(rgb: string) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  g.addColorStop(0, `rgba(${rgb}, 0.9)`);
  g.addColorStop(0.4, `rgba(${rgb}, 0.35)`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

function GlowSprite({
  rgb,
  position,
  scale,
  opacity = 0.5,
}: {
  rgb: string;
  position: [number, number, number];
  scale: number;
  opacity?: number;
}) {
  const texture = useMemo(() => makeGlowTexture(rgb), [rgb]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite position={position} scale={[scale, scale, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={opacity}
      />
    </sprite>
  );
}

/* ── Liquid glass shapes ────────────────────────────────────────── */

/*
 * Iridescent physical glass. Unlike MeshTransmissionMaterial this does
 * NOT re-render the scene into a buffer per shape per frame — it's a
 * single cheap pass, with thin-film iridescence supplying the liquid
 * chromatic sheen against the glow sprites behind.
 */
function GlassMaterial() {
  return (
    <meshPhysicalMaterial
      transparent
      opacity={0.34}
      roughness={0.06}
      metalness={0}
      clearcoat={1}
      clearcoatRoughness={0.08}
      iridescence={1}
      iridescenceIOR={1.35}
      iridescenceThicknessRange={[140, 560]}
      envMapIntensity={2.4}
      color="#cabcf5"
      depthWrite={false}
    />
  );
}

function GlassShapes({ low }: { low: boolean }) {
  const group = useRef<THREE.Group>(null);
  const torus = useRef<THREE.Mesh>(null);
  const blob = useRef<THREE.Mesh>(null);
  const lens = useRef<THREE.Mesh>(null);
  const maxScroll = useRef(1);
  const pointer = useRef({ x: 0, y: 0 });

  // Cache the scroll range — reading scrollHeight inside the frame
  // loop can force synchronous layout. Pointer comes from a window
  // listener because the canvas wrapper is pointer-events-none, so
  // R3F's own pointer state never updates.
  useEffect(() => {
    const measure = () => {
      maxScroll.current = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
    };
    const onPointer = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("pointermove", onPointer, { passive: true });
    const timer = window.setTimeout(measure, 1500);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("pointermove", onPointer);
      window.clearTimeout(timer);
    };
  }, []);

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;

    // Cursor parallax — spring toward pointer
    const targetX = pointer.current.y * 0.18;
    const targetY = pointer.current.x * 0.28;
    group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, targetX, 2.2, delta);
    group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, targetY, 2.2, delta);

    // Scroll response — the whole constellation drifts and rolls as you scroll
    const progress = window.scrollY / maxScroll.current;
    group.current.position.y = 0.6 + progress * 3.2;
    group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, progress * Math.PI * 0.5, 1.8, delta);

    // Slow self-rotation for liquid highlights
    if (torus.current) {
      torus.current.rotation.x = t * 0.18;
      torus.current.rotation.y = t * 0.12;
    }
    if (blob.current) {
      blob.current.rotation.y = -t * 0.15;
      blob.current.rotation.z = t * 0.08;
    }
    if (lens.current) {
      lens.current.rotation.z = t * 0.1;
    }
  });

  return (
    <group ref={group}>
      {/* Big liquid ring — right of the hero headline */}
      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.9}>
        <mesh ref={torus} position={[3.1, 0.4, -1]}>
          <torusGeometry args={[1.5, 0.58, 32, 96]} />
          <GlassMaterial />
        </mesh>
      </Float>

      {/* Organic glass pebble — left */}
      <Float speed={1.6} rotationIntensity={0.5} floatIntensity={1.2}>
        <mesh ref={blob} position={[-3.4, -0.9, -1.6]}>
          <icosahedronGeometry args={[1.15, 12]} />
          <GlassMaterial />
        </mesh>
      </Float>

      {/* Floating lens — top left, catches chromatic light */}
      {!low && (
        <Float speed={2} rotationIntensity={0.6} floatIntensity={1.4}>
          <mesh ref={lens} position={[-1.6, 2.3, -2.4]} scale={[1, 1, 0.35]}>
            <sphereGeometry args={[0.85, 32, 32]} />
            <GlassMaterial />
          </mesh>
        </Float>
      )}
    </group>
  );
}

/* ── Scene ──────────────────────────────────────────────────────── */

function Scene({ low }: { low: boolean }) {
  return (
    <>
      <ambientLight intensity={0.4} />

      {/* Color fields the glass refracts */}
      <GlowSprite rgb="139, 92, 246" position={[-3.5, 1.8, -6]} scale={11} opacity={0.55} />
      <GlowSprite rgb="52, 211, 153" position={[4.2, -2.2, -7]} scale={10} opacity={0.4} />
      <GlowSprite rgb="34, 211, 238" position={[0.5, 3.4, -8]} scale={9} opacity={0.3} />
      <GlowSprite rgb="167, 139, 250" position={[2.4, 1.2, -5]} scale={6} opacity={0.35} />

      <GlassShapes low={low} />

      {/* Local environment — specular highlights without network fetches */}
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer form="circle" intensity={4} position={[0, 5, -9]} scale={2} />
          <Lightformer form="rect" intensity={3} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[6, 1, 1]} />
          <Lightformer form="rect" intensity={3} position={[10, 1, 0]} rotation-y={-Math.PI / 2} scale={[10, 1.5, 1]} />
          <Lightformer form="ring" intensity={2} position={[0, -4, 6]} scale={3} color="#a78bfa" />
        </group>
      </Environment>
    </>
  );
}

/* ── Lazy-loaded canvas (see LiquidBackground.tsx) ──────────────── */

export default function LiquidCanvas({ low }: { low: boolean }) {
  return (
    <Canvas
      className="absolute inset-0"
      camera={{ position: [0, 0, 9], fov: 42 }}
      dpr={low ? 1 : [1, 1.25]}
      frameloop="demand"
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
      }}
    >
      <FrameLimiter fps={60} />
      <Scene low={low} />
    </Canvas>
  );
}
