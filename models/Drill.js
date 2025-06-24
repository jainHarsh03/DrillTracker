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
    completedDate: Date,
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
