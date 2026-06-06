const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });

let stars = [];
let dustStars = [];
let nebulaClouds = [];
let width = 0;
let height = 0;

let animationFrameId = null;
let lastFrameTime = 0;
let frameCounter = 0;
let lastNebulaRender = -Infinity;
let isPageVisible = true;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PERFORMANCE = {
    targetFps: prefersReducedMotion ? 24 : 30,
    nebulaRefreshMs: prefersReducedMotion ? 1400 : 850,
    starCount: 2600,
    dustQuality: 0.38,
    dustDrawStep: 3,
    portalDrawStep: prefersReducedMotion ? 3 : 2,
    maxPortalDpr: 1.25
};

let frameInterval = 1000 / PERFORMANCE.targetFps;

const backgroundCanvas = document.createElement("canvas");
const backgroundCtx = backgroundCanvas.getContext("2d", { alpha: false, desynchronized: true });

/* STARFIELD */

function createStar(x, y, localBoost = 1) {
    const sizeRoll = Math.random();

    let radius;
    let alpha;
    let speed;
    let depth;

    if (sizeRoll < 0.90) {
        radius = Math.random() * 0.38 + 0.06;
        alpha = Math.random() * 0.42 + 0.18;
        speed = Math.random() * 0.018 + 0.004;
        depth = 0.35;
    } else if (sizeRoll < 0.987) {
        radius = Math.random() * 0.78 + 0.26;
        alpha = Math.random() * 0.46 + 0.26;
        speed = Math.random() * 0.038 + 0.008;
        depth = 0.65;
    } else {
        radius = Math.random() * 1.15 + 0.55;
        alpha = Math.random() * 0.36 + 0.38;
        speed = Math.random() * 0.060 + 0.014;
        depth = 1.0;
    }

    const warmStar = Math.random() < 0.17;

    return {
        x,
        y,
        radius: radius * localBoost,
        speed,
        depth,
        baseAlpha: alpha,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.010 + 0.003,
        color: warmStar
            ? { r: 255, g: 214, b: 145 }
            : { r: 185, g: 238, b: 255 }
    };
}

