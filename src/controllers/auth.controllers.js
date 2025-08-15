import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { User } from "../models/user.models.js";
import {
  sendEmail,
  emailVerificationMailgenContent,
  forgotPasswordRequestMailgenContent,
} from "../utils/mail.js";

import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullname } = req.body;

  if (!username || !email || !password || !fullname) {
    return res.status(400).json(new ApiError(400, "All feilds are required"));
  }

  const existingUserEmail = await User.findOne({ email });

  if (existingUserEmail) {
    return res
      .status(400)
      .json(new ApiError(400, "User with this email already exist"));
  }

  const existingUsername = await User.findOne({ username });

  if (existingUsername) {
    return res
      .status(400)
      .json(new ApiError(400, "User with this username already exist"));
  }

  const user = await User.create({
    username,
    email,
    password,
    fullname,
  });

  if (!user) {
    return res
      .status(400)
      .json(new ApiError(400, "Network error user not created"));
  }

  const { hashedToken, unHashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  if (!hashedToken || !unHashedToken || !tokenExpiry) {
    return res
      .status(400)
      .json(
        new ApiError(400, "Failed to generate verification token for new user"),
      );
  }

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  await user.save();

  sendEmail({
    email: user.email,
    subject: "Email verification on MaxTeam",
    mailgenContent: emailVerificationMailgenContent(
      user.username,
      `${process.env.BASE_URL}/api/v1/user/verify-email/${unHashedToken}`,
      user.emailVerificationExpiry,
    ),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { userId: user._id }, "Registered user"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json(new ApiError(400, "All feilds are required"));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json(new ApiError(404, "User not found"));
  }

  if (user.isEmailVerified !== true) {
    return res.status(400).json(new ApiResponse(400, "Email not verified"));
  }

  const isMatched = await user.isPasswordCorrect(password);

  if (!isMatched) {
    return res.status(400).json(new ApiError(400, "Password not matched"));
  }

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save();

  const accessOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  };
  const refreshOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  res
    .cookie("accessToken", accessToken, accessOptions)
    .cookie("refreshToken", refreshToken, refreshOptions);

  return res
    .status(200)
    .json(new ApiResponse(200, { userId: user._id }, "Logged user"));
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  user.refreshToken = undefined;
  await user.save();
  res.cookie("refreshToken", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.cookie("accessToken", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  return res.status(200).json(new ApiResponse(200, "LoggedOut the user"));
});

const verifyEmail = asyncHandler(async (req, res) => {
  const token = req.params.token;

  if (!token) {
    return res.status(404).json(new ApiError(404, "Invalid or expired token"));
  }

  const newHashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    emailVerificationToken: newHashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(404).json(new ApiError(404, "Invalid or expired token"));
  }

  if (user.isEmailVerified) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, "If this account exists, it is already verified"),
      );
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;

  await user.save();

  return res.status(200).json(new ApiResponse(200, "Verified successfully"));
});

const resendEmailVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json(new ApiError(400, "All feilds are required"));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res
      .status(400)
      .json(new ApiError(400, "User with this email doesn't exist"));
  }

  if (user.isEmailVerified) {
    return res
      .status(200)
      .json(
        new ApiResponse(200, "If this account exists, it is already verified"),
      );
  }

  const { hashedToken, unHashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  if (!hashedToken || !unHashedToken || !tokenExpiry) {
    return res
      .status(400)
      .json(
        new ApiError(400, "Failed to generate verification token for new user"),
      );
  }

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpiry = tokenExpiry;

  await user.save();

  sendEmail({
    email: user.email,
    subject: "Resend email verification on MaxTeam",
    mailgenContent: emailVerificationMailgenContent(
      user.username,
      `${process.env.BASE_URL}/api/v1/user/verify-email/${unHashedToken}`,
      user.emailVerificationExpiry,
    ),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { userId: user._id },
        "Verification email resent successfully",
      ),
    );
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json(new ApiError(400, "All feilds are required"));
  }

  const user = await User.findOne({ email });

  const { hashedToken, unHashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  if (!hashedToken || !unHashedToken || !tokenExpiry) {
    return res
      .status(400)
      .json(
        new ApiError(400, "Failed to generate verification token for new user"),
      );
  }

  user.forgotPasswordToken = hashedToken;
  user.forgotPasswordExpiry = tokenExpiry;

  await user.save();

  sendEmail({
    email: user.email,
    subject: "Forgot password request",
    mailgenContent: forgotPasswordRequestMailgenContent(
      user.username,
      `${process.env.BASE_URL}/api/v1/user/verify-email/${unHashedToken}`,
      user.forgotPasswordExpiry,
    ),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { userId: user._id }, "Password reset email sent"),
    );
});

const resetForgottenPassword = asyncHandler(async (req, res) => {
  const token = req.params.token;

  if (!token) {
    return res.status(404).json(new ApiError(404, "Invalid or expired token"));
  }

  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(404).json(new ApiError(404, "All feilds are required"));
  }

  const newHashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    forgotPasswordToken: newHashedToken,
    forgotPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(404).json(new ApiError(404, "Invalid or expired token"));
  }

  user.password = newPassword;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpiry = undefined;
  user.refreshToken = undefined;

  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { userId: user._id },
        "Password updated successfully",
      ),
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  verifyEmail,
  resendEmailVerification,
  forgotPasswordRequest,
  resetForgottenPassword,
};
