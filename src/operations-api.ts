import type { CampaignRow, ChannelIntegration, ContentItem, OperationsNotification, PublishLog, SocialPost } from "./types";

type ResourceName = "campaigns" | "content" | "social-posts" | "integrations" | "notifications";

type ResourceRecordMap = {
  campaigns: CampaignRow;
  content: ContentItem;
  "social-posts": SocialPost;
  integrations: ChannelIntegration;
  notifications: OperationsNotification;
};

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
  contentItems?: ContentItem[];
  calendarEvents?: unknown[];
  brandAssets?: unknown[];
  teamMembers?: unknown[];
  integrations?: ChannelIntegration[];
  publishLogs?: PublishLog[];
  notifications?: OperationsNotification[];
  socialQueue?: SocialPost[];
  localListings?: unknown[];
}

export async function fetchOperationsBootstrap(signal?: AbortSignal): Promise<OperationsBootstrap> {
  return apiRequest<OperationsBootstrap>("/api/bootstrap", { signal });
}

export function createRecord<TResource extends ResourceName>(
  resourceName: TResource,
  payload: Partial<ResourceRecordMap[TResource]>,
): Promise<ResourceRecordMap[TResource]> {
  return apiRequest<ResourceRecordMap[TResource]>(`/api/${resourceName}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateRecord<TResource extends ResourceName>(
  resourceName: TResource,
  id: string,
  payload: Partial<ResourceRecordMap[TResource]>,
): Promise<ResourceRecordMap[TResource]> {
  return apiRequest<ResourceRecordMap[TResource]>(`/api/${resourceName}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteRecord(resourceName: ResourceName, id: string): Promise<{ id: string; deleted: true }> {
  return apiRequest<{ id: string; deleted: true }>(`/api/${resourceName}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function publishSocialPost(id: string): Promise<{
  post: SocialPost;
  log: PublishLog;
  notification: OperationsNotification;
  integration: ChannelIntegration | null;
}> {
  return apiRequest(`/api/social-posts/${encodeURIComponent(id)}/publish`, {
    method: "POST",
  });
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer dev-1pm-token",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const message = await readErrorMessage(response);
    throw new Error(message || `Operations API returned ${response.status}`);
  }

  const payload = await response.json();
  return (payload?.data ?? payload) as T;
}

async function readErrorMessage(response: Response) {
  try {
    const payload = await response.json();
    return payload?.error?.message ?? payload?.message;
  } catch {
    return "";
  }
}
