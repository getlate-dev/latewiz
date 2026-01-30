"use client";

import { format } from "date-fns/format";
import { toZonedTime, format as formatTz } from "date-fns-tz";
import { useAppStore } from "@/stores";
import { useNextQueueSlot } from "@/hooks";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export type ScheduleType = "now" | "scheduled" | "queue";

interface SchedulePickerProps {
  scheduleType: ScheduleType;
  scheduledDate: Date | undefined;
  scheduledTime: string;
  onScheduleTypeChange: (type: ScheduleType) => void;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
}

export function SchedulePicker({
  scheduleType,
  scheduledDate,
  scheduledTime,
  onScheduleTypeChange,
  onDateChange,
  onTimeChange,
}: SchedulePickerProps) {
  const { timezone } = useAppStore();
  const { data: nextSlotData } = useNextQueueSlot();

  const scheduleOptions = [
    {
      value: "now" as const,
      label: "Publish Now",
      icon: Zap,
      description: "Post immediately",
    },
    {
      value: "scheduled" as const,
      label: "Schedule",
      icon: CalendarIcon,
      description: "Pick a specific date and time",
    },
    {
      value: "queue" as const,
      label: "Add to Queue",
      icon: Clock,
      description: nextSlotData?.nextSlot
        ? `Next slot: ${formatTz(toZonedTime(new Date(nextSlotData.nextSlot), timezone), "MMM d, h:mm a", { timeZone: timezone })}`
        : "Uses your queue schedule",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Schedule type selection */}
      <div className="grid grid-cols-3 gap-2">
        {scheduleOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onScheduleTypeChange(option.value)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors",
              scheduleType === option.value
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-accent"
            )}
          >
            <option.icon className="h-5 w-5" />
            <span className="text-sm font-medium">{option.label}</span>
          </button>
        ))}
      </div>

      {/* Schedule description */}
      <p className="text-sm text-muted-foreground">
        {scheduleOptions.find((o) => o.value === scheduleType)?.description}
      </p>

      {/* Quick select options for scheduled posts */}
      {scheduleType === "scheduled" && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              d.setHours(9, 0, 0, 0);
              onDateChange(d);
              onTimeChange("09:00");
            }}
          >
            Tomorrow 9 AM
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              d.setHours(18, 0, 0, 0);
              onDateChange(d);
              onTimeChange("18:00");
            }}
          >
            Tomorrow 6 PM
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={() => {
              const d = new Date();
              const daysUntilMonday = (8 - d.getDay()) % 7 || 7;
              d.setDate(d.getDate() + daysUntilMonday);
              d.setHours(10, 0, 0, 0);
              onDateChange(d);
              onTimeChange("10:00");
            }}
          >
            Next Monday
          </Button>
        </div>
      )}

      {/* Date/time picker for scheduled posts */}
      {scheduleType === "scheduled" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !scheduledDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={onDateChange}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Time</Label>
            <Input
              type="time"
              value={scheduledTime}
              onChange={(e) => onTimeChange(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Timezone info */}
      {scheduleType === "scheduled" && (
        <p className="text-xs text-muted-foreground">
          Timezone: {timezone}
        </p>
      )}
    </div>
  );
}
