// Sistema de gerenciamento de dados
class APIDatabase {
  constructor() {
    this.baseURL = "api/main-site-api.php"
  }

  async makeRequest(action, data = null, method = "GET") {
    try {
      const url =
        method === "GET" && data
          ? `${this.baseURL}?action=${action}&${new URLSearchParams(data)}`
          : `${this.baseURL}?action=${action}`

      const options = {
        method,
        headers: { "Content-Type": "application/json" },
      }

      if (data && method !== "GET") {
        options.body = JSON.stringify(data)
      }

      const response = await fetch(url, options)
      return await response.json()
    } catch (error) {
      console.log("[v0] API Error:", error)
      throw error
    }
  }

  async register(userData) {
    return await this.makeRequest("register", userData, "POST")
  }

  async login(email, senha) {
    return await this.makeRequest("login", { email, senha }, "POST")
  }

  async novaProposta(proposalData) {
    return await this.makeRequest("nova_proposta", proposalData, "POST")
  }

  async minhasPropostas(usuario_id) {
    return await this.makeRequest("minhas_propostas", { usuario_id })
  }

  async dashboardStats(usuario_id) {
    return await this.makeRequest("dashboard_stats", { usuario_id })
  }

  async atualizarPerfil(userData) {
    return await this.makeRequest("atualizar_perfil", userData, "PUT")
  }

  async notificacoes(usuario_id) {
    return await this.makeRequest("notificacoes", { usuario_id })
  }
}

// Inicializar sistema
const apiDB = new APIDatabase()
let currentUser = null

// Sistema de notificações customizado
function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `notification ${type}`
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6"};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-weight: 500;
    max-width: 300px;
    animation: slideIn 0.3s ease-out;
  `
  notification.textContent = message

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-in"
    setTimeout(() => notification.remove(), 300)
  }, 3000)
}

// Event Listeners para botões
document.addEventListener("DOMContentLoaded", () => {
  // Botão menu mobile
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn")
  const navLinks = document.querySelector(".nav-links")
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("active")
    })
  }

  // Três pontinhos menu
  const menuToggle = document.querySelector(".menu-toggle")
  const dropdownMenu = document.querySelector(".dropdown-menu")
  if (menuToggle && dropdownMenu) {
    menuToggle.addEventListener("click", (e) => {
      e.stopPropagation()
      dropdownMenu.classList.toggle("active")
    })

    document.addEventListener("click", () => {
      dropdownMenu.classList.remove("active")
    })
  }

  // Botões de modal
  const loginBtn = document.querySelector("#loginBtn")
  const registerBtn = document.querySelector("#registerBtn")
  const partnerBtn = document.querySelector("#partnerBtn")
  const dashboardBtn = document.querySelector("#dashboardBtn")

  if (loginBtn) {
    loginBtn.addEventListener("click", () => openModal("loginModal"))
  }
  if (registerBtn) {
    registerBtn.addEventListener("click", () => openModal("registerModal"))
  }
  if (partnerBtn) {
    partnerBtn.addEventListener("click", () => openModal("registerModal"))
  }
  if (dashboardBtn) {
    dashboardBtn.addEventListener("click", () => {
      if (currentUser) {
        showDashboard()
      } else {
        showNotification("Faça login para acessar o dashboard", "error")
        openModal("loginModal")
      }
    })
  }

  // Botões solicitar consulta
  const consultaButtons = document.querySelectorAll(".btn-consulta")
  consultaButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const service = btn.closest(".service-card")?.querySelector("h3")?.textContent || "Consulta"
      const whatsappUrl = `https://wa.me/5585999999999?text=Olá! Gostaria de solicitar uma consulta sobre: ${service}`
      window.open(whatsappUrl, "_blank")
    })
  })

  // Formulários
  const loginForm = document.querySelector("#loginForm")
  const registerForm = document.querySelector("#registerForm")
  const proposalForm = document.querySelector("#proposalForm")

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
  }
  if (registerForm) {
    registerForm.addEventListener("submit", handleRegister)
  }
  if (proposalForm) {
    proposalForm.addEventListener("submit", handleProposal)
  }

  // Fechar modais
  document.querySelectorAll(".close-modal").forEach((btn) => {
    btn.addEventListener("click", closeModal)
  })

  // Navegação dashboard
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      const section = e.target.dataset.section
      if (section) showDashboardSection(section)
    })
  })

  // Verificar usuário logado
  checkLoggedUser()
})

// Funções de modal
function openModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.style.display = "flex"
    document.body.style.overflow = "hidden"
  }
}

function closeModal() {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.style.display = "none"
  })
  document.body.style.overflow = "auto"
}

