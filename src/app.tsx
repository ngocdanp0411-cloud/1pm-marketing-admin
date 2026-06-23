import { AlertCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ActionWorkflowModal, type WorkflowKind, type WorkflowRequest } from "./action-workflow";
import { AuthGate } from "./auth-gate";
import { BrandsPage } from "./brands-page";
import { CalendarPage } from "./calendar-page";
import { CampaignsPage } from "./campaigns-page";
import { ChannelsPage } from "./channels-page";
import { AppShell } from "./components";
import { ContentPage } from "./content-page";
import { nextStatus } from "./marketing-helpers";
import {
  completeManualPublish,
  createRecord,
  deleteRecord,
  fetchOperationsBootstrap,
  updateRecord,
  type OperationsBootstrap,
} from "./operations-api";
import { TodayPage } from "./today-page";
import type { Brand, CampaignRow, Channel, ContentItem, PageKey } from "./types";
import { SettingsPage } from "./settings-page";

function App() {
  return <AuthGate>{({ logout, logoutBusy }) => <DashboardApp onLogout={logout} logoutBusy={logoutBusy} />}</AuthGate>;
}

function DashboardApp({ onLogout, logoutBusy }: { onLogout: () => Promise<void>; logoutBusy: boolean }) {
  const [activePage, setActivePage] = useState<PageKey>(() => pageFromHash());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bootstrap, setBootstrap] = useState<OperationsBootstrap | null>(null);
  const [apiStatus, setApiStatus] = useState<"live" | "fallback" | "loading">("loading");
  const [workflow, setWorkflow] = useState<WorkflowRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<number | null>(null);

  const brands = bootstrap?.brands ?? [];
  const channels = bootstrap?.channels ?? [];
  const campaigns = bootstrap?.campaigns ?? [];
  const items = bootstrap?.contentItems ?? [];

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    const syncHash = () => setActivePage(pageFromHash());
    window.addEventListener("hashchange", syncHash);
    return () => {
      controller.abort();
      window.removeEventListener("hashchange", syncHash);
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    };
  }, []);

  function load(signal?: AbortSignal) {
    setApiStatus("loading");
    fetchOperationsBootstrap(signal)
      .then((payload) => { setBootstrap(payload); setApiStatus("live"); })
      .catch(() => setApiStatus("fallback"));
  }

  function navigate(page: PageKey) {
    setActivePage(page);
    window.history.replaceState(null, "", `#${page}`);
  }

  function open(kind: WorkflowKind, mode: WorkflowRequest["mode"] = "create", initial?: WorkflowRequest["initial"], defaults?: Record<string, unknown>) {
    if (apiStatus !== "live") {
      showNotice("Backend đang mất kết nối. Chưa thể chỉnh sửa dữ liệu.");
      return;
    }
    setError("");
    setWorkflow({ kind, mode, initial, defaults });
  }

  function primaryAction() {
    if (activePage === "settings") {
      return;
    }
    if (["today", "content", "calendar"].includes(activePage)) {
      open("content", "create", undefined, { brandId: brands[0]?.id ?? "" });
    } else if (activePage === "campaigns") {
      open("campaign", "create", undefined, { brandId: brands[0]?.id ?? "" });
    } else if (activePage === "brands") {
      open("brand");
    } else {
      open("channel", "create", undefined, { brandId: brands[0]?.id ?? "" });
    }
  }

  async function submit(request: WorkflowRequest, payload: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      if (request.kind === "manual-publish") {
        const content = request.initial as ContentItem;
        const result = await completeManualPublish(content.id as string, payload as { status: "Published" | "Failed"; publishedUrl?: string; note?: string });
        setBootstrap((current) => current ? {
          ...current,
          contentItems: upsert(current.contentItems ?? [], result.content),
          publishLogs: [result.log, ...(current.publishLogs ?? [])],
        } : current);
      } else {
        const resource = resourceForKind(request.kind as Exclude<WorkflowKind, "manual-publish">);
        const id = request.initial?.id;
        const record = request.mode === "edit" && id
          ? await updateRecord(resource, id, payload)
          : await createRecord(resource, payload);
        setBootstrap((current) => updateBootstrap(current, request.kind as Exclude<WorkflowKind, "manual-publish">, record));
      }
      setWorkflow(null);
      showNotice(request.kind === "manual-publish" ? "Đã lưu kết quả đăng." : "Đã lưu thay đổi.");
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu thay đổi.");
    } finally {
      setBusy(false);
    }
  }

  async function advanceContent(item: ContentItem) {
    if (!item.id) return;
    if (item.status === "Scheduled") {
      open("manual-publish", "edit", item);
      return;
    }
    if (["Brief", "Ready", "Published", "Failed"].includes(item.status)) {
      open("content", "edit", item, { status: nextStatus(item) ?? item.status });
      return;
    }
    const status = nextStatus(item);
    if (!status) {
      open("content", "edit", item);
      return;
    }
    try {
      const updated = await updateRecord("content", item.id, { status, stage: status });
      setBootstrap((current) => current ? { ...current, contentItems: upsert(current.contentItems ?? [], updated) } : current);
      showNotice(`Đã chuyển sang ${status}.`);
    } catch (cause) {
      showNotice(cause instanceof Error ? cause.message : "Không thể cập nhật trạng thái.");
    }
  }

  async function remove(kind: "brand" | "channel" | "campaign" | "content", record: Brand | Channel | CampaignRow | ContentItem) {
    if (!record.id) return;
    if (kind === "brand" && (channels.some((item) => item.brandId === record.id) || campaigns.some((item) => item.brandId === record.id) || items.some((item) => item.brandId === record.id))) {
      showNotice("Brand đang có kênh, chiến dịch hoặc nội dung. Hãy xử lý các mục liên quan trước.");
      return;
    }
    if (kind === "channel" && items.some((item) => item.channelId === record.id)) {
      showNotice("Kênh đang được dùng bởi nội dung. Hãy đổi kênh của các bài trước.");
      return;
    }
    if (kind === "campaign" && items.some((item) => item.campaignId === record.id)) {
      showNotice("Chiến dịch đang có nội dung. Hãy gỡ nội dung khỏi chiến dịch trước.");
      return;
    }
    const name = "name" in record ? record.name : "pageName" in record ? record.pageName : record.title;
    if (!window.confirm(`Xóa “${name}”?`)) return;
    try {
      await deleteRecord(resourceForKind(kind), record.id);
      setBootstrap((current) => removeFromBootstrap(current, kind, record.id as string));
      showNotice("Đã xóa.");
    } catch (cause) {
      showNotice(cause instanceof Error ? cause.message : "Không thể xóa.");
    }
  }

  function showNotice(message: string) {
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 3200);
  }

  const pageProps = { brands, channels, campaigns, items, onEdit: (item: ContentItem) => open("content", "edit", item), onNext: advanceContent };
  const primaryLabel = activePage === "settings" ? undefined : activePage === "campaigns" ? "Tạo chiến dịch" : activePage === "brands" ? "Tạo Brand" : activePage === "channels" ? "Thêm kênh" : "Tạo nội dung";

  return (
    <AppShell
      activePage={activePage}
      onNavigate={navigate}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      apiStatus={apiStatus}
      currentUser={bootstrap?.currentUser}
      onLogout={onLogout}
      logoutBusy={logoutBusy}
      onPrimaryAction={primaryAction}
      primaryAction={primaryLabel}
    >
      {apiStatus === "fallback" && <div className="connection-banner" role="status"><AlertCircle /><span><strong>Backend mất kết nối.</strong> Dữ liệu đang ở chế độ chỉ đọc.</span><button onClick={() => load()}>Thử lại</button></div>}
      {activePage === "today" && <TodayPage {...pageProps} />}
      {activePage === "content" && <ContentPage {...pageProps} onDelete={(item) => void remove("content", item)} />}
      {activePage === "calendar" && <CalendarPage items={items} brands={brands} channels={channels} onEdit={pageProps.onEdit} />}
      {activePage === "campaigns" && <CampaignsPage brands={brands} channels={channels} campaigns={campaigns} items={items} onEditCampaign={(item) => open("campaign", "edit", item)} onDeleteCampaign={(item) => void remove("campaign", item)} onEditContent={pageProps.onEdit} onNextContent={advanceContent} />}
      {activePage === "brands" && <BrandsPage brands={brands} channels={channels} campaigns={campaigns} items={items} onEdit={(item) => open("brand", "edit", item)} onDelete={(item) => void remove("brand", item)} />}
      {activePage === "channels" && <ChannelsPage brands={brands} channels={channels} campaigns={campaigns} items={items} onEditChannel={(item) => open("channel", "edit", item)} onDeleteChannel={(item) => void remove("channel", item)} onEditContent={pageProps.onEdit} onNextContent={advanceContent} />}
      {activePage === "settings" && <SettingsPage workspace={bootstrap?.workspace} currentUser={bootstrap?.currentUser} />}
      {workflow && <ActionWorkflowModal request={workflow} brands={brands} channels={channels} campaigns={campaigns} busy={busy} error={error} onClose={() => setWorkflow(null)} onSubmit={submit} />}
      {notice && <div className="toast" role="status" aria-live="polite">{notice}</div>}
    </AppShell>
  );
}

