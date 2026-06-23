import { Edit3, Palette, Radio, ScrollText, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Panel } from "./components";
import { splitLines } from "./marketing-helpers";
import type { Brand, CampaignRow, Channel, ContentItem } from "./types";

export function BrandsPage({ brands, channels, campaigns, items, onEdit, onDelete }: {
  brands: Brand[];
  channels: Channel[];
  campaigns: CampaignRow[];
  items: ContentItem[];
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
}) {
  const [selectedId, setSelectedId] = useState(brands[0]?.id ?? "");
  const selected = brands.find((brand) => brand.id === selectedId) ?? brands[0];
  return (
    <div className="brand-page-layout">
      <Panel title="Danh sách Brand">
        <div className="brand-card-grid">
          {brands.map((brand) => (
            <button className={`brand-card ${brand.id === selected?.id ? "selected" : ""}`} key={brand.id ?? brand.name} onClick={() => setSelectedId(brand.id ?? "")}>
              <span className="brand-monogram">{brand.name.slice(0, 2).toUpperCase()}</span>
              <span><strong>{brand.name}</strong><small>{brand.shortDescription || "Chưa có mô tả"}</small></span>
              <dl><div><dt>Kênh</dt><dd>{channels.filter((item) => item.brandId === brand.id).length}</dd></div><div><dt>Nội dung</dt><dd>{items.filter((item) => item.brandId === brand.id).length}</dd></div><div><dt>Chiến dịch</dt><dd>{campaigns.filter((item) => item.brandId === brand.id && item.status === "Active").length}</dd></div></dl>
            </button>
          ))}
        </div>
      </Panel>
      {selected && <div className="brand-detail">
        <Panel title={selected.name}>
          <div className="entity-detail-head">
            <p>{selected.positioning || selected.shortDescription}</p>
            <div className="inline-actions"><button onClick={() => onEdit(selected)}><Edit3 />Sửa Brand</button><button className="danger" onClick={() => onDelete(selected)}><Trash2 />Xóa</button></div>
          </div>
          <div className="brand-section-grid">
            <BrandSection icon={<ScrollText />} title="Hồ sơ" rows={[["Mô tả", selected.shortDescription], ["Định vị", selected.positioning], ["Khách hàng", selected.targetAudience]]} />
            <BrandSection icon={<Radio />} title="Tone & Mood" rows={[["Brand Voice", selected.brandVoice], ["Tone", selected.toneMood], ["Nên làm", selected.doList], ["Không nên", selected.dontList]]} />
            <BrandSection icon={<Palette />} title="Visual" rows={[["Phong cách", selected.visualStyleNotes], ["Màu", selected.colors], ["Asset", selected.assetNotes]]} />
            <BrandSection title="CTA & Hashtag" rows={[["CTA", selected.defaultCTA], ["Hashtag", selected.defaultHashtags]]} />
            <ChipSection title="Content Pillars" value={selected.contentPillars} />
            <ChipSection title="Checklist" value={selected.checklistTemplate} />
            <BrandSection title="Prompt Style" rows={[["Ghi chú", selected.promptStyleNotes]]} />
            <BrandSection title="Kênh / Page" rows={channels.filter((item) => item.brandId === selected.id).map((item) => [item.platform, `${item.pageName} · ${item.connectionStatus}`])} />
          </div>
        </Panel>
      </div>}
    </div>
  );
}

function BrandSection({ icon, title, rows }: { icon?: ReactNode; title: string; rows: (string | undefined)[][] }) {
  return <section className="brand-section"><header>{icon}<h3>{title}</h3></header>{rows.map(([label, value]) => value && <div key={label}><strong>{label}</strong><p>{value}</p></div>)}</section>;
}
function ChipSection({ title, value }: { title: string; value?: string }) {
  const items = splitLines(value);
  return <section className="brand-section"><header><h3>{title}</h3></header><div className="tag-list">{items.length ? items.map((item) => <span key={item}>{item}</span>) : <p>Chưa cập nhật</p>}</div></section>;
}
