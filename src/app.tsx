import { useEffect, useState } from "react";
import {
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
} from "lucide-react";
import { AppShell, Donut, LineChart, MetricCard, Panel, SparkLine, StatusPill } from "./components";
import {
  aiTemplates,
  assetCards,
  campaignRows,
  channelMix,
  contentWorkflow,
  integrations,
  overviewMetrics,
  pageIcons,
  studioMetrics,
  teamMembers,
} from "./data";
import { fetchOperationsBootstrap, type OperationsBootstrap } from "./operations-api";
import type { CampaignRow, Metric, PageKey } from "./types";

const analyticMetrics: Metric[] = [
  { label: "Total Sessions", value: "152.4K", trend: "14.6%", icon: Users },
  { label: "New Users", value: "98.7K", trend: "16.3%", icon: Users },
  { label: "Conversions", value: "6,842", trend: "22.7%", icon: Target },
  { label: "Conversion Rate", value: "4.49%", trend: "18.2%", icon: BarChart3 },
  { label: "Revenue", value: "$248.7K", trend: "24.8%", icon: Globe },
  { label: "ROAS", value: "4.37x", trend: "31.2%", icon: SparkLine as never },
];

const campaignMetrics: Metric[] = [
  { label: "Active Campaigns", value: "12", trend: "20%", icon: Send },
  { label: "Budget Used", value: "$24,680", trend: "16.8%", icon: Target },
  { label: "Conversions", value: "4,892", trend: "28.3%", icon: BarChart3 },
  { label: "CPA", value: "$5.04", trend: "8.1%", icon: Users },
  { label: "ROI", value: "4.37x", trend: "31.2%", icon: Target },
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
  const [activePage, setActivePage] = useState<PageKey>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bootstrap, setBootstrap] = useState<OperationsBootstrap | null>(null);
  const [apiStatus, setApiStatus] = useState<"live" | "fallback" | "loading">("loading");

  useEffect(() => {
    const controller = new AbortController();

    fetchOperationsBootstrap(controller.signal)
      .then((payload) => {
        setBootstrap(payload);
        setApiStatus("live");
      })
      .catch(() => {
        setApiStatus("fallback");
      });

    return () => controller.abort();
  }, []);

  const liveOverviewMetrics = bootstrap?.overviewMetrics?.length ? adaptOverviewMetrics(bootstrap.overviewMetrics) : overviewMetrics;
  const liveCampaignRows = bootstrap?.campaigns?.length ? bootstrap.campaigns : campaignRows;

  return (
    <AppShell activePage={activePage} onNavigate={setActivePage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} apiStatus={apiStatus}>
      {activePage === "overview" && <OverviewPage metrics={liveOverviewMetrics} />}
      {activePage === "content-studio" && <ContentStudioPage />}
      {activePage === "content-calendar" && <ContentCalendarPage />}
      {activePage === "ai-generator" && <AiGeneratorPage />}
      {activePage === "campaigns" && <CampaignsPage rows={liveCampaignRows} />}
      {activePage === "analytics" && <AnalyticsPage />}
      {activePage === "brand-assets" && <BrandAssetsPage />}
      {activePage === "social-posting" && <SocialPostingPage />}
      {activePage === "local-marketing" && <LocalMarketingPage />}
      {activePage === "settings" && <SettingsPage />}
    </AppShell>
  );
}

function adaptOverviewMetrics(apiMetrics: NonNullable<OperationsBootstrap["overviewMetrics"]>): Metric[] {
  const iconMap = {
    campaigns: Send,
    content: FileText,
    calendar: CalendarDays,
    social: Share2,
    local: MapPin,
  };

  return apiMetrics.map((metric, index) => ({
    label: metric.label,
    value: String(metric.value),
    trend: metric.context ?? "Live operations",
    icon: iconMap[metric.key as keyof typeof iconMap] ?? overviewMetrics[index % overviewMetrics.length].icon,
  }));
}

