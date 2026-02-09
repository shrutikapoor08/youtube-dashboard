import VideoCard, { VideoCardProps } from "./VideoCard";

interface VideoGridProps {
  videos: VideoCardProps[];
}

export default function VideoGrid({ videos }: VideoGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard key={video.rank} {...video} />
      ))}
    </div>
  );
}
