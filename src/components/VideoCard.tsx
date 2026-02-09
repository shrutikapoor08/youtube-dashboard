import VideoDescription from "./VideoDescription";

export interface VideoCardProps {
  rank: number;
  thumbnail: string;
  title: string;
  channel: string;
  views: string;
  timeAgo: string;
  rating?: string;
}

export default function VideoCard({
  rank,
  thumbnail,
  title,
  channel,
  views,
  timeAgo,
  rating,
}: VideoCardProps) {
  return (
    <div className="cursor-pointer">
      <div className="relative overflow-hidden rounded-xl">
        <img
          src={thumbnail}
          alt={title}
          className="aspect-video w-full object-cover"
        />
        <span className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
          #{rank}
        </span>
      </div>
      <VideoDescription
        title={title}
        channel={channel}
        views={views}
        timeAgo={timeAgo}
        rating={rating}
      />
    </div>
  );
}
