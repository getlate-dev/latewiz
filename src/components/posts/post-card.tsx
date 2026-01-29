"use client";

import { format } from "date-fns/format";
import { parseISO } from "date-fns/parseISO";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlatformIcon } from "@/components/shared/platform-icon";
import type { Platform } from "@/lib/late-api";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  RefreshCw,
  Calendar,
  Image as ImageIcon,
  Video,
  ExternalLink,
} from "lucide-react";

interface Post {
  _id: string;
  content: string;
  mediaItems?: Array<{ type: "image" | "video"; url: string }>;
  platforms: Array<{
    platform: string;
    accountId: string;
    status?: string;
    platformPostUrl?: string;
  }>;
  scheduledFor?: string;
  status: "draft" | "scheduled" | "publishing" | "published" | "failed";
  createdAt: string;
}

interface PostCardProps {
  post: Post;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onRetry?: (postId: string) => void;
  compact?: boolean;
}

export function PostCard({
  post,
  onEdit,
  onDelete,
  onRetry,
  compact = false,
}: PostCardProps) {
  const hasMedia = post.mediaItems && post.mediaItems.length > 0;
  const imageCount = post.mediaItems?.filter((m) => m.type === "image").length || 0;
  const videoCount = post.mediaItems?.filter((m) => m.type === "video").length || 0;

  return (
    <Card className={compact ? "" : "overflow-hidden"}>
      <CardContent className={compact ? "p-4" : "p-0"}>
        {/* Media preview for non-compact */}
        {!compact && hasMedia && post.mediaItems?.[0] && (
          <div className="relative aspect-video bg-muted">
            {post.mediaItems[0].type === "video" ? (
              <video
                src={post.mediaItems[0].url}
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                src={post.mediaItems[0].url}
                alt=""
                className="h-full w-full object-cover"
              />
            )}
            {post.mediaItems.length > 1 && (
              <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                +{post.mediaItems.length - 1}
              </div>
            )}
          </div>
        )}

        <div className={compact ? "" : "p-4"}>
          {/* Content */}
          <p className={`text-sm ${compact ? "line-clamp-2" : "line-clamp-3"}`}>
            {post.content || "(No content)"}
          </p>

          {/* Media indicators for compact */}
          {compact && hasMedia && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              {imageCount > 0 && (
                <span className="flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  {imageCount}
                </span>
              )}
              {videoCount > 0 && (
                <span className="flex items-center gap-1">
                  <Video className="h-3 w-3" />
                  {videoCount}
                </span>
              )}
            </div>
          )}

          {/* Platforms and metadata */}
          <div className="mt-3 flex items-center justify-between">
            <PlatformIcons platforms={post.platforms} />
            <PostStatusBadge status={post.status} />
          </div>

          {/* Schedule time */}
          {post.scheduledFor && (
            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(parseISO(post.scheduledFor), "MMM d, yyyy 'at' h:mm a")}
            </div>
          )}

          {/* Actions */}
          {(onEdit || onDelete || onRetry) && (
            <div className="mt-3 flex items-center justify-end gap-2">
              {post.status === "failed" && onRetry && (
                <Button variant="outline" size="sm" onClick={() => onRetry(post._id)}>
                  <RefreshCw className="mr-1 h-3 w-3" />
                  Retry
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Post actions">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && post.status !== "published" && (
                    <DropdownMenuItem onClick={() => onEdit(post._id)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {post.status === "published" && post.platforms[0]?.platformPostUrl && (
                    <DropdownMenuItem asChild>
                      <a
                        href={post.platforms[0].platformPostUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View Post
                      </a>
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(post._id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PlatformIconsProps {
  platforms: Array<{ platform: string }>;
  max?: number;
  size?: "xs" | "sm";
}

export function PlatformIcons({ platforms, max = 4, size = "sm" }: PlatformIconsProps) {
  const visiblePlatforms = platforms.slice(0, max);
  const remaining = platforms.length - max;

  const containerSize = size === "xs" ? "h-5 w-5" : "h-6 w-6";
  const iconSize = size === "xs" ? "xs" : "xs"; // Both use xs PlatformIcon, but different container
  const fontSize = size === "xs" ? "text-[10px]" : "text-xs";

  return (
    <div className="flex -space-x-1">
      {visiblePlatforms.map((p, i) => (
        <div
          key={i}
          className={`flex ${containerSize} items-center justify-center rounded-full border-2 border-card bg-muted`}
        >
          <PlatformIcon
            platform={p.platform as Platform}
            size={iconSize}
            showColor
          />
        </div>
      ))}
      {remaining > 0 && (
        <div className={`flex ${containerSize} items-center justify-center rounded-full border-2 border-card bg-muted ${fontSize} font-medium`}>
          +{remaining}
        </div>
      )}
    </div>
  );
}

interface PostStatusBadgeProps {
  status: Post["status"];
}

export function PostStatusBadge({ status }: PostStatusBadgeProps) {
  const variants: Record<Post["status"], "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline",
    scheduled: "secondary",
    publishing: "secondary",
    published: "default",
    failed: "destructive",
  };

  return (
    <Badge variant={variants[status]} className="text-xs">
      {status}
    </Badge>
  );
}

interface PostListItemProps {
  post: Post;
  onClick?: () => void;
}

export function PostListItem({ post, onClick }: PostListItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent"
    >
      {post.mediaItems?.[0] && (
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
          {post.mediaItems[0].type === "video" ? (
            <video
              src={post.mediaItems[0].url}
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              src={post.mediaItems[0].url}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm">{post.content || "(No content)"}</p>
        <div className="mt-1 flex items-center gap-2">
          <PlatformIcons platforms={post.platforms} max={3} />
          <PostStatusBadge status={post.status} />
        </div>
      </div>
    </button>
  );
}
