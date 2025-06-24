const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const path = require("path")
require("dotenv").config()

const authRoutes = require("./routes/auth")
const drillRoutes = require("./routes/drills")
const userRoutes = require("./routes/users")

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static("../public"))

// Database connection
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/drill-tracker", {
})

const db = mongoose.connection
db.on("error", console.error.bind(console, "connection error:"))
db.once("open", () => {
  console.log("Connected to MongoDB")
  console.log(`🌐 Application running at: http://localhost:${PORT}`)
  console.log(`📊 Dashboard available at: http://localhost:${PORT}/dashboard`)
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/drills", drillRoutes)
app.use("/api/users", userRoutes)

// Serve static files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "login.html"))
})

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "dashboard.html"))
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
