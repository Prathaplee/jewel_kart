const Price = require("../models/price.js");

// Fetch latest gold and silver prices
const getPrices = async (req, res) => {
  try {
    const latestPrice = await Price.findOne().sort({ timestamp: -1 });

    if (!latestPrice) {
      return res.status(404).json({ success: false, msg: "No price data found" });
    }

    res.json({
      success: true,
      goldPrice: latestPrice.goldPrice,
      silverPrice: latestPrice.silverPrice,
      timestamp: latestPrice.timestamp,
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};

// Admin function to update prices
const updatePrices = async (req, res) => {
  try {
    const { goldPrice, silverPrice } = req.body;

    if (!goldPrice || !silverPrice) {
      return res.status(400).json({ success: false, msg: "Both gold and silver prices are required" });
    }

    const newPrice = new Price({ goldPrice, silverPrice });
    await newPrice.save();

    res.json({ success: true, msg: "Prices updated successfully", data: newPrice });
  } catch (err) {
    res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};

module.exports = { getPrices, updatePrices };
