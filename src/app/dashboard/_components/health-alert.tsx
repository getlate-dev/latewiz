"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

export function HealthAlert({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <Link
      href="/dashboard/accounts"
      className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200 dark:hover:bg-amber-950"
    >
      <AlertCircle className="h-5 w-5 shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">
          {count} {count === 1 ? "account needs" : "accounts need"} reconnection
        </p>
        <p className="text-xs opacity-80">
          Click to review and fix connection issues
        </p>
      </div>
    </Link>
  );
}
