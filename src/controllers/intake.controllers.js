import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { UserRolesEnum } from "../utils/constants.js";
import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { PreInvitation } from "../models/preinvitation.models.js";

const processBatchIntake = asyncHandler(async (req, res) => {
  const { name, description, leaderEmail, memberEmails, mentorId, workspaceId, batchId } = req.body;

  if (!name || !description || !leaderEmail || !mentorId) {
    return res
      .status(400)
      .json(new ApiError(400, "name, description, leaderEmail, and mentorId are required"));
  }

  const project = await Project.create({
    name,
    description,
    createdBy: mentorId,
    workspaceId: workspaceId || null,
    batchId: batchId || null,
  });

  await ProjectMember.create({
    user: mentorId,
    project: project._id,
    role: UserRolesEnum.ADMIN,
  });

  const emailsToProcess = [
    { email: leaderEmail, role: UserRolesEnum.PROJECT_ADMIN },
    ...(memberEmails || []).map((email) => ({ email, role: UserRolesEnum.MEMBER })),
  ];

  const results = { assigned: [], ghosted: [] };

  for (const entry of emailsToProcess) {
    const normalizedEmail = entry.email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      const alreadyMember = await ProjectMember.findOne({
        user: existingUser._id,
        project: project._id,
      });

      if (!alreadyMember) {
        await ProjectMember.create({
          user: existingUser._id,
          project: project._id,
          role: entry.role,
        });
      }

      results.assigned.push(normalizedEmail);
    } else {
      await PreInvitation.create({
        email: normalizedEmail,
        projectId: project._id,
        role: entry.role,
        workspaceId: workspaceId || undefined,
      });

      results.ghosted.push(normalizedEmail);
    }
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { project, results },
        "Intake processed successfully",
      ),
    );
});

export { processBatchIntake };
