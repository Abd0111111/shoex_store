const express = require("express");
const router = express.Router();
const {
  login,
  register,
  googleAuth,
  logout,
  getMe,
  refresh,
  forgotPassword,
  resetPassword,
} = require("../controllers/auth.controller");
const { verifyToken } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const authValidation = require("../validations/auth.validation");
const Joi = require("joi");

const googleSchema = Joi.object({
  idToken: Joi.string().required().messages({
    "any.required": "Google ID token is required",
  }),
});

router.post("/login", validate(authValidation.login), login);
router.post("/register", validate(authValidation.register), register);
router.post("/google", validate(googleSchema), googleAuth);
router.post("/logout", verifyToken, logout);
router.get("/me", verifyToken, getMe);
router.post("/refresh", validate(authValidation.refresh), refresh);
router.post("/forgot-password", validate(authValidation.forgotPassword), forgotPassword);
router.post("/reset-password", validate(authValidation.resetPassword), resetPassword);

module.exports = router;