
"use client";

type Props = {
  editing?: boolean;
  saving: boolean;
  disabled: boolean;
  onDraft: () => void;
  onPreview: () => void;
  onPublish: () => void;
};

export default function CampaignFormActions({
  editing = false,
  saving,
  disabled,
  onDraft,
  onPreview,
  onPublish,
}: Props) {
  return (
    <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:flex-wrap">
      {!editing && <button
        type="button"
        onClick={onDraft}
        disabled={saving || disabled}
        className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Enregistrement..." : "Enregistrer en brouillon"}
      </button>}

      <button
        type="button"
        onClick={onPreview}
        disabled={saving}
        className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
      >
        Prévisualiser
      </button>

      <button
        type="button"
        onClick={onPublish}
        disabled={saving || disabled}
        className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? "Enregistrement..." : editing ? "Enregistrer les modifications" : "Publier la collecte"}
      </button>
    </div>
  );
}
