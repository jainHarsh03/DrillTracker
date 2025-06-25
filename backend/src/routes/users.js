/**
 * User Management Routes
 * Handles user profile updates and account management operations
 */

const express = require("express")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// Update user profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, organization } = req.body

    const user = await User.findById(req.user._id)
    if (name) user.name = name
    if (organization) user.organization = organization

    await user.save()

    res.json({
      message: "Profile updated successfully",
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

// Get user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        organization: user.organization,
        totalDrills: user.totalDrills || 0,
        drillsCompleted: user.drillsCompleted || 0,
        drillHistory: user.drillHistory || [],
        createdAt: user.createdAt
      },
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Get all users (for admin purposes - you might want to add admin check)
router.get("/", auth, async (req, res) => {
  try {
    const users = await User.find({}, {
      password: 0 // Exclude password field
    }).sort({ createdAt: -1 })

    res.json({
      count: users.length,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        organization: user.organization,
        totalDrills: user.totalDrills || 0,
        drillsCompleted: user.drillsCompleted || 0,
        createdAt: user.createdAt
      }))
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
