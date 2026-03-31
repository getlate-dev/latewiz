"use client";

import { useMemo } from "react";
import {
  useAccounts,
  useAccountsHealth,
  usePosts,
  useQueuePreview,
} from "@/hooks";
import { Separator } from "@/components/ui/separator";
import { HealthAlert } from "./_components/health-alert";
import { StatsOverview } from "./_components/stats-overview";
import { ContentTabs } from "./_components/content-tabs";

export default function DashboardPage() {
  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const { data: healthData } = useAccountsHealth();
  const { data: postsData, isLoading: postsLoading } = usePosts({ limit: 10 });
  const { data: queueData } = useQueuePreview(5);

  const accounts = accountsData?.accounts || [];
  const posts = useMemo(() => postsData?.posts || [], [postsData?.posts]);
  const upcomingSlots = queueData?.slots || [];
  const accountsNeedingAttention = (healthData?.accounts || []).filter(
    (a: any) => a.status === "needs_reconnect",
  ).length;
  const { scheduledPosts, publishedPosts, failedPosts } = useMemo(
    () => ({
      scheduledPosts: posts.filter((p: any) => p.status === "scheduled"),
      publishedPosts: posts.filter((p: any) => p.status === "published"),
      failedPosts: posts.filter((p: any) => p.status === "failed"),
    }),
    [posts],
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <HealthAlert count={accountsNeedingAttention} />

      <StatsOverview
        accountsCount={accounts.length}
        scheduledCount={scheduledPosts.length}
        publishedCount={publishedPosts.length}
        failedCount={failedPosts.length}
        isLoading={accountsLoading || postsLoading}
      />

      <Separator />

      <ContentTabs
        posts={posts}
        accounts={accounts}
        slots={upcomingSlots}
        postsLoading={postsLoading}
        accountsLoading={accountsLoading}
      />
    </div>
  );
}
