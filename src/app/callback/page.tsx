import { Suspense } from "react";
import { CallbackClient } from "./_components/callback-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Prevent static prerendering - this page requires searchParams
export const dynamic = "force-dynamic";

function CallbackLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Connecting Account...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Please wait...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<CallbackLoading />}>
      <CallbackClient />
    </Suspense>
  );
}
