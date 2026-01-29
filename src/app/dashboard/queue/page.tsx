"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import { toast } from "sonner";
import {
  useQueueSlots,
  useQueuePreview,
  useUpdateQueueSlots,
  useScheduledPosts,
  DAYS_OF_WEEK,
  type QueueSlot,
} from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PostListItem } from "@/components/posts";
import {
  Plus,
  Clock,
  Trash2,
  Loader2,
  Calendar,
  ListOrdered,
} from "lucide-react";

export default function QueuePage() {
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [newSlot, setNewSlot] = useState<QueueSlot>({
    dayOfWeek: 1,
    hour: 9,
    minute: 0,
  });

  // Validation for the add slot form
  const isValidSlot = newSlot.hour >= 0 && newSlot.hour <= 23 &&
                       newSlot.minute >= 0 && newSlot.minute <= 59;
  const hourError = newSlot.hour < 0 || newSlot.hour > 23 ? "Hour must be 0-23" : null;
  const minuteError = newSlot.minute < 0 || newSlot.minute > 59 ? "Minute must be 0-59" : null;

  const { data: slotsData, isLoading: slotsLoading } = useQueueSlots();
  const { data: previewData, isLoading: previewLoading } = useQueuePreview(10);
  const { data: postsData, isLoading: postsLoading } = useScheduledPosts(10);
  const updateSlotsMutation = useUpdateQueueSlots();

  const slots = (slotsData?.schedule?.slots || []) as QueueSlot[];
  const upcomingSlots = (previewData?.slots || []) as string[];
  const queuedPosts = ((postsData?.posts || []) as any[]).filter(
    (p) => p.queuedFromProfile
  );

  // Group slots by day
  const slotsByDay = slots.reduce((acc, slot) => {
    if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
    acc[slot.dayOfWeek].push(slot);
    return acc;
  }, {} as Record<number, QueueSlot[]>);

  const handleAddSlot = async () => {
    try {
      await updateSlotsMutation.mutateAsync({
        slots: [...slots, newSlot],
      });
      toast.success("Queue slot added");
      setShowAddSlot(false);
    } catch {
      toast.error("Failed to add slot");
    }
  };

  const handleRemoveSlot = async (slotToRemove: QueueSlot) => {
    try {
      const newSlots = slots.filter(
        (s) =>
          !(
            s.dayOfWeek === slotToRemove.dayOfWeek &&
            s.hour === slotToRemove.hour &&
            s.minute === slotToRemove.minute
          )
      );
      await updateSlotsMutation.mutateAsync({ slots: newSlots });
      toast.success("Queue slot removed");
    } catch {
      toast.error("Failed to remove slot");
    }
  };

  const formatTime = (hour: number | undefined, minute: number | undefined) => {
    const h = hour ?? 0;
    const m = minute ?? 0;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Queue</h1>
          <p className="text-muted-foreground">
            Manage your posting schedule and queued content.
          </p>
        </div>
        <Button onClick={() => setShowAddSlot(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Time Slot
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Queue Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Weekly Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            {slotsLoading ? (
              <QueueScheduleSkeleton />
            ) : slots.length === 0 ? (
              <div className="py-8 text-center">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  No posting times set up yet.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowAddSlot(true)}
                >
                  Add Time Slot
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {DAYS_OF_WEEK.map((day, index) => {
                  const daySlots = slotsByDay[index] || [];
                  if (daySlots.length === 0) return null;

                  return (
                    <div key={day} className="space-y-2">
                      <p className="text-sm font-medium">{day}</p>
                      <div className="flex flex-wrap gap-2">
                        {daySlots
                          .sort((a, b) => ((a.hour ?? 0) * 60 + (a.minute ?? 0)) - ((b.hour ?? 0) * 60 + (b.minute ?? 0)))
                          .map((slot, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="gap-1 pr-1"
                            >
                              {formatTime(slot.hour, slot.minute)}
                              <button
                                onClick={() => handleRemoveSlot(slot)}
                                className="ml-1 rounded-full p-0.5 hover:bg-muted"
                                aria-label={`Remove ${formatTime(slot.hour, slot.minute)} slot`}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-4 w-4" />
              Upcoming Slots
            </CardTitle>
          </CardHeader>
          <CardContent>
            {previewLoading ? (
              <UpcomingSlotsSkeleton />
            ) : upcomingSlots.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No upcoming slots. Add time slots to your schedule.
              </p>
            ) : (
              <div className="space-y-2">
                {upcomingSlots.slice(0, 5).map((slot, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-muted p-3"
                  >
                    <span className="text-sm">
                      {format(parseISO(slot), "EEEE, MMM d")}
                    </span>
                    <Badge variant="outline">
                      {format(parseISO(slot), "h:mm a")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Queued Posts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListOrdered className="h-4 w-4" />
            Queued Posts
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/compose">Add Post</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {postsLoading ? (
            <QueuedPostsSkeleton />
          ) : queuedPosts.length === 0 ? (
            <div className="py-8 text-center">
              <ListOrdered className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No posts in queue. Create a post and add it to the queue.
              </p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/dashboard/compose">Create Post</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {queuedPosts.map((post: any) => (
                <PostListItem key={post._id} post={post} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Slot Dialog */}
      <Dialog open={showAddSlot} onOpenChange={setShowAddSlot}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Time Slot</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select
                value={newSlot.dayOfWeek.toString()}
                onValueChange={(v) =>
                  setNewSlot({ ...newSlot, dayOfWeek: parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <SelectItem key={day} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hour (0-23)</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={newSlot.hour}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, hour: parseInt(e.target.value) || 0 })
                  }
                  className={hourError ? "border-destructive" : ""}
                />
                {hourError && (
                  <p className="text-xs text-destructive">{hourError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Minute (0-59)</Label>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={newSlot.minute}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, minute: parseInt(e.target.value) || 0 })
                  }
                  className={minuteError ? "border-destructive" : ""}
                />
                {minuteError && (
                  <p className="text-xs text-destructive">{minuteError}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSlot(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSlot}
              disabled={updateSlotsMutation.isPending || !isValidSlot}
            >
              {updateSlotsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function QueueScheduleSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="flex flex-wrap gap-2">
            <div className="h-6 w-16 rounded-full bg-muted" />
            <div className="h-6 w-16 rounded-full bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function UpcomingSlotsSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between rounded-lg bg-muted p-3">
          <div className="h-4 w-32 rounded bg-background" />
          <div className="h-6 w-16 rounded bg-background" />
        </div>
      ))}
    </div>
  );
}

function QueuedPostsSkeleton() {
  return (
    <div className="animate-pulse space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
          <div className="h-12 w-12 shrink-0 rounded bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-muted" />
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-muted" />
              <div className="h-5 w-16 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
