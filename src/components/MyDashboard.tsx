"use client";

import {
  getChannelMetrics,
  getVideoPerformance,
  getPerformanceInsights,
  ChannelMetric,
  VideoMetric,
  PerformanceInsight,
} from "@/services/youtube-data";
import { use, useState, Suspense } from "react";
import { formatNumber } from "@/lib/utils";
import { VideoCard } from "@/components/video-card";

// --- Data fetching function (returns a promise, no hooks) ---

interface DashboardData {
  metrics: ChannelMetric[];
  videos: VideoMetric[];
  insights: PerformanceInsight[];
}

function fetchDashboardData(): Promise<DashboardData> {
  return Promise.all([
    getChannelMetrics({ period: "30d" }),
    getVideoPerformance({ limit: 8, sortBy: "views" }),
    getPerformanceInsights(),
  ]).then(([metrics, videos, insights]) => ({ metrics, videos, insights }));
}

// --- Skeleton loader ---

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg" />
          ))}
        </div>
        <div className="bg-gray-200 h-64 rounded-lg" />
      </div>
    </div>
  );
}

// --- Dashboard content (consumes promise with use()) ---

function DashboardContent({ dataPromise }: { dataPromise: Promise<DashboardData> }) {
  const { metrics, videos, insights } = use(dataPromise);

  return (
    <div className="p-6 space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.name}
            className="bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 p-4 shadow-sm"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wide">{metric.name}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatNumber(metric.value)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {metric.changePercent}% vs previous
            </p>
          </div>
        ))}
      </div>

      {/* Top Videos */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-4">Top Performing Videos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8">
          {videos.map((video, index) => (
            <VideoCard
              key={video.videoId}
              videoId={video.videoId}
              title={video.title}
              channelName={video.category}
              thumbnailUrl={video.thumbnailUrl}
              views={video.views}
              publishedAt={video.publishedAt}
              rank={index + 1}
              href={`https://youtube.com/watch?v=${video.videoId}`}
            />
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Audience Insights</h3>
          <div className="space-y-4">
            {insights.map((insight) => (
              <div key={insight.metric} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">{insight.metric}</p>
                  <p className="text-xs text-gray-500">{insight.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {insight.data.slice(0, 5).map((item) => (
                    <div
                      key={item.label}
                      className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs"
                    >
                      {item.label}: {formatNumber(item.value)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Learning Section */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-3">What I&apos;m Learning</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/70 rounded-lg p-4">
            <p className="font-medium text-purple-700">Best Upload Day</p>
            <p className="text-gray-600 mt-1">
              {insights.find(i => i.metric === "Best Upload Day")?.data[0]?.label || "Analyzing..."}
            </p>
          </div>
          <div className="bg-white/70 rounded-lg p-4">
            <p className="font-medium text-blue-700">Top Category</p>
            <p className="text-gray-600 mt-1">
              {insights.find(i => i.metric === "Top Performing Topics")?.data[0]?.label || "Analyzing..."}
            </p>
          </div>
          <div className="bg-white/70 rounded-lg p-4">
            <p className="font-medium text-indigo-700">Avg Video Performance</p>
            <p className="text-gray-600 mt-1">
              {videos.length > 0
                ? `${formatNumber(videos.reduce((a, b) => a + b.views, 0) / videos.length)} views`
                : "Analyzing..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Container component ---

export function MyDashboard() {
  const [dataPromise] = useState(() => fetchDashboardData());

  return (

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent dataPromise={dataPromise} />
      </Suspense>
  );
}