function createDustCluster(cx, cy, spreadX, spreadY, count, warmBias = 0.5) {
    const cluster = [];
    const finalCount = Math.max(1, Math.round(count * PERFORMANCE.dustQuality));

    for (let i = 0; i < finalCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.pow(Math.random(), 0.62);

        const x = cx + Math.cos(angle) * spreadX * distance;
        const y = cy + Math.sin(angle) * spreadY * distance;

        const warm = Math.random() < warmBias;

        cluster.push({
            x,
            y,
            radius: Math.random() * 0.42 + 0.045,
            baseAlpha: Math.random() * 0.28 + 0.09,
            twinkle: Math.random() * Math.PI * 2,
            twinkleSpeed: Math.random() * 0.009 + 0.003,
            driftX: (Math.random() - 0.5) * 0.008,
            driftY: (Math.random() - 0.5) * 0.008,
            color: warm
                ? { r: 255, g: 185, b: 100 }
                : { r: 165, g: 220, b: 255 }
        });
    }

    return cluster;
}

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    backgroundCanvas.width = width;
    backgroundCanvas.height = height;
    lastNebulaRender = -Infinity;

    const mobileMultiplier = width < 780 ? 0.58 : 1;
    const tabletMultiplier = width < 1180 ? 0.78 : 1;
    const qualityMultiplier = mobileMultiplier * tabletMultiplier;

    stars = Array.from({ length: Math.round(PERFORMANCE.starCount * qualityMultiplier) }, () =>
        createStar(Math.random() * width, Math.random() * height)
    );

    dustStars = [
        ...createDustCluster(width * 0.22, height * 0.22, width * 0.30, height * 0.25, 1500 * qualityMultiplier, 0.38),
        ...createDustCluster(width * 0.78, height * 0.22, width * 0.34, height * 0.27, 1600 * qualityMultiplier, 0.72),
        ...createDustCluster(width * 0.16, height * 0.76, width * 0.22, height * 0.18, 650 * qualityMultiplier, 0.28),
        ...createDustCluster(width * 0.79, height * 0.76, width * 0.22, height * 0.18, 650 * qualityMultiplier, 0.76),
        ...createDustCluster(width * 0.50, height * 0.48, width * 0.44, height * 0.34, 1000 * qualityMultiplier, 0.48),
        ...createDustCluster(width * 0.50, height * 0.20, width * 0.50, height * 0.16, 850 * qualityMultiplier, 0.50),
        ...createDustCluster(width * 0.50, height * 0.86, width * 0.52, height * 0.15, 650 * qualityMultiplier, 0.46)
    ];

    nebulaClouds = [
        { x: width * 0.18, y: height * 0.18, r: width * 0.42, color: [140, 40, 255], alpha: 0.11 },
        { x: width * 0.26, y: height * 0.24, r: width * 0.28, color: [255, 70, 40], alpha: 0.06 },
        { x: width * 0.28, y: height * 0.16, r: width * 0.22, color: [90, 130, 255], alpha: 0.04 },

        { x: width * 0.78, y: height * 0.20, r: width * 0.46, color: [255, 115, 30], alpha: 0.11 },
        { x: width * 0.72, y: height * 0.26, r: width * 0.26, color: [255, 170, 40], alpha: 0.05 },
        { x: width * 0.70, y: height * 0.15, r: width * 0.20, color: [60, 110, 255], alpha: 0.035 },

        { x: width * 0.14, y: height * 0.82, r: width * 0.26, color: [0, 120, 255], alpha: 0.08 },
        { x: width * 0.82, y: height * 0.82, r: width * 0.24, color: [255, 170, 35], alpha: 0.07 },

        { x: width * 0.50, y: height * 0.47, r: width * 0.50, color: [0, 180, 255], alpha: 0.045 },
        { x: width * 0.50, y: height * 0.50, r: width * 0.75, color: [0, 80, 150], alpha: 0.026 }
    ];
}

/* BACKGROUND BUFFER */

function renderNebulaToBuffer(time) {
    const t = time * 0.001;

    const gradient = backgroundCtx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height)
    );

    gradient.addColorStop(0, "#030817");
    gradient.addColorStop(0.45, "#01040d");
    gradient.addColorStop(1, "#000000");

    backgroundCtx.globalCompositeOperation = "source-over";
    backgroundCtx.fillStyle = gradient;
    backgroundCtx.fillRect(0, 0, width, height);

    backgroundCtx.save();
    backgroundCtx.globalCompositeOperation = "screen";

    for (const cloud of nebulaClouds) {
        const driftX = prefersReducedMotion ? 0 : Math.sin(t * 0.025 + cloud.x * 0.001) * 14;
        const driftY = prefersReducedMotion ? 0 : Math.cos(t * 0.020 + cloud.y * 0.001) * 10;

        const cloudGradient = backgroundCtx.createRadialGradient(
            cloud.x + driftX,
            cloud.y + driftY,
            0,
            cloud.x + driftX,
            cloud.y + driftY,
            cloud.r
        );

        cloudGradient.addColorStop(0, `rgba(${cloud.color[0]}, ${cloud.color[1]}, ${cloud.color[2]}, ${cloud.alpha})`);
        cloudGradient.addColorStop(0.40, `rgba(${cloud.color[0]}, ${cloud.color[1]}, ${cloud.color[2]}, ${cloud.alpha * 0.38})`);
        cloudGradient.addColorStop(0.76, `rgba(${cloud.color[0]}, ${cloud.color[1]}, ${cloud.color[2]}, ${cloud.alpha * 0.10})`);
        cloudGradient.addColorStop(1, "rgba(0,0,0,0)");

        backgroundCtx.fillStyle = cloudGradient;
        backgroundCtx.fillRect(0, 0, width, height);
    }

    drawSubtleCyberGridToBuffer(t);

    backgroundCtx.restore();
}

