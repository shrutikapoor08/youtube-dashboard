"use client";

import { CATEGORIES, CATEGORY_QUERIES, SORT_OPTIONS, DURATION_OPTIONS } from "@/lib/constants";
import { getTrendingVideos, TrendingVideo } from "@/services/youtube-data";
import { use, useState, useTransition, Suspense } from "react";
import { CategoryPills } from "@/components/category-pills";
import { VideoCard } from "@/components/video-card";
import { VideoGridSkeleton } from "@/components/video-grid-skeleton";

// --- Data fetching ---

function fetchVideos(category: string | null, sortBy: string): Promise<TrendingVideo[]> {
    const query = category ? CATEGORY_QUERIES[category] || category : null;

    const fetcher = async (): Promise<TrendingVideo[]> => {
        let allVideos: TrendingVideo[];

        if (!query) {
            const [webDevVideos, aiVideos, codingVideos] = await Promise.all([
                getTrendingVideos({ category: "Web Dev", limit: 12 }),
                getTrendingVideos({ category: "AI tutorials", limit: 12 }),
                getTrendingVideos({ category: "Coding", limit: 12 }),
                getTrendingVideos({ category: "ReactJS", limit: 12 }),
            ]);
            allVideos = [...webDevVideos, ...aiVideos, ...codingVideos];
        } else {
            allVideos = await getTrendingVideos({ category: query, limit: 30 });
        }

        const uniqueVideos = allVideos.filter(
            (video, index, self) =>
                index === self.findIndex((v) => v.videoId === video.videoId)
        );

        const sortedVideos = [...uniqueVideos].sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
                case "rated":
                    return b.views - a.views;
                case "relevant":
                default:
                    return b.trendScore - a.trendScore;
            }
        });

        return sortedVideos.slice(0, 30);
    };

    return fetcher();
}

// --- Video grid (consumes promise with use()) ---

function VideoGrid({
    videosPromise,
    searchQuery,
    isPending,
    playingVideo,
    onTogglePlay,
}: {
    videosPromise: Promise<TrendingVideo[]>;
    searchQuery: string;
    isPending: boolean;
    playingVideo: string | null;
    onTogglePlay: (videoId: string) => void;
}) {
    const videos = use(videosPromise);

    const filteredVideos = searchQuery
        ? videos.filter(
            (v) =>
                v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                v.channelName.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : videos;

    if (filteredVideos.length === 0) {
        return <p className="text-gray-500 text-sm text-center py-12">No videos found</p>;
    }

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8 transition-opacity ${isPending ? "opacity-50" : ""}`}>
            {filteredVideos.map((video, index) => (
                <VideoCard
                    key={video.videoId}
                    videoId={video.videoId}
                    title={video.title}
                    channelName={video.channelName}
                    thumbnailUrl={video.thumbnailUrl}
                    views={video.views}
                    publishedAt={video.publishedAt}
                    rank={index + 1}
                    isPlaying={playingVideo === video.videoId}
                    onTogglePlay={() => onTogglePlay(video.videoId)}
                />
            ))}
        </div>
    );
}

// --- Container ---

export function TrendingTechVideos() {
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState("relevant");
    const [searchQuery, setSearchQuery] = useState("");
    const [playingVideo, setPlayingVideo] = useState<string | null>(null);
    const [duration, setDuration] = useState("any");

    const [isPending, startTransition] = useTransition();
    const [videosPromise, setVideosPromise] = useState(() => fetchVideos(null, "relevant"));

    function handleCategoryChange(category: string | null) {
        setActiveCategory(category);
        startTransition(() => {
            setVideosPromise(fetchVideos(category, sortBy));
        });
    }

    function handleSortChange(sort: string) {
        setSortBy(sort);
        startTransition(() => {
            setVideosPromise(fetchVideos(activeCategory, sort));
        });
    }

    return (
        <div className="bg-white min-h-full">

            {/* Category Pills */}
            <CategoryPills
                categories={CATEGORIES}
                activeId={activeCategory}
                onChange={handleCategoryChange}
            />

            {/* See all link */}
            <div className="text-center my-auto">
                <button
                    onClick={() => handleCategoryChange(null)}
                    className="text-sm text-gray-900 underline underline-offset-4 inline-flex items-center gap-1 hover:text-gray-600"
                >
                    See all
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Section Header */}
            <div className="px-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    {activeCategory
                        ? CATEGORIES.find((c) => c.id === activeCategory)?.label || "Trending"
                        : "Newest Videos"}
                </h2>
            </div>

            {/* Video Grid */}
            <div className="px-6 pb-8">

                    <Suspense fallback={<VideoGridSkeleton />}>
                        <VideoGrid
                            videosPromise={videosPromise}
                            searchQuery={searchQuery}
                            isPending={isPending}
                            playingVideo={playingVideo}
                            onTogglePlay={(id) => setPlayingVideo(playingVideo === id ? null : id)}
                        />
                    </Suspense>
               </div>
        </div>
    );
}
