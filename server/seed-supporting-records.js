export const seedCalendarEvents = [
  {
    id: "event-standup",
    title: "Campaign Standup",
    date: "2026-06-03",
    startTime: "09:00",
    endTime: "09:30",
    status: "Scheduled",
    channel: "Internal",
    owner: "Olivia Morgan",
    campaignId: "campaign-launch-2026",
    notes: "Daily cross-functional sync.",
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "event-email-review",
    title: "Launch Email Review",
    date: "2026-06-04",
    startTime: "11:00",
    endTime: "11:45",
    status: "Scheduled",
    channel: "Email",
    owner: "Sophia Bennett",
    campaignId: "campaign-launch-2026",
    notes: "Final copy and QA sign-off.",
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z",
  },
  {
    id: "event-reel-shoot",
    title: "Reel Production Shoot",
    date: "2026-06-05",
    startTime: "14:00",
    endTime: "16:00",
    status: "Scheduled",
    channel: "Instagram",
    owner: "Ava Martinez",
    campaignId: "campaign-social-2026",
    notes: "Studio capture for new reel sequence.",
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-01T08:00:00.000Z",
  },
];

export const seedBrandAssets = [
  { id: "asset-logo-primary", name: "1PM Primary Logo", type: "PNG", size: "32 KB", updatedAt: "2026-05-24T10:00:00.000Z", url: "/assets/brand/logo-primary.png" },
  { id: "asset-logo-green", name: "1PM Logo Green", type: "SVG", size: "18 KB", updatedAt: "2026-05-24T10:00:00.000Z", url: "/assets/brand/logo-green.svg" },
  { id: "asset-guidelines", name: "Brand Guidelines v2.1", type: "PDF", size: "8.3 MB", updatedAt: "2026-05-20T10:00:00.000Z", url: "/assets/brand/guidelines-v2-1.pdf" },
  { id: "asset-template-pack", name: "Social Template Pack", type: "ZIP", size: "45 MB", updatedAt: "2026-05-22T10:00:00.000Z", url: "/assets/brand/social-template-pack.zip" },
];

export const seedTeamMembers = [
  { id: "member-olivia", name: "Olivia Morgan", role: "Marketing Director", status: "online", focus: "Launch oversight" },
  { id: "member-liam", name: "Liam Carter", role: "Performance Lead", status: "online", focus: "Paid acquisition" },
  { id: "member-sophia", name: "Sophia Bennett", role: "Lifecycle Manager", status: "busy", focus: "Email and CRM" },
  { id: "member-noah", name: "Noah Williams", role: "Content Strategist", status: "online", focus: "Thought leadership" },
  { id: "member-ava", name: "Ava Martinez", role: "Creative Producer", status: "offline", focus: "Video and social" },
];

export const seedIntegrations = [
  { id: "integration-ga4", name: "Google Analytics", status: "connected", lastSync: "2026-06-02T08:45:00.000Z" },
  { id: "integration-meta", name: "Meta Ads", status: "connected", lastSync: "2026-06-02T08:30:00.000Z" },
  { id: "integration-google-ads", name: "Google Ads", status: "connected", lastSync: "2026-06-02T08:40:00.000Z" },
  { id: "integration-slack", name: "Slack", status: "connected", lastSync: "2026-06-02T08:15:00.000Z" },
  { id: "integration-zapier", name: "Zapier", status: "attention", lastSync: "2026-06-02T07:50:00.000Z" },
];

export const seedSocialQueue = [
  {
    id: "social-linkedin-report",
    title: "LinkedIn Report Teaser",
    channel: "LinkedIn",
    status: "Queued",
    scheduledFor: "2026-06-03T15:00:00.000Z",
    owner: "Noah Williams",
    copy: "New report drops tomorrow. Here is the one chart revenue leaders keep asking for.",
    campaignId: "campaign-b2b-2026",
    createdAt: "2026-06-01T12:00:00.000Z",
    updatedAt: "2026-06-01T12:00:00.000Z",
  },
  {
    id: "social-instagram-demo",
    title: "Instagram Demo Reel",
    channel: "Instagram",
    status: "Approved",
    scheduledFor: "2026-06-03T09:30:00.000Z",
    owner: "Ava Martinez",
    copy: "A 20-second look at the workflow that replaces scattered campaign ops.",
    campaignId: "campaign-social-2026",
    createdAt: "2026-06-01T12:05:00.000Z",
    updatedAt: "2026-06-01T12:05:00.000Z",
  },
  {
    id: "social-x-launch",
    title: "Launch Countdown Thread",
    channel: "X",
    status: "Draft",
    scheduledFor: "2026-06-04T13:00:00.000Z",
    owner: "Olivia Morgan",
    copy: "Three days until launch. Here is what the team changed after the beta cohort.",
    campaignId: "campaign-launch-2026",
    createdAt: "2026-06-01T12:10:00.000Z",
    updatedAt: "2026-06-01T12:10:00.000Z",
  },
];

export const seedLocalListings = [
  { id: "listing-hcmc", location: "Ho Chi Minh City HQ", status: "Healthy", rating: 4.8, reviews: 214, lastUpdated: "2026-06-01T06:00:00.000Z" },
  { id: "listing-singapore", location: "Singapore Office", status: "Needs Review", rating: 4.4, reviews: 88, lastUpdated: "2026-05-30T06:00:00.000Z" },
  { id: "listing-austin", location: "Austin Partner Hub", status: "Healthy", rating: 4.7, reviews: 121, lastUpdated: "2026-05-31T06:00:00.000Z" },
];
