require('dotenv').config();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const User = require('../models/user');
const Transaction = require('../models/transaction');
const Scheme = require('../models/scheme');

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// Create Payment
const createRazorpayOrder = async (req, res) => {
  try {
    const { schemeId, amount } = req.body;
    const {userId} = req.user

    const user = await User.findById(userId);
    const scheme = await Scheme.findById(schemeId);

    if (!user || !scheme) {
      return res.status(404).json({ success: false, message: 'User or Scheme not found.' });
    }

    // Create Razorpay Order
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt#${Date.now()}`,
      notes: {
        userId: user._id,
        schemeId: scheme._id,
      },
    };

    instance.orders.create(options, async (err, order) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error creating Razorpay order.', error: err });
      }

      const transaction = new Transaction({
        paymentId: null,
        amount: amount * 100,
        orderId: order.id,
        userId: userId,
        schemeId: schemeId,
        status: 'pending',
      });

      await transaction.save();

      res.status(200).json({
        success: true,
        order_id: order.id,
        currency: order.currency,
        amount: order.amount,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const { payment_id, order_id, signature, subscriptionId } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET;

    const body = order_id + "|" + payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const transaction = await Transaction.findOne({ orderId: order_id });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    transaction.paymentId = payment_id;
    transaction.status = 'successful';
    await transaction.save();

    const user = await User.findById(transaction.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const subscriptionIndex = user.subscribedSchemes.findIndex(
      (scheme) => scheme._id.toString() === subscriptionId
    );

    if (subscriptionIndex === -1) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    const scheme = user.subscribedSchemes[subscriptionIndex];

    if (scheme.subscriptionSchemeType == "single") {

      scheme.paymentTime[0].paymentStatus = 'paid';
      scheme.paymentTime[0].paymentDate = new Date();

      if (user.referredBy) {
        const referrer = await User.findOne({ referralCode: user.referredBy });
        if (referrer) {
          let commission = (scheme.paymentTime[0].subscriptionAmount * 0.005);
          referrer.balance += commission;
          await referrer.save();
        }
      }

      await user.save();
    } else {
      let paymentUpdated = false;

      for (let i = 0; i < scheme.paymentTime.length; i++) {
        const paymentObj = scheme.paymentTime[i];

        if (paymentObj.paymentStatus === "pending" && paymentObj.paymentDate === null) {
          if (new Date() >= new Date(paymentObj.nextPaymentDate)) {
            paymentObj.paymentStatus = 'paid';
            paymentObj.paymentDate = new Date();

            if (user.referredBy) {
              const referrer = await User.findOne({ referralCode: user.referredBy });
              if (referrer) {
                let commission = 0;
                if (i == 0) {
                  commission = (paymentObj.subscriptionAmount * 0.03);
                }
                referrer.balance += commission;
                await referrer.save();
              }
            }

            await user.save();
            paymentUpdated = true;
            return res.status(200).json({ success: true, message: `Payment for month ${paymentObj.month} updated successfully` });
          } else {
            return res.status(400).json({ success: false, message: `Payment for month ${paymentObj.month} is not due yet` });
          }
        }
      }

      // If no pending payments were found
      if (!paymentUpdated) {
        return res.status(400).json({ success: false, message: 'No pending payments found for the current month' });
      }
    }

    res.status(200).json({ success: true, message: 'Payment verified and user updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { createRazorpayOrder, verifyRazorpayPayment };
