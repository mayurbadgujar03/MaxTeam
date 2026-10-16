import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { Feedback } from "../models/feedback.models.js";
import { InstitutionWorkspace } from "../models/workspace.models.js";
import { PreInvitation } from "../models/preinvitation.models.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import { AvailableFeedbackStatuses, UserRolesEnum } from "../utils/constants.js";
import { sendEmail, hodWorkspaceInvitationMailgenContent } from "../utils/mail.js";

const getAdminStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeProjects = await Project.countDocuments();
  const totalFeedback = await Feedback.countDocuments();
  const totalWorkspaces = await InstitutionWorkspace.countDocuments();

  const recentFeedback = await Feedback.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .populate("user", "username email fullname avatar")
    .lean();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalUsers,
        activeProjects,
        totalFeedback,
        totalWorkspaces,
        recentFeedback,
      },
      "Admin stats fetched successfully"
    )
  );
});

const updateFeedbackStatus = asyncHandler(async (req, res) => {
  const { feedbackId } = req.params;
  const { status } = req.body;

  if (!status || !AvailableFeedbackStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid feedback status value" });
  }

  const feedback = await Feedback.findByIdAndUpdate(
    feedbackId,
    { status },
    { new: true }
  ).populate("user", "username email fullname avatar");

  if (!feedback) {
    return res.status(404).json({ message: "Feedback record not found" });
  }

  return res.status(200).json(
    new ApiResponse(200, feedback, "Feedback status updated successfully")
  );
});

const createInstituteWorkspace = asyncHandler(async (req, res) => {
  const { name, description, hodEmail } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Institute Name is required");
  }

  if (!hodEmail || !hodEmail.trim()) {
    throw new ApiError(400, "HOD Email is required");
  }

  const normalizedHodEmail = hodEmail.toLowerCase().trim();

  // 1. Check if the HOD exists in the User collection
  const existingHod = await User.findOne({ email: normalizedHodEmail });

  // 2. Create the Workspace document with provided name and description
  const workspace = await InstitutionWorkspace.create({
    name: name.trim(),
    description: description ? description.trim() : "",
    authorizedHods: existingHod ? [existingHod._id] : [],
  });

  // 3 & 4. Handle HOD mapping or PreInvitation
  if (!existingHod) {
    // User does not exist: create PreInvitation so they become HOD upon signup
    await PreInvitation.create({
      email: normalizedHodEmail,
      workspaceId: workspace._id,
      role: UserRolesEnum.ADMIN,
    });

    const clientBaseUrl = (
      process.env.CLIENT_URL ||
      process.env.CORS_ORIGIN?.split(",")[0]?.trim() ||
      "https://xugi.in"
    ).replace(/\/+$/, "");
    const onboardingUrl = `${clientBaseUrl}/auth/login`;

    const formatName = (email) =>
      email
        .split("@")[0]
        .split(".")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

    const mailContent = hodWorkspaceInvitationMailgenContent(
      formatName(normalizedHodEmail),
      workspace.name,
      onboardingUrl,
    );

    sendEmail({
      email: normalizedHodEmail,
      subject: `Welcome to Xugi - Head of Department License for ${workspace.name}`,
      mailgenContent: mailContent,
    }).catch((err) => console.error("HOD Invitation Email Failed:", err));
  }

  const populatedWorkspace = await InstitutionWorkspace.findById(workspace._id)
    .populate("authorizedHods", "fullname username email avatar")
    .lean();

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        workspace: populatedWorkspace,
        isExistingUser: !!existingHod,
        hodEmail: normalizedHodEmail,
      },
      "Institute workspace created successfully"
    )
  );
});

const getInstituteWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await InstitutionWorkspace.find()
    .populate("authorizedHods", "fullname username email avatar")
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(
    new ApiResponse(200, workspaces, "Institute workspaces fetched successfully")
  );
});

