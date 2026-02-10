import { z } from "zod";
import VideoDescription from "./VideoDescription";
import { withInteractable } from "@tambo-ai/react";


export interface VideoCardProps {
  rank: number;
  thumbnail: string;
  title: string;
  channel: string;
  views: string;
  timeAgo: string;
  rating?: string;
}


export const videoCardSchema = z.object({
  videoId: z.string().describe("The YouTube video ID"),
  title: z.string().describe("The video title"),
  channelName: z.string().describe("The channel or category name"),
  thumbnailUrl: z.string().describe("URL of the video thumbnail image"),
  views: z.number().describe("Number of views"),
  publishedAt: z.string().describe("ISO date string of when the video was published"),
  rank: z.number().describe("Rank number to display as a badge"),
  qualityScore: z.number().optional().describe("Quality score 0-100 based on engagement signals"),
  href: z.string().optional().describe("Optional link URL to open on click"),
});

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

export const InteractableVideoCard = withInteractable(VideoCard, {
  componentName: "VideoCard",
  description:
    "A video card component that displays a YouTube video thumbnail with rank badge, title, channel name, view count, and publish date. Can link to YouTube or embed an inline player. Use this to display individual video results from trending or performance tools.",
  propsSchema: videoCardSchema,
});
