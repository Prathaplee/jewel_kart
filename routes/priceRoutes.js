const express = require("express");
const router = express.Router();
const { getPrices, updatePrices } = require("../controllers/priceController.js");
const authMiddleware = require("../middleware/authMiddleware");

// Public route to get gold & silver prices
router.get("/", getPrices);

// Protected route to update prices (admin only)
router.post("/", authMiddleware(["admin"]), updatePrices);

module.exports = router;
