interface VideoDescriptionProps {
  title: string;
  channel: string;
  views: string;
  timeAgo: string;
  rating?: string;
  summary?: string;
}

export default function VideoDescription({
  title,
  channel,
  views,
  timeAgo,
  rating,
  summary,
}: VideoDescriptionProps) {
  return (
    <div className="mt-2">
      <h3 className="text-sm font-semibold leading-tight line-clamp-2">
        {title}
      </h3>
      <p className="mt-1 text-xs font-medium uppercase text-gray-500">
        {channel}
      </p>
      <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
        <span>{views} views</span>
        <span>·</span>
        <span>{timeAgo}</span>
        {rating && (
          <span className="ml-1 rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
            {rating}
          </span>
        )}
      </div>
    </div>
  );
}
