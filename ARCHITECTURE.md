# Architecture

## System Overview

This is a Next.js 15 app that uses **Tambo AI** to build a generative UI dashboard for YouTube analytics. Users ask questions in a chat sidebar, and the AI dynamically renders registered React components (charts, video cards, grids) populated with real YouTube data.

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌──────────────────────────────┐  ┌─────────────────────┐  │
│  │       Dashboard              │  │   Chat Sidebar      │  │
│  │  ┌────────┐  ┌────────────┐  │  │                     │  │
│  │  │Discover│  │My Dashboard│  │  │  "Show me trending  │  │
│  │  │  Tab   │  │    Tab     │  │  │   AI tutorials"     │  │
│  │  ├────────┴──┴────────────┤  │  │         │           │  │
│  │  │                        │  │  │         ▼           │  │
│  │  │  VideoGrid / Charts /  │  │  │  ┌─────────────┐   │  │
│  │  │  DataCards rendered    │  │  │  │ AI-rendered  │   │  │
│  │  │  statically            │  │  │  │ VideoGrid /  │   │  │
│  │  │                        │  │  │  │ Graph /      │   │  │
│  │  │                        │  │  │  │ DataCard     │   │  │
│  │  │                        │  │  │  └─────────────┘   │  │
│  │  └────────────────────────┘  │  └─────────────────────┘  │
│  └──────────────────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

---

## How Tambo Generative UI Works

Tambo is a **Generative UI Agent for React**. Instead of returning text-only responses, it dynamically selects and renders pre-registered React components with AI-determined props. Here's the mental model:

```
Traditional AI Chat:              Tambo Generative UI:
┌─────────────────┐               ┌─────────────────┐
│ User: "Show me  │               │ User: "Show me  │
│ trending videos"│               │ trending videos"│
│                 │               │                 │
│ AI: "Here are   │               │ AI renders:     │
│ the top videos: │               │ ┌─────────────┐ │
│ 1. Video A      │               │ │ VideoGrid   │ │
│ 2. Video B      │               │ │ ┌───┐ ┌───┐ │ │
│ 3. Video C..."  │               │ │ │ A │ │ B │ │ │
│                 │               │ │ └───┘ └───┘ │ │
│                 │               │ │ ┌───┐ ┌───┐ │ │
│ (plain text)    │               │ │ │ C │ │ D │ │ │
│                 │               │ │ └───┘ └───┘ │ │
│                 │               │ └─────────────┘ │
└─────────────────┘               └─────────────────┘
```

The key insight: **components and tools are registered ahead of time**, and the AI decides at runtime which to use based on the user's message.

---

## Data Flow: Prompt → Rendered UI (Full Sequence)

This is the complete path when a user sends a message like _"Show me trending AI tutorials"_:

```
┌──────────┐     ┌───────────────┐     ┌──────────────┐     ┌───────────────┐
│  User    │     │  Tambo React  │     │  Tambo Cloud  │     │  YouTube API  │
│  Input   │     │  SDK (Client) │     │  (AI Agent)   │     │  v3           │
└────┬─────┘     └───────┬───────┘     └──────┬────────┘     └───────┬───────┘
     │                   │                    │                      │
     │ 1. Type message   │                    │                      │
     │ in ChatSidebar    │                    │                      │
     │──────────────────►│                    │                      │
     │                   │                    │                      │
     │                   │ 2. useTamboThread  │                      │
     │                   │ sends message +    │                      │
     │                   │ registry manifest: │                      │
     │                   │ • 4 components     │                      │
     │                   │   (names, schemas) │                      │
     │                   │ • 4 tools          │                      │
     │                   │   (names, schemas) │                      │
     │                   │───────────────────►│                      │
     │                   │                    │                      │
     │                   │                    │ 3. AI reasons:       │
     │                   │                    │ "User wants trending │
     │                   │                    │  videos in AI        │
     │                   │                    │  category. I should  │
     │                   │                    │  call getTrending-   │
     │                   │                    │  Videos tool, then   │
     │                   │                    │  render a VideoGrid" │
     │                   │                    │                      │
     │                   │ 4. Tool invocation │                      │
     │                   │ getTrendingVideos  │                      │
     │                   │ ({category:        │                      │
     │                   │  "AI tutorials",   │                      │
     │                   │  limit: 8})        │                      │
     │                   │◄───────────────────│                      │
     │                   │                    │                      │
     │                   │ 5. Tool executes   │                      │
     │                   │ client-side        │                      │
     │                   │ (see caching flow  │                      │
     │                   │  below)            │                      │
     │                   │                    │                      │
     │                   │ 6. Tool returns    │                      │
     │                   │ video data array   │                      │
     │                   │───────────────────►│                      │
     │                   │                    │                      │
     │                   │                    │ 7. AI decides:       │
     │                   │                    │ "Render VideoGrid    │
     │                   │                    │  with these videos"  │
     │                   │                    │                      │
     │                   │ 8. Stream response │                      │
     │                   │ {                  │                      │
     │                   │  component:        │                      │
     │                   │    "VideoGrid",    │                      │
     │                   │  props: {          │                      │
     │                   │    videos: [...]   │                      │
     │                   │  }                 │                      │
     │                   │ }                  │                      │
     │                   │◄───────────────────│                      │
     │                   │                    │                      │
     │                   │ 9. SDK matches     │                      │
     │                   │ "VideoGrid" to     │                      │
     │                   │ registered         │                      │
     │                   │ component, renders │                      │
     │                   │ with streamed props│                      │
     │                   │                    │                      │
     │ 10. VideoGrid     │                    │                      │
     │ appears in chat   │                    │                      │
     │ with real data    │                    │                      │
     │◄──────────────────│                    │                      │
```