function pageFromHash(): PageKey {
  const value = window.location.hash.slice(1) as PageKey;
  return ["today", "content", "calendar", "campaigns", "brands", "channels", "settings"].includes(value) ? value : "today";
}

function resourceForKind(kind: "brand" | "channel" | "campaign" | "content") {
  return ({ brand: "brands", channel: "channels", campaign: "campaigns", content: "content" } as const)[kind];
}

function upsert<T extends { id?: string }>(items: T[], record: T) {
  return items.some((item) => item.id === record.id) ? items.map((item) => item.id === record.id ? record : item) : [record, ...items];
}

function updateBootstrap(current: OperationsBootstrap | null, kind: Exclude<WorkflowKind, "manual-publish">, record: Brand | Channel | CampaignRow | ContentItem) {
  if (!current) return current;
  if (kind === "brand") return { ...current, brands: upsert(current.brands ?? [], record as Brand) };
  if (kind === "channel") return { ...current, channels: upsert(current.channels ?? [], record as Channel) };
  if (kind === "campaign") return { ...current, campaigns: upsert(current.campaigns ?? [], record as CampaignRow) };
  return { ...current, contentItems: upsert(current.contentItems ?? [], record as ContentItem) };
}

function removeFromBootstrap(current: OperationsBootstrap | null, kind: "brand" | "channel" | "campaign" | "content", id: string) {
  if (!current) return current;
  if (kind === "brand") return { ...current, brands: (current.brands ?? []).filter((item) => item.id !== id) };
  if (kind === "channel") return { ...current, channels: (current.channels ?? []).filter((item) => item.id !== id) };
  if (kind === "campaign") return { ...current, campaigns: (current.campaigns ?? []).filter((item) => item.id !== id) };
  return { ...current, contentItems: (current.contentItems ?? []).filter((item) => item.id !== id) };
}

export default App;
