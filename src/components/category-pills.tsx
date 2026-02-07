"use client";

interface Category {
  id: string;
  label: string;
}

interface CategoryPillsProps {
  categories: Category[];
  activeId: string | null;
  onChange: (id: string | null) => void;
}

export function CategoryPills({ categories, activeId, onChange }: CategoryPillsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3 px-6 py-2 max-w-4xl mx-auto">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onChange(activeId === category.id ? null : category.id)}
          className={`px-2 py-2 rounded-full text-xs border transition-colors ${
            activeId === category.id
              ? "bg-black text-white border-black"
              : "border-gray-300 text-gray-700 hover:border-gray-900 hover:text-gray-900"
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
}
