import { apiClient } from "@/lib/api-client";

export const attendanceApi = {
  getMilestoneAttendance: async (projectId, milestoneId) => {
    const response = await apiClient.get(`/attendance/${projectId}/milestones/${milestoneId}`);
    return response;
  },
  markMentorAttendance: async (projectId, milestoneId, records) => {
    const response = await apiClient.post(`/attendance/${projectId}/milestones/${milestoneId}/mentor`, { records });
    return response;
  },
  getBatchWeekAttendance: async (batchId, weekNumber) => {
    const response = await apiClient.get(`/attendance/batch/${batchId}?week=${weekNumber}`);
    return response;
  },
  markBatchAttendance: async (batchId, records, tier) => {
    const response = await apiClient.post(`/attendance/batch/${batchId}`, { records, tier });
    return response;
  },
};

export default attendanceApi;
