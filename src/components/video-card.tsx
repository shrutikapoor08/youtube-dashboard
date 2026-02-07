"use client";

import { VideoThumbnail } from "@/components/video-thumbnail";
import { VideoDescription } from "@/components/video-description";

interface VideoCardProps {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  views: number;
  publishedAt: string;
  rank: number;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  href?: string;
}

export function VideoCard({
  videoId,
  title,
  channelName,
  thumbnailUrl,
  views,
  publishedAt,
  rank,
  isPlaying = false,
  onTogglePlay,
  href,
}: VideoCardProps) {
  const content = (
    <>
      <VideoThumbnail
        videoId={videoId}
        title={title}
        thumbnailUrl={thumbnailUrl}
        rank={rank}
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay ?? (() => {})}
      />
      <VideoDescription
        title={title}
        channelName={channelName}
        views={views}
        publishedAt={publishedAt}
      />
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="group cursor-pointer">
        {content}
      </a>
    );
  }

  return (
    <div className="group cursor-pointer" onClick={onTogglePlay}>
      {content}
    </div>
  );
}
