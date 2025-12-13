import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { ProjectTask } from "../models/task.models.js";
import { ProjectNote } from "../models/note.models.js";
import { UserRolesEnum, TaskStatusEnum } from "../utils/constants.js";

const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const adminProjects = await ProjectMember.find({
    user: userId,
    role: UserRolesEnum.ADMIN,
  });
  
  const adminProjectIds = adminProjects.map((pm) => pm.project);
  
  const allMyProjects = await ProjectMember.find({ user: userId });
  const allProjectIds = allMyProjects.map((pm) => pm.project);

  const myActiveTasks = await ProjectTask.countDocuments({
    project: { $in: allProjectIds },
    assignedTo: userId,
    status: { $ne: TaskStatusEnum.DONE },
  });

  const uniqueMembers = await ProjectMember.distinct("user", {
    project: { $in: adminProjectIds },
    user: { $ne: userId },
  });
  const teamMembersCount = uniqueMembers.length;

  const myNotesCount = await ProjectNote.countDocuments({
    project: { $in: adminProjectIds },
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        activeTasks: myActiveTasks,
        teamMembers: teamMembersCount,
        notes: myNotesCount,
        totalProjects: adminProjectIds.length,
      },
      "Dashboard stats fetched successfully",
    ),
  );
});

export { getDashboardStats };
