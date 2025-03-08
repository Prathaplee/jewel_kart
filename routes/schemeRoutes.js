const express = require("express");
const { getSchemes, subscribeScheme, getScheme } = require("../controllers/schemeController");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.get("/", authMiddleware(['user', 'admin']), getSchemes);
router.post("/subscribe", authMiddleware(['user','admin']), subscribeScheme);
router.get("/getScheme/:id", authMiddleware(['user', 'admin']), getScheme)

module.exports = router;
