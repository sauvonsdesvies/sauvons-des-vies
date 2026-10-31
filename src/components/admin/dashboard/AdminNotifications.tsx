
import type { DashboardNotification } from "@/types/admin-dashboard";

export default function AdminNotifications({
  notifications,
}: {
  notifications: DashboardNotification[];
}) {
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="font-semibold text-slate-900">
          Notifications récentes
        </h2>
        {unreadCount > 0 && (
          <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
            {unreadCount} non lues
          </span>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-500">
          Aucune notification enregistrée.
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`px-5 py-4 ${
                notification.isRead
                  ? "bg-white"
                  : "bg-blue-50/40"
              }`}
            >
              <div className="flex items-start gap-3">
                {!notification.isRead && (
                  <span
                    className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600"
                    aria-label="Non lue"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="break-words text-sm font-semibold text-slate-900">
                    {notification.title}
                  </h3>
                  <p className="mt-1 break-words text-sm text-slate-600">
                    {notification.message}
                  </p>
                  <time
                    dateTime={notification.createdAt}
                    className="mt-2 block text-xs text-slate-400"
                  >
                    {new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Africa/Porto-Novo",
                    }).format(
                      new Date(notification.createdAt),
                    )}
                  </time>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
