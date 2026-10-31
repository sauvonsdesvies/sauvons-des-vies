
"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

type AdminMobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

export default function AdminMobileMenu({
  open,
  onClose,
}: AdminMobileMenuProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Fermer le menu"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu administrateur"
        className="absolute inset-y-0 left-0 flex w-[min(85vw,320px)] flex-col bg-[#082B52] shadow-2xl"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Fermer le menu administrateur"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>

        <AdminSidebar onNavigate={onClose} />
      </aside>
    </div>
  );
}
