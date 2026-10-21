// ======================================================
// ScamShield AI Frontend
// ======================================================

const API_URL = "http://127.0.0.1:8000";

const HISTORY_KEY = "scamshield_history";
const LANG_KEY = "scamshield_lang";
const THEME_KEY = "scamshield_theme";

let scannerType = "message";
let currentLang = "en";

function t(key) {
    const pack = (typeof I18N !== "undefined" && I18N[currentLang]) || {};
    const fallback = (typeof I18N !== "undefined" && I18N.en) || {};
    return pack[key] || fallback[key] || key;
}

function localizeLevel(level) {
    if (level === "High Risk") {
        return t("highRisk");
    }
    if (level === "Medium Risk") {
        return t("mediumRisk");
    }
    return t("lowRisk");
}


// ======================================================
// PAGE NAVIGATION
// ======================================================

function showPage(page) {

    const views = {
        dashboard: document.getElementById("dashboardView"),
        history: document.getElementById("historyView"),
        safety: document.getElementById("safetyView"),
        about: document.getElementById("aboutView")
    };

    const sideLinks =
        document.querySelectorAll(".side-link");


    sideLinks.forEach(
        link => link.classList.remove("active")
    );


    Object.values(views).forEach(
        view => view.classList.remove("active")
    );


    if (views[page]) {
        views[page].classList.add("active");
    } else {
        views.dashboard.classList.add("active");
        page = "dashboard";
    }


    const activeLink =
        document.querySelector(
            `.side-link[data-page="${page}"]`
        );

    if (activeLink) {
        activeLink.classList.add("active");
    }


    if (page === "history") {
        renderHistoryPage();
    }


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ======================================================
// SCANNER TYPE
// ======================================================

function setScannerType(type) {

    scannerType = type;

    const messageTab =
        document.getElementById("messageTab");

    const urlTab =
        document.getElementById("urlTab");

    const input =
        document.getElementById("scanInput");


    messageTab.classList.remove("active");
    urlTab.classList.remove("active");


    if (type === "message") {

        messageTab.classList.add("active");

        input.placeholder = t("pasteMessage");

    } else {

        urlTab.classList.add("active");

        input.placeholder = t("pasteUrl");

    }

}


// ======================================================
// CHARACTER COUNTER
// ======================================================

function updateCounter() {

    const input =
        document.getElementById("scanInput");

    const counter =
        document.getElementById("counter");

    counter.textContent =
        `${input.value.length} / 2000`;

}


// ======================================================
// SIDEBAR
// ======================================================

function focusScanner(type) {

    setScannerType(type);

    const input =
        document.getElementById("scanInput");

    input.focus();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ======================================================
// ANALYZE
// ======================================================

async function analyzeContent() {

    const input =
        document.getElementById("scanInput");

    const content =
        input.value.trim();


    if (!content) {

        alert(t("pasteFirst"));

        input.focus();

        return;
    }


    const button =
        document.querySelector(".analyze-btn");


    const originalText =
        button.innerHTML;


    button.disabled = true;

    button.innerHTML = t("analyzing");


    try {

        const response =
            await fetch(
                `${API_URL}/api/analyze`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        content: content,
                        scan_type: scannerType,
                        language: currentLang
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Analysis failed."
            );

        }


        updateDashboard(data);


    } catch (error) {

        console.warn(error);
        updateDashboard(localAnalyze(content, scannerType));

    } finally {

        button.disabled = false;

        button.innerHTML =
            originalText;

    }

}


// ======================================================
// UPDATE DASHBOARD
// ======================================================

function updateDashboard(data) {

    // -----------------------------------------------
    // Risk number & gauge needle
    // -----------------------------------------------

    const riskNumber =
        document.getElementById("riskNumber");

    riskNumber.textContent =
        data.risk_score;

    updateGaugeNeedle(
        data.risk_score,
        data.risk_level
    );


    // -----------------------------------------------
    // Risk status
    // -----------------------------------------------

    const riskStatus =
        document.getElementById("riskStatus") ||
        document.querySelector(".risk-status");

    riskStatus.textContent =
        localizeLevel(data.risk_level);


    // -----------------------------------------------
    // Risk status color
    // -----------------------------------------------

    const riskCard =
        document.getElementById("riskCard") ||
        document.querySelector(".risk-card");

    const warningBox =
        document.getElementById("riskWarning") ||
        document.querySelector(".risk-warning");

    const warningIcon =
        warningBox.querySelector(".warning-icon");

    riskCard.classList.remove("high", "medium", "low");
    warningBox.classList.remove("high", "medium", "low");


    if (data.risk_level === "High Risk") {

        riskStatus.style.color = "#ff315d";
        riskCard.classList.add("high");
        warningBox.classList.add("high");
        warningIcon.textContent = "!";

    } else if (data.risk_level === "Medium Risk") {

        riskStatus.style.color = "#ffb52e";
        riskCard.classList.add("medium");
        warningBox.classList.add("medium");
        warningIcon.textContent = "!";

    } else {

        riskStatus.style.color = "#27df8c";
        riskCard.classList.add("low");
        warningBox.classList.add("low");
        warningIcon.textContent = "✓";

    }


    // -----------------------------------------------
    // Warning message
    // -----------------------------------------------

    const warning =
        warningBox.querySelector("p");

    if (data.risk_level === "High Risk") {

        warning.textContent = t("warnHigh");

    } else if (data.risk_level === "Medium Risk") {

        warning.textContent = t("warnMedium");

    } else {

        warning.textContent = t("warnLow");

    }


    // -----------------------------------------------
    // AI explanation
    // -----------------------------------------------

    const explanation =
        document.getElementById("aiExplanation");

    explanation.textContent =
        data.explanation;


    // -----------------------------------------------
    // Bottom line
    // -----------------------------------------------

    const bottomLine =
        document.getElementById("bottomLine");

    bottomLine.textContent =
        data.summary;


    // -----------------------------------------------
    // Indicators
    // -----------------------------------------------

    renderIndicators(
        data.indicators
    );


    // -----------------------------------------------
    // Do / Don't
    // -----------------------------------------------

    renderActions(
        data.dont,
        data.do
    );


    // -----------------------------------------------
    // History
    // -----------------------------------------------

    addHistoryRow(data, true);


    // -----------------------------------------------
    // Scroll
    // -----------------------------------------------

    document
        .querySelector(".analysis-grid")
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

}


// ======================================================
// RENDER INDICATORS
// ======================================================

function renderIndicators(indicators) {

    const card =
        document.querySelector(".indicators-card");


    const title =
        card.querySelector(".card-title");


    // Remove old indicators
    card
        .querySelectorAll(".indicator")
        .forEach(
            element => element.remove()
        );


    indicators.forEach(
        (indicator, index) => {

            const div =
                document.createElement("div");

            div.className =
                "indicator";


            let iconClass =
                "blue";

            let icon =
                "⚠";


            if (
                indicator.level ===
                "High Risk"
            ) {

                iconClass = "red";
                icon = "!";

            } else if (
                indicator.level ===
                "Medium Risk"
            ) {

                iconClass = "yellow";
                icon = "⚠";

            } else {

                iconClass = "green";
                icon = "✓";

            }


            const pillClass =
                indicator.level === "High Risk"
                    ? "high"
                    : indicator.level === "Medium Risk"
                        ? "medium"
                        : "low";


            div.innerHTML = `

                <div class="indicator-icon ${iconClass}">
                    ${icon}
                </div>

                <div class="indicator-info">

                    <strong>
                        ${escapeHtml(indicator.title)}
                    </strong>

                    <p>
                        ${escapeHtml(indicator.description)}
                    </p>

                </div>

                <span class="risk-pill ${pillClass}">
                    ${escapeHtml(localizeLevel(indicator.level))}
                </span>

            `;


            card.appendChild(div);

        }
    );

}


// ======================================================
// RENDER ACTIONS
// ======================================================

function renderActions(dont, doList) {

    const dontBox =
        document.querySelector(".dont-box ul");

    const doBox =
        document.querySelector(".do-box ul");


    dontBox.innerHTML = "";

    doBox.innerHTML = "";


    dont.forEach(
        item => {

            const li =
                document.createElement("li");

            li.textContent =
                item;

            dontBox.appendChild(li);

        }
    );


    doList.forEach(
        item => {

            const li =
                document.createElement("li");

            li.textContent =
                item;

            doBox.appendChild(li);

        }
    );


    syncSafetyPanels(dont, doList);

}


function syncSafetyPanels(dont, doList) {

    const dontPanel =
        document.getElementById("safetyDontPanel");

    const doPanel =
        document.getElementById("safetyDoPanel");


    if (!dontPanel || !doPanel) {
        return;
    }


    dontPanel.innerHTML =
        "<ul>" +
        dont.map(item => `<li>${escapeHtml(item)}</li>`).join("") +
        "</ul>";

    doPanel.innerHTML =
        "<ul>" +
        doList.map(item => `<li>${escapeHtml(item)}</li>`).join("") +
        "</ul>";

}


// ======================================================
// GAUGE NEEDLE
// ======================================================

function updateGaugeNeedle(score, riskLevel) {

    const needle =
        document.getElementById("gaugeNeedle");

    const riskNumber =
        document.getElementById("riskNumber");

    const rotation =
        -90 + (score / 100) * 180;


    needle.style.transform =
        `rotate(${rotation}deg)`;


    needle.classList.remove("high", "medium", "low");
    riskNumber.classList.remove("risk-high", "risk-medium", "risk-low");


    if (riskLevel === "High Risk") {

        needle.classList.add("high");
        riskNumber.classList.add("risk-high");

    } else if (riskLevel === "Medium Risk") {

        needle.classList.add("medium");
        riskNumber.classList.add("risk-medium");

    } else {

        needle.classList.add("low");
        riskNumber.classList.add("risk-low");

    }

}


// ======================================================
// HISTORY
// ======================================================

function getHistory() {

    try {

        const stored =
            localStorage.getItem(HISTORY_KEY);

        return stored
            ? JSON.parse(stored)
            : [];

    } catch (error) {

        return [];

    }

}


function saveHistory(history) {

    localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify(history)
    );

}


