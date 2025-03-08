const Scheme = require('../models/scheme');
const User = require('../models/user');

// List Schemes
const getSchemes = async (req, res) => {
  try {
    const schemes = await Scheme.find();
    return res.status(200).json({success: true, schemes});
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// Subscribe to Scheme
const subscribeScheme = async (req, res) => {
  const { schemeId, amount } = req.body;
  const { phoneNumber } = req.user

  try {
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const scheme = await Scheme.findById(schemeId);

    if (!scheme) {
      return res.status(404).json({ success: false, message: "Scheme not found." });
    }
    // Prepare the subscription object
    const subscription = {
      schemeId: scheme._id,
      subscriptionAmount: amount,
      subscriptionDate: new Date(),
      subscriptionStatus: "pending",
      subscriptionSchemeType: scheme.type,
      schemeName: scheme.name
    };

    if (scheme.type === "single") {
      subscription.paymentTime = {
        paymentStatus: "pending",
        paymentDate: null,
      };
    } else if (scheme.paymentPlan === "monthly") {
      subscription.paymentTime = Array.from({ length: 11 }, (_, index) => ({
        month: index + 1,
        paymentStatus: "pending",
        paymentDate: null,
      }));

    }

    user.subscribedSchemes.push(subscription);

    await user.save();

    return res.status(200).json({ success: true, message: "User subscribed to the scheme successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const getScheme = async (req, res) => {
  try {
    const { id } = req.params;

    const scheme = await Scheme.findById(id);

    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found' });
    }

    res.status(200).json({ success: true, scheme });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { getSchemes, subscribeScheme, getScheme };
