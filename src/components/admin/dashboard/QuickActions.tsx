
import Link from "next/link";
import { Plus, ClipboardCheck, HeartHandshake, Hospital } from "lucide-react";

const icons = [Plus, ClipboardCheck, HeartHandshake, Hospital];

const actions = [
  {
    title: "Créer une campagne",
    description: "Préparer une nouvelle collecte",
    href: "/admin/campagnes/nouvelle",
  },
  {
    href: "/admin/demandes",
    title: "Examiner les demandes",
    description: "Vérifier les dossiers reçus",
  },
  {
    href: "/admin/dons",
    title: "Publications de dons",
    description: "Suivre les paiements",
  },
  {
    href: "/admin/paiements-hopitaux",
    title: "Paiements hospitaliers",
    description: "Contrôler les versements",
  },
];

export default function QuickActions() {
  return (
    <section className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-slate-900">
        Actions rapides
      </h2>
      

      <div className="mt-4 grid grid-cols-2 gap-2">
        {actions.map((action, index) => (
          <Link key={action.href} href={action.href} className={"flex min-h-16 min-w-0 items-center rounded-lg p-3 text-xs font-semibold leading-5 text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 " + ["bg-blue-600 hover:bg-blue-700", "bg-emerald-600 hover:bg-emerald-700", "bg-orange-500 hover:bg-orange-600", "bg-violet-600 hover:bg-violet-700"][index]}>
            {(() => { const Icon = icons[index]; return <Icon aria-hidden="true" className="mr-2 h-5 w-5 shrink-0" />; })()}
            {action.title}
          </Link>
        ))}
      </div>
    </section>
  );
}
