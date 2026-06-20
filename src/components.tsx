import { useEffect, useMemo, useState } from "react";
import { Bell, ChevronDown, Command, LogOut, Menu, Plus, Search } from "lucide-react";
import { pageMeta, navItems } from "./data";
import { useI18n } from "./i18n";
import type { Metric, PageKey } from "./types";

const visitQuotes = [
  "Small daily actions compound into serious growth.",
  "Ship the important work before the urgent work steals the day.",
  "Marketing gets stronger when every action has a next step.",
  "Clear data, clear priorities, better decisions.",
  "Build momentum first. Optimize once the signal is real.",
  "A focused campaign beats a busy calendar.",
  "Consistency is the quiet engine behind every strong brand.",
  "One useful post can do more than ten rushed ones.",
];

interface ShellProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  apiStatus: "live" | "fallback" | "loading";
  onPrimaryAction?: (page: PageKey) => void;
  onLogout: () => Promise<void>;
  logoutBusy: boolean;
  currentUser?: {
    name: string;
    role: string;
    email: string;
  };
  children: React.ReactNode;
}

export function AppShell({ activePage, onNavigate, sidebarOpen, setSidebarOpen, apiStatus, onPrimaryAction, onLogout, logoutBusy, currentUser, children }: ShellProps) {
  const { t } = useI18n();
  const [title, subtitle] = pageMeta[activePage];
  const primaryAction = activePage === "brand-assets"
    ? "New Brand Kit"
    : activePage === "local-marketing"
      ? "Add Location"
      : activePage === "social-posting"
        ? "New Post"
        : activePage === "content-studio" || activePage === "content-calendar"
          ? "New Content"
          : "New Campaign";

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={onNavigate} open={sidebarOpen} onClose={() => setSidebarOpen(false)} currentUser={currentUser} />
      <main className="main">
        <TopBar title={t(title)} subtitle={t(subtitle)} apiStatus={apiStatus} currentUser={currentUser} onMenu={() => setSidebarOpen(true)} onNavigate={onNavigate} onLogout={onLogout} logoutBusy={logoutBusy} onPrimaryAction={() => onPrimaryAction?.(activePage)} primaryAction={t(primaryAction)} />
        <WelcomeStrip currentUser={currentUser} />
        <div className="page">{children}</div>
      </main>
    </div>
  );
}

interface SidebarProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  open: boolean;
  onClose: () => void;
  currentUser?: {
    name: string;
    role: string;
    email: string;
  };
}

function Sidebar({ activePage, onNavigate, open, onClose, currentUser }: SidebarProps) {
  const { t } = useI18n();
  return (
    <>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand-row">
          <div className="logo">1<span>PM</span></div>
          <button className="icon-btn" aria-label="Collapse sidebar"><ChevronDown className="rotate-90" /></button>
        </div>
        <button className="workspace">
          <span className="workspace-mark">MR</span>
          <span><strong>{t("Marketing Room")}</strong><small>{t("Personal Workspace")}</small></span>
          <ChevronDown />
        </button>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
          <button key={item.key} className={`nav-item ${activePage === item.key ? "active" : ""}`} aria-current={activePage === item.key ? "page" : undefined} onClick={() => { onNavigate(item.key); onClose(); }}>
                <Icon />
                <span>{t(item.label)}</span>
                {activePage === item.key && <i />}
              </button>
            );
          })}
        </nav>
        <UserCard compact user={currentUser} />
      </aside>
      {open && <button className="backdrop" aria-label="Close navigation" onClick={onClose} />}
    </>
  );
}

function TopBar({ title, subtitle, primaryAction, apiStatus, currentUser, onMenu, onNavigate, onLogout, logoutBusy, onPrimaryAction }: { title: string; subtitle: string; primaryAction: string; apiStatus: "live" | "fallback" | "loading"; currentUser?: { name: string; role: string; email: string }; onMenu: () => void; onNavigate: (page: PageKey) => void; onLogout: () => Promise<void>; logoutBusy: boolean; onPrimaryAction: () => void }) {
  const { language, toggleLanguage, t } = useI18n();
  const [query, setQuery] = useState("");
  const statusText = apiStatus === "live" ? "Live API" : apiStatus === "loading" ? "Connecting" : "Local fallback";
  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return navItems
      .map((item) => {
        const [pageTitle, pageSubtitle] = pageMeta[item.key];
        return { ...item, title: t(pageTitle), subtitle: t(pageSubtitle) };
      })
      .filter((item) => [item.label, item.title, item.subtitle].some((value) => value.toLowerCase().includes(normalized)))
      .slice(0, 5);
  }, [query, t]);

  return (
    <header className="topbar">
      <button className="mobile-menu icon-btn" aria-label="Open navigation" onClick={onMenu}><Menu /></button>
      <div className="heading">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="top-actions">
        <div className={`search ${query ? "has-query" : ""}`} role="search">
          <Search />
          <input aria-label="Search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("Search anything...")} />
          <kbd><Command />K</kbd>
          {query && (
            <div className="search-popover" role="listbox">
              {searchResults.length ? searchResults.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.key} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { onNavigate(item.key); setQuery(""); }}>
                    <Icon />
                    <span><strong>{item.title}</strong><small>{item.subtitle}</small></span>
                  </button>
                );
              }) : <p>{t("No matching pages")}</p>}
            </div>
          )}
        </div>
        <button className="language-toggle" type="button" onClick={toggleLanguage} aria-label="Switch language">
          {language === "vi" ? "VI" : "EN"}
        </button>
        <span className={`api-badge ${apiStatus}`}>{t(statusText)}</span>
        <button className="icon-btn notification" aria-label="Notifications"><Bell /><span /></button>
        <UserCard user={currentUser} />
        <button className="icon-btn logout-button" disabled={logoutBusy} title="Logout" aria-label="Logout" onClick={() => void onLogout()}>
          <LogOut />
        </button>
        <button className="primary-btn" aria-label={`${primaryAction} menu`} onClick={onPrimaryAction}><Plus />{primaryAction}<ChevronDown /></button>
      </div>
    </header>
  );
}

