/**
 * Organization Model
 * MongoDB schema for organization records with drill scheduling and management
 */

const mongoose = require("mongoose")

const organizationSchema = new mongoose.Schema(
  {
    companyId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    totalDrills: {
      type: Number,
      default: 0,
    },
    plannedDrillsPerYear: {
      type: Number,
      default: 12,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    admins: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    teams: [{
      teamId: String,
      name: String,
      memberCount: { type: Number, default: 0 }
    }],
    drillTypes: {
      type: [String],
      default: [
        "Fire Evacuation Drill",
        "Earthquake Drill", 
        "Lockdown Drill",
        "Medical Emergency Drill",
        "Severe Weather Drill"
      ]
    },
    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Organization", organizationSchema)
