import { AlertCircle, CalendarClock, Check, Clipboard, ExternalLink, Eye, LoaderCircle, Upload, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { contentStatuses, contentTypeOptions, platformOptions } from "./data";
import { uploadMediaFile } from "./operations-api";
import type { Brand, CampaignRow, Channel, ContentItem } from "./types";

export type WorkflowKind = "brand" | "channel" | "campaign" | "content" | "manual-publish";
export type WorkflowMode = "create" | "edit";
export interface WorkflowRequest {
  kind: WorkflowKind;
  mode: WorkflowMode;
  initial?: Brand | Channel | CampaignRow | ContentItem;
  defaults?: Record<string, unknown>;
}

interface Props {
  request: WorkflowRequest;
  brands: Brand[];
  channels: Channel[];
  campaigns: CampaignRow[];
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (request: WorkflowRequest, payload: Record<string, unknown>) => void;
}

export function ActionWorkflowModal(props: Props) {
  const titleId = useId();
  const modalRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState(() => buildInitialForm(props.request));
  const [checklist, setChecklist] = useState<string[]>(() => initialChecklist(props.request));
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaUploadError, setMediaUploadError] = useState("");
  const selectedBrand = props.brands.find((brand) => brand.id === form.brandId);
  const brandChannels = props.channels.filter((channel) => channel.brandId === form.brandId);
  const brandCampaigns = props.campaigns.filter((campaign) => campaign.brandId === form.brandId);

  useEffect(() => {
    setForm(buildInitialForm(props.request));
    setChecklist(initialChecklist(props.request));
    setMediaUploading(false);
    setMediaUploadError("");
  }, [props.request]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalRef.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();
    const close = (event: KeyboardEvent) => event.key === "Escape" && !props.busy && props.onClose();
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", close); };
  }, [props.busy, props.onClose]);

  const checklistOptions = useMemo(() => {
    const channel = brandChannels.find((item) => item.id === form.channelId);
    return uniqueLines(`${selectedBrand?.checklistTemplate ?? ""}\n${channel?.postingRules ?? ""}`);
  }, [brandChannels, form.channelId, selectedBrand]);

  function update(field: string, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleChecklist(item: string) {
    setChecklist((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item]);
  }

  async function uploadMedia(file: File) {
    setMediaUploading(true);
    setMediaUploadError("");
    try {
      const media = await uploadMediaFile(file);
      update("mediaUrl", media.url);
    } catch (cause) {
      setMediaUploadError(cause instanceof Error ? cause.message : "Không thể upload file.");
    } finally {
      setMediaUploading(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    props.onSubmit(props.request, buildPayload(props.request.kind, form, checklist));
  }

  const submitBlocked = props.busy
    || mediaUploading
    || (props.request.kind === "brand" && !form.name)
    || (props.request.kind === "channel" && (!form.brandId || !form.pageName))
    || (props.request.kind === "campaign" && (!form.brandId || !form.name))
    || (props.request.kind === "content" && (!form.brandId || !form.title || (form.status === "Scheduled" && !form.scheduledAt)))
    || (props.request.kind === "manual-publish" && form.publishResult === "Published" && !form.publishedUrl);

  return (
    <div className="modal-layer" onMouseDown={(event) => event.target === event.currentTarget && !props.busy && props.onClose()}>
      <form ref={modalRef} className={`workflow-modal ${props.request.kind === "content" ? "composer-modal" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId} onSubmit={submit}>
        <div className="modal-head">
          <div><span>{props.request.mode === "edit" ? "Chỉnh sửa" : "Tạo mới"}</span><h2 id={titleId}>{modalTitle(props.request)}</h2></div>
          <button type="button" className="icon-btn" aria-label="Đóng" onClick={props.onClose}><X /></button>
        </div>

        {props.request.kind === "brand" && <BrandFields form={form} update={update} />}
        {props.request.kind === "channel" && <ChannelFields form={form} brands={props.brands} update={update} />}
        {props.request.kind === "campaign" && <CampaignFields form={form} brands={props.brands} update={update} />}
        {props.request.kind === "content" && (
          <div className="composer-layout">
            <div className="composer-form">
              <Section title="A. Bài này thuộc đâu?">
                <Select label="Brand" value={form.brandId} options={props.brands.map(toOption)} onChange={(value) => { update("brandId", value); update("channelId", ""); update("campaignId", ""); setChecklist([]); }} required />
                <Select label="Kênh / Page" value={form.channelId} options={brandChannels.map(channelOption)} onChange={(value) => update("channelId", value)} empty="Chưa chọn kênh" />
                <Select label="Chiến dịch" value={form.campaignId} options={brandCampaigns.map(toOption)} onChange={(value) => update("campaignId", value)} empty="Không thuộc chiến dịch" />
                <Select label="Loại nội dung" value={form.contentType} options={contentTypeOptions.map(simpleOption)} onChange={(value) => update("contentType", value)} />
                <Field label="Tiêu đề nội bộ" value={form.title} onChange={(value) => update("title", value)} required />
              </Section>
              <Section title="B. Nội dung là gì?">
                <Field label="Nội dung chính" value={form.copy} onChange={(value) => update("copy", value)} multiline full />
                <Field label="URL ảnh / video" type="url" value={form.mediaUrl} onChange={(value) => update("mediaUrl", value)} full />
                <MediaUploadField
                  mediaUrl={form.mediaUrl}
                  error={mediaUploadError}
                  uploading={mediaUploading}
                  onUpload={(file) => void uploadMedia(file)}
                />
                <Field label="Ghi chú prompt hình ảnh" value={form.visualPromptNotes} onChange={(value) => update("visualPromptNotes", value)} multiline full />
                <Field label="Ghi chú prompt nội dung" value={form.copyPromptNotes} onChange={(value) => update("copyPromptNotes", value)} multiline full />
                <Field label="Tags, cách nhau bằng dấu phẩy" value={form.tags} onChange={(value) => update("tags", value)} full />
              </Section>
              <Section title="C. Khi nào đăng?">
                <Select label="Trạng thái" value={form.status} options={contentStatuses.map(simpleOption)} onChange={(value) => update("status", value)} />
                <Field label="Ngày giờ đăng" type="datetime-local" value={toDatetimeLocal(form.scheduledAt)} onChange={(value) => update("scheduledAt", value)} />
                <Field label="URL bài đã đăng" type="url" value={form.publishedUrl} onChange={(value) => update("publishedUrl", value)} />
              </Section>
              <Section title="D. Đã đạt chuẩn chưa?">
                <div className="checklist-field full">
                  {checklistOptions.length ? checklistOptions.map((item) => (
                    <label key={item}><input type="checkbox" checked={checklist.includes(item)} onChange={() => toggleChecklist(item)} /><span>{item}</span></label>
                  )) : <p>Brand chưa có checklist. Anh có thể bổ sung trong trang Brand.</p>}
                </div>
                <Field label="Learning note" value={form.learningNote} onChange={(value) => update("learningNote", value)} multiline full />
                <label className="toggle-field full"><input type="checkbox" checked={form.reusable === "true"} onChange={(event) => update("reusable", String(event.target.checked))} /><span>Có thể tái sử dụng nội dung này</span></label>
              </Section>
            </div>
            <ComposerSidePanel form={form} brand={selectedBrand} />
          </div>
        )}
        {props.request.kind === "manual-publish" && <ManualPublishFields form={form} content={props.request.initial as ContentItem} channels={props.channels} update={update} />}

        {props.error && <p className="form-error" role="alert"><AlertCircle />{props.error}</p>}
        <div className="modal-actions">
          <button type="button" className="secondary-btn" disabled={props.busy} onClick={props.onClose}>Hủy</button>
          <button type="submit" className="primary-btn" disabled={submitBlocked}>
            {props.busy ? <LoaderCircle className="spin" /> : <Check />}
            {props.busy ? "Đang lưu…" : submitLabel(props.request)}
          </button>
        </div>
      </form>
    </div>
  );
}

function BrandFields({ form, update }: FormProps) {
  return <div className="workflow-grid">
    <Field label="Tên Brand" value={form.name} onChange={(v) => update("name", v)} required />
    <Field label="Mô tả ngắn" value={form.shortDescription} onChange={(v) => update("shortDescription", v)} />
    <Field label="Định vị" value={form.positioning} onChange={(v) => update("positioning", v)} multiline full />
    <Field label="Khách hàng mục tiêu" value={form.targetAudience} onChange={(v) => update("targetAudience", v)} multiline full />
    <Field label="Brand Voice" value={form.brandVoice} onChange={(v) => update("brandVoice", v)} multiline full />
    <Field label="Tone & Mood" value={form.toneMood} onChange={(v) => update("toneMood", v)} />
    <Field label="Ghi chú Visual" value={form.visualStyleNotes} onChange={(v) => update("visualStyleNotes", v)} multiline full />
    <Field label="Màu sắc" value={form.colors} onChange={(v) => update("colors", v)} />
    <Field label="CTA mặc định" value={form.defaultCTA} onChange={(v) => update("defaultCTA", v)} />
    <Field label="Hashtag mặc định" value={form.defaultHashtags} onChange={(v) => update("defaultHashtags", v)} />
    <Field label="Nên làm" value={form.doList} onChange={(v) => update("doList", v)} multiline full />
    <Field label="Không nên làm" value={form.dontList} onChange={(v) => update("dontList", v)} multiline full />
    <Field label="Checklist mẫu, mỗi dòng một mục" value={form.checklistTemplate} onChange={(v) => update("checklistTemplate", v)} multiline full />
    <Field label="Content Pillars, mỗi dòng một mục" value={form.contentPillars} onChange={(v) => update("contentPillars", v)} multiline full />
    <Field label="Ghi chú phong cách Prompt" value={form.promptStyleNotes} onChange={(v) => update("promptStyleNotes", v)} multiline full />
    <Field label="Ghi chú Asset" value={form.assetNotes} onChange={(v) => update("assetNotes", v)} multiline full />
  </div>;
}

function ChannelFields({ form, brands, update }: FormProps & { brands: Brand[] }) {
  return <div className="workflow-grid">
    <Select label="Brand" value={form.brandId} options={brands.map(toOption)} onChange={(v) => update("brandId", v)} required />
    <Select label="Nền tảng" value={form.platform} options={platformOptions.map(simpleOption)} onChange={(v) => update("platform", v)} />
    <Field label="Tên Page / tài khoản" value={form.pageName} onChange={(v) => update("pageName", v)} required />
    <Field label="Handle" value={form.handle} onChange={(v) => update("handle", v)} />
    <Field label="URL kênh" type="url" value={form.url} onChange={(v) => update("url", v)} />
    <Select label="Kết nối" value={form.connectionStatus} options={["Chưa kết nối", "Sắp có", "Kết nối sau"].map(simpleOption)} onChange={(v) => update("connectionStatus", v)} />
    <Field label="Quy tắc đăng" value={form.postingRules} onChange={(v) => update("postingRules", v)} multiline full />
    <Field label="Format mặc định" value={form.defaultFormat} onChange={(v) => update("defaultFormat", v)} />
    <Field label="Hashtag mặc định" value={form.defaultHashtags} onChange={(v) => update("defaultHashtags", v)} />
    <Field label="Ghi chú giờ đăng tốt" value={form.bestPostingTimeNotes} onChange={(v) => update("bestPostingTimeNotes", v)} />
    <Field label="Ghi chú CTA" value={form.ctaNotes} onChange={(v) => update("ctaNotes", v)} />
  </div>;
}

function CampaignFields({ form, brands, update }: FormProps & { brands: Brand[] }) {
  return <div className="workflow-grid">
    <Select label="Brand" value={form.brandId} options={brands.map(toOption)} onChange={(v) => update("brandId", v)} required />
    <Field label="Tên chiến dịch" value={form.name} onChange={(v) => update("name", v)} required />
    <Field label="Mục tiêu" value={form.objective} onChange={(v) => update("objective", v)} multiline full />
    <Field label="Thông điệp chính" value={form.keyMessage} onChange={(v) => update("keyMessage", v)} multiline full />
    <Select label="Trạng thái" value={form.status} options={["Draft", "Active", "Completed", "Paused"].map(simpleOption)} onChange={(v) => update("status", v)} />
    <Field label="Ngày bắt đầu" type="date" value={form.startDate} onChange={(v) => update("startDate", v)} />
    <Field label="Ngày kết thúc" type="date" value={form.endDate} onChange={(v) => update("endDate", v)} />
    <Field label="Ghi chú" value={form.notes} onChange={(v) => update("notes", v)} multiline full />
  </div>;
}

function ManualPublishFields({ form, content, channels, update }: FormProps & { content: ContentItem; channels: Channel[] }) {
  const channel = channels.find((item) => item.id === content.channelId);
  return <div className="manual-publish">
    <div className="publish-copy"><strong>{content.title}</strong><p>{content.copy || "Chưa có nội dung."}</p></div>
    <div className="publish-tools">
      <button type="button" onClick={() => void navigator.clipboard.writeText(content.copy ?? "")}><Clipboard />Copy caption</button>
      {content.mediaUrl && <a href={content.mediaUrl} target="_blank" rel="noreferrer"><ExternalLink />Mở media</a>}
      {channel?.url && <a href={channel.url} target="_blank" rel="noreferrer"><ExternalLink />Mở kênh đăng</a>}
    </div>
    <Field label="URL bài đã đăng" type="url" value={form.publishedUrl} onChange={(v) => update("publishedUrl", v)} required={form.publishResult === "Published"} />
    <Field label="Ghi chú kết quả / lỗi" value={form.note} onChange={(v) => update("note", v)} multiline />
    <Select label="Kết quả" value={form.publishResult} options={["Published", "Failed"].map(simpleOption)} onChange={(v) => update("publishResult", v)} />
  </div>;
}

function MediaUploadField({ mediaUrl, error, uploading, onUpload }: {
  mediaUrl?: string;
  error: string;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="media-upload-field full">
      <label className={uploading ? "uploading" : ""}>
        <Upload aria-hidden="true" />
        <span>
          <strong>{uploading ? "Đang upload…" : "Upload ảnh / video"}</strong>
          <small>JPG, PNG, WebP, GIF, MP4, WebM hoặc MOV. Tối đa 15MB.</small>
        </span>
        <input
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) onUpload(file);
          }}
          type="file"
        />
      </label>
      {mediaUrl && <p>Đang dùng: <a href={mediaUrl} target="_blank" rel="noreferrer">{mediaUrl}</a></p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

function ComposerSidePanel({ form, brand }: { form: Record<string, string>; brand?: Brand }) {
  return (
    <aside className="composer-side-panel">
      <ContentPreview form={form} brand={brand} />
      <BrandContext brand={brand} />
    </aside>
  );
}

function ContentPreview({ form, brand }: { form: Record<string, string>; brand?: Brand }) {
  const mediaUrl = form.mediaUrl?.trim();
  const isVideo = Boolean(mediaUrl && /\.(mp4|webm|mov)(\?|#|$)/i.test(mediaUrl));
  const tags = splitTags(form.tags);
  return (
    <section className="content-preview-card" aria-label="Xem trước nội dung">
      <header>
        <span><Eye />Xem trước</span>
        <strong>{form.status || "Draft"}</strong>
      </header>
      <div className="preview-post">
        <div className="preview-author">
          <span>{brand?.name?.slice(0, 2).toUpperCase() || "1P"}</span>
          <div>
            <strong>{brand?.name || "1PM Marketing"}</strong>
            <small>{form.contentType || "Caption"} · {form.scheduledAt ? formatPreviewDate(form.scheduledAt) : "Chưa hẹn giờ"}</small>
          </div>
        </div>
        <h3>{form.title || "Tiêu đề nội bộ sẽ hiện ở đây"}</h3>
        <p>{form.copy || "Nội dung chính từ Claude hoặc anh tự viết sẽ hiển thị ở đây để kiểm tra trước khi lưu."}</p>
        {mediaUrl ? (
          <div className="preview-media">
            {isVideo ? (
              <video src={mediaUrl} controls playsInline />
            ) : (
              <img src={mediaUrl} alt="Media preview" />
            )}
          </div>
        ) : (
          <div className="preview-media empty">Chưa có ảnh/video</div>
        )}
        {tags.length > 0 && <div className="preview-tags">{tags.map((tag) => <span key={tag}>#{tag.replace(/^#/, "")}</span>)}</div>}
      </div>
      <footer>
        <span><CalendarClock />{form.scheduledAt ? formatPreviewDate(form.scheduledAt) : "Chưa lên lịch"}</span>
        {mediaUrl && <a href={mediaUrl} target="_blank" rel="noreferrer"><ExternalLink />Mở media</a>}
      </footer>
    </section>
  );
}

function BrandContext({ brand }: { brand?: Brand }) {
  if (!brand) return <aside className="brand-context empty"><strong>Brand Context</strong><p>Chọn Brand trước để xem voice, visual, CTA và checklist.</p></aside>;
  const rows = [
    ["Brand Voice", brand.brandVoice], ["Tone & Mood", brand.toneMood],
    ["Visual", brand.visualStyleNotes], ["CTA", brand.defaultCTA],
    ["Hashtag", brand.defaultHashtags], ["Nên làm", brand.doList],
    ["Không nên", brand.dontList], ["Prompt Style", brand.promptStyleNotes],
  ];
  return <aside className="brand-context"><span>Brand Context</span><h3>{brand.name}</h3>{rows.map(([label, value]) => value && <div key={label}><strong>{label}</strong><p>{value}</p></div>)}</aside>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <fieldset className="composer-section"><legend>{title}</legend><div className="workflow-grid">{children}</div></fieldset>;
}

interface FormProps { form: Record<string, string>; update: (field: string, value: string) => void }
function Field({ label, value, onChange, type = "text", multiline = false, full = false, required = false }: {
  label: string; value?: string; onChange: (value: string) => void; type?: string; multiline?: boolean; full?: boolean; required?: boolean;
}) {
  return <label className={`field ${full ? "full" : ""}`}><span>{label}</span>{multiline
    ? <textarea name={label} autoComplete="off" value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={required} />
    : <input name={label} autoComplete="off" type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={required} />}</label>;
}

function Select({ label, value, options, onChange, empty, required = false }: {
  label: string; value?: string; options: { value: string; label: string }[]; onChange: (value: string) => void; empty?: string; required?: boolean;
}) {
  return <label className="field"><span>{label}</span><select name={label} value={value ?? ""} required={required} onChange={(e) => onChange(e.target.value)}>
    {empty && <option value="">{empty}</option>}{!empty && !value && <option value="">Chọn {label.toLowerCase()}</option>}
    {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
  </select></label>;
}

function buildInitialForm(request: WorkflowRequest) {
  const initial = { ...(request.initial ?? {}), ...(request.defaults ?? {}) } as Record<string, unknown>;
  const base = Object.fromEntries(Object.entries(initial).map(([key, value]) => [key, value == null ? "" : String(value)]));
  if (request.kind === "content") return { contentType: "Caption", status: "Brief", reusable: "false", ...base };
  if (request.kind === "channel") return { platform: "Facebook", connectionStatus: "Chưa kết nối", ...base };
  if (request.kind === "campaign") return { status: "Draft", ...base };
  if (request.kind === "manual-publish") return { publishedUrl: initial.publishedUrl ? String(initial.publishedUrl) : "", note: "", publishResult: "Published" };
  return base;
}

function initialChecklist(request: WorkflowRequest) {
  return request.kind === "content" && Array.isArray((request.initial as ContentItem | undefined)?.checklistItems)
    ? [...((request.initial as ContentItem).checklistItems ?? [])] : [];
}

function buildPayload(kind: WorkflowKind, form: Record<string, string>, checklist: string[]): Record<string, unknown> {
  if (kind === "content") {
    const scheduledAt = form.scheduledAt || null;
    return {
      brandId: form.brandId, channelId: form.channelId || null, campaignId: form.campaignId || null,
      title: form.title, contentType: form.contentType, type: form.contentType, copy: form.copy,
      mediaUrl: form.mediaUrl || null, visualPromptNotes: form.visualPromptNotes,
      visualNotes: form.visualPromptNotes, copyPromptNotes: form.copyPromptNotes,
      copyNotes: form.copyPromptNotes, status: form.status, stage: form.status,
      scheduledAt, scheduledFor: scheduledAt, date: scheduledAt ? scheduledAt.slice(0, 10) : null,
      publishedUrl: form.publishedUrl, learningNote: form.learningNote,
      reusable: form.reusable === "true", tags: form.tags, checklistItems: checklist,
      summary: form.copy, source: "manual",
    };
  }
  if (kind === "brand") {
    return pickFormFields(form, [
      "name", "shortDescription", "positioning", "targetAudience", "brandVoice",
      "toneMood", "visualStyleNotes", "colors", "defaultCTA", "defaultHashtags",
      "doList", "dontList", "checklistTemplate", "contentPillars",
      "promptStyleNotes", "assetNotes",
    ]);
  }
  if (kind === "channel") {
    return pickFormFields(form, [
      "brandId", "platform", "pageName", "handle", "url", "connectionStatus",
      "postingRules", "defaultFormat", "defaultHashtags",
      "bestPostingTimeNotes", "ctaNotes",
    ]);
  }
  if (kind === "campaign") return { brandId: form.brandId, name: form.name, objective: form.objective, keyMessage: form.keyMessage, status: form.status, startDate: form.startDate || null, endDate: form.endDate || null, dates: form.startDate && form.endDate ? `${form.startDate} to ${form.endDate}` : "", notes: form.notes, channel: "", audience: "", spend: "$0.00", conversions: "0", cpa: "-", roi: "-" };
  if (kind === "manual-publish") return { status: form.publishResult, publishedUrl: form.publishedUrl, note: form.note };
  return Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value]));
}

function pickFormFields(form: Record<string, string>, fields: string[]) {
  return Object.fromEntries(fields.map((field) => [field, form[field] ?? ""]));
}

function modalTitle(request: WorkflowRequest) {
  if (request.kind === "manual-publish") return "Đăng thủ công";
  const names = { brand: "Brand", channel: "Kênh đăng", campaign: "Chiến dịch", content: "Nội dung" };
  return request.mode === "edit" ? `Chỉnh sửa ${names[request.kind]}` : `Tạo ${names[request.kind]}`;
}
function submitLabel(request: WorkflowRequest) { return request.kind === "manual-publish" ? "Lưu kết quả đăng" : request.mode === "edit" ? "Lưu thay đổi" : "Tạo mới"; }
function toOption(item: Brand | CampaignRow) { return { value: item.id ?? "", label: item.name }; }
function channelOption(item: Channel) { return { value: item.id ?? "", label: `${item.platform} · ${item.pageName}` }; }
function simpleOption(value: string) { return { value, label: value }; }
function uniqueLines(value: string) { return [...new Set(value.split(/\n|;/).map((line) => line.trim()).filter(Boolean))]; }
function toDatetimeLocal(value?: string) { return value ? value.replace("Z", "").slice(0, 16) : ""; }
function splitTags(value?: string) { return (value ?? "").split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 6); }
function formatPreviewDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(parsed);
}