function drawSubtleCyberGridToBuffer(t) {
    const gap = width < 780 ? 96 : 128;
    const opacity = width < 780 ? 0.006 : 0.010;

    backgroundCtx.save();
    backgroundCtx.globalCompositeOperation = "screen";

    for (let x = -gap; x < width + gap; x += gap) {
        const drift = Math.sin(t * 0.03 + x * 0.01) * 7;

        backgroundCtx.beginPath();
        backgroundCtx.moveTo(x + drift, 0);
        backgroundCtx.lineTo(x - drift * 0.5, height);
        backgroundCtx.strokeStyle = `rgba(0, 210, 255, ${opacity})`;
        backgroundCtx.lineWidth = 1;
        backgroundCtx.stroke();
    }

    for (let y = -gap; y < height + gap; y += gap) {
        const drift = Math.cos(t * 0.025 + y * 0.01) * 6;

        backgroundCtx.beginPath();
        backgroundCtx.moveTo(0, y + drift);
        backgroundCtx.lineTo(width, y - drift * 0.5);
        backgroundCtx.strokeStyle = `rgba(160, 70, 255, ${opacity * 0.55})`;
        backgroundCtx.lineWidth = 1;
        backgroundCtx.stroke();
    }

    backgroundCtx.restore();
}

/* DRAWING */

function drawStarPoint(star, isDust = false) {
    star.twinkle += star.twinkleSpeed;

    const finalAlpha = Math.max(
        0.045,
        Math.min(1, star.baseAlpha + Math.sin(star.twinkle) * (isDust ? 0.060 : 0.080))
    );

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

    ctx.shadowBlur = star.radius > 1.05 ? 4 : 1.5;
    ctx.shadowColor = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${finalAlpha})`;
    ctx.fillStyle = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${finalAlpha})`;
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawStars(time) {
    const t = time * 0.001;

    if (time - lastNebulaRender > PERFORMANCE.nebulaRefreshMs) {
        renderNebulaToBuffer(time);
        lastNebulaRender = time;
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(backgroundCanvas, 0, 0);

    const dustFrame = frameCounter % PERFORMANCE.dustDrawStep;

    for (let i = 0; i < dustStars.length; i++) {
        const dust = dustStars[i];

        if (i % PERFORMANCE.dustDrawStep === dustFrame) {
            drawStarPoint(dust, true);
        }

        dust.x += dust.driftX;
        dust.y += dust.driftY;

        if (dust.x < -10) dust.x = width + 10;
        if (dust.x > width + 10) dust.x = -10;
        if (dust.y < -10) dust.y = height + 10;
        if (dust.y > height + 10) dust.y = -10;
    }

    for (const star of stars) {
        drawStarPoint(star, false);

        star.y += star.speed;
        star.x += Math.sin(t * 0.06 + star.y * 0.002) * 0.004 * star.depth;

        if (star.y > height + 5) {
            star.y = -5;
            star.x = Math.random() * width;
        }

        if (star.x < -5) star.x = width + 5;
        if (star.x > width + 5) star.x = -5;
    }
}

/* LIQUID EVENT HORIZON */

const gateCore = document.querySelector(".gate-core");
let portalCanvas = null;
let portalCtx = null;
let portalSize = 0;
let portalDpr = 1;

function setupPortalCanvas() {
    if (!gateCore) return;

    portalCanvas = document.createElement("canvas");
    portalCanvas.className = "event-horizon-canvas";
    portalCanvas.style.position = "absolute";
    portalCanvas.style.inset = "0";
    portalCanvas.style.width = "100%";
    portalCanvas.style.height = "100%";
    portalCanvas.style.borderRadius = "50%";
    portalCanvas.style.pointerEvents = "none";
    portalCanvas.style.zIndex = "12";
    portalCanvas.style.mixBlendMode = "screen";

    gateCore.appendChild(portalCanvas);
    portalCtx = portalCanvas.getContext("2d", { alpha: true, desynchronized: true });

    resizePortalCanvas();
}

function resizePortalCanvas() {
    if (!portalCanvas || !gateCore) return;

    const rect = gateCore.getBoundingClientRect();
    portalSize = Math.max(1, Math.round(rect.width));
    portalDpr = Math.min(window.devicePixelRatio || 1, PERFORMANCE.maxPortalDpr);

    portalCanvas.width = Math.round(portalSize * portalDpr);
    portalCanvas.height = Math.round(portalSize * portalDpr);

    portalCtx.setTransform(portalDpr, 0, 0, portalDpr, 0, 0);
}

function drawLiquidRing(cx, cy, baseRadius, amplitude, time, phase, alpha) {
    const steps = prefersReducedMotion ? 80 : 120;

    portalCtx.beginPath();

    for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * Math.PI * 2;

        const ripple =
            Math.sin(angle * 2 + time * 0.60 + phase) * amplitude +
            Math.sin(angle * 5 - time * 0.42 + phase * 0.6) * amplitude * 0.40 +
            Math.sin(angle * 9 + time * 0.28) * amplitude * 0.16;

        const rr = baseRadius + ripple;
        const x = cx + Math.cos(angle) * rr;
        const y = cy + Math.sin(angle) * rr;

        if (i === 0) portalCtx.moveTo(x, y);
        else portalCtx.lineTo(x, y);
    }

    portalCtx.closePath();

    portalCtx.strokeStyle = `rgba(205, 250, 255, ${alpha})`;
    portalCtx.lineWidth = 0.7;
    portalCtx.shadowBlur = 3;
    portalCtx.shadowColor = `rgba(0, 225, 255, ${alpha})`;
    portalCtx.stroke();
}

