"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import CategoryPill from "./CategoryPill";
import VideoGrid from "./VideoGrid";
import { VideoCardProps } from "./VideoCard";

const categories = [
  "React",
  "AI & ML",
  "JavaScript",
  "Tech Careers",
  "Web Dev",
  "Open Source",
];

interface TrendingVideoResponse extends VideoCardProps {
  category: string;
}

export default function TrendingTechVideos() {
  const [videos, setVideos] = useState<TrendingVideoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const CACHE_KEY = "trending_videos_cache";
    const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

    function loadFromCache(): TrendingVideoResponse[] | null {
      try {
        const stored = localStorage.getItem(CACHE_KEY);
        if (!stored) return null;
        const { data, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp > CACHE_TTL_MS) {
          localStorage.removeItem(CACHE_KEY);
          return null;
        }
        return data;
      } catch {
        return null;
      }
    }

    function saveToCache(data: TrendingVideoResponse[]) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
      } catch {
        // localStorage full or unavailable — ignore
      }
    }

    async function fetchVideos() {
      // 1. Try client-side cache first
      const cached = loadFromCache();
      if (cached && cached.length > 0) {
        setVideos(cached);
        setLoading(false);
        return;
      }

      // 2. Fetch from API (which has its own server-side cache)
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/youtube/trending");
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch videos");
        }
        const data: TrendingVideoResponse[] = await res.json();
        setVideos(data);
        saveToCache(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch videos");
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, []);

  const filteredVideos = videos.filter((video) => {
    const matchesCategory = !activeCategory || video.category === activeCategory;
    const matchesSearch = !searchQuery ||
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.channel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Search and filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search for a video"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 text-sm outline-none placeholder:text-gray-400"
          />
        </div>
        <button className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600">
          Sort by <ChevronDown size={14} />
        </button>
        <button className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600">
          Duration <ChevronDown size={14} />
        </button>
      </div>

      {/* Categories */}
      <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
        {categories.map((cat) => (
          <CategoryPill
            key={cat}
            label={cat}
            isActive={activeCategory === cat}
            onClick={() =>
              setActiveCategory(activeCategory === cat ? null : cat)
            }
          />
        ))}
      </div>

      {/* See all link */}
      <div className="mb-6 flex justify-center">
        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          See all <ChevronRight size={14} />
        </button>
      </div>

      {/* Section title */}
      <h2 className="mb-4 text-xl font-bold">Newest Videos</h2>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          Loading trending videos...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12 text-red-500">
          {error}
        </div>
      ) : (
        <VideoGrid videos={filteredVideos} />
      )}
    </div>
  );
}
