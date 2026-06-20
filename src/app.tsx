import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  Facebook,
  FileText,
  Filter,
  Globe,
  Image,
  Instagram,
  Link,
  ListFilter,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  MoreVertical,
  Palette,
  Plus,
  Send,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Target,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { AppShell, Donut, LineChart, MetricCard, Panel, SparkLine, StatusPill } from "./components";
import { ActionWorkflowModal, ApprovalActions, RowActions, type WorkflowKind, type WorkflowRequest } from "./action-workflow";
import { AuthGate } from "./auth-gate";
import {
  aiTemplates,
  assetCards,
  campaignRows,
  channelMix,
  contentWorkflow,
  overviewMetrics,
  pageIcons,
  studioMetrics,
  teamMembers,
} from "./data";
import { useI18n } from "./i18n";
import { ManualContentCalendar } from "./manual-content-calendar";
import { ManualContentLibrary } from "./manual-content-library";
import { createRecord, deleteRecord, fetchOperationsBootstrap, publishSocialPost, updateRecord, type OperationsBootstrap } from "./operations-api";
import type { CampaignRow, ChannelIntegration, ContentItem, Metric, OperationsNotification, PageKey, PublishLog, SocialPost } from "./types";

const analyticMetrics: Metric[] = [
  { label: "Total Sessions", value: "152.4K", trend: "14.6%", icon: Users },
  { label: "New Users", value: "98.7K", trend: "16.3%", icon: Users },
  { label: "Conversions", value: "6,842", trend: "22.7%", icon: Target },
  { label: "Conversion Rate", value: "4.49%", trend: "18.2%", icon: BarChart3 },
  { label: "Revenue", value: "$248.7K", trend: "24.8%", icon: Globe },
  { label: "ROAS Estimate", value: "4.37x", trend: "manual", icon: SparkLine as never },
];

const campaignMetrics: Metric[] = [
  { label: "Active Campaigns", value: "12", trend: "20%", icon: Send },
  { label: "Budget Used", value: "$24,680", trend: "16.8%", icon: Target },
  { label: "Conversions", value: "4,892", trend: "28.3%", icon: BarChart3 },
  { label: "CPA", value: "$5.04", trend: "8.1%", icon: Users },
  { label: "ROI Estimate", value: "4.37x", trend: "manual", icon: Target },
];

const calendarMetrics: Metric[] = [
  { label: "Scheduled Content", value: "128", trend: "15.6%", icon: Send },
  { label: "Published Content", value: "96", trend: "18.3%", icon: Send },
  { label: "Drafts", value: "24", trend: "6.2%", icon: FileText, tone: "bad" },
  { label: "Approval Rate", value: "92%", trend: "8.4%", icon: ShieldCheck },
  { label: "Engagement (Est.)", value: "248.7K", trend: "12.7%", icon: Globe },
  { label: "Content ROI", value: "4.37x", trend: "31.2%", icon: BarChart3 },
];

function App() {
  return (
    <AuthGate>
      {({ logout, logoutBusy }) => <DashboardApp onLogout={logout} logoutBusy={logoutBusy} />}
    </AuthGate>
  );
}