// Funções de autenticação
async function handleLogin(e) {
  e.preventDefault()
  const formData = new FormData(e.target)
  const email = formData.get("email")
  const senha = formData.get("senha")

  try {
    const result = await apiDB.login(email, senha)

    if (result.success) {
      currentUser = result.user
      showNotification("Login realizado com sucesso!", "success")
      closeModal()
      updateUIForLoggedUser()
    } else {
      showNotification(result.error || "Email ou senha incorretos", "error")
    }
  } catch (error) {
    showNotification("Erro ao fazer login. Tente novamente.", "error")
  }
}

async function handleRegister(e) {
  e.preventDefault()
  const formData = new FormData(e.target)
  const userData = {
    nome: formData.get("nome"),
    email: formData.get("email"),
    cpf_cnpj: formData.get("cpf_cnpj"),
    telefone: formData.get("telefone"),
    senha: formData.get("senha"),
  }

  try {
    const result = await apiDB.register(userData)

    if (result.success) {
      showNotification("Cadastro realizado com sucesso!", "success")
      closeModal()
      // Auto login após cadastro
      const loginResult = await apiDB.login(userData.email, userData.senha)
      if (loginResult.success) {
        currentUser = loginResult.user
        updateUIForLoggedUser()
      }
    } else {
      showNotification(result.error || "Erro ao cadastrar", "error")
    }
  } catch (error) {
    showNotification("Erro ao cadastrar. Tente novamente.", "error")
  }
}

async function handleProposal(e) {
  e.preventDefault()
  const formData = new FormData(e.target)
  const proposalData = {
    usuario_id: currentUser?.id,
    nome_cliente: formData.get("nome_cliente"),
    cpf_cliente: formData.get("cpf_cliente"),
    telefone_cliente: formData.get("telefone_cliente"),
    profissao_cliente: formData.get("profissao_cliente"),
    cep_cliente: formData.get("cep_cliente"),
    tipo_veiculo: formData.get("tipo_veiculo"),
    marca_veiculo: formData.get("marca_veiculo"),
    modelo_veiculo: formData.get("modelo_veiculo"),
    ano_veiculo: formData.get("ano_veiculo"),
    placa_veiculo: formData.get("placa_veiculo"),
    valor_veiculo: formData.get("valor_veiculo"),
    tipo_produto: formData.get("tipo_produto"),
    especialista: formData.get("especialista"),
  }

  try {
    const result = await apiDB.novaProposta(proposalData)

    if (result.success) {
      showNotification("Proposta enviada com sucesso!", "success")
      e.target.reset()
      loadDashboardData()
    } else {
      showNotification(result.error || "Erro ao enviar proposta", "error")
    }
  } catch (error) {
    showNotification("Erro ao enviar proposta. Tente novamente.", "error")
  }
}

// Funções do dashboard
function showDashboard() {
  document.querySelector(".main-content").style.display = "none"
  document.querySelector(".dashboard").style.display = "block"
  loadDashboardData()
}

function showDashboardSection(section) {
  document.querySelectorAll(".dashboard-section").forEach((s) => (s.style.display = "none"))
  document.querySelector(`#${section}`).style.display = "block"

  document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"))
  document.querySelector(`[data-section="${section}"]`).classList.add("active")
}

async function loadDashboardData() {
  if (currentUser) {
    document.querySelector("#user-name").textContent = currentUser.nome
    document.querySelector("#user-email").textContent = currentUser.email

    try {
      const stats = await apiDB.dashboardStats(currentUser.id)
      document.querySelector("#total-proposals").textContent = stats.total_propostas || 0
      document.querySelector("#pending-proposals").textContent = stats.pendentes || 0
      document.querySelector("#approved-proposals").textContent = stats.aprovadas || 0
      document.querySelector("#rejected-proposals").textContent = stats.recusadas || 0
    } catch (error) {
      console.log("[v0] Erro ao carregar estatísticas:", error)
    }
  }
}

function updateUIForLoggedUser() {
  const menuToggle = document.querySelector(".menu-toggle")
  if (menuToggle) {
    menuToggle.style.display = "block"
  }
}

function checkLoggedUser() {
  const savedUser = localStorage.getItem("ccapi_current_user")
  if (savedUser) {
    currentUser = JSON.parse(savedUser)
    updateUIForLoggedUser()
  }
}

// Máscaras para campos
function applyMasks() {
  // CPF/CNPJ mask
  document.querySelectorAll('input[name="cpf_cnpj"], input[name="cliente_cpf"]').forEach((input) => {
    input.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "")
      if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
      } else {
        value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
      }
      e.target.value = value
    })
  })

  // Telefone mask
  document.querySelectorAll('input[name="telefone"], input[name="cliente_telefone"]').forEach((input) => {
    input.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "")
      value = value.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
      e.target.value = value
    })
  })

  // CEP mask
  document.querySelectorAll('input[name="cliente_cep"]').forEach((input) => {
    input.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, "")
      value = value.replace(/(\d{5})(\d{3})/, "$1-$2")
      e.target.value = value
    })
  })
}

// Aplicar máscaras quando o DOM carregar
document.addEventListener("DOMContentLoaded", applyMasks)
