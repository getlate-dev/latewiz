"use client";

import Link from "next/link";
import { useAccounts, usePosts, useProfiles } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AccountAvatar } from "@/components/accounts";
import { PlatformIcons, PostStatusBadge } from "@/components/posts";
import { PLATFORM_NAMES, type Platform } from "@/lib/late-api";
import { format, parseISO } from "date-fns";
import {
  PenSquare,
  Calendar,
  Users,
  Clock,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from "lucide-react";

export default function DashboardPage() {
  const { isLoading: profilesLoading } = useProfiles();
  const { data: accountsData, isLoading: accountsLoading } = useAccounts();
  const { data: postsData, isLoading: postsLoading } = usePosts({ limit: 5 });

  const accounts = accountsData?.accounts || [];
  const posts = postsData?.posts || [];
  const scheduledPosts = posts.filter((p: any) => p.status === "scheduled");
  const publishedPosts = posts.filter((p: any) => p.status === "published");

  const isLoading = profilesLoading || accountsLoading || postsLoading;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s an overview of your social media activity.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/compose">
            <PenSquare className="mr-2 h-4 w-4" />
            Create Post
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <StatsGrid
        accounts={accounts.length}
        scheduledPosts={scheduledPosts.length}
        publishedPosts={publishedPosts.length}
        isLoading={isLoading}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Connected Accounts */}
        <AccountsCard accounts={accounts} isLoading={accountsLoading} />

        {/* Recent Posts */}
        <PostsCard posts={posts} isLoading={postsLoading} />
      </div>

      {/* Quick Actions */}
      <QuickActionsCard />
    </div>
  );
}

interface StatsGridProps {
  accounts: number;
  scheduledPosts: number;
  publishedPosts: number;
  isLoading: boolean;
}

function StatsGrid({ accounts, scheduledPosts, publishedPosts, isLoading }: StatsGridProps) {
  const stats = [
    {
      label: "Connected Accounts",
      value: accounts,
      icon: Users,
      href: "/dashboard/accounts",
    },
    {
      label: "Scheduled Posts",
      value: scheduledPosts,
      icon: Clock,
      href: "/dashboard/calendar",
    },
    {
      label: "Published Posts",
      value: publishedPosts,
      icon: CheckCircle2,
      href: "/dashboard/calendar",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Link key={stat.label} href={stat.href}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    stat.value
                  )}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

interface AccountsCardProps {
  accounts: any[];
  isLoading: boolean;
}

function AccountsCard({ accounts, isLoading }: AccountsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Connected Accounts</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/accounts">
            View all
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState />
        ) : accounts.length === 0 ? (
          <EmptyState
            icon={Users}
            message="No accounts connected yet"
            action={{ label: "Connect Account", href: "/dashboard/accounts" }}
          />
        ) : (
          <div className="space-y-3">
            {accounts.slice(0, 5).map((account: any) => (
              <div key={account._id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AccountAvatar account={account} size="sm" />
                  <div>
                    <p className="text-sm font-medium">
                      {account.displayName || account.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {PLATFORM_NAMES[account.platform as Platform]}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PostsCardProps {
  posts: any[];
  isLoading: boolean;
}

function PostsCard({ posts, isLoading }: PostsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Recent Posts</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/calendar">
            View calendar
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <LoadingState />
        ) : posts.length === 0 ? (
          <EmptyState
            icon={Calendar}
            message="No posts created yet"
            action={{ label: "Create Post", href: "/dashboard/compose" }}
          />
        ) : (
          <div className="space-y-3">
            {posts.slice(0, 5).map((post: any) => (
              <div key={post._id} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 text-sm">
                    {post.content || "(No content)"}
                  </p>
                  <PostStatusBadge status={post.status} />
                </div>
                <div className="flex items-center justify-between">
                  <PlatformIcons platforms={post.platforms || []} />
                  {post.scheduledFor && (
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(post.scheduledFor), "MMM d, h:mm a")}
                    </p>
                  )}
                </div>
                <Separator />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionsCard() {
  const actions = [
    { icon: PenSquare, label: "Create Post", href: "/dashboard/compose" },
    { icon: Users, label: "Connect Account", href: "/dashboard/accounts" },
    { icon: Calendar, label: "View Calendar", href: "/dashboard/calendar" },
    { icon: Clock, label: "Manage Queue", href: "/dashboard/queue" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action) => (
            <Button
              key={action.href}
              variant="outline"
              className="h-auto flex-col gap-2 p-4"
              asChild
            >
              <Link href={action.href}>
                <action.icon className="h-6 w-6" />
                <span>{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  message: string;
  action: { label: string; href: string };
}

function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Icon className="h-12 w-12 text-muted-foreground/50" />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" className="mt-4" asChild>
        <Link href={action.href}>{action.label}</Link>
      </Button>
    </div>
  );
}
