/**
 * @file youtube-data.ts
 * @description YouTube Data API v3 integration service for fetching channel metrics and videos
 */

import type { VideoMetric, ChannelMetric, TrendingVideo, PerformanceInsight } from "./types";

export type { VideoMetric, ChannelMetric, TrendingVideo, PerformanceInsight };

// ==================== YouTube API Configuration ====================

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;

// Category mapping for search queries
const CATEGORY_QUERIES: Record<string, string> = {
  "AI tutorials": "AI tutorial machine learning deep learning",
  Coding: "programming coding software development",
  "Web Dev": "web development frontend backend javascript",
  "Career Advice": "career advice job search interview tips",
  "Industry Trends": "tech trends industry insights technology news",
};

// ==================== Caching ====================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Cache TTL in milliseconds (15 minutes default, 1 hour for trending)
const CACHE_TTL = {
  channelMetrics: 15 * 60 * 1000,      // 15 minutes
  videoPerformance: 15 * 60 * 1000,    // 15 minutes
  trendingVideos: 60 * 60 * 1000,      // 1 hour (trending doesn't change fast)
  performanceInsights: 30 * 60 * 1000, // 30 minutes
};

class APICache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private localStorage: boolean;

  constructor() {
    // Check if localStorage is available (client-side)
    this.localStorage = typeof window !== "undefined" && !!window.localStorage;
    this.loadFromStorage();
  }

  private getCacheKey(prefix: string, params: Record<string, unknown>): string {
    return `youtube_${prefix}_${JSON.stringify(params)}`;
  }

  private loadFromStorage(): void {
    if (!this.localStorage) return;

    try {
      const stored = localStorage.getItem("youtube_api_cache");
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();

        // Only load non-expired entries
        Object.entries(parsed).forEach(([key, entry]) => {
          const cacheEntry = entry as CacheEntry<unknown>;
          if (cacheEntry.expiresAt > now) {
            this.cache.set(key, cacheEntry);
          }
        });
      }
    } catch (e) {
      console.warn("Failed to load cache from localStorage:", e);
    }
  }

  private saveToStorage(): void {
    if (!this.localStorage) return;

    try {
      const cacheObj: Record<string, CacheEntry<unknown>> = {};
      this.cache.forEach((value, key) => {
        cacheObj[key] = value;
      });
      localStorage.setItem("youtube_api_cache", JSON.stringify(cacheObj));
    } catch (e) {
      console.warn("Failed to save cache to localStorage:", e);
    }
  }

  get<T>(prefix: string, params: Record<string, unknown>): T | null {
    const key = this.getCacheKey(prefix, params);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    console.log(`[Cache HIT] ${prefix}`, params);
    return entry.data;
  }

  set<T>(prefix: string, params: Record<string, unknown>, data: T, ttl: number): void {
    const key = this.getCacheKey(prefix, params);
    const now = Date.now();

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    });

    this.saveToStorage();
    console.log(`[Cache SET] ${prefix}`, params, `TTL: ${ttl / 1000}s`);
  }

  clear(): void {
    this.cache.clear();
    if (this.localStorage) {
      localStorage.removeItem("youtube_api_cache");
    }
    console.log("[Cache CLEARED]");
  }

  // Get cache stats
  getStats(): { entries: number; keys: string[] } {
    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton cache instance
const apiCache = new APICache();

// Export for debugging/clearing
export { apiCache };

// ==================== Error Handling ====================

class YouTubeAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public quotaExceeded?: boolean,
  ) {
    super(message);
    this.name = "YouTubeAPIError";
  }
}

async function fetchWithRetry(
  url: string,
  retries = 3,
  backoff = 1000,
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);

      if (response.status === 403) {
        const data = await response.json();
        if (
          data.error?.errors?.some(
            (e: { reason: string }) =>
              e.reason === "quotaExceeded" || e.reason === "rateLimitExceeded",
          )
        ) {
          throw new YouTubeAPIError(
            "YouTube API quota exceeded. Please try again later.",
            403,
            true,
          );
        }
      }

      if (!response.ok) {
        throw new YouTubeAPIError(
          `YouTube API error: ${response.statusText}`,
          response.status,
        );
      }

      return response;
    } catch (error) {
      if (error instanceof YouTubeAPIError) throw error;

      if (i === retries - 1) throw error;

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, backoff * Math.pow(2, i)),
      );
    }
  }

  throw new Error("Failed to fetch after retries");
}

// ==================== Helper Functions ====================

