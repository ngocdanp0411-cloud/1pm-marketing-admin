import { Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { ContentOperatingCard } from "./content-operating-card";
import { contentStatuses } from "./data";
import type { Brand, CampaignRow, Channel, ContentItem } from "./types";

interface Props {
  brands: Brand[];
  channels: Channel[];
  campaigns: CampaignRow[];
  items: ContentItem[];
  onEdit: (item: ContentItem) => void;
  onNext: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
}

export function ContentPage(props: Props) {
  const [query, setQuery] = useState("");
  const [brandId, setBrandId] = useState("all");
  const [channelId, setChannelId] = useState("all");
  const [campaignId, setCampaignId] = useState("all");
  const [status, setStatus] = useState("all");
  const filteredChannels = brandId === "all" ? props.channels : props.channels.filter((item) => item.brandId === brandId);
  const filteredCampaigns = brandId === "all" ? props.campaigns : props.campaigns.filter((item) => item.brandId === brandId);
  const items = useMemo(() => props.items.filter((item) => {
    const text = `${item.title} ${item.copy ?? ""} ${item.tags ?? ""}`.toLocaleLowerCase("vi");
    return (!query || text.includes(query.toLocaleLowerCase("vi")))
      && (brandId === "all" || item.brandId === brandId)
      && (channelId === "all" || item.channelId === channelId)
      && (campaignId === "all" || item.campaignId === campaignId)
      && (status === "all" || item.status === status);
  }), [brandId, campaignId, channelId, props.items, query, status]);

  return (
    <>
      <div className="filter-bar">
        <label className="filter-search"><Search /><input name="content-search" autoComplete="off" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tiêu đề, nội dung hoặc tag…" /></label>
        <Filter value={brandId} onChange={(value) => { setBrandId(value); setChannelId("all"); setCampaignId("all"); }} options={[["all", "Tất cả Brand"], ...props.brands.map((item) => [item.id ?? "", item.name])]} />
        <Filter value={channelId} onChange={setChannelId} options={[["all", "Tất cả kênh"], ...filteredChannels.map((item) => [item.id ?? "", `${item.platform} · ${item.pageName}`])]} />
        <Filter value={campaignId} onChange={setCampaignId} options={[["all", "Tất cả chiến dịch"], ...filteredCampaigns.map((item) => [item.id ?? "", item.name])]} />
        <Filter value={status} onChange={setStatus} options={[["all", "Tất cả trạng thái"], ...contentStatuses.map((item) => [item, item])]} />
      </div>
      <div className="result-summary"><strong>{items.length} nội dung</strong><span>Một nguồn dữ liệu từ brief đến published.</span></div>
      {items.length ? <div className="content-list">{items.map((item) => (
        <div className="content-list-item" key={item.id ?? item.title}>
          <ContentOperatingCard {...props} item={item} />
          <button className="delete-inline" aria-label={`Xóa ${item.title}`} onClick={() => props.onDelete(item)}><Trash2 /></button>
        </div>
      ))}</div> : <div className="empty-state"><strong>Không tìm thấy nội dung</strong><p>Thử bỏ bớt bộ lọc hoặc tạo nội dung mới.</p></div>}
    </>
  );
}

function Filter({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[][] }) {
  return <label><span className="sr-only">Bộ lọc</span><select value={value} onChange={(e) => onChange(e.target.value)}>{options.map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>;
}
