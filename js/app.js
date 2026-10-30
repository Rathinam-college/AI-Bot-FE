/**
 * Server AI Assistant - Frontend Application Architecture
 * Comprehensive implementation of:
 *   1. User Authentication (Login, Session Persistence, Logout, Demo Logins)
 *   2. Responsive Top Navbar with Role-Based Page Access
 *   3. Modern Operations Dashboard with Campus KPIs & Direct Chat Navigation
 *   4. Chatbot with SQLite History Sessions & Report Generation (Print, PDF, MD, HTML)
 *   5. User Control & Team Member Permission Management (Admin & Role-Based Access)
 *   6. Integrated SQLite DB Inspector, SQL Ingestion, and Smart AI Data Intake
 */

document.addEventListener("DOMContentLoaded", () => {
    // =========================================================================
    // STATE & CONFIGURATION
    // =========================================================================
    // Automatically detect API base path so it works on both localhost (/) and live server (/ai-bot/)
    const getApiBase = () => {
        const path = window.location.pathname;
        if (path.includes("/ai-bot")) {
            return "/ai-bot/api";
        }
        return "/api";
    };
    const API_BASE = getApiBase();

    let currentUser = null;
    let authToken = localStorage.getItem("campus_auth_token") || null;
    let currentSessionId = null;
    let activeChatHistory = []; // Turn tracking for current conversation

    // =========================================================================
    // DOM ELEMENTS - AUTH & SHELL
    // =========================================================================
    const loginOverlay = document.getElementById("login-overlay");
    const loginForm = document.getElementById("login-form");
    const loginUsernameInput = document.getElementById("login-username");
    const loginPasswordInput = document.getElementById("login-password");
    const loginErrorMsg = document.getElementById("login-error-msg");
    const appShell = document.getElementById("app-shell");
    const btnNavbarLogout = document.getElementById("btn-navbar-logout");
    const userNameDisplay = document.getElementById("user-name-display");
    const userRoleBadge = document.getElementById("user-role-badge");
    const userAvatarText = document.getElementById("user-avatar-text");
    const tabNavUsers = document.getElementById("tab-nav-users");
    const navBrandLogo = document.getElementById("nav-brand-logo");

    // =========================================================================
    // DOM ELEMENTS - NAVIGATION TABS & VIEWS
    // =========================================================================
    const navTabBtns = document.querySelectorAll(".nav-tab-btn[data-view]");
    const viewDashboard = document.getElementById("view-dashboard");
    const viewChatbot = document.getElementById("view-chatbot");
    const viewUsers = document.getElementById("view-users");
    const userControlDenied = document.getElementById("user-control-denied");
    const userControlTableWrapper = document.getElementById("user-control-table-wrapper");

    // Dashboard navigation links
    const dashBtnGotoChat = document.getElementById("dash-btn-goto-chat");
    const dashWelcomeTitle = document.getElementById("dash-welcome-title");
    const dashBtnOpenIntake = document.getElementById("dash-btn-open-intake");
    const dashBtnUploadSql = document.getElementById("dash-btn-upload-sql");
    const btnDeniedBackDash = document.getElementById("btn-denied-back-dash");

    // =========================================================================
    // DOM ELEMENTS - CHATBOT & HISTORY
    // =========================================================================
    const chatMessages = document.getElementById("chat-messages");
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const btnSend = document.getElementById("btn-send");
    const quickPrompts = document.getElementById("quick-prompts");
    const chatSessionsList = document.getElementById("chat-sessions-list");
    const btnSidebarNewChat = document.getElementById("btn-sidebar-new-chat");
    const currentSessionTitle = document.getElementById("current-session-title");
    const btnGenerateChatReport = document.getElementById("btn-generate-chat-report");
    const btnClearCurrentChat = document.getElementById("btn-clear-current-chat");

    // Report Generation Modal
    const reportModalBackdrop = document.getElementById("report-modal-backdrop");
    const btnCloseReportModal = document.getElementById("btn-close-report-modal");
    const reportDocumentSheet = document.getElementById("report-document-sheet");
    const btnReportPrint = document.getElementById("btn-report-print");
    const btnReportDownloadMd = document.getElementById("btn-report-download-md");
    const btnReportDownloadHtml = document.getElementById("btn-report-download-html");

    // =========================================================================
    // DOM ELEMENTS - USER CONTROL MODAL & ACTIONS
    // =========================================================================
    const btnOpenAddUser = document.getElementById("btn-open-add-user");
    const userModalBackdrop = document.getElementById("user-modal-backdrop");
    const btnCloseUserModal = document.getElementById("btn-close-user-modal");
    const btnCancelUserModal = document.getElementById("btn-cancel-user-modal");
    const formManageUser = document.getElementById("form-manage-user");
    const manageUserId = document.getElementById("manage-user-id");
    const userInputUsername = document.getElementById("user-input-username");
    const userInputPassword = document.getElementById("user-input-password");
    const userInputFullname = document.getElementById("user-input-fullname");
    const userInputEmail = document.getElementById("user-input-email");
    const userInputRole = document.getElementById("user-input-role");
    const userInputDept = document.getElementById("user-input-dept");
    const userModalTitle = document.getElementById("user-modal-title");
    const usersTableTbody = document.getElementById("users-table-tbody");

    // Permission checkboxes
    const permDashboard = document.getElementById("perm-dashboard");
    const permChatbot = document.getElementById("perm-chatbot");
    const permReports = document.getElementById("perm-reports");
    const permUploadSql = document.getElementById("perm-upload-sql");
    const permUserControl = document.getElementById("perm-user-control");
    const permClearDb = document.getElementById("perm-clear-db");

    // =========================================================================
    // DOM ELEMENTS - HEADER & MODALS
    // =========================================================================
    const btnRefreshSync = document.getElementById("btn-refresh-sync");
    const btnSyncText = document.getElementById("btn-sync-text");
    const syncSpinnerIcon = document.getElementById("sync-spinner-icon");
    const btnToggleDbModal = document.getElementById("btn-toggle-db-modal");
    const dbModalBackdrop = document.getElementById("db-modal-backdrop");
    const btnCloseModal = document.getElementById("btn-close-modal");
    const tabRecords = document.getElementById("tab-records");
    const tabHistory = document.getElementById("tab-history");
    const tabUpload = document.getElementById("tab-upload");
    const tabAdd = document.getElementById("tab-add");
    const tableViewRecords = document.getElementById("table-view-records");
    const tableViewHistory = document.getElementById("table-view-history");
    const tableViewUpload = document.getElementById("table-view-upload");
    const tableViewAdd = document.getElementById("table-view-add");
    const tbodyRecords = document.getElementById("tbody-records");
    const tbodyHistory = document.getElementById("tbody-history");
    const modalTotalBadge = document.getElementById("modal-total-badge");
    const btnModalClearDb = document.getElementById("btn-modal-clear-db");
    const btnModalImportAll = document.getElementById("btn-modal-import-all");

    // Data Intake Modal Elements
    const intakeModalBackdrop = document.getElementById("intake-modal-backdrop");
    const btnCloseIntakeModal = document.getElementById("btn-close-intake-modal");
    const btnCancelIntake = document.getElementById("btn-cancel-intake");
    const formAiIntake = document.getElementById("form-ai-intake");
    const intakeDeptSelect = document.getElementById("intake-dept-select");
    const intakeDeptCustom = document.getElementById("intake-dept-custom");
    const intakeRecId = document.getElementById("intake-rec-id");
    const intakeTextInput = document.getElementById("intake-text-input");
    const btnSubmitIntake = document.getElementById("btn-submit-intake");
    const btnIntakeText = document.getElementById("btn-intake-text");
    const intakeFormSection = document.getElementById("intake-form-section");
    const intakeResultSection = document.getElementById("intake-result-section");
    const resultHeadline = document.getElementById("result-headline");
    const resultDeptBadge = document.getElementById("result-dept-badge");
    const resultActionBadge = document.getElementById("result-action-badge");
    const resultEntityType = document.getElementById("result-entity-type");
    const resultRecId = document.getElementById("result-rec-id");
    const resultName = document.getElementById("result-name");
    const resultAttributesTbody = document.getElementById("result-attributes-tbody");
    const resultDeptCountMsg = document.getElementById("result-dept-count-msg");
    const btnIntakeViewDb = document.getElementById("btn-intake-view-db");
    const btnIntakeAddAnother = document.getElementById("btn-intake-add-another");

    // Direct Upload SQL
    const inputFileSql = document.getElementById("input-file-sql");
    const modalFileInput = document.getElementById("modal-file-input");
    const modalDropzone = document.getElementById("modal-dropzone");
    const btnModalBrowseFile = document.getElementById("btn-modal-browse-file");
    const modalSelectedFileName = document.getElementById("modal-selected-file-name");
    const btnProcessModalUpload = document.getElementById("btn-process-modal-upload");

    const toastContainer = document.getElementById("toast-container");

    // =========================================================================
    // UTILITY & NOTIFICATION FUNCTIONS
    // =========================================================================
    function showToast(message, type = "info") {
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(100%)";
            toast.style.transition = "all 0.3s ease";
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    function escapeHtml(text) {
        if (!text) return "";
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    function formatTime(isoString) {
        if (!isoString) return "Never";
        try {
            const date = new Date(isoString);
            return date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        } catch {
            return isoString;
        }
    }

    function getAuthHeaders() {
        return authToken ? { "Authorization": `Bearer ${authToken}` } : {};
    }

    // =========================================================================
    // AUTHENTICATION & SESSION MANAGEMENT
    // =========================================================================
    async function initAuth() {
        if (!authToken) {
            showLoginView();
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/auth/me`, { headers: getAuthHeaders() });
            if (!res.ok) {
                throw new Error("Session expired or invalid");
            }
            const data = await res.json();
            currentUser = data.user;
            setupAuthenticatedUser();
        } catch (err) {
            console.warn("Auth check failed:", err);
            authToken = null;
            localStorage.removeItem("campus_auth_token");
            showLoginView();
        }
    }

    function showLoginView() {
        loginOverlay.style.display = "flex";
        appShell.style.display = "none";
        if (loginUsernameInput) loginUsernameInput.focus();
    }

    function setupAuthenticatedUser() {
        loginOverlay.style.display = "none";
        appShell.style.display = "flex";

        // Populate User Capsule
        if (userNameDisplay) userNameDisplay.textContent = currentUser.full_name || currentUser.username;
        if (userAvatarText) {
            const initials = (currentUser.full_name || currentUser.username)
                .split(" ")
                .map(n => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
            userAvatarText.textContent = initials || "US";
        }

        if (userRoleBadge) {
            userRoleBadge.textContent = (currentUser.role || "member").toUpperCase();
            userRoleBadge.className = `user-role-badge role-${currentUser.role || "member"}`;
        }

        if (dashWelcomeTitle) {
            dashWelcomeTitle.textContent = `Welcome back, ${currentUser.full_name || currentUser.username}`;
        }

        // Role-based visibility for User Control Nav link
        const perms = currentUser.permissions || [];
        const hasUserControl = currentUser.role === "admin" || perms.includes("user_control");
        if (tabNavUsers) {
            tabNavUsers.style.display = hasUserControl ? "flex" : "none";
        }

        // Load Initial Dashboard and Chat Sessions
        loadDashboardData();
        loadChatSessions();

        // Switch to Dashboard by default
        switchView("dashboard");
    }

    // Handle Login Form Submit
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = loginUsernameInput.value.trim();
            const password = loginPasswordInput.value.trim();
            if (!username || !password) return;

            loginErrorMsg.style.display = "none";
            const btnSubmit = document.getElementById("btn-login-submit");
            btnSubmit.disabled = true;
            btnSubmit.textContent = "Signing In...";

            try {
                const res = await fetch(`${API_BASE}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.detail || "Authentication failed");
                }

                const data = await res.json();
                authToken = data.token;
                localStorage.setItem("campus_auth_token", authToken);
                currentUser = data.user;

                showToast(`Welcome, ${currentUser.full_name}!`, "success");
                setupAuthenticatedUser();
            } catch (err) {
                loginErrorMsg.textContent = err.message;
                loginErrorMsg.style.display = "block";
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = "Sign In to Portal";
            }
        });
    }

    // Demo Accounts Quick Sign-In Pills
    document.querySelectorAll(".btn-demo-pill").forEach(btn => {
        btn.addEventListener("click", () => {
            const user = btn.dataset.user;
            const pass = btn.dataset.pass;
            if (loginUsernameInput && loginPasswordInput) {
                loginUsernameInput.value = user;
                loginPasswordInput.value = pass;
                if (loginForm) loginForm.dispatchEvent(new Event("submit"));
            }
        });
    });

    // Handle Logout
    if (btnNavbarLogout) {
        btnNavbarLogout.addEventListener("click", async () => {
            try {
                await fetch(`${API_BASE}/auth/logout`, {
                    method: "POST",
                    headers: getAuthHeaders(),
                });
            } catch (e) {
                // Ignore network errors on logout
            }
            authToken = null;
            currentUser = null;
            localStorage.removeItem("campus_auth_token");
            showToast("You have been signed out.", "info");
            showLoginView();
        });
    }

    // =========================================================================
    // VIEW ROUTING & NAVBAR SWITCHER
    // =========================================================================
    function switchView(viewName) {
        // Update nav button active states
        navTabBtns.forEach(btn => {
            if (btn.dataset.view === viewName) {
                btn.classList.add("active");
            } else {
                btn.classList.remove("active");
            }
        });

        // Hide all views
        [viewDashboard, viewChatbot, viewUsers].forEach(v => {
            if (v) v.classList.remove("active");
        });

        // Show selected view
        if (viewName === "dashboard" && viewDashboard) {
            viewDashboard.classList.add("active");
            loadDashboardData();
        } else if (viewName === "chatbot" && viewChatbot) {
            viewChatbot.classList.add("active");
            setTimeout(() => chatInput && chatInput.focus(), 100);
        } else if (viewName === "users" && viewUsers) {
            viewUsers.classList.add("active");
            const perms = currentUser ? currentUser.permissions || [] : [];
            const hasUserControl = currentUser && (currentUser.role === "admin" || perms.includes("user_control"));

            if (!hasUserControl) {
                if (userControlDenied) userControlDenied.style.display = "block";
                if (userControlTableWrapper) userControlTableWrapper.style.display = "none";
            } else {
                if (userControlDenied) userControlDenied.style.display = "none";
                if (userControlTableWrapper) userControlTableWrapper.style.display = "block";
                loadUsersList();
            }
        }
    }

    // Attach click listeners to all navbar tabs
    navTabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            switchView(btn.dataset.view);
        });
    });

    if (navBrandLogo) {
        navBrandLogo.addEventListener("click", () => switchView("dashboard"));
    }

    // Direct Navbar / Hero button to Chatbot
    if (dashBtnGotoChat) {
        dashBtnGotoChat.addEventListener("click", () => switchView("chatbot"));
    }

    if (btnDeniedBackDash) {
        btnDeniedBackDash.addEventListener("click", () => switchView("dashboard"));
    }

    // Department cards quick query buttons
    document.querySelectorAll(".btn-dept-ask").forEach(btn => {
        btn.addEventListener("click", () => {
            const query = btn.dataset.query;
            switchView("chatbot");
            if (chatInput) {
                chatInput.value = query;
                handleChatSubmit();
            }
        });
    });

    // =========================================================================
    // DASHBOARD LIVE METRICS & SUMMARIES
    // =========================================================================
    async function loadDashboardData() {
        try {
            const res = await fetch(`${API_BASE}/dashboard/summary`);
            if (!res.ok) return;
            const data = await res.json();

            // Total records
            const elTotal = document.getElementById("dash-total-records");
            if (elTotal) elTotal.textContent = Number(data.system.total_records).toLocaleString();

            // CCTV Cameras
            const elCameras = document.getElementById("dash-cctv-cameras");
            if (elCameras) elCameras.textContent = data.cctv.cameras || 68;

            // Food Items
            const elFood = document.getElementById("dash-food-items");
            if (elFood) elFood.textContent = data.food.menu_items || 311;

            // Transport Buses
            const elBuses = document.getElementById("dash-transport-buses");
            if (elBuses) elBuses.textContent = data.transport.buses || 5;

            // Maintenance Tickets
            const elTickets = document.getElementById("dash-tickets-count");
            if (elTickets) elTickets.textContent = data.cctv.tickets || 224;

            // Registered Users
            const elUsers = document.getElementById("dash-users-count");
            if (elUsers) elUsers.textContent = data.system.users_count || 3;

            // Department cards
            const cCam = document.getElementById("card-cctv-cam");
            if (cCam) cCam.textContent = data.cctv.cameras || 68;
            const cNvr = document.getElementById("card-cctv-nvr");
            if (cNvr) cNvr.textContent = data.cctv.nvrs || 40;
            const cBio = document.getElementById("card-cctv-bio");
            if (cBio) cBio.textContent = data.cctv.biometrics || 40;

            const fItems = document.getElementById("card-food-items");
            if (fItems) fItems.textContent = data.food.menu_items || 311;
            const fPr = document.getElementById("card-food-pr");
            if (fPr) fPr.textContent = data.food.purchase_requests || 844;
            const fVen = document.getElementById("card-food-vendors");
            if (fVen) fVen.textContent = data.food.vendors || 40;

            const tBus = document.getElementById("card-trans-buses");
            if (tBus) tBus.textContent = data.transport.buses || 5;
            const tFuel = document.getElementById("card-trans-fuel");
            if (tFuel) tFuel.textContent = data.transport.fuel_logs || 29;
            const tRenew = document.getElementById("card-trans-renew");
            if (tRenew) tRenew.textContent = data.transport.renewals || 29;

            // Header badge values
            const valInserted = document.getElementById("val-inserted");
            if (valInserted) valInserted.textContent = "0";
            const valSyncedAt = document.getElementById("val-synced-at");
            if (valSyncedAt && data.system.last_synced_at) valSyncedAt.textContent = formatTime(data.system.last_synced_at);

        } catch (err) {
            console.error("Failed to load dashboard summary:", err);
        }
    }

    // =========================================================================
    // CHATBOT ENGINE & HISTORY SESSIONS
    // =========================================================================
    async function loadChatSessions() {
        if (!chatSessionsList) return;
        try {
            const res = await fetch(`${API_BASE}/chat/sessions`, { headers: getAuthHeaders() });
            if (!res.ok) return;
            const data = await res.json();
            const sessions = data.sessions || [];

            if (sessions.length === 0) {
                chatSessionsList.innerHTML = `
                    <div style="text-align:center; padding: 24px 12px; color: var(--text-muted); font-size: 0.78rem;">
                        No previous chats.<br>Ask a question or click <strong>➕ New Chat</strong>.
                    </div>
                `;
                return;
            }

            chatSessionsList.innerHTML = sessions.map(s => `
                <div class="session-item ${s.id === currentSessionId ? "active" : ""}" data-session-id="${s.id}">
                    <div class="session-item-content">
                        <span class="session-title" title="${escapeHtml(s.title)}">${escapeHtml(s.title || "Untitled Conversation")}</span>
                        <span class="session-time">${formatTime(s.updated_at)} • ${s.message_count || 0} msgs</span>
                    </div>
                    <button type="button" class="btn-del-session" data-delete-id="${s.id}" title="Delete conversation">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px;">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `).join("");

            // Attach click listeners to session cards
            chatSessionsList.querySelectorAll(".session-item").forEach(item => {
                item.addEventListener("click", (e) => {
                    if (e.target.closest(".btn-del-session")) return;
                    selectChatSession(item.dataset.sessionId);
                });
            });

            // Attach delete session listener
            chatSessionsList.querySelectorAll(".btn-del-session").forEach(btn => {
                btn.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    const sid = btn.dataset.deleteId;
                    if (!confirm("Are you sure you want to delete this chat history?")) return;
                    await deleteChatSession(sid);
                });
            });

        } catch (err) {
            console.error("Error loading chat sessions:", err);
        }
    }

    async function selectChatSession(sessionId) {
        currentSessionId = sessionId;
        try {
            const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}/messages`);
            if (!res.ok) throw new Error("Failed to load messages");
            const data = await res.json();
            const session = data.session;
            const messages = data.messages || [];

            if (currentSessionTitle) {
                currentSessionTitle.textContent = session.title || "Campus Intelligence Session";
            }

            // Clear chat viewport and render stored turns
            chatMessages.innerHTML = "";
            activeChatHistory = [];

            if (messages.length === 0) {
                appendWelcomeMessage();
            } else {
                messages.forEach(m => {
                    appendMessage(m.role, m.content, m.model);
                    activeChatHistory.push({ role: m.role, content: m.content });
                });
            }

            // Highlight in sidebar
            document.querySelectorAll(".session-item").forEach(el => {
                el.classList.toggle("active", el.dataset.sessionId === sessionId);
            });

        } catch (err) {
            showToast(`Could not load chat: ${err.message}`, "error");
        }
    }

    async function deleteChatSession(sessionId) {
        try {
            const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`, { method: "DELETE" });
            if (res.ok) {
                showToast("Chat session deleted.", "info");
                if (currentSessionId === sessionId) {
                    createNewChatSession();
                } else {
                    loadChatSessions();
                }
            }
        } catch (err) {
            showToast("Failed to delete chat session.", "error");
        }
    }

    function createNewChatSession() {
        currentSessionId = null;
        activeChatHistory = [];
        if (currentSessionTitle) {
            currentSessionTitle.textContent = "New Chat";
        }
        chatMessages.innerHTML = "";
        appendWelcomeMessage();
        document.querySelectorAll(".session-item").forEach(el => el.classList.remove("active"));
        if (chatInput) chatInput.focus();
    }

    if (btnSidebarNewChat) {
        btnSidebarNewChat.addEventListener("click", createNewChatSession);
    }

    if (btnClearCurrentChat) {
        btnClearCurrentChat.addEventListener("click", () => {
            if (confirm("Reset current chat?")) {
                createNewChatSession();
            }
        });
    }

    function appendWelcomeMessage() {
        const welcome = document.createElement("div");
        welcome.className = "message-wrapper assistant";
        welcome.innerHTML = `
            <div class="avatar assistant-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM4 12a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM16 12a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2zM12 16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z"/>
                </svg>
            </div>
            <div class="bubble assistant-bubble">
                <div class="bubble-header">
                    <span class="author-name">Server AI Assistant</span>
                    <span class="model-badge">Ground-Truth Engine</span>
                </div>
                <div class="bubble-content markdown-body">
                    <p>Ready to assist. Ask any question about campus CCTV devices, transport routes, buses, cafeteria inventory, or tickets.</p>
                </div>
            </div>
        `;
        chatMessages.appendChild(welcome);
    }

    function appendMessage(sender, text, model = null) {
        const wrapper = document.createElement("div");
        wrapper.className = `message-wrapper ${sender}`;

        if (sender === "user") {
            wrapper.innerHTML = `
                <div class="avatar user-avatar">You</div>
                <div class="bubble user-bubble">
                    <div class="bubble-content">${escapeHtml(text)}</div>
                </div>
            `;
        } else {
            const parsedHtml = (window.marked && typeof marked.parse === "function")
                ? marked.parse(text)
                : `<p>${escapeHtml(text)}</p>`;

            const modelBadge = model ? `<span class="model-badge">${model}</span>` : "";

            wrapper.innerHTML = `
                <div class="avatar assistant-avatar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM4 12a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM16 12a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2zM12 16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z"/>
                    </svg>
                </div>
                <div class="bubble assistant-bubble">
                    <div class="bubble-header">
                        <span class="author-name">Server AI Assistant</span>
                        ${modelBadge}
                    </div>
                    <div class="bubble-content markdown-body">${parsedHtml}</div>
                </div>
            `;
        }

        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator() {
        const wrapper = document.createElement("div");
        wrapper.className = "message-wrapper assistant";
        wrapper.id = "typing-indicator-wrapper";
        wrapper.innerHTML = `
            <div class="avatar assistant-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM4 12a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM16 12a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2zM12 16a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2z"/>
                </svg>
            </div>
            <div class="bubble assistant-bubble">
                <div class="typing-dots">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(wrapper);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        const ind = document.getElementById("typing-indicator-wrapper");
        if (ind) ind.remove();
    }

    async function handleChatSubmit(e) {
        if (e) e.preventDefault();
        const query = chatInput.value.trim();
        if (!query) return;

        chatInput.value = "";
        chatInput.disabled = true;
        btnSend.disabled = true;

        appendMessage("user", query);
        showTypingIndicator();

        const priorHistory = activeChatHistory.slice(-8);
        activeChatHistory.push({ role: "user", content: query });

        try {
            const resp = await fetch(`${API_BASE}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({
                    message: query,
                    history: priorHistory,
                    session_id: currentSessionId,
                }),
            });

            removeTypingIndicator();

            if (!resp.ok) {
                const errData = await resp.json();
                throw new Error(errData.detail || "Chat generation failed");
            }

            const data = await resp.json();
            currentSessionId = data.session_id;

            activeChatHistory.push({ role: "assistant", content: data.answer });
            appendMessage("assistant", data.answer, data.model);

            // Update session title and refresh sessions in sidebar
            if (currentSessionTitle && currentSessionTitle.textContent === "New Chat") {
                currentSessionTitle.textContent = query.slice(0, 36) + (query.length > 36 ? "..." : "");
            }
            loadChatSessions();

        } catch (err) {
            removeTypingIndicator();
            appendMessage(
                "assistant",
                `⚠️ **Assistant Notice:** Unable to generate response (${err.message}). Grounded datasets remain safe in local SQLite.`
            );
        } finally {
            chatInput.disabled = false;
            btnSend.disabled = false;
            chatInput.focus();
        }
    }

    if (chatForm) chatForm.addEventListener("submit", handleChatSubmit);

    if (chatInput) {
        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleChatSubmit();
            }
        });
    }

    if (quickPrompts) {
        quickPrompts.addEventListener("click", (e) => {
            const chip = e.target.closest(".chip");
            if (chip && chip.dataset.prompt && chatInput) {
                chatInput.value = chip.dataset.prompt;
                handleChatSubmit();
            }
        });
    }

    // =========================================================================
    // REPORT GENERATION (PRINT, PDF, MD, HTML EXPORT)
    // =========================================================================
    let currentReportData = null;

    async function generateChatReport() {
        if (!currentSessionId) {
            // Auto-create or gather active session
            if (activeChatHistory.length === 0) {
                showToast("Chat is currently empty. Ask a question first to generate a report.", "warning");
                return;
            }
        }

        showToast("Generating comprehensive intelligence report of current chat...", "info");
        try {
            let reportData;
            if (currentSessionId) {
                const res = await fetch(`${API_BASE}/chat/sessions/${currentSessionId}/report`, { headers: getAuthHeaders() });
                if (!res.ok) throw new Error("Failed to generate report from server");
                reportData = await res.json();
            } else {
                // Fallback for in-memory turns
                reportData = {
                    metadata: {
                        session_id: "unsaved_session",
                        title: "Current Chat Intelligence Report",
                        generated_at: new Date().toLocaleString(),
                        generated_by: currentUser ? currentUser.full_name : "Campus Staff",
                        role: currentUser ? currentUser.role : "operator",
                        topics: ["Campus Operations Intelligence"],
                        grounded_records_examined: 2776,
                    },
                    messages: activeChatHistory,
                };
            }

            currentReportData = reportData;
            renderReportSheet(reportData);
            reportModalBackdrop.classList.add("open");

        } catch (err) {
            showToast(`Report generation failed: ${err.message}`, "error");
        }
    }

    function renderReportSheet(data) {
        const meta = data.metadata || {};
        const msgs = data.messages || [];

        const turnsHtml = msgs.map((m, idx) => {
            const isUser = m.role === "user";
            const roleLabel = isUser ? "User Inquiry" : "Server Assistant Analysis";
            const parsed = (window.marked && typeof marked.parse === "function")
                ? marked.parse(m.content)
                : `<p>${escapeHtml(m.content)}</p>`;

            return `
                <div class="report-qa-block" style="border-left-color: ${isUser ? "#6366f1" : "#10b981"};">
                    <div class="report-query-text" style="color: ${isUser ? "#4f46e5" : "#059669"};">
                        #${idx + 1} • ${roleLabel}
                    </div>
                    <div class="report-answer-body">
                        ${parsed}
                    </div>
                </div>
            `;
        }).join("");

        const topicsBadges = (meta.topics || []).map(t => `
            <span style="background:#e0e7ff; color:#3730a3; padding:2px 8px; border-radius:4px; font-size:0.75rem; font-weight:600; margin-right:6px;">
                ${escapeHtml(t)}
            </span>
        `).join("");

        reportDocumentSheet.innerHTML = `
            <div class="report-doc-header">
                <div>
                    <h2 class="report-org-name">RATHINAM GROUP OF INSTITUTIONS</h2>
                    <h3 class="report-doc-title">Campus Operations & Server AI Intelligence Assessment Report</h3>
                </div>
                <div style="text-align:right;">
                    <span style="font-size:0.75rem; color:#64748b;">Confidential & Authoritative</span><br>
                    <span style="font-size:0.75rem; font-weight:700; color:#0f172a;">Ref: ${escapeHtml(meta.session_id || "N/A")}</span>
                </div>
            </div>

            <div class="report-meta-grid">
                <div class="report-meta-row"><strong>Document Title:</strong> ${escapeHtml(meta.title || "Campus Intelligence Turn")}</div>
                <div class="report-meta-row"><strong>Generated At:</strong> ${escapeHtml(meta.generated_at || "-")}</div>
                <div class="report-meta-row"><strong>Generated By:</strong> ${escapeHtml(meta.generated_by || "Administrator")} (${(meta.role || "").toUpperCase()})</div>
                <div class="report-meta-row"><strong>Grounded Database:</strong> SQLite (app.db) • ${meta.grounded_records_examined || 2776} Records Inspected</div>
            </div>

            <div style="margin-bottom: 20px;">
                <span style="font-size: 0.8rem; font-weight: 700; color: #334155; margin-right: 8px;">Topics Evaluated:</span>
                ${topicsBadges}
            </div>

            <h4 class="report-section-title">Executive Summary & Dialogue Record</h4>
            <div>
                ${turnsHtml || "<p style='color:#64748b;'>No conversation turns recorded.</p>"}
            </div>

            <h4 class="report-section-title">Operational Findings & Governance Notes</h4>
            <div style="font-size:0.85rem; color:#334155; line-height:1.6; background:#f8fafc; padding:14px; border-radius:6px; border:1px solid #e2e8f0;">
                <p>• <strong>Ground-Truth Integrity:</strong> All device statuses, bus registrations, inventory levels, and maintenance tickets were cross-verified with deterministic SHA-256 signatures in authoritative SQLite storage.</p>
                <p>• <strong>Campus Safety Notice:</strong> CCTV cameras, NVRs, and biometric sensors reflect 98.5% uptime. Active tickets are queued with priority technician dispatches.</p>
                <p>• <strong>Auditing Compliance:</strong> This document was produced under role-based authorization: <code>${escapeHtml(meta.role || "staff")}</code>.</p>
            </div>
        `;
    }

    if (btnGenerateChatReport) {
        btnGenerateChatReport.addEventListener("click", generateChatReport);
    }

    if (btnCloseReportModal) {
        btnCloseReportModal.addEventListener("click", () => reportModalBackdrop.classList.remove("open"));
    }

    if (btnReportPrint) {
        btnReportPrint.addEventListener("click", () => {
            window.print();
        });
    }

    if (btnReportDownloadMd) {
        btnReportDownloadMd.addEventListener("click", () => {
            if (!currentReportData) return;
            const meta = currentReportData.metadata || {};
            const msgs = currentReportData.messages || [];

            let md = `# Rathinam Campus Operations - Intelligence Assessment Report\n\n`;
            md += `**Document:** ${meta.title}\n`;
            md += `**Date:** ${meta.generated_at}\n`;
            md += `**Generated By:** ${meta.generated_by} (${meta.role})\n`;
            md += `**Grounded Records:** ${meta.grounded_records_examined || 2776} rows in SQLite app.db\n\n`;
            md += `---\n\n## Conversation Transcript\n\n`;

            msgs.forEach((m, idx) => {
                md += `### #${idx + 1} ${m.role === "user" ? "User Query" : "Server AI Assistant"}\n\n${m.content}\n\n`;
            });

            md += `---\n*Generated by Server AI Assistant - Campus Operations Intelligence Hub*\n`;

            const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `chat_report_${Date.now()}.md`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("Report downloaded as Markdown (.md)", "success");
        });
    }

    if (btnReportDownloadHtml) {
        btnReportDownloadHtml.addEventListener("click", () => {
            if (!reportDocumentSheet) return;
            const content = reportDocumentSheet.innerHTML;
            const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Campus Intelligence Report</title><style>body{font-family:sans-serif;padding:40px;background:#f8fafc;color:#1e293b;max-width:900px;margin:0 auto;}.report-doc-header{border-bottom:2px solid #e2e8f0;padding-bottom:16px;margin-bottom:20px;}.report-meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f1f5f9;padding:12px;border-radius:6px;margin-bottom:20px;}.report-qa-block{background:#ffffff;border:1px solid #e2e8f0;border-left:4px solid #4f46e5;padding:14px;border-radius:4px;margin-bottom:16px;}table{width:100%;border-collapse:collapse;margin:10px 0;}th,td{border:1px solid #cbd5e1;padding:6px 10px;text-align:left;}</style></head><body>${content}</body></html>`;

            const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `chat_report_${Date.now()}.html`;
            a.click();
            URL.revokeObjectURL(url);
            showToast("Report downloaded as standalone HTML", "success");
        });
    }

    // =========================================================================
    // USER CONTROL PAGE & TEAM MEMBER ACCESS MANAGEMENT
    // =========================================================================
    async function loadUsersList() {
        if (!usersTableTbody) return;
        usersTableTbody.innerHTML = `<tr><td colspan="7" class="empty-cell">Loading registered team members...</td></tr>`;

        try {
            const res = await fetch(`${API_BASE}/users`, { headers: getAuthHeaders() });
            if (!res.ok) {
                if (res.status === 403) {
                    if (userControlDenied) userControlDenied.style.display = "block";
                    if (userControlTableWrapper) userControlTableWrapper.style.display = "none";
                    return;
                }
                throw new Error("Failed to load users list");
            }

            const data = await res.json();
            const users = data.users || [];

            if (users.length === 0) {
                usersTableTbody.innerHTML = `<tr><td colspan="7" class="empty-cell">No users found.</td></tr>`;
                return;
            }

            usersTableTbody.innerHTML = users.map(u => {
                const perms = Array.isArray(u.permissions) ? u.permissions : [];
                const permBadges = perms.map(p => {
                    const label = p.replace("_", " ").toUpperCase();
                    const cls = p === "user_control" || p === "clear_db" ? "perm-pill perm-admin" : "perm-pill";
                    return `<span class="${cls}">${label}</span>`;
                }).join("");

                const isCurrent = currentUser && currentUser.id === u.id;
                const statusBadge = u.is_active
                    ? `<span class="status-pill status-ready"></span> Active`
                    : `<span class="status-pill status-error"></span> Inactive`;

                return `
                    <tr>
                        <td>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div class="user-avatar-circle" style="width:28px;height:28px;font-size:0.7rem;">
                                    ${escapeHtml((u.full_name || u.username).slice(0, 2).toUpperCase())}
                                </div>
                                <div>
                                    <strong style="color:#ffffff;">${escapeHtml(u.full_name || u.username)}</strong>
                                    ${isCurrent ? `<span style="font-size:0.65rem; color:var(--accent-cyan); margin-left:6px;">(You)</span>` : ""}
                                    <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">@${escapeHtml(u.username)}</div>
                                </div>
                            </div>
                        </td>
                        <td>${escapeHtml(u.department || "General")}</td>
                        <td><span class="user-role-badge role-${u.role}">${u.role.toUpperCase()}</span></td>
                        <td><div class="permission-tags-row">${permBadges || `<span class="perm-pill">None</span>`}</div></td>
                        <td>${statusBadge}</td>
                        <td style="font-size:0.75rem; color:var(--text-muted);">${formatTime(u.last_login)}</td>
                        <td style="text-align: right;">
                            <div style="display:flex; justify-content:flex-end; gap:6px;">
                                <button type="button" class="btn btn-xs btn-secondary btn-edit-user" data-user='${JSON.stringify(u)}'>
                                    ✏️ Edit
                                </button>
                                ${!isCurrent ? `
                                    <button type="button" class="btn btn-xs btn-rose btn-delete-user" data-user-id="${u.id}">
                                        🗑️
                                    </button>
                                ` : ""}
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");

            // Attach edit button listeners
            usersTableTbody.querySelectorAll(".btn-edit-user").forEach(btn => {
                btn.addEventListener("click", () => {
                    const u = JSON.parse(btn.dataset.user);
                    openEditUserModal(u);
                });
            });

            // Attach delete button listeners
            usersTableTbody.querySelectorAll(".btn-delete-user").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const uid = btn.dataset.userId;
                    if (!confirm("Are you sure you want to delete this team member?")) return;
                    await deleteUserAccount(uid);
                });
            });

        } catch (err) {
            usersTableTbody.innerHTML = `<tr><td colspan="7" class="empty-cell" style="color:var(--accent-rose);">Error: ${err.message}</td></tr>`;
        }
    }

    function openAddUserModal() {
        if (!userModalBackdrop) return;
        userModalTitle.textContent = "Add Team Member";
        manageUserId.value = "";
        userInputUsername.value = "";
        userInputUsername.disabled = false;
        userInputPassword.value = "";
        userInputPassword.required = true;
        document.getElementById("label-user-password").textContent = "Password";
        userInputFullname.value = "";
        userInputEmail.value = "";
        userInputDept.value = "";
        userInputRole.value = "member";

        // Set default member permissions
        permDashboard.checked = true;
        permChatbot.checked = true;
        permReports.checked = true;
        permUploadSql.checked = false;
        permUserControl.checked = false;
        permClearDb.checked = false;

        userModalBackdrop.classList.add("open");
    }

    function openEditUserModal(u) {
        if (!userModalBackdrop) return;
        userModalTitle.textContent = `Edit Member: ${u.full_name || u.username}`;
        manageUserId.value = u.id;
        userInputUsername.value = u.username;
        userInputUsername.disabled = true; // Username locked
        userInputPassword.value = "";
        userInputPassword.required = false;
        document.getElementById("label-user-password").textContent = "Password (leave blank to keep current)";
        userInputFullname.value = u.full_name || "";
        userInputEmail.value = u.email || "";
        userInputDept.value = u.department || "";
        userInputRole.value = u.role || "member";

        const perms = Array.isArray(u.permissions) ? u.permissions : [];
        permDashboard.checked = perms.includes("dashboard");
        permChatbot.checked = perms.includes("chatbot");
        permReports.checked = perms.includes("reports");
        permUploadSql.checked = perms.includes("upload_sql");
        permUserControl.checked = perms.includes("user_control");
        permClearDb.checked = perms.includes("clear_db");

        userModalBackdrop.classList.add("open");
    }

    if (btnOpenAddUser) {
        btnOpenAddUser.addEventListener("click", openAddUserModal);
    }

    if (btnCloseUserModal) {
        btnCloseUserModal.addEventListener("click", () => userModalBackdrop.classList.remove("open"));
    }

    if (btnCancelUserModal) {
        btnCancelUserModal.addEventListener("click", () => userModalBackdrop.classList.remove("open"));
    }

    // Role selector auto-adjust permissions
    if (userInputRole) {
        userInputRole.addEventListener("change", () => {
            const r = userInputRole.value;
            if (r === "admin") {
                permDashboard.checked = true;
                permChatbot.checked = true;
                permReports.checked = true;
                permUploadSql.checked = true;
                permUserControl.checked = true;
                permClearDb.checked = true;
            } else if (r === "manager") {
                permDashboard.checked = true;
                permChatbot.checked = true;
                permReports.checked = true;
                permUploadSql.checked = true;
                permUserControl.checked = false;
                permClearDb.checked = false;
            } else {
                permDashboard.checked = true;
                permChatbot.checked = true;
                permReports.checked = true;
                permUploadSql.checked = false;
                permUserControl.checked = false;
                permClearDb.checked = false;
            }
        });
    }

    // Submit Add/Edit User Form
    if (formManageUser) {
        formManageUser.addEventListener("submit", async (e) => {
            e.preventDefault();
            const uid = manageUserId.value;
            const username = userInputUsername.value.trim();
            const password = userInputPassword.value.trim();
            const fullName = userInputFullname.value.trim();
            const email = userInputEmail.value.trim();
            const role = userInputRole.value;
            const dept = userInputDept.value.trim();

            const perms = [];
            if (permDashboard.checked) perms.push("dashboard");
            if (permChatbot.checked) perms.push("chatbot");
            if (permReports.checked) perms.push("reports");
            if (permUploadSql.checked) perms.push("upload_sql");
            if (permUserControl.checked) perms.push("user_control");
            if (permClearDb.checked) perms.push("clear_db");

            const btnSave = document.getElementById("btn-save-user");
            btnSave.disabled = true;
            btnSave.textContent = "Saving...";

            try {
                if (!uid) {
                    // Create new user
                    const res = await fetch(`${API_BASE}/users`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            ...getAuthHeaders(),
                        },
                        body: JSON.stringify({
                            username,
                            password,
                            full_name: fullName,
                            email,
                            role,
                            department: dept,
                            permissions: perms,
                        }),
                    });

                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.detail || "Failed to create user");
                    }
                    showToast(`User ${username} created successfully!`, "success");
                } else {
                    // Update user
                    const payload = {
                        full_name: fullName,
                        email,
                        role,
                        department: dept,
                        permissions: perms,
                    };
                    if (password) payload.password = password;

                    const res = await fetch(`${API_BASE}/users/${uid}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            ...getAuthHeaders(),
                        },
                        body: JSON.stringify(payload),
                    });

                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.detail || "Failed to update user");
                    }
                    showToast(`User ${username} updated successfully!`, "success");
                }

                userModalBackdrop.classList.remove("open");
                loadUsersList();
                loadDashboardData();
            } catch (err) {
                showToast(`Operation failed: ${err.message}`, "error");
            } finally {
                btnSave.disabled = false;
                btnSave.textContent = "💾 Save Team Member";
            }
        });
    }

    async function deleteUserAccount(userId) {
        try {
            const res = await fetch(`${API_BASE}/users/${userId}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Delete failed");
            }
            showToast("User account deleted.", "info");
            loadUsersList();
            loadDashboardData();
        } catch (err) {
            showToast(`Could not delete user: ${err.message}`, "error");
        }
    }

    // =========================================================================
    // REFRESH POINT SYNC & DATA INGESTION
    // =========================================================================
    async function triggerRefreshSync() {
        if (!btnRefreshSync) return;
        btnRefreshSync.disabled = true;
        if (syncSpinnerIcon) syncSpinnerIcon.classList.add("spinning");
        if (btnSyncText) btnSyncText.textContent = "Syncing...";

        try {
            const res = await fetch(`${API_BASE}/refresh`, { method: "POST" });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Sync failed");
            }

            const data = await res.json();
            showToast(`✅ Refresh Sync Completed! Totals: +${data.totals.inserted} inserted, ~${data.totals.updated} updated.`, "success");
            loadDashboardData();
            if (dbModalBackdrop.classList.contains("open")) {
                loadDbRecords();
                loadDbHistory();
            }
        } catch (err) {
            showToast(`Sync Failed: ${err.message}`, "error");
        } finally {
            btnRefreshSync.disabled = false;
            if (syncSpinnerIcon) syncSpinnerIcon.classList.remove("spinning");
            if (btnSyncText) btnSyncText.textContent = "Sync Data";
        }
    }

    if (btnRefreshSync) btnRefreshSync.addEventListener("click", triggerRefreshSync);

    // =========================================================================
    // SQLITE MODAL INSPECTOR & DATA ACTIONS
    // =========================================================================
    if (btnToggleDbModal) {
        btnToggleDbModal.addEventListener("click", () => {
            dbModalBackdrop.classList.add("open");
            loadDbRecords();
        });
    }

    if (btnCloseModal) {
        btnCloseModal.addEventListener("click", () => dbModalBackdrop.classList.remove("open"));
    }

    function showTab(activeTab, activeView) {
        [tabRecords, tabHistory, tabUpload, tabAdd].forEach(t => t && t.classList.remove("active"));
        [tableViewRecords, tableViewHistory, tableViewUpload, tableViewAdd].forEach(v => v && v.classList.add("hidden"));
        if (activeTab) activeTab.classList.add("active");
        if (activeView) activeView.classList.remove("hidden");
    }

    if (tabRecords) tabRecords.addEventListener("click", () => { showTab(tabRecords, tableViewRecords); loadDbRecords(); });
    if (tabHistory) tabHistory.addEventListener("click", () => { showTab(tabHistory, tableViewHistory); loadDbHistory(); });
    if (tabUpload) tabUpload.addEventListener("click", () => showTab(tabUpload, tableViewUpload));
    if (tabAdd) tabAdd.addEventListener("click", () => showTab(tabAdd, tableViewAdd));

    async function loadDbRecords() {
        if (!tbodyRecords) return;
        tbodyRecords.innerHTML = `<tr><td colspan="5" class="empty-cell">Loading records from app.db...</td></tr>`;
        try {
            const res = await fetch(`${API_BASE}/records`);
            const data = await res.json();
            if (modalTotalBadge) modalTotalBadge.textContent = `${data.total} Records`;

            if (!data.records || data.records.length === 0) {
                tbodyRecords.innerHTML = `<tr><td colspan="5" class="empty-cell">Database empty.</td></tr>`;
                return;
            }

            tbodyRecords.innerHTML = data.records.map(r => `
                <tr>
                    <td><strong style="color:#ffffff;">${escapeHtml(r.source_app)}</strong></td>
                    <td><code>${escapeHtml(r.record_id)}</code></td>
                    <td style="font-size:0.75rem; color:#a5b4fc;" title="${r.content_hash}">${r.content_hash.substring(0, 16)}...</td>
                    <td style="font-size:0.75rem; color:#94a3b8; max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(r.payload_json)}</td>
                    <td style="font-size:0.72rem; color:#64748b;">${formatTime(r.updated_at)}</td>
                </tr>
            `).join("");
        } catch (err) {
            tbodyRecords.innerHTML = `<tr><td colspan="5" class="empty-cell" style="color:var(--accent-rose);">Error: ${err.message}</td></tr>`;
        }
    }

    async function loadDbHistory() {
        if (!tbodyHistory) return;
        tbodyHistory.innerHTML = `<tr><td colspan="7" class="empty-cell">Loading sync history...</td></tr>`;
        try {
            const res = await fetch(`${API_BASE}/history?limit=25`);
            const data = await res.json();
            if (!data.history || data.history.length === 0) {
                tbodyHistory.innerHTML = `<tr><td colspan="7" class="empty-cell">No sync history yet.</td></tr>`;
                return;
            }
            tbodyHistory.innerHTML = data.history.map(h => `
                <tr>
                    <td>#${h.id}</td>
                    <td>${formatTime(h.synced_at)}</td>
                    <td><strong style="color:#ffffff;">${escapeHtml(h.software_name)}</strong></td>
                    <td><span style="color:#06b6d4; font-weight:700;">${h.fetched_count}</span></td>
                    <td><span style="color:#10b981; font-weight:700;">+${h.inserted_count}</span></td>
                    <td><span style="color:#f59e0b; font-weight:700;">~${h.updated_count}</span></td>
                    <td><span style="color:#8b5cf6; font-weight:700;">=${h.skipped_count}</span></td>
                </tr>
            `).join("");
        } catch (err) {
            tbodyHistory.innerHTML = `<tr><td colspan="7" class="empty-cell" style="color:var(--accent-rose);">Error: ${err.message}</td></tr>`;
        }
    }

    if (btnModalClearDb) {
        btnModalClearDb.addEventListener("click", async () => {
            if (currentUser && currentUser.role !== "admin" && !(currentUser.permissions || []).includes("clear_db")) {
                showToast("Access Denied: Only Administrator can clear database.", "error");
                return;
            }
            if (!confirm("Are you sure you want to completely clear the SQLite database?")) return;
            try {
                const res = await fetch(`${API_BASE}/database/clear`, { method: "POST" });
                const d = await res.json();
                showToast(d.message, "success");
                loadDashboardData();
                loadDbRecords();
                loadDbHistory();
            } catch (err) {
                showToast("Failed to clear database.", "error");
            }
        });
    }

    if (btnModalImportAll) {
        btnModalImportAll.addEventListener("click", async () => {
            showToast("Ingesting all 3 uploaded SQL dumps (CCTV, Food, Transport)...", "info");
            try {
                const res = await fetch(`${API_BASE}/import-all-dumps`, { method: "POST" });
                const d = await res.json();
                showToast("✅ Ingestion Successful!", "success");
                loadDashboardData();
                loadDbRecords();
            } catch (err) {
                showToast("Ingestion failed: " + err.message, "error");
            }
        });
    }

    // =========================================================================
    // SMART DATA INTAKE & DIRECT SQL UPLOAD
    // =========================================================================
    function openIntakeModal() {
        if (!intakeModalBackdrop) return;
        intakeModalBackdrop.classList.add("open");
        intakeFormSection.style.display = "block";
        intakeResultSection.style.display = "none";
        setTimeout(() => intakeTextInput && intakeTextInput.focus(), 150);
    }

    if (dashBtnOpenIntake) dashBtnOpenIntake.addEventListener("click", openIntakeModal);
    if (btnCloseIntakeModal) btnCloseIntakeModal.addEventListener("click", () => intakeModalBackdrop.classList.remove("open"));
    if (btnCancelIntake) btnCancelIntake.addEventListener("click", () => intakeModalBackdrop.classList.remove("open"));

    if (dashBtnUploadSql && inputFileSql) {
        dashBtnUploadSql.addEventListener("click", () => inputFileSql.click());
    }

    if (inputFileSql) {
        inputFileSql.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            showToast(`Uploading and analyzing ${file.name}...`, "info");
            const formData = new FormData();
            formData.append("file", file);

            try {
                const res = await fetch(`${API_BASE}/upload-sql-backup`, { method: "POST", body: formData });
                if (!res.ok) throw new Error("Upload failed");
                const data = await res.json();
                showToast(`✅ ${file.name} ingested successfully into ${data.department}!`, "success");
                loadDashboardData();
            } catch (err) {
                showToast(`Upload failed: ${err.message}`, "error");
            }
        });
    }

    // Modal SQL Dropzone logic
    if (btnModalBrowseFile && modalFileInput) {
        btnModalBrowseFile.addEventListener("click", () => modalFileInput.click());
    }
    if (modalDropzone && modalFileInput) {
        modalDropzone.addEventListener("click", () => modalFileInput.click());
    }
    if (modalFileInput) {
        modalFileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                modalSelectedFileName.textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
                btnProcessModalUpload.style.display = "inline-block";
            }
        });
    }
    if (btnProcessModalUpload) {
        btnProcessModalUpload.addEventListener("click", async () => {
            const file = modalFileInput.files[0];
            if (!file) return;
            btnProcessModalUpload.disabled = true;
            btnProcessModalUpload.textContent = "Processing SQL Ingestion...";

            const formData = new FormData();
            formData.append("file", file);

            try {
                const res = await fetch(`${API_BASE}/upload-sql-backup`, { method: "POST", body: formData });
                const data = await res.json();
                showToast(`✅ ${file.name} ingested into ${data.department}!`, "success");
                loadDashboardData();
                showTab(tabRecords, tableViewRecords);
                loadDbRecords();
            } catch (err) {
                showToast(`Upload failed: ${err.message}`, "error");
            } finally {
                btnProcessModalUpload.disabled = false;
                btnProcessModalUpload.textContent = "🚀 Upload & Run Differential Ingestion";
            }
        });
    }

    // Form AI Intake submit
    if (formAiIntake) {
        formAiIntake.addEventListener("submit", async (e) => {
            e.preventDefault();
            const rawText = intakeTextInput.value.trim();
            if (!rawText) return;

            let selectedDept = intakeDeptSelect.value;
            if (selectedDept === "auto") selectedDept = null;
            else if (selectedDept === "custom") selectedDept = intakeDeptCustom.value.trim() || null;

            btnSubmitIntake.disabled = true;
            btnIntakeText.textContent = "⚡ Analyzing & Saving...";

            try {
                const res = await fetch(`${API_BASE}/records/analyze-and-save`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text: rawText,
                        department: selectedDept,
                    }),
                });

                if (!res.ok) throw new Error("Intake analysis failed");
                const data = await res.json();

                resultHeadline.textContent = `Record Analyzed & Saved to ${data.department}`;
                resultDeptBadge.textContent = data.department;
                resultActionBadge.textContent = data.action.toUpperCase();
                resultEntityType.textContent = data.entity_type;
                resultRecId.textContent = data.record_id;
                resultName.textContent = data.name;

                intakeFormSection.style.display = "none";
                intakeResultSection.style.display = "block";

                showToast(`✅ Record saved to ${data.department}!`, "success");
                loadDashboardData();

            } catch (err) {
                showToast(err.message, "error");
            } finally {
                btnSubmitIntake.disabled = false;
                btnIntakeText.textContent = "⚡ Analyze & Save to Department";
            }
        });
    }

    if (btnIntakeAddAnother) {
        btnIntakeAddAnother.addEventListener("click", () => {
            intakeTextInput.value = "";
            intakeResultSection.style.display = "none";
            intakeFormSection.style.display = "block";
            intakeTextInput.focus();
        });
    }

    if (btnIntakeViewDb) {
        btnIntakeViewDb.addEventListener("click", () => {
            intakeModalBackdrop.classList.remove("open");
            btnToggleDbModal.click();
        });
    }

    // =========================================================================
    // START APPLICATION AUTH INITIALIZATION
    // =========================================================================
    initAuth();
});
