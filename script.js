const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");

if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("active");
    });

    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => navLinks.classList.remove("active"));
    });
}

let audioContext;

function playClickSound() {
    try {
        audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === "suspended") audioContext.resume();
        const now = audioContext.currentTime;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(420, now);
        oscillator.frequency.exponentialRampToValueAtTime(760, now + 0.055);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.035, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
    } catch {
        // Audio can be blocked by browser settings; the site should stay quiet instead of erroring.
    }
}

document.addEventListener("pointerup", (event) => {
    if (event.target.closest("a, button")) playClickSound();
});

const modal = document.getElementById("imageModal");
const modalImg = document.getElementById("modalImage");
const modalClose = document.getElementById("modalClose");

function openModal(src, alt) {
    if (!modal || !modalImg || !src) return;
    modalImg.src = src;
    modalImg.alt = alt || "Project image";
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeModal() {
    if (!modal) return;
    modal.classList.remove("active");
    document.body.style.overflow = "";
}

document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".modal-trigger");
    if (!trigger) return;
    const fallback = trigger.querySelector("img");
    openModal(trigger.dataset.image || fallback?.src, trigger.dataset.alt || fallback?.alt);
});

if (modal) {
    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });
}

if (modalClose) {
    modalClose.addEventListener("click", closeModal);
}

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
});

const popupNotification = document.getElementById("popupNotification");
const popupMessage = document.getElementById("popupMessage");
let popupTimeout;

function showPopup(message, success = true) {
    if (!popupNotification || !popupMessage) return;
    popupMessage.textContent = message;
    popupNotification.classList.toggle("fail", !success);
    popupNotification.hidden = false;
    popupNotification.classList.add("active");

    clearTimeout(popupTimeout);
    popupTimeout = setTimeout(() => {
        popupNotification.classList.remove("active");
        popupTimeout = setTimeout(() => {
            popupNotification.hidden = true;
        }, 260);
    }, 4200);
}

const PROJECT_STORAGE_KEY = "capbuuPortfolioProjects";

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getProjects() {
    try {
        const saved = localStorage.getItem(PROJECT_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length) return parsed;
        }
    } catch {
        localStorage.removeItem(PROJECT_STORAGE_KEY);
    }
    return Array.isArray(window.PORTFOLIO_DEFAULT_PROJECTS) ? window.PORTFOLIO_DEFAULT_PROJECTS : [];
}

function projectLink(project) {
    return `project.html?id=${encodeURIComponent(project.id)}`;
}

function statusClass(project) {
    return project.statusType || "progress";
}

function renderProjectCard(project, index = 0) {
    return `
        <article class="project-card reveal delay-${Math.min(index, 3) * 100}">
            <a href="${projectLink(project)}" class="project-media landscape">
                <img src="${escapeHtml(project.cover)}" alt="${escapeHtml(project.title)} screenshot">
            </a>
            <div class="project-body">
                <span class="status ${escapeHtml(statusClass(project))}">${escapeHtml(project.statusLabel)}</span>
                <h3>${escapeHtml(project.title)}</h3>
                <p>${escapeHtml(project.tagline || project.summary)}</p>
                <a href="${projectLink(project)}">Open case study</a>
            </div>
        </article>
    `;
}

function renderCaseRow(project) {
    return `
        <article class="case-row reveal">
            <a href="${projectLink(project)}" class="case-image landscape">
                <img src="${escapeHtml(project.cover)}" alt="${escapeHtml(project.title)} screenshot">
            </a>
            <div>
                <span class="status ${escapeHtml(statusClass(project))}">${escapeHtml(project.statusLabel)}</span>
                <h2>${escapeHtml(project.title)}</h2>
                <p>${escapeHtml(project.summary || project.tagline)}</p>
                <a class="btn btn-ghost" href="${projectLink(project)}">Read case study</a>
            </div>
        </article>
    `;
}

function youtubeEmbed(url) {
    const text = String(url || "");
    const match = text.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : "";
}

