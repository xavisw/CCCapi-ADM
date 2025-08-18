// Mobile Navigation Toggle
const hamburger = document.querySelector(".hamburger")
const navMenu = document.querySelector(".nav-menu")

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active")
  navMenu.classList.toggle("active")
})

// Close mobile menu when clicking on a link
document.querySelectorAll(".nav-menu a").forEach((link) => {
  link.addEventListener("click", () => {
    hamburger.classList.remove("active")
    navMenu.classList.remove("active")
  })
})

const partnerMenuBtn = document.getElementById("partnerMenuBtn")
const partnerDropdown = document.getElementById("partnerDropdown")
const loginBtn = document.getElementById("loginBtn")
const registerBtn = document.getElementById("registerBtn")
const dashboardBtn = document.getElementById("dashboardBtn")

// Modal elements
const loginModal = document.getElementById("loginModal")
const registerModal = document.getElementById("registerModal")
const closeLoginModal = document.getElementById("closeLoginModal")
const closeRegisterModal = document.getElementById("closeRegisterModal")
const switchToRegister = document.getElementById("switchToRegister")
const switchToLogin = document.getElementById("switchToLogin")

const dashboardSection = document.getElementById("dashboard")
const heroSection = document.getElementById("inicio")
const aboutSection = document.getElementById("sobre")
const servicesSection = document.getElementById("servicos")
const vehiclesSection = document.getElementById("veiculos")
const footerSection = document.querySelector(".footer")
const whatsappFloat = document.querySelector(".whatsapp-float")

// Toggle partner dropdown
partnerMenuBtn.addEventListener("click", (e) => {
  e.stopPropagation()
  partnerDropdown.classList.toggle("active")
})

// Close dropdown when clicking outside
document.addEventListener("click", () => {
  partnerDropdown.classList.remove("active")
})

// Prevent dropdown from closing when clicking inside
partnerDropdown.addEventListener("click", (e) => {
  e.stopPropagation()
})

// Modal functions
function openModal(modal) {
  modal.classList.add("active")
  document.body.style.overflow = "hidden"
}

function closeModal(modal) {
  modal.classList.remove("active")
  document.body.style.overflow = "auto"
}

// Login button
loginBtn.addEventListener("click", () => {
  partnerDropdown.classList.remove("active")
  openModal(loginModal)
})

// Register button
registerBtn.addEventListener("click", () => {
  partnerDropdown.classList.remove("active")
  openModal(registerModal)
})

// Dashboard button - Controle de acesso restrito apenas para usuários logados
dashboardBtn.addEventListener("click", () => {
  partnerDropdown.classList.remove("active")
  if (db.currentUser) {
    showDashboard()
  } else {
    showCustomNotification("Você precisa fazer login para acessar o dashboard!", "error")
    openModal(loginModal)
  }
})

function showDashboard() {
  // Esconder seções principais
  heroSection.style.display = "none"
  aboutSection.style.display = "none"
  servicesSection.style.display = "none"
  vehiclesSection.style.display = "none"
  footerSection.style.display = "none"
  whatsappFloat.style.display = "none"

  // Mostrar dashboard
  dashboardSection.style.display = "block"

  // Esconder header principal
  document.querySelector(".header").style.display = "none"

  updateDashboardStats()
}

function hideDashboard() {
  // Mostrar seções principais
  heroSection.style.display = "block"
  aboutSection.style.display = "block"
  servicesSection.style.display = "block"
  vehiclesSection.style.display = "block"
  footerSection.style.display = "block"
  whatsappFloat.style.display = "block"

  // Esconder dashboard
  dashboardSection.style.display = "none"

  // Mostrar header principal
  document.querySelector(".header").style.display = "block"
}

function updateDashboardStats() {
  const stats = db.getProposalStats(db.currentUser.id)
  const userProposals = db.getUserProposals(db.currentUser.id)

  // Atualizar contadores
  document.getElementById("totalProposals").textContent = stats.total
  document.getElementById("pendingProposals").textContent = stats.pending
  document.getElementById("approvedProposals").textContent = stats.approved

  // Calcular comissões (3% do valor aprovado)
  const totalCommissions = userProposals
    .filter((p) => p.status === "approved")
    .reduce((sum, p) => {
      const value = Number.parseFloat(p.financeValue?.replace(/[^\d,]/g, "").replace(",", ".")) || 0
      return sum + value * 0.03
    }, 0)

  document.getElementById("totalCommissions").textContent = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(totalCommissions)

  // Atualizar atividade recente
  updateRecentActivity(userProposals)

  // Atualizar tabela de propostas
  updateProposalsTable(userProposals)
}

