"use client";

import { useState } from "react";
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
  const healthMap = new Map<string, any>(
    healthData?.accounts?.map((a: any) => [a.accountId, a] as [string, any]) || []
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
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Connected Accounts</h1>
          <p className="text-muted-foreground">
            Manage your social media accounts and connections.
          </p>
        </div>
        <Button onClick={() => setShowConnectDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Connect Account
        </Button>
      </div>

      {/* Connected accounts grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 rounded bg-muted" />
                <div className="h-3 w-16 rounded bg-muted" />
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
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Plus className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 font-semibold">No accounts connected</h3>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Connect your first social media account to start scheduling posts.
        </p>
        <Button className="mt-4" onClick={onConnect}>
          Connect Account
        </Button>
      </CardContent>
    </Card>
  );
}
