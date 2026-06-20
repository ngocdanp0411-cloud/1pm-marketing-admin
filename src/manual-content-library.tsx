import { CalendarDays, Edit3, FileText, Image, Trash2 } from "lucide-react";

import { Panel, StatusPill } from "./components";
import type { CampaignRow, ContentItem } from "./types";

interface ManualContentLibraryProps {
  items: ContentItem[];
  campaigns: CampaignRow[];
  pendingAction: string;
  onCreate: () => void;
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
  onStatusChange: (item: ContentItem, status: string) => void;
}

const statusOptions = ["Ready", "Scheduled", "Published"];

export function ManualContentLibrary({
  items,
  campaigns,
  pendingAction,
  onCreate,
  onEdit,
  onDelete,
  onStatusChange,
}: ManualContentLibraryProps) {
  const manualItems = items.filter((item) => item.source === "manual");

  return (
    <Panel title="Manual Content Library" action={`${manualItems.length} items`}>
      <div className="manual-library-head">
        <p>Paste copy from Claude, attach an asset URL, then manage approval and scheduling here.</p>
        <button className="primary-btn" onClick={onCreate}><FileText /> Tạo bài thủ công</button>
      </div>

      {manualItems.length ? (
        <div className="manual-content-grid">
          {manualItems.map((item) => (
            <article className="manual-content-card" key={item.id ?? item.title}>
              <AssetPreview item={item} />
              <div className="manual-content-body">
                <div className="manual-content-title">
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.channel} · {item.type}</small>
                  </div>
                  <StatusPill text={item.status ?? "Draft"} />
                </div>
                <p>{item.copy || item.summary || "No copy added yet."}</p>
                <div className="manual-content-meta">
                  <span><CalendarDays /> {formatSchedule(item.scheduledFor)}</span>
                  <span>{campaignName(item.campaignId, campaigns)}</span>
                </div>
                {item.tags && <div className="manual-tags">{splitTags(item.tags).map((tag) => <span key={tag}>{tag}</span>)}</div>}
                <div className="manual-card-actions">
                  <button onClick={() => onEdit(item)}><Edit3 /> Edit</button>
                  <select
                    aria-label={`Update status for ${item.title}`}
                    disabled={!item.id || pendingAction === `content:${item.id}`}
                    value={statusOptions.includes(item.status ?? "") ? item.status : ""}
                    onChange={(event) => onStatusChange(item, event.target.value)}
                  >
                    <option value="" disabled>Mark as...</option>
                    {statusOptions.map((status) => <option key={status}>{status}</option>)}
                  </select>
                  <button className="danger" onClick={() => onDelete(item)}><Trash2 /> Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="manual-empty">
          <FileText />
          <strong>No manual content yet</strong>
          <p>Create the first item without calling any AI API.</p>
          <button className="primary-btn" onClick={onCreate}>Tạo bài thủ công</button>
        </div>
      )}
    </Panel>
  );
}

function AssetPreview({ item }: { item: ContentItem }) {
  if (item.mediaUrl?.startsWith("http")) {
    return <div className="manual-content-thumb"><img src={item.mediaUrl} alt="" loading="lazy" /></div>;
  }

  return <div className="manual-content-thumb placeholder"><Image /><span>{item.type}</span></div>;
}

function campaignName(campaignId: string | null | undefined, campaigns: CampaignRow[]) {
  if (!campaignId) return "No campaign";
  return campaigns.find((campaign) => (campaign.id ?? campaign.name) === campaignId)?.name ?? "Campaign";
}

function formatSchedule(value?: string | null) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function splitTags(tags: string) {
  return tags.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 5);
}
