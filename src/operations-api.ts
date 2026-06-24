import type {
  Brand,
  CampaignRow,
  Channel,
  ContentItem,
  OperationsNotification,
  PublishLog,
} from "./types";

type ResourceName = "brands" | "channels" | "campaigns" | "content" | "notifications";
type ResourceRecordMap = {
  brands: Brand;
  channels: Channel;
  campaigns: CampaignRow;
  content: ContentItem;
  notifications: OperationsNotification;
};

export interface AuthStatus {
  authenticated: boolean;
}

export interface ApiOverviewMetric {
  key: string;
  label: string;
  value: string | number;
  context?: string;
}

export interface OperationsBootstrap {
  workspace?: { name: string; timezone?: string; plan?: string };
  currentUser?: { name: string; role: string; email: string };
  overviewMetrics?: ApiOverviewMetric[];
  brands?: Brand[];
  channels?: Channel[];
  campaigns?: CampaignRow[];
  contentItems?: ContentItem[];
  publishLogs?: PublishLog[];
  notifications?: OperationsNotification[];
}

export interface UploadedMedia {
  filename: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  url: string;
}

export function fetchOperationsBootstrap(signal?: AbortSignal): Promise<OperationsBootstrap> {
  return apiRequest("/api/bootstrap", { signal });
}

export function fetchAuthStatus(signal?: AbortSignal): Promise<AuthStatus> {
  return apiRequest("/api/auth/me", { signal });
}

export function loginWithPassword(password: string): Promise<AuthStatus> {
  return apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify({ password }) });
}

export function logoutSession(): Promise<AuthStatus> {
  return apiRequest("/api/auth/logout", { method: "POST" });
}

export function createRecord<TResource extends ResourceName>(
  resourceName: TResource,
  payload: Partial<ResourceRecordMap[TResource]>,
): Promise<ResourceRecordMap[TResource]> {
  return apiRequest(`/api/${resourceName}`, { method: "POST", body: JSON.stringify(payload) });
}

export function updateRecord<TResource extends ResourceName>(
  resourceName: TResource,
  id: string,
  payload: Partial<ResourceRecordMap[TResource]>,
): Promise<ResourceRecordMap[TResource]> {
  return apiRequest(`/api/${resourceName}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteRecord(resourceName: ResourceName, id: string): Promise<{ id: string; deleted: true }> {
  return apiRequest(`/api/${resourceName}/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function completeManualPublish(
  id: string,
  payload: { status: "Published" | "Failed"; publishedUrl?: string; note?: string },
): Promise<{ content: ContentItem; log: PublishLog }> {
  return apiRequest(`/api/content/${encodeURIComponent(id)}/manual-publish`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadMediaFile(file: File): Promise<UploadedMedia> {
  const dataBase64 = await readFileAsDataUrl(file);
  return apiRequest("/api/media", {
    method: "POST",
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      dataBase64,
    }),
  });
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response) || `Operations API returned ${response.status}`);
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

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Không thể đọc file upload."));
    reader.readAsDataURL(file);
  });
}
