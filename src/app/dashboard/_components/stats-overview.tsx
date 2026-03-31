"use client";

import { Clock, Users, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface StatsOverviewProps {
  accountsCount: number;
  scheduledCount: number;
  publishedCount: number;
  failedCount: number;
  isLoading: boolean;
}

export function StatsOverview({
  accountsCount,
  scheduledCount,
  publishedCount,
  failedCount,
  isLoading,
}: StatsOverviewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4 rounded-lg bg-muted">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="text-center rounded-lg p-3 hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-center gap-1">
          <span className="text-xl font-semibold">{accountsCount}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Accounts</p>
      </div>
      <div className="text-center rounded-lg p-3 hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-center gap-1">
          <span className="text-xl font-semibold text-blue-600 dark:text-blue-400">
            {scheduledCount}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Scheduled</p>
      </div>
      <div className="text-center rounded-lg p-3 hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-center gap-1">
          <span className="text-xl font-semibold text-green-600 dark:text-green-400">
            {publishedCount}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Published</p>
      </div>
      <div className="text-center rounded-lg p-3 hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-center gap-1">
          <span className="text-xl font-semibold text-red-600 dark:text-red-400">
            {failedCount}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">Failed</p>
      </div>
    </div>
  );
}
