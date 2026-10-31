
import type { AdminDashboardData } from "@/types/admin-dashboard";
import LiveRefresh from "@/components/LiveRefresh";

import DashboardHeader from "./DashboardHeader";
import AdminStatsGrid from "./AdminStatsGrid";
import DonationsChart from "./DonationsChart";
import DonationsCategoryChart from "./DonationsCategoryChart";
import RecentCampaigns from "./RecentCampaigns";
import RecentDonations from "./RecentDonations";
import RecentRequests from "./RecentRequests";
import QuickActions from "./QuickActions";
import AdminNotifications from "./AdminNotifications";

interface AdminDashboardProps {
  data: AdminDashboardData;
}

export default function AdminDashboard({
  data,
}: AdminDashboardProps) {
  return (
    <div className="flex w-full min-w-0 max-w-none flex-col gap-4 [overflow-wrap:anywhere] [&>*]:min-w-0">
        <LiveRefresh />
        <DashboardHeader
          period={data.period}
          generatedAt={data.generatedAt}
        />

        <AdminStatsGrid
          stats={data.stats}
          trends={data.trends}
        />

        <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="min-w-0 xl:col-span-2">
            <DonationsChart
              data={data.donationEvolution}
            />
          </div>

          <div className="min-w-0">
            <DonationsCategoryChart
              data={data.donationsByCategory}
            />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2 [&>*]:min-w-0">
          <RecentCampaigns
            campaigns={data.recentCampaigns}
          />

          <RecentDonations
            donations={data.recentDonations}
          />
        </div>

        <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1fr)] [&>*]:min-w-0">
          <RecentRequests
            requests={data.recentRequests}
          />

          <QuickActions />

          <div className="lg:col-span-2 xl:col-span-1">
            <AdminNotifications
              notifications={data.notifications}
            />
          </div>
        </div>

        <footer className="border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
          Fondation Sauvons des Vies — Administration
        </footer>
    </div>
  );
}
