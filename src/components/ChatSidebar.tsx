"use client";

import { useState } from "react";
import {
  ArrowRightToLine,
  Plus,
  Search,
  Paperclip,
  Mic,
  ArrowUp,
  PaperclipIcon,
} from "lucide-react";

interface ChatSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function ChatSidebar({
  isOpen = true,
  onToggle,
}: ChatSidebarProps) {
  const [input, setInput] = useState("");

  if (!isOpen) {
    return (
      <div className="flex w-12 flex-col items-center border-l border-gray-200 bg-white py-4">
        <button
          onClick={onToggle}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
        >
          <ArrowRightToLine size={18} className="rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-80 flex-col border-l border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">AI Assistant</h2>
          <p className="text-xs text-gray-400">Ask about analytics & trends</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 border-b border-gray-200 px-3 py-2">
        <button
          onClick={onToggle}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
        >
          <ArrowRightToLine size={16} />
        </button>
        <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
          <Plus size={16} />
        </button>
        <button className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
          <Search size={16} />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1" />

      {/* Suggestions */}
      <div className="flex flex-wrap gap-2 px-4 pb-3">
        {["Get started", "Learn more", "Examples"].map((suggestion) => (
          <button
            key={suggestion}
            className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500 hover:bg-gray-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
          <button className="text-gray-400 hover:text-gray-500">
            <Paperclip size={16} />
          </button>
          <button className="text-gray-400 hover:text-gray-500">
            <PaperclipIcon size={16} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
          />
          <button className="text-gray-400 hover:text-gray-500">
            <Mic size={16} />
          </button>
          <button className="rounded-full bg-blue-600 p-1 text-white hover:bg-blue-700">
            <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
