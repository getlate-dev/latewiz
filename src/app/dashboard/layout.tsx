"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useAuthStore, useAppStore } from "@/stores";
import { useProfiles } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/avatar";
import { Logo, ErrorBoundary } from "@/components/shared";
import {
  LayoutDashboard,
  PenSquare,
  Calendar,
  Users,
  ListOrdered,
  Settings,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  Check,
  ExternalLink,
} from "lucide-react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Compose",
    href: "/dashboard/compose",
    icon: PenSquare,
  },
  {
    label: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    label: "Accounts",
    href: "/dashboard/accounts",
    icon: Users,
  },
  {
    label: "Queue",
    href: "/dashboard/queue",
    icon: ListOrdered,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { apiKey, usageStats, logout, hasHydrated } = useAuthStore();
  const { defaultProfileId, setDefaultProfileId } = useAppStore();
  const { theme, setTheme } = useTheme();
  const { data: profilesData } = useProfiles();

  const profiles = profilesData?.profiles || [];
  const currentProfile = profiles.find((p: any) => p._id === defaultProfileId) || profiles[0];

  // Redirect to home if not authenticated (only after hydration)
  useEffect(() => {
    if (hasHydrated && !apiKey) {
      router.push("/");
    }
  }, [apiKey, hasHydrated, router]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Don't render until hydrated to avoid flash
  if (!hasHydrated || !apiKey) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Desktop only */}
      <aside className="hidden lg:flex w-56 flex-col border-r border-border bg-card">
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-border px-4">
          <Logo size="sm" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <Separator className="my-3" />

          {/* Settings */}
          <Link
            href="/dashboard/settings"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/dashboard/settings"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            <span>Settings</span>
          </Link>
        </nav>

        {/* Plan info */}
        {usageStats && (
          <div className="border-t border-border p-3">
            <div className="rounded-md bg-muted p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{usageStats.planName}</span>
                <a
                  href="https://getlate.dev/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Open Late dashboard"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Uploads</span>
                  <span>
                    {usageStats.limits.uploads < 0 ? (
                      <>{usageStats.usage.uploads.toLocaleString()} / ∞</>
                    ) : (
                      <>{usageStats.usage.uploads.toLocaleString()} / {usageStats.limits.uploads.toLocaleString()}</>
                    )}
                  </span>
                </div>
                {usageStats.limits.uploads >= 0 && (
                  <div className="h-1 overflow-hidden rounded-full bg-background">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(
                          (usageStats.usage.uploads / usageStats.limits.uploads) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-3">
            {/* Logo on mobile (since sidebar is hidden) */}
            <div className="lg:hidden">
              <Logo size="sm" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Profile Selector */}
            {profiles.length > 1 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: currentProfile?.color || '#888' }}
                    />
                    <span className="max-w-24 truncate hidden sm:inline">
                      {currentProfile?.name || 'Select Profile'}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Switch Profile</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {profiles.map((profile: any) => (
                    <DropdownMenuItem
                      key={profile._id}
                      onClick={() => setDefaultProfileId(profile._id)}
                      className="gap-2"
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: profile.color || '#888' }}
                      />
                      <span className="flex-1 truncate">{profile.name}</span>
                      {profile._id === defaultProfileId && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                  <img
                    src={getAvatarUrl(apiKey || "user", "bottts")}
                    alt="User avatar"
                    className="h-7 w-7 rounded-full"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="text-xs">
                  {usageStats?.planName || 'Account'}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="text-sm">
                  <a
                    href="https://getlate.dev/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Late Dashboard
                    <ExternalLink className="ml-auto h-3 w-3" />
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="text-sm">
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-3 w-3" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-sm text-destructive">
                  <LogOut className="mr-2 h-3 w-3" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-safe lg:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const isCompose = item.href === "/dashboard/compose";

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-colors",
                  isCompose
                    ? isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary/10 text-primary"
                    : isActive
                      ? "text-primary"
                      : "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isCompose && "h-6 w-6")} />
                <span className={cn("text-[10px] font-medium", isCompose && "text-xs")}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
