
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminNavigation, isAdminNavigationActive } from "@/lib/admin-navigation";
import {
  LayoutDashboard,
  HandHeart,
  Wallet,
  ClipboardList,
  Ellipsis,
} from "lucide-react";

type AdminBottomNavProps = {
  onOpenMenu: () => void;
};

const bottomItems = [
  {
    label: "Accueil",
    href: "/admin",
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    label: "Campagnes",
    href: "/admin/campagnes",
    icon: HandHeart,
    enabled: false,
  },
  {
    label: "Dons",
    href: "/admin/dons",
    icon: Wallet,
    enabled: false,
  },
  {
    label: "Demandes",
    href: "/admin/demandes",
    icon: ClipboardList,
    enabled: false,
  },
].map((item) => {
  const navigation = adminNavigation.find((entry) => entry.href === item.href);
  return {
    ...item,
    href: navigation?.href ?? item.href,
    enabled: navigation?.enabled ?? item.enabled,
  };
});

export default function AdminBottomNav({
  onOpenMenu,
}: AdminBottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation mobile administrateur"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="grid h-16 grid-cols-5 items-stretch">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isAdminNavigationActive(pathname, item.href);

          const content = (
            <>
              <Icon
                className="h-5 w-5"
                strokeWidth={active ? 2.6 : 2}
                aria-hidden="true"
              />
              <span className="text-xs font-medium">
                {item.label}
              </span>
            </>
          );

          if (!item.enabled) {
            return (
              <div
                key={item.href}
                aria-disabled="true"
                title="Disponible prochainement"
                className="flex flex-col items-center justify-center gap-1 text-slate-400"
              >
                {content}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                active
                  ? "text-[#0868DB]"
                  : "text-slate-500 hover:text-[#0868DB]"
              }`}
            >
              {content}
            </Link>
          );
        })}

        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Afficher tous les menus"
          className="flex flex-col items-center justify-center gap-1 text-slate-600 transition-colors hover:text-[#0868DB]"
        >
          <Ellipsis
            className="h-5 w-5"
            aria-hidden="true"
          />
          <span className="text-xs font-medium">
            Plus
          </span>
        </button>
      </div>
    </nav>
  );
}
