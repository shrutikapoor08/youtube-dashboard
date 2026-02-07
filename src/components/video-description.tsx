"use client";

import { formatViews, formatDate } from "@/lib/utils";

interface VideoDescriptionProps {
  title: string;
  channelName: string;
  views: number;
  publishedAt: string;
}

export function VideoDescription({
  title,
  channelName,
  views,
  publishedAt,
}: VideoDescriptionProps) {
  return (
    <>
      <h3 className="font-bold text-sm text-gray-900 leading-snug line-clamp-2 group-hover:underline">
        {title}
      </h3>
      <p className="text-xs text-gray-500 uppercase tracking-wide mt-1.5">
        {channelName}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">
        {formatViews(views)} &middot; {formatDate(publishedAt)}
      </p>
    </>
  );
}
