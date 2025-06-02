const express = require("express");
const {
  forgetPassword,
  getUser,
  login,
  logout,
  register,
  resetPassword,
  verifyOTP
} = require("../controllers/authController.js");

const { isAuthenticated } = require("../middleware/authToken.js");

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.get("/logout", logout);
router.get("/me", isAuthenticated, getUser);
router.post("/password/forgot", forgetPassword);
router.put("/password/reset/:token", resetPassword);

module.exports = router;