function updateRecentActivity(proposals) {
  const activityList = document.getElementById("activityList")

  if (proposals.length === 0) {
    activityList.innerHTML =
      '<div class="no-activity"><p>Nenhuma atividade recente. Crie sua primeira proposta!</p></div>'
    return
  }

  const recentProposals = proposals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

  activityList.innerHTML = recentProposals
    .map((proposal) => {
      const statusClass =
        proposal.status === "approved" ? "approved" : proposal.status === "rejected" ? "rejected" : "pending"
      const statusIcon =
        proposal.status === "approved" ? "fa-check" : proposal.status === "rejected" ? "fa-times" : "fa-clock"
      const statusText =
        proposal.status === "approved"
          ? "foi aprovada"
          : proposal.status === "rejected"
            ? "foi rejeitada"
            : "está em análise"

      const timeAgo = getTimeAgo(new Date(proposal.createdAt))

      return `
      <div class="activity-item">
        <div class="activity-icon ${statusClass}">
          <i class="fas ${statusIcon}"></i>
        </div>
        <div class="activity-content">
          <p><strong>Proposta #${proposal.id.slice(-6)}</strong> ${statusText}</p>
          <span class="activity-time">${timeAgo}</span>
        </div>
      </div>
    `
    })
    .join("")
}

function updateProposalsTable(proposals) {
  const tableBody = document.getElementById("proposalsTableBody")

  if (proposals.length === 0) {
    tableBody.innerHTML =
      '<tr class="no-proposals"><td colspan="7">Nenhuma proposta encontrada. Crie sua primeira proposta!</td></tr>'
    return
  }

  tableBody.innerHTML = proposals
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((proposal) => {
      const statusClass =
        proposal.status === "approved" ? "approved" : proposal.status === "rejected" ? "rejected" : "pending"
      const statusText =
        proposal.status === "approved" ? "Aprovado" : proposal.status === "rejected" ? "Rejeitado" : "Em Análise"

      const date = new Date(proposal.createdAt).toLocaleDateString("pt-BR")

      return `
        <tr>
          <td>#${proposal.id.slice(-6)}</td>
          <td>${proposal.clientName}</td>
          <td>${proposal.vehicleBrand} ${proposal.vehicleModel}</td>
          <td>${proposal.financeValue}</td>
          <td><span class="status ${statusClass}">${statusText}</span></td>
          <td>${date}</td>
          <td>
            <button class="btn btn-sm btn-outline">Ver</button>
          </td>
        </tr>
      `
    })
    .join("")
}

function getTimeAgo(date) {
  const now = new Date()
  const diffInMinutes = Math.floor((now - date) / (1000 * 60))

  if (diffInMinutes < 1) return "Agora mesmo"
  if (diffInMinutes < 60) return `Há ${diffInMinutes} minuto${diffInMinutes > 1 ? "s" : ""}`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `Há ${diffInHours} hora${diffInHours > 1 ? "s" : ""}`

  const diffInDays = Math.floor(diffInHours / 24)
  return `Há ${diffInDays} dia${diffInDays > 1 ? "s" : ""}`
}

document.querySelectorAll(".menu-item").forEach((item) => {
  item.addEventListener("click", () => {
    // Remove active class from all items
    document.querySelectorAll(".menu-item").forEach((i) => i.classList.remove("active"))
    document.querySelectorAll(".dashboard-section").forEach((s) => s.classList.remove("active"))

    // Add active class to clicked item
    item.classList.add("active")

    // Show corresponding section
    const section = item.getAttribute("data-section")
    document.getElementById(section).classList.add("active")
  })
})

document.getElementById("logoutBtn").addEventListener("click", () => {
  db.logoutUser()
  updateDashboardAccess()
  hideDashboard()
})

document.getElementById("becomePartnerBtn").addEventListener("click", () => {
  openModal(registerModal)
})

// Close modal buttons
closeLoginModal.addEventListener("click", () => closeModal(loginModal))
closeRegisterModal.addEventListener("click", () => closeModal(registerModal))

// Switch between modals
switchToRegister.addEventListener("click", (e) => {
  e.preventDefault()
  closeModal(loginModal)
  openModal(registerModal)
})

