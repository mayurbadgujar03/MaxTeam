import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { InstitutionWorkspace } from "../models/workspace.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { User } from "../models/user.models.js";
import { Batch } from "../models/batch.models.js";

const getMyWorkspaces = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // 1. Workspaces where user is an authorized HOD
  const hodWorkspaces = await InstitutionWorkspace.find({
    authorizedHods: userId,
  })
    .select("_id name")
    .lean();

  // 2. Workspaces where user is a project member
  const memberships = await ProjectMember.find({
    user: userId,
  })
    .populate({
      path: "project",
      select: "workspaceId",
    })
    .lean();

  const memberWorkspaceIds = memberships
    .map((m) => m.project?.workspaceId)
    .filter((id) => id != null);

  // 3. NEW: Workspaces where user is a Batch Coordinator
  const coordinatorBatches = await Batch.find({
    coordinators: userId,
  }).select("workspaceId").lean();

  const coordinatorWorkspaceIds = coordinatorBatches
    .map((b) => b.workspaceId)
    .filter((id) => id != null);

  // Combine IDs and fetch additional workspaces in one query
  const additionalWorkspaceIds = [...new Set([...memberWorkspaceIds, ...coordinatorWorkspaceIds])];

  const additionalWorkspaces = await InstitutionWorkspace.find({
    _id: { $in: additionalWorkspaceIds },
  })
    .select("_id name")
    .lean();

  // Merge and deduplicate, tagging each workspace with the user's role
  const hodIdSet = new Set(hodWorkspaces.map((ws) => ws._id.toString()));
  const coordinatorIdSet = new Set(coordinatorWorkspaceIds.map((id) => id.toString()));

  const merged = [...hodWorkspaces, ...additionalWorkspaces];
  const seen = new Set();
  const workspaces = [];

  for (const ws of merged) {
    const idStr = ws._id.toString();
    if (!seen.has(idStr)) {
      seen.add(idStr);
      workspaces.push({
        ...ws,
        isHod: hodIdSet.has(idStr),
        isCoordinator: coordinatorIdSet.has(idStr)
      });
    }
  }

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
