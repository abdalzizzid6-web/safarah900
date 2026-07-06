import { auth } from "../../../../firebase";
import { RssProvider, RssImportedArticle, RssAnalyticsStats } from "../types";

async function getAuthHeaders() {
  await auth.authStateReady();
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error("User not authenticated. Please sign in again.");
  const token = await currentUser.getIdToken(true);
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

export const rssService = {
  // Fetch list of all providers
  async getProviders(): Promise<RssProvider[]> {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/rss/providers", { headers });
    if (!res.ok) throw new Error(`Failed to fetch RSS providers: ${await res.text()}`);
    return res.json();
  },

  // Add or edit a provider
  async saveProvider(provider: Partial<RssProvider>): Promise<RssProvider> {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/rss/providers", {
      method: "POST",
      headers,
      body: JSON.stringify(provider)
    });
    if (!res.ok) throw new Error(`Failed to save RSS provider: ${await res.text()}`);
    const data = await res.json();
    return data.provider;
  },

  // Delete a provider
  async deleteProvider(id: string): Promise<boolean> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/rss/providers/${id}`, {
      method: "DELETE",
      headers
    });
    if (!res.ok) throw new Error(`Failed to delete provider: ${await res.text()}`);
    const data = await res.json();
    return data.success;
  },

  // Toggle active/disabled status of provider
  async toggleProvider(id: string): Promise<boolean> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/rss/providers/${id}/toggle`, {
      method: "POST",
      headers
    });
    if (!res.ok) throw new Error(`Failed to toggle provider: ${await res.text()}`);
    const data = await res.json();
    return data.enabled;
  },

  // Trigger manual sync for a single provider
  async syncSingleProvider(id: string): Promise<{ importedCount: number; duplicateCount: number }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/rss/sync/${id}`, {
      method: "POST",
      headers
    });
    if (!res.ok) throw new Error(`Failed to sync provider: ${await res.text()}`);
    return res.json();
  },

  // Trigger sync for all enabled providers
  async syncAllProviders(): Promise<{ totalImported: number; totalDuplicates: number }> {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/rss/sync/all", {
      method: "POST",
      headers
    });
    if (!res.ok) throw new Error(`Failed to sync all providers: ${await res.text()}`);
    return res.json();
  },

  // Fetch queue with optional filters
  async getQueue(filters: { status?: string; providerId?: string; search?: string } = {}): Promise<RssImportedArticle[]> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.providerId) params.append("providerId", filters.providerId);
    if (filters.search) params.append("search", filters.search);

    const res = await fetch(`/api/rss/queue?${params.toString()}`, { headers });
    if (!res.ok) throw new Error(`Failed to fetch RSS queue: ${await res.text()}`);
    return res.json();
  },

  // Edit raw details or classifications of a queue item
  async editQueueArticle(id: string, updates: Partial<RssImportedArticle>): Promise<RssImportedArticle> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/rss/queue/${id}/edit`, {
      method: "POST",
      headers,
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error(`Failed to edit queue article: ${await res.text()}`);
    const data = await res.json();
    return data.article;
  },

  // Transition status of imported article (Approve, Reject, Publish, etc.)
  async updateQueueArticleStatus(id: string, status: string, publishSchedule?: string): Promise<boolean> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/rss/queue/${id}/status`, {
      method: "POST",
      headers,
      body: JSON.stringify({ status, publishSchedule })
    });
    
    if (res.status === 401) {
      // Token expired or invalid
      throw new Error("SESSION_EXPIRED");
    }

    if (!res.ok) throw new Error(`Failed to update status: ${await res.text()}`);
    const data = await res.json();
    return data.success;
  },

  // Manual trigger to re-run AI Classification
  async reClassifyQueueArticle(id: string): Promise<{ classification: any; seo: any }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/rss/queue/${id}/classify`, {
      method: "POST",
      headers
    });
    if (!res.ok) throw new Error(`Failed to classify article: ${await res.text()}`);
    return res.json();
  },

  // Get RSS aggregative analytics
  async getAnalytics(): Promise<RssAnalyticsStats> {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/rss/analytics", { headers });
    if (!res.ok) throw new Error(`Failed to fetch RSS analytics: ${await res.text()}`);
    return res.json();
  },

  // Seed default providers
  async seedProviders(): Promise<boolean> {
    const headers = await getAuthHeaders();
    const res = await fetch("/api/rss/seed", {
      method: "POST",
      headers
    });
    if (!res.ok) throw new Error(`Failed to seed providers: ${await res.text()}`);
    const data = await res.json();
    return data.success;
  }
};
