import { Pressable, ScrollView, Text, View } from "react-native";
import { localeTag, useI18n } from "@/i18n";
import {
  addDays,
  hourLabel,
  occurrencesOnDay,
  sameDay,
  startOfMonth,
  visibleRange,
  weekdayLabel,
  type CalendarOccurrence,
} from "@/lib/calendar";
import { projectTone } from "@/lib/theme";
import { cn } from "@/lib/utils";

const MAX_CHIPS = 3;

export function CalendarMonth({
  cursor,
  occurrences,
  onDayClick,
  onSlotClick,
  onEventClick,
  onMoreClick,
}: {
  cursor: Date;
  occurrences: CalendarOccurrence[];
  onDayClick: (day: Date) => void;
  onSlotClick: (day: Date) => void;
  onEventClick: (item: CalendarOccurrence) => void;
  onMoreClick: (day: Date, items: CalendarOccurrence[]) => void;
}) {
  const { t, locale } = useI18n();
  const tag = localeTag(locale);
  const { from, to } = visibleRange("month", cursor);
  const days: Date[] = [];
  for (let day = new Date(from); day < to; day = addDays(day, 1)) days.push(new Date(day));
  const headers = days.slice(0, 7);
  const today = new Date();
  const month = startOfMonth(cursor);

  return (
    <View className="overflow-hidden rounded-xl border border-border bg-card">
      <View className="flex-row border-b border-border">
        {headers.map((day) => (
          <Text key={day.toISOString()} className="flex-1 py-2 text-center text-[10px] uppercase text-muted-foreground">
            {weekdayLabel(day, tag, "short")}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {days.map((day) => {
          const inMonth = day.getMonth() === month.getMonth();
          const isToday = sameDay(day, today);
          const items = occurrencesOnDay(occurrences, day).sort(
            (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
          );
          const shown = items.slice(0, MAX_CHIPS);
          const extra = items.length - shown.length;
          return (
            <Pressable
              key={day.toISOString()}
              className={cn("min-h-[88px] w-[14.28%] border-b border-r border-border p-1", !inMonth && "bg-muted/40")}
              onPress={() => onSlotClick(day)}
            >
              <Pressable onPress={() => onDayClick(day)}>
                <Text
                  className={cn(
                    "mb-1 text-right text-xs",
                    isToday && "font-bold text-primary",
                    !inMonth && "text-muted-foreground",
                  )}
                >
                  {day.getDate()}
                </Text>
              </Pressable>
              {shown.map((item) => {
                const tone = projectTone(item.task.projectId);
                return (
                  <Pressable
                    key={`${item.task.id}-${item.startsAt.toISOString()}`}
                    className="mb-0.5 rounded px-0.5"
                    style={{ backgroundColor: tone.bg, borderColor: tone.border, borderWidth: 1 }}
                    onPress={() => onEventClick(item)}
                  >
                    <Text numberOfLines={1} className="text-[10px] text-foreground">
                      {item.task.title}
                    </Text>
                  </Pressable>
                );
              })}
              {extra > 0 ? (
                <Pressable onPress={() => onMoreClick(day, items)}>
                  <Text className="text-[10px] text-muted-foreground">{t("calendar.more", { count: extra })}</Text>
                </Pressable>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function CalendarTimeGrid({
  days,
  occurrences,
  onSlotClick,
  onEventClick,
}: {
  days: Date[];
  occurrences: CalendarOccurrence[];
  onSlotClick: (day: Date, hour: number) => void;
  onEventClick: (item: CalendarOccurrence) => void;
}) {
  const { locale } = useI18n();
  const tag = localeTag(locale);
  const hours = Array.from({ length: 24 }, (_, hour) => hour);

  return (
    <ScrollView className="rounded-xl border border-border bg-card">
      <View className="flex-row border-b border-border">
        <View className="w-12" />
        {days.map((day) => (
          <View key={day.toISOString()} className="flex-1 items-center py-2">
            <Text className="text-[10px] uppercase text-muted-foreground">{weekdayLabel(day, tag, "short")}</Text>
            <Text className="font-serif text-lg text-foreground">{day.getDate()}</Text>
          </View>
        ))}
      </View>
      {hours.map((hour) => (
        <View key={hour} className="flex-row border-b border-border">
          <Text className="w-12 py-2 text-right text-[10px] text-muted-foreground">{hourLabel(hour, tag)}</Text>
          {days.map((day) => {
            const items = occurrencesOnDay(occurrences, day).filter((item) => item.startsAt.getHours() === hour);
            return (
              <Pressable
                key={day.toISOString()}
                className="min-h-[48px] flex-1 border-l border-border p-0.5"
                onPress={() => onSlotClick(day, hour)}
              >
                {items.map((item) => {
                  const tone = projectTone(item.task.projectId);
                  return (
                    <Pressable
                      key={item.task.id}
                      className="mb-0.5 rounded px-1"
                      style={{ backgroundColor: tone.bg }}
                      onPress={() => onEventClick(item)}
                    >
                      <Text numberOfLines={1} className="text-[10px] text-foreground">
                        {item.task.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </Pressable>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}