function DashboardApp({ onLogout, logoutBusy }: { onLogout: () => Promise<void>; logoutBusy: boolean }) {
  const { t } = useI18n();
  const [activePage, setActivePage] = useState<PageKey>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bootstrap, setBootstrap] = useState<OperationsBootstrap | null>(null);
  const [apiStatus, setApiStatus] = useState<"live" | "fallback" | "loading">("loading");
  const [workflowRequest, setWorkflowRequest] = useState<WorkflowRequest | null>(null);
  const [workflowBusy, setWorkflowBusy] = useState(false);
  const [workflowError, setWorkflowError] = useState("");
  const [pendingAction, setPendingAction] = useState("");
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    loadBootstrap(controller.signal);

    return () => {
      controller.abort();
      if (noticeTimer.current) {
        window.clearTimeout(noticeTimer.current);
      }
    };
  }, []);

  const liveOverviewMetrics = bootstrap?.overviewMetrics ? adaptOverviewMetrics(bootstrap.overviewMetrics) : overviewMetrics;
  const liveCampaignRows = bootstrap?.campaigns ?? campaignRows;
  const liveContentItems = bootstrap?.contentItems ?? flattenWorkflowItems(contentWorkflow);
  const liveSocialQueue = bootstrap?.socialQueue ?? fallbackSocialQueue;
  const liveIntegrations = bootstrap?.integrations ?? fallbackIntegrations;
  const livePublishLogs = bootstrap?.publishLogs ?? fallbackPublishLogs;
  const liveNotifications = bootstrap?.notifications ?? fallbackNotifications;

  function loadBootstrap(signal?: AbortSignal) {
    setApiStatus("loading");
    fetchOperationsBootstrap(signal)
      .then((payload) => {
        setBootstrap(payload);
        setApiStatus("live");
      })
      .catch(() => {
        setApiStatus("fallback");
      });
  }

  function openWorkflow(kind: WorkflowKind, mode: WorkflowRequest["mode"] = "create", initial?: WorkflowRequest["initial"], defaults?: WorkflowRequest["defaults"]) {
    if (apiStatus !== "live") {
      showNotice(apiStatus === "loading" ? "Connecting to the operations API. Try again in a moment." : "Operations API is offline. Editing is temporarily unavailable.");
      return;
    }

    setWorkflowError("");
    setWorkflowRequest({ kind, mode, initial, defaults });
  }

  function handlePrimaryAction(page: PageKey) {
    if (page === "content-studio" || page === "content-calendar") {
      openWorkflow("content");
      return;
    }

    if (page === "social-posting") {
      openWorkflow("social");
      return;
    }

    if (page === "brand-assets" || page === "local-marketing") {
      showNotice("This module is visual in this release. Campaign/content/social workflows are live now.");
      return;
    }

    openWorkflow("campaign");
  }

  async function handleWorkflowSubmit(request: WorkflowRequest, payload: WorkflowRequest["defaults"]) {
    setWorkflowBusy(true);
    setWorkflowError("");

    try {
      if (request.kind === "campaign") {
        const record = request.mode === "edit" && request.initial?.id
          ? await updateRecord("campaigns", request.initial.id, payload as Partial<CampaignRow>)
          : await createRecord("campaigns", payload as Partial<CampaignRow>);
        setBootstrap((current) => upsertBootstrapRecord(current, "campaigns", record, request.mode !== "edit"));
      }

      if (request.kind === "content") {
        const record = request.mode === "edit" && request.initial?.id
          ? await updateRecord("content", request.initial.id, payload as Partial<ContentItem>)
          : await createRecord("content", payload as Partial<ContentItem>);
        setBootstrap((current) => upsertBootstrapRecord(current, "contentItems", record, request.mode !== "edit"));
      }

      if (request.kind === "social") {
        const record = request.mode === "edit" && request.initial?.id
          ? await updateRecord("social-posts", request.initial.id, payload as Partial<SocialPost>)
          : await createRecord("social-posts", payload as Partial<SocialPost>);
        setBootstrap((current) => upsertBootstrapRecord(current, "socialQueue", record, request.mode !== "edit"));
      }

      setWorkflowRequest(null);
      showNotice(`${request.kind === "campaign" ? "Campaign" : request.kind === "content" ? "Content item" : "Social post"} saved.`);
      loadBootstrap();
    } catch (error) {
      setWorkflowError(error instanceof Error ? error.message : "Could not save workflow item.");
    } finally {
      setWorkflowBusy(false);
    }
  }

  async function deleteCampaign(row: CampaignRow) {
    if (apiStatus !== "live") {
      showNotice("Operations API is offline. Deleting is temporarily unavailable.");
      return;
    }

    if (!row.id) {
      showNotice("This seed row has no backend id yet.");
      return;
    }

    const campaignId = row.id;
    if (!window.confirm(`Delete "${row.name}"?`)) {
      return;
    }

    try {
      await deleteRecord("campaigns", campaignId);
      setBootstrap((current) => removeBootstrapRecord(current, "campaigns", campaignId));
      showNotice("Campaign deleted.");
      loadBootstrap();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not delete campaign.");
    }
  }

  async function updateContentStatus(item: ContentItem, status: string, stage: string) {
    if (apiStatus !== "live") {
      showNotice("Operations API is offline. Approval actions are temporarily unavailable.");
      return;
    }

    if (!item.id) {
      showNotice("This content item has no backend id yet.");
      return;
    }

    const actionKey = `content:${item.id}`;
    if (pendingAction) return;

    setPendingAction(actionKey);
    try {
      const record = await updateRecord("content", item.id, { status, stage });
      setBootstrap((current) => upsertBootstrapRecord(current, "contentItems", record));
      showNotice(`Content marked ${status.toLowerCase()}.`);
      loadBootstrap();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not update content status.");
    } finally {
      setPendingAction("");
    }
  }

  async function deleteContentItem(item: ContentItem) {
    if (apiStatus !== "live") {
      showNotice("Operations API is offline. Deleting is temporarily unavailable.");
      return;
    }

    if (!item.id) {
      showNotice("This content item has no backend id yet.");
      return;
    }

    if (!window.confirm(`Delete "${item.title}"?`)) return;

    try {
      await deleteRecord("content", item.id);
      setBootstrap((current) => removeBootstrapRecord(current, "contentItems", item.id as string));
      showNotice("Content item deleted.");
      loadBootstrap();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not delete content item.");
    }
  }

  async function updateSocialStatus(post: SocialPost, status: string) {
    if (apiStatus !== "live") {
      showNotice("Operations API is offline. Approval actions are temporarily unavailable.");
      return;
    }

    if (!post.id) {
      showNotice("This social post has no backend id yet.");
      return;
    }

    const actionKey = `social:${post.id}`;
    if (pendingAction) return;

    setPendingAction(actionKey);
    try {
      const record = await updateRecord("social-posts", post.id, { status });
      setBootstrap((current) => upsertBootstrapRecord(current, "socialQueue", record));
      showNotice(status === "Approved" ? "Post approved." : "Changes requested.");
      loadBootstrap();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not update post status.");
    } finally {
      setPendingAction("");
    }
  }

  async function publishPost(post: SocialPost) {
    if (apiStatus !== "live") {
      showNotice("Operations API is offline. Publishing is temporarily unavailable.");
      return;
    }

    if (!post.id) {
      showNotice("This social post has no backend id yet.");
      return;
    }

    const actionKey = `publish:${post.id}`;
    if (pendingAction) return;

    setPendingAction(actionKey);
    try {
      const result = await publishSocialPost(post.id);
      setBootstrap((current) => {
        if (!current) return current;
        return {
          ...upsertBootstrapRecord(current, "socialQueue", result.post),
          publishLogs: [result.log, ...(current.publishLogs ?? [])],
          notifications: [result.notification, ...(current.notifications ?? [])],
        };
      });
      showNotice(result.post.status === "Published" ? `${post.channel} post published.` : result.post.lastPublishError ?? "Publish failed.");
      loadBootstrap();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not publish post.");
    } finally {
      setPendingAction("");
    }
  }

  async function toggleIntegration(integration: ChannelIntegration) {
    if (apiStatus !== "live") {
      showNotice("Operations API is offline. Channel setup is temporarily unavailable.");
      return;
    }

    const actionKey = `integration:${integration.id}`;
    if (pendingAction) return;

    const willConnect = integration.status !== "connected" || integration.tokenHealth !== "healthy";
    const now = new Date().toISOString();
    setPendingAction(actionKey);

    try {
      const record = await updateRecord("integrations", integration.id, willConnect ? {
        status: "connected",
        tokenHealth: "healthy",
        pageId: integration.pageId || `${integration.provider}-demo-page`,
        connectedAt: integration.connectedAt || now,
        lastSync: now,
      } : {
        status: "needs_setup",
        tokenHealth: "missing",
        pageId: null,
        lastSync: null,
      });
      setBootstrap((current) => upsertBootstrapRecord(current, "integrations", record));
      showNotice(willConnect ? `${record.name} connected in demo mode.` : `${record.name} disconnected.`);
      loadBootstrap();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "Could not update channel integration.");
    } finally {
      setPendingAction("");
    }
  }

  function showNotice(message: string) {
    if (noticeTimer.current) {
      window.clearTimeout(noticeTimer.current);
    }

    setNotice(message);
    noticeTimer.current = window.setTimeout(() => {
      setNotice("");
      noticeTimer.current = null;
    }, 2800);
  }

  return (
    <AppShell activePage={activePage} onNavigate={setActivePage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} apiStatus={apiStatus} currentUser={bootstrap?.currentUser} onLogout={onLogout} logoutBusy={logoutBusy} onPrimaryAction={handlePrimaryAction}>
      {apiStatus === "fallback" && <div className="connection-banner" role="status"><AlertCircle /><span><strong>{t("Operations API offline.")}</strong> {t("Data is read-only until the backend reconnects.")}</span><button onClick={() => loadBootstrap()}>{t("Retry")}</button></div>}
      {activePage === "overview" && <OverviewPage metrics={liveOverviewMetrics} notifications={liveNotifications} />}
      {activePage === "content-studio" && <ContentStudioPage items={liveContentItems} campaigns={liveCampaignRows} pendingAction={pendingAction} onOpenWorkflow={openWorkflow} onApproveContent={updateContentStatus} onDeleteContent={deleteContentItem} />}
      {activePage === "content-calendar" && <ContentCalendarPage items={liveContentItems} onOpenWorkflow={openWorkflow} />}
      {activePage === "ai-generator" && <AiGeneratorPage />}
      {activePage === "campaigns" && <CampaignsPage rows={liveCampaignRows} onOpenWorkflow={openWorkflow} onDeleteCampaign={deleteCampaign} />}
      {activePage === "analytics" && <AnalyticsPage />}
      {activePage === "brand-assets" && <BrandAssetsPage />}
      {activePage === "social-posting" && <SocialPostingPage posts={liveSocialQueue} campaigns={liveCampaignRows} integrations={liveIntegrations} publishLogs={livePublishLogs} notifications={liveNotifications} pendingAction={pendingAction} onOpenWorkflow={openWorkflow} onUpdateStatus={updateSocialStatus} onPublishPost={publishPost} onToggleIntegration={toggleIntegration} />}
      {activePage === "local-marketing" && <LocalMarketingPage />}
      {activePage === "settings" && <SettingsPage integrations={liveIntegrations} notifications={liveNotifications} pendingAction={pendingAction} onToggleIntegration={toggleIntegration} />}
      {workflowRequest && <ActionWorkflowModal request={workflowRequest} campaigns={liveCampaignRows} busy={workflowBusy} error={workflowError} onClose={() => setWorkflowRequest(null)} onSubmit={handleWorkflowSubmit} />}
      {notice && <div className="toast" role="status">{t(notice)}</div>}
    </AppShell>
  );
}

function adaptOverviewMetrics(apiMetrics: NonNullable<OperationsBootstrap["overviewMetrics"]>): Metric[] {
  const iconMap = {
    campaigns: Send,
    content: Wifi,
    calendar: CalendarDays,
    social: Share2,
    local: AlertCircle,
  };

  return apiMetrics.map((metric, index) => ({
    label: metric.label,
    value: String(metric.value),
    trend: metric.context ?? "Live operations",
    icon: iconMap[metric.key as keyof typeof iconMap] ?? overviewMetrics[index % overviewMetrics.length].icon,
  }));
}

