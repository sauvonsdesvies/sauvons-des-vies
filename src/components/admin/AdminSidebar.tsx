
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";
import {
  adminNavigation,
  isAdminNavigationActive,
} from "@/lib/admin-navigation";

type AdminSidebarProps = {
  onNavigate?: () => void;
};

export default function AdminSidebar({
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#082B52] text-white">
      <div className="shrink-0 border-b border-white/10 px-5 py-6">
        <Link
          href="/admin"
          onClick={onNavigate}
          className="flex flex-col items-center gap-3"
        >
          <Image
            src="/logo/logo.png"
            alt="Fondation Sauvons des Vies"
            width={180}
            height={100}
            className="h-auto max-h-24 w-auto max-w-full object-contain"
            priority
          />

          <span className="text-center text-xs font-medium text-slate-300">
            Espace d&apos;administration
          </span>
        </Link>
      </div>

      <nav
        aria-label="Navigation administrateur"
        className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4"
      >
        {adminNavigation.map((item) => {
          const Icon = item.icon;
          const active = isAdminNavigationActive(
            pathname,
            item.href
          );

          const commonClass =
            "flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors";

          if (item.enabled && item.children?.length) {
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={`${commonClass} ${pathname === item.href ? "bg-[#0868DB] text-white shadow-sm" : active ? "text-white hover:bg-white/10" : "text-slate-200 hover:bg-white/10 hover:text-white"}`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
                <ul className="ml-5 space-y-1 border-l border-white/20 pl-2">
                  {item.children.map((child) => {
                    const childActive = isAdminNavigationActive(pathname, child.href);
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={onNavigate}
                          aria-current={childActive ? "page" : undefined}
                          className={`${commonClass} ${childActive ? "bg-[#0868DB] text-white shadow-sm" : "text-slate-200 hover:bg-white/10 hover:text-white"}`}
                        >
                          {child.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          }

          if (!item.enabled) {
            return (
              <div
                key={item.href}
                aria-disabled="true"
                title="Disponible prochainement"
                className={`${commonClass} cursor-not-allowed text-slate-400`}
              >
                <Icon
                  className="h-[18px] w-[18px] shrink-0"
                  aria-hidden="true"
                />
                <span className="flex-1">{item.label}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`${commonClass} ${
                active
                  ? "bg-[#0868DB] text-white shadow-sm"
                  : "text-slate-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon
                className="h-[18px] w-[18px] shrink-0"
                aria-hidden="true"
              />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between rounded-lg px-3 py-3 text-sm text-slate-200 transition hover:bg-white/10"
        >
          <span>Voir le site public</span>
          <ExternalLink
            className="h-4 w-4"
            aria-hidden="true"
          />
        </Link>
      </div>
    </div>
  );
}
