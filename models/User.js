const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    organization: {
      type: String,
      required: true,
      trim: true,
    },
    totalDrills: {
      type: Number,
      default: 12,
    },
    drillsCompleted: {
      type: Number,
      default: 0,
    },
    drillHistory: [
      {
        drillId: String,
        drillName: String,
        scheduledDate: Date,
        completedDate: Date,
        status: {
          type: String,
          enum: ["scheduled", "completed", "missed"],
          default: "scheduled",
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model("User", userSchema)