const fallbackSocialQueue: SocialPost[] = [
  { title: "Product Launch Campaign", channel: "Facebook Page", status: "Queued", publishStatus: "Scheduled", scheduledFor: "2026-06-24T10:00", owner: "Ngọc Dân", copy: "Launch update ready for review." },
  { title: "Behind the Scenes", channel: "TikTok", status: "Failed", publishStatus: "Failed", scheduledFor: "2026-06-24T13:00", owner: "Ava Martinez", copy: "Short-form production moment.", lastPublishError: "TikTok needs setup before publishing." },
  { title: "Industry Insights", channel: "LinkedIn", status: "Pending Review", publishStatus: "Draft", scheduledFor: "2026-06-24T15:30", owner: "Noah Williams", copy: "Insight post awaiting approval." },
];

const fallbackIntegrations: ChannelIntegration[] = [
  { id: "integration-instagram", provider: "instagram", name: "Instagram", accountName: "1PM Studio", status: "connected", pageId: "ig-demo-1pm", permissions: "instagram_content_publish", tokenHealth: "healthy", setupMode: "demo", lastSync: "2026-06-05T08:30:00.000Z", connectedAt: "2026-06-01T08:30:00.000Z" },
  { id: "integration-threads", provider: "threads", name: "Threads", accountName: "1PM Threads", status: "needs_setup", pageId: null, permissions: "threads_content_publish", tokenHealth: "missing", setupMode: "demo", lastSync: null, connectedAt: null },
  { id: "integration-tiktok", provider: "tiktok", name: "TikTok", accountName: "1PM Creative", status: "needs_setup", pageId: null, permissions: "video.publish", tokenHealth: "missing", setupMode: "demo", lastSync: null, connectedAt: null },
  { id: "integration-facebook", provider: "facebook", name: "Facebook Page", accountName: "1PM Marketing Room", status: "connected", pageId: "fb-page-demo-1pm", permissions: "pages_manage_posts", tokenHealth: "healthy", setupMode: "demo", lastSync: "2026-06-05T08:25:00.000Z", connectedAt: "2026-06-01T08:25:00.000Z" },
  { id: "integration-linkedin", provider: "linkedin", name: "LinkedIn", accountName: "1PM Company Page", status: "connected", pageId: "li-demo-1pm", permissions: "w_member_social", tokenHealth: "healthy", setupMode: "demo", lastSync: "2026-06-05T08:20:00.000Z", connectedAt: "2026-06-01T08:20:00.000Z" },
  { id: "integration-x", provider: "x", name: "X", accountName: "@1pm_app", status: "attention", pageId: "x-demo-1pm", permissions: "tweet.write", tokenHealth: "expires_soon", setupMode: "demo", lastSync: "2026-06-05T07:50:00.000Z", connectedAt: "2026-06-01T07:50:00.000Z" },
];

const fallbackPublishLogs: PublishLog[] = [
  { id: "publish-log-fallback-1", postId: "social-instagram-demo", channel: "Instagram", status: "published", message: "Demo publish completed through the operations layer.", externalPostId: "demo-instagram-001", createdAt: "2026-06-05T09:30:00.000Z" },
  { id: "publish-log-fallback-2", postId: "social-x-launch", channel: "X", status: "failed", message: "X token expires soon. Reconnect before publishing.", externalPostId: null, createdAt: "2026-06-05T10:05:00.000Z" },
];

const fallbackNotifications: OperationsNotification[] = [
  { id: "notification-fallback-1", type: "integration", title: "Reconnect X", message: "The X channel token expires soon.", severity: "warning", status: "unread", relatedId: "integration-x", createdAt: "2026-06-05T10:05:00.000Z" },
  { id: "notification-fallback-2", type: "approval", title: "Approval needed", message: "One social post is waiting for review.", severity: "info", status: "unread", relatedId: "social-x-launch", createdAt: "2026-06-05T10:15:00.000Z" },
];

function flattenWorkflowItems(workflow: Record<string, ContentItem[]>): ContentItem[] {
  return Object.entries(workflow).flatMap(([stage, items]) => items.map((item) => ({ ...item, stage, status: item.status ?? stage })));
}

function groupContentItems(items: ContentItem[]) {
  const stages = ["Ideas", "Briefing", "Drafting", "Review", "Ready to Publish"];
  return stages.reduce<Record<string, ContentItem[]>>((groups, stage) => {
    groups[stage] = items.filter((item) => (item.stage ?? "Ideas") === stage);
    return groups;
  }, {});
}

function upsertBootstrapRecord<TKey extends "campaigns" | "contentItems" | "socialQueue" | "integrations" | "notifications">(
  bootstrap: OperationsBootstrap | null,
  key: TKey,
  record: NonNullable<OperationsBootstrap[TKey]>[number],
  prepend = false,
) {
  if (!bootstrap) {
    return bootstrap;
  }

  const list = [...((bootstrap[key] ?? []) as NonNullable<OperationsBootstrap[TKey]>)];
  const index = list.findIndex((item) => item.id === record.id);
  const nextList = index >= 0 ? list.map((item) => (item.id === record.id ? record : item)) : prepend ? [record, ...list] : [...list, record];
  return { ...bootstrap, [key]: nextList };
}

function removeBootstrapRecord<TKey extends "campaigns" | "contentItems" | "socialQueue" | "integrations" | "notifications">(bootstrap: OperationsBootstrap | null, key: TKey, id: string) {
  if (!bootstrap) {
    return bootstrap;
  }

  return { ...bootstrap, [key]: (bootstrap[key] ?? []).filter((item) => item.id !== id) };
}

