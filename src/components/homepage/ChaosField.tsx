"use client";

import { useEffect, useRef } from "react";
import { AppWindow, Bookmark, FileText, Terminal, type LucideIcon } from "lucide-react";
import { GitHubMark, NotionMark, SlackMark, VSCodeMark } from "@/components/homepage/BrandMarks";

interface ChaosIcon {
  title: string;
  Icon: LucideIcon | typeof GitHubMark;
  color: string;
  // Static scatter shown before JS runs and under reduced motion.
  initial: string;
}

const ICONS: ChaosIcon[] = [
  { title: "Notion", Icon: NotionMark, color: "#f4f4f5", initial: "translate(8%, 14%) rotate(-8deg)" },
  { title: "GitHub", Icon: GitHubMark, color: "#f5f5f5", initial: "translate(210%, 36%) rotate(6deg)" },
  { title: "Slack", Icon: SlackMark, color: "#f4f4f5", initial: "translate(430%, 20%) rotate(-4deg)" },
  { title: "VS Code", Icon: VSCodeMark, color: "#f4f4f5", initial: "translate(90%, 170%) rotate(10deg)" },
  { title: "Browser tabs", Icon: AppWindow, color: "#a5b4fc", initial: "translate(330%, 190%) rotate(-10deg)" },
  { title: "Terminal", Icon: Terminal, color: "#67e8f9", initial: "translate(40%, 390%) rotate(5deg)" },
  { title: "Text file", Icon: FileText, color: "#cbd5e1", initial: "translate(240%, 330%) rotate(-6deg)" },
  { title: "Bookmark", Icon: Bookmark, color: "#fcd34d", initial: "translate(420%, 420%) rotate(8deg)" },
];

const REPEL_RADIUS = 120;
const REPEL_FORCE = 2600; // px/s² at the cursor, fading to 0 at the radius
const MAX_SPEED = 320; // px/s
const TAU = Math.PI * 2;

interface Particle {
  el: HTMLElement;
  size: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSpeed: number;
  phase: number;
  wobble: number; // max rotation, degrees
}

const random = (min: number, max: number) => min + Math.random() * (max - min);

function createParticle(el: HTMLElement): Particle {
  const angle = random(0, TAU);
  const baseSpeed = random(28, 48);
  return {
    el,
    size: el.offsetWidth || 52,
    x: 0,
    y: 0,
    vx: Math.cos(angle) * baseSpeed,
    vy: Math.sin(angle) * baseSpeed,
    baseSpeed,
    phase: random(0, TAU),
    wobble: random(6, 14),
  };
}

// Spread icons over a jittered 4×2 grid so they don't start stacked.
function scatter(particles: Particle[], width: number, height: number) {
  const cols = 4;
  const cellW = width / cols;
  const cellH = height / Math.ceil(particles.length / cols);
  particles.forEach((p, i) => {
    p.x = (i % cols) * cellW + random(0, Math.max(0, cellW - p.size));
    p.y = Math.floor(i / cols) * cellH + random(0, Math.max(0, cellH - p.size));
  });
}

