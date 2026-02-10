import { NextResponse } from "next/server";
import { MOCK_TRENDING_VIDEOS } from "@/services/mock-trending-data";

// ==================== Types ====================

interface YouTubeVideoItem {
  id: string;
  snippet: {
    title: string;
    channelTitle: string;
    channelId: string;
    publishedAt: string;
    thumbnails: {
      high?: { url: string };
      default?: { url: string };
    };
    tags?: string[];
  };
  statistics: {
    viewCount: string;
    likeCount?: string;
    commentCount?: string;
  };
  contentDetails: {
    duration: string;
  };
}

interface TrendingVideoResult {
  videoId: string;
  title: string;
  channel: string;
  views: string;
  viewCount: number;
  timeAgo: string;
  thumbnail: string;
  category: string;
  rank: number;
  rating?: string;
}

// ==================== Config ====================

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

// videoCategoryId 28 = Science & Technology
const YOUTUBE_CATEGORY_ID = "28";

// ==================== Server-side Cache ====================

interface CacheEntry {
  data: TrendingVideoResult[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCached(key: string): TrendingVideoResult[] | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: TrendingVideoResult[]) {
  cache.set(key, { data, timestamp: Date.now() });
}

// ==================== Quality Filters ====================

const MIN_VIEWS = 5_000;
const MIN_DURATION_SECONDS = 3 * 60; // 3 minutes

function parseDurationSeconds(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (
    parseInt(match[1] || "0") * 3600 +
    parseInt(match[2] || "0") * 60 +
    parseInt(match[3] || "0")
  );
}

// ==================== Helpers ====================

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(0)}K`;
  return views.toString();
}

function formatTimeAgo(publishedAt: string): string {
  const diffMs = Date.now() - new Date(publishedAt).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return "1 week ago";
  return `${diffWeeks} weeks ago`;
}

function isShort(item: YouTubeVideoItem): boolean {
  const title = item.snippet.title.toLowerCase();
  if (title.includes("#shorts") || title.includes("#short")) return true;

  const tags = item.snippet.tags || [];
  if (tags.some((t) => t.toLowerCase() === "shorts" || t.toLowerCase() === "#shorts")) return true;

  const totalSeconds = parseDurationSeconds(item.contentDetails.duration);
  if (totalSeconds <= 60) return true;

  return false;
}

function getRating(views: number): string {
  if (views >= 500_000) return "Viral";
  if (views >= 100_000) return "Excellent";
  if (views >= 50_000) return "Great";
  return "Good";
}

function categorizeVideo(title: string, tags: string[]): string {
  const text = `${title} ${tags.join(" ")}`.toLowerCase();

  if (text.includes("react") || text.includes("next.js") || text.includes("nextjs")) {
    return "React";
  }
  if (text.includes("ai") || text.includes("machine learning") || text.includes("gpt") || text.includes("llm") || text.includes("deep learning")) {
    return "AI & ML";
  }
  if (text.includes("career") || text.includes("interview") || text.includes("job") || text.includes("salary")) {
    return "Tech Careers";
  }
  if (text.includes("javascript") || text.includes("typescript") || text.includes("node")) {
    return "JavaScript";
  }
  if (text.includes("open source") || text.includes("github") || text.includes("contribute")) {
    return "Open Source";
  }
  if (text.includes("css") || text.includes("html") || text.includes("web") || text.includes("frontend") || text.includes("backend")) {
    return "Web Dev";
  }
  return "Web Dev";
}

// ==================== Error Classes ====================

class YouTubeQuotaExceededError extends Error {
  constructor() {
    super("YouTube API quota exceeded");
    this.name = "YouTubeQuotaExceededError";
  }
}

// ==================== Fetch Logic ====================

/**
 * Fetches trending videos using videos.list with chart=mostPopular.
 * This costs only 1 quota unit (vs 100 for search.list).
 */
async function fetchTrendingVideos(): Promise<TrendingVideoResult[]> {
  const url = `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=US&videoCategoryId=${YOUTUBE_CATEGORY_ID}&maxResults=50&key=${API_KEY}`;

  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 403) {
      throw new YouTubeQuotaExceededError();
    }
    console.error(`YouTube mostPopular fetch failed: ${res.status} ${res.statusText}`);
    return [];
  }

  const data = await res.json();
  if (!data.items || data.items.length === 0) return [];

  const items = (data.items as YouTubeVideoItem[]).filter((item) => !isShort(item));

  const videos: TrendingVideoResult[] = items
    .map((item) => {
      const views = parseInt(item.statistics.viewCount || "0");
      const durationSeconds = parseDurationSeconds(item.contentDetails.duration);

      return {
        videoId: item.id,
        title: item.snippet.title,
        channel: item.snippet.channelTitle.toUpperCase(),
        views: formatViews(views),
        viewCount: views,
        timeAgo: formatTimeAgo(item.snippet.publishedAt),
        thumbnail:
          item.snippet.thumbnails?.high?.url ||
          item.snippet.thumbnails?.default?.url ||
          "",
        category: categorizeVideo(item.snippet.title, item.snippet.tags || []),
        rank: 0,
        rating: getRating(views),
        _durationSeconds: durationSeconds,
      };
    })
    .filter((v) => v.viewCount >= MIN_VIEWS && v._durationSeconds >= MIN_DURATION_SECONDS)
    .sort((a, b) => b.viewCount - a.viewCount)
    .map(({ _durationSeconds, ...rest }, i) => ({ ...rest, rank: i + 1 }));

  return videos;
}

// ==================== Route Handler ====================

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category"); // optional: filter to one category

  if (!API_KEY) {
    return NextResponse.json(
      { error: "YouTube API key not configured. Set NEXT_PUBLIC_YOUTUBE_API_KEY in .env.local." },
      { status: 500 },
    );
  }

  const cacheKey = category || "all";
  const cached = getCached(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const allVideos = await fetchTrendingVideos();

    // Cache the full result set
    setCache("all", allVideos);

    // Filter by category if requested
    const result = category
      ? allVideos.filter((v) => v.category === category)
      : allVideos;

    if (category) {
      setCache(category, result);
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof YouTubeQuotaExceededError) {
      console.warn("YouTube API quota exceeded — serving mock data as fallback.");
      const filtered = category
        ? MOCK_TRENDING_VIDEOS.filter((v) => v.category === category)
        : MOCK_TRENDING_VIDEOS;
      return NextResponse.json(filtered);
    }

    console.error("YouTube API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending videos" },
      { status: 500 },
    );
  }
}
