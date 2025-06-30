/**
 * Drill Model
 * MongoDB schema for drill records with user association and scheduling data
 */

const mongoose = require("mongoose")

const drillSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    drillId: {
      type: String,
      required: true,
    },
    drillName: {
      type: String,
      required: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    teamId: {
      type: String,
      required: false,
      trim: true,
      default: "default-team",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Make it optional to prevent update errors
    },
    visibility: {
      type: String,
      enum: ["private", "team", "organization"],
      default: "team",
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "missed"],
      default: "scheduled",
    },
    notes: String,
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Drill", drillSchema)
