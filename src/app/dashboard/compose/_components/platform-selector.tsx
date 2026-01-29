"use client";

import { useAccounts, type Account } from "@/hooks";
import { AccountListItem } from "@/components/accounts";
import { PlatformIcon } from "@/components/shared";
import { PLATFORMS, PLATFORM_NAMES, PLATFORM_CONSTRAINTS, type Platform } from "@/lib/late-api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface PlatformSelectorProps {
  selectedAccountIds: string[];
  onSelectionChange: (accountIds: string[]) => void;
  hasVideo: boolean;
  hasImages: boolean;
}

export function PlatformSelector({
  selectedAccountIds,
  onSelectionChange,
  hasVideo,
  hasImages,
}: PlatformSelectorProps) {
  const { data: accountsData, isLoading } = useAccounts();
  const accounts = (accountsData?.accounts || []) as Account[];

  // Group accounts by platform
  const accountsByPlatform = accounts.reduce((acc, account) => {
    const platform = account.platform as Platform;
    if (!acc[platform]) acc[platform] = [];
    acc[platform].push(account);
    return acc;
  }, {} as Record<Platform, Account[]>);

  const toggleAccount = (accountId: string) => {
    if (selectedAccountIds.includes(accountId)) {
      onSelectionChange(selectedAccountIds.filter((id) => id !== accountId));
    } else {
      onSelectionChange([...selectedAccountIds, accountId]);
    }
  };

  const getConstraintWarning = (platform: Platform): string | null => {
    const constraints = PLATFORM_CONSTRAINTS[platform];

    if (constraints.requiresVideo && !hasVideo) {
      return "Requires video";
    }
    if (constraints.requiresMedia && !hasVideo && !hasImages) {
      return "Requires media";
    }
    if (constraints.noVideo && hasVideo) {
      return "No video support";
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No accounts connected. Connect an account to start posting.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-80">
      <div className="space-y-4 pr-4">
        {PLATFORMS.map((platform) => {
          const platformAccounts = accountsByPlatform[platform];
          if (!platformAccounts?.length) return null;

          const warning = getConstraintWarning(platform);

          return (
            <div key={platform} className="space-y-2">
              <div className="flex items-center gap-2">
                <PlatformIcon platform={platform} showColor size="sm" />
                <span className="text-sm font-medium">
                  {PLATFORM_NAMES[platform]}
                </span>
                {warning && (
                  <Badge variant="outline" className="gap-1 text-xs text-warning">
                    <AlertCircle className="h-3 w-3" />
                    {warning}
                  </Badge>
                )}
              </div>
              <div className="space-y-1 pl-6">
                {platformAccounts.map((account) => (
                  <AccountListItem
                    key={account._id}
                    account={account}
                    selected={selectedAccountIds.includes(account._id)}
                    onClick={() => toggleAccount(account._id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
