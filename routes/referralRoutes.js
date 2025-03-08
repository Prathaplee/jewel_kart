const express = require("express");
const { getReferralList } = require("../controllers/referralController");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.get("/referral-list", authMiddleware(['admin']), getReferralList);

module.exports = router;
