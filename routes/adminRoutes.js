const express = require("express");
const { adminApproveRejectSubscription, adminGetSubscribedUsers, getPendingRequest } = require("../controllers/adminController");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.post("/approve-reject-subscription", authMiddleware(['admin']), adminApproveRejectSubscription);
router.get("/subscriber-list", authMiddleware(['admin']), adminGetSubscribedUsers);
router.get("/get-pending-request", authMiddleware(['admin']), getPendingRequest)

module.exports = router;
