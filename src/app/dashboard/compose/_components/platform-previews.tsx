"use client";

import { useMemo, useState, useRef, useEffect, createContext, useContext } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlatformIcon } from "@/components/shared";
import { PLATFORM_NAMES, type Platform } from "@/lib/late-api";
import {
  PLATFORM_PREVIEW,
  getCharCountStatus,
  type PreviewPlatform,
} from "@/lib/platform-preview";
import {
  Monitor,
  Smartphone,
  Heart,
  MessageCircle,
  Repeat2,
  Send,
  Bookmark,
  Share,
  ThumbsUp,
  BarChart3,
  Globe,
  MoreHorizontal,
  ImageIcon,
} from "lucide-react";
import type { Account } from "@/hooks";

// --- Preview Size Context ---

type PreviewSize = "mobile" | "desktop";
const PreviewSizeContext = createContext<PreviewSize>("desktop");
function usePreviewSize() {
  return useContext(PreviewSizeContext);
}

const SUPPORTED_PREVIEWS: PreviewPlatform[] = ["twitter", "linkedin", "instagram"];

const SYSTEM_FONT =
  "font-[-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif]";

// --- Main Component ---

interface PlatformPreviewsProps {
  content: string;
  media: Array<{ url: string; type: "image" | "video" }>;
  selectedAccounts: Account[];
}