switchToLogin.addEventListener("click", (e) => {
  e.preventDefault()
  closeModal(registerModal)
  openModal(loginModal)
})

// Close modal when clicking outside
loginModal.addEventListener("click", (e) => {
  if (e.target === loginModal) closeModal(loginModal)
})

registerModal.addEventListener("click", (e) => {
  if (e.target === registerModal) closeModal(registerModal)
})

// Sistema customizado sem notificação do Chrome
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault()
  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  const user = db.loginUser(email, password)

  if (user) {
    showCustomNotification(`Login realizado com sucesso! Bem-vindo, ${user.name}!`, "success")
    closeModal(loginModal)
    updateDashboardAccess()
    showDashboard()
  } else {
    showCustomNotification("Email ou senha incorretos!", "error")
  }
})

document.getElementById("registerForm").addEventListener("submit", (e) => {
  e.preventDefault()
  const name = document.getElementById("registerName").value
  const email = document.getElementById("registerEmail").value
  const document_field = document.getElementById("registerDocument").value
  const phone = document.getElementById("registerPhone").value
  const password = document.getElementById("registerPassword").value

  // Verificar se email já existe
  if (db.users.find((u) => u.email === email)) {
    showCustomNotification("Este email já está cadastrado!", "error")
    return
  }

  const user = db.createUser({
    name,
    email,
    document: document_field,
    phone,
    password,
  })

  showCustomNotification(`Conta criada com sucesso! Bem-vindo, ${user.name}!`, "success")
  closeModal(registerModal)

  // Fazer login automático
  db.currentUser = user
  db.saveToStorage("ccapi_current_user", user)
  updateDashboardAccess()
  showDashboard()
})

function showCustomNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `custom-notification ${type}`
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${type === "success" ? "fa-check-circle" : type === "error" ? "fa-exclamation-circle" : "fa-info-circle"}"></i>
      <span>${message}</span>
    </div>
  `

  // Adicionar estilos se não existirem
  if (!document.querySelector("#notification-styles")) {
    const styles = document.createElement("style")
    styles.id = "notification-styles"
    styles.textContent = `
      .custom-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
      }
      .custom-notification.success {
        border-left: 4px solid #10b981;
      }
      .custom-notification.error {
        border-left: 4px solid #ef4444;
      }
      .custom-notification.info {
        border-left: 4px solid #3b82f6;
      }
      .notification-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .notification-content i {
        font-size: 1.2rem;
      }
      .custom-notification.success i {
        color: #10b981;
      }
      .custom-notification.error i {
        color: #ef4444;
      }
      .custom-notification.info i {
        color: #3b82f6;
      }
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `
    document.head.appendChild(styles)
  }

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.animation = "slideInRight 0.3s ease reverse"
    setTimeout(() => {
      document.body.removeChild(notification)
    }, 300)
  }, 3000)
}

document.getElementById("proposalForm").addEventListener("submit", (e) => {
  e.preventDefault()

  if (!db.currentUser) {
    showCustomNotification("Você precisa estar logado para enviar propostas!", "error")
    return
  }

  const proposalData = {}
  ;[
    "clientName",
    "clientDocument",
    "clientPhone",
    "clientEmail",
    "clientProfession", // Novo campo
    "clientIncome",
    "clientCep", // Novo campo
    "clientAddress",
    "vehicleType",
    "vehicleBrand",
    "vehicleModel",
    "vehicleYear",
    "vehiclePlate", // Campo de placa
    "vehicleValue",
    "vehicleCondition",
    "financeValue",
    "downPayment",
    "financeType", // Agora é "Tipo de Produto"
    "specialist", // Campo de especialista
  ].forEach((field) => {
    proposalData[field] = document.getElementById(field).value
  })

  const proposal = db.createProposal(proposalData)

  showCustomNotification(
    `Proposta enviada com sucesso! Código: #${proposal.id.slice(-6)} - Cliente: ${proposalData.clientName}`,
    "success",
  )

  // Reset form
  e.target.reset()

  // Atualizar estatísticas
  updateDashboardStats()

  // Switch to proposals view
  document.querySelectorAll(".menu-item").forEach((i) => i.classList.remove("active"))
  document.querySelectorAll(".dashboard-section").forEach((s) => s.classList.remove("active"))

  document.querySelector('[data-section="proposals"]').classList.add("active")
  document.getElementById("proposals").classList.add("active")
})

