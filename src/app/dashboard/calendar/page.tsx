"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns/format";
import { addMonths } from "date-fns/addMonths";
import { subMonths } from "date-fns/subMonths";
import { startOfMonth } from "date-fns/startOfMonth";
import { endOfMonth } from "date-fns/endOfMonth";
import { useCalendarPosts, useDeletePost } from "@/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { CalendarList } from "./_components/calendar-list";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
  Calendar,
  List,
  Grid3X3,
} from "lucide-react";
import { toast } from "sonner";

type ViewMode = "list" | "grid";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // Default to list on mobile, grid on desktop
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    setViewMode(isMobile ? "list" : "grid");
  }, []);

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

  // Stats for the month
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
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-muted-foreground">
          View and manage your scheduled posts.
        </p>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="min-w-32 text-center text-base font-semibold sm:min-w-36">
                {format(currentDate, "MMMM yyyy")}
              </h2>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="hidden h-8 sm:inline-flex" onClick={handleToday}>
                Today
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex rounded-lg border border-border p-0.5">
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 px-2"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
              </div>

              {/* Stats badges - hidden on mobile */}
              <Badge variant="outline" className="hidden text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 sm:inline-flex">
                {scheduledCount} scheduled
              </Badge>
              <Badge variant="outline" className="hidden text-xs bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800 sm:inline-flex">
                {publishedCount} published
              </Badge>

              <Button size="sm" className="h-8" asChild>
                <Link href="/dashboard/compose">
                  <Plus className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">New Post</span>
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Content */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {viewMode === "grid" ? (
              <Calendar className="h-4 w-4" />
            ) : (
              <List className="h-4 w-4" />
            )}
            {format(currentDate, "MMMM")} Schedule
          </CardTitle>
          <CardDescription>
            {viewMode === "grid"
              ? "Click on a post to view details or a day to create a new post."
              : "Tap a post to view details."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            viewMode === "grid" ? <CalendarSkeleton /> : <ListSkeleton />
          ) : viewMode === "grid" ? (
            <CalendarGrid
              currentDate={currentDate}
              posts={posts}
              onPostClick={setSelectedPostId}
              onDayClick={(date) => {
                console.log("Day clicked:", date);
              }}
            />
          ) : (
            <CalendarList
              currentDate={currentDate}
              posts={posts}
              onPostClick={setSelectedPostId}
            />
          )}
        </CardContent>
      </Card>

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
    <div className="animate-pulse">
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

function ListSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-border">
      {[1, 2, 3].map((group) => (
        <div key={group}>
          {/* Day header skeleton */}
          <div className="bg-muted/50 px-4 py-2">
            <div className="h-4 w-32 rounded bg-muted" />
          </div>
          {/* Posts skeleton */}
          {[1, 2].map((post) => (
            <div key={post} className="flex gap-3 p-4">
              <div className="h-14 w-14 shrink-0 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
