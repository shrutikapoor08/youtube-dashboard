/**
 * Mock trending video data used as a fallback when the YouTube API
 * quota is exceeded (403 error).
 */

export interface MockTrendingVideo {
  videoId: string;
  title: string;
  channel: string;
  views: string;
  viewCount: number;
  timeAgo: string;
  thumbnail: string;
  category: string;
  rank: number;
  rating: string;
}

export const MOCK_TRENDING_VIDEOS: MockTrendingVideo[] = [
  {
    videoId: "mock-1",
    title: "Build a Full-Stack AI App with Next.js and LangChain",
    channel: "TECH WITH TIM",
    views: "1.2M",
    viewCount: 1_200_000,
    timeAgo: "2 weeks ago",
    thumbnail: "https://placehold.co/480x270/1a1a2e/ffffff?text=AI+Full+Stack+App",
    category: "AI & ML",
    rank: 1,
    rating: "Viral",
  },
  {
    videoId: "mock-2",
    title: "React Server Components Explained in 10 Minutes",
    channel: "FIRESHIP",
    views: "890K",
    viewCount: 890_000,
    timeAgo: "1 week ago",
    thumbnail: "https://placehold.co/480x270/16213e/ffffff?text=React+Server+Components",
    category: "React",
    rank: 2,
    rating: "Viral",
  },
  {
    videoId: "mock-3",
    title: "I Mass Applied to 500 Jobs Using AI - Here's What Happened",
    channel: "JOSHUA FLUKE",
    views: "650K",
    viewCount: 650_000,
    timeAgo: "3 days ago",
    thumbnail: "https://placehold.co/480x270/0f3460/ffffff?text=AI+Job+Search",
    category: "Tech Careers",
    rank: 3,
    rating: "Viral",
  },
  {
    videoId: "mock-4",
    title: "The New JavaScript Features You Need to Know in 2026",
    channel: "TRAVERSY MEDIA",
    views: "430K",
    viewCount: 430_000,
    timeAgo: "5 days ago",
    thumbnail: "https://placehold.co/480x270/533483/ffffff?text=JavaScript+2026",
    category: "JavaScript",
    rank: 4,
    rating: "Excellent",
  },
  {
    videoId: "mock-5",
    title: "CSS Container Queries Changed Everything",
    channel: "KEVIN POWELL",
    views: "320K",
    viewCount: 320_000,
    timeAgo: "1 week ago",
    thumbnail: "https://placehold.co/480x270/e94560/ffffff?text=CSS+Container+Queries",
    category: "Web Dev",
    rank: 5,
    rating: "Excellent",
  },
  {
    videoId: "mock-6",
    title: "Contributing to Open Source: A Complete Guide for Beginners",
    channel: "EDDIE JAOUDE",
    views: "210K",
    viewCount: 210_000,
    timeAgo: "2 weeks ago",
    thumbnail: "https://placehold.co/480x270/2b2d42/ffffff?text=Open+Source+Guide",
    category: "Open Source",
    rank: 6,
    rating: "Excellent",
  },
  {
    videoId: "mock-7",
    title: "Fine-Tuning LLMs on Your Own Data - Practical Tutorial",
    channel: "SENTDEX",
    views: "180K",
    viewCount: 180_000,
    timeAgo: "4 days ago",
    thumbnail: "https://placehold.co/480x270/1a1a2e/ffffff?text=Fine+Tuning+LLMs",
    category: "AI & ML",
    rank: 7,
    rating: "Excellent",
  },
  {
    videoId: "mock-8",
    title: "Next.js 15 App Router: Complete Tutorial",
    channel: "LEE ROBINSON",
    views: "155K",
    viewCount: 155_000,
    timeAgo: "1 week ago",
    thumbnail: "https://placehold.co/480x270/16213e/ffffff?text=Next.js+15+Tutorial",
    category: "React",
    rank: 8,
    rating: "Excellent",
  },
  {
    videoId: "mock-9",
    title: "From Junior to Senior Developer - The Skills Nobody Tells You",
    channel: "THEO",
    views: "140K",
    viewCount: 140_000,
    timeAgo: "6 days ago",
    thumbnail: "https://placehold.co/480x270/0f3460/ffffff?text=Junior+to+Senior",
    category: "Tech Careers",
    rank: 9,
    rating: "Excellent",
  },
  {
    videoId: "mock-10",
    title: "TypeScript 5.5 - The Features That Matter",
    channel: "MATT POCOCK",
    views: "120K",
    viewCount: 120_000,
    timeAgo: "2 weeks ago",
    thumbnail: "https://placehold.co/480x270/533483/ffffff?text=TypeScript+5.5",
    category: "JavaScript",
    rank: 10,
    rating: "Excellent",
  },
  {
    videoId: "mock-11",
    title: "Building a Design System with Tailwind CSS v4",
    channel: "ADAM WATHAN",
    views: "98K",
    viewCount: 98_000,
    timeAgo: "1 week ago",
    thumbnail: "https://placehold.co/480x270/e94560/ffffff?text=Tailwind+v4",
    category: "Web Dev",
    rank: 11,
    rating: "Great",
  },
  {
    videoId: "mock-12",
    title: "How We Built an Open Source Alternative to Vercel",
    channel: "PRIMEAGEN",
    views: "85K",
    viewCount: 85_000,
    timeAgo: "3 days ago",
    thumbnail: "https://placehold.co/480x270/2b2d42/ffffff?text=Open+Source+Vercel",
    category: "Open Source",
    rank: 12,
    rating: "Great",
  },
];
