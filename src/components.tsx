import { Bell, ChevronDown, Command, Menu, Plus, Search } from "lucide-react";
import { pageMeta, navItems } from "./data";
import type { Metric, PageKey } from "./types";

interface ShellProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  apiStatus: "live" | "fallback" | "loading";
  onPrimaryAction?: (page: PageKey) => void;
  currentUser?: {
    name: string;
    role: string;
    email: string;
  };
  children: React.ReactNode;
}

export function AppShell({ activePage, onNavigate, sidebarOpen, setSidebarOpen, apiStatus, onPrimaryAction, currentUser, children }: ShellProps) {
  const [title, subtitle] = pageMeta[activePage];

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} onNavigate={onNavigate} open={sidebarOpen} onClose={() => setSidebarOpen(false)} currentUser={currentUser} />
      <main className="main">
        <TopBar title={title} subtitle={subtitle} apiStatus={apiStatus} currentUser={currentUser} onMenu={() => setSidebarOpen(true)} onPrimaryAction={() => onPrimaryAction?.(activePage)} primaryAction={activePage === "brand-assets" ? "New Brand Kit" : activePage === "local-marketing" ? "Add Location" : activePage === "social-posting" ? "New Post" : activePage === "content-studio" || activePage === "content-calendar" ? "New Content" : "New Campaign"} />
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
  return (
    <>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="brand-row">
          <div className="logo">1<span>PM</span></div>
          <button className="icon-btn" aria-label="Collapse sidebar"><ChevronDown className="rotate-90" /></button>
        </div>
        <button className="workspace">
          <span className="workspace-mark">MR</span>
          <span><strong>Marketing Room</strong><small>Personal Workspace</small></span>
          <ChevronDown />
        </button>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
          <button key={item.key} className={`nav-item ${activePage === item.key ? "active" : ""}`} aria-current={activePage === item.key ? "page" : undefined} onClick={() => { onNavigate(item.key); onClose(); }}>
                <Icon />
                <span>{item.label}</span>
                {activePage === item.key && <i />}
              </button>
            );
          })}
        </nav>
        <PlanCard />
        <UserCard compact user={currentUser} />
      </aside>
      {open && <button className="backdrop" aria-label="Close navigation" onClick={onClose} />}
    </>
  );
}

function TopBar({ title, subtitle, primaryAction, apiStatus, currentUser, onMenu, onPrimaryAction }: { title: string; subtitle: string; primaryAction: string; apiStatus: "live" | "fallback" | "loading"; currentUser?: { name: string; role: string; email: string }; onMenu: () => void; onPrimaryAction: () => void }) {
  return (
    <header className="topbar">
      <button className="mobile-menu icon-btn" aria-label="Open navigation" onClick={onMenu}><Menu /></button>
      <div className="heading">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="top-actions">
        <label className="search">
          <Search />
          <input aria-label="Search" placeholder="Search anything..." />
          <kbd><Command />K</kbd>
        </label>
        <span className={`api-badge ${apiStatus}`}>{apiStatus === "live" ? "Live API" : apiStatus === "loading" ? "Connecting" : "Local fallback"}</span>
        <button className="icon-btn notification" aria-label="Notifications"><Bell /><span /></button>
        <UserCard user={currentUser} />
        <button className="primary-btn" aria-label={`${primaryAction} menu`} onClick={onPrimaryAction}><Plus />{primaryAction}<ChevronDown /></button>
      </div>
    </header>
  );
}

function PlanCard() {
  return (
    <section className="plan-card">
      <div><strong>PRO PLAN</strong><span>68 / 100</span></div>
      <div className="progress"><span style={{ width: "68%" }} /></div>
      <small>Resets in 13 days</small>
      <button aria-label="Upgrade current pro plan">Upgrade Plan</button>
    </section>
  );
}

function UserCard({ compact = false, user }: { compact?: boolean; user?: { name: string; role: string; email: string } }) {
  const displayUser = user ?? {
    name: "Ngọc Dân",
    role: "Admin",
    email: "ngocdanp0411@gmail.com",
  };

  return (
    <button className={`user-card ${compact ? "compact" : ""}`}>
      <span className="avatar" />
      <span><strong>{displayUser.name}</strong><small>{compact ? displayUser.email : displayUser.role}</small></span>
      <ChevronDown />
    </button>
  );
}

export function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon;
  return (
    <section className="metric-card">
      <div className="metric-icon"><Icon /></div>
      <span>{metric.label}</span>
      <strong>{metric.value}</strong>
      <small className={metric.tone === "bad" ? "bad" : ""}>↑ {metric.trend} <em>vs last 30 days</em></small>
      <SparkLine />
    </section>
  );
}

export function Panel({ title, action, children, className = "" }: { title: string; action?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">
        <h2>{title}</h2>
        {action && <button>{action}</button>}
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
  return (
    <div className="donut" style={{ "--value": "76%" } as React.CSSProperties}>
      <span>{label}</span>
      <small>{label.includes("%") ? "Success Rate" : "/100"}</small>
    </div>
  );
}

export function StatusPill({ text }: { text: string }) {
  return <span className={`pill ${text.toLowerCase().replace(/\s+/g, "-")}`}>{text}</span>;
}
