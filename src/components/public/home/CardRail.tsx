"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

// Manual navigation preserves reading position and never advances while someone is reading.
export default function CardRail({ children, count, label, compact = false, paginationDots = false }: {
  children: ReactNode;
  count: number;
  label: string;
  compact?: boolean;
  paginationDots?: boolean;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: count <= 1, active: 0 });
  const { language } = useTranslation();
  const labels = {
    fr: ["Précédent", "Suivant"], en: ["Previous", "Next"],
    es: ["Anterior", "Siguiente"], de: ["Zurück", "Weiter"],
  }[language];

  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const update = () => {
      const active = Math.min(count - 1, Math.max(0, Math.round(element.scrollLeft / ((element.firstElementChild?.getBoundingClientRect().width ?? element.clientWidth) + 12))));
      const next = { active, start: element.scrollLeft <= 2, end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2 };
      setEdges(previous => previous.start === next.start && previous.end === next.end && previous.active === next.active ? previous : next);
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener("scroll", update, { passive: true });
    const frame = requestAnimationFrame(update);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); element.removeEventListener("scroll", update); };
  }, [count]);

  function move(direction: number) {
    const element = viewport.current;
    if (!element) return;
    element.scrollBy({ left: direction * (element.firstElementChild?.getBoundingClientRect().width ?? element.clientWidth) + direction * 12, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  return <div className="min-w-0">
    <div ref={viewport} role="region" aria-label={label} tabIndex={0}
      className={`grid snap-x snap-mandatory auto-cols-[100%] grid-flow-col gap-3 overflow-x-auto overscroll-x-contain rounded-xl pb-2 [scrollbar-width:thin] [scrollbar-color:#B7DDE7_transparent] focus-visible:outline-2 focus-visible:outline-[#008DA8] ${count === 1 ? "sm:auto-cols-[100%]" : count === 2 ? "sm:auto-cols-[calc((100%_-_12px)/2)]" : compact ? "sm:auto-cols-[calc((100%_-_12px)/2)] 2xl:auto-cols-[calc((100%_-_24px)/3)]" : "sm:auto-cols-[calc((100%_-_12px)/2)] lg:auto-cols-[calc((100%_-_24px)/3)]"} [&>*]:min-w-0 [&>*]:snap-start`}>
      {children}
    </div>
    {paginationDots && count > 1 && <div className="mt-1 flex justify-center gap-1 sm:hidden">{Array.from({ length: count }, (_, index) => <button key={index} type="button" aria-label={label + " " + (index + 1)} aria-current={index === edges.active ? "true" : undefined} className="flex h-8 w-8 items-center justify-center" onClick={() => { const el = viewport.current; if (el) el.scrollTo({ left: index * ((el.firstElementChild?.getBoundingClientRect().width ?? el.clientWidth) + 12), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }}><span className={index === edges.active ? "h-2 w-2 rounded-full bg-[#008DA8]" : "h-2 w-2 rounded-full bg-slate-200"} /></button>)}</div>}
    {count > 1 && <div className={paginationDots ? "mt-1 hidden items-center justify-end gap-2 sm:flex" : "mt-1 flex items-center justify-end gap-2"}>
      <button type="button" onClick={() => move(-1)} disabled={edges.start} aria-label={`${labels[0]} — ${label}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D5E5EE] bg-white text-[#007F9E] disabled:opacity-30"><ChevronLeft size={18} /></button>
      <button type="button" onClick={() => move(1)} disabled={edges.end} aria-label={`${labels[1]} — ${label}`} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#D5E5EE] bg-white text-[#007F9E] disabled:opacity-30"><ChevronRight size={18} /></button>
    </div>}
  </div>;
}
