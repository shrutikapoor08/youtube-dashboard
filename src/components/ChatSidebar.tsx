"use client";

import { MessageThreadFull } from "@/components/tambo/message-thread-full";

export default function ChatSidebar() {
  return (
    <aside className="h-svh w-96 bg-white border-l border-gray-200 flex flex-col">
      <div className="border-b border-gray-200 px-4 py-3 bg-gray-50">
        <h2 className="font-medium text-gray-700">AI Assistant</h2>
        <p className="text-xs text-gray-500 mt-1">
          Ask about analytics & trends
        </p>
      </div>
      <div className="flex-1 overflow-y-scroll">
        <MessageThreadFull />
      </div>
    </aside>
  );
}