function calculateTrendScore(
  views: number,
  publishedAt: string,
  likes?: number,
): number {
  const hoursOld =
    (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
  const viewsPerHour = views / Math.max(hoursOld, 1);
  const engagementBoost = likes ? (likes / views) * 100 : 0;
  return viewsPerHour + engagementBoost;
}

/**
 * Calculate a quality score (0-100) based on engagement signals.
 * - Like-to-view ratio (40% weight): >5% is excellent
 * - Views velocity (30% weight): views per hour since publish
 * - Duration sweet spot (30% weight): 5-20 min scores highest
 */
function calculateQualityScore(
  views: number,
  likes: number,
  publishedAt: string,
  durationSeconds: number,
): number {
  // Like-to-view ratio (0-40 points)
  const likeRatio = views > 0 ? (likes / views) * 100 : 0;
  const likeScore = Math.min(likeRatio / 5, 1) * 40;

  // Views velocity (0-30 points)
  const hoursOld = Math.max((Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60), 1);
  const viewsPerHour = views / hoursOld;
  const velocityScore = Math.min(viewsPerHour / 500, 1) * 30;

  // Duration sweet spot: 5-20 min is ideal (0-30 points)
  const durationMinutes = durationSeconds / 60;
  let durationScore: number;
  if (durationMinutes >= 5 && durationMinutes <= 20) {
    durationScore = 30; // Sweet spot
  } else if (durationMinutes >= 3 && durationMinutes <= 40) {
    durationScore = 20; // Acceptable
  } else {
    durationScore = 10; // Too short or too long
  }

  return Math.round(likeScore + velocityScore + durationScore);
}

function categorizeVideo(title: string, tags: string[]): string {
  const text = `${title} ${tags.join(" ")}`.toLowerCase();

  if (text.includes("ai") || text.includes("machine learning") || text.includes("gpt") || text.includes("llm")) {
    return "AI tutorials";
  }
  if (text.includes("career") || text.includes("interview") || text.includes("job") || text.includes("salary")) {
    return "Career Advice";
  }
  if (text.includes("react") || text.includes("next") || text.includes("web") || text.includes("frontend") || text.includes("css")) {
    return "Web Dev";
  }
  if (text.includes("code") || text.includes("programming") || text.includes("algorithm") || text.includes("tutorial")) {
    return "Coding";
  }
  return "Industry Trends";
}

// ==================== API Functions ====================

/**
 * Get YouTube channel performance metrics
 */
export async function getChannelMetrics(params?: {
  period?: string;
}): Promise<ChannelMetric[]> {
  const period = params?.period || "30d";
  const cacheParams = { period };

  // Check cache first
  const cached = apiCache.get<ChannelMetric[]>("channelMetrics", cacheParams);
  if (cached) return cached;

  if (!API_KEY) {
    throw new YouTubeAPIError(
      "YouTube API key not configured. Please add NEXT_PUBLIC_YOUTUBE_API_KEY to your .env.local file.",
    );
  }

  if (!CHANNEL_ID) {
    throw new YouTubeAPIError(
      "YouTube Channel ID not configured. Please add NEXT_PUBLIC_YOUTUBE_CHANNEL_ID to your .env.local file.",
    );
  }

  try {
    // Fetch channel statistics
    const channelUrl = `${YOUTUBE_API_BASE}/channels?part=statistics,snippet&id=${CHANNEL_ID}&key=${API_KEY}`;
    const channelResponse = await fetchWithRetry(channelUrl);
    const channelData = await channelResponse.json();

    if (!channelData.items || channelData.items.length === 0) {
      throw new YouTubeAPIError("Channel not found. Please check your NEXT_PUBLIC_YOUTUBE_CHANNEL_ID.");
    }

    const stats = channelData.items[0].statistics;

    // Fetch recent videos to estimate period-specific metrics
    const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
    const days = daysMap[period] || 30;
    const publishedAfter = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const videosUrl = `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${CHANNEL_ID}&type=video&order=date&maxResults=50&publishedAfter=${publishedAfter}&key=${API_KEY}`;
    const videosResponse = await fetchWithRetry(videosUrl);
    const videosData = await videosResponse.json();

    let periodViews = 0;
    let videoCount = videosData.items?.length || 0;

    if (videoCount > 0) {
      const videoIds = videosData.items.map((item: { id: { videoId: string } }) => item.id.videoId).join(",");
      const statsUrl = `${YOUTUBE_API_BASE}/videos?part=statistics&id=${videoIds}&key=${API_KEY}`;
      const statsResponse = await fetchWithRetry(statsUrl);
      const statsData = await statsResponse.json();

      periodViews = statsData.items?.reduce(
        (sum: number, item: { statistics: { viewCount: string } }) => sum + parseInt(item.statistics.viewCount || "0"),
        0,
      ) || 0;
    }

    const metrics: ChannelMetric[] = [
      {
        name: "Total Subscribers",
        value: parseInt(stats.subscriberCount || "0"),
        unit: "subscribers",
        changePercent: 0, // Would need historical data
        trend: "flat",
        period,
      },
      {
        name: "Total Views",
        value: parseInt(stats.viewCount || "0"),
        unit: "views",
        changePercent: 0,
        trend: "flat",
        period,
      },
      {
        name: `Views (${period})`,
        value: periodViews,
        unit: "views",
        changePercent: 0,
        trend: "flat",
        period,
      },
      {
        name: `Videos Published (${period})`,
        value: videoCount,
        unit: "videos",
        changePercent: 0,
        trend: "flat",
        period,
      },
    ];

    // Cache the result
    apiCache.set("channelMetrics", cacheParams, metrics, CACHE_TTL.channelMetrics);

    return metrics;
  } catch (error) {
    if (error instanceof YouTubeAPIError) throw error;
    throw new YouTubeAPIError(
      "Failed to fetch channel metrics. Please check your API configuration.",
    );
  }
}

/**
 * Get video performance data for your channel
 */
export async function getVideoPerformance(params?: {
  limit?: number;
  sortBy?: string;
}): Promise<VideoMetric[]> {
  const limit = params?.limit || 10;
  const sortBy = params?.sortBy || "views";
  const cacheParams = { limit, sortBy };

  // Check cache first
  const cached = apiCache.get<VideoMetric[]>("videoPerformance", cacheParams);
  if (cached) return cached;

  if (!API_KEY) {
    throw new YouTubeAPIError(
      "YouTube API key not configured. Please add NEXT_PUBLIC_YOUTUBE_API_KEY to your .env.local file.",
    );
  }

  if (!CHANNEL_ID) {
    throw new YouTubeAPIError(
      "YouTube Channel ID not configured. Please add NEXT_PUBLIC_YOUTUBE_CHANNEL_ID to your .env.local file.",
    );
  }

  try {
    // Fetch channel videos
    const order = sortBy === "date" ? "date" : "viewCount";
    const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${CHANNEL_ID}&type=video&order=${order}&maxResults=${Math.min(limit, 50)}&key=${API_KEY}`;

    const searchResponse = await fetchWithRetry(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.items || searchData.items.length === 0) {
      return [];
    }

    // Get detailed statistics for each video
    const videoIds = searchData.items.map((item: { id: { videoId: string } }) => item.id.videoId).join(",");
    const statsUrl = `${YOUTUBE_API_BASE}/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${API_KEY}`;

    const statsResponse = await fetchWithRetry(statsUrl);
    const statsData = await statsResponse.json();

    const videos: VideoMetric[] = statsData.items.map((item: {
      id: string;
      snippet: {
        title: string;
        publishedAt: string;
        thumbnails: { high?: { url: string }; default?: { url: string } };
        tags?: string[];
      };
      statistics: { viewCount: string };
      contentDetails: { duration: string };
    }) => {
      const views = parseInt(item.statistics.viewCount || "0");
      // Parse ISO 8601 duration (e.g., PT4M13S)
      const duration = item.contentDetails.duration;
      const durationMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const hours = parseInt(durationMatch?.[1] || "0");
      const minutes = parseInt(durationMatch?.[2] || "0");
      const seconds = parseInt(durationMatch?.[3] || "0");
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;

      // Estimate watch time (assuming 50% average view duration)
      const estimatedWatchTimeHours = (views * totalSeconds * 0.5) / 3600;

      return {
        videoId: item.id,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
        views,
        watchTimeHours: Math.round(estimatedWatchTimeHours),
        averageViewDuration: Math.round(totalSeconds * 0.5),
        thumbnailUrl:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.default?.url ||
          "",
        category: categorizeVideo(item.snippet.title, item.snippet.tags || []),
      };
    });

    // Sort if needed
    if (sortBy === "watchTime") {
      videos.sort((a: VideoMetric, b: VideoMetric) => b.watchTimeHours - a.watchTimeHours);
    } else if (sortBy === "duration") {
      videos.sort((a: VideoMetric, b: VideoMetric) => b.averageViewDuration - a.averageViewDuration);
    }

    const result = videos.slice(0, limit);

    // Cache the result
    apiCache.set("videoPerformance", cacheParams, result, CACHE_TTL.videoPerformance);

    return result;
  } catch (error) {
    if (error instanceof YouTubeAPIError) throw error;
    throw new YouTubeAPIError("Failed to fetch video performance data.");
  }
}

/**
 * Get trending YouTube videos by category
 */
export async function getTrendingVideos(params?: {
  category?: string;
  limit?: number;
}): Promise<TrendingVideo[]> {
  const category = params?.category || "AI tutorials";
  const limit = params?.limit || 20;
  const cacheParams = { category, limit };

  // Check cache first
  const cached = apiCache.get<TrendingVideo[]>("trendingVideos", cacheParams);
  if (cached) return cached;

  if (!API_KEY) {
    throw new YouTubeAPIError(
      "YouTube API key not configured. Please add NEXT_PUBLIC_YOUTUBE_API_KEY to your .env.local file.",
    );
  }

  try {
    const searchQuery = CATEGORY_QUERIES[category] || category;
    // Request more results to account for shorts being filtered out, and exclude shorts from search
    const maxResults = Math.min(limit * 2, 50);
    const url = `${YOUTUBE_API_BASE}/list?part=snippet&q=${encodeURIComponent(searchQuery + " -shorts")}&type=video&order=viewCount&maxResults=${maxResults}&videoDuration=medium&relevanceLanguage=en&regionCode=US&key=${API_KEY}&publishedAfter=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}`;

    const response = await fetchWithRetry(url);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return [];
    }

    // Get video statistics and content details (for duration to filter shorts)
    const videoIds = data.items.map((item: { id: { videoId: string } }) => item.id.videoId).join(",");
    const statsUrl = `${YOUTUBE_API_BASE}/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${API_KEY}`;

    const statsResponse = await fetchWithRetry(statsUrl);
    const statsData = await statsResponse.json();

    // Helper to check if a video is a Short (under 60 seconds or has #shorts tag)
    const isShort = (item: {
      snippet: { title: string; tags?: string[] };
      contentDetails: { duration: string };
    }): boolean => {
      // Check for #shorts in title
      if (item.snippet.title.toLowerCase().includes("#shorts") ||
        item.snippet.title.toLowerCase().includes("#short")) {
        return true;
      }

      // Check for shorts tag
      const tags = item.snippet.tags || [];
      if (tags.some(tag => tag.toLowerCase() === "shorts" || tag.toLowerCase() === "#shorts")) {
        return true;
      }

      // Parse duration (ISO 8601 format: PT1M30S)
      const duration = item.contentDetails.duration;
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (match) {
        const hours = parseInt(match[1] || "0");
        const minutes = parseInt(match[2] || "0");
        const seconds = parseInt(match[3] || "0");
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;

        // Shorts are typically under 60 seconds
        if (totalSeconds <= 60) {
          return true;
        }
      }

      return false;
    };

    const trendingVideos: TrendingVideo[] = statsData.items
      .filter((item: {
        snippet: { title: string; tags?: string[] };
        contentDetails: { duration: string };
      }) => !isShort(item))
      .map((item: {
        id: string;
        snippet: {
          title: string;
          channelTitle: string;
          publishedAt: string;
          thumbnails: { high?: { url: string }; default?: { url: string } };
          tags?: string[];
        };
        statistics: { viewCount: string; likeCount?: string };
        contentDetails: { duration: string };
      }) => {
        const views = parseInt(item.statistics.viewCount || "0");
        const likes = parseInt(item.statistics.likeCount || "0");
        const publishedAt = item.snippet.publishedAt;

        // Parse ISO 8601 duration (PT1H2M30S) into human-readable format
        const durationMatch = item.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        const h = parseInt(durationMatch?.[1] || "0");
        const m = parseInt(durationMatch?.[2] || "0");
        const s = parseInt(durationMatch?.[3] || "0");
        const durationSeconds = h * 3600 + m * 60 + s;
        const duration = h > 0
          ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
          : `${m}:${String(s).padStart(2, "0")}`;

        return {
          videoId: item.id,
          title: item.snippet.title,
          channelName: item.snippet.channelTitle,
          views,
          publishedAt,
          category,
          trendScore: calculateTrendScore(views, publishedAt, likes),
          qualityScore: calculateQualityScore(views, likes, publishedAt, durationSeconds),
          thumbnailUrl:
            item.snippet.thumbnails?.high?.url ||
            item.snippet.thumbnails?.default?.url ||
            "",
          tags: item.snippet.tags || [],
          duration,
        };
      });

    // Sort by trend score and limit to requested amount
    trendingVideos.sort((a, b) => b.trendScore - a.trendScore);

    const result = trendingVideos.slice(0, limit);

    // Cache the result
    apiCache.set("trendingVideos", cacheParams, result, CACHE_TTL.trendingVideos);

    return result;
  } catch (error) {
    if (error instanceof YouTubeAPIError) throw error;
    console.error("YouTube API Error:", error);
    throw new YouTubeAPIError(
      "Failed to fetch trending videos. Please check your API configuration.",
    );
  }
}

/**
 * Get performance insights derived from video data
 */
export async function getPerformanceInsights(params?: {
  metric?: string;
}): Promise<PerformanceInsight[]> {
  const metric = params?.metric;
  const cacheParams = { metric: metric || "all" };

  // Check cache first
  const cached = apiCache.get<PerformanceInsight[]>("performanceInsights", cacheParams);
  if (cached) return cached;

  if (!API_KEY) {
    throw new YouTubeAPIError(
      "YouTube API key not configured. Please add NEXT_PUBLIC_YOUTUBE_API_KEY to your .env.local file.",
    );
  }

  if (!CHANNEL_ID) {
    throw new YouTubeAPIError(
      "YouTube Channel ID not configured. Please add NEXT_PUBLIC_YOUTUBE_CHANNEL_ID to your .env.local file.",
    );
  }

  try {
    // Fetch recent videos to derive insights
    const videos = await getVideoPerformance({ limit: 50, sortBy: "date" });

    if (videos.length === 0) {
      return [];
    }

    // Analyze upload days
    const dayViews: Record<string, { views: number; count: number }> = {
      Sunday: { views: 0, count: 0 },
      Monday: { views: 0, count: 0 },
      Tuesday: { views: 0, count: 0 },
      Wednesday: { views: 0, count: 0 },
      Thursday: { views: 0, count: 0 },
      Friday: { views: 0, count: 0 },
      Saturday: { views: 0, count: 0 },
    };

    const categoryViews: Record<string, number> = {};

    videos.forEach((video) => {
      const day = new Date(video.publishedAt).toLocaleDateString("en-US", { weekday: "long" });
      if (dayViews[day]) {
        dayViews[day].views += video.views;
        dayViews[day].count += 1;
      }

      categoryViews[video.category] = (categoryViews[video.category] || 0) + video.views;
    });

    const insights: PerformanceInsight[] = [
      {
        metric: "Best Upload Day",
        description: "Average views per video by upload day",
        data: Object.entries(dayViews)
          .filter(([, data]) => data.count > 0)
          .map(([label, data]) => ({
            label,
            value: Math.round(data.views / data.count),
          }))
          .sort((a, b) => b.value - a.value),
      },
      {
        metric: "Top Performing Topics",
        description: "Total views by content category",
        data: Object.entries(categoryViews)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value),
      },
      {
        metric: "Video Performance Distribution",
        description: "Number of videos by view count range",
        data: [
          { label: "0-1K views", value: videos.filter((v) => v.views < 1000).length },
          { label: "1K-10K views", value: videos.filter((v) => v.views >= 1000 && v.views < 10000).length },
          { label: "10K-100K views", value: videos.filter((v) => v.views >= 10000 && v.views < 100000).length },
          { label: "100K+ views", value: videos.filter((v) => v.views >= 100000).length },
        ].filter((d) => d.value > 0),
      },
    ];

    // Filter by specific metric if provided
    const filteredInsights = metric
      ? insights.filter((insight) =>
        insight.metric.toLowerCase().includes(metric.toLowerCase()),
      )
      : insights;

    // Cache the result
    apiCache.set("performanceInsights", cacheParams, filteredInsights, CACHE_TTL.performanceInsights);

    return filteredInsights;
  } catch (error) {
    if (error instanceof YouTubeAPIError) throw error;
    throw new YouTubeAPIError("Failed to fetch performance insights.");
  }
}

/**
 * Search YouTube for videos by query with pagination support.
 * Use this to fetch more videos on a topic, or to let the AI search for
 * specific content the user asks about.
 */
export async function searchVideos(params?: {
  query?: string;
  pageToken?: string;
  limit?: number;
}): Promise<{ videos: TrendingVideo[]; nextPageToken?: string }> {
  const query = params?.query || "tech tutorials";
  const limit = params?.limit || 12;
  const pageToken = params?.pageToken;
  const cacheParams = { query, limit, pageToken: pageToken || "" };

  const cached = apiCache.get<{ videos: TrendingVideo[]; nextPageToken?: string }>("searchVideos", cacheParams);
  if (cached) return cached;

  if (!API_KEY) {
    throw new YouTubeAPIError(
      "YouTube API key not configured. Please add NEXT_PUBLIC_YOUTUBE_API_KEY to your .env.local file.",
    );
  }

  try {
    const maxResults = Math.min(limit * 2, 50);
    let url = `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(query + " -shorts")}&type=video&order=viewCount&maxResults=${maxResults}&videoDuration=medium&relevanceLanguage=en&regionCode=US&key=${API_KEY}&publishedAfter=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}`;

    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }

    const response = await fetchWithRetry(url);
    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return { videos: [], nextPageToken: undefined };
    }

    const videoIds = data.items.map((item: { id: { videoId: string } }) => item.id.videoId).join(",");
    const statsUrl = `${YOUTUBE_API_BASE}/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${API_KEY}`;
    const statsResponse = await fetchWithRetry(statsUrl);
    const statsData = await statsResponse.json();

    const isShortVideo = (item: {
      snippet: { title: string; tags?: string[] };
      contentDetails: { duration: string };
    }): boolean => {
      if (item.snippet.title.toLowerCase().includes("#shorts") ||
        item.snippet.title.toLowerCase().includes("#short")) {
        return true;
      }
      const tags = item.snippet.tags || [];
      if (tags.some(tag => tag.toLowerCase() === "shorts" || tag.toLowerCase() === "#shorts")) {
        return true;
      }
      const match = item.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (match) {
        const totalSeconds = parseInt(match[1] || "0") * 3600 + parseInt(match[2] || "0") * 60 + parseInt(match[3] || "0");
        if (totalSeconds <= 60) return true;
      }
      return false;
    };

    const videos: TrendingVideo[] = statsData.items
      .filter((item: {
        snippet: { title: string; tags?: string[] };
        contentDetails: { duration: string };
      }) => !isShortVideo(item))
      .map((item: {
        id: string;
        snippet: {
          title: string;
          channelTitle: string;
          publishedAt: string;
          thumbnails: { high?: { url: string }; default?: { url: string } };
          tags?: string[];
        };
        statistics: { viewCount: string; likeCount?: string };
        contentDetails: { duration: string };
      }) => {
        const views = parseInt(item.statistics.viewCount || "0");
        const likes = parseInt(item.statistics.likeCount || "0");
        const publishedAt = item.snippet.publishedAt;

        const durationMatch = item.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        const h = parseInt(durationMatch?.[1] || "0");
        const m = parseInt(durationMatch?.[2] || "0");
        const s = parseInt(durationMatch?.[3] || "0");
        const durationSeconds = h * 3600 + m * 60 + s;
        const duration = h > 0
          ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
          : `${m}:${String(s).padStart(2, "0")}`;

        return {
          videoId: item.id,
          title: item.snippet.title,
          channelName: item.snippet.channelTitle,
          views,
          publishedAt,
          category: categorizeVideo(item.snippet.title, item.snippet.tags || []),
          trendScore: calculateTrendScore(views, publishedAt, likes),
          qualityScore: calculateQualityScore(views, likes, publishedAt, durationSeconds),
          thumbnailUrl:
            item.snippet.thumbnails?.high?.url ||
            item.snippet.thumbnails?.default?.url ||
            "",
          tags: item.snippet.tags || [],
          duration,
        };
      });

    videos.sort((a, b) => b.trendScore - a.trendScore);
    const result = {
      videos: videos.slice(0, limit),
      nextPageToken: data.nextPageToken as string | undefined,
    };

    apiCache.set("searchVideos", cacheParams, result, CACHE_TTL.trendingVideos);

    return result;
  } catch (error) {
    if (error instanceof YouTubeAPIError) throw error;
    console.error("YouTube API Error:", error);
    throw new YouTubeAPIError(
      "Failed to search videos. Please check your API configuration.",
    );
  }
}

/**
 * Clear the API cache (useful for forcing fresh data)
 */
export function clearYouTubeCache(): void {
  apiCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { entries: number; keys: string[] } {
  return apiCache.getStats();
}
