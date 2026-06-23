import { CalendarDays, Flag, Layers3, Radio, Sparkles, Tags } from "lucide-react";
import type { ContentStatus, NavItem } from "./types";

export const navItems: NavItem[] = [
  { key: "today", label: "Hôm nay", icon: Sparkles },
  { key: "content", label: "Nội dung", icon: Layers3 },
  { key: "calendar", label: "Lịch", icon: CalendarDays },
  { key: "campaigns", label: "Chiến dịch", icon: Flag },
  { key: "brands", label: "Brand", icon: Tags },
  { key: "channels", label: "Kênh đăng", icon: Radio },
];

export const pageMeta = {
  today: ["Hôm nay", "Việc marketing cần anh xử lý tiếp theo."],
  content: ["Nội dung", "Một thư viện cho toàn bộ vòng đời nội dung."],
  calendar: ["Lịch", "Những nội dung đã có ngày giờ đăng."],
  campaigns: ["Chiến dịch", "Nhóm nội dung theo mục tiêu và thông điệp."],
  brands: ["Brand", "Bối cảnh giúp mọi nội dung giữ đúng định hướng."],
  channels: ["Kênh đăng", "Page, tài khoản và hàng đợi đăng thủ công."],
  settings: ["Cài đặt", "Workspace, tài khoản và giao diện cơ bản."],
} as const;

export const contentStatuses: ContentStatus[] = [
  "Brief",
  "Draft",
  "Review",
  "Ready",
  "Scheduled",
  "Published",
  "Failed",
];

export const contentTypeOptions = ["Caption", "Carousel", "Reels", "Email", "Blog post", "Other"];
export const platformOptions = ["Facebook", "Instagram", "TikTok", "Blog", "Email", "LinkedIn", "YouTube", "Other"];

export const nextActionByStatus: Record<string, { label: string; next?: ContentStatus }> = {
  Brief: { label: "Viết nội dung", next: "Draft" },
  Draft: { label: "Gửi review", next: "Review" },
  Review: { label: "Đánh dấu sẵn sàng", next: "Ready" },
  Ready: { label: "Lên lịch", next: "Scheduled" },
  Scheduled: { label: "Đăng thủ công" },
  Published: { label: "Ghi kết quả" },
  Failed: { label: "Xử lý lại", next: "Ready" },
};