function drawEventHorizon(time) {
    if (!portalCtx || !portalSize) return;

    const t = time * 0.001;
    const c = portalSize / 2;
    const r = portalSize * 0.48;

    portalCtx.clearRect(0, 0, portalSize, portalSize);
    portalCtx.save();

    portalCtx.beginPath();
    portalCtx.arc(c, c, r, 0, Math.PI * 2);
    portalCtx.clip();

    const base = portalCtx.createRadialGradient(c, c, 0, c, c, r);
    base.addColorStop(0, "rgba(90, 205, 235, 0.09)");
    base.addColorStop(0.30, "rgba(30, 145, 210, 0.18)");
    base.addColorStop(0.58, "rgba(10, 72, 145, 0.44)");
    base.addColorStop(0.82, "rgba(2, 28, 76, 0.86)");
    base.addColorStop(1, "rgba(0, 4, 20, 1)");

    portalCtx.fillStyle = base;
    portalCtx.fillRect(0, 0, portalSize, portalSize);

    const liquidShiftX = Math.sin(t * 0.42) * 6;
    const liquidShiftY = Math.cos(t * 0.34) * 5;

    const sheen = portalCtx.createRadialGradient(
        c + liquidShiftX,
        c + liquidShiftY,
        r * 0.08,
        c,
        c,
        r
    );

    sheen.addColorStop(0, "rgba(255, 255, 255, 0.030)");
    sheen.addColorStop(0.24, "rgba(185, 245, 255, 0.035)");
    sheen.addColorStop(0.54, "rgba(0, 210, 255, 0.020)");
    sheen.addColorStop(0.86, "rgba(0, 20, 60, 0.14)");
    sheen.addColorStop(1, "rgba(0, 0, 0, 0)");

    portalCtx.fillStyle = sheen;
    portalCtx.fillRect(0, 0, portalSize, portalSize);

    const ringCount = prefersReducedMotion ? 3 : 4;

    for (let i = 0; i < ringCount; i++) {
        const radius = r * (0.27 + i * 0.13);
        const amp = 2.0 + i * 0.20;
        const alpha = 0.008 + i * 0.0014;

        drawLiquidRing(c, c, radius, amp, t, i * 0.83, alpha);
    }

    const horizontalWaveCount = prefersReducedMotion ? 5 : 7;

    for (let i = 0; i < horizontalWaveCount; i++) {
        const yBase = c - r * 0.56 + (i / (horizontalWaveCount - 1)) * r * 1.12;

        portalCtx.beginPath();

        let hasStarted = false;

        for (let x = c - r; x <= c + r; x += 9) {
            const normalized = (x - c) / r;
            const limit = Math.sqrt(Math.max(0, 1 - normalized * normalized));
            const wave =
                Math.sin(x * 0.019 + t * 0.85 + i * 0.48) * 1.6 +
                Math.sin(x * 0.041 - t * 0.46) * 0.6;

            const y = yBase + wave;

            if (Math.abs((y - c) / r) <= limit) {
                if (!hasStarted) {
                    portalCtx.moveTo(x, y);
                    hasStarted = true;
                } else {
                    portalCtx.lineTo(x, y);
                }
            }
        }

        portalCtx.strokeStyle = "rgba(210, 250, 255, 0.009)";
        portalCtx.lineWidth = 0.7;
        portalCtx.shadowBlur = 1.3;
        portalCtx.shadowColor = "rgba(0, 225, 255, 0.035)";
        portalCtx.stroke();
    }

    const membrane = portalCtx.createRadialGradient(c, c, r * 0.08, c, c, r * 0.74);
    membrane.addColorStop(0, "rgba(255,255,255,0.020)");
    membrane.addColorStop(0.24, "rgba(160,235,255,0.024)");
    membrane.addColorStop(0.58, "rgba(0,200,255,0.012)");
    membrane.addColorStop(1, "rgba(0,0,0,0)");

    portalCtx.fillStyle = membrane;
    portalCtx.fillRect(0, 0, portalSize, portalSize);

    const edge = portalCtx.createRadialGradient(c, c, r * 0.50, c, c, r);
    edge.addColorStop(0, "rgba(0,0,0,0)");
    edge.addColorStop(0.70, "rgba(0,10,25,0.30)");
    edge.addColorStop(1, "rgba(0,3,12,0.99)");

    portalCtx.fillStyle = edge;
    portalCtx.fillRect(0, 0, portalSize, portalSize);

    portalCtx.restore();
    portalCtx.shadowBlur = 0;
}

