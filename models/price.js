const mongoose = require("mongoose");

const priceSchema = new mongoose.Schema({
  goldPrice: { type: Number, required: true },
  silverPrice: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

priceSchema.index({ timestamp: 1 }, { unique: true });

module.exports = mongoose.model("Price", priceSchema);
