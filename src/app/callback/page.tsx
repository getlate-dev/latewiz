"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Late from "@getlatedev/node";
import { useAuthStore } from "@/stores";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { EntitySelector } from "./_components/entity-selector";

type CallbackStep = "processing" | "select_entity" | "success" | "error";

interface Entity {
  id: string;
  name: string;
  picture?: string;
}

interface EntityData {
  platform: string;
  tempToken?: string;
  userProfile?: string;
  connectToken?: string;
  pendingDataToken?: string;
  entities?: Entity[];
}

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { apiKey } = useAuthStore();

  const [step, setStep] = useState<CallbackStep>("processing");
  const [error, setError] = useState<string | null>(null);
  const [entityData, setEntityData] = useState<EntityData | null>(null);

  const handleEntitySelection = useCallback(async (platform: string, stepType: string) => {
    if (!apiKey) return;
    const late = new Late({ apiKey });
    const tempToken = searchParams.get("tempToken");
    const userProfile = searchParams.get("userProfile");
    const connectToken = searchParams.get("connect_token");
    const pendingDataToken = searchParams.get("pendingDataToken");

    try {
      let entities: Entity[] = [];

      switch (platform) {
        case "facebook":
          if (stepType === "select_page") {
            const { data } = await late.connect.facebook.listFacebookPages({
              headers: { "X-Connect-Token": connectToken || "" },
            });
            entities = (data?.pages || []) as Entity[];
          }
          break;

        case "linkedin":
          if (stepType === "select_organization" && pendingDataToken) {
            const { data } = await late.connect.getPendingOAuthData({
              query: { token: pendingDataToken },
            });
            entities = (data?.organizations || []) as Entity[];
          }
          break;

        case "pinterest":
          if (stepType === "select_board") {
            const { data } = await late.connect.pinterest.listPinterestBoardsForSelection({
              query: { tempToken: tempToken || "" },
              headers: { "X-Connect-Token": connectToken || "" },
            });
            entities = (data?.boards || []) as Entity[];
          }
          break;

        case "googlebusiness":
          if (stepType === "select_location") {
            const { data } = await late.connect.googleBusiness.listGoogleBusinessLocations({
              query: { tempToken: tempToken || "" },
              headers: { "X-Connect-Token": connectToken || "" },
            });
            entities = (data?.locations || []) as Entity[];
          }
          break;
      }

      setEntityData({
        platform,
        tempToken: tempToken || undefined,
        userProfile: userProfile || undefined,
        connectToken: connectToken || undefined,
        pendingDataToken: pendingDataToken || undefined,
        entities,
      });
      setStep("select_entity");
    } catch (err) {
      console.error("Entity fetch error:", err);
      setError("Failed to load options. Please try again.");
      setStep("error");
    }
  }, [apiKey, searchParams]);

  const handleCallback = useCallback(async () => {
    try {
      const platform = searchParams.get("platform");
      const connected = searchParams.get("connected");
      const stepParam = searchParams.get("step");
      const errorParam = searchParams.get("error");

      // Handle error
      if (errorParam) {
        setError(errorParam);
        setStep("error");
        return;
      }

      // Simple platforms - direct success
      if (connected) {
        setStep("success");
        toast.success(`${connected} connected successfully!`);
        setTimeout(() => router.push("/dashboard/accounts"), 1500);
        return;
      }

      // Platforms requiring entity selection
      if (stepParam && platform) {
        await handleEntitySelection(platform, stepParam);
        return;
      }

      // Unknown callback
      setError("Invalid callback parameters");
      setStep("error");
    } catch (err) {
      console.error("Callback error:", err);
      setError("Failed to process connection. Please try again.");
      setStep("error");
    }
  }, [searchParams, router, handleEntitySelection]);

  useEffect(() => {
    if (!apiKey) {
      router.push("/");
      return;
    }
    handleCallback();
  }, [apiKey, router, handleCallback]);

  const handleEntitySelect = async (entityId: string) => {
    if (!entityData || !apiKey) return;

    setStep("processing");
    const late = new Late({ apiKey });

    try {
      const profileId = searchParams.get("profileId") || "";

      switch (entityData.platform) {
        case "facebook":
          await late.connect.facebook.selectFacebookPage({
            body: {
              tempToken: entityData.tempToken!,
              userProfile: entityData.userProfile!,
              pageId: entityId,
              profileId,
            },
          });
          break;

        case "linkedin":
          await late.connect.linkedin.selectLinkedInOrganization({
            body: {
              tempToken: entityData.tempToken!,
              userProfile: entityData.userProfile!,
              organizationId: entityId,
              profileId,
            },
          });
          break;

        case "pinterest":
          await late.connect.pinterest.selectPinterestBoard({
            body: {
              tempToken: entityData.tempToken!,
              userProfile: entityData.userProfile!,
              boardId: entityId,
              profileId,
            },
          });
          break;

        case "googlebusiness":
          await late.connect.googleBusiness.selectGoogleBusinessLocation({
            body: {
              tempToken: entityData.tempToken!,
              userProfile: entityData.userProfile!,
              locationId: entityId,
              profileId,
            },
          });
          break;
      }

      setStep("success");
      toast.success("Account connected successfully!");
      setTimeout(() => router.push("/dashboard/accounts"), 1500);
    } catch (err) {
      console.error("Entity select error:", err);
      setError("Failed to complete connection. Please try again.");
      setStep("error");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>
            {step === "processing" && "Connecting Account..."}
            {step === "select_entity" && "Select Account"}
            {step === "success" && "Connected!"}
            {step === "error" && "Connection Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === "processing" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Please wait...</p>
            </div>
          )}

          {step === "select_entity" && entityData && (
            <EntitySelector
              platform={entityData.platform}
              entities={entityData.entities || []}
              onSelect={handleEntitySelect}
            />
          )}

          {step === "success" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-muted-foreground">Redirecting to accounts...</p>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-center text-muted-foreground">{error}</p>
              <Button onClick={() => router.push("/dashboard/accounts")}>
                Back to Accounts
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
