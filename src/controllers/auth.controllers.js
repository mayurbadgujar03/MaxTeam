import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { User } from "../models/user.models.js";

import jwt from "jsonwebtoken";

const googleLogin = (req, res) => {

  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: process.env.GOOGLE_CALLBACK_URL || "http://localhost:8000/api/v1/user/google/callback",
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };
  const qs = new URLSearchParams(options);
  return res.redirect(`${rootUrl}?${qs.toString()}`);
};

const googleCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json(new ApiError(400, "Authorization code is required"));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || "http://localhost:8000/api/v1/user/google/callback";

  try {
    // 1. Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", tokenData);
      return res.status(400).json(new ApiError(400, tokenData.error_description || "Failed to exchange authorization code"));
    }

    const { access_token } = tokenData;

    // 2. Fetch user profile info from Google
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const profileData = await userinfoResponse.json();

    if (!userinfoResponse.ok) {
      console.error("Userinfo fetch failed:", profileData);
      return res.status(400).json(new ApiError(400, "Failed to retrieve user profile from Google"));
    }

    const { sub: googleId, email, name, picture } = profileData;

    if (!email) {
      return res.status(400).json(new ApiError(400, "Google account does not provide an email address"));
    }

    // 3. Find or create the user in the database
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Map googleId if it wasn't already set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Generate a unique username from email
      const baseUsername = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      let username = baseUsername;
      let isUsernameTaken = await User.findOne({ username });
      let counter = 1;

      while (isUsernameTaken) {
        username = `${baseUsername}${counter}`;
        isUsernameTaken = await User.findOne({ username });
        counter++;
      }

      user = await User.create({
        username,
        email,
        fullname: name || username,
        googleId,
        avatar: {
          url: picture || "https://placehold.co/600x400",
          localpath: "",
        },
        isEmailVerified: true,
      });
    }

    // 4. Generate custom application JWTs
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // 5. Persist the refresh token in the database
    user.refreshToken = refreshToken;
    await user.save();

    // 6. Set tokens in HTTP-only, secure, cross-origin cookies
    const accessOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    };
    const refreshOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res
      .cookie("accessToken", accessToken, accessOptions)
      .cookie("refreshToken", refreshToken, refreshOptions);

    // 7. Redirect to the frontend dashboard
    const frontendUrl = process.env.FRONTEND_URL || process.env.BASE_URL || "http://localhost:8080";
    return res.redirect(`${frontendUrl}/dashboard`);
  } catch (error) {
    console.error("Google OAuth error:", error);
    return res.status(500).json(new ApiError(500, "Internal server error during Google authentication"));
  }
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

const refreshAccessToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json(new ApiError(401, "No refresh token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded._id);

    if (!user || user.refreshToken !== token) {
      return res
        .status(401)
        .json(new ApiError(401, "Refresh token is invalid or expired"));
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const accessOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
    };
    const refreshOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res
      .cookie("accessToken", accessToken, accessOptions)
      .cookie("refreshToken", refreshToken, refreshOptions)
      .status(200)
      .json(new ApiResponse(200, { userId: user._id }, "Logged user"));
  } catch (error) {
    return res
      .status(401)
      .json(new ApiError(401, "Invalid or expired refresh token"));
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json(new ApiError(401, "Not authenticated"));
  }

  const user = await User.findById(req.user._id).select(
    "-password -refreshToken -forgotPasswordToken -forgotPasswordExpiry -emailVerificationToken -emailVerificationExpiry",
  );

  if (!user) {
    return res.status(401).json(new ApiError(401, "User not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Current user fetched successfully"));
});

export {
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  googleLogin,
  googleCallback,
};
