
"use client";

import {
  useCallback,
  useState,
  type ReactNode,
} from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminMobileMenu from "./AdminMobileMenu";
import AdminBottomNav from "./AdminBottomNav";

type AdminShellProps = {
  children: ReactNode;
};

export default function AdminShell({
  children,
}: AdminShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const openMobileMenu = useCallback(() => {
    setMobileMenuOpen(true);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <div className="min-h-dvh w-full min-w-0 bg-[#F3F7FC] text-[#082B52]">
      {/* Navigation PC */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <AdminSidebar />
      </aside>

      {/* Zone principale */}
      <div className="flex min-h-dvh w-full min-w-0 flex-col lg:pl-64">
        <AdminHeader onOpenMenu={openMobileMenu} />

        <main
          id="admin-main-content"
          className="w-full min-w-0 max-w-none flex-1 px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6 lg:pb-6"
        >
          {children}
        </main>
      </div>

      {/* Navigation mobile */}
      <AdminBottomNav onOpenMenu={openMobileMenu} />

      <AdminMobileMenu
        open={mobileMenuOpen}
        onClose={closeMobileMenu}
      />
    </div>
  );
}
