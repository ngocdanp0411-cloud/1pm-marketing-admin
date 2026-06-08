import { seedCampaigns, seedContentItems } from "./seed-primary-records.js";
import {
  seedBrandAssets,
  seedCalendarEvents,
  seedIntegrations,
  seedLocalListings,
  seedNotifications,
  seedPublishLogs,
  seedSocialQueue,
  seedTeamMembers,
} from "./seed-supporting-records.js";

export function createSeedState() {
  return {
    workspace: {
      id: "workspace-1pm",
      name: "1PM Marketing Command Center",
      slug: "1pm-marketing-command-center",
      timezone: "Asia/Ho_Chi_Minh",
      currency: "USD",
      environment: "development",
    },
    currentUser: {
      id: "user-dev-1pm",
      name: "Ngọc Dân",
      email: "ngocdanp0411@gmail.com",
      role: "Admin",
    },
    campaigns: seedCampaigns,
    contentItems: seedContentItems,
    calendarEvents: seedCalendarEvents,
    brandAssets: seedBrandAssets,
    teamMembers: seedTeamMembers,
    integrations: seedIntegrations,
    publishLogs: seedPublishLogs,
    notifications: seedNotifications,
    socialQueue: seedSocialQueue,
    localListings: seedLocalListings,
  };
}
