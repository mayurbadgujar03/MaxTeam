import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { InstitutionWorkspace } from "../models/workspace.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { User } from "../models/user.models.js";
import { Batch } from "../models/batch.models.js";
import mongoose from "mongoose";

const getMyWorkspaces = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userObjId = new mongoose.Types.ObjectId(userId);
  const userIdStr = userId.toString();

  // 1. Workspaces where user is an authorized HOD
  const hodWorkspaces = await InstitutionWorkspace.find({
    authorizedHods: userObjId,
    deletedAt: null,
  })
    .select("_id name description authorizedHods")
    .lean();

  // 2. Workspaces where user is a project member
  const memberships = await ProjectMember.find({
    user: userObjId,
    deletedAt: null,
  })
    .populate({
      path: "project",
      match: { deletedAt: null },
      select: "workspaceId",
    })
    .lean();

  const memberWorkspaceIds = memberships
    .map((m) => m.project?.workspaceId)
    .filter((id) => id != null)
    .map((id) => id.toString());

  // 3. Workspaces where user is a Batch Coordinator
  const coordinatorBatches = await Batch.find({
    coordinators: userObjId,
    deletedAt: null,
  })
    .select("workspaceId coordinators")
    .lean();

  const coordinatorWorkspaceIds = coordinatorBatches
    .map((b) => b.workspaceId)
    .filter((id) => id != null)
    .map((id) => id.toString());

  // Combine IDs and fetch additional workspaces in one query
  const additionalWorkspaceIds = [
    ...new Set([...memberWorkspaceIds, ...coordinatorWorkspaceIds]),
  ];

  const additionalWorkspaces = await InstitutionWorkspace.find({
    _id: { $in: additionalWorkspaceIds },
    deletedAt: null,
  })
    .select("_id name description authorizedHods")
    .lean();

  // Merge and deduplicate all workspace documents
  const merged = [...hodWorkspaces, ...additionalWorkspaces];
  const seen = new Set();
  const uniqueWorkspaces = [];

  for (const ws of merged) {
    const idStr = ws._id.toString();
    if (!seen.has(idStr)) {
      seen.add(idStr);
      uniqueWorkspaces.push(ws);
    }
  }

  // Fetch all batches in these workspaces to collect coordinator IDs
  const allWorkspaceIds = uniqueWorkspaces.map((ws) => ws._id);
  const batchesInWorkspaces = await Batch.find({
    workspaceId: { $in: allWorkspaceIds },
    deletedAt: null,
  })
    .select("workspaceId coordinators")
    .lean();

  const workspaceCoordinatorsMap = new Map();
  for (const b of batchesInWorkspaces) {
    const wsIdStr = b.workspaceId?.toString();
    if (!wsIdStr) continue;
    if (!workspaceCoordinatorsMap.has(wsIdStr)) {
      workspaceCoordinatorsMap.set(wsIdStr, new Set());
    }
    const set = workspaceCoordinatorsMap.get(wsIdStr);
    for (const c of b.coordinators || []) {
      if (c) {
        set.add((c._id || c).toString());
      }
    }
  }

  const workspaces = uniqueWorkspaces.map((ws) => {
    const idStr = ws._id.toString();
    const hodIds = (ws.authorizedHods || []).map((h) => (h._id || h).toString());
    const coordSet = workspaceCoordinatorsMap.get(idStr) || new Set();
    const coordIds = Array.from(coordSet);

    return {
      _id: ws._id,
      name: ws.name,
      description: ws.description || "",
      authorizedHods: hodIds,
      coordinators: coordIds,
      isHod: hodIds.includes(userIdStr),
      isCoordinator: coordIds.includes(userIdStr),
    };
  });

  return res
    .status(200)
    .json(new ApiResponse(200, workspaces, "Workspaces fetched successfully"));
});

const addWorkspaceHod = asyncHandler(async (req, res) => {
  const { workspaceId } = req.params;
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // Verify workspace exists
  const workspace = await InstitutionWorkspace.findById(workspaceId);
  if (!workspace) {
    throw new ApiError(404, "Workspace not found");
  }

  // Only an existing HOD on this workspace can invite others
  const callerIsHod = workspace.authorizedHods.some(
    (hodId) => hodId.toString() === req.user._id.toString(),
  );
  if (!callerIsHod) {
    throw new ApiError(403, "Only authorized HODs can invite other HODs to this workspace");
  }

  // Find the user to invite
  const invitee = await User.findOne({ email: email.toLowerCase().trim() });
  if (!invitee) {
    throw new ApiError(404, "No user found with that email address");
  }

  // $addToSet prevents duplicates automatically
  await InstitutionWorkspace.findByIdAndUpdate(workspaceId, {
    $addToSet: { authorizedHods: invitee._id },
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { inviteeId: invitee._id, inviteeName: invitee.fullname },
        "HOD added to workspace successfully",
      ),
    );
});

export { getMyWorkspaces, addWorkspaceHod };
