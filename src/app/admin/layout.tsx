
import { Suspense, type ReactNode } from "react";
import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div role="status" className="min-h-dvh bg-[#F3F7FC] p-6 font-sans text-sm text-[#082B52]">Chargement de l’administration...</div>}>
      <AdminLayoutClient>{children}</AdminLayoutClient>
    </Suspense>
  );
}
