import { NextResponse } from "next/server";

// ==================== Types ====================

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      high?: { url: string };
      default?: { url: string };
    };
  };
}

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

const CATEGORY_QUERIES: Record<string, string> = {
  React: "react javascript framework tutorial",
  "AI & ML": "AI machine learning deep learning LLM",
  JavaScript: "javascript typescript programming tutorial",
  "Tech Careers": "tech career software developer job interview",
  "Web Dev": "web development frontend backend fullstack",
  "Open Source": "open source software project github",
};

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
const MIN_DURATION_SECONDS = 3 * 60; // 3 minutes — filters out shallow content
const MIN_ENGAGEMENT_RATIO = 0.01; // 1% likes-to-views minimum
const MIN_CHANNEL_SUBSCRIBERS = 1_000;

function parseDurationSeconds(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (
    parseInt(match[1] || "0") * 3600 +
    parseInt(match[2] || "0") * 60 +
    parseInt(match[3] || "0")
  );
}

function computeQualityScore(
  views: number,
  likes: number,
  comments: number,
  durationSeconds: number,
  subscriberCount: number,
): number {
  const engagementRatio = views > 0 ? (likes + comments * 2) / views : 0;
  const depthBonus = durationSeconds >= 10 * 60 ? 1.5 : durationSeconds >= 5 * 60 ? 1.2 : 1.0;
  const reputationBonus = subscriberCount >= 100_000 ? 1.5 : subscriberCount >= 10_000 ? 1.2 : 1.0;
  return views * engagementRatio * depthBonus * reputationBonus;
}

interface YouTubeChannelItem {
  id: string;
  statistics: {
    subscriberCount: string;
  };
}

async function getChannelSubscriberCounts(
  channelIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (channelIds.length === 0) return map;

  // YouTube API allows up to 50 channel IDs per request
  const url = `${YOUTUBE_API_BASE}/channels?part=statistics&id=${channelIds.join(",")}&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return map;
  const data = await res.json();

  for (const item of (data.items || []) as YouTubeChannelItem[]) {
    map.set(item.id, parseInt(item.statistics.subscriberCount || "0"));
  }
  return map;
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

  const match = item.contentDetails.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (match) {
    const totalSeconds =
      parseInt(match[1] || "0") * 3600 +
      parseInt(match[2] || "0") * 60 +
      parseInt(match[3] || "0");
    if (totalSeconds <= 60) return true;
  }

  return false;
}

function getRating(views: number): string {
  if (views >= 500_000) return "Viral";
  if (views >= 100_000) return "Excellent";
  if (views >= 50_000) return "Great";
  return "Good";
}

// ==================== Fetch Logic ====================

async function fetchCategoryVideos(
  category: string,
  query: string,
  publishedAfter: string,
): Promise<TrendingVideoResult[]> {
  // Search for videos
  const searchUrl = `${YOUTUBE_API_BASE}/search?part=snippet&q=${encodeURIComponent(query + " -shorts")}&type=video&order=viewCount&maxResults=20&videoDuration=medium&relevanceLanguage=en&publishedAfter=${publishedAfter}&key=${API_KEY}`;

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    console.error(`YouTube search failed for "${category}": ${searchRes.status} ${searchRes.statusText}`);
    return [];
  }
  const searchData = await searchRes.json();

  if (!searchData.items || searchData.items.length === 0) return [];

  // Get video details (statistics + contentDetails for filtering shorts)
  const videoIds = searchData.items
    .map((item: YouTubeSearchItem) => item.id.videoId)
    .join(",");

  const detailsUrl = `${YOUTUBE_API_BASE}/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${API_KEY}`;
  const detailsRes = await fetch(detailsUrl);
  if (!detailsRes.ok) return [];
  const detailsData = await detailsRes.json();

  const nonShorts: YouTubeVideoItem[] = (detailsData.items || []).filter(
    (item: YouTubeVideoItem) => !isShort(item),
  );

  if (nonShorts.length === 0) return [];

  // Fetch channel subscriber counts for reputation filtering
  const channelIds = [
    ...new Set(nonShorts.map((item) => item.snippet.channelId)),
  ];
  const subscriberMap = await getChannelSubscriberCounts(channelIds);

  interface ScoredVideo extends TrendingVideoResult {
    _durationSeconds: number;
    _engagementRatio: number;
    _subscribers: number;
    _qualityScore: number;
  }

  const scored: ScoredVideo[] = nonShorts.map((item) => {
    const views = parseInt(item.statistics.viewCount || "0");
    const likes = parseInt(item.statistics.likeCount || "0");
    const comments = parseInt(item.statistics.commentCount || "0");
    const durationSeconds = parseDurationSeconds(item.contentDetails.duration);
    const subscribers = subscriberMap.get(item.snippet.channelId) || 0;
    const engagementRatio = views > 0 ? likes / views : 0;
    const qualityScore = computeQualityScore(views, likes, comments, durationSeconds, subscribers);

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
      category,
      rank: 0,
      rating: getRating(views),
      _durationSeconds: durationSeconds,
      _engagementRatio: engagementRatio,
      _subscribers: subscribers,
      _qualityScore: qualityScore,
    };
  });

  return scored
    .filter(
      (v) =>
        v.viewCount >= MIN_VIEWS &&
        v._durationSeconds >= MIN_DURATION_SECONDS &&
        v._engagementRatio >= MIN_ENGAGEMENT_RATIO &&
        v._subscribers >= MIN_CHANNEL_SUBSCRIBERS,
    )
    .sort((a, b) => b._qualityScore - a._qualityScore)
    .map(({ _durationSeconds, _engagementRatio, _subscribers, _qualityScore, ...rest }) => rest);
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

  const threeWeeksAgo = new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const categoriesToFetch = category
      ? { [category]: CATEGORY_QUERIES[category] || category }
      : CATEGORY_QUERIES;

    // Fetch all categories in parallel
    const results = await Promise.all(
      Object.entries(categoriesToFetch).map(([cat, query]) =>
        fetchCategoryVideos(cat, query, threeWeeksAgo),
      ),
    );

    // Flatten, deduplicate by videoId, sort by views descending, and assign ranks
    const seen = new Set<string>();
    const allVideos = results
      .flat()
      .filter((v) => {
        if (seen.has(v.videoId)) return false;
        seen.add(v.videoId);
        return true;
      })
      .sort((a, b) => b.viewCount - a.viewCount)
      .map((v, i) => ({ ...v, rank: i + 1 }));

    setCache(cacheKey, allVideos);

    return NextResponse.json(allVideos);
  } catch (error) {
    console.error("YouTube API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending videos" },
      { status: 500 },
    );
  }
}
