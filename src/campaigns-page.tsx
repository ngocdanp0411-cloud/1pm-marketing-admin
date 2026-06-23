import { CalendarRange, Edit3, Trash2 } from "lucide-react";
import { useState } from "react";
import { Panel, StatusPill } from "./components";
import { ContentOperatingCard } from "./content-operating-card";
import { brandName } from "./marketing-helpers";
import type { Brand, CampaignRow, Channel, ContentItem } from "./types";

export function CampaignsPage({ brands, channels, campaigns, items, onEditCampaign, onDeleteCampaign, onEditContent, onNextContent }: {
  brands: Brand[];
  channels: Channel[];
  campaigns: CampaignRow[];
  items: ContentItem[];
  onEditCampaign: (campaign: CampaignRow) => void;
  onDeleteCampaign: (campaign: CampaignRow) => void;
  onEditContent: (item: ContentItem) => void;
  onNextContent: (item: ContentItem) => void;
}) {
  const [selectedId, setSelectedId] = useState(campaigns[0]?.id ?? "");
  const selected = campaigns.find((campaign) => campaign.id === selectedId) ?? campaigns[0];
  const related = selected ? items.filter((item) => item.campaignId === selected.id) : [];
  return (
    <div className="master-detail">
      <Panel title="Danh sách chiến dịch">
        <div className="entity-list">
          {campaigns.map((campaign) => {
            const count = items.filter((item) => item.campaignId === campaign.id).length;
            return <button className={campaign.id === selected?.id ? "selected" : ""} key={campaign.id ?? campaign.name} onClick={() => setSelectedId(campaign.id ?? "")}>
              <span><small>{brandName(campaign.brandId, brands)}</small><strong>{campaign.name}</strong><em>{campaign.objective || "Chưa có mục tiêu"}</em></span>
              <span><StatusPill text={campaign.status} /><small>{count} nội dung</small></span>
            </button>;
          })}
        </div>
      </Panel>
      {selected ? <div className="detail-column">
        <Panel title={selected.name}>
          <div className="entity-detail-head">
            <div><StatusPill text={selected.status} /><p>{brandName(selected.brandId, brands)}</p></div>
            <div className="inline-actions"><button onClick={() => onEditCampaign(selected)}><Edit3 />Sửa</button><button className="danger" onClick={() => onDeleteCampaign(selected)}><Trash2 />Xóa</button></div>
          </div>
          <dl className="detail-grid">
            <div><dt>Mục tiêu</dt><dd>{selected.objective || "Chưa cập nhật"}</dd></div>
            <div><dt>Thông điệp chính</dt><dd>{selected.keyMessage || "Chưa cập nhật"}</dd></div>
            <div><dt>Thời gian</dt><dd><CalendarRange />{formatRange(selected.startDate, selected.endDate)}</dd></div>
            <div><dt>Ghi chú</dt><dd>{selected.notes || "Không có ghi chú"}</dd></div>
          </dl>
          <Progress items={related} />
        </Panel>
        <Panel title={`Nội dung liên quan · ${related.length}`}>
          {related.length ? <div className="compact-content-list">{related.map((item) => <ContentOperatingCard key={item.id ?? item.title} item={item} brands={brands} channels={channels} campaigns={campaigns} onEdit={onEditContent} onNext={onNextContent} compact />)}</div> : <p className="empty-copy">Chiến dịch chưa có nội dung.</p>}
        </Panel>
      </div> : <div className="empty-state"><strong>Chưa có chiến dịch</strong><p>Tạo chiến dịch đầu tiên để nhóm nội dung theo mục tiêu.</p></div>}
    </div>
  );
}

function Progress({ items }: { items: ContentItem[] }) {
  const groups = ["Brief", "Draft", "Review", "Ready", "Scheduled", "Published", "Failed"];
  return <div className="status-progress">{groups.map((status) => <div key={status}><span>{status}</span><strong>{items.filter((item) => item.status === status).length}</strong></div>)}</div>;
}
function formatRange(start?: string | null, end?: string | null) { return start || end ? `${start || "…"} → ${end || "…"}` : "Chưa đặt thời gian"; }
