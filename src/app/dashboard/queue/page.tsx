"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
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

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
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
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
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
                          .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))
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
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
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
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
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
                <Label>Hour</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={newSlot.hour}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, hour: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Minute</Label>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={newSlot.minute}
                  onChange={(e) =>
                    setNewSlot({ ...newSlot, minute: parseInt(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSlot(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSlot}
              disabled={updateSlotsMutation.isPending}
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
