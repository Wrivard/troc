"use client";
import {
  useEffect,
  useRef,
  type ReactNode,
  type HTMLAttributes,
  type PointerEvent,
} from "react";
import { cn } from "../../lib/utils";
/** Frame-batched eased motion. No React updates on pointer movement, no perpetual JS loop. */
export function useCardMotion() {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const position = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const allowed = useRef(false);
  const visible = useRef(true);
  const rect = useRef<DOMRect | null>(null);
  const tick = () => {
    const el = ref.current;
    if (!el) return;
    const p = position.current,
      t = target.current;
    p.x += (t.x - p.x) * 0.14;
    p.y += (t.y - p.y) * 0.14;
    el.style.setProperty("--card-rx", `${p.y.toFixed(3)}deg`);
    el.style.setProperty("--card-ry", `${p.x.toFixed(3)}deg`);
    el.style.setProperty("--card-tx", `${(p.x * 0.8).toFixed(3)}px`);
    el.style.setProperty("--card-ty", `${(-p.y * 0.6).toFixed(3)}px`);
    if (Math.abs(t.x - p.x) + Math.abs(t.y - p.y) > 0.015 && visible.current)
      frame.current = requestAnimationFrame(tick);
    else frame.current = 0;
  };
  const animate = () => {
    if (!frame.current && visible.current)
      frame.current = requestAnimationFrame(tick);
  };
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = matchMedia(
      "(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)",
    );
    const update = () => {
      allowed.current = mq.matches;
      el.dataset.motion = String(mq.matches);
      if (!mq.matches) {
        cancelAnimationFrame(frame.current);
        frame.current = 0;
        position.current = { x: 0, y: 0 };
        target.current = { x: 0, y: 0 };
        for (const name of ["--card-rx", "--card-ry", "--card-tx", "--card-ty"])
          el.style.removeProperty(name);
      }
    };
    update();
    mq.addEventListener("change", update);
    const observer = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
      el.dataset.visible = String(entry.isIntersecting);
      if (!entry.isIntersecting) {
        cancelAnimationFrame(frame.current);
        frame.current = 0;
        target.current = { x: 0, y: 0 };
        position.current = { x: 0, y: 0 };
        for (const name of ["--card-rx", "--card-ry", "--card-tx", "--card-ty"])
          el.style.removeProperty(name);
      }
    });
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frame.current);
      mq.removeEventListener("change", update);
      observer.disconnect();
    };
  }, []);
  return {
    ref,
    onPointerEnter: (e: PointerEvent<HTMLDivElement>) => {
      rect.current = e.currentTarget.getBoundingClientRect();
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      if (!allowed.current || e.pointerType !== "mouse") return;
      const b = rect.current;
      if (!b) return;
      target.current = {
        x:
          Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width) * 2 - 1)) *
          6,
        y:
          Math.max(-1, Math.min(1, 1 - ((e.clientY - b.top) / b.height) * 2)) *
          4.5,
      };
      animate();
    },
    onPointerLeave: () => {
      target.current = { x: 0, y: 0 };
      rect.current = null;
      animate();
    },
  };
}
export function InteractiveCardStack({
  cards,
  label,
  caption,
  compact = false,
}: {
  cards: ReactNode[];
  label: string;
  caption?: ReactNode;
  compact?: boolean;
}) {
  const motion = useCardMotion();
  return (
    <figure
      className={cn(
        "troc-interactive-stack",
        compact && "troc-interactive-stack--compact",
      )}
      aria-label={label}
    >
      <div className="troc-stack-stage" {...motion}>
        <div className="troc-stack-contact" aria-hidden="true" />
        <div className="troc-stack-float">
          {cards.slice(0, 3).map((card, i) => (
            <div className="troc-stack-card" data-layer={i} key={i}>
              {card}
            </div>
          ))}
        </div>
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
export function ProductArtworkPanel({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const motion = useCardMotion();
  return (
    <div className={cn("troc-artwork-panel", className)} {...props} {...motion}>
      {children}
    </div>
  );
}
