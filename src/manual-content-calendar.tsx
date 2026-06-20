import { CalendarDays, FileText } from "lucide-react";
import { useMemo, useState } from "react";

import { Panel, StatusPill } from "./components";
import type { ContentItem } from "./types";

interface ManualContentCalendarProps {
  items: ContentItem[];
  onEdit: (item: ContentItem) => void;
}

export function ManualContentCalendar({ items, onEdit }: ManualContentCalendarProps) {
  const scheduled = useMemo(
    () => items.filter((item) => item.scheduledFor && !Number.isNaN(new Date(item.scheduledFor).getTime())),
    [items],
  );
  const initialDate = scheduled[0]?.scheduledFor ? new Date(scheduled[0].scheduledFor) : new Date();
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(initialDate));
  const [selectedDate, setSelectedDate] = useState(() => dateKey(initialDate));
  const eventsByDate = useMemo(() => groupByDate(scheduled), [scheduled]);
  const selectedItems = eventsByDate.get(selectedDate) ?? [];

  return (
    <>
      <div className="calendar-toolbar">
        <button onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}>Previous</button>
        <strong>{formatMonth(visibleMonth)}</strong>
        <button onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}>Next</button>
      </div>
      <div className="calendar-layout">
        <Panel title={formatMonth(visibleMonth)} className="calendar-panel">
          <CalendarMonth
            eventsByDate={eventsByDate}
            selectedDate={selectedDate}
            visibleMonth={visibleMonth}
            onSelect={setSelectedDate}
          />
        </Panel>
        <Panel title={formatFullDate(selectedDate)} className="day-panel">
          <div className="day-details">
            <h3>{selectedItems.length} Items Scheduled</h3>
            {selectedItems.length ? selectedItems.map((item) => (
              <button className="calendar-content-item" key={item.id ?? item.title} onClick={() => onEdit(item)}>
                <span className="day-item-main">
                  <FileText />
                  <strong>{item.title}</strong>
                  <small>{item.channel} · {item.type}</small>
                  <p>{item.copy || item.summary}</p>
                </span>
                <span className="day-item-meta">
                  <time>{formatTime(item.scheduledFor)}</time>
                  <StatusPill text={item.status ?? "Scheduled"} />
                </span>
              </button>
            )) : (
              <div className="calendar-empty"><CalendarDays /><p>No content scheduled for this date.</p></div>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}

function CalendarMonth({
  eventsByDate,
  selectedDate,
  visibleMonth,
  onSelect,
}: {
  eventsByDate: Map<string, ContentItem[]>;
  selectedDate: string;
  visibleMonth: Date;
  onSelect: (value: string) => void;
}) {
  const days = calendarDays(visibleMonth);

  return (
    <div className="calendar-grid">
      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <b key={day}>{day}</b>)}
      {days.map((date) => {
        const key = dateKey(date);
        const events = eventsByDate.get(key) ?? [];
        const muted = date.getMonth() !== visibleMonth.getMonth();
        return (
          <button
            aria-label={`Select ${formatFullDate(key)}`}
            className={`${key === selectedDate ? "selected" : ""} ${muted ? "muted" : ""}`}
            key={key}
            onClick={() => onSelect(key)}
          >
            <span>{date.getDate()}</span>
            {events.slice(0, 2).map((item) => <em key={item.id ?? item.title}>{item.title}<small>{formatTime(item.scheduledFor)}</small></em>)}
            {events.length > 2 && <small>+{events.length - 2} more</small>}
          </button>
        );
      })}
    </div>
  );
}

function groupByDate(items: ContentItem[]) {
  const groups = new Map<string, ContentItem[]>();
  for (const item of items) {
    const key = dateKey(new Date(item.scheduledFor as string));
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
}

function calendarDays(month: Date) {
  const first = startOfMonth(month);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function dateKey(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(date);
}

function formatFullDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date);
}

function formatTime(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