function OverviewPage({ metrics }: { metrics: Metric[] }) {
  return (
    <>
      <MetricGrid metrics={metrics} />
      <div className="grid overview-grid">
        <Panel title="Campaign Performance" action="Last 30 Days" className="span-2"><Legend labels={["Reach", "Engagement", "Conversions"]} /><LineChart /></Panel>
        <Panel title="Today's Schedule" action="View Calendar"><ScheduleList /></Panel>
        <PipelinePanel />
        <Panel title="Channel Mix"><Donut label="152.4K" /><List items={channelMix} /></Panel>
        <ActivityPanel />
        <HealthPanel />
      </div>
    </>
  );
}

function ContentStudioPage() {
  return (
    <>
      <MetricGrid metrics={studioMetrics} />
      <div className="content-layout">
        <div>
          <Panel title="Content Workflow" action="Board">
            <div className="board-tools"><button><Filter /> Filter</button><button><SlidersHorizontal /> Sort</button><button aria-label="More board options"><MoreVertical /></button></div>
            <KanbanBoard />
          </Panel>
          <div className="grid two">
            <EditorPanel />
            <Panel title="Content Type"><ContentTypeCards /></Panel>
          </div>
        </div>
        <aside className="right-rail">
          <AiAssistantPanel />
          <RecentFilesPanel />
          <CollaboratorsPanel />
        </aside>
      </div>
    </>
  );
}

