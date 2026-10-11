export const generateDynamicTimeline = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return [];
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffInMs = end.getTime() - start.getTime();

  if (isNaN(diffInMs) || diffInMs <= 0) {
    return [];
  }

  // Calculate weeks and round up (e.g., 4.2 weeks becomes 5 weeks)
  const weeks = Math.max(1, Math.ceil(diffInMs / (1000 * 60 * 60 * 24 * 7)));

  return Array.from({ length: weeks }, (_, i) => ({
    weekNumber: i + 1,
    title: `Week ${i + 1}`,
    description: "Define tasks for this week.",
    status: "PENDING",
    evaluatedBy: null,
    evaluatedAt: null,
  }));
};
