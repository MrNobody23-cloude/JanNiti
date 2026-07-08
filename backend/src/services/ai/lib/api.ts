/**
 * API utility for frontend data fetching.
 * All calls are forwarded to the Express backend server.
 */

// Uses env var in browser (NEXT_PUBLIC_) or server-side (BACKEND_URL)
const BASE_URL =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"
    : process.env.BACKEND_URL || "http://localhost:4000";

interface FetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

interface ApiResponse<T> {
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  meta?: Record<string, unknown>;
  message?: string;
}

class ApiError extends Error {
  status: number;
  details?: string;
  constructor(message: string, status: number, details?: string) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
  const { method = "GET", body, params, signal } = options;

  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value));
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
    signal,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(json.error || "Request failed", res.status, json.details);
  }

  return json;
}

// === Submissions ===
export const submissionsApi = {
  list: (params?: { page?: number; limit?: number; sector?: string; status?: string; search?: string; sortBy?: string; sortOrder?: string; constituencyId?: string }) =>
    fetchApi<any[]>("/api/submissions", { params: params as Record<string, string | number | undefined> }),

  get: (id: string) => fetchApi<any>(`/api/submissions/${id}`),

  create: (data: { constituencyId: string; text: string; channel?: string; language?: string; attachments?: any[]; location?: { lat?: number; lng?: number; address?: string } }) =>
    fetchApi<any>("/api/submissions", { method: "POST", body: data }),

  update: (id: string, data: { status?: string; title?: string; sector?: string }) =>
    fetchApi<any>(`/api/submissions/${id}`, { method: "PATCH", body: data }),

  delete: (id: string) => fetchApi<any>(`/api/submissions/${id}`, { method: "DELETE" }),

  upload: async (file: File, type: string, submissionId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    if (submissionId) formData.append("submissionId", submissionId);

    const res = await fetch(`${BASE_URL}/api/submissions/upload`, { method: "POST", body: formData, credentials: "include" });
    if (!res.ok) throw new ApiError("Upload failed", res.status);
    return res.json();
  },

  submitVoice: async (audio: Blob, constituencyId: string, location?: { lat?: number; lng?: number; address?: string }) => {
    const formData = new FormData();
    formData.append("audio", audio, "recording.webm");
    formData.append("constituencyId", constituencyId);
    if (location?.lat) formData.append("lat", String(location.lat));
    if (location?.lng) formData.append("lng", String(location.lng));
    if (location?.address) formData.append("address", location.address);

    const res = await fetch(`${BASE_URL}/api/submissions/voice`, { method: "POST", body: formData, credentials: "include" });
    if (!res.ok) throw new ApiError("Voice submission failed", res.status);
    return res.json();
  },
};

// === Projects ===
export const projectsApi = {
  list: (params?: { page?: number; limit?: number; sector?: string; status?: string; priority?: string; search?: string; sortBy?: string }) =>
    fetchApi<any[]>("/api/projects", { params: params as Record<string, string | number | undefined> }),

  create: (data: any) => fetchApi<any>("/api/projects", { method: "POST", body: data }),

  resolve: (projectId: string, data: { submissionId?: string; resolutionType: string; description: string; photos?: string[]; documents?: string[]; budgetUsed?: number; percentageResolved?: number; contractorName?: string; departmentName?: string; workOrderNumber?: string; completionDate?: string }) =>
    fetchApi<any>(`/api/projects/${projectId}/resolve`, { method: "POST", body: data }),

  getResolutions: (projectId: string) => fetchApi<any[]>(`/api/projects/${projectId}/resolve`),
};

// === Analytics ===
export const analyticsApi = {
  getDashboard: (params?: { constituencyId?: string; period?: string }) =>
    fetchApi<any>("/api/analytics", { params: params as Record<string, string | number | undefined> }),
};

// === Budget ===
export const budgetApi = {
  get: (params?: { constituencyId?: string; financialYear?: string }) =>
    fetchApi<any>("/api/budget", { params: params as Record<string, string | number | undefined> }),

  create: (data: any) => fetchApi<any>("/api/budget", { method: "POST", body: data }),
};

// === Copilot ===
export const copilotApi = {
  chat: async function* (message: string, constituencyId?: string): AsyncGenerator<{ type: string; text?: string }> {
    const res = await fetch(`${BASE_URL}/api/copilot/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message, constituencyId }),
    });

    if (!res.ok) {
      throw new ApiError("Copilot request failed", res.status);
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            yield JSON.parse(line.slice(6));
          } catch { /* skip malformed */ }
        }
      }
    }
  },
};

// === Decision Engine ===
export const decisionEngineApi = {
  prioritize: (data: { constituencyId: string; projectId?: string; recalculateAll?: boolean }) =>
    fetchApi<any[]>("/api/decision-engine/prioritize", { method: "POST", body: data }),

  explain: (data: { projectId: string; compareWithIds?: string[] }) =>
    fetchApi<any>("/api/decision-engine/explain", { method: "POST", body: data }),
};

// === Digital Twin ===
export const digitalTwinApi = {
  simulate: (data: { constituencyId: string; scenarioType: string; name: string; timeHorizon?: string; parameters?: any }) =>
    fetchApi<any>("/api/digital-twin/simulate", { method: "POST", body: data }),
};

// === Maps ===
export const mapsApi = {
  hotspots: (params?: { constituencyId?: string; sector?: string; type?: string; minUrgency?: number }) =>
    fetchApi<any>("/api/maps/hotspots", { params: params as Record<string, string | number | undefined> }),

  geocode: (params: { address?: string; lat?: number; lng?: number; district?: string; state?: string }) =>
    fetchApi<any>("/api/maps/geocode", { params: params as Record<string, string | number | undefined> }),
};

export { ApiError };
