import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import { InstitutionWorkspace } from "../models/workspace.models.js";
import { ProjectMember } from "../models/projectmember.models.js";

const getMyWorkspaces = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Workspaces where user is an authorized HOD
  const hodWorkspaces = await InstitutionWorkspace.find({
    authorizedHods: userId,
  })
    .select("_id name")
    .lean();

  // 2. Workspaces where user is a project member
  // First, find all projects the user is a member of
  const memberships = await ProjectMember.find({
    user: userId,
  })
    .populate({
      path: "project",
      select: "workspaceId",
    })
    .lean();

  const workspaceIds = memberships
    .map((m) => m.project?.workspaceId)
    .filter((id) => id != null);

  const memberWorkspaces = await InstitutionWorkspace.find({
    _id: { $in: workspaceIds },
  })
    .select("_id name")
    .lean();

  // Merge and deduplicate
  const merged = [...hodWorkspaces, ...memberWorkspaces];
  const seen = new Set();
  const workspaces = [];

  for (const ws of merged) {
    const idStr = ws._id.toString();
    if (!seen.has(idStr)) {
      seen.add(idStr);
      workspaces.push(ws);
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, workspaces, "Workspaces fetched successfully"));
});

export { getMyWorkspaces };
