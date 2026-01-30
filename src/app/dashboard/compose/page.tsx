"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreatePost, useAccounts, useCurrentProfileId, type UploadedMedia } from "@/hooks";
import { useAppStore } from "@/stores";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlatformSelector } from "./_components/platform-selector";
import { MediaUploader } from "./_components/media-uploader";
import { SchedulePicker, type ScheduleType } from "./_components/schedule-picker";
import { Loader2, Send, PenSquare, Users, Calendar, Image as ImageIcon } from "lucide-react";
import type { Platform } from "@/lib/late-api";

export default function ComposePage() {
  const router = useRouter();
  const { timezone } = useAppStore();
  const profileId = useCurrentProfileId();
  const { data: accountsData } = useAccounts();
  const createPostMutation = useCreatePost();

  // Form state
  const [content, setContent] = useState("");
  const [media, setMedia] = useState<UploadedMedia[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [scheduleType, setScheduleType] = useState<ScheduleType>("now");
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState("09:00");

  const accounts = (accountsData?.accounts || []) as any[];
  const hasVideo = media.some((m) => m.type === "video");
  const hasImages = media.some((m) => m.type === "image");

  // Get selected accounts with platform info
  const selectedAccounts = accounts.filter((a) =>
    selectedAccountIds.includes(a._id)
  );

  // Character count (Twitter limit as reference)
  const charCount = content.length;
  const charLimit = 280;

  const canSubmit =
    selectedAccountIds.length > 0 &&
    (content.trim() || media.length > 0) &&
    !createPostMutation.isPending;

  const handleSubmit = async () => {
    if (!canSubmit || !profileId) return;

    try {
      // Build scheduled time if applicable
      let scheduledFor: string | undefined;
      if (scheduleType === "scheduled" && scheduledDate) {
        const [hours, minutes] = scheduledTime.split(":").map(Number);
        const scheduled = new Date(scheduledDate);
        scheduled.setHours(hours, minutes, 0, 0);
        scheduledFor = scheduled.toISOString();
      }

      // Build platforms array
      const platforms = selectedAccounts.map((account) => ({
        platform: account.platform as Platform,
        accountId: account._id,
      }));

      // Build media items
      const mediaItems = media.map((m) => ({
        type: m.type,
        url: m.url,
      }));

      await createPostMutation.mutateAsync({
        content,
        mediaItems: mediaItems.length > 0 ? mediaItems : undefined,
        platforms,
        publishNow: scheduleType === "now",
        scheduledFor,
        timezone,
        queuedFromProfile: scheduleType === "queue" ? profileId : undefined,
      });

      toast.success(
        scheduleType === "now"
          ? "Post published!"
          : scheduleType === "queue"
          ? "Post added to queue!"
          : "Post scheduled!"
      );

      router.push("/dashboard/calendar");
    } catch {
      toast.error("Failed to create post. Please try again.");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Create Post</h1>
        <p className="text-muted-foreground">
          Compose and schedule your content.
        </p>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PenSquare className="h-4 w-4" />
            Content
          </CardTitle>
          <CardDescription>
            Write your post content and add media.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="resize-none"
            />
            <div className="flex justify-end">
              <span
                className={`text-xs ${
                  charCount > charLimit
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {charCount} / {charLimit}
              </span>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Media</span>
            </div>
            <MediaUploader media={media} onMediaChange={setMedia} />
          </div>
        </CardContent>
      </Card>

      {/* Platforms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Select Accounts
            {selectedAccountIds.length > 0 && (
              <span className="text-muted-foreground font-normal">
                ({selectedAccountIds.length} selected)
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Choose which accounts to publish to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlatformSelector
            selectedAccountIds={selectedAccountIds}
            onSelectionChange={setSelectedAccountIds}
            hasVideo={hasVideo}
            hasImages={hasImages}
          />
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            When to Post
          </CardTitle>
          <CardDescription>
            Publish now, schedule for later, or add to queue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SchedulePicker
            scheduleType={scheduleType}
            scheduledDate={scheduledDate}
            scheduledTime={scheduledTime}
            onScheduleTypeChange={setScheduleType}
            onDateChange={setScheduledDate}
            onTimeChange={setScheduledTime}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full"
            size="lg"
          >
            {createPostMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {scheduleType === "now"
                  ? "Publish Now"
                  : scheduleType === "queue"
                  ? "Add to Queue"
                  : "Schedule Post"}
              </>
            )}
          </Button>

          {selectedAccountIds.length === 0 && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Select at least one account to post
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
