const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  paymentId: { type: String },
  orderId: { type: String, required: true },
  status: { type: String, enum: ['successful', 'failed', 'pending'], required: true },
  amount: { type: Number, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