---

## Component Registration & Provider Setup

Components and tools are registered centrally in `src/lib/tambo.ts` and injected via `TamboProvider`:

```
src/lib/tambo.ts
┌─────────────────────────────────────────────────────┐
│                                                     │
│  components = [                                     │
│    ┌─────────────────────────────────────────┐      │
│    │ name: "Graph"                           │      │
│    │ description: "Data visualization..."    │      │
│    │ component: Graph                        │      │
│    │ propsSchema: z.object({                 │      │
│    │   data, title, showLegend, variant...   │      │
│    │ })                                      │      │
│    └─────────────────────────────────────────┘      │
│    ┌─────────────────────────────────────────┐      │
│    │ name: "VideoCard"                       │      │
│    │ component: VideoCard                    │      │
│    │ propsSchema: videoCardSchema            │      │
│    └─────────────────────────────────────────┘      │
│    ┌─────────────────────────────────────────┐      │
│    │ name: "VideoGrid"                       │      │
│    │ component: VideoGrid                    │      │
│    │ propsSchema: videoGridSchema            │      │
│    └─────────────────────────────────────────┘      │
│    ┌─────────────────────────────────────────┐      │
│    │ name: "DataCard"                        │      │
│    │ component: DataCard                     │      │
│    │ propsSchema: dataCardSchema             │      │
│    └─────────────────────────────────────────┘      │
│  ]                                                  │
│                                                     │
│  tools = [                                          │
│    ┌─────────────────────────────────────────┐      │
│    │ getTrendingVideos                       │      │
│    │ input: {category, limit}                │      │
│    │ output: TrendingVideo[]                 │      │
│    └─────────────────────────────────────────┘      │
│    ┌─────────────────────────────────────────┐      │
│    │ getChannelMetrics                       │      │
│    │ input: {period: '7d'|'30d'|'90d'}      │      │
│    │ output: ChannelMetric[]                 │      │
│    └─────────────────────────────────────────┘      │
│    ┌─────────────────────────────────────────┐      │
│    │ getVideoPerformance                     │      │
│    │ input: {limit, sortBy}                  │      │
│    │ output: VideoMetric[]                   │      │
│    └─────────────────────────────────────────┘      │
│    ┌─────────────────────────────────────────┐      │
│    │ getPerformanceInsights                  │      │
│    │ input: {metric?}                        │      │
│    │ output: PerformanceInsight[]            │      │
│    └─────────────────────────────────────────┘      │
│  ]                                                  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
              TamboProvider (page.tsx)
              ┌────────────────────────┐
              │ apiKey = TAMBO_API_KEY  │
              │ components = [...]     │
              │ tools = [...]          │
              │ mcpServers = [...]     │
              └────────┬───────────────┘
                       │
          Provides context to all children
                       │
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
    useTamboThread  useTambo    useTamboStreaming
    (send messages, (registry)  (real-time
     read history)              component
                                rendering)
```

---

