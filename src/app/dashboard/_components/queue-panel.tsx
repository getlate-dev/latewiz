"use client";

import { Badge } from "@/components/ui/badge";
import { ListOrdered } from "lucide-react";
import { EmptyState } from "./empty-state";
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";

interface QueuePanelProps {
  slots: string[];
}

export function QueuePanel({ slots }: QueuePanelProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <ListOrdered className="h-3.5 w-3.5 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Upcoming Queue</h2>
      </div>
      <div className="space-y-1">
        {slots.length === 0 ? (
          <EmptyState message="No queue slots configured" action="Set up your queue" href="/dashboard/queue" />
        ) : (
          slots.slice(0, 5).map((slot: string, i: number) => (
            <div key={i} className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50 transition-colors">
              <span className="text-xs">{format(parseISO(slot), "EEEE, MMM d")}</span>
              <Badge variant="outline" className="text-[10px]">{format(parseISO(slot), "h:mm a")}</Badge>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
