const User = require('../models/user');

// Get Referral List
const getReferralList = async (req, res) => {
  try {
    const parentUsers = await User.find({ "referralUsers.0": { $exists: true } })
      .select("username phoneNumber referralUsers")
      .populate("referralUsers._id", "username phoneNumber");

    if (!parentUsers || parentUsers.length === 0) {
      return res.status(404).json({ success: false, message: "No parent users found." });
    }
    const result = parentUsers.map((parentUser) => {
      const referredUsers = parentUser.referralUsers.map((referral) => ({
        _id: referral._id._id,
        username: referral._id.username,
        phoneNumber: referral._id.phoneNumber,
      }));

      return {
        username: parentUser.username,
        phoneNumber: parentUser.phoneNumber,
        referredUsers,
      };
    });

    return res.status(200).json({success: true, result});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getReferralList };