function seedDefaultHistory() {

    if (getHistory().length > 0) {
        return;
    }


    const defaults = [
        {
            content: "Congratulations! You have been selected for an internship...",
            preview: "Congratulations! You have been selected for an internship...",
            risk_score: 94,
            risk_level: "High Risk",
            scan_type: "message",
            timestamp: Date.now() - 2 * 60 * 1000
        },
        {
            content: "https://bit.ly/free-gift-card-2024",
            preview: "https://bit.ly/free-gift-card-2024",
            risk_score: 88,
            risk_level: "High Risk",
            scan_type: "url",
            timestamp: Date.now() - 15 * 60 * 1000
        },
        {
            content: "Dear user, your account will be blocked...",
            preview: "Dear user, your account will be blocked...",
            risk_score: 76,
            risk_level: "Medium Risk",
            scan_type: "message",
            timestamp: Date.now() - 60 * 60 * 1000
        }
    ];


    saveHistory(defaults);

}


function formatTimeAgo(timestamp) {

    const diff =
        Date.now() - timestamp;

    const minutes =
        Math.floor(diff / 60000);

    const hours =
        Math.floor(diff / 3600000);

    const days =
        Math.floor(diff / 86400000);


    if (minutes < 1) {
        return t("justNow");
    }

    if (minutes < 60) {
        return `${minutes} ${minutes > 1 ? t("minsAgo") : t("minAgo")}`;
    }

    if (hours < 24) {
        return `${hours} ${hours > 1 ? t("hoursAgo") : t("hourAgo")}`;
    }

    return `${days} ${days > 1 ? t("daysAgo") : t("dayAgo")}`;

}


