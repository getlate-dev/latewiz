"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { AccountAvatar } from "@/components/accounts";
import { PLATFORM_NAMES, type Platform } from "@/lib/late-api";
import { LoadingSkeleton } from "./loading-skeleton";
import { EmptyState } from "./empty-state";

interface AccountsPanelProps {
  accounts: any[];
  isLoading: boolean;
}

export function AccountsPanel({ accounts, isLoading }: AccountsPanelProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Accounts</h2>
        </div>
        {accounts.length > 0 && (
          <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
            <Link href="/dashboard/accounts">View all</Link>
          </Button>
        )}
      </div>
      <div className="space-y-1">
        {isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : accounts.length === 0 ? (
          <EmptyState message="No accounts connected" action="Connect an account" href="/dashboard/accounts" />
        ) : (
          accounts.slice(0, 5).map((account: any) => (
            <div key={account._id} className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <AccountAvatar account={account} size="sm" />
                <span className="text-xs font-medium">{account.displayName || account.username}</span>
              </div>
              <Badge variant="secondary" className="text-[10px]">{PLATFORM_NAMES[account.platform as Platform]}</Badge>
            </div>
          ))
        )}
        {accounts.length > 5 && (
          <p className="text-center text-[10px] text-muted-foreground">+{accounts.length - 5} more accounts</p>
        )}
      </div>
    </section>
  );
}
