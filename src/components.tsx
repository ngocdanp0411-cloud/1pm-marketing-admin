import { ChevronRight, Command, LogOut, Menu, Plus, Search, Settings, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { navItems, pageMeta } from "./data";
import type { Metric, PageKey } from "./types";

interface AppShellProps {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  apiStatus: "live" | "fallback" | "loading";
  currentUser?: { name: string; role: string; email: string };
  onLogout: () => Promise<void>;
  logoutBusy: boolean;
  onPrimaryAction: () => void;
  primaryAction?: string;
  primaryDisabled?: boolean;
  children: ReactNode;
}

export function AppShell(props: AppShellProps) {
  const [title, subtitle] = pageMeta[props.activePage];
  return (
    <div className="app-shell">
      <Sidebar {...props} />
      <main className="main" id="main-content">
        <TopBar
          title={title}
          subtitle={subtitle}
          activePage={props.activePage}
          onNavigate={props.onNavigate}
          apiStatus={props.apiStatus}
          currentUser={props.currentUser}
          onMenu={() => props.setSidebarOpen(true)}
          onLogout={props.onLogout}
          logoutBusy={props.logoutBusy}
          onPrimaryAction={props.onPrimaryAction}
          primaryAction={props.primaryAction}
          primaryDisabled={props.primaryDisabled}
        />
        <WelcomeStrip currentUser={props.currentUser} />
        <div className="page">{props.children}</div>
      </main>
    </div>
  );
}

function Sidebar({ activePage, onNavigate, sidebarOpen, setSidebarOpen, currentUser }: AppShellProps) {
  return (
    <>
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="brand-row">
          <div className="logo">1<span>PM</span></div>
          <button className="mobile-close icon-btn" aria-label="Đóng menu" onClick={() => setSidebarOpen(false)}><X /></button>
        </div>
        <div className="workspace">
          <span className="workspace-mark">MR</span>
          <span><strong>Marketing Room</strong><small>Workspace cá nhân</small></span>
        </div>
        <nav className="nav-list" aria-label="Điều hướng chính">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={`nav-item ${activePage === item.key ? "active" : ""}`}
                aria-current={activePage === item.key ? "page" : undefined}
                onClick={() => { onNavigate(item.key); setSidebarOpen(false); }}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-secondary">
          <button
            className={`nav-item ${activePage === "settings" ? "active" : ""}`}
            aria-current={activePage === "settings" ? "page" : undefined}
            onClick={() => { onNavigate("settings"); setSidebarOpen(false); }}
          >
            <Settings aria-hidden="true" />
            <span>Cài đặt</span>
          </button>
        </div>
        <div className="sidebar-user">
          <span className="avatar" aria-hidden="true" />
          <span><strong>{currentUser?.name ?? "Ngọc Dân"}</strong><small>{currentUser?.email ?? "Admin"}</small></span>
        </div>
      </aside>
      {sidebarOpen && <button className="backdrop" aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} />}
    </>
  );
}

interface TopBarProps {
  title: string;
  subtitle: string;
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  apiStatus: "live" | "fallback" | "loading";
  currentUser?: { name: string };
  onMenu: () => void;
  onLogout: () => Promise<void>;
  logoutBusy: boolean;
  onPrimaryAction: () => void;
  primaryAction?: string;
  primaryDisabled?: boolean;
}

function TopBar(props: TopBarProps) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    if (!normalized) return [];
    return [...navItems, { key: "settings" as const, label: "Cài đặt", icon: Settings }].filter((item) => {
      const [title, subtitle] = pageMeta[item.key];
      return `${item.label} ${title} ${subtitle}`.toLocaleLowerCase("vi").includes(normalized);
    });
  }, [query]);

  return (
    <header className="topbar">
      <button className="mobile-menu icon-btn" aria-label="Mở menu" onClick={props.onMenu}><Menu /></button>
      <div className="heading"><h1>{props.title}</h1><p>{props.subtitle}</p></div>
      <div className="top-actions">
        <div className="search" role="search">
          <Search aria-hidden="true" />
          <input
            name="global-search"
            autoComplete="off"
            aria-label="Tìm khu vực"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm khu vực…"
          />
          <kbd><Command />K</kbd>
          {query && (
            <div className="search-popover">
              {results.length ? results.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.key} onClick={() => { props.onNavigate(item.key); setQuery(""); }}>
                    <Icon /><span><strong>{item.label}</strong><small>{pageMeta[item.key][1]}</small></span>
                  </button>
                );
              }) : <p>Không tìm thấy khu vực phù hợp.</p>}
            </div>
          )}
        </div>
        <span className={`api-badge ${props.apiStatus}`}>{props.apiStatus === "live" ? "Đã kết nối" : props.apiStatus === "loading" ? "Đang kết nối…" : "Mất kết nối"}</span>
        <button className="icon-btn logout-button" aria-label="Đăng xuất" disabled={props.logoutBusy} onClick={() => void props.onLogout()}><LogOut /></button>
        {props.primaryAction && (
          <button className="primary-btn" disabled={props.primaryDisabled} onClick={props.onPrimaryAction}>
            <Plus />{props.primaryAction}{props.primaryDisabled && <small>Sắp có</small>}
          </button>
        )}
      </div>
    </header>
  );
}

const quotes = [
  "Chọn một việc quan trọng và đưa nó đến trạng thái tiếp theo.",
  "Một nội dung tốt bắt đầu từ bối cảnh Brand rõ ràng.",
  "Đều đặn, rõ ràng và có bước tiếp theo.",
  "Đừng quản lý nhiều bảng. Hãy quản lý một dòng chảy.",
];

function WelcomeStrip({ currentUser }: { currentUser?: { name: string } }) {
  const [now, setNow] = useState(() => new Date());
  const quote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const hour = now.getHours();
  const greeting = hour < 12 ? "Chào buổi sáng" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  const nameParts = (currentUser?.name ?? "Ngọc Dân").trim().split(/\s+/);
  const firstName = nameParts[nameParts.length - 1];
  return (
    <section className="welcome-strip" aria-label="Tóm tắt ngày">
      <strong>{greeting}, {firstName}</strong>
      <p>{quote}</p>
      <time>{new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" }).format(now)}</time>
    </section>
  );
}

export function Panel({ title, action, onAction, children, className = "" }: {
  title: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-head">
        <h2>{title}</h2>
        {action && onAction && <button onClick={onAction}>{action}<ChevronRight /></button>}
      </div>
      {children}
    </section>
  );
}

export function MetricCard({ metric }: { metric: Metric }) {
  const Icon = metric.icon;
  return (
    <section className={`metric-card ${metric.tone ?? ""}`}>
      <span className="metric-icon"><Icon /></span>
      <span>{metric.label}</span>
      <strong>{metric.value}</strong>
      <small>{metric.context}</small>
    </section>
  );
}

export function StatusPill({ text }: { text: string }) {
  return <span className={`pill status-${text.toLowerCase().replace(/\s+/g, "-")}`}>{text}</span>;
}