function getScoreClass(riskLevel) {

    if (riskLevel === "High Risk") {
        return "score-red";
    }

    if (riskLevel === "Medium Risk") {
        return "score-orange";
    }

    return "score-green";

}


function getBadgeClass(riskLevel) {

    if (riskLevel === "High Risk") {
        return "red";
    }

    if (riskLevel === "Medium Risk") {
        return "orange";
    }

    return "green";

}


function buildHistoryRowHtml(item, rowClass) {

    const preview =
        item.preview.length > 65
            ? item.preview.substring(0, 65) + "..."
            : item.preview;

    const scoreClass =
        getScoreClass(item.risk_level);

    const badgeClass =
        getBadgeClass(item.risk_level);

    const time =
        formatTimeAgo(item.timestamp);


    return `

        <div class="${rowClass}">

            <span class="scan-type">
                ${item.scan_type === "url" ? "🔗" : "▣"}
            </span>

            <span class="preview">
                ${escapeHtml(preview)}
            </span>

            <span class="${scoreClass}">
                ${item.risk_score}/100
            </span>

            <span class="result-badge ${badgeClass}">
                ${escapeHtml(localizeLevel(item.risk_level))}
            </span>

            <span class="time">
                ${time}
            </span>

            ${rowClass === "scan-row"
                ? "<span>⋮</span>"
                : ""}

        </div>

    `;

}


