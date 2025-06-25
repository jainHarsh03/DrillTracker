/**
 * Drill Management Routes
 * Provides CRUD operations for drill records with user authentication and validation
 */

const express = require("express")
const mongoose = require("mongoose")
const router = express.Router()
const Drill = require("../models/Drill")
const User = require("../models/User")
const auth = require("../middleware/auth")

// CREATE - Add new drill
router.post("/", auth, async (req, res) => {
  try {
    const { name, scheduledDate, description } = req.body

    console.log("🔧 Creating drill for user ID:", req.user._id)
    console.log("🔧 Drill data:", { name, scheduledDate, description })

    if (!name || !scheduledDate) {
      return res.status(400).json({ message: "Name and scheduled date are required" })
    }

    const drill = new Drill({
      userId: req.user._id,
      drillId: new mongoose.Types.ObjectId().toString(),
      drillName: name,
      scheduledDate: new Date(scheduledDate),
      notes: description || "",
      status: "scheduled",
    })

    await drill.save()
    console.log("✅ Drill saved successfully:", drill._id)

    // Update user's total drills count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalDrills: 1 },
    })

    // Transform drill to match frontend field expectations
    const transformedDrill = {
      _id: drill._id,
      name: drill.drillName,  // Map drillName to name
      drillName: drill.drillName,  // Keep both for compatibility
      scheduledDate: drill.scheduledDate,
      description: drill.notes,  // Map notes to description
      notes: drill.notes,  // Keep both for compatibility
      status: drill.status,
      userId: drill.userId,
      drillId: drill.drillId,
      createdAt: drill.createdAt,
      updatedAt: drill.updatedAt
    }

    res.status(201).json({
      message: "Drill added successfully",
      drill: transformedDrill,
    })
  } catch (error) {
    console.error("Error adding drill:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// READ - Get all drills for user
router.get("/", auth, async (req, res) => {
  try {
    console.log("🔍 Getting drills for user ID:", req.user._id)
    
    const drills = await Drill.find({ userId: req.user._id }).sort({ scheduledDate: 1 })
    
    console.log("📋 Found drills:", drills.length)
    console.log("📋 Drills data:", drills)

    // Transform drills to match frontend field expectations
    const transformedDrills = drills.map(drill => ({
      _id: drill._id,
      name: drill.drillName,  // Map drillName to name
      drillName: drill.drillName,  // Keep both for compatibility
      scheduledDate: drill.scheduledDate,
      description: drill.notes,  // Map notes to description
      notes: drill.notes,  // Keep both for compatibility
      status: drill.status,
      userId: drill.userId,
      drillId: drill.drillId,
      createdAt: drill.createdAt,
      updatedAt: drill.updatedAt
    }))

    // Return transformed drills array directly for frontend compatibility
    res.json(transformedDrills)
  } catch (error) {
    console.error("Error fetching drills:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// READ - Get single drill
router.get("/:drillId", auth, async (req, res) => {
  try {
    console.log("🔍 Getting single drill with ID:", req.params.drillId)
    console.log("🔍 User ID:", req.user._id)

    const drill = await Drill.findOne({
      _id: req.params.drillId,
      userId: req.user._id,
    })

    if (!drill) {
      console.log("❌ Single drill not found")
      return res.status(404).json({ message: "Drill not found" })
    }

    console.log("✅ Found single drill:", drill._id)

    // Transform drill to match frontend field expectations
    const transformedDrill = {
      _id: drill._id,
      name: drill.drillName,  // Map drillName to name
      drillName: drill.drillName,  // Keep both for compatibility
      scheduledDate: drill.scheduledDate,
      description: drill.notes,  // Map notes to description
      notes: drill.notes,  // Keep both for compatibility
      status: drill.status,
      userId: drill.userId,
      drillId: drill.drillId,
      createdAt: drill.createdAt,
      updatedAt: drill.updatedAt
    }

    res.json(transformedDrill)
  } catch (error) {
    console.error("Error fetching single drill:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// UPDATE - Update drill
router.put("/:drillId", auth, async (req, res) => {
  try {
    const { name, scheduledDate, description, status } = req.body

    console.log("🔄 Updating drill with ID:", req.params.drillId)
    console.log("🔄 Update data:", { name, scheduledDate, description, status })
    console.log("🔄 User ID:", req.user._id)

    // Find drill by MongoDB _id (not custom drillId field)
    const drill = await Drill.findOne({
      _id: req.params.drillId,
      userId: req.user._id,
    })

    if (!drill) {
      console.log("❌ Drill not found")
      return res.status(404).json({ message: "Drill not found" })
    }

    console.log("✅ Found drill:", drill._id)

    // Update fields if provided
    if (name) drill.drillName = name
    if (scheduledDate) drill.scheduledDate = new Date(scheduledDate)
    if (description !== undefined) drill.notes = description
    if (status) {
      const oldStatus = drill.status
      drill.status = status

      // Update user stats if status changed
      if (oldStatus !== status) {
        const user = await User.findById(req.user._id)
        if (status === "completed" && oldStatus !== "completed") {
          user.drillsCompleted += 1
        } else if (status !== "completed" && oldStatus === "completed") {
          user.drillsCompleted = Math.max(0, user.drillsCompleted - 1)
        }
        await user.save()
        console.log("📊 Updated user stats")
      }
    }

    await drill.save()
    console.log("✅ Drill updated successfully")

    // Transform drill to match frontend field expectations
    const transformedDrill = {
      _id: drill._id,
      name: drill.drillName,  // Map drillName to name
      drillName: drill.drillName,  // Keep both for compatibility
      scheduledDate: drill.scheduledDate,
      description: drill.notes,  // Map notes to description
      notes: drill.notes,  // Keep both for compatibility
      status: drill.status,
      userId: drill.userId,
      drillId: drill.drillId,
      createdAt: drill.createdAt,
      updatedAt: drill.updatedAt
    }

    res.json({
      message: "Drill updated successfully",
      drill: transformedDrill,
    })
  } catch (error) {
    console.error("Error updating drill:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// DELETE - Delete drill
router.delete("/:drillId", auth, async (req, res) => {
  try {
    console.log("🗑️ Deleting drill with ID:", req.params.drillId)
    console.log("🗑️ User ID:", req.user._id)

    // Find drill by MongoDB _id (not custom drillId field)
    const drill = await Drill.findOne({
      _id: req.params.drillId,
      userId: req.user._id,
    })

    if (!drill) {
      console.log("❌ Drill not found for deletion")
      return res.status(404).json({ message: "Drill not found" })
    }

    console.log("✅ Found drill for deletion:", drill._id)

    // Delete the drill
    await Drill.findByIdAndDelete(req.params.drillId)
    console.log("✅ Drill deleted from database")

    // Update user stats
    const user = await User.findById(req.user._id)
    user.totalDrills = Math.max(0, user.totalDrills - 1)
    if (drill.status === "completed") {
      user.drillsCompleted = Math.max(0, user.drillsCompleted - 1)
    }
    await user.save()
    console.log("📊 Updated user stats after deletion")

    res.json({
      message: "Drill deleted successfully",
      totalDrills: user.totalDrills,
      completedDrills: user.drillsCompleted,
    })
  } catch (error) {
    console.error("Error deleting drill:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Generate schedule endpoint
router.post("/generate-schedule", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.body
    console.log("🗓️ Generating schedule from", startDate, "to", endDate)
    console.log("🗓️ User ID:", req.user._id)

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" })
    }

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Get existing drills for this user
    const existingDrills = await Drill.find({ userId: req.user._id })
    console.log("🗓️ Existing drills:", existingDrills.length)

    const start = new Date(startDate)
    const end = new Date(endDate)
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    
    // Create sample drills if none exist
    const drillTemplates = [
      "Fire Evacuation Drill",
      "Earthquake Drill", 
      "Lockdown Drill",
      "Medical Emergency Drill",
      "Severe Weather Drill"
    ]

    const newDrills = []
    const interval = Math.max(1, Math.floor(totalDays / 5)) // Space drills evenly

    for (let i = 0; i < 5; i++) {
      const scheduledDate = new Date(start)
      scheduledDate.setDate(start.getDate() + (i * interval))
      
      const drill = new Drill({
        userId: req.user._id,
        drillId: new mongoose.Types.ObjectId().toString(),
        drillName: drillTemplates[i],
        scheduledDate: scheduledDate,
        notes: `Scheduled ${drillTemplates[i]} for the period`,
        status: "scheduled",
      })

      await drill.save()
      newDrills.push(drill)
    }

    // Update user's total drills count
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { totalDrills: newDrills.length },
    })

    console.log("✅ Generated", newDrills.length, "new drills")

    res.json({ 
      message: "Schedule generated successfully", 
      drillsGenerated: newDrills.length,
      drills: newDrills.map(drill => ({
        _id: drill._id,
        name: drill.drillName,
        drillName: drill.drillName,
        scheduledDate: drill.scheduledDate,
        description: drill.notes,
        notes: drill.notes,
        status: drill.status,
        userId: drill.userId,
        drillId: drill.drillId
      }))
    })
  } catch (error) {
    console.error("Error generating schedule:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// DEBUG - Get all drills in database (for troubleshooting)
router.get("/debug/all", auth, async (req, res) => {
  try {
    const allDrills = await Drill.find({})
    console.log("🔍 DEBUG: All drills in database:", allDrills.length)
    
    res.json({
      message: "Debug: All drills in database",
      totalCount: allDrills.length,
      currentUser: req.user._id,
      drills: allDrills.map(drill => ({
        _id: drill._id,
        userId: drill.userId,
        drillName: drill.drillName,
        scheduledDate: drill.scheduledDate,
        status: drill.status
      }))
    })
  } catch (error) {
    console.error("Error in debug endpoint:", error)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
