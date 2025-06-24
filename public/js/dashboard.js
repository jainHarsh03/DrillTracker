const API_BASE = "/api"
const currentDate = new Date()
let drills = []
let currentDrill = null

// Check authentication
if (!localStorage.getItem("token")) {
  window.location.href = "/"
}

// Initialize dashboard
document.addEventListener("DOMContentLoaded", async () => {
  await loadUserData()
  await loadDrills()
  renderCalendar()
  renderDrillsList()

  // Set default dates
  const today = new Date()
  const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())

  document.getElementById("startDate").value = today.toISOString().split("T")[0]
  document.getElementById("endDate").value = nextYear.toISOString().split("T")[0]
})

async function loadUserData() {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (response.ok) {
      const data = await response.json()
      document.getElementById("userName").textContent = `${data.user.name} (${data.user.organization})`
      document.getElementById("totalDrills").textContent = data.user.totalDrills
      document.getElementById("completedDrills").textContent = data.user.drillsCompleted
      document.getElementById("progressPercent").textContent =
        Math.round((data.user.drillsCompleted / data.user.totalDrills) * 100) + "%"
    }
  } catch (error) {
    console.error("Error loading user data:", error)
  }
}

async function loadDrills() {
  try {
    const response = await fetch(`${API_BASE}/drills`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })

    if (response.ok) {
      drills = await response.json()
    }
  } catch (error) {
    console.error("Error loading drills:", error)
  }
}

function renderCalendar() {
  const calendar = document.getElementById("calendar")
  const monthYear = document.getElementById("currentMonth")

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  monthYear.textContent = new Date(year, month).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  // Clear calendar
  calendar.innerHTML = ""

  // Add day headers
  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  dayHeaders.forEach((day) => {
    const dayHeader = document.createElement("div")
    dayHeader.className = "calendar-day-header"
    dayHeader.textContent = day
    dayHeader.style.fontWeight = "bold"
    dayHeader.style.background = "#f8f9fa"
    calendar.appendChild(dayHeader)
  })

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  // Add previous month's trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const dayElement = createCalendarDay(day, true)
    calendar.appendChild(dayElement)
  }

  // Add current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = createCalendarDay(day, false)
    calendar.appendChild(dayElement)
  }

  // Add next month's leading days
  const totalCells = calendar.children.length - 7 // Subtract day headers
  const remainingCells = 42 - totalCells // 6 rows * 7 days
  for (let day = 1; day <= remainingCells; day++) {
    const dayElement = createCalendarDay(day, true)
    calendar.appendChild(dayElement)
  }
}

function createCalendarDay(day, isOtherMonth) {
  const dayElement = document.createElement("div")
  dayElement.className = "calendar-day"
  if (isOtherMonth) dayElement.classList.add("other-month")

  const dayNumber = document.createElement("div")
  dayNumber.textContent = day
  dayElement.appendChild(dayNumber)

  if (!isOtherMonth) {
    const currentDateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split("T")[0]

    const dayDrills = drills.filter((drill) => {
      const drillDate = new Date(drill.scheduledDate).toISOString().split("T")[0]
      return drillDate === currentDateStr
    })

    if (dayDrills.length > 0) {
      dayElement.classList.add("has-drill")
      const completedDrills = dayDrills.filter((drill) => drill.status === "completed")
      if (completedDrills.length === dayDrills.length) {
        dayElement.classList.add("completed-drill")
      }

      const indicator = document.createElement("div")
      indicator.className = "drill-indicator"
      indicator.textContent = `${dayDrills.length} drill${dayDrills.length > 1 ? "s" : ""}`
      dayElement.appendChild(indicator)
    }

    dayElement.addEventListener("click", () => {
      if (dayDrills.length > 0) {
        showDrillModal(dayDrills[0])
      }
    })
  }

  return dayElement
}

