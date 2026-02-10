# Architecture

## High-Level Overview

```
+------------------------------------------------------------------+
|                         Browser (Client)                         |
|                                                                  |
|  +----------------------------+  +----------------------------+  |
|  |      Main Content Area     |  |      Chat Sidebar          |  |
|  |                            |  |                            |  |
|  |  +----------------------+  |  |  +----------------------+  |  |
|  |  | Tab: Discover        |  |  |  | MessageThreadFull    |  |  |
|  |  |  TrendingTechVideos  |  |  |  |  (Tambo AI Chat)     |  |  |
|  |  |    -> VideoGrid      |  |  |  |                      |  |  |
|  |  |       -> VideoCard   |  |  |  | AI can render:       |  |  |
|  |  +----------------------+  |  |  |  - VideoGrid         |  |  |
|  |  | Tab: Dashboard       |  |  |  |  - VideoCard         |  |  |
|  |  |  MyDashboard         |  |  |  |  - Graph             |  |  |
|  |  |  (coming soon)       |  |  |  |  - DataCard          |  |  |
|  |  +----------------------+  |  |  +----------------------+  |  |
|  +----------------------------+  +----------------------------+  |
+------------------------------------------------------------------+
```

## Data Flow

```
                          Page Load
                             |
                             v
                  +---------------------+
                  | localStorage Cache  |
                  | (TTL: 1 hour)       |
                  +---------------------+
                     |             |
                  HIT |          MISS
                     |             |
                     v             v
               Render         +-------------------+
              Instantly       | API Route         |
                              | /api/youtube/     |
                              |    trending       |
                              +-------------------+
                                 |            |
                              HIT |         MISS
                                 |            |
                                 v            v
                           Server-side   +-----------------+
                           In-Memory     | YouTube API     |
                           Cache         | videos.list     |
                           (1 hour)      | mostPopular     |
                                         | (1 quota unit)  |
                                         +-----------------+
                                              |
                                           403?
                                         /      \
                                       YES       NO
                                        |         |
                                        v         v
                                  Mock Data   Real Data
                                  Fallback    + Caching
```

## Caching Strategy (3 Layers)

```
Layer 1: Client localStorage     (TrendingTechVideos.tsx)
         TTL: 1 hour
         Survives page refresh and server restart

Layer 2: Server in-memory Map     (route.ts)
         TTL: 1 hour
         Fast server-side cache, lost on server restart

Layer 3: YouTube API Client Cache (youtube-data.ts via APICache)
         TTL: 15 min - 1 hour (varies by endpoint)
         localStorage-backed, used by Tambo AI tools
```

## File Structure

```
src/
├── app/
│   ├── page.tsx                    # Root page: tabs + TamboProvider
│   ├── layout.tsx                  # Root HTML layout
│   ├── api/
│   │   └── youtube/
│   │       └── trending/
│   │           └── route.ts        # GET /api/youtube/trending
│   ├── chat/page.tsx               # Standalone chat route
│   └── interactables/              # Interactive components demo
│
├── components/
│   ├── TrendingTechVideos.tsx      # Discover tab (fetches + filters videos)
│   ├── VideoGrid.tsx               # Grid layout for VideoCards
│   ├── VideoCard.tsx               # Single video card with thumbnail
│   ├── VideoDescription.tsx        # Title/channel/views text block
│   ├── CategoryPill.tsx            # Category filter pill button
│   ├── Tab.tsx                     # Tab navigation component
│   ├── MyDashboard.tsx             # Dashboard tab (WIP)
│   ├── ChatSidebar.tsx             # AI chat sidebar wrapper
│   ├── ApiKeyCheck.tsx             # API key validation
│   ├── ui/
│   │   └── card-data.tsx           # DataCard component
│   └── tambo/                      # Tambo AI chat components
│       ├── message-thread-full.tsx # Full chat thread
│       ├── message.tsx             # Single message bubble
│       ├── message-input.tsx       # Chat input box
│       ├── graph.tsx               # Recharts visualization
│       └── ...                     # Other Tambo UI pieces
│
├── services/
│   ├── youtube-data.ts             # YouTube API client (used by Tambo tools)
│   └── mock-trending-data.ts       # Fallback data for 403 quota errors
│
└── lib/
    ├── tambo.ts                    # CENTRAL CONFIG: component + tool registration
    ├── thread-hooks.ts             # Custom Tambo thread hooks
    ├── constants.ts                # App constants
    └── utils.ts                    # Utility functions
```

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
│   └── MyDashboard (WIP)
└── ChatSidebar
    └── MessageThreadFull (Tambo)
        └── AI-rendered components:
            ├── VideoGrid / VideoCard
            ├── Graph (Recharts)
            └── DataCard
```

## Tambo AI Integration

```
+------------------+         +------------------+
|   tambo.ts       |         |  TamboProvider   |
|                  |         |  (page.tsx)      |
|  components[] ---|-------->|                  |
|  - VideoGrid     |         |  Wraps entire    |
|  - VideoCard     |         |  app with AI     |
|  - Graph         |         |  capabilities    |
|  - DataCard      |         +------------------+
|                  |
|  tools[] --------|-------> AI can call these:
|  - getChannelMetrics       (channel stats)
|  - getVideoPerformance     (video analytics)
|  - getTrendingVideos       (trending by topic)
|  - getPerformanceInsights  (content strategy)
+------------------+

User asks in ChatSidebar
        |
        v
  Tambo AI processes query
        |
        v
  Calls registered tool (e.g. getTrendingVideos)
        |
        v
  Renders registered component (e.g. VideoGrid)
  with tool results as props
```

## YouTube API Quota Usage

| Endpoint | Cost | Used By |
|----------|------|---------|
| `videos.list?chart=mostPopular` | 1 unit | API route (trending page) |
| `search.list` | 100 units | youtube-data.ts (Tambo tools) |
| `videos.list` (by ID) | 1 unit | youtube-data.ts (details) |
| `channels.list` | 1 unit | youtube-data.ts (channel info) |

Daily quota: 10,000 units. The trending page uses **1 unit per cache miss** (1 hour TTL).
