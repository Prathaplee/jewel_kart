const User = require("../models/user");
const Scheme = require("../models/scheme");
const Price = require("../models/price")

const adminApproveRejectSubscription = async (req, res) => {
    const { userId, schemeId, action, subscriptionId } = req.body;

    try {
        // Find the user by userId
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const subscription = user.subscribedSchemes.find(
            sub => sub._id.toString() === subscriptionId
        );
        if (!subscription) {
            return res.status(404).json({ success: false, message: "Subscription not found" });
        }

        if (subscription.subscriptionStatus === "approved" || subscription.subscriptionStatus === "rejected") {
            return res.status(401).json({ success: false, message: "Status already approved/rejected" });
        }

        // Fetch the scheme to check its type (one-time or monthly)
        const scheme = await Scheme.findById(subscription.schemeId);
        if (!scheme) {
            return res.status(404).json({ success: false, message: "Scheme not found" });
        }

        if (action === "approve") {
            subscription.subscriptionStatus = "approved";
            subscription.subscriptionSchemeType = scheme.type;

            if (scheme.type === "single") {
                subscription.paymentTime = {
                    paymentStatus: "pending",
                    paymentDate: null,
                    nextPaymentDate: new Date(),
                    subscriptionAmount: subscription.subscriptionAmount,
                };
            } else if (scheme.type === "monthly") {
                let currentDate = new Date();

                subscription.paymentTime = Array.from({ length: 11 }, (_, index) => {
                    const paymentDate = new Date(currentDate);
                    const nextPaymentDate = new Date(paymentDate);
                    nextPaymentDate.setDate(nextPaymentDate.getDate() + (30 * (index)))

                    return {
                        month: index + 1,
                        paymentStatus: "pending",
                        subscriptionAmount: subscription.subscriptionAmount,
                        paymentDate: null,
                        nextPaymentDate: index === 0 ? currentDate : nextPaymentDate,
                    };
                });
            }
        } else if (action === "reject") {
            subscription.subscriptionStatus = "rejected";
            subscription.paymentStatus = "failed";
            subscription.paymentTime = null;
        }

        // Save the user with the updated subscription
        await user.save();

        return res.status(200).json({
            success: true,
            message: `Subscription ${action}d successfully.`,
            subscription: subscription,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error." });
    }
};


const adminGetSubscribedUsers = async (req, res) => {
    try {
        // Fetch users and populate their subscribedSchemes with the scheme details
        const users = await User.find()
            .populate({
                path: "subscribedSchemes.schemeId",  // Populate scheme details
                select: "schemeName subscriptionType" // Select only needed fields from Scheme
            })
            .select("username email phoneNumber role subscribedSchemes"); // Select relevant fields from User

        const result = users.map(user => ({
            username: user.username,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            subscriptions: user.subscribedSchemes.map(sub => ({
                schemeName: sub.schemeId.schemeName,
                subscriptionDate: sub.subscriptionDate,
                subscriptionStatus: sub.subscriptionStatus,
                subscriptionSchemeType: sub.subscriptionSchemeType,
            }))
        }));

        return res.status(200).json({ success: true, result });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: "Server error. Could not fetch the data." });
    }
};

const getPendingRequest = async (req, res) => {
    try {
        const usersWithPendingSubscriptions = await User.aggregate([
          {
            $unwind: "$subscribedSchemes",
          },
          {
            $match: {
              "subscribedSchemes.subscriptionStatus": "pending",
            },
          },
          {
            $project: {
              username: 1,
              email: 1,
              phoneNumber: 1,
              kyc: 1,
              "subscribedSchemes.subscriptionStatus": 1,
              "subscribedSchemes.schemeName": 1,
              "subscribedSchemes.subscriptionAmount": 1,
              "subscribedSchemes.paymentTime": 1,
              "subscribedSchemes._id": 1
            },
          },
        ]);
    
        // If no pending subscriptions found
        if (usersWithPendingSubscriptions.length === 0) {
          return res.status(200).json({ success: true, message: 'No pending subscriptions found' });
        }
    
        // Return the list of users with pending subscription status
        return res.status(200).json({ success: true, usersWithPendingSubscriptions});
      } catch (error) {
        console.error('Error fetching pending subscriptions:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
      }
}

module.exports = { adminApproveRejectSubscription, adminGetSubscribedUsers, getPendingRequest };
