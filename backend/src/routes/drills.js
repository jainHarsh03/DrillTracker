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
    const { name, scheduledDate, description, visibility = "team" } = req.body

    console.log("🔧 Creating drill for user ID:", req.user._id)
    console.log("🔧 Drill data:", { name, scheduledDate, description, visibility })

    if (!name || !scheduledDate) {
      return res.status(400).json({ message: "Name and scheduled date are required" })
    }

    // Get user to access team information
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const drill = new Drill({
      userId: req.user._id,
      drillId: new mongoose.Types.ObjectId().toString(),
      drillName: name,
      scheduledDate: new Date(scheduledDate),
      notes: description || "",
      status: "scheduled",
      teamId: user.teamId,
      createdBy: req.user._id,
      visibility: visibility,
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
      teamId: drill.teamId,
      createdBy: drill.createdBy,
      visibility: drill.visibility,
      completedAt: drill.completedAt,
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

// READ - Get all drills for user with filtering options
router.get("/", auth, async (req, res) => {
  try {
    const { status, teamFilter, visibility } = req.query
    console.log("🔍 Getting drills for user ID:", req.user._id)
    console.log("🔍 Filters:", { status, teamFilter, visibility })
    
    // Get user to access team information
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Build query based on filters
    let query = {}
    
    // Team filtering
    if (teamFilter === "my") {
      query.userId = req.user._id
    } else if (teamFilter === "team") {
      query.teamId = user.teamId
    } else if (teamFilter === "organization") {
      // Get all users from same organization
      const orgUsers = await User.find({ organization: user.organization })
      const orgUserIds = orgUsers.map(u => u._id)
      query.userId = { $in: orgUserIds }
    } else {
      // Default: show ALL drills for the user (personal, team, and organization)
      query.$or = [
        { userId: req.user._id },
        { teamId: user.teamId },
        { visibility: "organization" }
      ]
    }

    // Status filtering
    if (status) {
      if (status === "completed") {
        query.status = "completed"
      } else if (status === "incomplete") {
        query.status = { $in: ["scheduled", "missed"] }
      } else {
        query.status = status
      }
    }

    // Visibility filtering
    if (visibility) {
      query.visibility = visibility
    }

    const drills = await Drill.find(query)
      .populate('userId', 'name email teamId')
      .populate('createdBy', 'name email')
      .sort({ scheduledDate: 1 })
    
    console.log("📋 Found drills:", drills.length)

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
      teamId: drill.teamId,
      createdBy: drill.createdBy,
      visibility: drill.visibility,
      completedAt: drill.completedAt,
      createdAt: drill.createdAt,
      updatedAt: drill.updatedAt,
      assignedUser: drill.userId ? {
        _id: drill.userId._id,
        name: drill.userId.name,
        email: drill.userId.email,
        teamId: drill.userId.teamId
      } : null,
      createdByUser: drill.createdBy ? {
        _id: drill.createdBy._id,
        name: drill.createdBy.name,
        email: drill.createdBy.email
      } : null
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
    const { name, scheduledDate, description, status, visibility } = req.body

    console.log("🔄 Updating drill with ID:", req.params.drillId)
    console.log("🔄 Update data:", { name, scheduledDate, description, status, visibility })
    console.log("🔄 User ID:", req.user._id)

    // Find drill by MongoDB _id (not custom drillId field)
    const drill = await Drill.findOne({
      _id: req.params.drillId,
    })

    if (!drill) {
      console.log("❌ Drill not found")
      return res.status(404).json({ message: "Drill not found" })
    }

    // Check if user has permission to update this drill
    const user = await User.findById(req.user._id)
    const canUpdate = drill.userId.toString() === req.user._id.toString() || 
                     drill.teamId === user.teamId && user.role === "admin"

    if (!canUpdate) {
      return res.status(403).json({ message: "Not authorized to update this drill" })
    }

    console.log("✅ Found drill:", drill._id)

    // Ensure createdBy is set if missing (for legacy drills)
    if (!drill.createdBy) {
      drill.createdBy = drill.userId;
    }

    // Update fields if provided
    if (name) drill.drillName = name
    if (scheduledDate) drill.scheduledDate = new Date(scheduledDate)
    if (description !== undefined) drill.notes = description
    if (visibility) drill.visibility = visibility
    
    if (status) {
      const oldStatus = drill.status
      drill.status = status

      // Set completedAt when marking as completed
      if (status === "completed" && oldStatus !== "completed") {
        drill.completedAt = new Date()
      } else if (status !== "completed" && oldStatus === "completed") {
        drill.completedAt = null
      }

      // Update user stats if status changed
      if (oldStatus !== status) {
        const assignedUser = await User.findById(drill.userId)
        if (assignedUser) {
          if (status === "completed" && oldStatus !== "completed") {
            assignedUser.drillsCompleted += 1
          } else if (status !== "completed" && oldStatus === "completed") {
            assignedUser.drillsCompleted = Math.max(0, assignedUser.drillsCompleted - 1)
          }
          await assignedUser.save()
          console.log("📊 Updated user stats")
        }
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
      teamId: drill.teamId,
      createdBy: drill.createdBy,
      visibility: drill.visibility,
      completedAt: drill.completedAt,
      createdAt: drill.createdAt,
      updatedAt: drill.updatedAt
    }

    res.json({
      message: "Drill updated successfully",
      drill: transformedDrill,
    })
  } catch (error) {
    console.error("Error updating drill:", error)
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: validationErrors,
        error: error.message 
      });
    }
    
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
    if (user) {
      user.totalDrills = Math.max(0, user.totalDrills - 1)
      if (drill.status === "completed") {
        user.drillsCompleted = Math.max(0, user.drillsCompleted - 1)
      }
      await user.save()
      console.log("📊 Updated user stats after deletion")
    }

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

    // Get existing drills for this team
    const existingDrills = await Drill.find({ teamId: user.teamId })
    console.log("🗓️ Existing team drills:", existingDrills.length)

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
        teamId: user.teamId,
        createdBy: req.user._id,
        visibility: "team",
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
        drillId: drill.drillId,
        teamId: drill.teamId,
        createdBy: drill.createdBy,
        visibility: drill.visibility,
        completedAt: drill.completedAt
      }))
    })
  } catch (error) {
    console.error("Error generating schedule:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// GET - Get team members
router.get("/team/members", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const teamMembers = await User.find({ teamId: user.teamId })
      .select('name email role teamId drillsCompleted totalDrills')
      .sort({ name: 1 })

    res.json({
      teamId: user.teamId,
      members: teamMembers
    })
  } catch (error) {
    console.error("Error fetching team members:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// GET - Get teams in organization
router.get("/teams", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Get all unique teams in the organization
    const teams = await User.aggregate([
      { $match: { organization: user.organization } },
      { 
        $group: { 
          _id: "$teamId", 
          memberCount: { $sum: 1 },
          totalDrills: { $sum: "$totalDrills" },
          completedDrills: { $sum: "$drillsCompleted" }
        } 
      },
      { $sort: { _id: 1 } }
    ])

    res.json({
      organization: user.organization,
      currentTeam: user.teamId,
      teams: teams.map(team => ({
        teamId: team._id,
        memberCount: team.memberCount,
        totalDrills: team.totalDrills,
        completedDrills: team.completedDrills,
        successRate: team.totalDrills > 0 ? Math.round((team.completedDrills / team.totalDrills) * 100) : 0
      }))
    })
  } catch (error) {
    console.error("Error fetching teams:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// GET - Get drill statistics
router.get("/stats", auth, async (req, res) => {
  try {
    const { scope = "team" } = req.query
    const user = await User.findById(req.user._id)
    
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    let query = {}
    
    if (scope === "my") {
      query.userId = req.user._id
    } else if (scope === "team") {
      query.teamId = user.teamId
    } else if (scope === "organization") {
      const orgUsers = await User.find({ organization: user.organization })
      const orgUserIds = orgUsers.map(u => u._id)
      query.userId = { $in: orgUserIds }
    }

    const stats = await Drill.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalDrills: { $sum: 1 },
          completedDrills: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          scheduledDrills: { $sum: { $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0] } },
          missedDrills: { $sum: { $cond: [{ $eq: ["$status", "missed"] }, 1, 0] } },
          thisMonth: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gte: ["$scheduledDate", new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                    { $lt: ["$scheduledDate", new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ])

    const result = stats[0] || {
      totalDrills: 0,
      completedDrills: 0,
      scheduledDrills: 0,
      missedDrills: 0,
      thisMonth: 0
    }

    result.successRate = result.totalDrills > 0 ? Math.round((result.completedDrills / result.totalDrills) * 100) : 0

    res.json({
      scope,
      stats: result
    })
  } catch (error) {
    console.error("Error fetching drill stats:", error)
    res.status(500).json({ message: "Server error" })
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
