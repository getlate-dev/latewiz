"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlatformIcon } from "@/components/shared/platform-icon";
import { PLATFORM_NAMES, PLATFORM_COLORS, type Platform } from "@/lib/late-api";
import { Trash2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import type { Account, AccountHealth } from "@/hooks";

interface AccountCardProps {
  account: Account;
  health?: AccountHealth;
  onDelete?: (accountId: string) => void;
  onReconnect?: (platform: Platform) => void;
  showActions?: boolean;
}

export function AccountCard({
  account,
  health,
  onDelete,
  onReconnect,
  showActions = true,
}: AccountCardProps) {
  const isHealthy = health?.isHealthy !== false;
  const platform = account.platform as Platform;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <AccountAvatar account={account} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {account.displayName || account.username}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {PLATFORM_NAMES[platform]}
              </span>
              <AccountHealthBadge isHealthy={isHealthy} compact />
            </div>
          </div>
          {showActions && (
            <div className="flex items-center gap-1">
              {!isHealthy && onReconnect && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => onReconnect(platform)}
                  aria-label="Reconnect account"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(account._id)}
                  aria-label={`Disconnect ${account.displayName || account.username} account`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface AccountAvatarProps {
  account: Account;
  size?: "xs" | "sm" | "md" | "lg";
}

export function AccountAvatar({ account, size = "md" }: AccountAvatarProps) {
  const platform = account.platform as Platform;
  const sizeClasses = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  const badgeSizeClasses = {
    xs: "h-3 w-3 -bottom-0 -right-0",
    sm: "h-4 w-4 -bottom-0.5 -right-0.5",
    md: "h-5 w-5 -bottom-1 -right-1",
    lg: "h-6 w-6 -bottom-1 -right-1",
  };

  // Map badge container sizes to appropriate icon sizes for proper padding
  const badgeIconSizes: Record<"xs" | "sm" | "md" | "lg", "xs" | "sm"> = {
    xs: "xs",   // 12px container -> 10px icon
    sm: "xs",   // 16px container -> 10px icon
    md: "xs",   // 20px container -> 10px icon
    lg: "sm",   // 24px container -> 16px icon
  };

  return (
    <div className="relative">
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={account.profilePicture} />
        <AvatarFallback
          style={{ backgroundColor: PLATFORM_COLORS[platform] }}
        >
          <PlatformIcon
            platform={platform}
            className="text-white"
            size={size === "lg" ? "md" : size === "xs" ? "xs" : "sm"}
          />
        </AvatarFallback>
      </Avatar>
      <div
        className={`absolute flex items-center justify-center rounded-full border-2 border-card ${badgeSizeClasses[size]}`}
        style={{ backgroundColor: PLATFORM_COLORS[platform] }}
      >
        <PlatformIcon
          platform={platform}
          className="text-white"
          size={badgeIconSizes[size]}
        />
      </div>
    </div>
  );
}

interface AccountHealthBadgeProps {
  isHealthy: boolean;
  compact?: boolean;
}

export function AccountHealthBadge({ isHealthy, compact = false }: AccountHealthBadgeProps) {
  if (compact) {
    return isHealthy ? (
      <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
    ) : (
      <AlertCircle className="h-3 w-3 text-destructive" />
    );
  }

  return (
    <Badge variant={isHealthy ? "default" : "destructive"} className="gap-1">
      {isHealthy ? (
        <>
          <CheckCircle2 className="h-3 w-3" />
          Healthy
        </>
      ) : (
        <>
          <AlertCircle className="h-3 w-3" />
          Needs attention
        </>
      )}
    </Badge>
  );
}

interface AccountListItemProps {
  account: Account;
  selected?: boolean;
  onClick?: () => void;
}

export function AccountListItem({
  account,
  selected,
  onClick,
}: AccountListItemProps) {
  const platform = account.platform as Platform;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:bg-accent"
      }`}
    >
      <AccountAvatar account={account} size="sm" />
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium">
          {account.displayName || account.username}
        </p>
        <p className="text-xs text-muted-foreground">
          {PLATFORM_NAMES[platform]}
        </p>
      </div>
      {selected && (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
      )}
    </button>
  );
}
