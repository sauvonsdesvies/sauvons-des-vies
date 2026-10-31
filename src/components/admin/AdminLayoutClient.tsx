
"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AdminShell from "./AdminShell";
import styles from "@/app/admin/typography.module.css";

export default function AdminLayoutClient({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const isAuthenticationPage =
    pathname === "/admin/connexion" ||
    pathname === "/admin/verification";

  return (
    <div className={`min-h-dvh w-full min-w-0 font-sans antialiased ${isAuthenticationPage ? "" : styles.administration}`}>
      {isAuthenticationPage ? children : <AdminShell>{children}</AdminShell>}
    </div>
  );
}
