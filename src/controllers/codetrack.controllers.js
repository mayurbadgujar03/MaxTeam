import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { UserRolesEnum } from "../utils/constants.js";
import mongoose from "mongoose";

// ---------------------------------------------------------------------------
// Simple in-memory cache  (10-minute TTL, no extra dependency needed)
// Key: projectId string  → Value: { data, expiresAt }
// ---------------------------------------------------------------------------
const commitCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getCached(projectId) {
  const entry = commitCache.get(projectId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    commitCache.delete(projectId);
    return null;
  }
  return entry.data;
}

function setCache(projectId, data) {
  commitCache.set(projectId, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// Exported so other controllers can bust the cache on mutations that affect
// commit membership (member deletion, githubUsername change).
function clearProjectCommitCache(projectId) {
  commitCache.delete(String(projectId));
}

// ---------------------------------------------------------------------------
// Helper: parse "owner/repo" from a GitHub URL (supports https & git formats)
// ---------------------------------------------------------------------------
function parseGithubRepo(repoUrl) {
  if (!repoUrl) return null;
  // Handles: https://github.com/owner/repo  /  https://github.com/owner/repo.git
  const match = repoUrl.match(/github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?$/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

// ---------------------------------------------------------------------------
// GET /:projectId/commits
// Security: project "admin" (Mentor) AND "project_admin" (Team Leader) may
// call this endpoint. Plain "member" users are blocked with a 403.
// ---------------------------------------------------------------------------
const getProjectCommits = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // 1. Verify caller is an admin (Mentor) or project_admin (Team Leader)
  const requesterMembership = await ProjectMember.findOne({
    user: new mongoose.Types.ObjectId(req.user._id),
    project: new mongoose.Types.ObjectId(projectId),
  });

  const allowedRoles = [UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN];
  if (!requesterMembership || !allowedRoles.includes(requesterMembership.role)) {
    return res
      .status(403)
      .json(
        new ApiError(
          403,
          "Only Mentors and Team Leaders can access Code Track data",
        ),
      );
  }

  // 2. Fetch the project and check githubRepoUrl is configured
  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json(new ApiError(404, "Project not found"));
  }

  if (!project.githubRepoUrl) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          "No GitHub repository URL is configured for this project. Please update the project settings first.",
        ),
      );
  }

  const parsed = parseGithubRepo(project.githubRepoUrl);
  if (!parsed) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          "The configured GitHub repository URL is invalid. Expected format: https://github.com/owner/repo",
        ),
      );
  }

  const { owner, repo } = parsed;

  // 3. Check cache before hitting the GitHub API
  const cacheKey = projectId;
  const cached = getCached(cacheKey);
  if (cached) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, { ...cached, fromCache: true }, "Commits fetched from cache"),
      );
  }

  // 4. Fetch members and build a lookup map: githubUsername → member info
  const members = await ProjectMember.find({
    project: new mongoose.Types.ObjectId(projectId),
  }).populate("user", "username fullname avatar");

  const githubUsernameMap = {}; // lowercased githubUsername → member
  for (const m of members) {
    if (m.githubUsername && m.githubUsername.trim() !== "") {
      githubUsernameMap[m.githubUsername.toLowerCase()] = {
        memberId: m._id,
        userId: m.user?._id,
        fullname: m.user?.fullname,
        username: m.user?.username,
        avatar: m.user?.avatar,
        githubUsername: m.githubUsername,
        role: m.role,
      };
    }
  }

  // 5. Fetch commits from the GitHub REST API (with optional PAT for higher rate limits)
  const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/commits?per_page=100`;
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GITHUB_PAT) {
    headers["Authorization"] = `Bearer ${process.env.GITHUB_PAT}`;
  }

  let rawCommits;
  try {
    const githubRes = await fetch(githubApiUrl, { headers });

    if (!githubRes.ok) {
      const errorBody = await githubRes.json().catch(() => ({}));
      if (githubRes.status === 404) {
        return res
          .status(404)
          .json(
            new ApiError(
              404,
              `GitHub repository "${owner}/${repo}" not found or is private. Ensure the repository is public or a valid GITHUB_PAT is configured.`,
            ),
          );
      }
      if (githubRes.status === 403 || githubRes.status === 429) {
        return res
          .status(429)
          .json(
            new ApiError(
              429,
              "GitHub API rate limit exceeded. Add a GITHUB_PAT to your environment to increase the limit.",
            ),
          );
      }
      return res
        .status(502)
        .json(
          new ApiError(
            502,
            errorBody.message || "Failed to fetch commits from GitHub",
          ),
        );
    }

    rawCommits = await githubRes.json();
  } catch (err) {
    console.error("GitHub API network error:", err);
    return res
      .status(502)
      .json(new ApiError(502, "Network error while contacting GitHub API"));
  }

  // 6. Map commits to team members using githubUsername
  const commits = rawCommits.map((c) => {
    const authorLogin = c.author?.login?.toLowerCase() || "";
    const committerLogin = c.committer?.login?.toLowerCase() || "";

    // Try to resolve via author login first, then committer login
    const matchedMember =
      githubUsernameMap[authorLogin] ||
      githubUsernameMap[committerLogin] ||
      null;

    return {
      sha: c.sha,
      message: c.commit?.message || "",
      author: {
        name: c.commit?.author?.name,
        email: c.commit?.author?.email,
        date: c.commit?.author?.date,
        githubLogin: c.author?.login || null,
        avatarUrl: c.author?.avatar_url || null,
        htmlUrl: c.author?.html_url || null,
      },
      teamMember: matchedMember,
      url: c.html_url,
    };
  });

  // 7. Build a per-member summary — pre-seed every configured member with 0 commits
  //    so that members who haven't pushed yet still appear in the response.
  const memberSummary = {};
  for (const [key, memberInfo] of Object.entries(githubUsernameMap)) {
    memberSummary[key] = {
      ...memberInfo,
      commitCount: 0,
      latestCommitDate: null,
    };
  }
  for (const commit of commits) {
    if (!commit.teamMember) continue;
    const key = commit.teamMember.githubUsername.toLowerCase();
    // The key must already exist from the pre-seed above
    memberSummary[key].commitCount += 1;
    if (
      !memberSummary[key].latestCommitDate ||
      new Date(commit.author.date) >
        new Date(memberSummary[key].latestCommitDate)
    ) {
      memberSummary[key].latestCommitDate = commit.author.date;
    }
  }

  const responseData = {
    projectId,
    repoUrl: project.githubRepoUrl,
    repository: `${owner}/${repo}`,
    totalCommits: commits.length,
    memberSummary: Object.values(memberSummary),
    commits,
    fromCache: false,
    cachedAt: new Date().toISOString(),
  };

  // 8. Store in cache
  setCache(cacheKey, responseData);

  return res
    .status(200)
    .json(new ApiResponse(200, responseData, "Commits fetched successfully"));
});

export { getProjectCommits, clearProjectCommitCache };
