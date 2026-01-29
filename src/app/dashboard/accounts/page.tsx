"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  useAccounts,
  useAccountsHealth,
  useConnectAccount,
  useDeleteAccount,
} from "@/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AccountCard } from "@/components/accounts";
import { ConnectPlatformGrid } from "./_components/connect-platform-grid";
import { type Platform } from "@/lib/late-api";
import { Plus, Loader2 } from "lucide-react";

export default function AccountsPage() {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  // Hooks for data fetching
  const { data: accountsData, isLoading } = useAccounts();
  const { data: healthData } = useAccountsHealth();

  // Mutations
  const connectMutation = useConnectAccount();
  const deleteMutation = useDeleteAccount();

  const accounts = (accountsData?.accounts || []) as any[];
  const healthMap = useMemo(
    () => new Map<string, any>(
      healthData?.accounts?.map((a: any) => [a.accountId, a] as [string, any]) || []
    ),
    [healthData]
  );

  const handleConnect = async (platform: Platform) => {
    try {
      const data = await connectMutation.mutateAsync({ platform });
      if (data?.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch {
      toast.error("Failed to start connection. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!accountToDelete) return;
    try {
      await deleteMutation.mutateAsync(accountToDelete);
      toast.success("Account disconnected successfully");
      setAccountToDelete(null);
    } catch {
      toast.error("Failed to disconnect account");
    }
  };

  const connectedPlatforms = new Set<string>(accounts.map((a: any) => a.platform as string));

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Accounts</h1>
        <Button size="sm" onClick={() => setShowConnectDialog(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Connect
        </Button>
      </div>

      {/* Connected accounts grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <AccountsLoadingSkeleton />
        ) : accounts.length === 0 ? (
          <EmptyAccountsState onConnect={() => setShowConnectDialog(true)} />
        ) : (
          accounts.map((account: any) => (
            <AccountCard
              key={account._id}
              account={account}
              health={healthMap.get(account._id)}
              onDelete={setAccountToDelete}
              onReconnect={handleConnect}
            />
          ))
        )}
      </div>

      {/* Connect Account Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Connect a Social Account</DialogTitle>
            <DialogDescription>
              Choose a platform to connect. You&apos;ll be redirected to authorize
              access.
            </DialogDescription>
          </DialogHeader>
          <ConnectPlatformGrid
            onConnect={handleConnect}
            connectedPlatforms={connectedPlatforms}
            isConnecting={connectMutation.isPending}
            connectingPlatform={connectMutation.variables?.platform}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!accountToDelete}
        onOpenChange={() => setAccountToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect this account? You&apos;ll need to
              reconnect it to schedule posts to this account again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AccountsLoadingSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-24 rounded bg-muted" />
                <div className="h-2.5 w-16 rounded bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function EmptyAccountsState({ onConnect }: { onConnect: () => void }) {
  return (
    <Card className="col-span-full">
      <CardContent className="flex flex-col items-center justify-center py-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Plus className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-3 font-medium text-sm">No accounts connected</h3>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Connect your first account to start scheduling.
        </p>
        <Button size="sm" className="mt-3" onClick={onConnect}>
          Connect Account
        </Button>
      </CardContent>
    </Card>
  );
}
