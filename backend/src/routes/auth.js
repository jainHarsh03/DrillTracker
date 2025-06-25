/**
 * Authentication Routes
 * Handles user registration, login, profile access, and JWT token management
 */

const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, organization } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    const user = new User({ name, email, password, organization })
    await user.save()

    // Initialize default drills
    const defaultDrills = [
      "Fire Evacuation Drill",
      "Earthquake Drill",
      "Lockdown Drill",
      "Medical Emergency Drill",
      "Severe Weather Drill",
      "Chemical Spill Drill",
      "Power Outage Drill",
      "Bomb Threat Drill",
      "Active Shooter Drill",
      "Cyber Security Drill",
      "Communication Drill",
      "Equipment Check Drill",
    ]

    const drillHistory = defaultDrills.map((drillName, index) => ({
      drillId: `drill-${index + 1}`,
      drillName,
      scheduledDate: new Date(Date.now() + index * 30 * 24 * 60 * 60 * 1000), // Every 30 days
      status: "scheduled",
    }))

    user.drillHistory = drillHistory
    await user.save()

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" })

    res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        organization: user.organization,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" })

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        organization: user.organization,
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get current user
router.get("/me", auth, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      organization: req.user.organization,
      totalDrills: req.user.totalDrills,
      drillsCompleted: req.user.drillsCompleted,
      drillHistory: req.user.drillHistory,
    },
  })
})

module.exports = router
