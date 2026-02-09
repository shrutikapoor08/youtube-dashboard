"use client";

import { useState } from "react";
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

const sampleVideos: VideoCardProps[] = [
  {
    rank: 1,
    thumbnail: "https://i.ytimg.com/vi/placeholder1/hqdefault.jpg",
    title: "Why Replacing Developers with AI is Going Horribly Wrong",
    channel: "MACKARD",
    views: "1.8M",
    timeAgo: "6 days ago",
    rating: "Excellent",
  },
  {
    rank: 2,
    thumbnail: "https://i.ytimg.com/vi/placeholder2/hqdefault.jpg",
    title: "The wild rise of OpenClaw...",
    channel: "FIRESHIP",
    views: "1.3M",
    timeAgo: "1 weeks ago",
    rating: "Excellent",
  },
  {
    rank: 3,
    thumbnail: "https://i.ytimg.com/vi/placeholder3/hqdefault.jpg",
    title: "A brief history of programming...",
    channel: "FIRESHIP",
    views: "589K",
    timeAgo: "2 weeks ago",
    rating: "Excellent",
  },
  {
    rank: 4,
    thumbnail: "https://i.ytimg.com/vi/placeholder4/hqdefault.jpg",
    title: "I Read Honey's Source Code",
    channel: "THE PRIMETIME",
    views: "579K",
    timeAgo: "3 weeks ago",
    rating: "Excellent",
  },
  {
    rank: 5,
    thumbnail: "https://i.ytimg.com/vi/placeholder5/hqdefault.jpg",
    title: "Cursor Is Lying To Developers...",
    channel: "BASIC DEV",
    views: "280K",
    timeAgo: "2 weeks ago",
    rating: "Excellent",
  },
  {
    rank: 6,
    thumbnail: "https://i.ytimg.com/vi/placeholder6/hqdefault.jpg",
    title: "Learning to code has changed",
    channel: "TECH WITH TIM",
    views: "126K",
    timeAgo: "1 weeks ago",
    rating: "Excellent",
  },
  {
    rank: 7,
    thumbnail: "https://i.ytimg.com/vi/placeholder7/hqdefault.jpg",
    title: "How Hackers Crack Any Software With Reverse Engineering",
    channel: "LOW LEVEL",
    views: "400K",
    timeAgo: "4 weeks ago",
    rating: "Excellent",
  },
  {
    rank: 8,
    thumbnail: "https://i.ytimg.com/vi/placeholder8/hqdefault.jpg",
    title: "I Have Spent 500+ Hours Programming With AI. This is what I learned",
    channel: "THE CODING SLOTH",
    views: "258K",
    timeAgo: "2 weeks ago",
    rating: "Excellent",
  },
  {
    rank: 9,
    thumbnail: "https://i.ytimg.com/vi/placeholder9/hqdefault.jpg",
    title: "The Best Place to Learn AI in 2026? Coursera Tested",
    channel: "JASON WEST",
    views: "266K",
    timeAgo: "3 weeks ago",
  },
  {
    rank: 10,
    thumbnail: "https://i.ytimg.com/vi/placeholder10/hqdefault.jpg",
    title: "We Studied 150 Developers Using AI (Here's What's Actually Changed...)",
    channel: "MODERN SOFTWARE ENGINEERING",
    views: "75K",
    timeAgo: "6 days ago",
    rating: "Excellent",
  },
  {
    rank: 11,
    thumbnail: "https://i.ytimg.com/vi/placeholder11/hqdefault.jpg",
    title: "Is Learning to Code Still Worth It in 2026?",
    channel: "ALBERTA TECH",
    views: "266K",
    timeAgo: "3 weeks ago",
    rating: "Excellent",
  },
  {
    rank: 12,
    thumbnail: "https://i.ytimg.com/vi/placeholder12/hqdefault.jpg",
    title: "Meet agentic coding in Xcode | Apple Developer",
    channel: "APPLE DEVELOPER",
    views: "75K",
    timeAgo: "6 days ago",
    rating: "Excellent",
  },
];

interface TrendingTechVideosProps {
  videos?: VideoCardProps[];
}

export default function TrendingTechVideos({
  videos = sampleVideos,
}: TrendingTechVideosProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVideos = videos.filter((video) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        video.title.toLowerCase().includes(query) ||
        video.channel.toLowerCase().includes(query)
      );
    }
    return true;
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

      {/* Video grid */}
      <VideoGrid videos={filteredVideos} />
    </div>
  );
}