/* PROJECT INTERACTION SYSTEM */

const projectLinks = document.querySelectorAll(".project-link");
const stargate = document.querySelector(".stargate");
const hero = document.querySelector(".hero");
const projectTooltip = document.getElementById("projectTooltip");
const tooltipTitle = document.getElementById("tooltipTitle");
const tooltipSubtitle = document.getElementById("tooltipSubtitle");

const missionTitle = document.getElementById("missionTitle");
const missionSubtitle = document.getElementById("missionSubtitle");

const projectAccents = {
    "supernova": {
        accent: "rgba(255,92,72,.95)",
        soft: "rgba(255,92,72,.22)"
    },
    "black-hole": {
        accent: "rgba(255,170,72,.95)",
        soft: "rgba(255,140,40,.22)"
    },
    "planet-blue": {
        accent: "rgba(70,170,255,.95)",
        soft: "rgba(70,170,255,.22)"
    },
    "planet-gold": {
        accent: "rgba(255,205,92,.95)",
        soft: "rgba(255,205,92,.22)"
    }
};

function getProjectAccent(link) {
    const key = Object.keys(projectAccents).find((name) => link.classList.contains(name));
    return projectAccents[key] || projectAccents["planet-gold"];
}

function applyProjectAccent(link) {
    const accent = getProjectAccent(link);

    document.documentElement.style.setProperty("--project-accent", accent.accent);
    document.documentElement.style.setProperty("--project-accent-soft", accent.soft);
}

