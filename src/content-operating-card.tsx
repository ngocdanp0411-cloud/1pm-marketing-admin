import { CalendarClock, Edit3, ExternalLink, Image as ImageIcon } from "lucide-react";
import { StatusPill } from "./components";
import { brandName, campaignName, channelName, formatDateTime } from "./marketing-helpers";
import type { Brand, CampaignRow, Channel, ContentItem } from "./types";

interface Props {
  item: ContentItem;
  brands: Brand[];
  channels: Channel[];
  campaigns: CampaignRow[];
  onEdit: (item: ContentItem) => void;
  onNext: (item: ContentItem) => void;
  compact?: boolean;
}

export function ContentOperatingCard({ item, brands, channels, campaigns, onEdit, onNext, compact = false }: Props) {
  const canPublishManually = item.status === "Scheduled";
  return (
    <article className={`content-card ${compact ? "compact" : ""}`}>
      <div className="content-thumb">
        {item.mediaUrl ? <img src={item.mediaUrl} alt="" loading="lazy" width="160" height="120" /> : <ImageIcon aria-hidden="true" />}
      </div>
      <div className="content-card-body">
        <div className="content-card-head">
          <div><small>{brandName(item.brandId, brands)}</small><h3>{item.title}</h3></div>
          <StatusPill text={item.status} />
        </div>
        <p className="content-copy">{item.copy || "Chưa có nội dung. Mở bài để bắt đầu viết."}</p>
        <div className="content-meta">
          <span>{channelName(item.channelId, channels)}</span>
          <span>{item.contentType}</span>
          <span>{campaignName(item.campaignId, campaigns)}</span>
          <span><CalendarClock />{formatDateTime(item.scheduledAt ?? item.scheduledFor)}</span>
        </div>
        {item.publishedUrl && <a className="published-link" href={item.publishedUrl} target="_blank" rel="noreferrer"><ExternalLink />Xem bài đã đăng</a>}
        <div className="content-actions">
          <button className="secondary-btn" onClick={() => onEdit(item)}><Edit3 />Chỉnh sửa</button>
          {canPublishManually && <button className="primary-btn" onClick={() => onNext(item)}>Đăng thủ công</button>}
        </div>
      </div>
    </article>
  );
}
