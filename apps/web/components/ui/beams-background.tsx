"use client";

import { useEffect, useMemo, useRef } from "react";

interface BeamsBackgroundProps {
  intensity?: "subtle" | "medium" | "strong";
}

interface Beam {
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  speed: number;
  opacity: number;
  hue: number;
}

const FPS = 24;
const FRAME_MS = 1000 / FPS;

const createBeam = (viewportWidth: number, viewportHeight: number): Beam => ({
  x: Math.random() * viewportWidth * 1.2 - viewportWidth * 0.1,
  y: Math.random() * viewportHeight * 1.3 - viewportHeight * 0.15,
  width: 28 + Math.random() * 36,
  length: viewportHeight * 2.1,
  angle: -34 + Math.random() * 8,
  speed: 0.45 + Math.random() * 0.45,
  opacity: 0.11 + Math.random() * 0.1,
  hue: 195 + Math.random() * 55,
});

export function BeamsBackground({ intensity = "strong" }: BeamsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const beamsRef = useRef<Beam[]>([]);
  const rafRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  const beamCount = useMemo(() => {
    if (intensity === "subtle") return 6;
    if (intensity === "medium") return 9;
    return 12;
  }, [intensity]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const initCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      canvas.width = Math.floor(viewportWidth * dpr);
      canvas.height = Math.floor(viewportHeight * dpr);
      canvas.style.width = `${viewportWidth}px`;
      canvas.style.height = `${viewportHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      beamsRef.current = Array.from({ length: beamCount }, () =>
        createBeam(viewportWidth, viewportHeight),
      );
    };

    const resetBeam = (beam: Beam, viewportWidth: number, viewportHeight: number) => {
      beam.y = viewportHeight + 120;
      beam.x = Math.random() * viewportWidth * 1.1 - viewportWidth * 0.05;
      beam.width = 28 + Math.random() * 36;
      beam.speed = 0.45 + Math.random() * 0.45;
      beam.hue = 195 + Math.random() * 55;
      beam.opacity = 0.11 + Math.random() * 0.1;
    };

    const drawBeam = (beam: Beam) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, beam.length);
      gradient.addColorStop(0, `hsla(${beam.hue}, 84%, 64%, 0)`);
      gradient.addColorStop(0.24, `hsla(${beam.hue}, 84%, 64%, ${beam.opacity})`);
      gradient.addColorStop(0.76, `hsla(${beam.hue}, 84%, 64%, ${beam.opacity})`);
      gradient.addColorStop(1, `hsla(${beam.hue}, 84%, 64%, 0)`);

      ctx.save();
      ctx.translate(beam.x, beam.y);
      ctx.rotate((beam.angle * Math.PI) / 180);
      ctx.fillStyle = gradient;
      ctx.fillRect(-beam.width / 2, 0, beam.width, beam.length);
      ctx.restore();
    };

    const render = (time: number) => {
      if (time - lastFrameTimeRef.current < FRAME_MS) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }

      lastFrameTimeRef.current = time;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      ctx.clearRect(0, 0, viewportWidth, viewportHeight);
      ctx.filter = "blur(18px)";

      for (const beam of beamsRef.current) {
        beam.y -= beam.speed;
        if (beam.y + beam.length < -120) {
          resetBeam(beam, viewportWidth, viewportHeight);
        }
        drawBeam(beam);
      }

      rafRef.current = requestAnimationFrame(render);
    };

    const onResize = () => {
      initCanvas();
    };

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafRef.current);
      } else {
        lastFrameTimeRef.current = 0;
        rafRef.current = requestAnimationFrame(render);
      }
    };

    initCanvas();
    rafRef.current = requestAnimationFrame(render);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(rafRef.current);
    };
  }, [beamCount]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        backgroundColor: "#070D1A",
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.85,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 15%, rgba(14,95,255,0.12), transparent 45%), radial-gradient(circle at 80% 30%, rgba(42,184,255,0.08), transparent 40%)",
        }}
      />
    </div>
  );
}
