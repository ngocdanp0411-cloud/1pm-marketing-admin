import { AlertCircle, Check, Copy, Edit3, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import type { CampaignRow, ContentItem, SocialPost } from "./types";

export type WorkflowKind = "campaign" | "content" | "social";
export type WorkflowMode = "create" | "edit" | "duplicate";

export interface WorkflowRequest {
  kind: WorkflowKind;
  mode: WorkflowMode;
  initial?: CampaignRow | ContentItem | SocialPost;
  defaults?: Partial<CampaignRow & ContentItem & SocialPost>;
}

interface ActionWorkflowModalProps {
  request: WorkflowRequest;
  campaigns: CampaignRow[];
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (request: WorkflowRequest, payload: Partial<CampaignRow & ContentItem & SocialPost>) => void;
}

export function ActionWorkflowModal({ request, campaigns, busy, error, onClose, onSubmit }: ActionWorkflowModalProps) {
  const title = useMemo(() => buildTitle(request), [request]);
  const titleId = useId();
  const modalRef = useRef<HTMLFormElement>(null);
  const [form, setForm] = useState<Record<string, string>>(buildInitialForm(request));

  useEffect(() => {
    setForm(buildInitialForm(request));
  }, [request]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalRef.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [busy, onClose]);

  function updateField(field: string, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(request, buildPayload(request.kind, form));
  }

  return (
    <div className="modal-layer" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) {
        onClose();
      }
    }}>
      <form ref={modalRef} className="workflow-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} onSubmit={handleSubmit}>
        <div className="modal-head">
          <div>
            <span>{request.mode === "edit" ? "Edit workflow" : request.mode === "duplicate" ? "Duplicate record" : "Create workflow"}</span>
            <h2 id={titleId}>{title}</h2>
          </div>
          <button type="button" className="icon-btn" aria-label="Close workflow modal" disabled={busy} onClick={onClose}><X /></button>
        </div>

        {request.kind === "campaign" && <CampaignFields form={form} onChange={updateField} />}
        {request.kind === "content" && <ContentFields form={form} campaigns={campaigns} onChange={updateField} />}
        {request.kind === "social" && <SocialFields form={form} campaigns={campaigns} onChange={updateField} />}

        {error && <p className="form-error" role="alert"><AlertCircle />{error}</p>}

        <div className="modal-actions">
          <button type="button" className="wide-btn" disabled={busy} onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-btn" disabled={busy}>
            {busy ? <LoaderCircle className="spin" /> : request.mode === "edit" ? <Edit3 /> : request.mode === "duplicate" ? <Copy /> : <Plus />}
            {busy ? "Saving..." : request.mode === "edit" ? "Save Changes" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function RowActions({ onEdit, onDuplicate, onDelete }: { onEdit: () => void; onDuplicate: () => void; onDelete: () => void }) {
  return (
    <span className="row-actions">
      <button aria-label="Edit record" onClick={onEdit}><Edit3 /></button>
      <button aria-label="Duplicate record" onClick={onDuplicate}><Copy /></button>
      <button aria-label="Delete record" onClick={onDelete}><Trash2 /></button>
    </span>
  );
}

export function ApprovalActions({ onApprove, onChanges, busy = false }: { onApprove: () => void; onChanges: () => void; busy?: boolean }) {
  return (
    <span className="approval-actions" aria-busy={busy}>
      <button disabled={busy} onClick={onApprove}>{busy ? <LoaderCircle className="spin" /> : <Check />}{busy ? "Saving" : "Approve"}</button>
      <button disabled={busy} onClick={onChanges}><AlertCircle />Changes</button>
    </span>
  );
}

function CampaignFields({ form, onChange }: FieldProps) {
  return (
    <div className="workflow-grid">
      <Field label="Campaign name" value={form.name} onChange={(value) => onChange("name", value)} required />
      <SelectField label="Channel" value={form.channel} options={["Paid Search", "Instagram", "LinkedIn", "Email Campaign", "Facebook", "Google Ads", "Display Network"]} onChange={(value) => onChange("channel", value)} />
      <SelectField label="Status" value={form.status} options={["Draft", "Scheduled", "Active", "Paused", "Completed"]} onChange={(value) => onChange("status", value)} />
      <Field label="Audience" value={form.audience} onChange={(value) => onChange("audience", value)} />
      <Field label="Start date" type="date" value={form.startDate} onChange={(value) => onChange("startDate", value)} />
      <Field label="End date" type="date" value={form.endDate} onChange={(value) => onChange("endDate", value)} />
      <Field label="Spend" value={form.spend} onChange={(value) => onChange("spend", value)} />
      <Field label="Conversions" value={form.conversions} onChange={(value) => onChange("conversions", value)} />
      <Field label="CPA" value={form.cpa} onChange={(value) => onChange("cpa", value)} />
      <Field label="ROI" value={form.roi} onChange={(value) => onChange("roi", value)} />
      <Field label="Notes" value={form.notes} onChange={(value) => onChange("notes", value)} multiline full />
    </div>
  );
}

function ContentFields({ form, campaigns, onChange }: FieldProps & { campaigns: CampaignRow[] }) {
  return (
    <div className="workflow-grid">
      <Field label="Title" value={form.title} onChange={(value) => onChange("title", value)} required />
      <SelectField label="Type" value={form.type} options={["Blog - SEO", "Video - Campaign", "Email - Campaign", "Carousel - Social", "Case Study - PDF", "Ad - Paid Social"]} onChange={(value) => onChange("type", value)} />
      <SelectField label="Stage" value={form.stage} options={["Ideas", "Briefing", "Drafting", "Review", "Ready to Publish"]} onChange={(value) => onChange("stage", value)} />
      <SelectField label="Status" value={form.status} options={["Ideation", "Brief Ready", "Drafting", "In Review", "Approved", "Changes Requested"]} onChange={(value) => onChange("status", value)} />
      <Field label="Due date" type="date" value={form.date} onChange={(value) => onChange("date", value)} />
      <Field label="Owner" value={form.owner} onChange={(value) => onChange("owner", value)} />
      <Field label="Channel" value={form.channel} onChange={(value) => onChange("channel", value)} />
      <CampaignSelect value={form.campaignId} campaigns={campaigns} onChange={(value) => onChange("campaignId", value)} />
      <Field label="Summary" value={form.summary} onChange={(value) => onChange("summary", value)} multiline full />
    </div>
  );
}

function SocialFields({ form, campaigns, onChange }: FieldProps & { campaigns: CampaignRow[] }) {
  return (
    <div className="workflow-grid">
      <Field label="Post title" value={form.title} onChange={(value) => onChange("title", value)} required />
      <SelectField label="Channel" value={form.channel} options={["Facebook", "Instagram", "LinkedIn", "X", "TikTok", "YouTube"]} onChange={(value) => onChange("channel", value)} />
      <SelectField label="Status" value={form.status} options={["Draft", "Queued", "Pending Review", "Approved", "Changes Requested", "Published"]} onChange={(value) => onChange("status", value)} />
      <Field label="Scheduled time" type="datetime-local" value={toDatetimeLocal(form.scheduledFor)} onChange={(value) => onChange("scheduledFor", value)} />
      <Field label="Owner" value={form.owner} onChange={(value) => onChange("owner", value)} />
      <CampaignSelect value={form.campaignId} campaigns={campaigns} onChange={(value) => onChange("campaignId", value)} />
      <Field label="Copy" value={form.copy} onChange={(value) => onChange("copy", value)} multiline full />
    </div>
  );
}

interface FieldProps {
  form: Record<string, string>;
  onChange: (field: string, value: string) => void;
}

function Field({ label, value, onChange, type = "text", multiline = false, full = false, required = false }: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
  full?: boolean;
  required?: boolean;
}) {
  return (
    <label className={full ? "field full" : "field"}>
      <span>{label}</span>
      {multiline ? <textarea value={value ?? ""} onChange={(event) => onChange(event.target.value)} required={required} /> : <input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} required={required} />}
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value?: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value ?? options[0]} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function CampaignSelect({ value, campaigns, onChange }: { value?: string; campaigns: CampaignRow[]; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>Campaign</span>
      <select value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">No campaign</option>
        {campaigns.map((campaign) => <option key={campaign.id ?? campaign.name} value={campaign.id ?? campaign.name}>{campaign.name}</option>)}
      </select>
    </label>
  );
}

