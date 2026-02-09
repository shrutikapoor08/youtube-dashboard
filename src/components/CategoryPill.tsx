"use client";

interface CategoryPillProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

export default function CategoryPill({
  label,
  isActive = false,
  onClick,
}: CategoryPillProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
        isActive
          ? "border-blue-600 bg-blue-600 text-white"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}