// Input masks for document and phone
document.getElementById("registerDocument").addEventListener("input", (e) => {
  let value = e.target.value.replace(/\D/g, "")

  if (value.length <= 11) {
    // CPF format
    value = value.replace(/(\d{3})(\d)/, "$1.$2")
    value = value.replace(/(\d{3})(\d)/, "$1.$2")
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2")
  } else {
    // CNPJ format
    value = value.replace(/^(\d{2})(\d)/, "$1.$2")
    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    value = value.replace(/\.(\d{3})(\d)/, ".$1/$2")
    value = value.replace(/(\d{4})(\d)/, "$1-$2")
  }

  e.target.value = value
})

document.getElementById("registerPhone").addEventListener("input", (e) => {
  let value = e.target.value.replace(/\D/g, "")
  value = value.replace(/(\d{2})(\d)/, "($1) $2")
  value = value.replace(/(\d{5})(\d)/, "$1-$2")
  e.target.value = value
})

document.addEventListener("DOMContentLoaded", () => {
  const plateField = document.getElementById("vehiclePlate")
  if (plateField) {
    plateField.addEventListener("input", (e) => {
      let value = e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
      if (value.length <= 7) {
        value = value.replace(/^([A-Z]{3})(\d)/, "$1-$2")
      }
      e.target.value = value
    })
  }

  // Máscara para CEP
  const cepField = document.getElementById("clientCep")
  if (cepField) {
    cepField.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "")
      value = value.replace(/(\d{5})(\d)/, "$1-$2")
      e.target.value = value
    })
  }
})

function formatCurrency(input) {
  let value = input.value.replace(/\D/g, "")
  value = (value / 100).toFixed(2)
  value = value.replace(".", ",")
  value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.")
  input.value = "R$ " + value
}

// Aplicar máscara nos campos de valor
document.addEventListener("DOMContentLoaded", () => {
  const currencyFields = ["clientIncome", "vehicleValue", "financeValue", "downPayment"]

  currencyFields.forEach((fieldId) => {
    const field = document.getElementById(fieldId)
    if (field) {
      field.addEventListener("input", () => formatCurrency(field))
    }
  })

  updateDashboardAccess()
})