function render(particles: Particle[], time: number) {
  const t = time / 1000;
  for (const p of particles) {
    const rotation = Math.sin(t * 0.7 + p.phase) * p.wobble;
    const scale = 1 + Math.sin(t * 1.4 + p.phase * 2) * 0.06;
    p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${rotation}deg) scale(${scale})`;
  }
}

type Pointer = { x: number; y: number; active: boolean };

function repel(p: Particle, pointer: Pointer, dt: number) {
  const dx = p.x + p.size / 2 - pointer.x;
  const dy = p.y + p.size / 2 - pointer.y;
  const dist = Math.hypot(dx, dy) || 1;
  if (dist >= REPEL_RADIUS) return;
  const push = REPEL_FORCE * (1 - dist / REPEL_RADIUS) * dt;
  p.vx += (dx / dist) * push;
  p.vy += (dy / dist) * push;
}

function step(particles: Particle[], pointer: Pointer, width: number, height: number, dt: number) {
  for (const p of particles) {
    if (pointer.active) repel(p, pointer, dt);

    // Ease speed back toward the icon's cruising speed after a push.
    const speed = Math.hypot(p.vx, p.vy) || 1;
    const target = Math.min(speed + (p.baseSpeed - speed) * Math.min(1, dt * 1.6), MAX_SPEED);
    p.vx = (p.vx / speed) * target;
    p.vy = (p.vy / speed) * target;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Bounce off the walls.
    const maxX = width - p.size;
    const maxY = height - p.size;
    if (p.x < 0 || p.x > maxX) {
      p.x = Math.min(Math.max(p.x, 0), maxX);
      p.vx = p.x === 0 ? Math.abs(p.vx) : -Math.abs(p.vx);
    }
    if (p.y < 0 || p.y > maxY) {
      p.y = Math.min(Math.max(p.y, 0), maxY);
      p.vy = p.y === 0 ? Math.abs(p.vy) : -Math.abs(p.vy);
    }
  }
}

// "Your knowledge today": icons drift, bounce off the walls, wobble and pulse,
// and flee the cursor. Pauses off screen and under prefers-reduced-motion.
export function ChaosField() {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const particles = Array.from(field.children as HTMLCollectionOf<HTMLElement>, createParticle);
    const pointer: Pointer = { x: 0, y: 0, active: false };
    let width = field.clientWidth;
    let height = field.clientHeight;
    let frameId = 0;
    let lastTime = 0;
    let inView = true;

    const frame = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05); // clamp after tab switches
      lastTime = time;
      step(particles, pointer, width, height, dt);
      render(particles, time);
      frameId = requestAnimationFrame(frame);
    };
    const start = () => {
      if (frameId || reducedMotion.matches || !inView) return;
      lastTime = performance.now();
      frameId = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(frameId);
      frameId = 0;
    };
    const updatePointer = (event: PointerEvent) => {
      const rect = field.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };
    const releasePointer = () => {
      pointer.active = false;
    };
    const onMotionChange = () => (reducedMotion.matches ? stop() : start());

    field.addEventListener("pointermove", updatePointer);
    field.addEventListener("pointerdown", updatePointer);
    field.addEventListener("pointerleave", releasePointer);
    field.addEventListener("pointercancel", releasePointer);
    reducedMotion.addEventListener("change", onMotionChange);

    const resizeObserver = new ResizeObserver(() => {
      width = field.clientWidth;
      height = field.clientHeight;
      for (const p of particles) {
        p.x = Math.min(p.x, Math.max(0, width - p.size));
        p.y = Math.min(p.y, Math.max(0, height - p.size));
      }
      if (!frameId) render(particles, performance.now());
    });
    resizeObserver.observe(field);

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) start();
      else stop();
    });
    visibilityObserver.observe(field);

    scatter(particles, width, height);
    render(particles, 0);
    start();

    return () => {
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      reducedMotion.removeEventListener("change", onMotionChange);
      field.removeEventListener("pointermove", updatePointer);
      field.removeEventListener("pointerdown", updatePointer);
      field.removeEventListener("pointerleave", releasePointer);
      field.removeEventListener("pointercancel", releasePointer);
    };
  }, []);

  return (
    <div
      ref={fieldRef}
      className="relative h-[300px] touch-pan-y overflow-hidden rounded-[18px] border border-dashed border-home-border-strong bg-home-elev bg-[radial-gradient(circle_at_30%_30%,rgb(239_68_68/0.06),transparent_60%),repeating-linear-gradient(-45deg,transparent_0_14px,rgb(255_255_255/0.015)_14px_15px)] md:h-[340px]"
    >
      {ICONS.map(({ title, Icon, color, initial }) => (
        <div
          key={title}
          title={title}
          className="absolute top-0 left-0 grid size-[52px] place-items-center rounded-[14px] border border-home-border-strong bg-home-surface-2 shadow-[0_10px_24px_-12px_rgb(0_0_0/0.8)] will-change-transform [&_svg]:size-[26px] [&_svg]:[stroke-width:1.8]"
          style={{ color, transform: initial }}
        >
          <Icon />
        </div>
      ))}
    </div>
  );
}
