
import CampaignForm from "./CampaignForm";

export default function CampaignCreatePage() {
  return (
    <div className="w-full min-w-0 [overflow-wrap:anywhere]">
      <header className="mb-7">
        <p className="mb-2 text-sm font-medium text-blue-700">
          Administration / Campagnes / Nouvelle collecte
        </p>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Mise en ligne d&apos;une collecte
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Renseignez les informations de la collecte, ajoutez les photos
          et vérifiez son aperçu avant publication.
        </p>
      </header>

      <CampaignForm />
    </div>
  );
}
