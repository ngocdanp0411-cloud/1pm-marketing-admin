import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel, StatusPill } from "./components";
import { brandName, channelName, formatDateTime, localDateKey, scheduledAt } from "./marketing-helpers";
import type { Brand, Channel, ContentItem } from "./types";

export function CalendarPage({ items, brands, channels, onEdit }: {
  items: ContentItem[];
  brands: Brand[];
  channels: Channel[];
  onEdit: (item: ContentItem) => void;
}) {
  const scheduled = useMemo(() => items.filter((item) => scheduledAt(item)), [items]);
  const initial = scheduled[0] ? new Date(scheduledAt(scheduled[0]) as string) : new Date();
  const [month, setMonth] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [selected, setSelected] = useState(() => localDateKey(initial));
  const byDate = useMemo(() => groupByDate(scheduled), [scheduled]);
  const selectedItems = byDate.get(selected) ?? [];
  const monthItems = scheduled.filter((item) => {
    const date = new Date(scheduledAt(item) as string);
    return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
  }).sort((a, b) => String(scheduledAt(a)).localeCompare(String(scheduledAt(b))));

  return (
    <div className="calendar-page-layout">
      <Panel title="Lịch tháng">
        <div className="calendar-toolbar">
          <button aria-label="Tháng trước" onClick={() => setMonth(changeMonth(month, -1))}><ChevronLeft /></button>
          <strong>{new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric" }).format(month)}</strong>
          <button aria-label="Tháng sau" onClick={() => setMonth(changeMonth(month, 1))}><ChevronRight /></button>
        </div>
        <div className="simple-calendar">
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => <b key={day}>{day}</b>)}
          {calendarDays(month).map((date) => {
            const key = localDateKey(date);
            const events = byDate.get(key) ?? [];
            return <button key={key} className={`${date.getMonth() !== month.getMonth() ? "muted" : ""} ${key === selected ? "selected" : ""}`} onClick={() => setSelected(key)}>
              <span>{date.getDate()}</span>
              {events.slice(0, 2).map((item) => <i key={item.id ?? item.title}>{item.title}</i>)}
              {events.length > 2 && <small>+{events.length - 2}</small>}
            </button>;
          })}
        </div>
      </Panel>
      <Panel title={formatSelectedDate(selected)}>
        {selectedItems.length ? <div className="calendar-detail-list">{selectedItems.map((item) => (
          <button key={item.id ?? item.title} onClick={() => onEdit(item)}>
            <span><small>{brandName(item.brandId, brands)} · {channelName(item.channelId, channels)}</small><strong>{item.title}</strong><time>{formatDateTime(scheduledAt(item))}</time></span>
            <StatusPill text={item.status} />
          </button>
        ))}</div> : <p className="empty-copy">Không có nội dung được lên lịch ngày này.</p>}
      </Panel>
      <Panel title="Danh sách trong tháng" className="calendar-agenda">
        {monthItems.length ? monthItems.map((item) => <button key={item.id ?? item.title} onClick={() => onEdit(item)}>
          <time>{new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(new Date(scheduledAt(item) as string))}</time>
          <span><strong>{item.title}</strong><small>{brandName(item.brandId, brands)} · {channelName(item.channelId, channels)}</small></span>
          <StatusPill text={item.status} />
        </button>) : <p className="empty-copy">Tháng này chưa có nội dung được lên lịch.</p>}
      </Panel>
    </div>
  );
}

function groupByDate(items: ContentItem[]) {
  const map = new Map<string, ContentItem[]>();
  for (const item of items) {
    const key = localDateKey(new Date(scheduledAt(item) as string));
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return map;
}
function changeMonth(date: Date, amount: number) { return new Date(date.getFullYear(), date.getMonth() + amount, 1); }
function calendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first); start.setDate(first.getDate() - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date; });
}
function formatSelectedDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${value}T12:00:00`));
}

