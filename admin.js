const PROJECT_KEY = "capbuuPortfolioProjects";
const ADMIN_HASH_KEY = "capbuuAdminPasswordHash";
const ADMIN_SESSION_KEY = "capbuuAdminUnlocked";

let projects = [];
let currentId = "";

const authPanel = document.getElementById("authPanel");
const adminApp = document.getElementById("adminApp");
const authForm = document.getElementById("authForm");
const authHelp = document.getElementById("authHelp");
const authButton = document.getElementById("authButton");
const authMessage = document.getElementById("authMessage");
const passwordInput = document.getElementById("adminPassword");
const resetPasswordButton = document.getElementById("resetPasswordButton");
const projectPicker = document.getElementById("projectPicker");
const projectForm = document.getElementById("projectForm");
const editorTitle = document.getElementById("editorTitle");
const preview = document.getElementById("adminPreview");

function notify(message, success = true) {
    const box = document.getElementById("popupNotification");
    const text = document.getElementById("popupMessage");
    if (!box || !text) return;
    text.textContent = message;
    box.classList.toggle("fail", !success);
    box.hidden = false;
    box.classList.add("active");
    setTimeout(() => box.classList.remove("active"), 3600);
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function hashText(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return [...new Uint8Array(digest)].map((item) => item.toString(16).padStart(2, "0")).join("");
}

function getStoredProjects() {
    try {
        const saved = localStorage.getItem(PROJECT_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch {
        localStorage.removeItem(PROJECT_KEY);
    }
    return structuredClone(window.PORTFOLIO_DEFAULT_PROJECTS || []);
}

function saveProjects() {
    try {
        localStorage.setItem(PROJECT_KEY, JSON.stringify(projects));
        notify("Website content saved in this browser.");
    } catch (error) {
        notify("Could not save. Uploaded media may be too large for browser storage.", false);
    }
}

function slugify(value) {
    return String(value || "new-project")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 48) || "new-project";
}

function linesToArray(value) {
    return String(value || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
}

function arrayToLines(value) {
    return Array.isArray(value) ? value.join("\n") : "";
}

function projectLink(project) {
    return `project.html?id=${encodeURIComponent(project.id)}`;
}

function currentProject() {
    return projects.find((project) => project.id === currentId) || projects[0];
}

function readFormProject() {
    const data = new FormData(projectForm);
    return {
        id: slugify(data.get("id")),
        title: String(data.get("title") || "Untitled Project").trim(),
        statusLabel: String(data.get("statusLabel") || "In development").trim(),
        statusType: String(data.get("statusType") || "progress").trim(),
        type: String(data.get("type") || "").trim(),
        genre: String(data.get("genre") || "").trim(),
        platform: String(data.get("platform") || "").trim(),
        role: String(data.get("role") || "").trim(),
        focus: String(data.get("focus") || "").trim(),
        linkUrl: String(data.get("linkUrl") || "").trim(),
        linkLabel: String(data.get("linkLabel") || "").trim(),
        logo: String(data.get("logo") || "").trim(),
        cover: String(data.get("cover") || "").trim(),
        tagline: String(data.get("tagline") || "").trim(),
        summary: String(data.get("summary") || "").trim(),
        overview: String(data.get("overview") || "").trim(),
        loop: String(data.get("loop") || "").trim(),
        technical: String(data.get("technical") || "").trim(),
        signal: String(data.get("signal") || "").trim(),
        screenshots: linesToArray(data.get("screenshots")),
        videos: linesToArray(data.get("videos")),
    };
}

function fillForm(project) {
    if (!project) return;
    editorTitle.textContent = project.title || "Project Details";
    for (const [key, value] of Object.entries(project)) {
        const field = projectForm.elements[key];
        if (!field) continue;
        if (key === "screenshots" || key === "videos") {
            field.value = arrayToLines(value);
        } else {
            field.value = value || "";
        }
    }
    renderPicker();
    renderPreview();
}

function updateCurrentFromForm() {
    const updated = readFormProject();
    const index = projects.findIndex((project) => project.id === currentId);
    const duplicate = projects.find((project, itemIndex) => project.id === updated.id && itemIndex !== index);
    if (duplicate) {
        notify("Project ID already exists. Pick a unique ID.", false);
        return false;
    }
    if (index >= 0) {
        projects[index] = updated;
    } else {
        projects.push(updated);
    }
    currentId = updated.id;
    fillForm(updated);
    return true;
}

function renderPicker() {
    projectPicker.innerHTML = projects.map((project) => `
        <button type="button" class="${project.id === currentId ? "active" : ""}" data-id="${escapeHtml(project.id)}">
            <span>${escapeHtml(project.title)}</span>
            <small>${escapeHtml(project.statusLabel || "Draft")}</small>
        </button>
    `).join("");
}

function renderPreview() {
    const project = readFormProject();
    preview.innerHTML = `
        <article class="project-card">
            <a href="${projectLink(project)}" class="project-media landscape">
                <img src="${escapeHtml(project.cover || project.logo || "capbuu games.png")}" alt="${escapeHtml(project.title)} preview">
            </a>
            <div class="project-body">
                <span class="status ${escapeHtml(project.statusType)}">${escapeHtml(project.statusLabel)}</span>
                <h3>${escapeHtml(project.title)}</h3>
                <p>${escapeHtml(project.tagline || project.summary || "Project description preview.")}</p>
                <a href="${projectLink(project)}">Open case study</a>
            </div>
        </article>
    `;
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function addFilesToTextarea(input, fieldName) {
    const files = [...input.files];
    if (!files.length) return;
    const field = projectForm.elements[fieldName];
    const existing = linesToArray(field.value);
    for (const file of files) {
        existing.push(await readFileAsDataUrl(file));
    }
    field.value = arrayToLines(existing);
    input.value = "";
    renderPreview();
}

async function putFileInField(input, fieldName) {
    const file = input.files?.[0];
    if (!file) return;
    projectForm.elements[fieldName].value = await readFileAsDataUrl(file);
    input.value = "";
    renderPreview();
}

function newProject() {
    const baseId = "new-project";
    let id = baseId;
    let count = 2;
    while (projects.some((project) => project.id === id)) {
        id = `${baseId}-${count}`;
        count += 1;
    }
    const project = {
        id,
        title: "New Project",
        statusLabel: "In development",
        statusType: "progress",
        type: "Mobile Game",
        genre: "Game",
        platform: "Android",
        role: "Solo Developer",
        focus: "Gameplay, UI, polish",
        logo: "capbuu games.png",
        cover: "capbuu games.png",
        linkUrl: "",
        linkLabel: "Open Project",
        tagline: "Short project tagline.",
        summary: "Write the main project summary here.",
        overview: "Describe the project, player experience, systems, and production goals.",
        loop: "Describe the gameplay loop.",
        technical: "Describe the technical work.",
        signal: "Describe why this project helps you get hired.",
        screenshots: ["capbuu games.png"],
        videos: []
    };
    projects.unshift(project);
    currentId = id;
    fillForm(project);
    saveProjects();
}

function duplicateProject() {
    const source = currentProject();
    if (!source) return;
    const copy = structuredClone(source);
    copy.id = `${source.id}-copy`;
    copy.title = `${source.title} Copy`;
    while (projects.some((project) => project.id === copy.id)) copy.id += "-copy";
    projects.unshift(copy);
    currentId = copy.id;
    fillForm(copy);
    saveProjects();
}

function deleteProject() {
    if (projects.length <= 1) {
        notify("Keep at least one project on the website.", false);
        return;
    }
    const project = currentProject();
    if (!project || !confirm(`Delete "${project.title}" from this browser?`)) return;
    projects = projects.filter((item) => item.id !== project.id);
    currentId = projects[0]?.id || "";
    fillForm(currentProject());
    saveProjects();
}

function exportBackup() {
    updateCurrentFromForm();
    const blob = new Blob([JSON.stringify(projects, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "capbuu-portfolio-projects.json";
    link.click();
    URL.revokeObjectURL(url);
}

function exportDataJs() {
    updateCurrentFromForm();
    const code = `window.PORTFOLIO_DEFAULT_PROJECTS = ${JSON.stringify(projects, null, 4)};\n`;
    const blob = new Blob([code], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "data.js";
    link.click();
    URL.revokeObjectURL(url);
    notify("Deployable data.js exported.");
}

async function importBackup(file) {
    if (!file) return;
    try {
        const text = await file.text();
        const imported = JSON.parse(text);
        if (!Array.isArray(imported)) throw new Error("Invalid backup");
        projects = imported;
        currentId = projects[0]?.id || "";
        fillForm(currentProject());
        saveProjects();
        notify("Backup imported.");
    } catch {
        notify("Could not import that backup file.", false);
    }
}

function resetDefaults() {
    if (!confirm("Reset projects to the original defaults?")) return;
    projects = structuredClone(window.PORTFOLIO_DEFAULT_PROJECTS || []);
    currentId = projects[0]?.id || "";
    localStorage.removeItem(PROJECT_KEY);
    fillForm(currentProject());
    notify("Default projects restored.");
}

function copyAnnouncement() {
    const project = readFormProject();
    const subject = `New from Capbuu Games: ${project.title}`;
    const body = `${project.title}\n\n${project.summary || project.tagline}\n\nSee it here: ${location.origin}${location.pathname.replace("admin.html", "")}${projectLink(project)}\n\n- Alok Sharma, Capbuu Games`;
    navigator.clipboard?.writeText(`Subject: ${subject}\n\n${body}`)
        .then(() => notify("Newsletter announcement copied."))
        .catch(() => notify("Could not copy announcement.", false));
}

function showApp() {
    authPanel.hidden = true;
    adminApp.hidden = false;
    projects = getStoredProjects();
    currentId = projects[0]?.id || "";
    fillForm(currentProject());
}

function showAuth() {
    authPanel.hidden = false;
    adminApp.hidden = true;
    const hasPassword = Boolean(localStorage.getItem(ADMIN_HASH_KEY));
    authHelp.textContent = hasPassword
        ? "Enter your dashboard password to edit projects and publish changes in this browser."
        : "Create a private dashboard password for this browser. Keep it somewhere safe.";
    authButton.textContent = hasPassword ? "Unlock Dashboard" : "Create Password";
}

authForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = passwordInput.value;
    if (password.length < 6) {
        authMessage.textContent = "Use at least 6 characters.";
        authMessage.classList.add("show");
        return;
    }

    const hash = await hashText(password);
    const stored = localStorage.getItem(ADMIN_HASH_KEY);
    if (!stored) {
        localStorage.setItem(ADMIN_HASH_KEY, hash);
        sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
        showApp();
        return;
    }

    if (stored === hash) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
        showApp();
    } else {
        authMessage.textContent = "Wrong password.";
        authMessage.classList.add("show");
    }
});

resetPasswordButton.addEventListener("click", () => {
    if (!confirm("Reset the dashboard password stored in this browser?")) return;
    localStorage.removeItem(ADMIN_HASH_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    passwordInput.value = "";
    showAuth();
});

projectPicker.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-id]");
    if (!button) return;
    updateCurrentFromForm();
    currentId = button.dataset.id;
    fillForm(currentProject());
});

projectForm.addEventListener("input", renderPreview);
document.getElementById("saveProjectButton").addEventListener("click", () => {
    if (updateCurrentFromForm()) saveProjects();
});
document.getElementById("newProjectButton").addEventListener("click", newProject);
document.getElementById("duplicateProjectButton").addEventListener("click", duplicateProject);
document.getElementById("deleteProjectButton").addEventListener("click", deleteProject);
document.getElementById("exportButton").addEventListener("click", exportBackup);
document.getElementById("exportDataButton").addEventListener("click", exportDataJs);
document.getElementById("importFile").addEventListener("change", (event) => importBackup(event.target.files?.[0]));
document.getElementById("resetDataButton").addEventListener("click", resetDefaults);
document.getElementById("lockButton").addEventListener("click", () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    showAuth();
});
document.getElementById("copyAnnouncementButton").addEventListener("click", copyAnnouncement);
document.getElementById("logoUpload").addEventListener("change", (event) => putFileInField(event.target, "logo"));
document.getElementById("coverUpload").addEventListener("change", (event) => putFileInField(event.target, "cover"));
document.getElementById("screenshotsUpload").addEventListener("change", (event) => addFilesToTextarea(event.target, "screenshots"));
document.getElementById("videoUpload").addEventListener("change", (event) => addFilesToTextarea(event.target, "videos"));

if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "true" && localStorage.getItem(ADMIN_HASH_KEY)) {
    showApp();
} else {
    showAuth();
}
