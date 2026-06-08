const express = require("express");
const router = express.Router();
const {
  getTeam,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember,
} = require("../../controllers/admin/team.controller");
const { requireOwner } = require("../../middlewares/admin.middleware");
const validate = require("../../middlewares/validate.middleware");
const adminValidation = require("../../validations/admin.validation");

router.get("/", requireOwner, getTeam);
router.post("/", requireOwner, validate(adminValidation.createTeamMember), addTeamMember);
router.put("/:id", requireOwner, validate(adminValidation.updateTeamMember), updateTeamMember);
router.delete("/:id", requireOwner, deleteTeamMember);

module.exports = router;