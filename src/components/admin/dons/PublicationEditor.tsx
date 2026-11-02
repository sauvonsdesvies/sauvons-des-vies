
"use client";

import { useRef } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
};

export default function PublicationEditor({ value, onChange, id = "publication-content" }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function wrapSelection(before: string, after = before) {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const updated =
      value.slice(0, start) +
      before +
      selected +
      after +
      value.slice(end);

    onChange(updated);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      );
    });
  }

  const tools = [
    { label: "Gras", text: "B", before: "**", after: "**" },
    { label: "Italique", text: "I", before: "*", after: "*" },
    { label: "Souligné", text: "U", before: "<u>", after: "</u>" },
    { label: "Liste", text: "☷", before: "\n- ", after: "" },
    { label: "Lien", text: "🔗", before: "[", after: "](https://)" },
  ];

  return (
    <div>
      <label
        htmlFor={id}
        className="text-sm font-semibold text-[#092d5b]"
      >
        Contenu de l&apos;article <span className="text-red-600">*</span>
      </label>

      <div className="mt-1.5 overflow-hidden rounded-lg border border-slate-200 focus-within:border-blue-600">
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-2">
          <span className="mr-2 rounded px-2 py-1 text-xs text-slate-600">
            Texte
          </span>

          {tools.map((tool) => (
            <button
              key={tool.label}
              type="button"
              title={tool.label}
              aria-label={tool.label}
              onClick={() => wrapSelection(tool.before, tool.after)}
              className="min-w-8 rounded px-2 py-1 text-sm font-bold text-slate-700 hover:bg-blue-100"
            >
              {tool.text}
            </button>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={11}
          maxLength={30000}
          placeholder="Décrivez les actions réalisées, l'utilisation des dons et les résultats obtenus..."
          className="block min-h-56 w-full resize-y bg-white p-3 text-sm leading-7 text-slate-800 outline-none"
        />
      </div>

      <p className="mt-1 text-sm text-slate-500">
        Mise en forme simple du texte. Les informations publiées doivent
        correspondre aux actions réellement réalisées.
      </p>
    </div>
  );
}
