import { Edit3, ExternalLink, Trash2 } from "lucide-react";
import { useState } from "react";
import { Panel, StatusPill } from "./components";
import { ContentOperatingCard } from "./content-operating-card";
import type { Brand, CampaignRow, Channel, ContentItem } from "./types";

export function ChannelsPage({ brands, channels, campaigns, items, onEditChannel, onDeleteChannel, onEditContent, onNextContent }: {
  brands: Brand[];
  channels: Channel[];
  campaigns: CampaignRow[];
  items: ContentItem[];
  onEditChannel: (channel: Channel) => void;
  onDeleteChannel: (channel: Channel) => void;
  onEditContent: (item: ContentItem) => void;
  onNextContent: (item: ContentItem) => void;
}) {
  const [queueStatus, setQueueStatus] = useState("Scheduled");
  const queue = items.filter((item) => item.status === queueStatus);
  return (
    <>
      <div className="channel-groups">
        {brands.map((brand) => {
          const brandChannels = channels.filter((channel) => channel.brandId === brand.id);
          return <Panel key={brand.id ?? brand.name} title={brand.name}>
            {brandChannels.length ? <div className="channel-card-grid">{brandChannels.map((channel) => (
              <article className="channel-card" key={channel.id ?? channel.pageName}>
                <header><span className="platform-mark">{channel.platform.slice(0, 2).toUpperCase()}</span><span><strong>{channel.pageName}</strong><small>{channel.platform} · {channel.handle || "Chưa có handle"}</small></span><StatusPill text={channel.connectionStatus || "Chưa kết nối"} /></header>
                <p>{channel.postingRules || "Chưa có quy tắc đăng."}</p>
                <dl><div><dt>Format</dt><dd>{channel.defaultFormat || "Chưa đặt"}</dd></div><div><dt>Giờ đăng</dt><dd>{channel.bestPostingTimeNotes || "Chưa có dữ liệu"}</dd></div></dl>
                <footer>
                  {channel.url && <a href={channel.url} target="_blank" rel="noreferrer"><ExternalLink />Mở kênh</a>}
                  <button onClick={() => onEditChannel(channel)}><Edit3 />Sửa</button>
                  <button className="danger" onClick={() => onDeleteChannel(channel)}><Trash2 /></button>
                </footer>
              </article>
            ))}</div> : <p className="empty-copy">Brand này chưa có kênh đăng.</p>}
          </Panel>;
        })}
      </div>
      <Panel title="Hàng đợi đăng thủ công">
        <div className="status-tabs" role="tablist" aria-label="Trạng thái hàng đợi">
          {["Scheduled", "Ready", "Failed", "Published"].map((status) => <button role="tab" aria-selected={queueStatus === status} className={queueStatus === status ? "active" : ""} key={status} onClick={() => setQueueStatus(status)}>{status}<span>{items.filter((item) => item.status === status).length}</span></button>)}
        </div>
        {queue.length ? <div className="content-list">{queue.map((item) => <ContentOperatingCard key={item.id ?? item.title} item={item} brands={brands} channels={channels} campaigns={campaigns} onEdit={onEditContent} onNext={onNextContent} />)}</div> : <div className="empty-state"><strong>Không có nội dung {queueStatus}</strong><p>Hàng đợi này sẽ tự cập nhật từ thư viện Nội dung.</p></div>}
      </Panel>
    </>
  );
}
