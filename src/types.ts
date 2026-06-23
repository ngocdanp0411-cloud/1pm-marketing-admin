import type { LucideIcon } from "lucide-react";

export type PageKey = "today" | "content" | "calendar" | "campaigns" | "brands" | "channels" | "settings";
export type ContentStatus = "Brief" | "Draft" | "Review" | "Ready" | "Scheduled" | "Published" | "Failed";

export interface NavItem {
  key: PageKey;
  label: string;
  icon: LucideIcon;
}

export interface Metric {
  label: string;
  value: string;
  context: string;
  icon: LucideIcon;
  tone?: "good" | "warn" | "bad";
}

export interface Brand {
  id?: string;
  name: string;
  shortDescription?: string;
  positioning?: string;
  targetAudience?: string;
  brandVoice?: string;
  toneMood?: string;
  visualStyleNotes?: string;
  colors?: string;
  defaultCTA?: string;
  defaultHashtags?: string;
  doList?: string;
  dontList?: string;
  checklistTemplate?: string;
  contentPillars?: string;
  promptStyleNotes?: string;
  assetNotes?: string;
}

export interface Channel {
  id?: string;
  brandId: string;
  platform: string;
  pageName: string;
  handle?: string;
  url?: string;
  connectionStatus?: string;
  postingRules?: string;
  defaultFormat?: string;
  defaultHashtags?: string;
  bestPostingTimeNotes?: string;
  ctaNotes?: string;
}

export interface CampaignRow {
  id?: string;
  brandId: string;
  name: string;
  objective?: string;
  keyMessage?: string;
  status: string;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string;
  dates?: string;
  channel?: string;
  audience?: string;
  spend?: string;
  conversions?: string;
  cpa?: string;
  roi?: string;
}

export interface ContentItem {
  id?: string;
  brandId: string;
  channelId?: string | null;
  campaignId?: string | null;
  title: string;
  contentType: string;
  type?: string;
  copy?: string;
  mediaUrl?: string | null;
  visualPromptNotes?: string;
  visualNotes?: string;
  copyPromptNotes?: string;
  copyNotes?: string;
  status: ContentStatus | string;
  scheduledAt?: string | null;
  scheduledFor?: string | null;
  publishedUrl?: string;
  learningNote?: string;
  reusable?: boolean;
  tags?: string;
  checklistItems?: string[];
  date?: string | null;
  stage?: string;
  owner?: string;
  channel?: string;
  summary?: string;
  source?: string;
}

export interface PublishLog {
  id: string;
  postId?: string | null;
  contentId?: string | null;
  channel?: string;
  channelId?: string | null;
  status: string;
  message?: string;
  note?: string;
  externalPostId?: string | null;
  publishedAt?: string | null;
  publishedUrl?: string;
  createdAt: string;
}

export interface ChannelIntegration {
  id: string;
  provider: string;
  name: string;
  accountName: string;
  status: string;
  pageId?: string | null;
  permissions: string;
  tokenHealth: string;
  setupMode: string;
  lastSync?: string | null;
  connectedAt?: string | null;
}

export interface OperationsNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  relatedId?: string | null;
  createdAt: string;
}
