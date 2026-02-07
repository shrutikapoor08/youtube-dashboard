export const CATEGORIES = [
  { id: "react", label: "React" },
  { id: "ai", label: "AI & ML" },
  { id: "javascript", label: "JavaScript" },
  { id: "career", label: "Tech Careers" },
  { id: "webdev", label: "Web Dev" },
  { id: "opensource", label: "Open Source" },
];

export const CATEGORY_QUERIES: Record<string, string> = {
  react: "React JavaScript frontend",
  ai: "AI tutorials",
  javascript: "JavaScript TypeScript programming",
  career: "Career Advice",
  webdev: "Web Dev",
  opensource: "open source contributing GitHub",
};

export const SORT_OPTIONS = [
  { id: "relevant", label: "Relevance" },
  { id: "newest", label: "Upload date" },
  { id: "rated", label: "View count" },
];

export const DURATION_OPTIONS = [
  { id: "any", label: "Any length" },
  { id: "short", label: "Under 4 minutes" },
  { id: "medium", label: "4-20 minutes" },
  { id: "long", label: "Over 20 minutes" },
];
