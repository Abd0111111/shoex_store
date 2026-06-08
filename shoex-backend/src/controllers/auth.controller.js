const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User.model");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require("../services/auth.service");
const { sendPasswordResetEmail } = require("../services/email.service");
const { notifyNewCustomer } = require("../services/notification.service");
const { sendSuccess, sendError } = require("../utils/response");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/v1/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return sendError(res, "Invalid email or password", "UNAUTHORIZED", 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, "Invalid email or password", "UNAUTHORIZED", 401);
    }

    if (user.status === "Inactive") {
      return sendError(res, "Account is inactive", "FORBIDDEN", 403);
    }

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return sendSuccess(res, {
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isOwner: user.isOwner,
        phone: user.phone,
        avatar: user.avatar,
      },
    }, "Login successful");
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, "Email already exists", "CONFLICT", 409);
    }

    const user = await User.create({ name, email, password, phone, role: "user" });

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    await notifyNewCustomer(user);

    return sendSuccess(res, {
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
      },
    }, "Registration successful", 201);
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/google
const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return sendError(res, "Google ID token is required", "VALIDATION_ERROR", 422);
    }

    // Verify Google token
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return sendError(res, "Invalid Google token", "UNAUTHORIZED", 401);
    }

    const { email, name, picture, sub: googleId } = payload;

    // Find or create user
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      // New user via Google
      user = await User.create({
        name,
        email,
        password: crypto.randomBytes(32).toString("hex"), // random password — can't login with it
        avatar: picture || null,
        role: "user",
        status: "Active",
      });
      isNewUser = true;
      await notifyNewCustomer(user);
    } else {
      // Existing user — update avatar if not set
      if (!user.avatar && picture) {
        user.avatar = picture;
      }

      if (user.status === "Inactive") {
        return sendError(res, "Account is inactive", "FORBIDDEN", 403);
      }
    }

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    return sendSuccess(
      res,
      {
        token,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isOwner: user.isOwner,
          phone: user.phone,
          avatar: user.avatar,
        },
      },
      isNewUser ? "Registration successful" : "Login successful",
      isNewUser ? 201 : 200
    );
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/logout
const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    return sendSuccess(res, null, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/auth/me
const getMe = async (req, res, next) => {
  try {
    return sendSuccess(res, {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      isOwner: req.user.isOwner,
      phone: req.user.phone,
      avatar: req.user.avatar,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/refresh
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return sendError(res, "Refresh token required", "UNAUTHORIZED", 401);
    }

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.sub).select("+refreshToken");

    if (!user || user.refreshToken !== refreshToken) {
      return sendError(res, "Invalid refresh token", "UNAUTHORIZED", 401);
    }

    const newToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    return sendSuccess(res, {
      token: newToken,
      refreshToken: newRefreshToken,
      expiresIn: 604800,
    });
  } catch (error) {
    return sendError(res, "Invalid or expired refresh token", "UNAUTHORIZED", 401);
  }
};

// POST /api/v1/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
      await user.save();

      try {
        await sendPasswordResetEmail(email, resetToken);
      } catch (emailError) {
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();
      }
    }

    return sendSuccess(res, null, "Password reset email sent if account exists.");
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;

    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return sendError(res, "Invalid or expired reset token", "VALIDATION_ERROR", 400);
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.refreshToken = null;
    await user.save();

    return sendSuccess(res, null, "Password updated successfully. Please log in.");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  googleAuth,
  logout,
  getMe,
  refresh,
  forgotPassword,
  resetPassword,
};