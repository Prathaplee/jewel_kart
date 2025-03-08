const mongoose = require("mongoose");

const schemeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  termsConditions: { type: String },
  type: { type: String, enum: ["single-payment", "monthly-payment"], required: true },
  minAmount: { type: Number },
  maxAmount: { type: Number },
  minWeight: { type: Number },
  maxWeight: { type: Number },
  duration: { type: Number, default: 11 },
});

module.exports = mongoose.model("Scheme", schemeSchema);
