const express = require("express");
const { updateUserDetails, getUser, getAllUsers } = require("../controllers/userController");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.post("/update-details", authMiddleware(['admin', 'user']), updateUserDetails);
router.get("/get-user/:id", authMiddleware(['admin', 'user']), getUser)
router.get("/get-all-users", authMiddleware(['admin']), getAllUsers)

module.exports = router;
