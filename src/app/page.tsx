"use client";

import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import { useState } from "react";

type TabId = "my-dashboard" | "discover";

export default function Home() {
  const mcpServers = useMcpServers();

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
      mcpServers={mcpServers}
    >
      <div className="h-svh bg-gray-50 flex">
        {/* Main Content */}
          <h1 className="text-6xl font-bold flex items-center justify-center w-full">Hello World!</h1>
      </div>
    </TamboProvider>
  );
}
