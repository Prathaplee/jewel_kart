const User = require('../models/user');
const { sendOTP, generateOTP, storeOTPInMemory, verifyOTP } = require('../utils/sendOTP');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
require('dotenv').config();

const signup = async (req, res) => {
  const { username, email, phoneNumber, referralCode, role, mpin } = req.body;

  try {
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format." });
    }

    const phoneRegex = /^\+91\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ success: false, message: "Invalid phone number format. It should start with +91 followed by 10 digits." });
    }

    if (!/^\d{4}$/.test(mpin)) {
      return res.status(400).json({ success: false, message: "MPIN must be a 4-digit number." });
    }

    const userExists = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists." });
    }

    // Find the referrer by referralCode
    let referrer = null;
    if (referralCode) {
      referrer = await User.findOne({ referralCode });
      if (!referrer) {
        return res.status(400).json({ success: false, message: "Invalid referral code." });
      }
    }

    // Generate a unique referral code for the new user
    const userReferralCode = `REF${Math.floor(Math.random() * 100000)}`;

    // Hash the MPIN before saving to the database
    const salt = await bcrypt.genSalt(10);
    const hashedMpin = await bcrypt.hash(mpin, salt);

    // Create a new user
    const newUser = new User({
      username,
      email,
      phoneNumber,
      referralCode: userReferralCode,
      referredBy: referralCode,
      role: role,
      mpin: hashedMpin
    });

    // If there is a referrer, update their referral data
    if (referrer) {
      const referralData = {
        _id: newUser._id,
        username: newUser.username,
        phoneNumber: newUser.phoneNumber
      };

      referrer.referralUsers.push(referralData);

      await referrer.save();
    }

    // Save the new user to the database
    await newUser.save();

    // Respond with success
    return res.status(201).json({ success: true, message: "User registered successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// Send OTP
const sendOTPHandler = async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    const data = await User.findOne({ phoneNumber })
    if (data) {
      const otp = generateOTP();
      const sendCode = await sendOTP(phoneNumber, otp);
      storeOTPInMemory(phoneNumber, otp);
      if (sendCode.status) {
        return res.status(200).json({ success: true, message: `OTP sent successfully` });
      } else {
        return res.status(500).json({ success: false, message: "Error while sending otp" });
      }
    } else {
      return res.status(404).json({ success: false, message: "User not found." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to send OTP." });
  }
};

const signin = async (req, res) => {
  const { phoneNumber, mpin } = req.body;

  const user = await User.findOne({ phoneNumber });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const isMatch = await bcrypt.compare(mpin, user.mpin);

  if (!isMatch) {
    return res.status(400).json({ success: false, message: "Invalid MPIN" });
  }

  const jwtExpiry = process.env.JWT_EXPIRY || '24h';

  const token = jwt.sign(
    { userId: user._id, phoneNumber: user.phoneNumber, role: user.role, userName: user.username },
    process.env.JWT_SECRET,
    { expiresIn: jwtExpiry }
  );

  // Prepare the final user data to be returned
  const finalData = {
    token,
    phoneNumber: user.phoneNumber,
    email: user.email,
    role: user.role,
    id: user._id,
    userName: user.username,
    referralCode: user.referralCode,
    balance: user.balance
  };

  // Send the response with the token and user data
  return res.status(200).json({
    success: true,
    message: "MPIN verified successfully.",
    data: finalData
  });
};

const resetMpin = async (req, res) => {
  const { phoneNumber, mpin } = req.body;

  if (!phoneNumber || !mpin) {
    return res.status(400).json({
      success: false,
      message: "Phone number and new MPIN are required."
    });
  }

  console.log(phoneNumber, mpin)

  const user = await User.findOne({ phoneNumber });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const hashedMpin = await bcrypt.hash(mpin, 10);

  user.mpin = hashedMpin;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "MPIN updated successfully."
  });
};


module.exports = { signup, sendOTPHandler, signin, resetMpin };
