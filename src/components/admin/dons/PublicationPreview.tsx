
import type { PublicationDraft } from "@/types/publication";

const categoryLabels: Record<string, string> = {
  ACTION_REALISEE: "Action réalisée",
  PAIEMENT_HOPITAL: "Paiement à l'hôpital",
  REMISE_AIDE: "Remise d'aide",
  SUIVI_BENEFICIAIRE: "Suivi d'un bénéficiaire",
};

type Props = {
  publication: PublicationDraft;
};

export default function PublicationPreview({ publication }: Props) {
  const cover = publication.photos[0];

  const formattedDate = publication.publicationDate
    ? new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${publication.publicationDate}T12:00:00Z`))
    : "Date non sélectionnée";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-100 bg-blue-50 px-4 py-3">
        <h2 className="text-sm font-bold text-[#092d5b]">
          Aperçu public de l&apos;article
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Prévisualisation avant publication
        </p>
      </header>

      <div className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
            {categoryLabels[publication.category] || publication.category}
          </span>
          <span className="text-xs text-slate-500">
            {formattedDate}
          </span>
        </div>

        <div className="aspect-video overflow-hidden rounded-lg bg-slate-100">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover.imageUrl}
              alt="Photo principale de la publication"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Aucune photo sélectionnée
            </div>
          )}
        </div>

        <h3 className="mt-4 break-words text-lg font-extrabold leading-6 text-[#092d5b]">
          {publication.title || "Titre de la publication"}
        </h3>

        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
          {publication.shortDescription ||
            "Le résumé court apparaîtra ici."}
        </p>

        {publication.content && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <h4 className="mb-2 text-sm font-bold text-[#092d5b]">
              Contenu de l&apos;article
            </h4>
            <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
              {publication.content}
            </p>
          </div>
        )}

        {publication.photos.length > 1 && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {publication.photos.slice(1).map((photo, index) => (
              <div
                key={photo.storagePath}
                className="aspect-square overflow-hidden rounded-lg bg-slate-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.imageUrl}
                  alt={`Photo complémentaire ${index + 2}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <p className="mt-5 border-t border-slate-100 pt-3 text-sm text-slate-500">
          Fondation Sauvons des Vies
        </p>
      </div>
    </article>
  );
}
