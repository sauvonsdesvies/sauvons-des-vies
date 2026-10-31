
import RequestMobileCard from "./RequestMobileCard";
import type { RequestItem } from "@/types/request";

type Props = {
  items: RequestItem[];
  onRefresh: () => Promise<void>;
};

export default function RequestsMobileList({
  items,
  onRefresh,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Aucune demande enregistrée.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <RequestMobileCard
          key={item.id}
          item={item}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}