export function PlatformPreviews({
  content,
  media,
  selectedAccounts,
}: PlatformPreviewsProps) {
  const [previewSize, setPreviewSize] = useState<PreviewSize>("desktop");

  const platforms = useMemo(() => {
    const seen = new Set<Platform>();
    return selectedAccounts.reduce<
      Array<{ platform: PreviewPlatform; account: Account }>
    >((acc, account) => {
      const p = account.platform as Platform;
      if (!seen.has(p) && SUPPORTED_PREVIEWS.includes(p as PreviewPlatform)) {
        seen.add(p);
        acc.push({ platform: p as PreviewPlatform, account });
      }
      return acc;
    }, []);
  }, [selectedAccounts]);

  if (platforms.length === 0) return null;

  const defaultTab = platforms[0].platform;

  return (
    <PreviewSizeContext.Provider value={previewSize}>
      <div className="space-y-3">
        <Tabs defaultValue={defaultTab}>
          <div className="flex items-center justify-between gap-2">
            <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
              {platforms.map(({ platform }) => {
                const { charLimit } = PLATFORM_PREVIEW[platform];
                const status = getCharCountStatus(content.length, charLimit);
                return (
                  <TabsTrigger
                    key={platform}
                    value={platform}
                    className="gap-1.5 rounded-md border border-transparent px-2.5 py-1.5 data-[state=active]:border-border data-[state=active]:bg-muted"
                  >
                    <PlatformIcon platform={platform} showColor size="xs" />
                    <span className="text-xs">{PLATFORM_NAMES[platform]}</span>
                    {status === "over" && <span className="h-1.5 w-1.5 rounded-full bg-destructive" />}
                    {status === "warning" && <span className="h-1.5 w-1.5 rounded-full bg-warning" />}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <div className="flex shrink-0 rounded-md border border-border p-0.5">
              <Button variant={previewSize === "desktop" ? "secondary" : "ghost"} size="sm" className="h-7 w-7 p-0" onClick={() => setPreviewSize("desktop")} aria-label="Desktop preview">
                <Monitor className="h-3.5 w-3.5" />
              </Button>
              <Button variant={previewSize === "mobile" ? "secondary" : "ghost"} size="sm" className="h-7 w-7 p-0" onClick={() => setPreviewSize("mobile")} aria-label="Mobile preview">
                <Smartphone className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          {platforms.map(({ platform, account }) => (
            <TabsContent key={platform} value={platform} className="mt-3">
              <PreviewCard platform={platform} account={account} content={content} media={media} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </PreviewSizeContext.Provider>
  );
}

// --- Preview Card Wrapper ---

function PreviewCard({
  platform, account, content, media,
}: {
  platform: PreviewPlatform;
  account: Account;
  content: string;
  media: Array<{ url: string; type: "image" | "video" }>;
}) {
  const previewSize = usePreviewSize();
  const { charLimit } = PLATFORM_PREVIEW[platform];
  const charStatus = getCharCountStatus(content.length, charLimit);

  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <div className={`w-full overflow-hidden rounded-lg border border-border transition-all duration-200 ${previewSize === "mobile" ? "max-w-[350px]" : "max-w-[555px]"}`}>
          {platform === "twitter" && <XPreview account={account} content={content} media={media} />}
          {platform === "linkedin" && <LinkedInPreview account={account} content={content} media={media} />}
          {platform === "instagram" && <InstagramPreview account={account} content={content} media={media} />}
        </div>
      </div>
      {content.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground">
            {content.length.toLocaleString()} / {charLimit.toLocaleString()} characters
          </span>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${charStatus === "over" ? "bg-destructive" : charStatus === "warning" ? "bg-warning" : "bg-blue-500"}`}
              style={{ width: `${Math.min((content.length / charLimit) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// --- Shared Components ---

interface PreviewProps {
  account: Account;
  content: string;
  media: Array<{ url: string; type: "image" | "video" }>;
}

function HighlightedText({ text, highlightColor = "text-blue-500" }: { text: string; highlightColor?: string }) {
  const parts = text.split(/([@#][\wÀ-ɏ]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^[@#][\wÀ-ɏ]+$/.test(part)
          ? <span key={i} className={highlightColor}>{part}</span>
          : <span key={i}>{part}</span>
      )}
    </>
  );
}

function ClampedContent({
  content, lines, truncateLabel = "...more", truncateColor = "opacity-60", truncateInline = false, highlightColor, className = "", prefix,
}: {
  content: string;
  lines: number;
  truncateLabel?: string;
  truncateColor?: string;
  truncateInline?: boolean;
  highlightColor?: string;
  className?: string;
  prefix?: React.ReactNode;
}) {
  const previewSize = usePreviewSize();
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
    setIsOverflowing(el.scrollHeight > lineHeight * lines + 2);
  }, [content, lines, previewSize]);

  if (!content) {
    return <p className={`text-sm italic opacity-40 ${className}`}>Start typing to see preview...</p>;
  }

  const showTruncate = isOverflowing && !expanded;

  return (
    <div className={className}>
      <div className="relative">
        <div
          ref={ref}
          className="whitespace-pre-line break-words text-sm leading-5"
          style={!expanded && isOverflowing ? { maxHeight: `${lines * 1.25}rem`, overflow: "hidden" } : undefined}
        >
          {prefix}
          <HighlightedText text={content} highlightColor={highlightColor} />
        </div>
        {/* Inline mode: overlay on last line with gradient fade (LinkedIn style) */}
        {showTruncate && truncateInline && (
          <button
            onClick={() => setExpanded(true)}
            className={`absolute bottom-0 right-0 text-sm ${truncateColor} hover:underline`}
          >
            <span className="bg-gradient-to-r from-transparent via-white to-white pl-6 dark:via-[#1D2226] dark:to-[#1D2226]">
              {truncateLabel}
            </span>
          </button>
        )}
      </div>
      {/* Below mode: on its own line (X, Instagram style) */}
      {showTruncate && !truncateInline && (
        <button onClick={() => setExpanded(true)} className={`text-sm ${truncateColor} hover:underline`}>
          {truncateLabel}
        </button>
      )}
      {expanded && isOverflowing && (
        <button onClick={() => setExpanded(false)} className={`text-sm ${truncateColor} hover:underline`}>
          ...less
        </button>
      )}
    </div>
  );
}

function MockupAvatar({ src, fallback, size, ring = false }: { src?: string; fallback: string; size: number; ring?: boolean }) {
  if (src) {
    return <img src={src} alt="" className={`shrink-0 rounded-full object-cover ${ring ? "ring-2 ring-white dark:ring-[#1D2226]" : ""}`} style={{ width: `${size}px`, height: `${size}px` }} />;
  }
  return <div className="shrink-0 rounded-full" style={{ width: `${size}px`, height: `${size}px`, backgroundColor: fallback }} />;
}

// --- Media Components ---

function MediaItem({
  src, type, fit = "cover", autoPlay = false,
}: {
  src: string;
  type: "image" | "video";
  fit?: "cover" | "contain";
  autoPlay?: boolean;
}) {
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";
  if (type === "video") {
    return (
      <div className="relative h-full w-full">
        <video
          src={src}
          className={`h-full w-full ${fitClass}`}
          muted
          playsInline
          autoPlay={autoPlay}
          loop={autoPlay}
        />
        {!autoPlay && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50">
              <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 text-white" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
      </div>
    );
  }
  return <img src={src} alt="" className={`h-full w-full ${fitClass}`} />;
}

function XMediaGrid({ media }: { media: PreviewProps["media"] }) {
  if (media.length === 0) return null;
  if (media.length === 1) {
    return (
      <div className="overflow-hidden rounded-2xl" style={{ aspectRatio: "16/9" }}>
        <MediaItem src={media[0].url} type={media[0].type} autoPlay={media[0].type === "video"} />
      </div>
    );
  }
  if (media.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5 overflow-hidden rounded-2xl" style={{ aspectRatio: "7/4" }}>
        {media.slice(0, 2).map((m, i) => (
          <div key={i} className="overflow-hidden"><MediaItem src={m.url} type={m.type} /></div>
        ))}
      </div>
    );
  }
  if (media.length === 3) {
    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-2xl" style={{ aspectRatio: "7/4" }}>
        <div className="row-span-2 overflow-hidden"><MediaItem src={media[0].url} type={media[0].type} /></div>
        <div className="overflow-hidden"><MediaItem src={media[1].url} type={media[1].type} /></div>
        <div className="overflow-hidden"><MediaItem src={media[2].url} type={media[2].type} /></div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-2xl" style={{ aspectRatio: "16/9" }}>
      {media.slice(0, 4).map((m, i) => (
        <div key={i} className="overflow-hidden"><MediaItem src={m.url} type={m.type} /></div>
      ))}
    </div>
  );
}

function LinkedInMediaGrid({ media }: { media: PreviewProps["media"] }) {
  if (media.length === 0) return null;
  if (media.length === 1) {
    return (
      <div className="overflow-hidden" style={{ maxHeight: "600px" }}>
        <MediaItem src={media[0].url} type={media[0].type} autoPlay={media[0].type === "video"} />
      </div>
    );
  }
  if (media.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-0.5">
        {media.slice(0, 2).map((m, i) => (
          <div key={i} className="overflow-hidden" style={{ aspectRatio: "4/5" }}><MediaItem src={m.url} type={m.type} /></div>
        ))}
      </div>
    );
  }
  if (media.length === 3) {
    return (
      <div className="grid grid-cols-2 gap-0.5">
        <div className="col-span-2 overflow-hidden" style={{ aspectRatio: "16/9" }}><MediaItem src={media[0].url} type={media[0].type} /></div>
        {media.slice(1, 3).map((m, i) => (
          <div key={i} className="overflow-hidden" style={{ aspectRatio: "1/1" }}><MediaItem src={m.url} type={m.type} /></div>
        ))}
      </div>
    );
  }
  if (media.length === 4) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        <div className="col-span-3 overflow-hidden" style={{ aspectRatio: "16/9" }}><MediaItem src={media[0].url} type={media[0].type} /></div>
        {media.slice(1, 4).map((m, i) => (
          <div key={i} className="overflow-hidden" style={{ aspectRatio: "4/5" }}><MediaItem src={m.url} type={m.type} /></div>
        ))}
      </div>
    );
  }
  const remaining = media.length - 5;
  return (
    <div className="grid grid-cols-6 gap-0.5">
      <div className="col-span-3 overflow-hidden" style={{ aspectRatio: "1/1" }}><MediaItem src={media[0].url} type={media[0].type} /></div>
      <div className="col-span-3 overflow-hidden" style={{ aspectRatio: "1/1" }}><MediaItem src={media[1].url} type={media[1].type} /></div>
      {media.slice(2, 5).map((m, i) => (
        <div key={i} className="relative col-span-2 overflow-hidden" style={{ aspectRatio: "4/5" }}>
          <MediaItem src={m.url} type={m.type} />
          {i === 2 && remaining > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-2xl font-semibold text-white">+{remaining}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function InstagramCarousel({ media }: { media: PreviewProps["media"] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    setCurrent(0);
  }, [media.length]);

  if (media.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-neutral-50 dark:bg-neutral-900">
        <ImageIcon className="h-10 w-10 text-neutral-300 dark:text-neutral-700" />
      </div>
    );
  }

  const safeIndex = Math.min(current, media.length - 1);
  const hasPrev = safeIndex > 0;
  const hasNext = safeIndex < media.length - 1;

  // Dots: show a sliding window of up to 7 dots centered on current
  const maxDots = 7;
  const totalDots = Math.min(media.length, maxDots);
  let dotStart = 0;
  if (media.length > maxDots) {
    dotStart = Math.max(0, Math.min(safeIndex - Math.floor(maxDots / 2), media.length - maxDots));
  }

  return (
    <div>
      <div className="group relative overflow-hidden bg-neutral-100 dark:bg-neutral-900" style={{ aspectRatio: "1/1" }}>
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${safeIndex * 100}%)` }}
        >
          {media.map((m, i) => (
            <div key={i} className="h-full w-full shrink-0">
              <MediaItem src={m.url} type={m.type} fit="contain" autoPlay={i === safeIndex} />
            </div>
          ))}
        </div>

        {media.length > 1 && (
          <div className="absolute top-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
            {safeIndex + 1}/{media.length}
          </div>
        )}

        {hasPrev && (
          <button
            onClick={() => setCurrent(safeIndex - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-md opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Previous image"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-neutral-800" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        )}
        {hasNext && (
          <button
            onClick={() => setCurrent(safeIndex + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-md opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Next image"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-neutral-800" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        )}
      </div>

      {media.length > 1 && (
        <div className="flex items-center justify-center gap-1 py-1.5">
          {Array.from({ length: totalDots }, (_, i) => {
            const dotIndex = dotStart + i;
            const distance = Math.abs(dotIndex - safeIndex);
            const sizeClass = distance <= 1 ? "h-1.5 w-1.5" : "h-1 w-1";
            return (
              <div
                key={dotIndex}
                className={`rounded-full transition-all duration-200 ${sizeClass} ${
                  dotIndex === safeIndex
                    ? "bg-[#0095F6]"
                    : "bg-neutral-300 dark:bg-neutral-600"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// X (Twitter) Preview
// ============================================================

function XPreview({ account, content, media }: PreviewProps) {
  return (
    <div className={`bg-white dark:bg-black ${SYSTEM_FONT}`}>
      <div className="px-4 py-3">
        <div className="flex gap-3">
          <MockupAvatar src={account.profilePicture} fallback="#1D9BF0" size={40} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 text-[15px] leading-5">
              <span className="truncate font-bold text-[#0F1419] dark:text-[#E7E9EA]">{account.displayName || account.username}</span>
              <span className="truncate text-[#536471] dark:text-[#71767B]">@{account.username}</span>
              <span className="shrink-0 text-[#536471] dark:text-[#71767B]">· now</span>
            </div>
            <ClampedContent
              content={content}
              lines={content.length > 280 ? 4 : 999}
              truncateLabel="Show more"
              truncateColor="text-[#1D9BF0]"
              highlightColor="text-[#1D9BF0]"
              className="mt-0.5 text-[#0F1419] dark:text-[#E7E9EA] bg-white dark:bg-black"
            />
            {media.length > 0 && <div className="mt-3"><XMediaGrid media={media} /></div>}
            <div className="mt-3 flex items-center justify-between max-w-[400px]">
              {[
                { icon: MessageCircle, hover: "hover:text-[#1D9BF0]", name: "reply" },
                { icon: Repeat2, hover: "hover:text-[#00BA7C]", name: "repost" },
                { icon: Heart, hover: "hover:text-[#F91880]", name: "like" },
                { icon: BarChart3, hover: "hover:text-[#1D9BF0]", name: "views" },
                { icon: Bookmark, hover: "hover:text-[#1D9BF0]", name: "bookmark" },
                { icon: Share, hover: "hover:text-[#1D9BF0]", name: "share" },
              ].map(({ icon: Icon, hover, name }) => (
                <Icon key={name} className={`h-5 w-5 text-[#536471] dark:text-[#71767B] ${hover} transition-colors cursor-pointer`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LinkedIn Preview
// ============================================================

function LinkedInPreview({ account, content, media }: PreviewProps) {
  const previewSize = usePreviewSize();
  const lines = previewSize === "mobile" ? 2 : media.length > 0 ? 3 : 5;
  return (
    <div className={`bg-white dark:bg-[#1D2226] ${SYSTEM_FONT}`}>
      <div className="pt-3 px-4">
        <div className="flex items-start gap-3">
          <MockupAvatar src={account.profilePicture} fallback="#0A66C2" size={48} ring />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#000000E6] dark:text-[#FFFFFFE6]">{account.displayName || account.username}</p>
            <p className="truncate text-xs text-[#00000099] dark:text-[#FFFFFF99]">Professional headline</p>
            <div className="flex items-center gap-1 text-xs text-[#00000099] dark:text-[#FFFFFF99]">
              <span>Now</span><span>·</span><Globe className="h-3 w-3" />
            </div>
          </div>
          <MoreHorizontal className="h-5 w-5 shrink-0 text-[#00000099] dark:text-[#FFFFFF99]" />
        </div>
      </div>
      <div className="mt-3 px-4 pb-1">
        <ClampedContent
          content={content}
          lines={lines}
          truncateLabel="...more"
          truncateInline
          truncateColor="text-[#00000099] dark:text-[#FFFFFF99]"
          highlightColor="font-semibold text-[#0A66C2]"
          className="text-[#000000E6] dark:text-[#FFFFFFE6] bg-white dark:bg-[#1D2226]"
        />
      </div>
      {media.length > 0 && <div className="mt-2"><LinkedInMediaGrid media={media} /></div>}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <img src="/linkedin-reactions.svg" alt="" className="h-5 w-auto" />
          {previewSize === "desktop" && <span className="text-xs text-[#666] dark:text-[#B0B3B8]">169</span>}
        </div>
        <span className={`text-[#666] dark:text-[#B0B3B8] ${previewSize === "mobile" ? "text-[10px]" : "text-xs"}`}>4 comments · 1 repost</span>
      </div>
      <hr className="mx-4 border-neutral-200 dark:border-[#FFFFFF14]" />
      <div className={`flex items-center px-4 py-1 ${previewSize === "mobile" ? "justify-between" : "justify-around"}`}>
        {[
          { icon: ThumbsUp, label: "Like" },
          { icon: MessageCircle, label: "Comment" },
          { icon: Repeat2, label: "Repost" },
          { icon: Send, label: "Send" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className={`flex items-center justify-center rounded-lg px-2 py-2.5 font-semibold text-[#666] dark:text-[#B0B3B8] hover:bg-neutral-100 dark:hover:bg-[#FFFFFF14] cursor-pointer transition-colors ${previewSize === "mobile" ? "flex-col gap-0.5 text-[10px]" : "flex-row gap-1.5 text-xs"}`}>
            <Icon className="h-4 w-4" /><span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Instagram Preview
// ============================================================

function InstagramPreview({ account, content, media }: PreviewProps) {
  return (
    <div className={`bg-white dark:bg-black ${SYSTEM_FONT}`}>
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#F58529] via-[#DD2A7B] to-[#8134AF] p-[2px]">
            {account.profilePicture
              ? <img src={account.profilePicture} alt="" className="h-full w-full rounded-full border-[1.5px] border-white bg-white object-cover dark:border-black dark:bg-black" />
              : <div className="h-full w-full rounded-full border-[1.5px] border-white bg-neutral-300 dark:border-black" />}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-[#262626] dark:text-[#F5F5F5]">{account.username}</span>
            <span className="text-xs text-[#8E8E8E]">· 2h</span>
          </div>
        </div>
        <MoreHorizontal className="h-5 w-5 text-[#262626] dark:text-[#F5F5F5]" />
      </div>

      <InstagramCarousel media={media} />

      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-4">
          <Heart className="h-6 w-6 text-[#262626] dark:text-[#F5F5F5]" />
          <MessageCircle className="h-6 w-6 text-[#262626] dark:text-[#F5F5F5]" />
          <Send className="h-6 w-6 text-[#262626] dark:text-[#F5F5F5]" />
        </div>
        <Bookmark className="h-6 w-6 text-[#262626] dark:text-[#F5F5F5]" />
      </div>

      <div className="px-3">
        <span className="text-sm font-semibold text-[#262626] dark:text-[#F5F5F5]">42 likes</span>
      </div>

      <div className="px-3 pt-1 pb-2">
        {content ? (
          <ClampedContent
            content={content}
            lines={2}
            truncateLabel="...more"
            truncateColor="text-[#8E8E8E]"
            highlightColor="text-[#00376B] dark:text-[#E0F1FF]"
            className="text-sm leading-[18px] text-[#262626] dark:text-[#F5F5F5] bg-white dark:bg-black"
            prefix={<span className="font-semibold">{account.username} </span>}
          />
        ) : (
          <p className="text-sm italic text-[#8E8E8E]">Start typing to see preview...</p>
        )}
      </div>

      <div className="px-3 pb-3">
        <span className="text-[10px] uppercase tracking-wide text-[#8E8E8E]">Just now</span>
      </div>
    </div>
  );
}