function renderDrillsList() {
  const drillsList = document.getElementById("drillsList")
  drillsList.innerHTML = ""

  const sortedDrills = [...drills].sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate))

  sortedDrills.forEach((drill) => {
    const drillElement = document.createElement("div")
    drillElement.className = "drill-item"

    const scheduledDate = new Date(drill.scheduledDate)
    const isOverdue = scheduledDate < new Date() && drill.status !== "completed"

    if (drill.status === "completed") {
      drillElement.classList.add("completed")
    } else if (isOverdue) {
      drillElement.classList.add("overdue")
    }

    drillElement.innerHTML = `
            <div class="drill-info">
                <h3>${drill.drillName}</h3>
                <p>Scheduled: ${scheduledDate.toLocaleDateString()}</p>
                ${drill.completedDate ? `<p>Completed: ${new Date(drill.completedDate).toLocaleDateString()}</p>` : ""}
            </div>
            <div class="drill-status ${drill.status}">
                ${drill.status}
            </div>
        `

    drillElement.addEventListener("click", () => showDrillModal(drill))
    drillsList.appendChild(drillElement)
  })
}

function showDrillModal(drill) {
  currentDrill = drill
  const modal = document.getElementById("drillModal")

  document.getElementById("modalDrillName").textContent = drill.drillName
  document.getElementById("modalScheduledDate").textContent = new Date(drill.scheduledDate).toLocaleDateString()
  document.getElementById("modalStatus").textContent = drill.status

  const actions = document.getElementById("modalActions")
  if (drill.status === "completed") {
    actions.style.display = "none"
  } else {
    actions.style.display = "block"
  }

  modal.style.display = "block"
}

function closeDrillModal() {
  document.getElementById("drillModal").style.display = "none"
  document.getElementById("rescheduleSection").classList.add("hidden")
}

function showReschedule() {
  document.getElementById("rescheduleSection").classList.remove("hidden")
  const currentDate = new Date(currentDrill.scheduledDate)
  document.getElementById("newScheduleDate").value = currentDate.toISOString().slice(0, 16)
}

async function markCompleted() {
  try {
    const response = await fetch(`${API_BASE}/drills/complete/${currentDrill.drillId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ notes: "" }),
    })

    if (response.ok) {
      await loadUserData()
      await loadDrills()
      renderCalendar()
      renderDrillsList()
      closeDrillModal()
    }
  } catch (error) {
    console.error("Error marking drill as completed:", error)
  }
}

async function reschedule() {
  const newDate = document.getElementById("newScheduleDate").value

  try {
    const response = await fetch(`${API_BASE}/drills/schedule`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        drillId: currentDrill.drillId,
        newDate: new Date(newDate).toISOString(),
      }),
    })

    if (response.ok) {
      await loadDrills()
      renderCalendar()
      renderDrillsList()
      closeDrillModal()
    }
  } catch (error) {
    console.error("Error rescheduling drill:", error)
  }
}

async function generateSchedule() {
  console.log("Generate schedule button clicked")
  const startDate = document.getElementById("startDate").value
  const endDate = document.getElementById("endDate").value

  console.log("Start date:", startDate, "End date:", endDate)

  if (!startDate || !endDate) {
    alert("Please select both start and end dates")
    return
  }

  try {
    console.log("Sending request to generate schedule...")
    const response = await fetch(`${API_BASE}/drills/generate-schedule`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ startDate, endDate }),
    })

    console.log("Response status:", response.status)
    const data = await response.json()
    console.log("Response data:", data)

    if (response.ok) {
      alert("Schedule generated successfully!")
      await loadDrills()
      renderCalendar()
      renderDrillsList()
    } else {
      alert("Error generating schedule: " + (data.message || "Unknown error"))
    }
  } catch (error) {
    console.error("Error generating schedule:", error)
    alert("Error generating schedule: " + error.message)
  }
}

function previousMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1)
  renderCalendar()
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1)
  renderCalendar()
}

async function deleteDrill() {
  if (!confirm(`Are you sure you want to delete "${currentDrill.drillName}"? This action cannot be undone.`)) {
    return
  }

  try {
    const response = await fetch(`${API_BASE}/drills/${currentDrill.drillId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (response.ok) {
      alert("Drill deleted successfully!")
      await loadUserData()
      await loadDrills()
      renderCalendar()
      renderDrillsList()
      closeDrillModal()
    } else {
      alert("Error deleting drill: " + (data.message || "Unknown error"))
    }
  } catch (error) {
    console.error("Error deleting drill:", error)
    alert("Error deleting drill: " + error.message)
  }
}

function logout() {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  window.location.href = "/"
}

// Close modal when clicking outside
window.addEventListener("click", (e) => {
  const modal = document.getElementById("drillModal")
  if (e.target === modal) {
    closeDrillModal()
  }
})