function formatSchedule(value?: string | null) {
  if (!value) {
    return "Not scheduled";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function channelReadiness(channel: string, integrations: ChannelIntegration[]) {
  const integration = integrations.find((item) => item.provider === channelProvider(channel));
  if (!integration) {
    return "not configured";
  }

  if (integration.status === "connected" && integration.tokenHealth === "healthy") {
    return "ready";
  }

  if (integration.tokenHealth === "expires_soon") {
    return "reconnect soon";
  }

  return integration.status.replace("_", " ");
}

function channelProvider(channel: string) {
  const value = channel.toLowerCase();
  if (value.includes("facebook")) return "facebook";
  if (value.includes("instagram")) return "instagram";
  if (value.includes("thread")) return "threads";
  if (value.includes("tiktok")) return "tiktok";
  if (value.includes("linkedin")) return "linkedin";
  if (value === "x" || value.includes("twitter")) return "x";
  return value.replace(/[^a-z0-9]+/g, "-");
}

function OverviewPage({ metrics, notifications }: { metrics: Metric[]; notifications: OperationsNotification[] }) {
  return (
    <>
      <MetricGrid metrics={metrics} />
      <div className="grid overview-grid">
        <Panel title="Campaign Performance" action="Last 30 Days" className="span-2"><Legend labels={["Reach", "Engagement", "Conversions"]} /><LineChart /></Panel>
        <Panel title="Today's Schedule" action="View Calendar"><ScheduleList /></Panel>
        <PipelinePanel />
        <Panel title="Channel Mix"><Donut label="152.4K" /><List items={channelMix} /></Panel>
        <NotificationPanel notifications={notifications} />
        <HealthPanel />
      </div>
    </>
  );
}

function ContentStudioPage({ items, campaigns, pendingAction, onOpenWorkflow, onApproveContent, onDeleteContent }: { items: ContentItem[]; campaigns: CampaignRow[]; pendingAction: string; onOpenWorkflow: (kind: WorkflowKind, mode?: WorkflowRequest["mode"], initial?: WorkflowRequest["initial"], defaults?: WorkflowRequest["defaults"]) => void; onApproveContent: (item: ContentItem, status: string, stage: string) => void; onDeleteContent: (item: ContentItem) => void }) {
  const groupedItems = groupContentItems(items);
  const createManualContent = () => onOpenWorkflow("content", "create", undefined, { source: "manual", status: "Draft", stage: "Drafting" });

  return (
    <>
      <MetricGrid metrics={studioMetrics} />
      <ManualContentLibrary
        items={items}
        campaigns={campaigns}
        pendingAction={pendingAction}
        onCreate={createManualContent}
        onEdit={(item) => onOpenWorkflow("content", "edit", item)}
        onDelete={onDeleteContent}
        onStatusChange={(item, status) => onApproveContent(item, status, contentStageForStatus(status))}
      />
      <div className="content-layout studio-layout">
        <div>
          <Panel title="Content Workflow" action="Board" className="kanban-panel">
            <div className="board-tools"><button><Filter /> Filter</button><button><SlidersHorizontal /> Sort</button><button aria-label="More board options"><MoreVertical /></button></div>
            <KanbanBoard items={groupedItems} pendingAction={pendingAction} onOpenWorkflow={onOpenWorkflow} onApproveContent={onApproveContent} />
          </Panel>
          <div className="grid two">
            <EditorPanel />
            <Panel title="Content Type"><ContentTypeCards /></Panel>
          </div>
        </div>
        <aside className="right-rail">
          <AiAssistantPanel />
          <RecentFilesPanel items={items} />
          <CollaboratorsPanel />
        </aside>
      </div>
    </>
  );
}

function ContentCalendarPage({ items, onOpenWorkflow }: { items: ContentItem[]; onOpenWorkflow: (kind: WorkflowKind, mode?: WorkflowRequest["mode"], initial?: WorkflowRequest["initial"], defaults?: WorkflowRequest["defaults"]) => void }) {
  return (
    <>
      <Toolbar buttons={["Today", "Channel: All", "Campaign: All", "Team: All", "Month", "Week"]} />
      <MetricGrid metrics={calendarMetrics} />
      <ManualContentCalendar items={items} onEdit={(item) => onOpenWorkflow("content", "edit", item)} />
      <div className="grid four compact-row">
        <Panel title="Campaign Timeline"><Bars /></Panel>
        <Panel title="Upcoming Deadlines"><DeadlineList /></Panel>
        <Panel title="Content Categories"><Donut label="128" /><List items={["Blog 28", "Social Media 46", "Email 32", "Video 14", "Webinar 6"]} /></Panel>
        <Panel title="Team Assignments"><List items={teamMembers.map((m, i) => `${m} ${28 - i * 4} items`)} /></Panel>
      </div>
    </>
  );
}

function AiGeneratorPage() {
  const [tab, setTab] = useState("Copy");
  return (
    <div className="content-layout">
      <div>
        <Panel title="">
          <div className="tabs" role="tablist" aria-label="AI generation mode">{["Copy", "Image", "Video", "Strategy"].map((item) => <button role="tab" aria-selected={tab === item} className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}</div>
          <label className="prompt-box">
            <span>Describe what you want to create</span>
            <textarea defaultValue="Write a Facebook ad for a summer sale promoting 25% off all eco-friendly products." />
            <button className="primary-btn">Generate</button>
          </label>
        </Panel>
        <div className="grid four settings-grid">
          <SettingsCard title="Content Settings" items={["Language: English (US)", "Audience: Small Business Owners", "Goal: Drive Conversions", "Length: Medium"]} />
          <Panel title="Tone / Style"><ChipGrid items={["Professional", "Friendly", "Confident", "Conversational", "Inspirational", "Witty"]} /></Panel>
          <SettingsCard title="Brand Voice" items={["1PM Brand Voice", "Voice Strength 70%", "Include Brand Keywords On", "Avoid Keywords"]} />
          <SettingsCard title="Advanced Options" items={["Creativity 7/10", "Variations 3", "AI Model 1PM Pro", "Recommended"]} />
        </div>
        <Panel title="Generated Assets" action="View all"><GeneratedAssets /></Panel>
        <div className="grid two"><Panel title="Recent Prompts"><List items={["Write a Facebook ad for summer sale", "Create 5 email subject lines", "Write a product description"]} /></Panel><Panel title="Performance Tips"><TipCard /></Panel></div>
      </div>
      <aside className="right-rail">
        <Panel title="Prompt Templates" action="View all"><TemplateList /></Panel>
        <Panel title="AI Performance This Month"><Donut label="92%" /><List items={["Total Generations 248", "Avg. Quality Score 8.6 / 10", "Time Saved 32.4 hrs", "18.3% vs last 30 days"]} /></Panel>
      </aside>
    </div>
  );
}

function CampaignsPage({ rows, onOpenWorkflow, onDeleteCampaign }: { rows: CampaignRow[]; onOpenWorkflow: (kind: WorkflowKind, mode?: WorkflowRequest["mode"], initial?: WorkflowRequest["initial"], defaults?: WorkflowRequest["defaults"]) => void; onDeleteCampaign: (row: CampaignRow) => void }) {
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignRow | null>(rows[0] ?? null);

  useEffect(() => {
    if (!rows.length) {
      setSelectedCampaign(null);
      return;
    }

    const selectedKey = selectedCampaign ? selectedCampaign.id ?? selectedCampaign.name : "";
    const nextSelected = rows.find((row) => (row.id ?? row.name) === selectedKey) ?? rows[0];

    if (nextSelected !== selectedCampaign) {
      setSelectedCampaign(nextSelected);
    }
  }, [rows, selectedCampaign]);

  return (
    <>
      <Toolbar buttons={["Export", "Filters", "Columns"]} />
      <MetricGrid metrics={campaignMetrics} />
      <div className="detail-layout">
        <div>
          <Panel title="All Campaigns" action={`${rows.length}`}><CampaignTable rows={rows} selected={selectedCampaign} onSelect={setSelectedCampaign} onOpenWorkflow={onOpenWorkflow} onDeleteCampaign={onDeleteCampaign} /></Panel>
          <div className="grid three">
            <Panel title="Campaign Funnel"><Funnel /><strong className="big-stat">19.7%</strong></Panel>
            <Panel title="Budget Allocation"><Donut label="$24,680" /><List items={["Paid Search $8,240", "Paid Social $6,780", "Instagram Ads $5,620", "Facebook Ads $2,789"]} /></Panel>
            <Panel title="Performance Overview"><LineChart three /></Panel>
          </div>
        </div>
        <aside className="right-rail"><CampaignDetail campaign={selectedCampaign} onEdit={() => selectedCampaign && onOpenWorkflow("campaign", "edit", selectedCampaign)} onDuplicate={() => selectedCampaign && onOpenWorkflow("campaign", "duplicate", selectedCampaign)} /></aside>
      </div>
    </>
  );
}

function AnalyticsPage() {
  return (
    <>
      <Toolbar buttons={["May 1 - May 24, 2025", "All Channels", "Add Filter"]} />
      <MetricGrid metrics={analyticMetrics} />
      <div className="detail-layout">
        <div>
          <div className="grid two"><Panel title="Performance Over Time"><Legend labels={["Sessions", "Conversions", "Revenue"]} /><LineChart three /></Panel><Panel title="Channel Attribution"><Donut label="6,842" /><List items={channelMix} /></Panel></div>
          <div className="grid three"><Panel title="Conversion Funnel"><Funnel /></Panel><Panel title="Audience Segments"><List items={["High-Value Customers 12.4K", "Engaged Visitors 34.7K", "New Visitors 98.7K", "At-Risk Users 4.1K"]} /></Panel><Panel title="Traffic Sources"><List items={["Google 62.4K", "Instagram 22.8K", "Direct 18.7K", "Facebook 15.3K", "Email 9.6K"]} /></Panel></div>
          <Panel title="Top Performing Content" action="Manual estimate"><SimpleRows rows={["5 Ways to Save Time with Automations", "Product Launch Campaign", "Spring Promo Video", "Ultimate Guide to Content Strategy", "Customer Success Story"]} /></Panel>
        </div>
        <aside className="right-rail"><InsightsPanel /><RecommendationsPanel /></aside>
      </div>
    </>
  );
}

function BrandAssetsPage() {
  return (
    <>
      <CategoryStrip items={["Logos 12", "Color Palette 8", "Typography 6", "Imagery 34", "Templates 18", "Icon Sets 24", "File Collections 9"]} />
      <div className="detail-layout">
        <div>
          <Panel title="Asset Library" action="Recently Updated"><AssetGrid /></Panel>
          <div className="grid three"><Panel title="Brand Guidelines"><MediaList /></Panel><Panel title="Version History"><Timeline /></Panel><Panel title="Recent Updates"><MediaList small /></Panel></div>
        </div>
        <aside className="right-rail"><BrandKitPanel /><ActivityPanel /></aside>
      </div>
    </>
  );
}

function SocialPostingPage({
  posts,
  campaigns,
  integrations,
  publishLogs,
  notifications,
  pendingAction,
  onOpenWorkflow,
  onUpdateStatus,
  onPublishPost,
  onToggleIntegration,
}: {
  posts: SocialPost[];
  campaigns: CampaignRow[];
  integrations: ChannelIntegration[];
  publishLogs: PublishLog[];
  notifications: OperationsNotification[];
  pendingAction: string;
  onOpenWorkflow: (kind: WorkflowKind, mode?: WorkflowRequest["mode"], initial?: WorkflowRequest["initial"], defaults?: WorkflowRequest["defaults"]) => void;
  onUpdateStatus: (post: SocialPost, status: string) => void;
  onPublishPost: (post: SocialPost) => void;
  onToggleIntegration: (integration: ChannelIntegration) => void;
}) {
  return (
    <div className="detail-layout">
      <div>
        <Toolbar buttons={["Select Channels", "Templates", "Media Library"]} />
        <ChannelStrip integrations={integrations} pendingAction={pendingAction} onToggleIntegration={onToggleIntegration} />
        <div className="grid two social-main"><ComposePanel onSchedule={(draft) => onOpenWorkflow("social", "create", undefined, { ...draft, title: "New Scheduled Post", status: "Queued", campaignId: campaigns[0]?.id ?? null })} /><PreviewPanel /></div>
        <PublishLogPanel logs={publishLogs} />
        <Panel title="Engagement Summary" action="Manual estimate"><MetricGrid metrics={overviewMetrics.slice(1)} compact /></Panel>
      </div>
      <aside className="right-rail">
        <QueuePanel posts={posts} integrations={integrations} pendingAction={pendingAction} onOpenWorkflow={onOpenWorkflow} onPublishPost={onPublishPost} />
        <ApprovalsPanel posts={posts} pendingAction={pendingAction} onUpdateStatus={onUpdateStatus} />
        <NotificationPanel notifications={notifications} />
      </aside>
    </div>
  );
}

function LocalMarketingPage() {
  const { t } = useI18n();
  const localMetrics: Metric[] = [
    { label: "Listing Health", value: "92%", trend: "8.4%", icon: ShieldCheck },
    { label: "Local Reach", value: "24.8K", trend: "18.7%", icon: Users },
    { label: "Average Rating", value: "4.6", trend: "0.3", icon: Star },
    { label: "Map Visibility", value: "85%", trend: "11.2%", icon: MapPin },
  ];
  return (
    <>
      <Toolbar buttons={["May 18 - May 24, 2025", "Add Location"]} />
      <div className="connection-banner"><AlertCircle /><span><strong>{t("Coming later.")}</strong> {t("Local Marketing is deferred until Google Business Profile and listings APIs are connected.")}</span></div>
      <MetricGrid metrics={localMetrics} />
      <div className="local-layout">
        <Panel title="Local Listings" action="Planned"><List items={["Google Business Profile Planned connection", "Bing Places Planned connection", "Apple Maps Planned connection", "Facebook Planned connection", "Yelp Planned connection", "Tripadvisor Planned connection"]} /></Panel>
        <Panel title="Local Map Visibility" className="span-2"><MapMock /></Panel>
        <Panel title="Local SEO Recommendations" action="View All" className="tall"><RecommendationCards /></Panel>
        <Panel title="Customer Reviews"><Reviews /></Panel>
        <Panel title="Local Campaign Tasks"><Checklist /></Panel>
        <Panel title="Your Locations"><LocationCards /></Panel>
      </div>
    </>
  );
}

function SettingsPage({ integrations, notifications, pendingAction, onToggleIntegration }: { integrations: ChannelIntegration[]; notifications: OperationsNotification[]; pendingAction: string; onToggleIntegration: (integration: ChannelIntegration) => void }) {
  const { t } = useI18n();
  const [tab, setTab] = useState("Workspace");
  return (
    <>
      <div className="settings-tabs" role="tablist" aria-label="Settings sections">{["Workspace", "Team", "Roles & Permissions", "Integrations", "Notifications", "Billing", "Security", "Preferences"].map((item) => <button role="tab" aria-selected={tab === item} key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{t(item)}</button>)}</div>
      <div className="settings-layout">
        <div><WorkspaceSettings /><PreferencePanel /></div>
        <div><TeamPanel /><IntegrationsPanel integrations={integrations} pendingAction={pendingAction} onToggleIntegration={onToggleIntegration} /></div>
        <aside className="right-rail"><NotificationPanel notifications={notifications} /><SubscriptionPanel /><SecurityPanel /></aside>
      </div>
    </>
  );
}

function MetricGrid({ metrics, compact = false }: { metrics: Metric[]; compact?: boolean }) {
  return <div className={`metric-grid ${compact ? "compact" : ""}`}>{metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div>;
}

function Toolbar({ buttons }: { buttons: string[] }) {
  const { t } = useI18n();
  return <div className="toolbar">{buttons.map((button) => <button key={button} aria-label={t(button)}>{t(button)}</button>)}</div>;
}

function Legend({ labels }: { labels: string[] }) {
  const { t } = useI18n();
  return <div className="legend">{labels.map((label) => <span key={label}>{t(label)}</span>)}</div>;
}

function List({ items }: { items: string[] }) {
  const { t } = useI18n();
  return <ul className="clean-list">{items.map((item) => <li key={item}><span>{t(item)}</span><small>↑</small></li>)}</ul>;
}

function ScheduleList() {
  const { t } = useI18n();
  return <div className="schedule"><div className="date-box">May<strong>24</strong></div>{["Product Launch Campaign", "Social Content Sprint", "Influencer Outreach"].map((item, i) => <div className="event" key={item}><span>{["10:00 AM", "1:00 PM", "3:30 PM"][i]}</span><strong>{t(item)}</strong><small>{t(["Review meeting", "Content creation", "Follow-ups"][i])}</small></div>)}</div>;
}

function PipelinePanel() {
  return <Panel title="Content Pipeline" action="View All"><List items={["Summer Promo Video In Review", "5 Ways to Save Time In Progress", "Client Success Story Scheduled", "Industry Trends Report Draft"]} /></Panel>;
}

function ActivityPanel() {
  return <Panel title="Recent Activity" action="View All"><List items={["New blog post published 2m ago", "Campaign Summer Promo launched 1h ago", "New lead captured 2h ago", "Instagram post published 3h ago", "Ad set paused 5h ago"]} /></Panel>;
}

function HealthPanel() {
  const { t } = useI18n();
  return <Panel title="Marketing Health" action="Manual estimate"><Donut label="87" /><h3>{t("Demo score")}</h3><p>{t("Health score becomes live after channel publishing and analytics are connected.")}</p><List items={["Content consistency Manual", "Engagement rate Estimated", "Brand visibility Estimated", "Lead quality Deferred"]} /><button className="wide-btn">{t("View Recommendations")}</button></Panel>;
}

function NotificationPanel({ notifications }: { notifications: OperationsNotification[] }) {
  const visible = notifications.slice(0, 4);
  return (
    <Panel title="Operations Alerts" action={`${notifications.filter((item) => item.status === "unread").length} unread`}>
      {visible.length ? (
        <div className="notification-list">
          {visible.map((item) => (
            <article key={item.id} className={`notification-card ${item.severity}`}>
              <AlertCircle />
              <div><strong>{item.title}</strong><p>{item.message}</p><small>{formatSchedule(item.createdAt)}</small></div>
            </article>
          ))}
        </div>
      ) : <EmptyState title="No alerts" description="Publish failures, reconnect reminders and approval tasks will appear here." />}
    </Panel>
  );
}

function KanbanBoard({ items, pendingAction, onOpenWorkflow, onApproveContent }: { items: Record<string, ContentItem[]>; pendingAction: string; onOpenWorkflow: (kind: WorkflowKind, mode?: WorkflowRequest["mode"], initial?: WorkflowRequest["initial"], defaults?: WorkflowRequest["defaults"]) => void; onApproveContent: (item: ContentItem, status: string, stage: string) => void }) {
  return (
    <div className="kanban">
      {Object.entries(items).map(([column, columnItems]) => (
        <section key={column} className="kanban-col">
          <h3>{column}<span>{columnItems.length}</span></h3>
          {columnItems.map((item) => (
            <article key={item.id ?? item.title} className="task-card">
              <FileText />
              <button className="task-title" onClick={() => onOpenWorkflow("content", "edit", item)}>{item.title}</button>
              <small>{item.type}</small>
              <em>{item.date}</em>
              {(column === "Review" || column === "Ready to Publish") && (
                <ApprovalActions
                  busy={pendingAction === `content:${item.id}`}
                  onApprove={() => onApproveContent(item, "Approved", "Ready to Publish")}
                  onChanges={() => onApproveContent(item, "Changes Requested", "Drafting")}
                />
              )}
            </article>
          ))}
          <AddTaskButton column={column} onOpenWorkflow={onOpenWorkflow} />
        </section>
      ))}
    </div>
  );
}

function AddTaskButton({ column, onOpenWorkflow }: { column: string; onOpenWorkflow: (kind: WorkflowKind, mode?: WorkflowRequest["mode"], initial?: WorkflowRequest["initial"], defaults?: WorkflowRequest["defaults"]) => void }) {
  const { t } = useI18n();
  return <button className="add-task-btn" aria-label={`${t("Add item")} ${column}`} onClick={() => onOpenWorkflow("content", "create", undefined, { stage: column, status: column === "Review" ? "In Review" : "Ideation" })}>+ {t("Add Item")}</button>;
}

function EditorPanel() {
  const { t } = useI18n();
  return <Panel title="Content Brief: How We Increased ROI by 300%" action="Share"><div className="editor-toolbar">{t("Heading 2 B I U Link Image Table")}</div><div className="doc"><h3>{t("1. Goal")}</h3><p>{t("Showcase how our data-driven strategy helped a client increase ROI by 300% in 6 months.")}</p><h3>{t("2. Target Audience")}</h3><p>{t("Marketing leaders and growth marketers in SaaS and eCommerce.")}</p><h3>{t("3. Key Messages")}</h3><p>{t("Data-driven strategy delivers measurable results. Full-funnel optimization increases efficiency and ROI.")}</p></div></Panel>;
}

function ContentTypeCards() {
  const { t } = useI18n();
  const items = ["Blog Post", "Social Post", "Email", "Video", "Ad Copy", "Case Study"];
  return <div className="type-grid">{items.map((item, index) => <button className={index === 0 ? "selected" : ""} key={item}><FileText />{t(item)}<small>{t(["SEO optimized", "Engagement focused", "Newsletter", "YouTube", "Paid campaigns", "Customer stories"][index])}</small></button>)}</div>;
}

function AiAssistantPanel() {
  const { t } = useI18n();
  return <Panel title="AI Assistant" action="BETA"><div className="tabs"><button className="active">{t("Suggestions")}</button><button>{t("Optimize")}</button></div>{["Improve headline impact", "Add internal links", "Include data visual"].map((item) => <article className="suggestion" key={item}><SparkLine /><strong>{t(item)}</strong><p>{t("Consider a specific outcome to increase performance.")}</p><button>{t("View suggestion")}</button></article>)}</Panel>;
}

function RecentFilesPanel({ items }: { items: ContentItem[] }) {
  const recent = items.slice(0, 3).map((item) => `${item.title} ${item.status ?? item.stage ?? "Draft"}`);
  return <Panel title="Recent Files" action={recent.length ? "View all" : undefined}>{recent.length ? <List items={recent} /> : <EmptyState title="No recent files" description="Create a content item to start your workspace history." />}</Panel>;
}

function CollaboratorsPanel() {
  return <Panel title="Collaborators" action="View all"><List items={["Ethan Parker Content Strategist", "Sophia Bennett Copywriter", "Noah Williams Designer"]} /><button className="wide-btn">Invite Collaborators</button></Panel>;
}

function Bars() {
  return <div className="bars">{["Product Launch Campaign", "Summer Promo", "Brand Awareness Initiative"].map((item, i) => <p key={item}><span>{item}</span><em style={{ width: `${42 + i * 14}%` }} /></p>)}</div>;
}

function DeadlineList() {
  return <List items={["Newsletter Copy Due Tomorrow", "Blog Post Review 2 days left", "Video Script Due 5 days left", "Email Content Approval 7 days left"]} />;
}

function SettingsCard({ title, items }: { title: string; items: string[] }) {
  return <Panel title={title}><List items={items} /></Panel>;
}

function ChipGrid({ items }: { items: string[] }) {
  return <div className="chip-grid">{items.map((item, i) => <button className={i === 0 ? "active" : ""} key={item}>{item}</button>)}</div>;
}

function GeneratedAssets() {
  return <div className="asset-row">{["Facebook Ad Copy", "Instagram Caption", "Email Subject Lines"].map((item) => <article className="generated" key={item}><StatusPill text={item.split(" ")[0]} /><p>{item === "Email Subject Lines" ? "Don't Miss 25% Off - Limited Time Only!" : "Summer Sale is here. Sustainable choices for a better tomorrow."}</p><button>Use</button></article>)}</div>;
}

function TipCard() {
  return <article className="tip-card"><TrendingIcon /><strong>Add specific numbers to increase engagement</strong><p>Content with numbers gets 36% more clicks.</p></article>;
}

function TrendingIcon() {
  return <span className="round-icon"><BarChart3 /></span>;
}

function TemplateList() {
  return <div>{aiTemplates.map(([name, desc]) => <article className="template" key={name}><Mail /><strong>{name}</strong><p>{desc}</p><Star /></article>)}<button className="wide-btn">Create Custom Template</button></div>;
}

function CampaignTable({ rows, selected, onSelect, onOpenWorkflow, onDeleteCampaign }: { rows: CampaignRow[]; selected: CampaignRow | null; onSelect: (row: CampaignRow) => void; onOpenWorkflow: (kind: WorkflowKind, mode?: WorkflowRequest["mode"], initial?: WorkflowRequest["initial"], defaults?: WorkflowRequest["defaults"]) => void; onDeleteCampaign: (row: CampaignRow) => void }) {
  return (
    <div className="table campaign-table">
      <div className="tr head"><span>Campaign</span><span>Status</span><span>Dates</span><span>Audience</span><span>Spend</span><span>Conversions</span><span>CPA</span><span>ROI</span><span>Actions</span></div>
      {rows.map((row) => (
        <div className={`tr ${selected && (selected.id ?? selected.name) === (row.id ?? row.name) ? "selected-row" : ""}`} key={row.id ?? row.name}>
          <button className="campaign-name" onClick={() => onSelect(row)}><Megaphone />{row.name}<small>{row.channel}</small></button>
          <span><StatusPill text={row.status} /></span>
          <span>{row.dates}</span>
          <span>{row.audience}</span>
          <span>{row.spend}<i /></span>
          <span>{row.conversions}</span>
          <span>{row.cpa}</span>
          <span className="green">{row.roi}</span>
          <RowActions onEdit={() => onOpenWorkflow("campaign", "edit", row)} onDuplicate={() => onOpenWorkflow("campaign", "duplicate", row)} onDelete={() => onDeleteCampaign(row)} />
        </div>
      ))}
    </div>
  );
}

function Funnel() {
  return <div className="funnel">{[90, 72, 55, 38, 22].map((w) => <span key={w} style={{ width: `${w}%` }} />)}</div>;
}

function CampaignDetail({ campaign, onEdit, onDuplicate }: { campaign: CampaignRow | null; onEdit: () => void; onDuplicate: () => void }) {
  if (!campaign) {
    return <Panel title="Campaign Detail"><p>No campaign selected.</p></Panel>;
  }

  return <Panel title={campaign.name} action={campaign.status}><div className="hero-icon"><Megaphone /></div><div className="progress large"><span style={{ width: "42%" }} /></div><List items={[`Campaign Goal ${campaign.notes || "Drive product awareness"}`, `Target Audience ${campaign.audience}`, `Channels ${campaign.channel}`, `Spend ${campaign.spend}`, `Conversions ${campaign.conversions}`, `ROI ${campaign.roi}`]} /><button className="primary-btn wide" onClick={onEdit}>Edit Campaign Details</button><button className="wide-btn" onClick={onDuplicate}>Duplicate Campaign</button></Panel>;
}

function SimpleRows({ rows }: { rows: string[] }) {
  return <div className="simple-rows">{rows.map((row, i) => <div key={row}><span className="thumb" /><strong>{row}</strong><span>{["Blog Post", "Landing Page", "Video", "Blog Post", "Case Study"][i]}</span><em>{["24.1K", "18.7K", "42.3K", "15.6K", "9.8K"][i]}</em></div>)}</div>;
}

function InsightsPanel() {
  return <Panel title="AI Insights"><List items={["Revenue is up 24.8%", "Paid Search is outperforming", "Email conversions up"]} /><button className="wide-btn">View All Insights</button></Panel>;
}

function RecommendationsPanel() {
  return <Panel title="Recommendations"><List items={["Increase budget on Paid Search", "Create more content for top topics", "Segment your email list"]} /><button className="wide-btn">View All Recommendations</button></Panel>;
}

function CategoryStrip({ items }: { items: string[] }) {
  return <div className="category-strip">{items.map((item) => <button key={item}><Palette />{item}</button>)}</div>;
}

function AssetGrid() {
  return <div className="asset-grid">{assetCards.map(([name, meta, type], i) => <article className={`asset-card ${i === 0 ? "selected" : ""}`} key={name}><div className={`asset-preview ${type}`}><span>{type === "type" ? "Aa" : type === "palette" ? "" : "1PM"}</span></div><strong>{name}</strong><small>{meta}</small><button className="asset-menu" aria-label={`More options for ${name}`}><MoreVertical /></button></article>)}</div>;
}

function MediaList({ small = false }: { small?: boolean }) {
  const items = small ? ["1PM Primary Logo.png", "Brand Guidelines v2.1.pdf", "Social Template Pack.zip"] : ["Brand Guidelines v2.1", "Brand Voice & Tone"];
  return <List items={items.map((item) => `${item} Updated May 20, 2025`)} />;
}

function Timeline() {
  return <div className="timeline">{["v2.1 Updated brand guidelines", "v2.0 Added logo variations", "v1.3 Updated typography"].map((item) => <p key={item}>{item}<small>by Olivia Morgan</small></p>)}</div>;
}

function BrandKitPanel() {
  return <Panel title="Brand Kit" action="Active"><div className="brand-kit-logo">1PM</div><h3>1PM Brand Kit</h3><p>Primary brand kit for all marketing and communications.</p><List items={["12 Logos", "8 Color Palettes", "6 Typography Styles", "34 Images", "18 Templates", "24 Icon Sets"]} /><button className="primary-btn wide"><Download /> Download Kit</button><button className="wide-btn">Share Brand Kit</button></Panel>;
}

function ChannelStrip({ integrations, pendingAction, onToggleIntegration }: { integrations: ChannelIntegration[]; pendingAction: string; onToggleIntegration: (integration: ChannelIntegration) => void }) {
  return (
    <Panel title="Channel Operations" action="Demo mode">
      <div className="channel-strip">
        {integrations.map((integration) => {
          const connected = integration.status === "connected" && integration.tokenHealth === "healthy";
          return (
            <article className={`channel-card ${connected ? "connected" : "needs-setup"}`} key={integration.id}>
              <div className="channel-head">
                <span className="channel-icon">{connected ? <Wifi /> : <WifiOff />}</span>
                <div><strong>{integration.name}</strong><small>{integration.accountName || "No account connected"}</small></div>
              </div>
              <StatusPill text={connected ? "Ready" : integration.status.replace("_", " ")} />
              <p>{integration.permissions}</p>
              <button disabled={pendingAction === `integration:${integration.id}`} onClick={() => onToggleIntegration(integration)}>{connected ? "Disconnect demo" : "Connect demo"}</button>
            </article>
          );
        })}
      </div>
    </Panel>
  );
}

function ComposePanel({ onSchedule }: { onSchedule: (draft: Pick<SocialPost, "copy" | "scheduledFor" | "mediaUrl">) => void }) {
  const [copy, setCopy] = useState("Big things are coming! We're excited to share new updates that will help you work smarter, create faster and grow stronger.\nStay tuned for what's next.");
  const [mediaUrl, setMediaUrl] = useState("");
  const [scheduledFor, setScheduledFor] = useState(() => toLocalDatetimeInput(new Date(Date.now() + 24 * 60 * 60 * 1000)));

  return (
    <Panel title="Compose Post" action="Text · Image · Schedule">
      <div className="composer-stack">
        <label className="composer-field">
          <span>Text</span>
          <textarea className="compose" aria-label="Post content" value={copy} onChange={(event) => setCopy(event.target.value)} />
        </label>
        <label className="composer-field">
          <span>Ảnh</span>
          <input type="url" value={mediaUrl} onChange={(event) => setMediaUrl(event.target.value)} placeholder="https://.../image.png hoặc link ảnh" />
        </label>
        <label className="composer-field">
          <span>Hẹn giờ</span>
          <input type="datetime-local" value={scheduledFor} onChange={(event) => setScheduledFor(event.target.value)} />
        </label>
        <div className="media-strip" aria-label="Selected media preview">
          {mediaUrl ? <span className="media-preview-filled"><Image />Ảnh đã thêm</span> : <span><Image />Chưa có ảnh</span>}
          <button type="button" aria-label="Add media" onClick={() => setMediaUrl("https://cdn.1pm.app/demo/social-post.png")}><Plus /> Thêm ảnh mẫu</button>
        </div>
        <div className="hashtag-row">{["# Marketing", "# Growth", "# DigitalMarketing", "# 1PMplatform"].map((tag) => <button key={tag}>{tag}</button>)}</div>
        <button className="primary-btn wide" onClick={() => onSchedule({ copy, mediaUrl, scheduledFor })}><CalendarDays /> Schedule Post</button>
      </div>
    </Panel>
  );
}

function PreviewPanel() {
  return <Panel title="Live Preview"><article className="social-preview"><div><Facebook />Facebook<button className="ghost-icon" aria-label="More post options"><MoreVertical /></button></div><p>Big things are coming! We're excited to share new updates that will help you work smarter, create faster and grow stronger.</p><div className="post-image">1PM<span>Smarter marketing. Better results.</span></div><footer>Like Comment Share</footer></article></Panel>;
}

function QueuePanel({ posts, integrations, pendingAction, onOpenWorkflow, onPublishPost }: { posts: SocialPost[]; integrations: ChannelIntegration[]; pendingAction: string; onOpenWorkflow: (kind: WorkflowKind, mode?: WorkflowRequest["mode"], initial?: WorkflowRequest["initial"], defaults?: WorkflowRequest["defaults"]) => void; onPublishPost: (post: SocialPost) => void }) {
  return (
    <Panel title="Posting Queue" action="View Calendar">
      <div className="queue-list">
        {posts.map((post) => (
          <article key={post.id ?? post.title}>
            <div>
              <strong>{post.title}</strong>
              <small>{formatSchedule(post.scheduledFor)} · {post.channel} · {channelReadiness(post.channel, integrations)}</small>
              {post.lastPublishError && <em>{post.lastPublishError}</em>}
            </div>
            <StatusPill text={post.publishStatus ?? post.status} />
            <span className="queue-actions">
              <button onClick={() => onOpenWorkflow("social", "edit", post)}>Edit</button>
              {post.status !== "Published" && (
                <button disabled={!post.id || pendingAction === `publish:${post.id}`} onClick={() => onPublishPost(post)}>{post.status === "Failed" ? "Retry" : "Publish now"}</button>
              )}
            </span>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function PublishLogPanel({ logs }: { logs: PublishLog[] }) {
  return (
    <Panel title="Publish Log" action={`${logs.length} events`}>
      {logs.length ? (
        <div className="publish-log">
          {logs.slice(0, 6).map((log) => (
            <article key={log.id} className={log.status}>
              <StatusPill text={log.status} />
              <div><strong>{log.channel}</strong><p>{log.message}</p><small>{formatSchedule(log.createdAt)}{log.externalPostId ? ` · ${log.externalPostId}` : ""}</small></div>
            </article>
          ))}
        </div>
      ) : <EmptyState title="No publish events" description="Publish attempts and failures will be logged here." />}
    </Panel>
  );
}

function ApprovalsPanel({ posts, pendingAction, onUpdateStatus }: { posts: SocialPost[]; pendingAction: string; onUpdateStatus: (post: SocialPost, status: string) => void }) {
  const reviewPosts = posts.filter((post) => ["Draft", "Pending Review", "Changes Requested"].includes(post.status)).slice(0, 4);
  return (
    <Panel title="Approvals" action="View All">
      <div className="approval-list">
        {(reviewPosts.length ? reviewPosts : posts.slice(0, 2)).map((post) => (
          <article key={post.id ?? post.title}>
            <strong>{post.title}</strong>
            <p>{post.owner ?? "Unassigned"} · {post.channel}</p>
            <StatusPill text={post.status} />
            <ApprovalActions busy={pendingAction === `social:${post.id}`} onApprove={() => onUpdateStatus(post, "Approved")} onChanges={() => onUpdateStatus(post, "Changes Requested")} />
          </article>
        ))}
      </div>
    </Panel>
  );
}

function TopPostPanel() {
  return <Panel title="Top Performing Post" action="View All"><div className="post-image small">1PM</div><List items={["Reach 78.4K", "Engagements 6.21K", "Eng. Rate 7.92%"]} /></Panel>;
}

function toLocalDatetimeInput(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

function contentStageForStatus(status: string) {
  if (status === "Published" || status === "Ready") return "Ready to Publish";
  if (status === "Scheduled") return "Review";
  return "Drafting";
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty-state"><FileText /><strong>{title}</strong><p>{description}</p></div>;
}

function MapMock() {
  return <div className="map-mock"><MapPin /><span /><span /><span /><div className="map-legend">Visibility Score<br />High 80-100%<br />Medium 50-79%<br />Low 0-49%</div></div>;
}

function RecommendationCards() {
  return <div className="recommendation-list">{["Complete Business Description", "Add More Local Keywords", "Get More Customer Reviews", "Add Photos to Your Listing", "Update Business Hours"].map((item, i) => <article key={item}><Target /><strong>{item}</strong><p>Improve local visibility and trust.</p><StatusPill text={i < 2 ? "High Impact" : i < 4 ? "Medium Impact" : "Low Impact"} /></article>)}<button className="primary-btn wide">Run Full Local SEO Audit</button></div>;
}

function Reviews() {
  return <div><h3>4.6 ★★★★★</h3><List items={["Sarah Johnson Excellent service", "Mike Thompson Great experience", "Emily Davis Highly recommend"]} /></div>;
}

function Checklist() {
  return <List items={["Google Post: Summer Offer Published", "Update Holiday Hours Due Soon", "Create June Special Promotion Pending", "Ask for Reviews Campaign Pending", "Local Event Sponsorship Post Pending"]} />;
}

function LocationCards() {
  return <div className="location-cards">{["Main Street Store", "Eastside Location", "West End Store"].map((item, i) => <article key={item}><span className="location-photo" /><strong>{item}</strong><p>{123 + i * 333} Main St, Portland, OR</p><small>★ 4.{7 - i} · {128 - i * 42} reviews · {92 - i * 6}%</small></article>)}</div>;
}

function WorkspaceSettings() {
  return <Panel title="Workspace Settings"><div className="form-grid"><label>Workspace Name<input defaultValue="Marketing Room" /></label><label>Workspace Slug<input defaultValue="marketing-room" /></label><label>Industry<select defaultValue="Marketing & Advertising"><option>Marketing & Advertising</option></select></label><label>Time Zone<select defaultValue="Eastern"><option>Eastern</option></select></label></div><div className="workspace-logo">MR <button>Upload Logo</button></div></Panel>;
}

function PreferencePanel() {
  return <Panel title="Workspace Preferences"><Toggle label="Enable AI content suggestions" on /><Toggle label="Auto-publish campaigns" /><Toggle label="Enable brand consistency" on /><button className="wide-btn">Reset to Defaults</button></Panel>;
}

function Toggle({ label, on = false }: { label: string; on?: boolean }) {
  return <label className="toggle"><span>{label}<small>Manage how your workspace behaves.</small></span><input type="checkbox" defaultChecked={on} /></label>;
}

function TeamPanel() {
  return <Panel title="Team Members" action="Invite Member"><div className="table members">{teamMembers.map((name, i) => <div className="tr" key={name}><span><span className="avatar mini" />{name}<small>{name.toLowerCase().replace(" ", ".")}@marketingroom.co</small></span><span>{["Admin", "Editor", "Manager", "Analyst", "Viewer"][i]}</span><span><StatusPill text={i === 4 ? "Pending" : "Active"} /></span></div>)}</div></Panel>;
}

function IntegrationsPanel({ integrations, pendingAction, onToggleIntegration }: { integrations: ChannelIntegration[]; pendingAction: string; onToggleIntegration: (integration: ChannelIntegration) => void }) {
  return (
    <Panel title="Channel Integrations" action="Demo connectors">
      <div className="integration-list">
        {integrations.map((integration) => {
          const ready = integration.status === "connected" && integration.tokenHealth === "healthy";
          return (
            <article key={integration.id}>
              <div className="channel-head">
                <span className="channel-icon">{ready ? <Wifi /> : <WifiOff />}</span>
                <div>
                  <strong>{integration.name}</strong>
                  <small>{integration.accountName || "No account connected"}</small>
                </div>
              </div>
              <StatusPill text={ready ? "Ready" : integration.status.replace("_", " ")} />
              <p>{integration.permissions}</p>
              <small>Token: {integration.tokenHealth} · Mode: {integration.setupMode}</small>
              <button disabled={pendingAction === `integration:${integration.id}`} onClick={() => onToggleIntegration(integration)}>{ready ? "Disconnect demo" : "Connect demo"}</button>
            </article>
          );
        })}
      </div>
    </Panel>
  );
}

function SubscriptionPanel() {
  return <Panel title="Subscription"><h3>$79 <small>/month</small></h3><List items={["Unlimited campaigns", "Advanced analytics", "AI content generation", "Priority support"]} /><button className="wide-btn">Manage Subscription</button></Panel>;
}

function StoragePanel() {
  return <Panel title="Workspace Storage"><p>68 GB of 100 GB used</p><div className="progress large"><span style={{ width: "68%" }} /></div><button className="wide-btn">Manage Storage</button></Panel>;
}

function SecurityPanel() {
  return <Panel title="Security & Access"><List items={["Two-factor authentication Enabled", "Active sessions 3 sessions", "Login activity View history", "API Keys Manage keys"]} /></Panel>;
}

export default App;
