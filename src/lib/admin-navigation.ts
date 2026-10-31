
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  HandHeart,
  ClipboardList,
  Wallet,
  Users,
  Hospital,
  Grid2X2,
  PanelsTopLeft,
  Images,
  Newspaper,
  ChartNoAxesCombined,
  UserRound,
  Settings,
  Languages,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

export type AdminNavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  enabled: boolean;
  mobileBottom?: boolean;
  children?: { label: string; href: string }[];
};

export const adminNavigation: AdminNavigationItem[] = [
  {
    label: "Tableau de bord",
    href: "/admin",
    icon: LayoutDashboard,
    enabled: true,
    mobileBottom: true,
  },
  {
    label: "Campagnes",
    href: "/admin/campagnes",
    icon: HandHeart,
    enabled: true,
    mobileBottom: true,
    children: [
      { label: "Nouvelle collecte", href: "/admin/campagnes/nouvelle" },
    ],
  },
  {
    label: "Demandes d'aide",
    href: "/admin/demandes",
    icon: ClipboardList,
    enabled: true,
    mobileBottom: true,
  },
  {
    label: "Dons & Transactions",
    href: "/admin/dons",
    icon: Wallet,
    enabled: true,
    mobileBottom: true,
  },
  {
    label: "Bénéficiaires",
    href: "/admin/beneficiaires",
    icon: Users,
    enabled: true,
  },
  {
    label: "Paiements aux hôpitaux",
    href: "/admin/paiements-hopitaux",
    icon: Hospital,
    enabled: true,
  },
  {
    label: "Catégories",
    href: "/admin/categories",
    icon: Grid2X2,
    enabled: true,
  },
  {
    label: "Contenu du site",
    href: "/admin/contenu",
    icon: PanelsTopLeft,
    enabled: true,
  },
  {
    label: "Médias (Images/Vidéos)",
    href: "/admin/medias",
    icon: Images,
    enabled: true,
  },
  {
    label: "Actualités & Témoignages",
    href: "/admin/actualites",
    icon: Newspaper,
    enabled: true,
  },
  {
    label: "Rapports & Statistiques",
    href: "/admin/rapports",
    icon: ChartNoAxesCombined,
    enabled: true,
  },
  {
    label: "Utilisateurs",
    href: "/admin/utilisateurs",
    icon: UserRound,
    enabled: true,
  },
  {
    label: "Paramètres",
    href: "/admin/parametres",
    icon: Settings,
    enabled: true,
  },
  {
    label: "Traductions",
    href: "/admin/traductions",
    icon: Languages,
    enabled: true,
  },
  {
    label: "Journal d'activités",
    href: "/admin/journal-activites",
    icon: ScrollText,
    enabled: true,
  },
  {
    label: "Sécurité",
    href: "/admin/securite",
    icon: ShieldCheck,
    enabled: true,
  },
];

export const adminBottomNavigation =
  adminNavigation.filter((item) => item.mobileBottom);

export function isAdminNavigationActive(
  pathname: string,
  href: string
): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
