import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { UserRolesEnum } from "../utils/constants.js";
import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { PreInvitation } from "../models/preinvitation.models.js";
import { Batch } from "../models/batch.models.js";
import { sendEmail, ghostInvitationMailgenContent } from "../utils/mail.js";
import { InstitutionWorkspace } from "../models/workspace.models.js";

const processBatchIntake = asyncHandler(async (req, res) => {
  const { name, description, leader, members, mentorId, workspaceId, batchId } = req.body;

  if (!name || !description || !leader || !leader.email || !batchId) {
    return res
      .status(400)
      .json(new ApiError(400, "name, description, leader (with email), and batchId are required"));
  }

  // Resolve the coordinator from the Batch if mentorId is not provided
  let resolvedMentorId = mentorId;
  if (!resolvedMentorId && batchId) {
    const batch = await Batch.findById(batchId).lean();
    if (!batch) {
      return res.status(404).json(new ApiError(404, "Batch not found"));
    }
    resolvedMentorId = batch.coordinators?.[0] || batch.createdBy;
  }

  if (!resolvedMentorId) {
    return res
      .status(400)
      .json(new ApiError(400, "Could not resolve a coordinator for this batch"));
  }

  const project = await Project.create({
    name,
    description,
    createdBy: resolvedMentorId,
    workspaceId: workspaceId || null,
    batchId: batchId || null,
  });

  await ProjectMember.create({
    user: resolvedMentorId,
    project: project._id,
    role: UserRolesEnum.ADMIN,
  });

  // Resolve inviter name from the coordinator user, since this is a public route
  let inviterName = "A Coordinator";
  const coordinatorUser = await User.findById(resolvedMentorId).lean();
  if (coordinatorUser) inviterName = coordinatorUser.fullname || inviterName;

  let instituteName = "Your Institution";
  if (workspaceId) {
    const workspace = await InstitutionWorkspace.findById(workspaceId);
    if (workspace) instituteName = workspace.name;
  }

  const membersToProcess = [
    { name: leader.name, email: leader.email, role: UserRolesEnum.PROJECT_ADMIN },
    ...(members || []).map((m) => ({ name: m.name, email: m.email, role: UserRolesEnum.MEMBER })),
  ];

  const results = { assigned: [], ghosted: [] };
  const onboardingUrl = `${process.env.CORS_ORIGIN || "http://localhost:5173"}/login`;

  const formatName = (email) =>
    email
      .split("@")[0]
      .split(".")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  for (const entry of membersToProcess) {
    if (!entry.email) continue;
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

      const actualName = entry.name || formatName(entry.email);
      const mailContent = ghostInvitationMailgenContent(
        actualName,
        inviterName,
        instituteName,
        project.name,
        onboardingUrl,
      );

      sendEmail({
        email: normalizedEmail,
        subject: `You've been invited to ${project.name} on Xugi`,
        mailgenContent: mailContent,
      }).catch((err) => console.error("Ghost Invite Email Failed:", err));

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
