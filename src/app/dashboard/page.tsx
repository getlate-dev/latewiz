"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAccounts, useAccountsHealth, usePosts, useQueuePreview } from "@/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AccountAvatar } from "@/components/accounts";
import { PlatformIcons, PostStatusBadge } from "@/components/posts";
import { PLATFORM_NAMES, type Platform } from "@/lib/late-api";
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import {
  LayoutDashboard,
  Clock,
  Users,
  ListOrdered,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const { data: healthData } = useAccountsHealth();
  const { data: postsData, isLoading: postsLoading } = usePosts({ limit: 10 });
  const { data: queueData } = useQueuePreview(5);

  const accounts = accountsData?.accounts || [];
  const posts = useMemo(() => postsData?.posts || [], [postsData?.posts]);
  const accountsNeedingAttention = (healthData?.accounts || []).filter(
    (a: any) => a.status === "needs_reconnect"
  ).length;
  const upcomingSlots = queueData?.slots || [];

  const { scheduledPosts, publishedPosts, failedPosts } = useMemo(() => ({
    scheduledPosts: posts.filter((p: any) => p.status === "scheduled"),
    publishedPosts: posts.filter((p: any) => p.status === "published"),
    failedPosts: posts.filter((p: any) => p.status === "failed"),
  }), [posts]);

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your overview.
        </p>
      </div>

      {/* Account health warning */}
      {accountsNeedingAttention > 0 && (
        <Link
          href="/dashboard/accounts"
          className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-950"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {accountsNeedingAttention} {accountsNeedingAttention === 1 ? "account needs" : "accounts need"} reconnection
            </p>
            <p className="text-xs opacity-80">
              Click to review and fix connection issues
            </p>
          </div>
        </Link>
      )}

      {/* Overview Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </CardTitle>
          <CardDescription>
            Your account and posting statistics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-4">
            {accountsLoading || postsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-2xl font-semibold">{accounts.length}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Accounts</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                      {scheduledPosts.length}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-2xl font-semibold text-green-600 dark:text-green-400">
                      {publishedPosts.length}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Published</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-2xl font-semibold text-red-600 dark:text-red-400">
                      {failedPosts.length}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Recent Posts
            </CardTitle>
            <CardDescription>
              Your latest posts and their status.
            </CardDescription>
          </div>
          {posts.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/dashboard/calendar">View all</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {postsLoading ? (
            <LoadingSkeleton rows={5} />
          ) : posts.length === 0 ? (
            <EmptyState message="No posts yet" action="Create your first post" href="/dashboard/compose" />
          ) : (
            posts.slice(0, 5).map((post: any) => (
              <div
                key={post._id}
                className="flex items-center justify-between rounded-lg bg-muted p-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {post.mediaItems?.[0] && (
                    <img
                      src={post.mediaItems[0].url}
                      alt=""
                      className="h-10 w-10 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {post.content || "(No content)"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <PlatformIcons platforms={post.platforms || []} size="xs" />
                      {post.scheduledFor && (
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(post.scheduledFor), "MMM d, h:mm a")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <PostStatusBadge status={post.status} />
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Accounts
            </CardTitle>
            <CardDescription>
              Your connected social media accounts.
            </CardDescription>
          </div>
          {accounts.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs" asChild>
              <Link href="/dashboard/accounts">View all</Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {accountsLoading ? (
            <LoadingSkeleton rows={3} />
          ) : accounts.length === 0 ? (
            <EmptyState message="No accounts connected" action="Connect an account" href="/dashboard/accounts" />
          ) : (
            accounts.slice(0, 5).map((account: any) => (
              <div
                key={account._id}
                className="flex items-center justify-between rounded-lg bg-muted p-3"
              >
                <div className="flex items-center gap-3">
                  <AccountAvatar account={account} size="sm" />
                  <span className="text-sm font-medium">
                    {account.displayName || account.username}
                  </span>
                </div>
                <Badge variant="secondary">
                  {PLATFORM_NAMES[account.platform as Platform]}
                </Badge>
              </div>
            ))
          )}
          {accounts.length > 5 && (
            <p className="text-center text-xs text-muted-foreground">
              +{accounts.length - 5} more accounts
            </p>
          )}
        </CardContent>
      </Card>

      {/* Queue Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ListOrdered className="h-4 w-4" />
            Upcoming Queue
          </CardTitle>
          <CardDescription>
            Your next scheduled posting slots.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingSlots.length === 0 ? (
            <EmptyState message="No queue slots configured" action="Set up your queue" href="/dashboard/queue" />
          ) : (
            upcomingSlots.slice(0, 5).map((slot: string, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-muted p-3"
              >
                <span className="text-sm">{format(parseISO(slot), "EEEE, MMM d")}</span>
                <Badge variant="outline">{format(parseISO(slot), "h:mm a")}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

    </div>
  );
}

function LoadingSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg bg-muted p-3 animate-pulse">
          <div className="h-10 w-10 rounded bg-background" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded bg-background" />
            <div className="h-2 w-1/2 rounded bg-background" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message, action, href }: { message: string; action: string; href: string }) {
  return (
    <div className="rounded-lg bg-muted p-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="link" size="sm" className="mt-2" asChild>
        <Link href={href}>{action}</Link>
      </Button>
    </div>
  );
}