function ContentCalendarPage() {
  const [selectedDay, setSelectedDay] = useState(14);
  return (
    <>
      <Toolbar buttons={["Today", "Channel: All", "Campaign: All", "Team: All", "Month", "Week"]} />
      <MetricGrid metrics={calendarMetrics} />
      <div className="calendar-layout">
        <Panel title="May 2025" className="calendar-panel"><CalendarGrid selectedDay={selectedDay} onSelect={setSelectedDay} /></Panel>
        <Panel title={`Wednesday, May ${selectedDay}, 2025`} className="day-panel"><DayDetails /></Panel>
      </div>
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

function CampaignsPage({ rows }: { rows: CampaignRow[] }) {
  return (
    <>
      <Toolbar buttons={["Export", "Filters", "Columns"]} />
      <MetricGrid metrics={campaignMetrics} />
      <div className="detail-layout">
        <div>
          <Panel title="All Campaigns" action={`${rows.length}`}><CampaignTable rows={rows} /></Panel>
          <div className="grid three">
            <Panel title="Campaign Funnel"><Funnel /><strong className="big-stat">19.7%</strong></Panel>
            <Panel title="Budget Allocation"><Donut label="$24,680" /><List items={["Paid Search $8,240", "Paid Social $6,780", "Instagram Ads $5,620", "Facebook Ads $2,789"]} /></Panel>
            <Panel title="Performance Overview"><LineChart three /></Panel>
          </div>
        </div>
        <aside className="right-rail"><CampaignDetail /></aside>
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
          <Panel title="Top Performing Content"><SimpleRows rows={["5 Ways to Save Time with Automations", "Product Launch Campaign", "Spring Promo Video", "Ultimate Guide to Content Strategy", "Customer Success Story"]} /></Panel>
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

function SocialPostingPage() {
  return (
    <div className="detail-layout">
      <div>
        <Toolbar buttons={["Select Channels", "Templates", "Media Library"]} />
        <div className="grid two social-main"><ComposePanel /><PreviewPanel /></div>
        <Panel title="Engagement Summary" action="Last 30 days"><MetricGrid metrics={overviewMetrics.slice(1)} compact /></Panel>
      </div>
      <aside className="right-rail"><QueuePanel /><ApprovalsPanel /><TopPostPanel /></aside>
    </div>
  );
}

function LocalMarketingPage() {
  const localMetrics: Metric[] = [
    { label: "Listing Health", value: "92%", trend: "8.4%", icon: ShieldCheck },
    { label: "Local Reach", value: "24.8K", trend: "18.7%", icon: Users },
    { label: "Average Rating", value: "4.6", trend: "0.3", icon: Star },
    { label: "Map Visibility", value: "85%", trend: "11.2%", icon: MapPin },
  ];
  return (
    <>
      <Toolbar buttons={["May 18 - May 24, 2025", "Add Location"]} />
      <MetricGrid metrics={localMetrics} />
      <div className="local-layout">
        <Panel title="Local Listings" action="View All"><List items={["Google Business Profile Connected", "Bing Places Connected", "Apple Maps Connected", "Facebook Connected", "Yelp Connected", "Tripadvisor Connected"]} /></Panel>
        <Panel title="Local Map Visibility" className="span-2"><MapMock /></Panel>
        <Panel title="Local SEO Recommendations" action="View All" className="tall"><RecommendationCards /></Panel>
        <Panel title="Customer Reviews"><Reviews /></Panel>
        <Panel title="Local Campaign Tasks"><Checklist /></Panel>
        <Panel title="Your Locations"><LocationCards /></Panel>
      </div>
    </>
  );
}

function SettingsPage() {
  const [tab, setTab] = useState("Workspace");
  return (
    <>
      <div className="settings-tabs" role="tablist" aria-label="Settings sections">{["Workspace", "Team", "Roles & Permissions", "Integrations", "Notifications", "Billing", "Security", "Preferences"].map((item) => <button role="tab" aria-selected={tab === item} key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>
      <div className="settings-layout">
        <div><WorkspaceSettings /><PreferencePanel /></div>
        <div><TeamPanel /><IntegrationsPanel /></div>
        <aside className="right-rail"><SubscriptionPanel /><StoragePanel /><SecurityPanel /></aside>
      </div>
    </>
  );
}

function MetricGrid({ metrics, compact = false }: { metrics: Metric[]; compact?: boolean }) {
  return <div className={`metric-grid ${compact ? "compact" : ""}`}>{metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div>;
}

function Toolbar({ buttons }: { buttons: string[] }) {
  return <div className="toolbar">{buttons.map((button) => <button key={button} aria-label={button}>{button}</button>)}</div>;
}

function Legend({ labels }: { labels: string[] }) {
  return <div className="legend">{labels.map((label) => <span key={label}>{label}</span>)}</div>;
}

function List({ items }: { items: string[] }) {
  return <ul className="clean-list">{items.map((item) => <li key={item}><span>{item}</span><small>↑</small></li>)}</ul>;
}

function ScheduleList() {
  return <div className="schedule"><div className="date-box">May<strong>24</strong></div>{["Product Launch Campaign", "Social Content Sprint", "Influencer Outreach"].map((item, i) => <div className="event" key={item}><span>{["10:00 AM", "1:00 PM", "3:30 PM"][i]}</span><strong>{item}</strong><small>{["Review meeting", "Content creation", "Follow-ups"][i]}</small></div>)}</div>;
}

function PipelinePanel() {
  return <Panel title="Content Pipeline" action="View All"><List items={["Summer Promo Video In Review", "5 Ways to Save Time In Progress", "Client Success Story Scheduled", "Industry Trends Report Draft"]} /></Panel>;
}

function ActivityPanel() {
  return <Panel title="Recent Activity" action="View All"><List items={["New blog post published 2m ago", "Campaign Summer Promo launched 1h ago", "New lead captured 2h ago", "Instagram post published 3h ago", "Ad set paused 5h ago"]} /></Panel>;
}

function HealthPanel() {
  return <Panel title="Marketing Health"><Donut label="87" /><h3>Excellent</h3><p>Your marketing engine is running strong.</p><List items={["Content consistency High", "Engagement rate High", "Brand visibility High", "Lead quality Good"]} /><button className="wide-btn">View Recommendations</button></Panel>;
}

function KanbanBoard() {
  return <div className="kanban">{Object.entries(contentWorkflow).map(([column, items]) => <section key={column} className="kanban-col"><h3>{column}<span>{items.length + 5}</span></h3>{items.map((item) => <article key={item.title} className="task-card"><FileText /><strong>{item.title}</strong><small>{item.type}</small><em>{item.date}</em></article>)}<button aria-label={`Add item to ${column}`}>+ Add Item</button></section>)}</div>;
}

function EditorPanel() {
  return <Panel title="Content Brief: How We Increased ROI by 300%" action="Share"><div className="editor-toolbar">Heading 2 B I U Link Image Table</div><div className="doc"><h3>1. Goal</h3><p>Showcase how our data-driven strategy helped a client increase ROI by 300% in 6 months.</p><h3>2. Target Audience</h3><p>Marketing leaders and growth marketers in SaaS and eCommerce.</p><h3>3. Key Messages</h3><p>Data-driven strategy delivers measurable results. Full-funnel optimization increases efficiency and ROI.</p></div></Panel>;
}

function ContentTypeCards() {
  const items = ["Blog Post", "Social Post", "Email", "Video", "Ad Copy", "Case Study"];
  return <div className="type-grid">{items.map((item, index) => <button className={index === 0 ? "selected" : ""} key={item}><FileText />{item}<small>{["SEO optimized", "Engagement focused", "Newsletter", "YouTube", "Paid campaigns", "Customer stories"][index]}</small></button>)}</div>;
}

function AiAssistantPanel() {
  return <Panel title="AI Assistant" action="BETA"><div className="tabs"><button className="active">Suggestions</button><button>Optimize</button></div>{["Improve headline impact", "Add internal links", "Include data visual"].map((item) => <article className="suggestion" key={item}><SparkLine /><strong>{item}</strong><p>Consider a specific outcome to increase performance.</p><button>View suggestion</button></article>)}</Panel>;
}

function RecentFilesPanel() {
  return <Panel title="Recent Files" action="View all"><List items={["Q2 Marketing Recap Blog", "Product Launch Deck Presentation", "Social Content Ideas Doc"]} /></Panel>;
}

function CollaboratorsPanel() {
  return <Panel title="Collaborators" action="View all"><List items={["Ethan Parker Content Strategist", "Sophia Bennett Copywriter", "Noah Williams Designer"]} /><button className="wide-btn">Invite Collaborators</button></Panel>;
}

function CalendarGrid({ selectedDay, onSelect }: { selectedDay: number; onSelect: (day: number) => void }) {
  const events = new Map([[5, "Case Study"], [6, "Instagram Post"], [7, "Email Campaign"], [9, "YouTube Video"], [12, "Newsletter"], [13, "Carousel Post"], [14, "Blog Post"], [15, "Product Update"], [16, "LinkedIn Article"], [19, "Instagram Reel"], [21, "Email Drip"], [23, "YouTube Short"], [26, "Blog Post"], [27, "Instagram Post"], [28, "Newsletter"], [29, "LinkedIn Post"], [30, "YouTube Video"]]);
  return <div className="calendar-grid">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <b key={d}>{d}</b>)}{Array.from({ length: 35 }, (_, i) => i < 3 ? 27 + i : i - 2).map((day, i) => <button aria-label={`Select May ${day}`} className={`${day === selectedDay ? "selected" : ""} ${day > 24 && i < 4 ? "muted" : ""}`} key={`${day}-${i}`} onClick={() => onSelect(day)}><span>{day}</span>{events.has(day) && <em>{events.get(day)}<small>{day % 2 ? "10:00 AM" : "9:00 AM"}</small></em>}</button>)}</div>;
}

function DayDetails() {
  return <div className="day-details"><h3>3 Items Scheduled</h3>{["Blog Post", "Story", "Product Update Email"].map((item, i) => <article key={item}><FileText /><strong>{item}</strong><span>{["10:00 AM", "4:00 PM", "9:00 AM (May 15)"][i]}</span><p>{["How AI is Shaping the Future of Marketing", "Behind the Scenes: Team Day", "May Product Updates & Improvements"][i]}</p><StatusPill text={i === 2 ? "Pending Approval" : "Scheduled"} /></article>)}<h3>Approval Status</h3><div className="stacked-bar"><span /><span /><span /></div><button className="wide-btn">View Day Details</button></div>;
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

function CampaignTable({ rows }: { rows: CampaignRow[] }) {
  return <div className="table"><div className="tr head"><span>Campaign</span><span>Status</span><span>Dates</span><span>Audience</span><span>Spend</span><span>Conversions</span><span>CPA</span><span>ROI</span></div>{rows.map((row) => <div className="tr" key={row.name}><span><Megaphone />{row.name}<small>{row.channel}</small></span><span><StatusPill text={row.status} /></span><span>{row.dates}</span><span>{row.audience}</span><span>{row.spend}<i /></span><span>{row.conversions}</span><span>{row.cpa}</span><span className="green">{row.roi}</span></div>)}</div>;
}

function Funnel() {
  return <div className="funnel">{[90, 72, 55, 38, 22].map((w) => <span key={w} style={{ width: `${w}%` }} />)}</div>;
}

function CampaignDetail() {
  return <Panel title="Product Launch Campaign" action="Active"><div className="hero-icon"><Megaphone /></div><div className="progress large"><span style={{ width: "42%" }} /></div><List items={["Campaign Goal Drive product awareness", "Target Audience Tech Enthusiasts", "Channels Google Search, Display Network", "Impressions 412,580", "Clicks 8,642", "ROI 5.12x"]} /><button className="primary-btn wide">View Campaign Details</button><button className="wide-btn">Duplicate Campaign</button></Panel>;
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

function ComposePanel() {
  return <Panel title="Compose Post"><textarea className="compose" aria-label="Post content" defaultValue={"Big things are coming! We're excited to share new updates that will help you work smarter, create faster and grow stronger.\nStay tuned for what's next."} /><div className="media-strip"><span /><span /><span /><button aria-label="Add media"><Plus /></button></div><div className="hashtag-row">{["# Marketing", "# Growth", "# DigitalMarketing", "# 1PMplatform"].map((tag) => <button key={tag}>{tag}</button>)}</div><button className="primary-btn wide">Schedule Post</button></Panel>;
}

function PreviewPanel() {
  return <Panel title="Live Preview"><article className="social-preview"><div><Facebook />Facebook<button className="ghost-icon" aria-label="More post options"><MoreVertical /></button></div><p>Big things are coming! We're excited to share new updates that will help you work smarter, create faster and grow stronger.</p><div className="post-image">1PM<span>Smarter marketing. Better results.</span></div><footer>Like Comment Share</footer></article></Panel>;
}

function QueuePanel() {
  return <Panel title="Posting Queue" action="View Calendar"><List items={["May 24 10:00 Product Launch Campaign", "May 24 1:00 Behind the Scenes", "May 24 3:30 Industry Insights", "May 25 11:00 Weekend Motivation"]} /></Panel>;
}

function ApprovalsPanel() {
  return <Panel title="Approvals" action="View All"><List items={["Ethan Walker Pending Review", "Sophia Bennett Approved"]} /></Panel>;
}

function TopPostPanel() {
  return <Panel title="Top Performing Post" action="View All"><div className="post-image small">1PM</div><List items={["Reach 78.4K", "Engagements 6.21K", "Eng. Rate 7.92%"]} /></Panel>;
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

function IntegrationsPanel() {
  return <Panel title="Integrations" action="View All Integrations"><div className="integration-grid">{integrations.map((item, i) => <button key={item}><Globe />{item}<StatusPill text={i === 4 ? "Connect" : "Connected"} /></button>)}</div></Panel>;
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
