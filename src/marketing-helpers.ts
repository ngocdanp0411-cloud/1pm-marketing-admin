import { nextActionByStatus } from "./data";
import type { Brand, CampaignRow, Channel, ContentItem, ContentStatus } from "./types";

export function brandName(id: string | null | undefined, brands: Brand[]) {
  return brands.find((brand) => brand.id === id)?.name ?? "Chưa chọn Brand";
}

export function channelName(id: string | null | undefined, channels: Channel[]) {
  const channel = channels.find((item) => item.id === id);
  return channel ? `${channel.platform} · ${channel.pageName}` : "Chưa chọn kênh";
}

export function campaignName(id: string | null | undefined, campaigns: CampaignRow[]) {
  return campaigns.find((campaign) => campaign.id === id)?.name ?? "Không có chiến dịch";
}

export function scheduledAt(item: ContentItem) {
  return item.scheduledAt ?? item.scheduledFor ?? null;
}

export function formatDateTime(value?: string | null) {
  if (!value) return "Chưa lên lịch";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function nextAction(item: ContentItem) {
  return nextActionByStatus[item.status] ?? { label: "Chỉnh sửa" };
}

export function nextStatus(item: ContentItem): ContentStatus | undefined {
  return nextAction(item).next;
}

export function splitLines(value?: string) {
  return (value ?? "").split(/\n|,/).map((item) => item.trim()).filter(Boolean);
}

export function todayKey() {
  const now = new Date();
  return localDateKey(now);
}

export function localDateKey(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function contentDateKey(item: ContentItem) {
  const value = scheduledAt(item);
  return value ? String(value).slice(0, 10) : "";
}