## Caching Architecture (Dual-Layer)

The app uses a **dual-layer cache** to minimize YouTube API quota usage (10,000 units/day).

```
                   Request for video data
                          │
                          ▼
           ┌──────────────────────────────┐
           │   Layer 1: Client Cache      │
           │   (localStorage + in-memory) │
           │                              │
           │   APICache class in          │
           │   youtube-data.ts            │
           │                              │
           │   Key: youtube_{prefix}_     │
           │        {JSON params}         │
           │                              │
           │   TTLs:                      │
           │   ├── Channel metrics: 15min │
           │   ├── Video perf:     15min  │
           │   ├── Trending:        1hr   │
           │   └── Insights:       30min  │
           └──────────┬───────────────────┘
                      │
                 MISS │  HIT → return immediately
                      ▼
           ┌──────────────────────────────┐
           │   Layer 2: Server Cache      │
           │   (in-memory Map)            │
           │                              │
           │   /api/youtube/trending      │
           │   route handler              │
           │                              │
           │   Keys:                      │
           │   ├── "all" → all videos     │
           │   └── {category} → filtered  │
           │                              │
           │   TTL: 1 hour                │
           │   Lost on server restart     │
           └──────────┬───────────────────┘
                      │
                 MISS │  HIT → return cached
                      ▼
           ┌──────────────────────────────┐
           │   YouTube Data API v3        │
           │                              │
           │   Endpoints used:            │
           │   ├── /v3/videos             │
           │   │   (mostPopular, by ID)   │
           │   ├── /v3/search             │
           │   │   (by query or channel)  │
           │   └── /v3/channels           │
           │       (subscriber count etc) │
           │                              │
           │   Rate: 10,000 units/day     │
           └──────────┬───────────────────┘
                      │
                 403? │  OK → filter, score,
                      │       cache, return
                      ▼
           ┌──────────────────────────────┐
           │   Fallback: Mock Data        │
           │                              │
           │   mock-trending-data.ts      │
           │   36 pre-built videos:       │
           │   ├── React                  │
           │   ├── JavaScript             │
           │   ├── AI & ML               │
           │   ├── Web Dev                │
           │   └── Tech Careers           │
           │                              │
           │   User sees no error —       │
           │   UI renders normally        │
           └──────────────────────────────┘
```

---

## Video Data Pipeline

Raw YouTube API responses go through filtering and scoring before reaching UI components:

```
YouTube API Response
┌──────────────────────────┐
│ {                        │
│   id, snippet {          │
│     title, channelTitle, │
│     thumbnails,          │
│     publishedAt, tags    │
│   },                     │
│   statistics {           │
│     viewCount,           │
│     likeCount            │
│   },                     │
│   contentDetails {       │
│     duration (ISO 8601)  │
│   }                      │
│ }                        │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Filter Stage            │
│                          │
│  ✗ Duration < 60s        │
│  ✗ Title has #shorts     │
│  ✗ Views < 5,000         │
│  ✗ Duration < 3 min      │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Scoring Stage           │
│                          │
│  trendScore =            │
│    viewsPerHour +        │
│    engagementBoost       │
│    (likeRatio)           │
│                          │
│  qualityScore =          │
│    likeToView (40%) +    │
│    viewsVelocity (30%) + │
│    durationFit (30%)     │
│                          │
│  category =              │
│    keyword match on      │
│    title + tags          │
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  Output: TrendingVideo   │
│                          │
│  { videoId, title,       │
│    channelName,          │
│    thumbnailUrl, views,  │
│    publishedAt, rank,    │
│    trendScore,           │
│    qualityScore,         │
│    duration, category,   │
│    href }                │
└──────────────────────────┘
```

---

## AI Decision Flow

When the AI receives a message, it matches intent to registered tools and components:

