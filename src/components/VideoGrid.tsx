"use client";
import {InteractableVideoCard, VideoCardProps } from "./VideoCard";
import { withInteractable } from "@tambo-ai/react";
import { z } from "zod";


const videoGridItemSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  channelName: z.string(),
  thumbnailUrl: z.string(),
  views: z.number(),
  publishedAt: z.string(),
  rank: z.number().optional().describe("Rank badge number, defaults to position in array"),
  qualityScore: z.number().optional().describe("Quality score 0-100 based on engagement signals"),
  href: z.string().optional().describe("Optional link URL"),
});


export const videoGridSchema = z.object({
  videos: z.array(videoGridItemSchema).describe("Array of video data to display in a grid"),
  searchQuery: z.string().optional().describe("Optional search query to filter videos by title or channel name"),
  isPending: z.boolean().optional().describe("Whether the grid is in a loading/pending state (dims opacity)"),
});


interface VideoGridProps {
  videos: VideoCardProps[];
}

export default function VideoGrid({ videos }: VideoGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.length > 0 ? videos.map((video) => (
        <InteractableVideoCard key={video.rank} {...video} />
      )) : (
        <p className="text-gray-500 col-span-full text-center">No videos found.</p>
      )}
    </div>
  );
}


export const InteractableVideoGrid = withInteractable(VideoGrid, {
  componentName: "VideoGrid",
  description:
    "A responsive grid of video cards that displays YouTube videos in a 4-column layout. Supports client-side search filtering, pending state dimming, and inline video playback. Use this to display collections of videos from trending or performance tools.",
  propsSchema: videoGridSchema,
});

