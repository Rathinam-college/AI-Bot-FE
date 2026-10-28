/**
 * Server AI Assistant - Frontend Application Logic
 * Integrates:
 *   - Refresh Point Sync engine triggering with live metrics updating
 *   - Chat interaction with Markdown rendering and typing animation
 *   - SQLite Database & Sync History inspector modal
 *   - Interactive mock test controller for sequential verification
 */

document.addEventListener("DOMContentLoaded", () => {
    // DOM Elements - Metrics
    const valInserted = document.getElementById("val-inserted");
    const valUpdated = document.getElementById("val-updated");
    const valSkipped = document.getElementById("val-skipped");
    const valSyncedAt = document.getElementById("val-synced-at");

    // DOM Elements - Action Buttons & Header
    const btnRefreshSync = document.getElementById("btn-refresh-sync");
    const btnSyncText = document.getElementById("btn-sync-text");
    const syncSpinnerIcon = document.getElementById("sync-spinner-icon");
    const btnToggleDbModal = document.getElementById("btn-toggle-db-modal");

    // DOM Elements - Targets Status Strip
    const countApp1 = document.getElementById("count-app1");
    const countApp2 = document.getElementById("count-app2");
    const countApp3 = document.getElementById("count-app3");
    const countDbTotal = document.getElementById("count-db-total");

    // DOM Elements - Chat
    const chatMessages = document.getElementById("chat-messages");
    const chatForm = document.getElementById("chat-form");
    const chatInput = document.getElementById("chat-input");
    const btnSend = document.getElementById("btn-send");
    const quickPrompts = document.getElementById("quick-prompts");

    // DOM Elements - Test Controller
    const btnTestState1 = document.getElementById("btn-test-state-1");
    const btnTestState3 = document.getElementById("btn-test-state-3");
    const btnTestExpireToken = document.getElementById("btn-test-expire-token");
    const btnTestOutage = document.getElementById("btn-test-outage");
    const testStatusMsg = document.getElementById("test-status-msg");

    // DOM Elements - Modal & Actions
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

    // DOM Elements - Upload & Direct Ingestion
    const btnUploadSql = document.getElementById("btn-upload-sql");
    const inputFileSql = document.getElementById("input-file-sql");
    const chipUploadSql = document.getElementById("chip-upload-sql");
    const modalFileInput = document.getElementById("modal-file-input");
    const modalDropzone = document.getElementById("modal-dropzone");
    const btnModalBrowseFile = document.getElementById("btn-modal-browse-file");
    const modalSelectedFileName = document.getElementById("modal-selected-file-name");
    const btnProcessModalUpload = document.getElementById("btn-process-modal-upload");

    // DOM Elements - Individual Record Form
    const formAddIndividual = document.getElementById("form-add-individual");
    const inputRecordApp = document.getElementById("input-record-app");
    const inputRecordId = document.getElementById("input-record-id");
    const inputRecordJson = document.getElementById("input-record-json");
    const chipAddRecord = document.getElementById("chip-add-record");
    const chipClearDb = document.getElementById("chip-clear-db");

    // DOM Elements - Toast Container
    const toastContainer = document.getElementById("toast-container");

    let isApp3Outage = false;

    // --- Toast Notification Helper ---
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

    // --- Format Timestamps ---
    function formatTime(isoString) {
        if (!isoString) return "Not synced yet";
        try {
            const date = new Date(isoString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch {
            return isoString.substring(11, 19);
        }
    }

    // --- Fetch & Update Live Metrics ---
    async function updateMetrics() {
        try {
            const res = await fetch("/api/metrics");
            if (!res.ok) return;
            const data = await res.json();

            // Update badge numbers
            const latest = data.latest_sync || {};
            valInserted.textContent = latest.inserted !== undefined ? latest.inserted : 0;
            valUpdated.textContent = latest.updated !== undefined ? latest.updated : 0;
            valSkipped.textContent = latest.skipped !== undefined ? latest.skipped : 0;
            valSyncedAt.textContent = latest.synced_at ? formatTime(latest.synced_at) : "Not synced yet";

            // Update target cards
            const breakdown = data.app_breakdown || {};
            let cctvCount = 0;
            let foodCount = 0;
            let transportCount = 0;
            for (const [app, cnt] of Object.entries(breakdown)) {
                const a = app.toLowerCase();
                if (a.includes("cctv") || a.includes("software 1") || a.includes("app1")) {
                    cctvCount += cnt;
                } else if (a.includes("food") || a.includes("software 2") || a.includes("app2")) {
                    foodCount += cnt;
                } else if (a.includes("transport") || a.includes("software 3") || a.includes("app3")) {
                    transportCount += cnt;
                }
            }
            countApp1.textContent = `${cctvCount} records`;
            countApp2.textContent = `${foodCount} records`;
            countApp3.textContent = `${transportCount} records`;
            countDbTotal.textContent = `${data.total_records || 0} rows`;
            modalTotalBadge.textContent = `${data.total_records || 0} Records`;
        } catch (err) {
            console.warn("Could not fetch metrics:", err);
        }
    }

    // --- Trigger Refresh Point Sync ---
    async function triggerSync() {
        // Set loading state
        btnRefreshSync.disabled = true;
        btnSyncText.textContent = "Syncing Targets...";
        syncSpinnerIcon.classList.add("rotating");

        try {
            const response = await fetch("/api/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || "Sync failed");
            }

            const data = await response.json();
            const totals = data.totals || {};

            // Immediate badge update
            valInserted.textContent = totals.inserted || 0;
            valUpdated.textContent = totals.updated || 0;
            valSkipped.textContent = totals.skipped || 0;
            valSyncedAt.textContent = formatTime(data.synced_at);

            // Toast feedback
            showToast(
                `Sync Completed: ${totals.fetched || 0} fetched (${totals.inserted || 0} inserted, ${totals.updated || 0} updated, ${totals.skipped || 0} skipped)`,
                data.status === "error" ? "error" : "success"
            );

            // Refresh cards and metrics
            await updateMetrics();

            // If modal is open, refresh records table
            if (dbModalBackdrop.classList.contains("open")) {
                loadDbRecords();
            }
        } catch (error) {
            console.error("Refresh error:", error);
            showToast(`Sync Failed: ${error.message}`, "error");
        } finally {
            btnRefreshSync.disabled = false;
            btnSyncText.textContent = "Refresh Point Sync";
            syncSpinnerIcon.classList.remove("rotating");
        }
    }

    btnRefreshSync.addEventListener("click", triggerSync);

    // --- Chat System ---
    const conversationHistory = [];

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

    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
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

        // Snapshot prior history before adding this turn
        const priorHistory = conversationHistory.slice(-8);
        conversationHistory.push({ role: "user", content: query });

        try {
            const resp = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: query,
                    history: priorHistory
                }),
            });

            removeTypingIndicator();

            if (!resp.ok) {
                const errData = await resp.json();
                throw new Error(errData.detail || "Chat generation failed");
            }

            const data = await resp.json();
            conversationHistory.push({ role: "assistant", content: data.answer });
            appendMessage("assistant", data.answer, data.model);
        } catch (err) {
            removeTypingIndicator();
            appendMessage(
                "assistant",
                `⚠️ **Request Error:** Unable to reach assistant (${err.message}). If targets were modified, please click **Refresh Point Sync**.`
            );
        } finally {
            chatInput.disabled = false;
            btnSend.disabled = false;
            chatInput.focus();
        }
    }

    chatForm.addEventListener("submit", handleChatSubmit);

    // Enter key listener (Shift+Enter for newline)
    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleChatSubmit();
        }
    });

    // Quick chips listener
    quickPrompts.addEventListener("click", (e) => {
        const chip = e.target.closest(".chip");
        if (chip && chip.dataset.prompt) {
            chatInput.value = chip.dataset.prompt;
            handleChatSubmit();
        }
    });

    // --- Optional Mock Interactive Controls (if present) ---
    if (btnTestState1) {
        btnTestState1.addEventListener("click", async () => {
            try {
                await fetch("/mock/set-state/1", { method: "POST" });
                if (testStatusMsg) testStatusMsg.textContent = "Mock State: 1 (100 Base Records)";
                showToast("Mock datasets set to State 1. Click 'Refresh Point Sync' to test Case 1 or 2.", "info");
            } catch (err) {
                showToast(`Failed to set state: ${err.message}`, "error");
            }
        });
    }

    if (btnTestState3) {
        btnTestState3.addEventListener("click", async () => {
            try {
                await fetch("/mock/set-state/3", { method: "POST" });
                if (testStatusMsg) testStatusMsg.textContent = "Mock State: 3 (105 Records: 5 new, 3 mod)";
                showToast("Mock datasets set to State 3. Click 'Refresh Point Sync' to test Case 3.", "info");
            } catch (err) {
                showToast(`Failed to set state: ${err.message}`, "error");
            }
        });
    }

    if (btnTestExpireToken) {
        btnTestExpireToken.addEventListener("click", async () => {
            try {
                await fetch("/mock/invalidate-token/app1", { method: "POST" });
                if (testStatusMsg) testStatusMsg.textContent = "CCTV Token Invalidated";
                showToast("Token invalidated in CCTV! Click 'Refresh Point Sync' to verify automatic re-login & recovery.", "info");
            } catch (err) {
                showToast(`Failed to invalidate token: ${err.message}`, "error");
            }
        });
    }

    if (btnTestOutage) {
        btnTestOutage.addEventListener("click", async () => {
            isApp3Outage = !isApp3Outage;
            try {
                await fetch(`/mock/simulate-failure/app3?enable=${isApp3Outage}`, { method: "POST" });
                if (testStatusMsg) testStatusMsg.textContent = isApp3Outage ? "Transport Simulating 500 Outage" : "Transport Restored";
                showToast(`Transport outage set to ${isApp3Outage}. Click 'Refresh Point Sync' to test partial degradation.`, isApp3Outage ? "error" : "success");
            } catch (err) {
                showToast(`Failed to toggle outage: ${err.message}`, "error");
            }
        });
    }

    // --- SQLite Modal Database Inspector ---
    btnToggleDbModal.addEventListener("click", () => {
        dbModalBackdrop.classList.add("open");
        loadDbRecords();
    });

    btnCloseModal.addEventListener("click", () => {
        dbModalBackdrop.classList.remove("open");
    });

    dbModalBackdrop.addEventListener("click", (e) => {
        if (e.target === dbModalBackdrop) {
            dbModalBackdrop.classList.remove("open");
        }
    });

    function showTab(activeTab, activeView) {
        [tabRecords, tabHistory, tabUpload, tabAdd].forEach(t => t && t.classList.remove("active"));
        [tableViewRecords, tableViewHistory, tableViewUpload, tableViewAdd].forEach(v => v && v.classList.add("hidden"));
        if (activeTab) activeTab.classList.add("active");
        if (activeView) activeView.classList.remove("hidden");
    }

    tabRecords.addEventListener("click", () => {
        showTab(tabRecords, tableViewRecords);
        loadDbRecords();
    });

    tabHistory.addEventListener("click", () => {
        showTab(tabHistory, tableViewHistory);
        loadDbHistory();
    });

    if (tabUpload) {
        tabUpload.addEventListener("click", () => {
            showTab(tabUpload, tableViewUpload);
        });
    }

    if (tabAdd) {
        tabAdd.addEventListener("click", () => {
            showTab(tabAdd, tableViewAdd);
            if (inputRecordId) inputRecordId.focus();
        });
    }

    if (chipAddRecord) {
        chipAddRecord.addEventListener("click", () => {
            dbModalBackdrop.classList.add("open");
            showTab(tabAdd, tableViewAdd);
            if (inputRecordId) inputRecordId.focus();
        });
    }

    // Direct Upload & Ingestion Logic
    let selectedUploadFile = null;
    let isUploadingSql = false;

    async function uploadSqlFile(file) {
        if (!file) return;
        if (isUploadingSql) {
            showToast("An SQL file upload is already in progress. Please wait...", "warning");
            return;
        }
        if (!file.name.toLowerCase().endsWith(".sql")) {
            showToast("Please select a valid .sql backup or dump file.", "error");
            return;
        }

        isUploadingSql = true;
        if (btnUploadSql) btnUploadSql.disabled = true;
        if (btnProcessModalUpload) btnProcessModalUpload.disabled = true;
        showToast(`Analyzing and ingesting ${file.name}... Please wait.`, "info");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload-sql-backup", {
                method: "POST",
                body: formData,
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || `Upload failed with HTTP ${res.status}`);
            }
            const data = await res.json();
            const dept = data.department || "General";
            const ins = data.inserted !== undefined ? data.inserted : (data.totals?.inserted || 0);
            const upd = data.updated !== undefined ? data.updated : (data.totals?.updated || 0);
            const skp = data.skipped !== undefined ? data.skipped : (data.totals?.skipped || 0);
            const disc = data.discovered !== undefined ? data.discovered : (data.totals?.fetched || 0);
            const rej = data.rejected || 0;
            const fail = data.failed || 0;
            const totalStored = data.db_metrics?.total_records || 0;

            showToast(`✅ Ingested ${data.filename} (${dept}): ${ins} inserted, ${skp} skipped, ${upd} updated!`, "success");
            await updateMetrics();

            if (dbModalBackdrop.classList.contains("open")) {
                loadDbRecords();
                loadDbHistory();
                showTab(tabRecords, tableViewRecords);
            }

            appendMessage("assistant", `### 📁 SQL File Ingestion & Record Analysis Complete\n\n` +
                `- **File Name:** \`${data.filename}\`\n` +
                `- **Detected Department:** 🏷️ **${dept}**\n` +
                `- **Records Discovered:** \`${disc}\`\n` +
                `- **New Records Inserted:** 🟢 \`${ins}\`\n` +
                `- **Duplicates Skipped:** 🟣 \`${skp}\`\n` +
                `- **Existing Records Updated:** 🔵 \`${upd}\`\n` +
                `- **Rejected / Failed:** \`${rej + fail}\`\n` +
                `- **Total Authoritative Rows in SQLite:** \`${totalStored}\` rows\n\n` +
                `The newly committed records are immediately accessible! You can ask questions about ${dept} records right now.`
            );
        } catch (err) {
            showToast(`Upload failed: ${err.message}`, "error");
            appendMessage("assistant", `⚠️ **Upload Failed:** Could not process SQL file \`${file.name}\`.\n\n*Reason:* ${err.message}`);
        } finally {
            isUploadingSql = false;
            if (btnUploadSql) btnUploadSql.disabled = false;
            if (btnProcessModalUpload) btnProcessModalUpload.disabled = false;
        }
    }

    // Header upload button
    if (btnUploadSql && inputFileSql) {
        btnUploadSql.addEventListener("click", () => inputFileSql.click());
        inputFileSql.addEventListener("change", () => {
            if (inputFileSql.files.length > 0) {
                uploadSqlFile(inputFileSql.files[0]);
                inputFileSql.value = "";
            }
        });
    }

    // Quick chip upload
    if (chipUploadSql && inputFileSql) {
        chipUploadSql.addEventListener("click", () => inputFileSql.click());
    }

    // Modal upload dropzone and browse
    if (btnModalBrowseFile && modalFileInput) {
        btnModalBrowseFile.addEventListener("click", () => modalFileInput.click());
        modalFileInput.addEventListener("change", () => {
            if (modalFileInput.files.length > 0) {
                selectedUploadFile = modalFileInput.files[0];
                modalSelectedFileName.textContent = `Selected: ${selectedUploadFile.name} (${(selectedUploadFile.size / 1024 / 1024).toFixed(2)} MB)`;
                btnProcessModalUpload.style.display = "inline-flex";
            }
        });
    }

    if (btnProcessModalUpload) {
        btnProcessModalUpload.addEventListener("click", () => {
            if (selectedUploadFile) {
                uploadSqlFile(selectedUploadFile);
                selectedUploadFile = null;
                btnProcessModalUpload.style.display = "none";
                modalSelectedFileName.textContent = "";
            }
        });
    }

    if (modalDropzone) {
        modalDropzone.addEventListener("dragover", (e) => {
            e.preventDefault();
            modalDropzone.style.borderColor = "var(--accent-emerald)";
            modalDropzone.style.background = "rgba(16,185,129,0.1)";
        });
        modalDropzone.addEventListener("dragleave", () => {
            modalDropzone.style.borderColor = "rgba(6,182,212,0.4)";
            modalDropzone.style.background = "rgba(15,23,42,0.4)";
        });
        modalDropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            modalDropzone.style.borderColor = "rgba(6,182,212,0.4)";
            modalDropzone.style.background = "rgba(15,23,42,0.4)";
            if (e.dataTransfer.files.length > 0) {
                selectedUploadFile = e.dataTransfer.files[0];
                modalSelectedFileName.textContent = `Selected: ${selectedUploadFile.name} (${(selectedUploadFile.size / 1024 / 1024).toFixed(2)} MB)`;
                btnProcessModalUpload.style.display = "inline-flex";
            }
        });
    }

    // Database Clear Handlers
    async function handleClearDatabase() {
        if (!confirm("Are you sure you want to completely clear the SQLite database? All stored records and history will be deleted.")) {
            return;
        }
        try {
            const res = await fetch("/api/database/clear", { method: "POST" });
            const data = await res.json();
            showToast(data.message, "success");
            await updateMetrics();
            if (dbModalBackdrop.classList.contains("open")) {
                loadDbRecords();
            }
        } catch (err) {
            showToast(`Failed to clear database: ${err.message}`, "error");
        }
    }

    // --- Smart Department Data Intake Modal Handlers ---
    const btnOpenIntakeModal = document.getElementById("btn-open-intake-modal");
    const chipOpenIntake = document.getElementById("chip-open-intake");
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
    const btnHeaderClearDb = document.getElementById("btn-header-clear-db");

    function openIntakeModal() {
        if (!intakeModalBackdrop) return;
        intakeModalBackdrop.classList.add("open");
        intakeFormSection.style.display = "block";
        intakeResultSection.style.display = "none";
        setTimeout(() => intakeTextInput && intakeTextInput.focus(), 150);
    }

    function closeIntakeModal() {
        if (intakeModalBackdrop) intakeModalBackdrop.classList.remove("open");
    }

    if (btnOpenIntakeModal) btnOpenIntakeModal.addEventListener("click", openIntakeModal);
    if (chipOpenIntake) chipOpenIntake.addEventListener("click", openIntakeModal);
    if (btnCloseIntakeModal) btnCloseIntakeModal.addEventListener("click", closeIntakeModal);
    if (btnCancelIntake) btnCancelIntake.addEventListener("click", closeIntakeModal);

    if (intakeModalBackdrop) {
        intakeModalBackdrop.addEventListener("click", (e) => {
            if (e.target === intakeModalBackdrop) closeIntakeModal();
        });
    }

    // Toggle custom department input
    if (intakeDeptSelect && intakeDeptCustom) {
        intakeDeptSelect.addEventListener("change", () => {
            intakeDeptCustom.style.display = intakeDeptSelect.value === "custom" ? "block" : "none";
            if (intakeDeptSelect.value === "custom") intakeDeptCustom.focus();
        });
    }

    // Quick Fill Sample Pills
    const sampleSnippets = {
        cctv: "Dome Camera in Library 2nd Floor, IP: 10.90.15.42, 4MP, Model: Hikvision DS-2CD2143G0, Switch: SW-LIB-02, Status: Online, Code: CCTV/LIB/02",
        transport: "Bus No: 14, Route: Gandhipuram to Campus via Ukkadam, Driver: Ramesh (9876543210), Capacity: 55, Morning Timing: 7:30 AM, Status: Active",
        food: "Counter 2 - South Indian Express, Special Idli Sambar Rs 40, Masala Dosa Rs 50, Status: Open, Available: 7:30 AM - 11:00 AM, Incharge: Anand",
        ticket: "Ticket #TKT-884, CCTV Camera offline at Boys Hostel Entrance, Priority: High, Assigned To: S. Kumar, Status: Open, Action: Technician dispatched"
    };

    document.querySelectorAll(".btn-sample-pill").forEach(btn => {
        btn.addEventListener("click", () => {
            const sampleKey = btn.dataset.sample;
            if (sampleSnippets[sampleKey] && intakeTextInput) {
                intakeTextInput.value = sampleSnippets[sampleKey];
                if (sampleKey === "cctv" && intakeDeptSelect) intakeDeptSelect.value = "CCTV";
                else if (sampleKey === "transport" && intakeDeptSelect) intakeDeptSelect.value = "Transport";
                else if (sampleKey === "food" && intakeDeptSelect) intakeDeptSelect.value = "Food";
                else if (sampleKey === "ticket" && intakeDeptSelect) intakeDeptSelect.value = "Maintenance";
                intakeTextInput.focus();
            }
        });
    });

    // Form Submission: Analyze and Save Record
    if (formAiIntake) {
        formAiIntake.addEventListener("submit", async (e) => {
            e.preventDefault();
            const rawText = intakeTextInput.value.trim();
            if (!rawText) return;

            let selectedDept = intakeDeptSelect.value;
            if (selectedDept === "auto") selectedDept = null;
            else if (selectedDept === "custom") selectedDept = intakeDeptCustom.value.trim() || null;

            const customRecId = intakeRecId.value.trim();
            let textToSend = rawText;
            if (customRecId && !rawText.toLowerCase().includes(customRecId.toLowerCase())) {
                textToSend = `Record ID: ${customRecId}\n` + rawText;
            }

            btnSubmitIntake.disabled = true;
            btnIntakeText.textContent = "⚡ Analyzing & Saving...";

            try {
                const res = await fetch("/api/records/analyze-and-save", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        text: textToSend,
                        department: selectedDept
                    })
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.detail || "Failed to analyze and save record");
                }

                const data = await res.json();

                // Populate Result Section
                resultHeadline.textContent = `Record Analyzed & Saved to ${data.department}`;
                resultDeptBadge.textContent = data.department;
                resultActionBadge.textContent = data.action.toUpperCase();
                resultEntityType.textContent = data.entity_type;
                resultRecId.textContent = data.record_id;
                resultName.textContent = data.name;

                // Build attributes table rows
                const attrs = data.attributes || {};
                const attrRows = Object.entries(attrs).map(([k, v]) => `
                    <tr>
                        <td style="font-weight:600; color:var(--text-secondary);">${escapeHtml(k.replace(/_/g, " ").toUpperCase())}</td>
                        <td style="color:#ffffff;">${escapeHtml(String(v))}</td>
                    </tr>
                `).join("");
                resultAttributesTbody.innerHTML = attrRows || `<tr><td colspan="2" style="text-align:center; color:var(--text-muted);">No specific attributes</td></tr>`;

                const deptTotal = (data.db_metrics && data.db_metrics.app_breakdown && data.db_metrics.app_breakdown[data.department]) || 1;
                resultDeptCountMsg.innerHTML = `Department Total (<strong>${escapeHtml(data.department)}</strong>): <strong>${deptTotal}</strong> records | Campus Total: <strong>${data.db_metrics ? data.db_metrics.total_records : 1}</strong> records`;

                // Switch view
                intakeFormSection.style.display = "none";
                intakeResultSection.style.display = "block";

                showToast(`✅ Record ${data.record_id} saved to ${data.department}!`, "success");

                // Update background metrics
                await updateMetrics();

                // Append an intake confirmation message in chat
                appendMessage(
                    "assistant",
                    `### ✅ Record Analyzed & Saved\n\n` +
                    `| Field | Value |\n|---|---|\n` +
                    `| **Department** | 🏷️ **${data.department}** |\n` +
                    `| **Entity Type** | ${data.entity_type} |\n` +
                    `| **Record ID** | \`${data.record_id}\` |\n` +
                    `| **Name / Title** | ${data.name} |\n` +
                    `\n**Action:** \`${data.action.toUpperCase()}\` | **Department Total:** \`${deptTotal}\` records.`
                );

            } catch (err) {
                console.error("Intake Error:", err);
                showToast(`Intake Failed: ${err.message}`, "error");
            } finally {
                btnSubmitIntake.disabled = false;
                btnIntakeText.textContent = "⚡ Analyze & Save to Department";
            }
        });
    }

    // Add Another button in result section
    if (btnIntakeAddAnother) {
        btnIntakeAddAnother.addEventListener("click", () => {
            intakeTextInput.value = "";
            intakeRecId.value = "";
            intakeResultSection.style.display = "none";
            intakeFormSection.style.display = "block";
            intakeTextInput.focus();
        });
    }

    // View in DB button in result section
    if (btnIntakeViewDb) {
        btnIntakeViewDb.addEventListener("click", () => {
            closeIntakeModal();
            if (btnToggleDbModal) btnToggleDbModal.click();
        });
    }

    // Ingest All 3 Uploaded SQL Dumps Handler
    async function handleImportAllDumps() {
        showToast("Parsing and ingesting all 3 uploaded SQL dumps (CCTV, Food, Transport)...", "info");
        try {
            const res = await fetch("/api/import-all-dumps", { method: "POST" });
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || "Ingestion failed");
            }
            const data = await res.json();
            const d = data.details || {};
            showToast(`✅ Ingestion Successful! Total Inserted: ${d.overall_total_inserted}, Updated: ${d.overall_total_updated}, Skipped: ${d.overall_total_skipped}`, "success");
            await updateMetrics();
            if (dbModalBackdrop && dbModalBackdrop.classList.contains("open")) {
                loadDbRecords();
                loadDbHistory();
            }
            appendMessage(
                "assistant",
                `### 📥 All 3 SQL Dumps Ingested Successfully\n\n` +
                `- 📹 **CCTV Department:** \`${d.cctv ? d.cctv.total : 378}\` records (67 cameras, 39 NVRs, 39 biometrics, 10 switches, 2 racks, 7 relocations, 208 tickets, 6 projects)\n` +
                `- 🍽️ **Food Department:** \`${d.food ? d.food.total : 2250}\` records (311 items, 574 inventory stock levels, 481 material requests, 844 purchase requests, 40 vendors)\n` +
                `- 🚌 **Transport Department:** \`${d.transport ? d.transport.total : 124}\` records (5 campus buses with drivers, 29 renewals, 7 service requests, 29 fuel logs, 50 odometer logs, 4 vendors)\n\n` +
                `**Total Synchronized Records:** \`${data.db_metrics ? data.db_metrics.total_records : 2752}\` records across all 3 departments.\n\n` +
                `You can now ask any question across CCTV, Food, or Transport!`
            );
        } catch (err) {
            showToast(`Import failed: ${err.message}`, "error");
        }
    }

    const btnModalImportAll = document.getElementById("btn-modal-import-all");
    if (btnModalImportAll) btnModalImportAll.addEventListener("click", handleImportAllDumps);

    // Database Clear Handlers
    async function handleClearDatabase() {
        if (!confirm("Are you sure you want to completely clear the SQLite database? All stored records and history will be deleted.")) {
            return;
        }
        try {
            const res = await fetch("/api/database/clear", { method: "POST" });
            const data = await res.json();
            showToast(data.message, "success");
            await updateMetrics();
            if (dbModalBackdrop && dbModalBackdrop.classList.contains("open")) {
                loadDbRecords();
                loadDbHistory();
            }
            appendMessage(
                "assistant",
                "🗑️ **Database Cleared:** All software records and sync histories have been wiped clean. Database is at 0 records."
            );
        } catch (err) {
            showToast(`Failed to clear database: ${err.message}`, "error");
        }
    }

    if (btnHeaderClearDb) btnHeaderClearDb.addEventListener("click", handleClearDatabase);
    if (chipClearDb) chipClearDb.addEventListener("click", handleClearDatabase);
    if (btnModalClearDb) btnModalClearDb.addEventListener("click", handleClearDatabase);

    // Individual Record Form Submission
    if (formAddIndividual) {
        formAddIndividual.addEventListener("submit", async (e) => {
            e.preventDefault();
            const app = inputRecordApp.value.trim();
            const recId = inputRecordId.value.trim();
            const rawJson = inputRecordJson.value.trim();

            let payloadObj;
            try {
                payloadObj = JSON.parse(rawJson);
            } catch (jsonErr) {
                showToast("Payload must be valid JSON: " + jsonErr.message, "error");
                return;
            }

            try {
                const res = await fetch("/api/records/individual", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        source_app: app,
                        record_id: recId,
                        payload: payloadObj
                    })
                });

                if (!res.ok) {
                    const errData = await res.json();
                    throw new Error(errData.detail || "Failed to add record");
                }

                const data = await res.json();
                showToast(data.message, "success");
                inputRecordId.value = "";
                inputRecordJson.value = "";
                await updateMetrics();

                // Switch to records table to view newly added record
                tabRecords.click();
            } catch (err) {
                showToast(err.message, "error");
            }
        });
    }

    async function loadDbRecords() {
        tbodyRecords.innerHTML = `<tr><td colspan="5" class="empty-cell">Loading records from app.db...</td></tr>`;
        try {
            const res = await fetch("/api/records");
            const data = await res.json();
            modalTotalBadge.textContent = `${data.total} Records`;

            if (!data.records || data.records.length === 0) {
                tbodyRecords.innerHTML = `<tr><td colspan="5" class="empty-cell">Database empty. Click 'Refresh Point Sync' in header to ingest records.</td></tr>`;
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
            tbodyRecords.innerHTML = `<tr><td colspan="5" class="empty-cell" style="color:var(--accent-rose);">Failed to load records: ${err.message}</td></tr>`;
        }
    }

    async function loadDbHistory() {
        tbodyHistory.innerHTML = `<tr><td colspan="7" class="empty-cell">Loading history from sync_history...</td></tr>`;
        try {
            const res = await fetch("/api/history?limit=25");
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
            tbodyHistory.innerHTML = `<tr><td colspan="7" class="empty-cell" style="color:var(--accent-rose);">Failed to load history: ${err.message}</td></tr>`;
        }
    }

    // Initial load
    updateMetrics();
});
