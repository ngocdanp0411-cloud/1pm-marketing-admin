import { AlertTriangle, CalendarCheck, CircleCheck, FilePenLine, RotateCcw } from "lucide-react";
import { useState } from "react";
import { MetricCard, Panel } from "./components";
import { ContentOperatingCard } from "./content-operating-card";
import { contentDateKey, todayKey } from "./marketing-helpers";
import type { Brand, CampaignRow, Channel, ContentItem, Metric } from "./types";

interface Props {
  brands: Brand[];
  channels: Channel[];
  campaigns: CampaignRow[];
  items: ContentItem[];
  onEdit: (item: ContentItem) => void;
  onNext: (item: ContentItem) => void;
}

export function TodayPage({ brands, channels, campaigns, items, onEdit, onNext }: Props) {
  const [selectedBrand, setSelectedBrand] = useState("all");
  const filtered = selectedBrand === "all" ? items : items.filter((item) => item.brandId === selectedBrand);
  const today = todayKey();
  const sections = [
    { title: "Cần hoàn thiện", items: filtered.filter((item) => ["Brief", "Draft"].includes(item.status)) },
    { title: "Đang review", items: filtered.filter((item) => item.status === "Review") },
    { title: "Sẵn sàng lên lịch", items: filtered.filter((item) => item.status === "Ready") },
    { title: "Đến giờ đăng", items: filtered.filter((item) => item.status === "Scheduled" && contentDateKey(item) === today) },
    { title: "Đã trễ", items: filtered.filter((item) => item.status === "Scheduled" && contentDateKey(item) && contentDateKey(item) < today) },
    { title: "Đăng lỗi", items: filtered.filter((item) => item.status === "Failed") },
  ];
  const metrics: Metric[] = [
    { label: "Bản đang làm", value: String(filtered.filter((item) => ["Brief", "Draft", "Review"].includes(item.status)).length), context: "Brief, Draft và Review", icon: FilePenLine },
    { label: "Sẵn sàng", value: String(filtered.filter((item) => item.status === "Ready").length), context: "Chờ lên lịch", icon: CircleCheck, tone: "good" },
    { label: "Đăng hôm nay", value: String(filtered.filter((item) => item.status === "Scheduled" && contentDateKey(item) === today).length), context: "Theo lịch hiện tại", icon: CalendarCheck },
    { label: "Đã trễ", value: String(filtered.filter((item) => item.status === "Scheduled" && contentDateKey(item) < today).length), context: "Cần xử lý ngay", icon: AlertTriangle, tone: "warn" },
    { label: "Đăng lỗi", value: String(filtered.filter((item) => item.status === "Failed").length), context: "Cần xử lý lại", icon: RotateCcw, tone: "bad" },
  ];

  return (
    <>
      <div className="page-toolbar">
        <label><span>Brand</span><select value={selectedBrand} onChange={(event) => setSelectedBrand(event.target.value)}><option value="all">Tất cả Brand</option>{brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label>
      </div>
      <div className="metric-grid">{metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div>
      <div className="today-grid">
        {sections.map((section) => (
          <Panel key={section.title} title={section.title} className={!section.items.length ? "quiet-panel" : ""}>
            {section.items.length ? <div className="compact-content-list">{section.items.slice(0, 4).map((item) => <ContentOperatingCard key={item.id ?? item.title} item={item} brands={brands} channels={channels} campaigns={campaigns} onEdit={onEdit} onNext={onNext} compact />)}</div> : <p className="empty-copy">Không có việc trong nhóm này.</p>}
          </Panel>
        ))}
      </div>
    </>
  );
}
