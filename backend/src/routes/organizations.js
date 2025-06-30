/**
 * Organization Management Routes
 * Provides CRUD operations for organization records and drill scheduling
 */

const express = require("express")
const mongoose = require("mongoose")
const router = express.Router()
const Organization = require("../models/Organization")
const User = require("../models/User")
const Drill = require("../models/Drill")
const auth = require("../middleware/auth")

// CREATE - Add new organization
router.post("/", auth, async (req, res) => {
  try {
    const { companyId, name, description, industry, location, plannedDrillsPerYear, drillTypes } = req.body

    console.log("🏢 Creating organization:", { companyId, name })

    if (!companyId || !name) {
      return res.status(400).json({ message: "Company ID and name are required" })
    }

    // Check if organization with this companyId already exists
    const existingOrg = await Organization.findOne({ companyId })
    if (existingOrg) {
      return res.status(400).json({ message: "Organization with this Company ID already exists" })
    }

    const organization = new Organization({
      companyId,
      name,
      description: description || "",
      industry: industry || "",
      location: location || "",
      plannedDrillsPerYear: plannedDrillsPerYear || 12,
      drillTypes: drillTypes || [
        "Fire Evacuation Drill",
        "Earthquake Drill", 
        "Lockdown Drill",
        "Medical Emergency Drill",
        "Severe Weather Drill"
      ],
      createdBy: req.user._id,
      admins: [req.user._id],
    })

    await organization.save()
    console.log("✅ Organization created successfully:", organization._id)

    res.status(201).json({
      message: "Organization created successfully",
      organization: {
        _id: organization._id,
        companyId: organization.companyId,
        name: organization.name,
        description: organization.description,
        industry: organization.industry,
        location: organization.location,
        totalDrills: organization.totalDrills,
        plannedDrillsPerYear: organization.plannedDrillsPerYear,
        drillTypes: organization.drillTypes,
        status: organization.status,
        createdAt: organization.createdAt,
      },
    })
  } catch (error) {
    console.error("Error creating organization:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// READ - Get all organizations
router.get("/", auth, async (req, res) => {
  try {
    console.log("🔍 Getting organizations for user ID:", req.user._id)
    
    const organizations = await Organization.find({})
      .populate('createdBy', 'name email')
      .populate('admins', 'name email')
      .sort({ createdAt: -1 })
    
    console.log("🏢 Found organizations:", organizations.length)

    // Transform organizations for frontend
    const transformedOrgs = organizations.map(org => ({
      _id: org._id,
      companyId: org.companyId,
      name: org.name,
      description: org.description,
      industry: org.industry,
      location: org.location,
      totalDrills: org.totalDrills,
      plannedDrillsPerYear: org.plannedDrillsPerYear,
      drillTypes: org.drillTypes,
      status: org.status,
      createdBy: org.createdBy,
      admins: org.admins,
      teams: org.teams,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt
    }))

    res.json(transformedOrgs)
  } catch (error) {
    console.error("Error fetching organizations:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// READ - Get single organization
router.get("/:orgId", auth, async (req, res) => {
  try {
    console.log("🔍 Getting organization with ID:", req.params.orgId)

    const organization = await Organization.findById(req.params.orgId)
      .populate('createdBy', 'name email')
      .populate('admins', 'name email')

    if (!organization) {
      console.log("❌ Organization not found")
      return res.status(404).json({ message: "Organization not found" })
    }

    console.log("✅ Found organization:", organization._id)

    res.json({
      _id: organization._id,
      companyId: organization.companyId,
      name: organization.name,
      description: organization.description,
      industry: organization.industry,
      location: organization.location,
      totalDrills: organization.totalDrills,
      plannedDrillsPerYear: organization.plannedDrillsPerYear,
      drillTypes: organization.drillTypes,
      status: organization.status,
      createdBy: organization.createdBy,
      admins: organization.admins,
      teams: organization.teams,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt
    })
  } catch (error) {
    console.error("Error fetching organization:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// UPDATE - Update organization
router.put("/:orgId", auth, async (req, res) => {
  try {
    const { name, description, industry, location, plannedDrillsPerYear, drillTypes, status } = req.body

    console.log("🔄 Updating organization with ID:", req.params.orgId)

    const organization = await Organization.findById(req.params.orgId)

    if (!organization) {
      console.log("❌ Organization not found")
      return res.status(404).json({ message: "Organization not found" })
    }

    // Check if user has permission to update
    const isAdmin = organization.admins.includes(req.user._id) || 
                   organization.createdBy.toString() === req.user._id.toString()

    if (!isAdmin) {
      return res.status(403).json({ message: "Not authorized to update this organization" })
    }

    // Update fields if provided
    if (name) organization.name = name
    if (description !== undefined) organization.description = description
    if (industry) organization.industry = industry
    if (location) organization.location = location
    if (plannedDrillsPerYear) organization.plannedDrillsPerYear = plannedDrillsPerYear
    if (drillTypes) organization.drillTypes = drillTypes
    if (status) organization.status = status

    await organization.save()
    console.log("✅ Organization updated successfully")

    res.json({
      message: "Organization updated successfully",
      organization: {
        _id: organization._id,
        companyId: organization.companyId,
        name: organization.name,
        description: organization.description,
        industry: organization.industry,
        location: organization.location,
        totalDrills: organization.totalDrills,
        plannedDrillsPerYear: organization.plannedDrillsPerYear,
        drillTypes: organization.drillTypes,
        status: organization.status,
        createdAt: organization.createdAt,
        updatedAt: organization.updatedAt
      },
    })
  } catch (error) {
    console.error("Error updating organization:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// POST - Schedule drills for organization
router.post("/:orgId/schedule-drills", auth, async (req, res) => {
  try {
    const { startDate, endDate, numberOfDrills } = req.body
    const orgId = req.params.orgId

    console.log("📅 Scheduling drills for organization:", orgId)
    console.log("📅 Parameters:", { startDate, endDate, numberOfDrills })
    console.log("📅 Request body:", req.body)

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Start date and end date are required" })
    }

    // Validate dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format provided" })
    }
    
    if (start >= end) {
      return res.status(400).json({ message: "End date must be after start date" })
    }

    // Validate orgId format
    if (!mongoose.Types.ObjectId.isValid(orgId)) {
      return res.status(400).json({ message: "Invalid organization ID format" })
    }

    const organization = await Organization.findById(orgId)
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" })
    }

    console.log("✅ Found organization:", organization.name)

    // Check if user has permission
    const isAdmin = organization.admins.includes(req.user._id) || 
                   organization.createdBy.toString() === req.user._id.toString()

    if (!isAdmin) {
      return res.status(403).json({ message: "Not authorized to schedule drills for this organization" })
    }

    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    
    const drillCount = numberOfDrills || organization.plannedDrillsPerYear
    const interval = Math.max(1, Math.floor(totalDays / drillCount))

    console.log("📊 Scheduling calculation:", { totalDays, drillCount, interval })

    // Get user for team assignment
    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    
    const newDrills = []
    const drillTypes = organization.drillTypes || [
      "Fire Evacuation Drill",
      "Earthquake Drill", 
      "Lockdown Drill",
      "Medical Emergency Drill",
      "Severe Weather Drill"
    ]

    console.log("🏷️ Available drill types:", drillTypes)

    for (let i = 0; i < drillCount; i++) {
      try {
        const scheduledDate = new Date(start)
        scheduledDate.setDate(start.getDate() + (i * interval))
        
        // Ensure valid date
        if (isNaN(scheduledDate.getTime())) {
          console.error("❌ Invalid date calculated:", scheduledDate)
          continue
        }
        
        // Cycle through drill types
        const drillType = drillTypes[i % drillTypes.length]
        
        console.log(`📅 Creating drill ${i + 1}/${drillCount}: ${drillType} on ${scheduledDate.toISOString()}`)
        
        const drill = new Drill({
          userId: req.user._id,
          drillId: new mongoose.Types.ObjectId().toString(),
          drillName: drillType,
          scheduledDate: scheduledDate,
          notes: `Scheduled ${drillType} for ${organization.name}`,
          status: "scheduled",
          teamId: user.teamId || "default-team",
          createdBy: req.user._id,
          visibility: "organization",
        })

        await drill.save()
        newDrills.push(drill)
        console.log(`✅ Drill saved successfully: ${drill._id}`)
      } catch (drillError) {
        console.error(`❌ Error creating drill ${i + 1}:`, drillError)
        // Continue with next drill instead of failing completely
      }
    }

    // Update organization's total drills count
    if (newDrills.length > 0) {
      organization.totalDrills += newDrills.length
      await organization.save()
      console.log("✅ Updated organization total drills count")
    }

    console.log("✅ Generated", newDrills.length, "new drills for organization")

    // Return success response with proper drill mapping
    res.json({ 
      message: "Drills scheduled successfully", 
      drillsGenerated: newDrills.length,
      organization: organization.name,
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
        completedAt: drill.completedAt,
        createdAt: drill.createdAt,
        updatedAt: drill.updatedAt
      }))
    })
  } catch (error) {
    console.error("❌ Error scheduling drills:", error)
    console.error("❌ Error stack:", error.stack)
    res.status(500).json({ 
      message: "Server error while scheduling drills", 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

// GET - Get organization statistics
router.get("/:orgId/stats", auth, async (req, res) => {
  try {
    const orgId = req.params.orgId

    const organization = await Organization.findById(orgId)
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" })
    }

    // Get all users from this organization
    const orgUsers = await User.find({ organization: organization.name })
    const orgUserIds = orgUsers.map(u => u._id)

    // Get drill statistics
    const drillStats = await Drill.aggregate([
      { $match: { userId: { $in: orgUserIds } } },
      {
        $group: {
          _id: null,
          totalDrills: { $sum: 1 },
          completedDrills: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          scheduledDrills: { $sum: { $cond: [{ $eq: ["$status", "scheduled"] }, 1, 0] } },
          missedDrills: { $sum: { $cond: [{ $eq: ["$status", "missed"] }, 1, 0] } },
        }
      }
    ])

    const stats = drillStats[0] || {
      totalDrills: 0,
      completedDrills: 0,
      scheduledDrills: 0,
      missedDrills: 0
    }

    stats.successRate = stats.totalDrills > 0 ? Math.round((stats.completedDrills / stats.totalDrills) * 100) : 0
    stats.userCount = orgUsers.length

    res.json({
      organization: {
        _id: organization._id,
        companyId: organization.companyId,
        name: organization.name,
        plannedDrillsPerYear: organization.plannedDrillsPerYear
      },
      stats
    })
  } catch (error) {
    console.error("Error fetching organization stats:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// DELETE - Delete organization
router.delete("/:orgId", auth, async (req, res) => {
  try {
    console.log("🗑️ Deleting organization with ID:", req.params.orgId)

    const organization = await Organization.findById(req.params.orgId)

    if (!organization) {
      console.log("❌ Organization not found for deletion")
      return res.status(404).json({ message: "Organization not found" })
    }

    // Check if user has permission to delete
    if (organization.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this organization" })
    }

    await Organization.findByIdAndDelete(req.params.orgId)
    console.log("✅ Organization deleted from database")

    res.json({
      message: "Organization deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting organization:", error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
