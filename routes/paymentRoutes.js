const express = require("express");
const { createRazorpayOrder, verifyRazorpayPayment } = require("../controllers/paymentController");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

router.post('/create-razorpay-order', authMiddleware(['user','admin']), createRazorpayOrder);

router.post('/verify-razorpay-payment', authMiddleware(['user','admin']), verifyRazorpayPayment);

module.exports = router;
