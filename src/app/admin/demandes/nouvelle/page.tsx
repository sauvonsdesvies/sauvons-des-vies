
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Nouvelle demande | Fondation Sauvons des Vies",
  robots: { index: false, follow: false },
};

export default function NouvelleDemandePage() {
  redirect("/admin/campagnes/nouvelle");
}
