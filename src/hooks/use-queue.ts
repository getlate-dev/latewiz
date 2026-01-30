import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLate } from "./use-late";
import { useCurrentProfileId } from "./use-profiles";

export const queueKeys = {
  all: ["queue"] as const,
  queues: (profileId: string) => ["queue", "queues", profileId] as const,
  slots: (profileId: string) => ["queue", "slots", profileId] as const,
  preview: (profileId: string, count: number) =>
    ["queue", "preview", profileId, count] as const,
  nextSlot: (profileId: string) => ["queue", "nextSlot", profileId] as const,
};

// SDK-aligned types
export interface QueueSlot {
  dayOfWeek: number; // 0-6, Sunday = 0
  time: string; // "HH:mm" format
}

export interface QueueSchedule {
  _id?: string;
  profileId?: string;
  name?: string;
  timezone?: string;
  slots?: QueueSlot[];
  active?: boolean;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Helper functions for time conversion
export function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

export function parseTime(time: string): { hour: number; minute: number } {
  const [hour, minute] = time.split(":").map(Number);
  return { hour: hour || 0, minute: minute || 0 };
}

/**
 * Hook to fetch all queues for a profile
 */
export function useQueues(profileId?: string) {
  const late = useLate();
  const currentProfileId = useCurrentProfileId();
  const targetProfileId = profileId || currentProfileId;

  return useQuery({
    queryKey: queueKeys.queues(targetProfileId || ""),
    queryFn: async () => {
      if (!late) throw new Error("Not authenticated");
      const { data, error } = await late.queue.listQueueSlots({
        query: { profileId: targetProfileId!, all: "true" },
      });
      if (error) throw error;
      return data as { queues?: QueueSchedule[]; count?: number };
    },
    enabled: !!late && !!targetProfileId,
  });
}

/**
 * Hook to fetch queue slots (single queue / default)
 */
export function useQueueSlots(profileId?: string, queueId?: string) {
  const late = useLate();
  const currentProfileId = useCurrentProfileId();
  const targetProfileId = profileId || currentProfileId;

  return useQuery({
    queryKey: queueKeys.slots(targetProfileId || ""),
    queryFn: async () => {
      if (!late) throw new Error("Not authenticated");
      const { data, error } = await late.queue.listQueueSlots({
        query: { profileId: targetProfileId!, queueId },
      });
      if (error) throw error;
      return data as { exists?: boolean; schedule?: QueueSchedule; nextSlots?: string[] };
    },
    enabled: !!late && !!targetProfileId,
  });
}

/**
 * Hook to preview upcoming queue times
 */
export function useQueuePreview(count = 10, profileId?: string) {
  const late = useLate();
  const currentProfileId = useCurrentProfileId();
  const targetProfileId = profileId || currentProfileId;

  return useQuery({
    queryKey: queueKeys.preview(targetProfileId || "", count),
    queryFn: async () => {
      if (!late) throw new Error("Not authenticated");
      const { data, error } = await late.queue.previewQueue({
        query: { profileId: targetProfileId!, count },
      });
      if (error) throw error;
      return data as { profileId?: string; count?: number; slots?: string[] };
    },
    enabled: !!late && !!targetProfileId,
  });
}

/**
 * Hook to get the next available queue slot
 */
export function useNextQueueSlot(profileId?: string, queueId?: string) {
  const late = useLate();
  const currentProfileId = useCurrentProfileId();
  const targetProfileId = profileId || currentProfileId;

  return useQuery({
    queryKey: queueKeys.nextSlot(targetProfileId || ""),
    queryFn: async () => {
      if (!late) throw new Error("Not authenticated");
      const { data, error } = await late.queue.getNextQueueSlot({
        query: { profileId: targetProfileId!, queueId },
      });
      if (error) throw error;
      return data as {
        profileId?: string;
        nextSlot?: string;
        timezone?: string;
        queueId?: string;
        queueName?: string;
      };
    },
    enabled: !!late && !!targetProfileId,
  });
}

/**
 * Hook to create a new queue
 */
export function useCreateQueue() {
  const late = useLate();
  const queryClient = useQueryClient();
  const currentProfileId = useCurrentProfileId();

  return useMutation({
    mutationFn: async ({
      name,
      timezone,
      slots,
      active = true,
      profileId,
    }: {
      name: string;
      timezone: string;
      slots: QueueSlot[];
      active?: boolean;
      profileId?: string;
    }) => {
      if (!late) throw new Error("Not authenticated");
      const targetProfileId = profileId || currentProfileId;
      if (!targetProfileId) throw new Error("No profile selected");

      const { data, error } = await late.queue.createQueueSlot({
        body: {
          profileId: targetProfileId,
          name,
          timezone,
          slots,
          active,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
    },
  });
}

/**
 * Hook to update queue slots
 */
export function useUpdateQueueSlots() {
  const late = useLate();
  const queryClient = useQueryClient();
  const currentProfileId = useCurrentProfileId();

  return useMutation({
    mutationFn: async ({
      slots,
      profileId,
      queueId,
      name,
      timezone,
      active,
      setAsDefault,
      reshuffleExisting,
    }: {
      slots: QueueSlot[];
      profileId?: string;
      queueId?: string;
      name?: string;
      timezone?: string;
      active?: boolean;
      setAsDefault?: boolean;
      reshuffleExisting?: boolean;
    }) => {
      if (!late) throw new Error("Not authenticated");
      const targetProfileId = profileId || currentProfileId;
      if (!targetProfileId) throw new Error("No profile selected");

      const { data, error } = await late.queue.updateQueueSlot({
        body: {
          profileId: targetProfileId,
          queueId,
          name,
          timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          slots,
          active,
          setAsDefault,
          reshuffleExisting,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
    },
  });
}

/**
 * Hook to update a queue (name, active status, etc.)
 */
export function useUpdateQueue() {
  const late = useLate();
  const queryClient = useQueryClient();
  const currentProfileId = useCurrentProfileId();

  return useMutation({
    mutationFn: async ({
      queueId,
      name,
      timezone,
      slots,
      active,
      setAsDefault,
      profileId,
    }: {
      queueId: string;
      name?: string;
      timezone?: string;
      slots?: QueueSlot[];
      active?: boolean;
      setAsDefault?: boolean;
      profileId?: string;
    }) => {
      if (!late) throw new Error("Not authenticated");
      const targetProfileId = profileId || currentProfileId;
      if (!targetProfileId) throw new Error("No profile selected");

      // We need to get the current queue to preserve existing values
      const { data: current } = await late.queue.listQueueSlots({
        query: { profileId: targetProfileId, queueId },
      });
      const currentSchedule = (current as { schedule?: QueueSchedule })?.schedule;

      const { data, error } = await late.queue.updateQueueSlot({
        body: {
          profileId: targetProfileId,
          queueId,
          name: name ?? currentSchedule?.name,
          timezone: timezone ?? currentSchedule?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
          slots: slots ?? currentSchedule?.slots ?? [],
          active,
          setAsDefault,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
    },
  });
}

/**
 * Hook to delete a queue
 */
export function useDeleteQueue() {
  const late = useLate();
  const queryClient = useQueryClient();
  const currentProfileId = useCurrentProfileId();

  return useMutation({
    mutationFn: async ({
      queueId,
      profileId,
    }: {
      queueId: string;
      profileId?: string;
    }) => {
      if (!late) throw new Error("Not authenticated");
      const targetProfileId = profileId || currentProfileId;
      if (!targetProfileId) throw new Error("No profile selected");

      const { data, error } = await late.queue.deleteQueueSlot({
        query: { profileId: targetProfileId, queueId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queueKeys.all });
    },
  });
}

/**
 * Hook to toggle queue active status
 */
export function useToggleQueueActive() {
  const updateQueue = useUpdateQueue();

  return useMutation({
    mutationFn: async ({
      queueId,
      active,
      profileId,
    }: {
      queueId: string;
      active: boolean;
      profileId?: string;
    }) => {
      return updateQueue.mutateAsync({ queueId, active, profileId });
    },
  });
}

/**
 * Hook to set a queue as default
 */
export function useSetDefaultQueue() {
  const updateQueue = useUpdateQueue();

  return useMutation({
    mutationFn: async ({
      queueId,
      profileId,
    }: {
      queueId: string;
      profileId?: string;
    }) => {
      return updateQueue.mutateAsync({ queueId, setAsDefault: true, profileId });
    },
  });
}

/**
 * Days of the week for display
 */
export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DAYS_OF_WEEK_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

/**
 * Format a queue slot for display
 */
export function formatQueueSlot(slot: QueueSlot): string {
  const day = DAYS_OF_WEEK[slot.dayOfWeek];
  return `${day} at ${slot.time}`;
}

/**
 * Common timezones for quick selection
 */
export const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Australia/Sydney",
] as const;

/**
 * Get user's current timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
