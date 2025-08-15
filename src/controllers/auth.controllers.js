import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { User } from "../models/user.models.js"; 
import { sendEmail, emailVerificationMailgenContent } from "../utils/mail.js";
import dotenv from "dotenv";

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
      `${process.env.BASE_URL}/verify-email?token=${unHashedToken}`,
      user.emailVerificationExpiry,
    ),
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { userId: user._id }, "Registered user"));
});


export { registerUser };