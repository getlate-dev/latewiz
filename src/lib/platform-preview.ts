export type PreviewPlatform = "twitter" | "linkedin" | "instagram";

export interface PlatformPreviewConfig {
  charLimit: number;
}

export const PLATFORM_PREVIEW: Record<PreviewPlatform, PlatformPreviewConfig> = {
  twitter: { charLimit: 280 },
  linkedin: { charLimit: 3000 },
  instagram: { charLimit: 2200 },
};

export function getCharCountStatus(
  length: number,
  limit: number
): "ok" | "warning" | "over" {
  const ratio = length / limit;
  if (ratio > 1) return "over";
  if (ratio > 0.9) return "warning";
  return "ok";
}
