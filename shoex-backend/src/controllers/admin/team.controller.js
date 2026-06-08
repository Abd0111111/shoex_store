const User = require("../../models/User.model");
const { sendTeamOnboardingEmail } = require("../../services/email.service");
const { sendSuccess, sendError } = require("../../utils/response");

// GET /api/v1/admin/team
const getTeam = async (req, res, next) => {
  try {
    // ── مخليش الـ owner يظهر في القايمة ──
    const team = await User.find({
      role: { $in: ["admin", "editor", "viewer"] },
      isOwner: { $ne: true },
    }).sort({ createdAt: 1 });

    const data = team.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    }));

    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/admin/team
const addTeamMember = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // ── Check duplicate ──
    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, "Email already exists", "CONFLICT", 409);
    }

    // ── Create user ──
    const user = await User.create({
      name,
      email,
      password,
      role: role.toLowerCase(),
      isOwner: false,
    });

    // ── Send onboarding email — non-blocking ──
    // لو الـ email فشل مش هيأثر على الـ response
    sendTeamOnboardingEmail(email, name, password, role).catch((err) =>
      console.error("❌ Onboarding email failed:", err.message)
    );

    return sendSuccess(
      res,
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      "Team member added successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

// PUT /api/v1/admin/team/:id
const updateTeamMember = async (req, res, next) => {
  try {
    const { name, email, role, password } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, "Team member not found", "NOT_FOUND", 404);
    }

    if (user.isOwner) {
      return sendError(res, "Cannot modify owner account", "FORBIDDEN", 403);
    }

    // ── Update fields ──
    if (name)  user.name  = name;
    if (email) user.email = email;
    if (role)  user.role  = role.toLowerCase();

    // ── Update password if provided ──
    if (password && password.trim() && !password.includes("••••")) {
      user.password = password;
    }

    await user.save();

    return sendSuccess(
      res,
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      "Team member updated successfully"
    );
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/admin/team/:id
const deleteTeamMember = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return sendError(res, "Team member not found", "NOT_FOUND", 404);
    }

    if (user.isOwner) {
      return sendError(res, "Cannot delete owner account", "FORBIDDEN", 403);
    }

    // ── Must keep at least 1 admin ──
    const adminCount = await User.countDocuments({
      role: { $in: ["admin", "owner"] },
    });
    if (adminCount <= 1 && user.role === "admin") {
      return sendError(
        res,
        "Must keep at least one admin",
        "FORBIDDEN",
        403
      );
    }

    await User.findByIdAndDelete(req.params.id);

    return sendSuccess(res, null, "Team member deleted successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = { getTeam, addTeamMember, updateTeamMember, deleteTeamMember };