function updateTooltipPosition(event) {
    if (!projectTooltip || !hero || !event) return;

    const heroRect = hero.getBoundingClientRect();
    const x = event.clientX - heroRect.left;
    const y = event.clientY - heroRect.top;

    const safeX = Math.max(180, Math.min(heroRect.width - 180, x));
    const safeY = Math.max(90, Math.min(heroRect.height - 90, y));

    projectTooltip.style.left = `${safeX}px`;
    projectTooltip.style.top = `${safeY}px`;
}

function showProjectTooltip(link, event) {
    applyProjectAccent(link);

    if (stargate) {
        stargate.classList.add("gate-active");
    }

    const title = link.dataset.title || "L.J. Freelancer Project Center";
    const subtitle = link.dataset.subtitle || "Válassz egy projektet a belépéshez.";

    if (projectTooltip && tooltipTitle && tooltipSubtitle) {
        tooltipTitle.textContent = title;
        tooltipSubtitle.textContent = subtitle;
        projectTooltip.classList.add("is-visible");
        projectTooltip.setAttribute("aria-hidden", "false");
        updateTooltipPosition(event);
    }

    if (missionTitle && missionSubtitle) {
        missionTitle.textContent = title;
        missionSubtitle.textContent = subtitle;
    }
}

function hideProjectTooltip() {
    if (stargate) {
        stargate.classList.remove("gate-active");
    }

    if (projectTooltip) {
        projectTooltip.classList.remove("is-visible");
        projectTooltip.setAttribute("aria-hidden", "true");
    }

    if (missionTitle && missionSubtitle) {
        missionTitle.textContent = "L.J. Freelancer Project Center";
        missionSubtitle.textContent = "Válassz egy projektet a belépéshez.";
    }
}

function activateProjectLink(link, event) {
    const target = link.getAttribute("href");

    if (!target || !target.startsWith("#")) return;

    event.preventDefault();

    applyProjectAccent(link);
    link.classList.add("activating");

    if (stargate) {
        stargate.classList.add("gate-active");
    }

    window.setTimeout(() => {
        link.classList.remove("activating");
        window.location.hash = target;
    }, 220);
}

projectLinks.forEach((link) => {
    link.addEventListener("mouseenter", (event) => {
        showProjectTooltip(link, event);
    });

    link.addEventListener("mousemove", (event) => {
        updateTooltipPosition(event);
    });

    link.addEventListener("mouseleave", () => {
        hideProjectTooltip();
    });

    link.addEventListener("focus", (event) => {
        showProjectTooltip(link, event);
    });

    link.addEventListener("blur", () => {
        hideProjectTooltip();
    });

    link.addEventListener("click", (event) => {
        activateProjectLink(link, event);
    });
});

/* MAIN LOOP */

function animate(time) {
    if (!isPageVisible) return;

    if (time - lastFrameTime >= frameInterval) {
        lastFrameTime = time;
        frameCounter++;

        drawStars(time);

        if (frameCounter % PERFORMANCE.portalDrawStep === 0) {
            drawEventHorizon(time);
        }
    }

    animationFrameId = requestAnimationFrame(animate);
}

function startAnimation() {
    if (animationFrameId !== null) return;

    isPageVisible = true;
    lastFrameTime = performance.now();
    animationFrameId = requestAnimationFrame(animate);
}

function stopAnimation() {
    isPageVisible = false;

    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

let resizeTimer = null;

window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);

    resizeTimer = window.setTimeout(() => {
        resizeCanvas();
        resizePortalCanvas();
        renderNebulaToBuffer(performance.now());
    }, 160);
});

document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAnimation();
    else startAnimation();
});

resizeCanvas();
setupPortalCanvas();
renderNebulaToBuffer(performance.now());
startAnimation();