function buildTitle(request: WorkflowRequest) {
  const fallback = request.kind === "campaign" ? "Campaign" : request.kind === "content" ? "Content Item" : "Social Post";
  const initialTitle = "name" in (request.initial ?? {}) ? (request.initial as CampaignRow).name : (request.initial as ContentItem | SocialPost | undefined)?.title;
  return initialTitle ? `${request.mode === "duplicate" ? "Copy of " : ""}${initialTitle}` : `New ${fallback}`;
}

function buildInitialForm(request: WorkflowRequest): Record<string, string> {
  const initial = { ...(request.initial ?? {}), ...(request.defaults ?? {}) } as Record<string, unknown>;

  if (request.kind === "campaign") {
    return normalize({
      name: duplicateName(request, initial.name, "New Campaign"),
      channel: initial.channel ?? "Paid Search",
      status: request.mode === "duplicate" ? "Draft" : initial.status ?? "Draft",
      audience: initial.audience ?? "General Audience",
      startDate: initial.startDate ?? "",
      endDate: initial.endDate ?? "",
      spend: initial.spend ?? "$0.00",
      conversions: initial.conversions ?? "0",
      cpa: initial.cpa ?? "-",
      roi: initial.roi ?? "-",
      notes: initial.notes ?? "",
    });
  }

  if (request.kind === "content") {
    return normalize({
      title: duplicateName(request, initial.title, "New Content Item"),
      type: initial.type ?? "Blog - SEO",
      stage: initial.stage ?? "Ideas",
      status: request.mode === "duplicate" ? "Ideation" : initial.status ?? "Ideation",
      date: initial.date ?? "",
      owner: initial.owner ?? "Ngọc Dân",
      channel: initial.channel ?? "Content Studio",
      campaignId: initial.campaignId ?? "",
      summary: initial.summary ?? "",
    });
  }

  return normalize({
    title: duplicateName(request, initial.title, "New Social Post"),
    channel: initial.channel ?? "LinkedIn",
    status: request.mode === "duplicate" ? "Draft" : initial.status ?? "Queued",
    scheduledFor: initial.scheduledFor ?? "",
    owner: initial.owner ?? "Ngọc Dân",
    campaignId: initial.campaignId ?? "",
    copy: initial.copy ?? "",
  });
}

