"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlatformIcon } from "@/components/shared";
import { type Platform } from "@/lib/late-api";
import { CheckCircle2, Loader2 } from "lucide-react";

interface Entity {
  id: string;
  name: string;
  picture?: string;
  address?: string;
}

interface EntitySelectorProps {
  platform: string;
  entities: Entity[];
  onSelect: (entityId: string) => void;
}

export function EntitySelector({ platform, entities, onSelect }: EntitySelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getEntityLabel = () => {
    switch (platform) {
      case "facebook":
        return "Facebook Page";
      case "linkedin":
        return "LinkedIn Organization";
      case "pinterest":
        return "Pinterest Board";
      case "googlebusiness":
        return "Business Location";
      default:
        return "Account";
    }
  };

  const handleSubmit = () => {
    if (!selectedId) return;
    setIsSubmitting(true);
    onSelect(selectedId);
  };

  if (entities.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No {getEntityLabel().toLowerCase()}s found.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Make sure you have the required permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <PlatformIcon platform={platform as Platform} showColor size="md" />
        <p className="text-sm text-muted-foreground">
          Select a {getEntityLabel().toLowerCase()} to connect
        </p>
      </div>

      <ScrollArea className="h-64">
        <div className="space-y-2 pr-4">
          {entities.map((entity) => (
            <button
              key={entity.id}
              onClick={() => setSelectedId(entity.id)}
              disabled={isSubmitting}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                selectedId === entity.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-accent"
              } ${isSubmitting ? "opacity-50" : ""}`}
            >
              {entity.picture ? (
                <img
                  src={entity.picture}
                  alt={entity.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <PlatformIcon platform={platform as Platform} size="md" />
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-medium">{entity.name}</p>
                {entity.address && (
                  <p className="truncate text-sm text-muted-foreground">
                    {entity.address}
                  </p>
                )}
              </div>
              {selectedId === entity.id && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              )}
            </button>
          ))}
        </div>
      </ScrollArea>

      <Button
        onClick={handleSubmit}
        disabled={!selectedId || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          `Connect ${getEntityLabel()}`
        )}
      </Button>
    </div>
  );
}
