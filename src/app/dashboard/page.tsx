"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAccounts, usePosts, useProfiles, useQueuePreview } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AccountAvatar } from "@/components/accounts";
import { PlatformIcons, PostStatusBadge } from "@/components/posts";
import { PLATFORM_NAMES, type Platform } from "@/lib/late-api";
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import { cn } from "@/lib/utils";
import {
  PenSquare,
  Calendar,
  Users,
  Clock,
  Plus,
  CheckCircle2,
  Loader2,
  ListOrdered,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";

export default function DashboardPage() {
  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const { data: postsData, isLoading: postsLoading } = usePosts({ limit: 10 });
  const { data: queueData } = useQueuePreview(5);

  const accounts = accountsData?.accounts || [];
  const posts = postsData?.posts || [];
  const upcomingSlots = queueData?.slots || [];

  const { scheduledPosts, publishedPosts, failedPosts } = useMemo(() => ({
    scheduledPosts: posts.filter((p: any) => p.status === "scheduled"),
    publishedPosts: posts.filter((p: any) => p.status === "published"),
    failedPosts: posts.filter((p: any) => p.status === "failed"),
  }), [posts]);

  return (
    <div className="space-y-4">
      {/* Header with CTA */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <Button size="sm" asChild>
          <Link href="/dashboard/compose">
            <Plus className="mr-1.5 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      {/* Stats Row - Compact, mobile-first */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard
          label="Accounts"
          value={accounts.length}
          icon={Users}
          href="/dashboard/accounts"
          isLoading={accountsLoading}
        />
        <StatCard
          label="Scheduled"
          value={scheduledPosts.length}
          icon={Clock}
          href="/dashboard/calendar"
          isLoading={postsLoading}
          color="blue"
        />
        <StatCard
          label="Published"
          value={publishedPosts.length}
          icon={CheckCircle2}
          href="/dashboard/calendar"
          isLoading={postsLoading}
          color="green"
        />
        <StatCard
          label="Failed"
          value={failedPosts.length}
          icon={AlertCircle}
          href="/dashboard/calendar"
          isLoading={postsLoading}
          color={failedPosts.length > 0 ? "red" : undefined}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Posts - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-sm font-medium">Recent Posts</CardTitle>
            <Link href="/dashboard/calendar" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {postsLoading ? (
              <LoadingSkeleton rows={4} />
            ) : posts.length === 0 ? (
              <EmptyState message="No posts yet" href="/dashboard/compose" />
            ) : (
              <div className="divide-y divide-border">
                {posts.slice(0, 6).map((post: any) => (
                  <div key={post._id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                    {post.mediaItems?.[0] && (
                      <img
                        src={post.mediaItems[0].url}
                        alt=""
                        className="h-10 w-10 rounded object-cover flex-shrink-0 bg-muted"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-1">{post.content || "(No content)"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <PlatformIcons platforms={post.platforms || []} size="xs" />
                        {post.scheduledFor && (
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(post.scheduledFor), "MMM d, h:mm a")}
                          </span>
                        )}
                      </div>
                    </div>
                    <PostStatusBadge status={post.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column - Accounts & Queue */}
        <div className="space-y-4">
          {/* Connected Accounts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <CardTitle className="text-sm font-medium">Accounts</CardTitle>
              <Link href="/dashboard/accounts" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Manage <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              {accountsLoading ? (
                <LoadingSkeleton rows={3} />
              ) : accounts.length === 0 ? (
                <EmptyState message="No accounts" href="/dashboard/accounts" />
              ) : (
                <div className="space-y-2">
                  {accounts.slice(0, 5).map((account: any) => (
                    <div key={account._id} className="flex items-center gap-2">
                      <AccountAvatar account={account} size="xs" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {account.displayName || account.username}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {PLATFORM_NAMES[account.platform as Platform]}
                      </Badge>
                    </div>
                  ))}
                  {accounts.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{accounts.length - 5} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Queue Slots */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
              <CardTitle className="text-sm font-medium">Queue</CardTitle>
              <Link href="/dashboard/queue" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                Settings <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              {upcomingSlots.length === 0 ? (
                <EmptyState message="No queue slots" href="/dashboard/queue" />
              ) : (
                <div className="space-y-1.5">
                  {upcomingSlots.slice(0, 4).map((slot: string, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded bg-muted/50 px-2.5 py-1.5">
                      <span className="text-xs">{format(parseISO(slot), "EEE, MMM d")}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {format(parseISO(slot), "h:mm a")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions - Compact row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <QuickAction icon={PenSquare} label="Create Post" href="/dashboard/compose" />
        <QuickAction icon={Calendar} label="Calendar" href="/dashboard/calendar" />
        <QuickAction icon={ListOrdered} label="Queue" href="/dashboard/queue" />
        <QuickAction icon={Users} label="Add Account" href="/dashboard/accounts" />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  isLoading?: boolean;
  color?: "blue" | "green" | "red";
}

function StatCard({ label, value, icon: Icon, href, isLoading, color }: StatCardProps) {
  return (
    <Link href={href}>
      <div className={cn(
        "rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50",
        color === "blue" && value > 0 && "border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20",
        color === "green" && value > 0 && "border-green-500/30 bg-green-50/50 dark:bg-green-950/20",
        color === "red" && value > 0 && "border-red-500/30 bg-red-50/50 dark:bg-red-950/20",
      )}>
        <div className="flex items-center justify-between">
          <Icon className={cn(
            "h-4 w-4 text-muted-foreground",
            color === "blue" && value > 0 && "text-blue-600 dark:text-blue-400",
            color === "green" && value > 0 && "text-green-600 dark:text-green-400",
            color === "red" && value > 0 && "text-red-600 dark:text-red-400",
          )} />
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <span className={cn(
              "text-xl font-semibold",
              color === "blue" && value > 0 && "text-blue-600 dark:text-blue-400",
              color === "green" && value > 0 && "text-green-600 dark:text-green-400",
              color === "red" && value > 0 && "text-red-600 dark:text-red-400",
            )}>{value}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </div>
    </Link>
  );
}

interface QuickActionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
}

function QuickAction({ icon: Icon, label, href }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-sm transition-colors hover:bg-accent/50"
    >
      <Icon className="h-4 w-4 text-primary" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

function LoadingSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-muted animate-pulse" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
            <div className="h-2 w-1/2 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message, href }: { message: string; href: string }) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <p className="text-xs text-muted-foreground">{message}</p>
      <Button variant="link" size="sm" className="h-auto p-0 mt-1 text-xs" asChild>
        <Link href={href}>Get started</Link>
      </Button>
    </div>
  );
}
