"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns/format";
import { addMonths } from "date-fns/addMonths";
import { subMonths } from "date-fns/subMonths";
import { startOfMonth } from "date-fns/startOfMonth";
import { endOfMonth } from "date-fns/endOfMonth";
import { useCalendarPosts, useDeletePost } from "@/hooks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Badge } from "@/components/ui/badge";
import { PostCard } from "@/components/posts";
import { CalendarGrid } from "./_components/calendar-grid";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  const deleteMutation = useDeletePost();

  // Fetch posts for the current month (with buffer for edge days)
  const dateFrom = format(subMonths(startOfMonth(currentDate), 1), "yyyy-MM-dd");
  const dateTo = format(addMonths(endOfMonth(currentDate), 1), "yyyy-MM-dd");

  const { data: postsData, isLoading } = useCalendarPosts(dateFrom, dateTo);
  const posts = useMemo(() => (postsData?.posts || []) as any[], [postsData?.posts]);

  const selectedPost = useMemo(
    () => posts.find((p: any) => p._id === selectedPostId),
    [posts, selectedPostId]
  );

  const handlePrevMonth = () => setCurrentDate((d) => subMonths(d, 1));
  const handleNextMonth = () => setCurrentDate((d) => addMonths(d, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleDelete = async () => {
    if (!postToDelete) return;
    try {
      await deleteMutation.mutateAsync(postToDelete);
      toast.success("Post deleted");
      setPostToDelete(null);
      setSelectedPostId(null);
    } catch {
      toast.error("Failed to delete post");
    }
  };

  // Stats for the month - memoized to avoid recalculation on every render
  const monthPosts = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return posts.filter((p: any) => {
      if (!p.scheduledFor) return false;
      const postDate = new Date(p.scheduledFor);
      return postDate >= monthStart && postDate <= monthEnd;
    });
  }, [posts, currentDate]);

  const scheduledCount = useMemo(
    () => monthPosts.filter((p: any) => p.status === "scheduled").length,
    [monthPosts]
  );
  const publishedCount = useMemo(
    () => monthPosts.filter((p: any) => p.status === "published").length,
    [monthPosts]
  );

  return (
    <div className="space-y-3">
      {/* Header with controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="min-w-36 text-center text-base font-semibold">
            {format(currentDate, "MMMM yyyy")}
          </h1>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={handleToday}>
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
            {scheduledCount} scheduled
          </Badge>
          <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800">
            {publishedCount} published
          </Badge>
          <Button size="sm" className="h-8" asChild>
            <Link href="/dashboard/compose">
              <Plus className="mr-1.5 h-4 w-4" />
              New Post
            </Link>
          </Button>
        </div>
      </div>

      {/* Calendar */}
      {isLoading ? (
        <CalendarSkeleton />
      ) : (
        <CalendarGrid
          currentDate={currentDate}
          posts={posts}
          onPostClick={setSelectedPostId}
          onDayClick={(date) => {
            // Could open compose with pre-filled date
            console.log("Day clicked:", date);
          }}
        />
      )}

      {/* Post detail dialog */}
      <Dialog
        open={!!selectedPostId}
        onOpenChange={() => setSelectedPostId(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <PostCard
              post={selectedPost}
              onEdit={(_id) => {
                // Navigate to edit page
                setSelectedPostId(null);
              }}
              onDelete={(id) => {
                setPostToDelete(id);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!postToDelete} onOpenChange={() => setPostToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be
              undone.
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
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CalendarSkeleton() {
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="animate-pulse rounded-lg border border-border bg-card">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {weekDays.map((day) => (
          <div
            key={day}
            className="px-2 py-3 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid skeleton - 5 rows of 7 days */}
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, index) => (
          <div
            key={index}
            className={`min-h-24 border-b border-r border-border p-1 ${
              index % 7 === 6 ? "border-r-0" : ""
            } ${index >= 28 ? "border-b-0" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div className="h-7 w-7 rounded-full bg-muted" />
            </div>
            {/* Skeleton post placeholders for some cells */}
            {index % 3 === 0 && (
              <div className="mt-1 space-y-1">
                <div className="h-5 w-full rounded bg-muted" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