```
User Message: "How are my videos performing this month?"
                    │
                    ▼
        ┌───────────────────────┐
        │  Tambo AI Agent       │
        │                       │
        │  Matches intent to:   │
        │                       │
        │  Tools:               │
        │  ├── getChannelMetrics│  ← "performing"
        │  └── getVideoPerf     │  ← "my videos"
        │                       │
        │  Components:          │
        │  ├── Graph            │  ← metrics over time
        │  └── VideoGrid        │  ← video listings
        └───────────┬───────────┘
                    │
         AI calls both tools
                    │
        ┌───────────┴───────────────────────┐
        │                                   │
        ▼                                   ▼
  getChannelMetrics               getVideoPerformance
  ({period: "30d"})               ({limit: 10,
        │                          sortBy: "views"})
        │                                   │
        ▼                                   ▼
  [{name: "Views",                [{title: "...",
    value: "125K",                  views: 45000,
    trend: "+12%"}, ...]            watchTime: 2400}, ...]
        │                                   │
        └───────────┬───────────────────────┘
                    │
                    ▼
        AI streams component renders:
        ┌─────────────────────────┐
        │ Graph                   │
        │ props: {                │
        │   data: [metrics],      │
        │   title: "30-Day Perf", │
        │   variant: "bar"        │
        │ }                       │
        ├─────────────────────────┤
        │ VideoGrid               │
        │ props: {                │
        │   videos: [top 10]      │
        │ }                       │
        └─────────┬───────────────┘
                  │
                  ▼
        Components render
        progressively in
        the chat sidebar
```

---

## Error Handling & Resilience

```
Normal Path                    Error Path
──────────                     ──────────
YouTube API                    YouTube API 403 (quota exceeded)
    │                                  │
    ▼                                  ▼
Filter → Score                 Retry: exponential backoff
    │                          (3 attempts: 1s → 2s → 4s)
    ▼                                  │
Cache result                           ▼ still failing
    │                          Return MOCK_TRENDING_VIDEOS
    ▼                          (36 videos, 5 categories)
Return to UI                           │
                                       ▼
                               UI renders normally —
                               user sees no error
```

---

## Component Hierarchy

```
page.tsx (TamboProvider)
├── Tab (Discover | Dashboard)
├── Main Content
│   ├── TrendingTechVideos
│   │   ├── Search input
│   │   ├── CategoryPill[] (React, AI & ML, JavaScript, ...)
│   │   └── VideoGrid
│   │       └── VideoCard[]
│   │           └── VideoDescription
│   └── MyDashboard
└── ChatSidebar
    └── MessageThreadFull (Tambo)
        └── AI-rendered components:
            ├── VideoGrid / VideoCard
            ├── Graph (Recharts bar/line/pie)
            └── DataCard
```

---

## File Map

```
src/
├── app/
│   ├── page.tsx                    # Main dashboard with TamboProvider
│   ├── layout.tsx                  # Root HTML layout
│   ├── chat/page.tsx               # Full-screen chat interface
│   └── api/youtube/trending/
│       └── route.ts                # REST endpoint with server-side cache
│
├── components/
│   ├── tambo/                      # AI-renderable + chat UI
│   │   ├── graph.tsx               # Recharts bar/line/pie (registered)
│   │   ├── message.tsx             # Chat message + tool call display
│   │   ├── message-input.tsx       # Chat input with suggestions
│   │   ├── message-thread-full.tsx # Full thread container
│   │   └── markdown-components.tsx # Streamdown markdown rendering
│   ├── VideoCard.tsx               # Single video card (registered)
│   ├── VideoGrid.tsx               # 4-col responsive grid (registered)
│   ├── VideoDescription.tsx        # Video metadata (title, views, etc)
│   ├── ChatSidebar.tsx             # Right sidebar wrapper
│   ├── MyDashboard.tsx             # Personal channel metrics tab
│   └── TrendingTechVideos.tsx      # Discover tab content
│
├── lib/
│   ├── tambo.ts                    # CENTRAL: component + tool registration
│   ├── thread-hooks.ts             # Thread management hooks
│   └── utils.ts                    # cn() utility
│
└── services/
    ├── youtube-data.ts             # YouTube API client + APICache class
    └── mock-trending-data.ts       # 36 fallback mock videos
```

---

## YouTube API Quota Usage

| Endpoint | Cost | Used By |
|----------|------|---------|
| `videos.list?chart=mostPopular` | 1 unit | API route (trending page) |
| `search.list` | 100 units | youtube-data.ts (Tambo tools) |
| `videos.list` (by ID) | 1 unit | youtube-data.ts (video details) |
| `channels.list` | 1 unit | youtube-data.ts (channel stats) |

Daily quota: 10,000 units. The trending page uses **1 unit per cache miss** (1-hour TTL). Tool-based searches are more expensive at 100 units each, mitigated by the 15-min to 1-hour client cache.
