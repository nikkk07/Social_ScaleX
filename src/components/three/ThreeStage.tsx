'use client';

import React, { useEffect, useRef, useState } from 'react';
import { canRender, whenEngagedAndIdle } from './gate';

/**
 * A progressive-enhancement slot for one small WebGL scene.
 *
 * - The server renders `children` (a static SVG/image fallback). That is all a
 *   crawler, a no-JS visitor, a reduced-motion visitor, a Save-Data visitor or
 *   a browser without WebGL ever sees.
 * - The scene module (and three.js) is a separate chunk, requested only after
 *   the page has loaded, the visitor has interacted, the browser is idle and
 *   the slot is near the viewport.
 *   It is never part of the initial JavaScript, so it cannot delay LCP.
 * - The render loop runs only while the slot is on screen.
 * - The canvas is decorative (`aria-hidden`); every word and link lives in HTML.
 */
export type SceneName = 'feed' | 'brandx';

export interface SceneHandle {
  setVisible: (visible: boolean) => void;
  dispose: () => void;
}

function loadScene(name: SceneName) {
  return name === 'feed' ? import('./scenes/feed') : import('./scenes/brandx');
}

export function ThreeStage({
  scene,
  className = '',
  children,
  data,
}: {
  scene: SceneName;
  className?: string;
  children: React.ReactNode;
  /** Serializable data handed to the scene (e.g. client figures). */
  data?: unknown;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [live, setLive] = useState(false);
  const dataRef = useRef(data);

  useEffect(() => {
    const el = host.current;
    const canvas = canvasRef.current;
    if (!el || !canvas || !canRender()) return;

    let handle: SceneHandle | undefined;
    let cancelled = false;
    let started = false;
    let visible = false;
    let cancelIdle: (() => void) | undefined;

    const start = () => {
      if (started) return;
      started = true;
      loadScene(scene)
        .then((m) => {
          if (cancelled) return;
          handle = m.mount(canvas, el, () => !cancelled && setLive(true), dataRef.current);
          handle.setVisible(visible);
        })
        .catch(() => {
          /* keep the fallback */
        });
    };

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((e) => e.isIntersecting);
        handle?.setVisible(visible);
        if (visible && !started && !cancelIdle) cancelIdle = whenEngagedAndIdle(start);
      },
      { rootMargin: '200px 0px' },
    );
    io.observe(el);

    // A visitor who turns on reduced motion mid-visit gets the static fallback back.
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotion = () => {
      if (!mq.matches) return;
      handle?.dispose();
      handle = undefined;
      cancelled = true;
      setLive(false);
    };
    mq.addEventListener('change', onMotion);

    return () => {
      cancelled = true;
      io.disconnect();
      cancelIdle?.();
      mq.removeEventListener('change', onMotion);
      handle?.dispose();
    };
  }, [scene]);

  return (
    <div ref={host} className={`relative ${className}`}>
      <div aria-hidden="true" className={`h-full w-full transition-opacity duration-700 ${live ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-700 ${live ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}
