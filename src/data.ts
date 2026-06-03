import {
  BarChart3,
  Bot,
  CalendarDays,
  CheckCircle,
  FileText,
  FolderOpen,
  Gauge,
  Gem,
  Globe,
  Heart,
  Image,
  LayoutDashboard,
  Megaphone,
  Palette,
  PenTool,
  Send,
  Settings,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import type { CampaignRow, ContentItem, Metric, NavItem } from "./types";

export const navItems: NavItem[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "content-studio", label: "Content Studio", icon: FileText },
  { key: "content-calendar", label: "Content Calendar", icon: CalendarDays },
  { key: "ai-generator", label: "AI Generator", icon: Sparkles },
  { key: "campaigns", label: "Campaigns", icon: Megaphone },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "brand-assets", label: "Brand Assets", icon: Palette },
  { key: "social-posting", label: "Social Posting", icon: Share2 },
  { key: "local-marketing", label: "Local Marketing", icon: Target },
  { key: "settings", label: "Settings", icon: Settings },
];

export const pageMeta = {
  overview: ["Overview", "Your marketing command center"],
  "content-studio": ["Content Studio", "Plan, create, collaborate, and publish high-performing content."],
  "content-calendar": ["Content Calendar", "Plan, organize and schedule content across all channels."],
  "ai-generator": ["AI Generator", "Create high-performing content with the power of AI."],
  campaigns: ["Campaigns", "Create, manage and optimize your marketing campaigns."],
  analytics: ["Analytics", "Deep insights into your marketing performance."],
  "brand-assets": ["Brand Assets", "Manage your brand identity, assets and guidelines."],
  "social-posting": ["Social Posting", "Create, schedule and publish content across your social channels."],
  "local-marketing": ["Local Marketing", "Manage your local presence and grow in your community."],
  settings: ["Settings", "Manage your workspace, team and system preferences."],
} as const;

export const overviewMetrics: Metric[] = [
  { label: "Total Leads", value: "14,836", trend: "24.6%", icon: Users },
  { label: "Reach", value: "248.7K", trend: "18.3%", icon: Globe },
  { label: "Engagement", value: "8.62%", trend: "12.7%", icon: Heart },
  { label: "Campaign ROI", value: "4.37x", trend: "31.2%", icon: TrendingUp },
  { label: "Published Posts", value: "128", trend: "15.0%", icon: Send },
  { label: "Task Completion", value: "92%", trend: "8.4%", icon: CheckCircle },
];

export const studioMetrics: Metric[] = [
  { label: "Drafts", value: "24", trend: "26.1%", icon: FileText },
  { label: "Approved Content", value: "18", trend: "18.4%", icon: CheckCircle },
  { label: "In-Review Assets", value: "11", trend: "10.7%", icon: Gauge },
  { label: "Publish Rate", value: "92%", trend: "8.6%", icon: Target },
];

export const campaignRows: CampaignRow[] = [
  { name: "Product Launch Campaign", channel: "Paid Search", status: "Active", dates: "May 10 - Jun 10, 2025", audience: "Tech Enthusiasts", spend: "$8,240.50", conversions: "1,842", cpa: "$4.47", roi: "5.12x" },
  { name: "Summer Promo 2025", channel: "Instagram", status: "Active", dates: "May 01 - May 31, 2025", audience: "Millennials", spend: "$5,620.30", conversions: "1,102", cpa: "$5.10", roi: "3.89x" },
  { name: "B2B Lead Gen Q2", channel: "LinkedIn", status: "Active", dates: "Apr 20 - Jun 20, 2025", audience: "Business Owners", spend: "$6,780.00", conversions: "1,196", cpa: "$5.67", roi: "4.21x" },
  { name: "Newsletter Drive", channel: "Email Campaign", status: "Scheduled", dates: "May 28 - Jun 11, 2025", audience: "All Subscribers", spend: "$1,250.00", conversions: "-", cpa: "-", roi: "-" },
  { name: "Brand Awareness", channel: "Facebook", status: "Paused", dates: "Apr 05 - Apr 30, 2025", audience: "General Audience", spend: "$2,789.20", conversions: "752", cpa: "$3.71", roi: "2.98x" },
];

export const contentWorkflow: Record<string, ContentItem[]> = {
  Ideas: [
    { title: "Summer Promo Video", type: "Video - Campaign", date: "May 30" },
    { title: "5 Ways to Save Time", type: "Blog - Organic", date: "May 29" },
    { title: "Client Success Story", type: "Carousel - Social", date: "May 28" },
  ],
  Briefing: [
    { title: "Product Launch Email", type: "Email - Campaign", date: "May 24" },
    { title: "Social Content Sprint", type: "Social - Campaign", date: "May 24" },
    { title: "Influencer Outreach Plan", type: "Plan - Outreach", date: "May 23" },
  ],
  Drafting: [
    { title: "Industry Trends Report", type: "eBook - Lead Gen", date: "May 22" },
    { title: "How We Increased ROI", type: "Blog - SEO", date: "May 22" },
    { title: "Ad Set: Summer Promo", type: "Ad - Paid Social", date: "May 21" },
  ],
  Review: [
    { title: "Case Study: ACME", type: "Case Study - PDF", date: "May 20" },
    { title: "Newsletter - May 2025", type: "Email - Newsletter", date: "May 19" },
  ],
  "Ready to Publish": [
    { title: "Q2 Marketing Recap", type: "Blog - SEO", date: "May 18" },
    { title: "Product Demo Video", type: "Video - YouTube", date: "May 17" },
    { title: "Customer Testimonial", type: "Social - Organic", date: "May 16" },
  ],
};

export const aiTemplates = [
  ["Facebook Ad", "High-converting ad copy for Facebook campaigns."],
  ["Instagram Caption", "Engaging captions to boost reach and engagement."],
  ["Email Newsletter", "Compelling newsletters that drive clicks."],
  ["Product Description", "SEO-friendly product descriptions that sell."],
  ["Blog Post Intro", "Attention-grabbing introductions that hook readers."],
];

export const assetCards = [
  ["1PM Primary Logo", "PNG - 32 KB", "logo"],
  ["1PM Logo - Green", "SVG - 18 KB", "logo"],
  ["1PM Logo - White", "SVG - 18 KB", "logo"],
  ["1PM Dark Background", "JPG - 2.4 MB", "image"],
  ["1PM Brand Pattern", "PNG - 1.1 MB", "pattern"],
  ["Brand Guidelines v2.1", "PDF - 8.3 MB", "doc"],
  ["Typography Spec", "PDF - 2.1 MB", "type"],
  ["Color Palette", "ASE - 12 KB", "palette"],
  ["Social Template Pack", "ZIP - 45 MB", "template"],
  ["Icon Set - Outline", "SVG - 92 KB", "icons"],
];

export const teamMembers = ["Olivia Morgan", "Liam Carter", "Sophia Bennett", "Noah Williams", "Ava Martinez"];
export const channelMix = ["Organic Search 38%", "Social Media 28%", "Paid Ads 18%", "Direct 9%", "Email 5%", "Referral 2%"];
export const integrations = ["Google Analytics", "Meta Ads", "Google Ads", "Slack", "Zapier"];
export const pageIcons = { PenTool, Image, Bot, Gem, FolderOpen };
