const express = require("express")
const User = require("../models/User")
const auth = require("../middleware/auth")

const router = express.Router()

// Get all drills for user
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
    res.json(user.drillHistory)
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Update drill schedule
router.put("/schedule", auth, async (req, res) => {
  try {
    const { drillId, newDate } = req.body

    const user = await User.findById(req.user._id)
    const drillIndex = user.drillHistory.findIndex((drill) => drill.drillId === drillId)

    if (drillIndex === -1) {
      return res.status(404).json({ message: "Drill not found" })
    }

    user.drillHistory[drillIndex].scheduledDate = new Date(newDate)
    await user.save()

    res.json({ message: "Drill rescheduled successfully", drill: user.drillHistory[drillIndex] })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Mark drill as completed
router.put("/complete/:drillId", auth, async (req, res) => {
  try {
    const { drillId } = req.params
    const { notes } = req.body

    const user = await User.findById(req.user._id)
    const drillIndex = user.drillHistory.findIndex((drill) => drill.drillId === drillId)

    if (drillIndex === -1) {
      return res.status(404).json({ message: "Drill not found" })
    }

    user.drillHistory[drillIndex].status = "completed"
    user.drillHistory[drillIndex].completedDate = new Date()
    if (notes) user.drillHistory[drillIndex].notes = notes

    user.drillsCompleted = user.drillHistory.filter((drill) => drill.status === "completed").length
    await user.save()

    res.json({ message: "Drill marked as completed", drill: user.drillHistory[drillIndex] })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Generate evenly spaced schedule
router.post("/generate-schedule", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.body
    const user = await User.findById(req.user._id)

    const start = new Date(startDate)
    const end = new Date(endDate)
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    const interval = Math.floor(totalDays / user.totalDrills)

    user.drillHistory.forEach((drill, index) => {
      const scheduledDate = new Date(start)
      scheduledDate.setDate(start.getDate() + index * interval)
      drill.scheduledDate = scheduledDate
      if (drill.status === "completed") drill.status = "scheduled"
    })

    await user.save()
    res.json({ message: "Schedule generated successfully", drills: user.drillHistory })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

// Delete drill
router.delete("/:drillId", auth, async (req, res) => {
  try {
    const { drillId } = req.params
    const user = await User.findById(req.user._id)
    
    const drillIndex = user.drillHistory.findIndex((drill) => drill.drillId === drillId)
    
    if (drillIndex === -1) {
      return res.status(404).json({ message: "Drill not found" })
    }
    
    // Remove the drill from history
    user.drillHistory.splice(drillIndex, 1)
    
    // Update total drills count
    user.totalDrills = user.drillHistory.length
    
    // Recalculate completed drills
    user.drillsCompleted = user.drillHistory.filter((drill) => drill.status === "completed").length
    
    await user.save()
    
    res.json({ 
      message: "Drill deleted successfully", 
      totalDrills: user.totalDrills,
      drillsCompleted: user.drillsCompleted
    })
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

module.exports = router
