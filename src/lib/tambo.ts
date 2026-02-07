/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import { Graph, graphSchema } from "@/components/tambo/graph";
import { YouTubeGraph, youtubeGraphSchema } from "@/components/tambo/youtube-graph";
import { DataCard, dataCardSchema } from "@/components/ui/card-data";
import {
  getChannelMetrics,
  getVideoPerformance,
  getTrendingVideos,
  getPerformanceInsights,
} from "@/services/youtube-data";
import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

/**
 * tools
 *
 * This array contains all the Tambo tools that are registered for use within the application.
 * Each tool is defined with its name, description, and expected props. The tools
 * can be controlled by AI to dynamically fetch data based on user interactions.
 */

export const tools: TamboTool[] = [
  {
    name: "getChannelMetrics",
    description:
      "Get YouTube channel performance metrics including total views, watch time, subscribers, and average view duration. Filter by period: '7d', '30d', or '90d'.",
    tool: getChannelMetrics,
    inputSchema: z.object({
      period: z.string().optional(),
    }),
    outputSchema: z.array(
      z.object({
        name: z.string(),
        value: z.number(),
        unit: z.string(),
        changePercent: z.number(),
        trend: z.enum(["up", "down", "flat"]),
        period: z.string(),
      }),
    ),
  },
  {
    name: "getVideoPerformance",
    description:
      "Get detailed performance data for YouTube videos including views, watch time, and engagement metrics. Can sort by 'views', 'watchTime', 'duration', or 'date'. Limit results with the limit parameter. Use this to analyze which videos perform best and identify successful content patterns.",
    tool: getVideoPerformance,
    inputSchema: z.object({
      limit: z.number().optional(),
      sortBy: z.string().optional(),
    }),
    outputSchema: z.array(
      z.object({
        videoId: z.string(),
        title: z.string(),
        publishedAt: z.string(),
        views: z.number(),
        watchTimeHours: z.number(),
        averageViewDuration: z.number(),
        thumbnailUrl: z.string(),
        category: z.string(),
      }),
    ),
  },
  {
    name: "getTrendingVideos",
    description:
      "Get trending YouTube videos filtered by category. Available categories: 'AI tutorials', 'Coding', 'Web Dev', 'Career Advice', 'Industry Trends'. Use this to explore what's popular in tech and job seeker content, identify emerging skills, and understand market demands.",
    tool: getTrendingVideos,
    inputSchema: z.object({
      category: z.string().optional(),
      limit: z.number().optional(),
    }),
    outputSchema: z.array(
      z.object({
        videoId: z.string(),
        title: z.string(),
        channelName: z.string(),
        views: z.number(),
        publishedAt: z.string(),
        category: z.string(),
        trendScore: z.number(),
        thumbnailUrl: z.string(),
        tags: z.array(z.string()),
      }),
    ),
  },
  {
    name: "getPerformanceInsights",
    description:
      "Get insights about video performance patterns including best upload days, top performing topics, audience retention, and traffic sources. Use this to answer 'what am I learning about my audience' and discover patterns that help optimize content strategy.",
    tool: getPerformanceInsights,
    inputSchema: z.object({
      metric: z.string().optional(),
    }),
    outputSchema: z.array(
      z.object({
        metric: z.string(),
        description: z.string(),
        data: z.array(
          z.object({
            label: z.string(),
            value: z.number(),
          }),
        ),
      }),
    ),
  },
];

/**
 * components
 *
 * This array contains all the Tambo components that are registered for use within the application.
 * Each component is defined with its name, description, and expected props. The components
 * can be controlled by AI to dynamically render UI elements based on user interactions.
 */
export const components: TamboComponent[] = [
  {
    name: "Graph",
    description:
      "A component that renders various types of charts (bar, line, pie) using Recharts. Supports customizable data visualization with labels, datasets, and styling options.",
    component: Graph,
    propsSchema: graphSchema,
  },
  {
    name: "DataCard",
    description:
      "A component that displays options as clickable cards with links and summaries with the ability to select multiple items.",
    component: DataCard,
    propsSchema: dataCardSchema,
  },
];
