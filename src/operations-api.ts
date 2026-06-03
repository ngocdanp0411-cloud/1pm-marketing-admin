import type { CampaignRow } from "./types";

export interface ApiOverviewMetric {
  key: string;
  label: string;
  value: string | number;
  context?: string;
}

export interface OperationsBootstrap {
  workspace?: {
    name: string;
    plan: string;
  };
  currentUser?: {
    name: string;
    role: string;
    email: string;
  };
  overviewMetrics?: ApiOverviewMetric[];
  campaigns?: CampaignRow[];
  contentItems?: unknown[];
  calendarEvents?: unknown[];
  brandAssets?: unknown[];
  teamMembers?: unknown[];
  integrations?: unknown[];
  socialQueue?: unknown[];
  localListings?: unknown[];
}

export async function fetchOperationsBootstrap(signal?: AbortSignal): Promise<OperationsBootstrap> {
  const response = await fetch("/api/bootstrap", {
    headers: {
      Authorization: "Bearer dev-1pm-token",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Operations API returned ${response.status}`);
  }

  const payload = await response.json();
  return (payload?.data ?? payload) as OperationsBootstrap;
}