function WelcomeStrip({ currentUser }: { currentUser?: { name: string } }) {
  const { t } = useI18n();
  const [now, setNow] = useState(() => new Date());
  const quote = useMemo(() => visitQuotes[Math.floor(Math.random() * visitQuotes.length)], []);
  const firstName = getFirstName(currentUser?.name ?? "Ngọc Dân");
  const greeting = getTimeGreeting(now);
  const timeLabel = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="welcome-strip" aria-label="Daily briefing">
      <div>
        <span>{timeLabel}</span>
        <strong>{t(greeting)}, {firstName}</strong>
      </div>
      <p>{t(quote)}</p>
    </section>
  );
}

function getTimeGreeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getFirstName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}

function UserCard({ compact = false, user }: { compact?: boolean; user?: { name: string; role: string; email: string } }) {
  const { t } = useI18n();
  const displayUser = user ?? {
    name: "Ngọc Dân",
    role: "Admin",
    email: "ngocdanp0411@gmail.com",
  };

  return (
    <button className={`user-card ${compact ? "compact" : ""}`}>
      <span className="avatar" />
      <span><strong>{displayUser.name}</strong><small>{compact ? displayUser.email : t(displayUser.role)}</small></span>
      <ChevronDown />
    </button>
  );
}

export function MetricCard({ metric }: { metric: Metric }) {
  const { t } = useI18n();
  const Icon = metric.icon;
  return (
    <section className="metric-card">
      <div className="metric-icon"><Icon /></div>
      <div className="metric-copy">
        <span>{t(metric.label)}</span>
        <strong>{metric.value}</strong>
        <small className={metric.tone === "bad" ? "bad" : ""}>↑ {metric.trend} <em>{t("vs last 30 days")}</em></small>
      </div>
      <SparkLine />
    </section>
  );
}

export function Panel({ title, action, children, className = "" }: { title: string; action?: string; children: React.ReactNode; className?: string }) {
  const { t } = useI18n();
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">
        <h2>{t(title)}</h2>
        {action && <button>{t(action)}</button>}
      </div>
      {children}
    </section>
  );
}

export function SparkLine() {
  return (
    <svg className="sparkline" viewBox="0 0 120 44" aria-hidden="true">
      <path d="M2 36 C18 34,18 24,30 27 S47 11,59 19 S75 32,88 18 S103 25,118 6" />
    </svg>
  );
}

export function LineChart({ three = false }: { three?: boolean }) {
  return (
    <div className="line-chart">
      <svg viewBox="0 0 760 260" role="img" aria-label="Performance line chart">
        {[40, 80, 120, 160, 200].map((y) => <line key={y} x1="40" y1={y} x2="740" y2={y} />)}
        <path className="area" d="M40 210 C85 190 100 150 132 160 S180 135 210 145 S270 130 300 90 S360 160 410 112 S490 60 520 86 S600 150 650 94 S705 70 740 24 L740 230 L40 230 Z" />
        <path className="line main-line" d="M40 210 C85 190 100 150 132 160 S180 135 210 145 S270 130 300 90 S360 160 410 112 S490 60 520 86 S600 150 650 94 S705 70 740 24" />
        <path className="line lime-line" d="M40 220 C120 180 180 190 240 170 S350 160 410 135 S520 150 590 125 S680 110 740 98" />
        {three && <path className="line blue-line" d="M40 230 C130 210 190 190 260 198 S400 160 460 176 S560 144 620 134 S700 122 740 112" />}
      </svg>
    </div>
  );
}

export function Donut({ label = "92%" }: { label?: string }) {
  const { t } = useI18n();
  return (
    <div className="donut" style={{ "--value": "76%" } as React.CSSProperties}>
      <span>{label}</span>
      <small>{label.includes("%") ? t("Success Rate") : "/100"}</small>
    </div>
  );
}

export function StatusPill({ text }: { text: string }) {
  const { t } = useI18n();
  return <span className={`pill ${text.toLowerCase().replace(/\s+/g, "-")}`}>{t(text)}</span>;
}
