import type { LucideIcon } from "lucide-react";

export type PageKey =
  | "overview"
  | "content-studio"
  | "content-calendar"
  | "ai-generator"
  | "campaigns"
  | "analytics"
  | "brand-assets"
  | "social-posting"
  | "local-marketing"
  | "settings";

export interface NavItem {
  key: PageKey;
  label: string;
  icon: LucideIcon;
}

export interface Metric {
  label: string;
  value: string;
  trend: string;
  icon: LucideIcon;
  tone?: "good" | "warn" | "bad";
}

export interface CampaignRow {
  id?: string;
  name: string;
  channel: string;
  status: string;
  dates: string;
  startDate?: string | null;
  endDate?: string | null;
  audience: string;
  spend: string;
  conversions: string;
  cpa: string;
  roi: string;
  notes?: string;
}

export interface ContentItem {
  id?: string;
  title: string;
  type: string;
  date: string;
  status?: string;
  stage?: string;
  owner?: string;
  channel?: string;
  campaignId?: string | null;
  summary?: string;
}

export interface SocialPost {
  id?: string;
  title: string;
  channel: string;
  status: string;
  publishStatus?: "Draft" | "Scheduled" | "Publishing" | "Published" | "Failed" | "Cancelled" | string;
  scheduledFor?: string | null;
  owner?: string;
  copy?: string;
  campaignId?: string | null;
  lastPublishError?: string;
  publishedAt?: string | null;
  externalPostId?: string | null;
}

export interface ChannelIntegration {
  id: string;
  provider: string;
  name: string;
  accountName: string;
  status: "connected" | "needs_setup" | "attention" | "disconnected" | string;
  pageId?: string | null;
  permissions: string;
  tokenHealth: "healthy" | "missing" | "expires_soon" | "invalid" | string;
  setupMode: "demo" | "live" | string;
  lastSync?: string | null;
  connectedAt?: string | null;
}

export interface PublishLog {
  id: string;
  postId: string;
  channel: string;
  status: "published" | "failed" | "publishing" | string;
  message: string;
  externalPostId?: string | null;
  createdAt: string;
}

export interface OperationsNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "info" | "success" | "warning" | "error" | string;
  status: "read" | "unread" | string;
  relatedId?: string | null;
  createdAt: string;
}
