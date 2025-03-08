const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true, unique: true },
  referralCode: { type: String, unique: true, default: "" },
  referredBy: { type: String },
  role: { type: String, default: "user", enum: ["user", "admin"] },
  balance: { type: Number, default: 0 },
  mpin: { type: String, required: "true" },
  subscribedSchemes: [
    {
      schemeId: { type: mongoose.Schema.Types.ObjectId, ref: "Scheme" },
      schemeName: { type: String },
      subscriptionAmount: { type: Number },
      subscriptionDate: { type: Date, default: Date.now },
      subscriptionStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
      subscriptionSchemeType: { type: String },
      paymentTime: [
        {
          month: { type: Number },
          subscriptionAmount: { type: Number },
          paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
          paymentDate: { type: Date },
          nextPaymentDate: { type: Date }
        }
      ]
    }
  ],
  referralUsers: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      username: { type: String },
      phoneNumber: { type: String },
    }
  ],

  address: {
    address: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    postalCode: { type: String }
  },

  bankDetails: {
    accountNumber: { type: String },
    ifscCode: { type: String },
    accountHolderName: { type: String },
    bankName: { type: String }
  },

  kyc: {
    aadhar: { type: String },
    pan: { type: String },
    aadharImages: [{ type: String }],
    panImages: [{ type: String }]
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