document.addEventListener("DOMContentLoaded", () => {
  const whatsappServiceButtons = document.querySelectorAll(".whatsapp-service")

  whatsappServiceButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault()
      const serviceName = button.getAttribute("data-service")
      const message = `Olá! Gostaria de solicitar uma consulta sobre o serviço: ${serviceName}. Poderia me fornecer mais informações?`
      const whatsappUrl = `https://wa.me/5585999999999?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, "_blank")
    })
  })
})

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault()
    const target = document.querySelector(this.getAttribute("href"))
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }
  })
})

// Header background on scroll
window.addEventListener("scroll", () => {
  const header = document.querySelector(".header")
  if (window.scrollY > 100) {
    header.style.background = "rgba(255, 255, 255, 0.98)"
    header.style.boxShadow = "0 2px 20px rgba(0, 0, 0, 0.1)"
  } else {
    header.style.background = "rgba(255, 255, 255, 0.95)"
    header.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
  }
})

// Intersection Observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("loaded")
    }
  })
}, observerOptions)

// Observe elements for animation
document.addEventListener("DOMContentLoaded", () => {
  const animatedElements = document.querySelectorAll(".stat-card, .feature-card, .service-card, .vehicle-card")
  animatedElements.forEach((el) => {
    el.classList.add("loading")
    observer.observe(el)
  })
})

// Counter animation for stats
function animateCounter(element, target, duration = 2000) {
  let start = 0
  const increment = target / (duration / 16)

  const timer = setInterval(() => {
    start += increment
    if (start >= target) {
      element.textContent = target + (element.textContent.includes("%") ? "%" : "+")
      clearInterval(timer)
    } else {
      element.textContent = Math.floor(start) + (element.textContent.includes("%") ? "%" : "+")
    }
  }, 16)
}

// Animate counters when they come into view
const statsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const statNumber = entry.target.querySelector("h3")
        const text = statNumber.textContent
        const number = Number.parseInt(text.replace(/\D/g, ""))

        if (text.includes("%")) {
          statNumber.textContent = "0%"
          animateCounter(statNumber, number)
        } else if (text.includes("+")) {
          statNumber.textContent = "0+"
          animateCounter(statNumber, number)
        } else if (text.includes("h")) {
          statNumber.textContent = "0h"
          animateCounter(statNumber, number)
        }

        statsObserver.unobserve(entry.target)
      }
    })
  },
  { threshold: 0.5 },
)

document.querySelectorAll(".stat-card").forEach((card) => {
  statsObserver.observe(card)
})

// Service card hover effects
document.querySelectorAll(".service-card").forEach((card) => {
  card.addEventListener("mouseenter", () => {
    card.style.transform = "translateY(-10px) scale(1.02)"
  })

  card.addEventListener("mouseleave", () => {
    if (card.classList.contains("featured")) {
      card.style.transform = "scale(1.05)"
    } else {
      card.style.transform = "translateY(0) scale(1)"
    }
  })
})

// Vehicle card interactions
document.querySelectorAll(".vehicle-card").forEach((card) => {
  card.addEventListener("click", () => {
    const vehicleTitle = card.querySelector("h3").textContent
    const message = `Olá! Tenho interesse no financiamento do veículo: ${vehicleTitle}`
    const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  })
})

// Add loading states for buttons
document.querySelectorAll(".btn").forEach((button) => {
  button.addEventListener("click", function () {
    if (!this.classList.contains("loading-btn")) {
      this.classList.add("loading-btn")
      const originalText = this.innerHTML
      this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...'

      setTimeout(() => {
        this.classList.remove("loading-btn")
        this.innerHTML = originalText
      }, 1500)
    }
  })
})

// Initialize everything when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Add fade-in animation to main sections
  const sections = document.querySelectorAll("section")
  sections.forEach((section, index) => {
    section.style.opacity = "0"
    section.style.transform = "translateY(30px)"
    section.style.transition = "all 0.6s ease"

    setTimeout(() => {
      section.style.opacity = "1"
      section.style.transform = "translateY(0)"
    }, index * 200)
  })

  console.log("Ccapi Financiamentos - Site carregado com sucesso!")
})

// Error handling for images
document.querySelectorAll("img").forEach((img) => {
  img.addEventListener("error", function () {
    this.src = "/truck-transport-vehicle.png"
  })
})

// Performance optimization - debounce scroll events
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Apply debounce to scroll events
const debouncedScrollHandler = debounce(() => {
  // Scroll handling code here
}, 10)

window.addEventListener("scroll", debouncedScrollHandler)

class LocalDatabase {
  constructor() {
    this.users = this.getFromStorage("ccapi_users") || []
    this.proposals = this.getFromStorage("ccapi_proposals") || []
    this.currentUser = this.getFromStorage("ccapi_current_user") || null
  }

  getFromStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key))
    } catch {
      return null
    }
  }

  saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data))
  }

  // Gerenciamento de usuários
  createUser(userData) {
    const user = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString(),
    }
    this.users.push(user)
    this.saveToStorage("ccapi_users", this.users)
    return user
  }

  loginUser(email, password) {
    const user = this.users.find((u) => u.email === email && u.password === password)
    if (user) {
      this.currentUser = user
      this.saveToStorage("ccapi_current_user", user)
      return user
    }
    return null
  }

  logoutUser() {
    this.currentUser = null
    localStorage.removeItem("ccapi_current_user")
  }

  // Gerenciamento de propostas
  createProposal(proposalData) {
    const proposal = {
      id: Date.now().toString(),
      userId: this.currentUser?.id,
      status: "pending",
      createdAt: new Date().toISOString(),
      ...proposalData,
    }
    this.proposals.push(proposal)
    this.saveToStorage("ccapi_proposals", this.proposals)
    return proposal
  }

  getUserProposals(userId) {
    return this.proposals.filter((p) => p.userId === userId)
  }

  getProposalStats(userId) {
    const userProposals = this.getUserProposals(userId)
    return {
      total: userProposals.length,
      pending: userProposals.filter((p) => p.status === "pending").length,
      approved: userProposals.filter((p) => p.status === "approved").length,
      rejected: userProposals.filter((p) => p.status === "rejected").length,
    }
  }
}

// Inicializar banco de dados local
const db = new LocalDatabase()

function updateDashboardAccess() {
  const isLoggedIn = db.currentUser !== null
  dashboardBtn.style.display = isLoggedIn ? "flex" : "none"

  if (isLoggedIn) {
    document.getElementById("welcomeUser").textContent = `Bem-vindo, ${db.currentUser.name}`
  }
}
