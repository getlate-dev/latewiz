"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyState({ message, action, href }: { message: string; action: string; href: string }) {
  return (
    <div className="rounded-md p-4 text-center">
      <p className="text-xs text-muted-foreground">{message}</p>
      <Button variant="link" size="sm" className="mt-1 text-xs" asChild>
        <Link href={href}>{action}</Link>
      </Button>
    </div>
  );
}
