"use client";

import { useState } from "react";
import Tab from "./Tab";
import TrendingTechVideos from "./TrendingTechVideos";
import ChatSidebar from "./ChatSidebar";

const tabs = [
  {
    id: "discover",
    label: "Discover",
    subtitle: "Trending content",
    icon: "search" as const,
  },
  {
    id: "dashboard",
    label: "Shruti's YouTube Dashboard",
    subtitle: "Personal metrics",
    icon: "user" as const,
  },
];

export default function MyDashboard() {
  const [activeTab, setActiveTab] = useState("discover");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Tabs */}
      <Tab tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content + Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === "discover" ? (
          <TrendingTechVideos />
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-400">
            Dashboard coming soon
          </div>
        )}

        <ChatSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      </div>
    </div>
  );
}
