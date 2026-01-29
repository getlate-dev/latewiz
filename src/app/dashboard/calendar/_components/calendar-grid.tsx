"use client";

import { useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  parseISO,
  isToday,
} from "date-fns";
import { PlatformIcons } from "@/components/posts";
import { cn } from "@/lib/utils";

interface Post {
  _id: string;
  content: string;
  scheduledFor?: string;
  status: string;
  platforms: Array<{ platform: string }>;
}

interface CalendarGridProps {
  currentDate: Date;
  posts: Post[];
  onPostClick: (postId: string) => void;
  onDayClick: (date: Date) => void;
}

export function CalendarGrid({
  currentDate,
  posts,
  onPostClick,
  onDayClick,
}: CalendarGridProps) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const postsByDate = useMemo(() => {
    const map = new Map<string, Post[]>();
    posts.forEach((post) => {
      if (post.scheduledFor) {
        const dateKey = format(parseISO(post.scheduledFor), "yyyy-MM-dd");
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, post]);
      }
    });
    return map;
  }, [posts]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="rounded-lg border border-border bg-card">
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

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayPosts = postsByDate.get(dateKey) || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);

          return (
            <div
              key={dateKey}
              onClick={() => onDayClick(day)}
              className={cn(
                "min-h-24 cursor-pointer border-b border-r border-border p-1 transition-colors hover:bg-accent/50",
                index % 7 === 6 && "border-r-0",
                index >= days.length - 7 && "border-b-0",
                !isCurrentMonth && "bg-muted/30"
              )}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm",
                    !isCurrentMonth && "text-muted-foreground",
                    isCurrentDay && "bg-primary text-primary-foreground font-medium"
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayPosts.length > 0 && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                    {dayPosts.length}
                  </span>
                )}
              </div>

              {/* Post previews */}
              <div className="mt-1 space-y-1">
                {dayPosts.slice(0, 2).map((post) => (
                  <button
                    key={post._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPostClick(post._id);
                    }}
                    className="flex w-full items-center gap-1 rounded bg-muted p-1 text-left text-xs transition-colors hover:bg-muted/80"
                  >
                    <PlatformIcons platforms={post.platforms} max={2} />
                    <span className="flex-1 truncate">{post.content}</span>
                  </button>
                ))}
                {dayPosts.length > 2 && (
                  <p className="px-1 text-xs text-muted-foreground">
                    +{dayPosts.length - 2} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
