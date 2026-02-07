"use client";

import { ChatSidebar } from "@/components/ChatSidebar";
import { MyDashboard } from "@/components/MyDashboard";
import { Tab } from "@/components/tab";
import { TrendingTechVideos } from "@/components/TrendingTechVideos";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import { useState } from "react";

type TabId = "my-dashboard" | "discover";

export default function Home() {
  const mcpServers = useMcpServers();
  const [activeTab, setActiveTab] = useState<TabId>("discover");

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
      mcpServers={mcpServers}
    >
      <div className="h-svh bg-gray-50 flex">
        <div className="flex-1 flex flex-col min-w-0 overflow-scroll-y">
          <div className="bg-white border-b border-gray-200 px-6">
            <nav className="flex gap-1" aria-label="Tabs">
              <Tab
                label="Discover"
                subtitle="Trending content"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                isActive={activeTab === "discover"}
                onClick={() => setActiveTab("discover")}
              />
              <Tab
                label="Shruti's YouTube Dashboard"
                subtitle="Personal metrics"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                isActive={activeTab === "my-dashboard"}
                onClick={() => setActiveTab("my-dashboard")}
              />
            </nav>
          </div>

          <main className="flex-1 overflow-auto">
            <div className="bg-white m-6 rounded-lg shadow-sm border border-gray-200">
              {activeTab === "my-dashboard" ? <MyDashboard /> : <TrendingTechVideos />}
            </div>
          </main>
        </div>

        <ChatSidebar />
      </div>
    </TamboProvider>
  );
}
