"use client";

import { ReactNode } from "react";

interface TabProps {
    label: string;
    subtitle: string;
    icon: ReactNode;
    isActive: boolean;
    onClick: () => void;
}

export default function Tab({ label, subtitle, icon, isActive, onClick }: TabProps) {
    return (
        <button
            onClick={onClick}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
        >
            <span className="flex items-center gap-2">
                {icon}
                {label}
            </span>
            <span className="block text-xs font-normal text-gray-400 mt-0.5">
                {subtitle}
            </span>
        </button>
    );
}