function renderRecentScans() {

    const recentCard =
        document.querySelector(".recent-card");

    const insertPoint =
        document.getElementById("recentScanRows")
        || recentCard.querySelector(".history-link");


    recentCard
        .querySelectorAll(".scan-row")
        .forEach(row => row.remove());


    const history = getHistory();


    history.slice(0, 5).forEach(item => {

        insertPoint.insertAdjacentHTML(
            "beforebegin",
            buildHistoryRowHtml(item, "scan-row")
        );

    });

}


function renderHistoryPage() {

    const historyList =
        document.getElementById("historyList");

    const emptyHistory =
        document.getElementById("emptyHistory");

    const historyCount =
        document.getElementById("historyCount");

    const history = getHistory();


    historyCount.textContent =
        `${history.length} scan${history.length !== 1 ? "s" : ""}`;


    historyList
        .querySelectorAll(".history-row")
        .forEach(row => row.remove());


    if (history.length === 0) {

        emptyHistory.style.display = "block";
        return;

    }


    emptyHistory.style.display = "none";


    history.forEach(item => {

        historyList.insertAdjacentHTML(
            "beforeend",
            buildHistoryRowHtml(item, "history-row")
        );

    });

}


function addHistoryRow(data, save) {

    const input =
        document.getElementById("scanInput");

    let preview =
        input.value.trim();


    if (preview.length > 65) {
        preview = preview.substring(0, 65) + "...";
    }


    const item = {
        content: input.value.trim(),
        preview: preview,
        risk_score: data.risk_score,
        risk_level: data.risk_level,
        scan_type: data.scan_type,
        timestamp: Date.now()
    };


    if (save) {

        const history = getHistory();

        history.unshift(item);

        saveHistory(history.slice(0, 50));

    }


    renderRecentScans();

}


// ======================================================
// SAFETY TIPS PANELS
// ======================================================

function showSafetyPanel(type) {

    const dontPanel =
        document.getElementById("safetyDontPanel");

    const doPanel =
        document.getElementById("safetyDoPanel");

    const buttons =
        document.querySelectorAll(".safety-toggle-btn");


    buttons.forEach(btn => btn.classList.remove("active"));


    if (type === "dont") {

        dontPanel.classList.add("active");
        doPanel.classList.remove("active");
        document.querySelector(".safety-toggle-btn.dont-btn").classList.add("active");

    } else {

        doPanel.classList.add("active");
        dontPanel.classList.remove("active");
        document.querySelector(".safety-toggle-btn.do-btn").classList.add("active");

    }

}


function showSafetyPagePanel(type) {

    const dontPanel =
        document.getElementById("safetyPageDont");

    const doPanel =
        document.getElementById("safetyPageDo");

    const dontBtn =
        document.getElementById("safetyPageDontBtn");

    const doBtn =
        document.getElementById("safetyPageDoBtn");


    dontBtn.classList.remove("active");
    doBtn.classList.remove("active");
    dontPanel.classList.remove("active");
    doPanel.classList.remove("active");


    if (type === "dont") {

        dontBtn.classList.add("active");
        dontPanel.classList.add("active");

    } else {

        doBtn.classList.add("active");
        doPanel.classList.add("active");

    }

}


// ======================================================
// INIT
// ======================================================

function initApp() {

    seedDefaultHistory();
    renderRecentScans();

    updateGaugeNeedle(94, "High Risk");

}


document.addEventListener("DOMContentLoaded", initApp);


// ======================================================
// HTML ESCAPE
// ======================================================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ======================================================
// THEME BUTTON
// ======================================================

const themeButton =
    document.getElementById("themeBtn");


if (themeButton) {

    themeButton.addEventListener(
        "click",
        function () {

            document.body.classList.toggle(
                "soft-mode"
            );

        }
    );

}