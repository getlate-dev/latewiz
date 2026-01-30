"use client";

import { useMemo } from "react";
import { format } from "date-fns/format";
import { startOfMonth } from "date-fns/startOfMonth";
import { endOfMonth } from "date-fns/endOfMonth";
import { startOfWeek } from "date-fns/startOfWeek";
import { endOfWeek } from "date-fns/endOfWeek";
import { eachDayOfInterval } from "date-fns/eachDayOfInterval";
import { isSameMonth } from "date-fns/isSameMonth";
import { parseISO } from "date-fns/parseISO";
import { isToday } from "date-fns/isToday";
import { cn } from "@/lib/utils";

interface Post {
  _id: string;
  content: string;
  scheduledFor?: string;
  status: string;
  platforms: Array<{ platform: string }>;
  mediaItems?: Array<{ type: "image" | "video"; url: string }>;
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-50 dark:bg-blue-950/30 border-l-2 border-l-blue-500 hover:bg-blue-100 dark:hover:bg-blue-950/50';
    case 'published':
      return 'bg-green-50 dark:bg-green-950/30 border-l-2 border-l-green-500 hover:bg-green-100 dark:hover:bg-green-950/50';
    case 'failed':
      return 'bg-red-50 dark:bg-red-950/30 border-l-2 border-l-red-500 hover:bg-red-100 dark:hover:bg-red-950/50';
    case 'publishing':
      return 'bg-yellow-50 dark:bg-yellow-950/30 border-l-2 border-l-yellow-500';
    default:
      return 'bg-muted hover:bg-muted/80';
  }
};

const isWeekend = (date: Date) => [0, 6].includes(date.getDay());

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
  const weekDaysShort = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div className="rounded-lg border border-border bg-card overflow-x-auto">
      <div className="min-w-[500px]">
        {/* Week day headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {weekDays.map((day, i) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-xs font-medium text-muted-foreground sm:py-3 sm:text-sm"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{weekDaysShort[i]}</span>
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
                  "min-h-20 cursor-pointer border-b border-r border-border p-1 transition-colors hover:bg-accent/50 sm:min-h-24",
                  index % 7 === 6 && "border-r-0",
                  index >= days.length - 7 && "border-b-0",
                  !isCurrentMonth && "bg-muted/30",
                  isCurrentMonth && isWeekend(day) && "bg-muted/20 dark:bg-muted/10"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-xs sm:h-7 sm:w-7 sm:text-sm",
                      !isCurrentMonth && "text-muted-foreground",
                      isCurrentDay && "bg-primary text-primary-foreground font-medium"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayPosts.length > 0 && (
                    <span className="rounded-full bg-primary/10 px-1 py-0.5 text-[10px] font-medium text-primary sm:px-1.5 sm:text-xs">
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
                      className={cn(
                        "flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[10px] transition-colors sm:gap-1.5 sm:px-1.5 sm:py-1 sm:text-xs",
                        getStatusStyles(post.status)
                      )}
                    >
                      {post.mediaItems?.[0] && (
                        <img
                          src={post.mediaItems[0].url}
                          alt=""
                          className="h-3 w-3 rounded object-cover flex-shrink-0 sm:h-4 sm:w-4"
                        />
                      )}
                      <span className="flex-1 truncate">{post.content || "(No content)"}</span>
                    </button>
                  ))}
                  {dayPosts.length > 2 && (
                    <p className="px-1 text-[10px] text-muted-foreground sm:text-xs">
                      +{dayPosts.length - 2} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