function renderVideo(video) {
    const source = typeof video === "string" ? video : video?.src;
    const title = typeof video === "string" ? "Project video" : video?.title || "Project video";
    if (!source) return "";
    const embed = youtubeEmbed(source);
    if (embed) {
        return `<iframe class="video-frame" src="${escapeHtml(embed)}" title="${escapeHtml(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    }
    if (/^https?:|^data:video/.test(source)) {
        return `<video class="video-frame" controls src="${escapeHtml(source)}"></video>`;
    }
    return `<a class="video-link" href="${escapeHtml(source)}" target="_blank" rel="noopener">${escapeHtml(title)}</a>`;
}

function renderHome(projects) {
    const selected = document.getElementById("selectedProjects");
    if (selected) selected.innerHTML = projects.slice(0, 3).map(renderProjectCard).join("");

    const strip = document.getElementById("studioStrip");
    if (strip) {
        strip.innerHTML = projects.slice(0, 3).map((project) => `<img src="${escapeHtml(project.cover)}" alt="${escapeHtml(project.title)} preview">`).join("");
    }

    const mosaic = document.getElementById("heroMosaic");
    if (mosaic && projects.length) {
        const first = projects[0];
        const second = projects[1] || first;
        const third = projects[2] || first;
        mosaic.innerHTML = `
            <a class="feature-tile wide" href="${projectLink(first)}">
                <img src="${escapeHtml(first.cover)}" alt="${escapeHtml(first.title)} gameplay screenshot">
                <span>${escapeHtml(first.title)}</span>
            </a>
            <a class="metric-tile mint" href="projects.html">
                <strong>${projects.length}</strong>
                <span>Featured projects</span>
            </a>
            <a class="metric-tile lavender" href="#skills">
                <strong>40+</strong>
                <span>Production skills</span>
            </a>
            <a class="mini-tile dark" href="${projectLink(second)}">
                <img src="${escapeHtml(second.logo || second.cover)}" alt="${escapeHtml(second.title)} icon">
                <span>${escapeHtml(second.type || "Project")}</span>
            </a>
            <a class="mini-tile orange" href="${projectLink(third)}">
                <img src="${escapeHtml(third.cover)}" alt="${escapeHtml(third.title)} preview">
                <span>${escapeHtml(third.genre || "Game")}</span>
            </a>
        `;
    }
}

function renderProjectsPage(projects) {
    const list = document.getElementById("projectsList");
    if (list) list.innerHTML = projects.map(renderCaseRow).join("");
}

function renderProjectDetail(projects) {
    const root = document.getElementById("projectDetail");
    if (!root) return;

    const id = new URLSearchParams(window.location.search).get("id");
    const project = projects.find((item) => item.id === id) || projects[0];
    if (!project) {
        root.innerHTML = `<section class="page-hero"><div class="container"><h1>No project found.</h1><p class="page-intro">Add projects from the developer dashboard.</p></div></section>`;
        return;
    }

    document.title = `${project.title} Case Study | Alok Sharma`;
    const media = [...(project.screenshots || [])];
    const videos = (project.videos || []).filter(Boolean);
    const primaryLink = project.linkUrl || "index.html#contact";
    const primaryLabel = project.linkUrl ? (project.linkLabel || "Open project") : "Contact about this project";

    root.innerHTML = `
        <section class="case-hero">
            <div class="container case-hero-grid">
                <div class="reveal">
                    <span class="status ${escapeHtml(statusClass(project))}">${escapeHtml(project.statusLabel)}</span>
                    <h1>${escapeHtml(project.title)}</h1>
                    <p>${escapeHtml(project.summary || project.tagline)}</p>
                    <div class="hero-actions">
                        <a class="btn btn-primary" href="${escapeHtml(primaryLink)}" ${project.linkUrl ? 'target="_blank" rel="noopener"' : ""}>${escapeHtml(primaryLabel)}</a>
                        <a class="btn btn-ghost" href="projects.html">All projects</a>
                    </div>
                </div>
                <button class="case-cover modal-trigger reveal delay-100" data-image="${escapeHtml(project.cover)}" data-alt="${escapeHtml(project.title)} screenshot">
                    <img src="${escapeHtml(project.cover)}" alt="${escapeHtml(project.title)} screenshot">
                </button>
            </div>
        </section>
        <section class="section">
            <div class="container detail-grid">
                <article>
                    <p class="eyebrow">Overview</p>
                    <h2>${escapeHtml(project.type || project.genre || "Project")} built with production polish.</h2>
                    <p>${escapeHtml(project.overview || project.summary)}</p>
                </article>
                <aside class="fact-card">
                    <h3>Project Details</h3>
                    <dl>
                        <dt>Genre</dt><dd>${escapeHtml(project.genre || "Game")}</dd>
                        <dt>Platform</dt><dd>${escapeHtml(project.platform || "Mobile")}</dd>
                        <dt>Role</dt><dd>${escapeHtml(project.role || "Developer")}</dd>
                        <dt>Focus</dt><dd>${escapeHtml(project.focus || "Gameplay")}</dd>
                    </dl>
                </aside>
            </div>
        </section>
        <section class="section band">
            <div class="container">
                <div class="section-heading">
                    <p class="eyebrow">Media</p>
                    <h2>Screenshots, videos, and project visuals.</h2>
                </div>
                <div class="media-grid">
                    ${media.map((image) => `
                        <button class="media-card modal-trigger" data-image="${escapeHtml(image)}" data-alt="${escapeHtml(project.title)} media">
                            <img src="${escapeHtml(image)}" alt="${escapeHtml(project.title)} media">
                        </button>
                    `).join("")}
                    ${videos.map((video) => `<div class="media-card video-card">${renderVideo(video)}</div>`).join("")}
                </div>
            </div>
        </section>
        <section class="section">
            <div class="container columns-3">
                <div><h3>Gameplay Loop</h3><p>${escapeHtml(project.loop || "Core gameplay, progression, and player feedback.")}</p></div>
                <div><h3>Technical Work</h3><p>${escapeHtml(project.technical || "Gameplay systems, UI, assets, optimization, and platform delivery.")}</p></div>
                <div><h3>Hiring Signal</h3><p>${escapeHtml(project.signal || "Shows production ownership and polished implementation.")}</p></div>
            </div>
        </section>
    `;
}

function renderDynamicSite() {
    const projects = getProjects();
    renderHome(projects);
    renderProjectsPage(projects);
    renderProjectDetail(projects);
}

renderDynamicSite();

const NEWSLETTER_KEY = "capbuuNewsletterJoined";
const NEWSLETTER_DISMISSED_KEY = "capbuuNewsletterDismissed";

function createNewsletterPopup() {
    if (document.body.dataset.admin === "true") return;
    if (document.getElementById("newsletterOverlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "newsletter-overlay";
    overlay.id = "newsletterOverlay";
    overlay.innerHTML = `
        <div class="newsletter-popup" role="dialog" aria-modal="true" aria-labelledby="newsletterTitle">
            <button class="newsletter-close" id="newsletterClose" type="button" aria-label="Close newsletter popup">&times;</button>
            <p class="eyebrow">Newsletter</p>
            <h2 id="newsletterTitle">Get new game updates first.</h2>
            <p>Join the Capbuu Games newsletter for launch news, testing updates, new screenshots, and developer notes whenever I upload a new game.</p>
            <form class="newsletter-form" id="newsletterForm" action="https://formsubmit.co/ajax/capbuugames@gmail.com" method="POST">
                <input type="hidden" name="_subject" value="New newsletter subscriber">
                <input type="hidden" name="_captcha" value="false">
                <input type="email" name="email" placeholder="you@example.com" aria-label="Email address" required>
                <button class="btn btn-primary" type="submit">Join</button>
            </form>
        </div>
    `;
    document.body.appendChild(overlay);

    const close = () => {
        overlay.classList.remove("active");
        localStorage.setItem(NEWSLETTER_DISMISSED_KEY, String(Date.now()));
    };

    document.getElementById("newsletterClose")?.addEventListener("click", close);
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay) close();
    });

    document.getElementById("newsletterForm")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const email = String(new FormData(form).get("email") || "").trim();
        const button = form.querySelector("button");
        if (!email) return;

        if (button) {
            button.disabled = true;
            button.textContent = "Joining...";
        }

        try {
            const response = await fetch(form.action, {
                method: "POST",
                headers: { "Accept": "application/json" },
                body: new FormData(form),
            });
            if (!response.ok) throw new Error("Newsletter failed");
            localStorage.setItem(NEWSLETTER_KEY, email);
            overlay.classList.remove("active");
            showPopup("You are on the newsletter list. Thank you!", true);
        } catch {
            const subject = encodeURIComponent("Newsletter signup");
            const body = encodeURIComponent(`Please add this email to the Capbuu Games newsletter: ${email}`);
            window.location.href = `mailto:capbuugames@gmail.com?subject=${subject}&body=${body}`;
            localStorage.setItem(NEWSLETTER_KEY, email);
            overlay.classList.remove("active");
            showPopup("I opened an email signup fallback for you.", true);
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = "Join";
            }
        }
    });

    const dismissedAt = Number(localStorage.getItem(NEWSLETTER_DISMISSED_KEY) || 0);
    const dismissedRecently = dismissedAt && Date.now() - dismissedAt < 1000 * 60 * 60 * 24 * 7;
    if (!localStorage.getItem(NEWSLETTER_KEY) && !dismissedRecently) {
        setTimeout(() => overlay.classList.add("active"), 650);
    }
}

createNewsletterPopup();

const contactForm = document.getElementById("contactForm");
const contactSuccess = document.getElementById("contactSuccess");

if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const name = String(formData.get("name") || "").trim();
        const email = String(formData.get("email") || "").trim();
        const message = String(formData.get("message") || "").trim();
        const submitButton = contactForm.querySelector("button[type='submit']");
        const originalButtonText = submitButton?.textContent;

        if (!name || !email || !message) {
            showPopup("Please complete all fields before sending.", false);
            return;
        }

        if (contactSuccess) contactSuccess.classList.remove("show");
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Sending...";
        }

        try {
            const response = await fetch(contactForm.action, {
                method: "POST",
                headers: { "Accept": "application/json" },
                body: formData,
            });

            let data = {};
            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (!response.ok || data.success === false || data.success === "false") {
                throw new Error("Form submit failed");
            }

            contactForm.reset();
            if (contactSuccess) contactSuccess.classList.add("show");
            showPopup("Thanks, your message was sent successfully.", true);
        } catch {
            const ownerEmail = contactForm.dataset.email || "capbuugames@gmail.com";
            const subject = encodeURIComponent("Portfolio message from " + name);
            const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
            const plainText = `To: ${ownerEmail}\nSubject: Portfolio message from ${name}\n\nName: ${name}\nEmail: ${email}\n\n${message}`;

            if (navigator.clipboard) {
                navigator.clipboard.writeText(plainText).catch(() => {});
            }
            window.location.href = `mailto:${ownerEmail}?subject=${subject}&body=${body}`;
            showPopup("I opened a ready-to-send email draft and copied the message as backup.", true);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText || "Send Message";
            }
        }
    });
}

const tiltTargets = document.querySelectorAll(
    ".studio-card, .hero-panel, .feature-tile, .metric-tile, .mini-tile, .project-card, .skill-card, .about-portrait, .stats-panel div, .case-row, .case-cover, .media-card, .fact-card"
);

tiltTargets.forEach((target) => {
    target.classList.add("tilt-ready");

    target.addEventListener("pointermove", (event) => {
        if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

        const rect = target.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        target.style.setProperty("--tilt-x", `${(-y * 7).toFixed(2)}deg`);
        target.style.setProperty("--tilt-y", `${(x * 7).toFixed(2)}deg`);
        target.classList.add("is-tilting");
    });

    target.addEventListener("pointerleave", () => {
        target.style.setProperty("--tilt-x", "0deg");
        target.style.setProperty("--tilt-y", "0deg");
        target.classList.remove("is-tilting");
    });
});

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.style.animationPlayState = "running";
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach((element) => {
    element.style.animationPlayState = "paused";
    revealObserver.observe(element);
});
