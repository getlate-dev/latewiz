"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, Image } from "lucide-react";
import { PlatformIcons, PostStatusBadge } from "@/components/posts";
import { LoadingSkeleton } from "./loading-skeleton";
import { EmptyState } from "./empty-state";
import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";

interface RecentPostsProps {
  posts: any[];
  isLoading: boolean;
}

export function RecentPosts({ posts, isLoading }: RecentPostsProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-semibold"></h2>
        </div>
        {posts.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 hover:bg-primary/10 hover:text-primary"
            asChild
          >
            <Link href="/dashboard/calendar">View all →</Link>
          </Button>
        )}
      </div>
      <div className="space-y-2.5">
        {isLoading ? (
          <LoadingSkeleton rows={5} />
        ) : posts.length === 0 ? (
          <EmptyState
            message="No posts yet"
            action="Create your first post"
            href="/dashboard/compose"
          />
        ) : (
          posts.slice(0, 5).map((post: any, index: number) => (
            <div
              key={post._id}
              className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/60 transition-colors duration-150 group"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {post.mediaItems?.[0] ? (
                  <img
                    src={post.mediaItems[0].url}
                    alt=""
                    className="h-9 w-9 rounded-md object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                    <Image className="h-4 w-4 text-muted-foreground/60" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">
                    {post.content || "(No content)"}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <PlatformIcons platforms={post.platforms || []} size="xs" />
                    {post.scheduledFor && (
                      <span className="text-[10px] text-muted-foreground">
                        {format(parseISO(post.scheduledFor), "MMM d, h:mm a")}
                      </span>
                    )}
                    <PostStatusBadge status={post.status} />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
