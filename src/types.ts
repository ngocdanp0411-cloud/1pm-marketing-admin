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
  name: string;
  channel: string;
  status: string;
  dates: string;
  audience: string;
  spend: string;
  conversions: string;
  cpa: string;
  roi: string;
}

export interface ContentItem {
  title: string;
  type: string;
  date: string;
  status?: string;
}
