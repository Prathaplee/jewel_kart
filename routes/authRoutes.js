const express = require("express");
const { signup, sendOTPHandler, signin, resetMpin } = require("../controllers/authController");
const router = express.Router();

router.post("/signup", signup);
router.post("/send-otp", sendOTPHandler);
router.post("/login", signin);
router.post("/reset-mpin", resetMpin);

module.exports = router;
