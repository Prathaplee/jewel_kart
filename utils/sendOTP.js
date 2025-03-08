// otpUtils.js
const twilio = require('twilio');
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = new twilio(accountSid, authToken);

// In-memory store for OTPs (use an object or Map)
const otpStore = {};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
};

// Send OTP via SMS using Twilio (you can replace this with any SMS provider)
const sendOTP = async (mobileNumber, otp) => {
  try {
    // Send the OTP via SMS
    const message = await client.messages.create({
      body: `Your OTP is ${otp}`,
      from: fromPhoneNumber,
      to: mobileNumber,
    });

    // Return success response if message is sent
    return { status: 'success', messageSid: message.sid };
  } catch (error) {
    return { status: 'failure', error: error.message };
  }
};

// Store OTP in memory (with expiration)
const storeOTPInMemory = (mobileNumber, otp) => {
  const otpExpiresAt = Date.now() + 5 * 60 * 1000; // OTP expiry time (5 minutes)
  otpStore[mobileNumber] = { otp, otpExpiresAt };
};

// Verify OTP
const verifyOTP = (mobileNumber, otp) => {
  const storedData = otpStore[mobileNumber];

  if (!storedData) {
    return false; // No OTP was generated for this mobile number
  }

  const { otp: storedOTP, otpExpiresAt } = storedData;

  if (Date.now() > otpExpiresAt) {
    delete otpStore[mobileNumber]; // OTP expired, clear it from memory
    return false; // OTP has expired
  }

  if (storedOTP === otp) {
    delete otpStore[mobileNumber]; // OTP verified, clear it from memory
    return true; // OTP is valid
  }

  return false; // OTP does not match
};

module.exports = { generateOTP, sendOTP, storeOTPInMemory, verifyOTP };
