
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import RequestsHeader from "./RequestsHeader";
import RequestsStats from "./RequestsStats";
import RequestsFilters from "./RequestsFilters";
import RequestsTable from "./RequestsTable";
import RequestsMobileList from "./RequestsMobileList";
import RecentRequestsPanel from "./RecentRequestsPanel";
import RequestsPagination from "./RequestsPagination";
import type {
  RequestItem,
  RequestListResponse,
  RequestStatus,
} from "@/types/request";

export default function RequestsPage() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<RequestStatus | "">("");
  const [period, setPeriod] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<
    { id: string; name: string }[]
  >([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verifying: 0,
    published: 0,
    closed: 0,
  });

  const loadVersion = useRef(0);
  const load = useCallback((signal?: AbortSignal) => {
    const version = ++loadVersion.current;
    const params = new URLSearchParams({ page: String(page), period });
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    return fetch("/api/admin/requests?" + params.toString(), {
      cache: "no-store", credentials: "same-origin", signal,
    }).then(async (response) => {
      const result: RequestListResponse & { error?: string } = await response.json();
      if (!response.ok) throw new Error(result.error || "Chargement impossible.");
      if (signal?.aborted || version !== loadVersion.current) return;
      setItems(result.items);
      setError("");
      setTotal(result.total);
      setCategories(result.categories);
      setStats(result.stats);
    }).catch((cause: unknown) => {
      if (signal?.aborted || version !== loadVersion.current) return;
      setError(cause instanceof Error ? cause.message : "Erreur de chargement.");
    }).finally(() => {
      if (!signal?.aborted && version === loadVersion.current) setLoading(false);
    });
  }, [page, period, category, status]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const refresh = () => { if (document.visibilityState === "visible") void load(controller.signal); };
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [load]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    await load();
  }, [load]);

  const recent = useMemo(() => items.slice(0, 3), [items]);

  return (
    <div className="w-full min-w-0 [overflow-wrap:anywhere]">
      <RequestsHeader />

      <RequestsStats stats={stats} />

      <div className="mt-5 grid min-w-0 items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_270px]">
        <section className="min-w-0">
          <RequestsFilters
            categories={categories}
            category={category}
            status={status}
            period={period}
            onCategoryChange={(value) => {
              setLoading(true);
              setError("");
              setCategory(value);
              setPage(1);
            }}
            onStatusChange={(value) => {
              setLoading(true);
              setError("");
              setStatus(value);
              setPage(1);
            }}
            onPeriodChange={(value) => {
              setLoading(true);
              setError("");
              setPeriod(value);
              setPage(1);
            }}
            items={items}
          />

          {error && (
            <p role="alert" className="my-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
              {error}
            </p>
          )}

          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Chargement des demandes...
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                <RequestsTable items={items} onRefresh={reload} />
              </div>

              <div className="lg:hidden">
                <RequestsMobileList items={items} onRefresh={reload} />
              </div>

              <RequestsPagination
                page={page}
                total={total}
                pageSize={10}
                onPageChange={(value) => {
                  if (value === page) return;
                  setLoading(true);
                  setError("");
                  setPage(value);
                }}
              />
            </>
          )}
        </section>

        <aside className="hidden min-w-0 2xl:block">
          <RecentRequestsPanel items={recent} />
        </aside>
      </div>
    </div>
  );
}
