const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const schemeRoutes = require("./routes/schemeRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const referralRoutes = require("./routes/referralRoutes");
const userRoutes = require("./routes/userRoutes")
const adminRoutes = require("./routes/adminRoutes")

dotenv.config();

const app = express();

// Middleware
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to the API! Your request has been successfully received.");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/schemes", schemeRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/referrals", referralRoutes);
app.use("/api/user", userRoutes)
app.use("/api/admin", adminRoutes)

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
