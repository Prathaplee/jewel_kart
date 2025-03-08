const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/user');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kyc_images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
  },
});

const upload = multer({ storage: storage }).fields([
  { name: 'aadharImages', maxCount: 2 },
  { name: 'panImages', maxCount: 2 }
]);

const updateUserDetails = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: err.message });
      } else if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      const { address, bankDetails, kyc } = req.body;
      const { phoneNumber } = req.user

      // Find user by phoneNumber
      const user = await User.findOne({ phoneNumber });

      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      if (address) user.address = JSON.parse(address);
      if (bankDetails) user.bankDetails = JSON.parse(bankDetails);

      // If KYC information (Aadhar and PAN) is provided
      if (kyc) {
        if (kyc.aadhar) user.kyc.aadhar = kyc.aadhar;
        if (kyc.pan) user.kyc.pan = kyc.pan;
      }

      // If files are uploaded to Cloudinary, update the KYC images
      if (req.files) {
        if (req.files.aadharImages) {
          // Store the Cloudinary URLs for Aadhar images
          user.kyc.aadharImages = req.files.aadharImages.map(file => file.path); // file.path will be the Cloudinary URL
        }
        if (req.files.panImages) {
          // Store the Cloudinary URLs for PAN images
          user.kyc.panImages = req.files.panImages.map(file => file.path); // file.path will be the Cloudinary URL
        }
      }

      // Save updated user details
      await user.save();

      return res.status(200).json({
        success: true,
        message: "User details updated successfully.",
        user: {
          phoneNumber: user.phoneNumber,
          email: user.email,
          role: user.role,
          address: user.address,
          bankDetails: user.bankDetails,
          kyc: user.kyc
        }
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isAddressEmpty = isEmptyObject(user.address);
    let finalData = { ...user._doc, isAddressUpdate: isAddressEmpty }

    res.status(200).json({ success: true, finalData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

function isEmptyObject(obj) {
  return JSON.stringify(obj) === "{}";
}

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();

    return res.status(200).json({
      success: true,
      result: users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { updateUserDetails, getUser, getAllUsers };
