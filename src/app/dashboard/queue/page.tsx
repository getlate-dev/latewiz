"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { toZonedTime, format as formatTz } from "date-fns-tz";
import { toast } from "sonner";
import {
  useQueues,
  useQueuePreview,
  useCreateQueue,
  useUpdateQueue,
  useDeleteQueue,
  useScheduledPosts,
  DAYS_OF_WEEK,
  getUserTimezone,
  getTimezoneOptions,
  formatTime,
  parseTime,
  getSlotTime,
  type QueueSlot,
  type QueueSchedule,
} from "@/hooks";
import { useAppStore } from "@/stores";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PostListItem } from "@/components/posts";
import {
  Plus,
  Clock,
  Trash2,
  Loader2,
  Calendar,
  ListOrdered,
  MoreHorizontal,
  Pencil,
  Star,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function QueuePage() {
  const [showAddQueue, setShowAddQueue] = useState(false);
  const [showEditQueue, setShowEditQueue] = useState(false);
  const [showDeleteQueue, setShowDeleteQueue] = useState(false);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState<QueueSchedule | null>(null);
  const [expandedQueueId, setExpandedQueueId] = useState<string | null>(null);

  // New queue form state
  const [newQueueName, setNewQueueName] = useState("");
  const [newQueueTimezone, setNewQueueTimezone] = useState(getUserTimezone());
  const [newQueueSlots, setNewQueueSlots] = useState<QueueSlot[]>([]);

  // Edit queue form state
  const [editQueueName, setEditQueueName] = useState("");
  const [editQueueTimezone, setEditQueueTimezone] = useState("");

  // New slot for adding to a queue
  const [newSlotDay, setNewSlotDay] = useState(1);
  const [newSlotHour, setNewSlotHour] = useState(9);
  const [newSlotMinute, setNewSlotMinute] = useState(0);

  const { timezone: appTimezone } = useAppStore();
  const { data: queuesData, isLoading: queuesLoading } = useQueues();
  const { data: previewData, isLoading: previewLoading } = useQueuePreview(10);
  const { data: postsData, isLoading: postsLoading } = useScheduledPosts(10);
  const createQueueMutation = useCreateQueue();
  const updateQueueMutation = useUpdateQueue();
  const deleteQueueMutation = useDeleteQueue();

  const queues = (queuesData?.queues || []) as QueueSchedule[];

  // Helper to format dates in the user's configured timezone
  const formatInAppTimezone = (isoString: string, formatStr: string) => {
    const date = new Date(isoString);
    const zonedDate = toZonedTime(date, appTimezone);
    return formatTz(zonedDate, formatStr, { timeZone: appTimezone });
  };
  const upcomingSlots = (previewData?.slots || []) as string[];
  const queuedPosts = ((postsData?.posts || []) as any[]).filter(
    (p) => p.queuedFromProfile
  );

  // Compute timezone options - always include user's timezone and selected queue's timezone
  const timezoneOptions = useMemo(
    () => getTimezoneOptions(selectedQueue?.timezone, editQueueTimezone),
    [selectedQueue?.timezone, editQueueTimezone]
  );

  const handleCreateQueue = async () => {
    if (!newQueueName.trim()) {
      toast.error("Queue name is required");
      return;
    }
    try {
      await createQueueMutation.mutateAsync({
        name: newQueueName.trim(),
        timezone: newQueueTimezone,
        slots: newQueueSlots,
        active: true,
      });
      toast.success("Queue created");
      setShowAddQueue(false);
      resetNewQueueForm();
    } catch {
      toast.error("Failed to create queue");
    }
  };

  const handleUpdateQueue = async () => {
    if (!selectedQueue?._id) return;
    if (!editQueueName.trim()) {
      toast.error("Queue name is required");
      return;
    }
    try {
      await updateQueueMutation.mutateAsync({
        queueId: selectedQueue._id,
        name: editQueueName.trim(),
        timezone: editQueueTimezone,
      });
      toast.success("Queue updated");
      setShowEditQueue(false);
      setSelectedQueue(null);
    } catch {
      toast.error("Failed to update queue");
    }
  };

  const handleDeleteQueue = async () => {
    if (!selectedQueue?._id) return;
    try {
      await deleteQueueMutation.mutateAsync({ queueId: selectedQueue._id });
      toast.success("Queue deleted");
      setShowDeleteQueue(false);
      setSelectedQueue(null);
    } catch {
      toast.error("Failed to delete queue");
    }
  };

  const handleToggleActive = async (queue: QueueSchedule) => {
    if (!queue._id) return;
    try {
      await updateQueueMutation.mutateAsync({
        queueId: queue._id,
        active: !queue.active,
      });
      toast.success(queue.active ? "Queue paused" : "Queue activated");
    } catch {
      toast.error("Failed to update queue");
    }
  };

  const handleSetDefault = async (queue: QueueSchedule) => {
    if (!queue._id) return;
    try {
      await updateQueueMutation.mutateAsync({
        queueId: queue._id,
        setAsDefault: true,
      });
      toast.success("Set as default queue");
    } catch {
      toast.error("Failed to set default");
    }
  };

  const handleAddSlotToQueue = async () => {
    if (!selectedQueue?._id) return;
    const newSlot: QueueSlot = {
      dayOfWeek: newSlotDay,
      time: formatTime(newSlotHour, newSlotMinute),
    };
    const updatedSlots = [...(selectedQueue.slots || []), newSlot];
    try {
      await updateQueueMutation.mutateAsync({
        queueId: selectedQueue._id,
        slots: updatedSlots,
      });
      toast.success("Slot added");
      setShowAddSlot(false);
    } catch {
      toast.error("Failed to add slot");
    }
  };

  const handleRemoveSlot = async (queue: QueueSchedule, slotIndex: number) => {
    if (!queue._id) return;
    const updatedSlots = (queue.slots || []).filter((_, i) => i !== slotIndex);
    try {
      await updateQueueMutation.mutateAsync({
        queueId: queue._id,
        slots: updatedSlots,
      });
      toast.success("Slot removed");
    } catch {
      toast.error("Failed to remove slot");
    }
  };

  const handleAddSlotToNewQueue = () => {
    const newSlot: QueueSlot = {
      dayOfWeek: newSlotDay,
      time: formatTime(newSlotHour, newSlotMinute),
    };
    setNewQueueSlots([...newQueueSlots, newSlot]);
  };

  const handleRemoveSlotFromNewQueue = (index: number) => {
    setNewQueueSlots(newQueueSlots.filter((_, i) => i !== index));
  };

  const resetNewQueueForm = () => {
    setNewQueueName("");
    setNewQueueTimezone(getUserTimezone());
    setNewQueueSlots([]);
    setNewSlotDay(1);
    setNewSlotHour(9);
    setNewSlotMinute(0);
  };

  const openEditQueue = (queue: QueueSchedule) => {
    setSelectedQueue(queue);
    setEditQueueName(queue.name || "");
    setEditQueueTimezone(queue.timezone || getUserTimezone());
    setShowEditQueue(true);
  };

  const openDeleteQueue = (queue: QueueSchedule) => {
    setSelectedQueue(queue);
    setShowDeleteQueue(true);
  };

  const openAddSlot = (queue: QueueSchedule) => {
    setSelectedQueue(queue);
    setNewSlotDay(1);
    setNewSlotHour(9);
    setNewSlotMinute(0);
    setShowAddSlot(true);
  };

  // Group slots by day for a queue
  const groupSlotsByDay = (slots: QueueSlot[]) => {
    return slots.reduce((acc, slot, index) => {
      if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
      acc[slot.dayOfWeek].push({ slot, index });
      return acc;
    }, {} as Record<number, { slot: QueueSlot; index: number }[]>);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Queue</h1>
        <p className="text-muted-foreground">
          Manage your posting schedules.
        </p>
      </div>

      {/* Queues List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Queues
            </CardTitle>
            <CardDescription>
              {queues.length} {queues.length === 1 ? "queue" : "queues"} configured
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowAddQueue(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Queue
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {queuesLoading ? (
            <QueueListSkeleton />
          ) : queues.length === 0 ? (
            <div className="rounded-lg bg-muted p-6 text-center">
              <Clock className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                No queues set up yet. Create a queue to schedule your posts.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowAddQueue(true)}
              >
                Create Queue
              </Button>
            </div>
          ) : (
            queues.map((queue) => {
              const isExpanded = expandedQueueId === queue._id;
              const slotsByDay = groupSlotsByDay(queue.slots || []);
              const slotCount = queue.slots?.length || 0;

              return (
                <div
                  key={queue._id}
                  className="rounded-lg border bg-card"
                >
                  {/* Queue Header */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Switch
                        checked={queue.active}
                        onCheckedChange={() => handleToggleActive(queue)}
                        aria-label={`Toggle ${queue.name} active`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {queue.name || "Unnamed Queue"}
                          </span>
                          {queue.isDefault && (
                            <Badge variant="secondary" className="shrink-0">
                              <Star className="mr-1 h-3 w-3" />
                              Default
                            </Badge>
                          )}
                          {!queue.active && (
                            <Badge variant="outline" className="shrink-0 text-muted-foreground">
                              Paused
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {slotCount} {slotCount === 1 ? "slot" : "slots"} · {queue.timezone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedQueueId(isExpanded ? null : queue._id || null)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openAddSlot(queue)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Slot
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditQueue(queue)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Queue
                          </DropdownMenuItem>
                          {!queue.isDefault && (
                            <DropdownMenuItem onClick={() => handleSetDefault(queue)}>
                              <Star className="mr-2 h-4 w-4" />
                              Set as Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteQueue(queue)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Queue
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Expanded Slots View */}
                  {isExpanded && (
                    <div className="border-t px-4 py-3 space-y-3">
                      {slotCount === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No time slots configured.{" "}
                          <button
                            onClick={() => openAddSlot(queue)}
                            className="text-primary hover:underline"
                          >
                            Add one
                          </button>
                        </p>
                      ) : (
                        <>
                        <p className="text-xs text-muted-foreground">
                          Times in {queue.timezone?.replace(/_/g, " ")}
                        </p>
                        {DAYS_OF_WEEK.map((day, dayIndex) => {
                          const daySlots = slotsByDay[dayIndex] || [];
                          if (daySlots.length === 0) return null;

                          return (
                            <div key={day} className="flex items-start justify-between">
                              <span className="text-sm font-medium text-muted-foreground w-24">
                                {day}
                              </span>
                              <div className="flex flex-1 flex-wrap gap-2">
                                {daySlots
                                  .sort((a, b) => {
                                    const aTime = parseTime(getSlotTime(a.slot));
                                    const bTime = parseTime(getSlotTime(b.slot));
                                    return (aTime.hour * 60 + aTime.minute) - (bTime.hour * 60 + bTime.minute);
                                  })
                                  .map(({ slot, index }) => {
                                    const slotTime = getSlotTime(slot);
                                    return (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="gap-1 pr-1"
                                    >
                                      {slotTime}
                                      <button
                                        onClick={() => handleRemoveSlot(queue, index)}
                                        className="ml-1 rounded-full p-0.5 hover:bg-muted"
                                        aria-label={`Remove ${slotTime} slot`}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                    );
                                  })}
                              </div>
                            </div>
                          );
                        })}
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => openAddSlot(queue)}
                      >
                        <Plus className="mr-1.5 h-4 w-4" />
                        Add Time Slot
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Upcoming Slots */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4" />
            Next Up
          </CardTitle>
          <CardDescription>
            Upcoming slots shown in your timezone ({appTimezone.replace(/_/g, " ")})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {previewLoading ? (
            <UpcomingSlotsSkeleton />
          ) : upcomingSlots.length === 0 ? (
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">
                No upcoming slots. Add time slots to your queues.
              </p>
            </div>
          ) : (
            upcomingSlots.slice(0, 5).map((slot, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-muted p-3"
              >
                <span className="text-sm">
                  {formatInAppTimezone(slot, "EEEE, MMM d")}
                </span>
                <Badge variant="outline">
                  {formatInAppTimezone(slot, "h:mm a")}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Queued Posts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListOrdered className="h-4 w-4" />
              Posts in Queue
            </CardTitle>
            <CardDescription>
              {queuedPosts.length} {queuedPosts.length === 1 ? "post" : "posts"} queued
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/compose">Add Post</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {postsLoading ? (
            <QueuedPostsSkeleton />
          ) : queuedPosts.length === 0 ? (
            <div className="rounded-lg bg-muted p-6 text-center">
              <ListOrdered className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                No posts in queue. Create a post and add it to the queue.
              </p>
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <Link href="/dashboard/compose">Create Post</Link>
              </Button>
            </div>
          ) : (
            queuedPosts.map((post: any, index: number) => (
              <div key={post._id} className="flex items-center gap-3 rounded-lg bg-muted p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background text-sm font-medium flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <PostListItem post={post} />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Add Queue Dialog */}
      <Dialog open={showAddQueue} onOpenChange={(open) => {
        setShowAddQueue(open);
        if (!open) resetNewQueueForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Queue</DialogTitle>
            <DialogDescription>
              Set up a new posting schedule with custom time slots.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="queue-name">Name</Label>
              <Input
                id="queue-name"
                placeholder="e.g., Morning Posts"
                value={newQueueName}
                onChange={(e) => setNewQueueName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={newQueueTimezone}
                onValueChange={setNewQueueTimezone}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezoneOptions.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Slots Section */}
            <div className="space-y-3">
              <Label>Time Slots</Label>
              {newQueueSlots.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newQueueSlots.map((slot, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 pr-1">
                      {DAYS_OF_WEEK[slot.dayOfWeek].slice(0, 3)} {getSlotTime(slot)}
                      <button
                        onClick={() => handleRemoveSlotFromNewQueue(i)}
                        className="ml-1 rounded-full p-0.5 hover:bg-muted"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={newSlotDay.toString()}
                  onValueChange={(v) => setNewSlotDay(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day, index) => (
                      <SelectItem key={day} value={index.toString()}>
                        {day.slice(0, 3)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={newSlotHour.toString()}
                  onValueChange={(v) => setNewSlotHour(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString().padStart(2, "0")}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={newSlotMinute.toString()}
                  onValueChange={(v) => setNewSlotMinute(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 15, 30, 45].map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        :{m.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSlotToNewQueue}
                className="w-full"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add Slot
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddQueue(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateQueue}
              disabled={createQueueMutation.isPending}
            >
              {createQueueMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Queue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Queue Dialog */}
      <Dialog open={showEditQueue} onOpenChange={setShowEditQueue}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Queue</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-queue-name">Name</Label>
              <Input
                id="edit-queue-name"
                value={editQueueName}
                onChange={(e) => setEditQueueName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={editQueueTimezone}
                onValueChange={setEditQueueTimezone}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezoneOptions.map((tz) => (
                    <SelectItem key={tz} value={tz}>
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditQueue(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateQueue}
              disabled={updateQueueMutation.isPending}
            >
              {updateQueueMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Slot Dialog */}
      <Dialog open={showAddSlot} onOpenChange={setShowAddSlot}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Time Slot</DialogTitle>
            <DialogDescription>
              Add a new time slot to {selectedQueue?.name || "this queue"}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select
                value={newSlotDay.toString()}
                onValueChange={(v) => setNewSlotDay(parseInt(v))}
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
                <Select
                  value={newSlotHour.toString()}
                  onValueChange={(v) => setNewSlotHour(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i.toString().padStart(2, "0")}:00
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Minute</Label>
                <Select
                  value={newSlotMinute.toString()}
                  onValueChange={(v) => setNewSlotMinute(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 15, 30, 45].map((m) => (
                      <SelectItem key={m} value={m.toString()}>
                        :{m.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                Preview: <span className="font-medium text-foreground">{formatTime(newSlotHour, newSlotMinute)}</span> on <span className="font-medium text-foreground">{DAYS_OF_WEEK[newSlotDay]}</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSlot(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSlotToQueue}
              disabled={updateQueueMutation.isPending}
            >
              {updateQueueMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Slot
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Queue Alert Dialog */}
      <AlertDialog open={showDeleteQueue} onOpenChange={setShowDeleteQueue}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Queue</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedQueue?.name}"? This action cannot be undone.
              Posts already scheduled from this queue will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQueue}
              variant="destructive"
            >
              {deleteQueueMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function QueueListSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[0, 1].map((i) => (
        <div key={i} className="rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-muted" />
              <div className="h-3 w-48 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UpcomingSlotsSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
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
    <div className="animate-pulse space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <div className="h-8 w-8 rounded-full bg-background" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded bg-background" />
            <div className="h-2 w-1/2 rounded bg-background" />
          </div>
        </div>
      ))}
    </div>
  );
}
