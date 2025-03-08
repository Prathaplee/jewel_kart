const Razorpay = require('razorpay');
const instance = new Razorpay({
  key_id: "rzp_test_WwwXbOrj7rBTpu",
  key_secret: "WA6t4EMVhXDrXipNCQzNQHjH",
});

const createRazorpayOrder = async (req, res) => {
  try {
    const { userId, schemeId, amount } = req.body;

    // Fetch user and scheme details
    const user = await User.findById(userId);
    const scheme = await Scheme.findById(schemeId);

    if (!user || !scheme) {
      return res.status(404).json({ message: 'User or Scheme not found.' });
    }

    // Create Razorpay Order
    const options = {
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      receipt: `receipt#${Date.now()}`,
      notes: {
        userId: user._id,
        schemeId: scheme._id,
      },
    };

    instance.orders.create(options, async (err, order) => {
      if (err) {
        return res.status(500).json({ message: 'Error creating Razorpay order.', error: err });
      }

      // Return order_id and other required details to the frontend
      res.status(200).json({
        order_id: order.id,
        currency: order.currency,
        amount: order.amount,
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = createRazorpayOrder;