function buildPayload(kind: WorkflowKind, form: Record<string, string>) {
  if (kind === "campaign") {
    const dates = form.startDate && form.endDate ? `${form.startDate} to ${form.endDate}` : "";
    return { ...pick(form, ["name", "channel", "status", "startDate", "endDate", "audience", "spend", "conversions", "cpa", "roi", "notes"]), dates };
  }

  if (kind === "content") {
    return { ...pick(form, ["title", "type", "date", "status", "stage", "owner", "channel", "summary"]), campaignId: emptyToNull(form.campaignId) };
  }

  return { ...pick(form, ["title", "channel", "status", "owner", "copy"]), scheduledFor: form.scheduledFor || null, campaignId: emptyToNull(form.campaignId) };
}

function pick(source: Record<string, string>, keys: string[]) {
  return keys.reduce<Record<string, string>>((payload, key) => {
    payload[key] = source[key] ?? "";
    return payload;
  }, {});
}

function normalize(source: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, value == null ? "" : String(value)]));
}

function duplicateName(request: WorkflowRequest, value: unknown, fallback: string) {
  const text = String(value ?? fallback);
  return request.mode === "duplicate" ? `${text} Copy` : text;
}

function emptyToNull(value?: string) {
  return value ? value : null;
}

function toDatetimeLocal(value?: string) {
  if (!value) {
    return "";
  }

  return value.endsWith("Z") ? value.slice(0, 16) : value;
}
