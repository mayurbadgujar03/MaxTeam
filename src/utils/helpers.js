export const generateDynamicTimeline = (startDate, endDate) => {
  let weeks = 12; // Fallback default

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffInMs = end.getTime() - start.getTime();
    // Calculate weeks and round up (e.g., 4.2 weeks becomes 5 weeks)
    weeks = Math.max(1, Math.ceil(diffInMs / (1000 * 60 * 60 * 24 * 7)));
  }

  return Array.from({ length: weeks }, (_, i) => ({
    weekNumber: i + 1,
    title: `Week ${i + 1}`,
    description: "Define tasks for this week.",
    status: "PENDING",
    evaluatedBy: null,
    evaluatedAt: null,
  }));
};
