import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { UserRolesEnum } from "../utils/constants.js";
import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { PreInvitation } from "../models/preinvitation.models.js";
import { Batch } from "../models/batch.models.js";
import {
  sendEmail,
  mentorAssignedMailgenContent,
  leaderProjectCreatedMailgenContent,
} from "../utils/mail.js";
import { InstitutionWorkspace } from "../models/workspace.models.js";
import { generateDynamicTimeline } from "../utils/helpers.js";

const processBatchIntake = asyncHandler(async (req, res) => {
  const { name, description, leader, members, mentor, workspaceId, batchId, startDate, endDate, groupNumber } = req.body;

  if (!name || !description || !leader || !leader.email || !mentor || !mentor.email || !batchId) {
    return res
      .status(400)
      .json(new ApiError(400, "name, description, leader (with email), mentor (with email), and batchId are required"));
  }

  // Resolve the batch for fallback and context
  const batch = await Batch.findById(batchId).lean();
  if (!batch) {
    return res.status(404).json(new ApiError(404, "Batch not found"));
  }

  const formatName = (email) =>
    email
      .split("@")[0]
      .split(".")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  // ─── 1. Resolve Mentor & Ownership ───
  const mentorEmailNormalized = mentor.email.toLowerCase().trim();
  const existingMentor = await User.findOne({ email: mentorEmailNormalized });

  // The createdBy field can remain the Batch Coordinator for record-keeping
  const projectCreatorId = batch.coordinators?.[0] || batch.createdBy || existingMentor?._id;

  if (!projectCreatorId) {
    return res
      .status(400)
      .json(new ApiError(400, "Could not resolve a project owner for this batch"));
  }

  // ─── 2. Create Project & Assign Mentor Membership ───
  const project = await Project.create({
    name,
    description,
    createdBy: projectCreatorId,
    workspaceId: workspaceId || null,
    batchId: batchId || null,
    groupNumber: groupNumber ? Number(groupNumber) : null,
    startDate: startDate || null,
    endDate: endDate || null,
    milestones: generateDynamicTimeline(startDate, endDate),
  });

  // Assign ONLY the actual mentor to the project team:
  if (existingMentor) {
    await ProjectMember.create({
      user: existingMentor._id,
      project: project._id,
      role: UserRolesEnum.ADMIN,
    });
  } else {
    // Unregistered Mentor: create PreInvitation only (Do NOT add HOD/Coordinator to ProjectMember)
    await PreInvitation.create({
      email: mentorEmailNormalized,
      projectId: project._id,
      role: UserRolesEnum.ADMIN,
    });
  }

  // Resolve base URL and live dashboard link
  const clientBaseUrl = (
    process.env.CLIENT_URL ||
    process.env.CORS_ORIGIN?.split(",")[0]?.trim() ||
    "https://xugi.in"
  ).replace(/\/+$/, "");
  const dashboardUrl = `${clientBaseUrl}/projects/${project._id}`;

  // ─── 3. Send Exactly 1 Email to Mentor ───
  const mentorDisplayName =
    mentor.name?.trim() ||
    existingMentor?.fullname ||
    formatName(mentor.email);

  const mentorMailContent = mentorAssignedMailgenContent(
    mentorDisplayName,
    project.name,
    project.groupNumber,
    dashboardUrl,
  );

  sendEmail({
    email: mentorEmailNormalized,
    subject: `You've been assigned to project ${project.name} on Xugi`,
    mailgenContent: mentorMailContent,
  }).catch((err) => console.error("Mentor Assignment Email Failed:", err));

  // ─── 4. Process Members (Excluding Leader) - 0 Emails Sent ───
  const results = { assigned: [], ghosted: [] };
  const teamStatus = [];
  const leaderEmailNormalized = leader.email.toLowerCase().trim();

  for (const m of (members || [])) {
    if (!m.email) continue;
    const normalizedEmail = m.email.toLowerCase().trim();
    if (normalizedEmail === leaderEmailNormalized) continue; // Exclude leader if duplicate in members array

    const existingUser = await User.findOne({ email: normalizedEmail });
    const isRegistered = !!existingUser;
    const memberName = m.name?.trim() || (existingUser?.fullname || formatName(m.email));

    if (existingUser) {
      const alreadyMember = await ProjectMember.findOne({
        user: existingUser._id,
        project: project._id,
      });

      if (!alreadyMember) {
        await ProjectMember.create({
          user: existingUser._id,
          project: project._id,
          role: UserRolesEnum.MEMBER,
        });
      }

      results.assigned.push(normalizedEmail);
    } else {
      await PreInvitation.create({
        email: normalizedEmail,
        projectId: project._id,
        role: UserRolesEnum.MEMBER,
      });

      results.ghosted.push(normalizedEmail);
    }

    teamStatus.push({
      name: memberName,
      email: normalizedEmail,
      isRegistered,
    });
  }

  // ─── 5. Process Leader & Send Exactly 1 Email with Team Status Table ───
  const existingLeader = await User.findOne({ email: leaderEmailNormalized });
  const leaderDisplayName =
    leader.name?.trim() ||
    existingLeader?.fullname ||
    formatName(leader.email);

  if (existingLeader) {
    const alreadyLeaderMember = await ProjectMember.findOne({
      user: existingLeader._id,
      project: project._id,
    });

    if (!alreadyLeaderMember) {
      await ProjectMember.create({
        user: existingLeader._id,
        project: project._id,
        role: UserRolesEnum.PROJECT_ADMIN,
      });
    }

    results.assigned.push(leaderEmailNormalized);
  } else {
    await PreInvitation.create({
      email: leaderEmailNormalized,
      projectId: project._id,
      role: UserRolesEnum.PROJECT_ADMIN,
    });

    results.ghosted.push(leaderEmailNormalized);
  }

  const leaderMailContent = leaderProjectCreatedMailgenContent(
    leaderDisplayName,
    project.name,
    teamStatus,
    dashboardUrl,
  );

  sendEmail({
    email: leaderEmailNormalized,
    subject: `Project ${project.name} Created Successfully on Xugi`,
    mailgenContent: leaderMailContent,
  }).catch((err) => console.error("Leader Project Creation Email Failed:", err));

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { project, results, teamStatus },
        "Intake processed successfully",
      ),
    );
});

export { processBatchIntake };

