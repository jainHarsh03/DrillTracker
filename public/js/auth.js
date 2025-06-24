const API_BASE = "/api"

function showLogin() {
  document.getElementById("loginForm").classList.remove("hidden")
  document.getElementById("registerForm").classList.add("hidden")
  document.querySelectorAll(".tab-btn")[0].classList.add("active")
  document.querySelectorAll(".tab-btn")[1].classList.remove("active")
}

function showRegister() {
  document.getElementById("loginForm").classList.add("hidden")
  document.getElementById("registerForm").classList.remove("hidden")
  document.querySelectorAll(".tab-btn")[0].classList.remove("active")
  document.querySelectorAll(".tab-btn")[1].classList.add("active")
}

function showMessage(message, type) {
  const messageDiv = document.getElementById("message")
  messageDiv.textContent = message
  messageDiv.className = `message ${type}`
  messageDiv.style.display = "block"

  setTimeout(() => {
    messageDiv.style.display = "none"
  }, 5000)
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (response.ok) {
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      showMessage("Login successful! Redirecting...", "success")
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1000)
    } else {
      showMessage(data.message, "error")
    }
  } catch (error) {
    showMessage("Network error. Please try again.", "error")
  }
})

document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault()

  const name = document.getElementById("registerName").value
  const email = document.getElementById("registerEmail").value
  const organization = document.getElementById("registerOrganization").value
  const password = document.getElementById("registerPassword").value

  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, organization, password }),
    })

    const data = await response.json()

    if (response.ok) {
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      showMessage("Registration successful! Redirecting...", "success")
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1000)
    } else {
      showMessage(data.message, "error")
    }
  } catch (error) {
    showMessage("Network error. Please try again.", "error")
  }
})

// Check if user is already logged in
if (localStorage.getItem("token")) {
  window.location.href = "/dashboard"
}
