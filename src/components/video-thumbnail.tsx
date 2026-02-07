"use client";

interface VideoThumbnailProps {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  rank: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export function VideoThumbnail({
  videoId,
  title,
  thumbnailUrl,
  rank,
  isPlaying,
  onTogglePlay,
}: VideoThumbnailProps) {
  return (
    <div
      className="relative aspect-video rounded overflow-hidden bg-gray-100 mb-3 cursor-pointer"
      onClick={onTogglePlay}
    >
      {isPlaying ? (
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      ) : (
        <>
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span className="absolute top-2 left-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded">
            #{rank}
          </span>
        </>
      )}
    </div>
  );
}