const getUsersDirectory = asyncHandler(async (req, res) => {
  const users = await User.aggregate([
    {
      $match: {
        $or: [
          { deletedAt: null },
          { deletedAt: { $exists: false } },
        ],
      },
    },
    {
      $lookup: {
        from: "projects",
        let: { userId: "$_id" },
        pipeline: [
          {
            $lookup: {
              from: "projectmembers",
              let: { projId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$project", "$$projId"] },
                        { $eq: ["$user", "$$userId"] },
                        {
                          $or: [
                            { $eq: ["$deletedAt", null] },
                            { $not: ["$deletedAt"] },
                          ],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "userMembership",
            },
          },
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $or: [
                      { $eq: ["$createdBy", "$$userId"] },
                      { $in: ["$$userId", { $ifNull: ["$members", []] }] },
                      { $in: ["$$userId", { $ifNull: ["$members.user", []] }] },
                      { $gt: [{ $size: "$userMembership" }, 0] },
                    ],
                  },
                  {
                    $or: [
                      { $eq: ["$deletedAt", null] },
                      { $not: ["$deletedAt"] },
                    ],
                  },
                ],
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              workspaceId: 1,
              createdBy: 1,
              role: {
                $cond: {
                  if: { $gt: [{ $size: "$userMembership" }, 0] },
                  then: {
                    $let: {
                      vars: {
                        rawRole: { $arrayElemAt: ["$userMembership.role", 0] },
                      },
                      in: {
                        $switch: {
                          branches: [
                            {
                              case: { $eq: ["$$rawRole", "admin"] },
                              then: {
                                $cond: {
                                  if: {
                                    $and: [
                                      { $ne: ["$workspaceId", null] },
                                      { $ne: ["$workspaceId", ""] },
                                    ],
                                  },
                                  then: "Mentor",
                                  else: "Leader",
                                },
                              },
                            },
                            {
                              case: { $eq: ["$$rawRole", "project_admin"] },
                              then: "Leader",
                            },
                            {
                              case: { $eq: ["$$rawRole", "member"] },
                              then: "Member",
                            },
                          ],
                          default: {
                            $cond: {
                              if: { $eq: ["$createdBy", "$$userId"] },
                              then: "Leader",
                              else: "Member",
                            },
                          },
                        },
                      },
                    },
                  },
                  else: {
                    $cond: {
                      if: { $eq: ["$createdBy", "$$userId"] },
                      then: "Leader",
                      else: "Member",
                    },
                  },
                },
              },
            },
          },
        ],
        as: "allProjects",
      },
    },
    {
      $addFields: {
        personalProjects: {
          $filter: {
            input: "$allProjects",
            as: "p",
            cond: {
              $or: [
                { $eq: ["$$p.workspaceId", null] },
                { $not: ["$$p.workspaceId"] },
              ],
            },
          },
        },
        institutionalProjects: {
          $filter: {
            input: "$allProjects",
            as: "p",
            cond: {
              $and: [
                { $ne: ["$$p.workspaceId", null] },
                { $ne: ["$$p.workspaceId", ""] },
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        fullname: 1,
        username: 1,
        email: 1,
        avatar: 1,
        role: 1,
        createdAt: 1,
        personalProjects: {
          $map: {
            input: "$personalProjects",
            as: "proj",
            in: {
              _id: "$$proj._id",
              name: "$$proj.name",
              role: "$$proj.role",
            },
          },
        },
        institutionalProjects: {
          $map: {
            input: "$institutionalProjects",
            as: "proj",
            in: {
              _id: "$$proj._id",
              name: "$$proj.name",
              role: "$$proj.role",
            },
          },
        },
        totalProjectsCount: { $size: "$allProjects" },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(200, users, "Users directory fetched successfully")
  );
});

export {
  getAdminStats,
  updateFeedbackStatus,
  createInstituteWorkspace,
  getInstituteWorkspaces,
  getUsersDirectory,
};

