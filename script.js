const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });

let stars = [];
let dustStars = [];
let nebulaClouds = [];
let dataStreams = [];

let width = 0;
let height = 0;

let animationFrameId = null;
let lastFrameTime = 0;
let frameCounter = 0;
let lastNebulaRender = -Infinity;
let isPageVisible = true;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PERFORMANCE = {
    targetFps: prefersReducedMotion ? 20 : 26,
    nebulaRefreshMs: prefersReducedMotion ? 2200 : 1500,
    starCount: 2600,
    dustQuality: 0.12,
    dustDrawStep: 5,
    starDrawStep: 2,
    dataStreamCount: prefersReducedMotion ? 10 : 22,
    dataStreamDrawStep: 2,
    portalDrawStep: prefersReducedMotion ? 4 : 3,
    maxPortalDpr: 1.0,
    resizeDelayMs: 220
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
        radius = Math.random() * 0.34 + 0.055;
        alpha = Math.random() * 0.36 + 0.16;
        speed = Math.random() * 0.012 + 0.003;
        depth = 0.30;
    } else if (sizeRoll < 0.988) {
        radius = Math.random() * 0.70 + 0.24;
        alpha = Math.random() * 0.42 + 0.24;
        speed = Math.random() * 0.028 + 0.006;
        depth = 0.60;
    } else {
        radius = Math.random() * 1.05 + 0.50;
        alpha = Math.random() * 0.32 + 0.36;
        speed = Math.random() * 0.046 + 0.010;
        depth = 1.0;
    }

    const warmStar = Math.random() < 0.15;

    return {
        x,
        y,
        radius: radius * localBoost,
        speed,
        depth,
        baseAlpha: alpha,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.007 + 0.002,
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
        const distance = Math.pow(Math.random(), 0.66);

        const x = cx + Math.cos(angle) * spreadX * distance;
        const y = cy + Math.sin(angle) * spreadY * distance;

        const warm = Math.random() < warmBias;

        cluster.push({
            x,
            y,
            radius: Math.random() * 0.34 + 0.035,
            baseAlpha: Math.random() * 0.20 + 0.055,
            twinkle: Math.random() * Math.PI * 2,
            twinkleSpeed: Math.random() * 0.006 + 0.002,
            driftX: (Math.random() - 0.5) * 0.004,
            driftY: (Math.random() - 0.5) * 0.004,
            color: warm
                ? { r: 255, g: 185, b: 100 }
                : { r: 165, g: 220, b: 255 }
        });
    }

    return cluster;
}

function createDataStream() {
    const side = Math.random();

    let startX;
    let startY;
    let endX;
    let endY;

    if (side < 0.5) {
        startX = Math.random() * width * 0.42;
        startY = Math.random() * height;
        endX = width * (0.40 + Math.random() * 0.20);
        endY = height * (0.38 + Math.random() * 0.24);
    } else {
        startX = width * (0.58 + Math.random() * 0.42);
        startY = Math.random() * height;
        endX = width * (0.42 + Math.random() * 0.20);
        endY = height * (0.38 + Math.random() * 0.24);
    }

    const cyan = Math.random() < 0.72;

    return {
        startX,
        startY,
        endX,
        endY,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.006 + 0.002,
        width: Math.random() * 0.8 + 0.35,
        alpha: Math.random() * 0.030 + 0.010,
        color: cyan
            ? { r: 0, g: 225, b: 255 }
            : { r: 255, g: 205, b: 92 }
    };
}

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    backgroundCanvas.width = width;
    backgroundCanvas.height = height;
    lastNebulaRender = -Infinity;

    const mobileMultiplier = width < 780 ? 0.50 : 1;
    const tabletMultiplier = width < 1180 ? 0.72 : 1;
    const qualityMultiplier = mobileMultiplier * tabletMultiplier;

    stars = Array.from({ length: Math.round(PERFORMANCE.starCount * qualityMultiplier) }, () =>
        createStar(Math.random() * width, Math.random() * height)
    );

    dustStars = [
        ...createDustCluster(width * 0.18, height * 0.20, width * 0.26, height * 0.22, 900 * qualityMultiplier, 0.38),
        ...createDustCluster(width * 0.80, height * 0.20, width * 0.30, height * 0.25, 900 * qualityMultiplier, 0.72),
        ...createDustCluster(width * 0.16, height * 0.78, width * 0.20, height * 0.16, 360 * qualityMultiplier, 0.28),
        ...createDustCluster(width * 0.82, height * 0.78, width * 0.20, height * 0.16, 360 * qualityMultiplier, 0.76),
        ...createDustCluster(width * 0.50, height * 0.52, width * 0.32, height * 0.28, 420 * qualityMultiplier, 0.48)
    ];

    nebulaClouds = [
        { x: width * 0.15, y: height * 0.18, r: width * 0.36, color: [140, 40, 255], alpha: 0.055 },
        { x: width * 0.24, y: height * 0.25, r: width * 0.24, color: [255, 70, 40], alpha: 0.034 },
        { x: width * 0.28, y: height * 0.18, r: width * 0.20, color: [90, 130, 255], alpha: 0.026 },

        { x: width * 0.80, y: height * 0.20, r: width * 0.40, color: [255, 115, 30], alpha: 0.052 },
        { x: width * 0.72, y: height * 0.26, r: width * 0.24, color: [255, 170, 40], alpha: 0.030 },
        { x: width * 0.70, y: height * 0.15, r: width * 0.20, color: [60, 110, 255], alpha: 0.020 },

        { x: width * 0.50, y: height * 0.50, r: width * 0.52, color: [0, 130, 180], alpha: 0.016 }
    ];

    dataStreams = Array.from({ length: Math.round(PERFORMANCE.dataStreamCount * qualityMultiplier) }, () =>
        createDataStream()
    );
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

    gradient.addColorStop(0, "#020716");
    gradient.addColorStop(0.42, "#01040c");
    gradient.addColorStop(1, "#000000");

    backgroundCtx.globalCompositeOperation = "source-over";
    backgroundCtx.fillStyle = gradient;
    backgroundCtx.fillRect(0, 0, width, height);

    backgroundCtx.save();
    backgroundCtx.globalCompositeOperation = "screen";

    for (const cloud of nebulaClouds) {
        const driftX = prefersReducedMotion ? 0 : Math.sin(t * 0.014 + cloud.x * 0.001) * 8;
        const driftY = prefersReducedMotion ? 0 : Math.cos(t * 0.012 + cloud.y * 0.001) * 5;

        const cloudGradient = backgroundCtx.createRadialGradient(
            cloud.x + driftX,
            cloud.y + driftY,
            0,
            cloud.x + driftX,
            cloud.y + driftY,
            cloud.r
        );

        cloudGradient.addColorStop(0, `rgba(${cloud.color[0]}, ${cloud.color[1]}, ${cloud.color[2]}, ${cloud.alpha})`);
        cloudGradient.addColorStop(0.42, `rgba(${cloud.color[0]}, ${cloud.color[1]}, ${cloud.color[2]}, ${cloud.alpha * 0.30})`);
        cloudGradient.addColorStop(0.78, `rgba(${cloud.color[0]}, ${cloud.color[1]}, ${cloud.color[2]}, ${cloud.alpha * 0.070})`);
        cloudGradient.addColorStop(1, "rgba(0,0,0,0)");

        backgroundCtx.fillStyle = cloudGradient;
        backgroundCtx.fillRect(0, 0, width, height);
    }

    drawSubtleCyberGridToBuffer(t);

    backgroundCtx.restore();
}

function drawSubtleCyberGridToBuffer(t) {
    const gap = width < 780 ? 140 : 190;
    const opacity = width < 780 ? 0.003 : 0.005;

    backgroundCtx.save();
    backgroundCtx.globalCompositeOperation = "screen";

    for (let x = -gap; x < width + gap; x += gap) {
        const drift = Math.sin(t * 0.014 + x * 0.01) * 4;

        backgroundCtx.beginPath();
        backgroundCtx.moveTo(x + drift, 0);
        backgroundCtx.lineTo(x - drift * 0.45, height);
        backgroundCtx.strokeStyle = `rgba(0, 210, 255, ${opacity})`;
        backgroundCtx.lineWidth = 1;
        backgroundCtx.stroke();
    }

    for (let y = -gap; y < height + gap; y += gap) {
        const drift = Math.cos(t * 0.012 + y * 0.01) * 3;

        backgroundCtx.beginPath();
        backgroundCtx.moveTo(0, y + drift);
        backgroundCtx.lineTo(width, y - drift * 0.45);
        backgroundCtx.strokeStyle = `rgba(160, 70, 255, ${opacity * 0.45})`;
        backgroundCtx.lineWidth = 1;
        backgroundCtx.stroke();
    }

    backgroundCtx.restore();
}

/* DIGITAL DEEP SPACE DATA STREAMS */

function drawDataStreams(time) {
    if (prefersReducedMotion) return;

    const t = time * 0.001;
    const streamFrame = frameCounter % PERFORMANCE.dataStreamDrawStep;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let i = 0; i < dataStreams.length; i++) {
        if (i % PERFORMANCE.dataStreamDrawStep !== streamFrame) continue;

        const stream = dataStreams[i];
        stream.phase += stream.speed;

        const pulse = 0.55 + Math.sin(t * 0.8 + stream.phase) * 0.35;
        const alpha = stream.alpha * pulse;

        const midX = (stream.startX + stream.endX) / 2 + Math.sin(stream.phase) * 38;
        const midY = (stream.startY + stream.endY) / 2 + Math.cos(stream.phase * 0.8) * 28;

        const gradient = ctx.createLinearGradient(stream.startX, stream.startY, stream.endX, stream.endY);
        gradient.addColorStop(0, `rgba(${stream.color.r}, ${stream.color.g}, ${stream.color.b}, 0)`);
        gradient.addColorStop(0.48, `rgba(${stream.color.r}, ${stream.color.g}, ${stream.color.b}, ${alpha})`);
        gradient.addColorStop(1, `rgba(${stream.color.r}, ${stream.color.g}, ${stream.color.b}, 0)`);

        ctx.beginPath();
        ctx.moveTo(stream.startX, stream.startY);
        ctx.quadraticCurveTo(midX, midY, stream.endX, stream.endY);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = stream.width;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `rgba(${stream.color.r}, ${stream.color.g}, ${stream.color.b}, ${alpha * 2})`;
        ctx.stroke();

        if (Math.random() < 0.003) {
            stream.startX = Math.random() * width;
            stream.startY = Math.random() * height;
            stream.endX = width * (0.42 + Math.random() * 0.16);
            stream.endY = height * (0.40 + Math.random() * 0.20);
        }
    }

    ctx.restore();
    ctx.shadowBlur = 0;
}

/* DRAWING */

function applyBlackHoleGravity(star) {
    const blackHoleX = width * 0.83;
    const blackHoleY = height * 0.18;

    const dx = blackHoleX - star.x;
    const dy = blackHoleY - star.y;
    const distSq = dx * dx + dy * dy;
    const influenceRadius = width * 0.22;
    const influenceSq = influenceRadius * influenceRadius;

    if (distSq > influenceSq || distSq < 1) return;

    const strength = (1 - distSq / influenceSq) * 0.010 * star.depth;

    star.x += dx * strength;
    star.y += dy * strength * 0.35;
}

function drawStarPoint(star, isDust = false) {
    star.twinkle += star.twinkleSpeed;

    const finalAlpha = Math.max(
        0.038,
        Math.min(1, star.baseAlpha + Math.sin(star.twinkle) * (isDust ? 0.040 : 0.055))
    );

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

    ctx.shadowBlur = star.radius > 1.05 ? 3 : 1.0;
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

    drawDataStreams(time);

    const dustFrame = frameCounter % PERFORMANCE.dustDrawStep;
    const starFrame = frameCounter % PERFORMANCE.starDrawStep;

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

    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];

        if (i % PERFORMANCE.starDrawStep === starFrame || star.radius > 0.9) {
            drawStarPoint(star, false);
        }

        star.y += star.speed;
        star.x += Math.sin(t * 0.040 + star.y * 0.002) * 0.0028 * star.depth;

        applyBlackHoleGravity(star);

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
    const steps = prefersReducedMotion ? 64 : 90;

    portalCtx.beginPath();

    for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * Math.PI * 2;

        const ripple =
            Math.sin(angle * 2 + time * 0.50 + phase) * amplitude +
            Math.sin(angle * 5 - time * 0.34 + phase * 0.6) * amplitude * 0.34 +
            Math.sin(angle * 9 + time * 0.22) * amplitude * 0.12;

        const rr = baseRadius + ripple;
        const x = cx + Math.cos(angle) * rr;
        const y = cy + Math.sin(angle) * rr;

        if (i === 0) portalCtx.moveTo(x, y);
        else portalCtx.lineTo(x, y);
    }

    portalCtx.closePath();

    portalCtx.strokeStyle = `rgba(205, 250, 255, ${alpha})`;
    portalCtx.lineWidth = 0.65;
    portalCtx.shadowBlur = 2;
    portalCtx.shadowColor = `rgba(0, 225, 255, ${alpha})`;
    portalCtx.stroke();
}

function drawPortalHexGrid(cx, cy, radius, time) {
    const hexSize = portalSize * 0.065;
    const alpha = 0.012;
    const drift = Math.sin(time * 0.35) * 3;

    portalCtx.save();
    portalCtx.globalCompositeOperation = "screen";
    portalCtx.strokeStyle = `rgba(0, 225, 255, ${alpha})`;
    portalCtx.lineWidth = 0.6;

    for (let y = cy - radius; y <= cy + radius; y += hexSize * 0.86) {
        for (let x = cx - radius; x <= cx + radius; x += hexSize * 1.5) {
            const ox = x + ((Math.round((y - cy) / (hexSize * 0.86)) % 2) * hexSize * 0.75) + drift;
            const oy = y;

            const dx = ox - cx;
            const dy = oy - cy;

            if (dx * dx + dy * dy > radius * radius * 0.72) continue;

            portalCtx.beginPath();

            for (let i = 0; i <= 6; i++) {
                const a = Math.PI / 6 + i * Math.PI / 3;
                const px = ox + Math.cos(a) * hexSize * 0.42;
                const py = oy + Math.sin(a) * hexSize * 0.42;

                if (i === 0) portalCtx.moveTo(px, py);
                else portalCtx.lineTo(px, py);
            }

            portalCtx.stroke();
        }
    }

    portalCtx.restore();
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
    base.addColorStop(0, "rgba(100, 225, 245, 0.095)");
    base.addColorStop(0.28, "rgba(35, 160, 225, 0.18)");
    base.addColorStop(0.56, "rgba(10, 78, 152, 0.40)");
    base.addColorStop(0.82, "rgba(2, 28, 76, 0.84)");
    base.addColorStop(1, "rgba(0, 4, 20, 1)");

    portalCtx.fillStyle = base;
    portalCtx.fillRect(0, 0, portalSize, portalSize);

    drawPortalHexGrid(c, c, r, t);

    const liquidShiftX = Math.sin(t * 0.32) * 5;
    const liquidShiftY = Math.cos(t * 0.28) * 4;

    const sheen = portalCtx.createRadialGradient(
        c + liquidShiftX,
        c + liquidShiftY,
        r * 0.08,
        c,
        c,
        r
    );

    sheen.addColorStop(0, "rgba(255, 255, 255, 0.030)");
    sheen.addColorStop(0.24, "rgba(185, 245, 255, 0.034)");
    sheen.addColorStop(0.54, "rgba(0, 210, 255, 0.018)");
    sheen.addColorStop(0.86, "rgba(0, 20, 60, 0.12)");
    sheen.addColorStop(1, "rgba(0, 0, 0, 0)");

    portalCtx.fillStyle = sheen;
    portalCtx.fillRect(0, 0, portalSize, portalSize);

    const ringCount = prefersReducedMotion ? 2 : 3;

    for (let i = 0; i < ringCount; i++) {
        const radius = r * (0.30 + i * 0.16);
        const amp = 1.7 + i * 0.18;
        const alpha = 0.008 + i * 0.0012;

        drawLiquidRing(c, c, radius, amp, t, i * 0.83, alpha);
    }

    const horizontalWaveCount = prefersReducedMotion ? 4 : 5;

    for (let i = 0; i < horizontalWaveCount; i++) {
        const yBase = c - r * 0.52 + (i / (horizontalWaveCount - 1)) * r * 1.04;

        portalCtx.beginPath();

        let hasStarted = false;

        for (let x = c - r; x <= c + r; x += 12) {
            const normalized = (x - c) / r;
            const limit = Math.sqrt(Math.max(0, 1 - normalized * normalized));
            const wave =
                Math.sin(x * 0.018 + t * 0.70 + i * 0.48) * 1.3 +
                Math.sin(x * 0.038 - t * 0.36) * 0.45;

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

        portalCtx.strokeStyle = "rgba(210, 250, 255, 0.008)";
        portalCtx.lineWidth = 0.65;
        portalCtx.shadowBlur = 1;
        portalCtx.shadowColor = "rgba(0, 225, 255, 0.030)";
        portalCtx.stroke();
    }

    const coreGlow = portalCtx.createRadialGradient(c, c, 0, c, c, r * 0.65);
    coreGlow.addColorStop(0, "rgba(255,255,255,0.034)");
    coreGlow.addColorStop(0.20, "rgba(120,245,255,0.026)");
    coreGlow.addColorStop(0.46, "rgba(0,180,255,0.014)");
    coreGlow.addColorStop(1, "rgba(0,0,0,0)");

    portalCtx.fillStyle = coreGlow;
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

/* PROJECT ACTIVATION SYSTEM 1.0 */

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
        theme: "freelancer-protocol",
        accent: "rgba(255,92,72,.95)",
        soft: "rgba(255,92,72,.24)",
        deep: "rgba(255,65,45,.12)",
        portal: "rgba(255,118,72,.30)"
    },
    "black-hole": {
        theme: "nia-os",
        accent: "rgba(0,225,255,.95)",
        soft: "rgba(0,180,255,.26)",
        deep: "rgba(0,90,255,.13)",
        portal: "rgba(0,225,255,.32)"
    },
    "planet-blue": {
        theme: "dome-shell",
        accent: "rgba(80,230,255,.95)",
        soft: "rgba(60,190,255,.22)",
        deep: "rgba(0,120,180,.12)",
        portal: "rgba(75,220,255,.28)"
    },
    "planet-gold": {
        theme: "laskagomba-mester",
        accent: "rgba(255,205,92,.95)",
        soft: "rgba(255,180,70,.24)",
        deep: "rgba(110,80,20,.13)",
        portal: "rgba(255,205,92,.30)"
    }
};

let activeTheme = null;
let activationTimer = null;

function getProjectKey(link) {
    return Object.keys(projectAccents).find((name) => link.classList.contains(name));
}

function getProjectAccent(link) {
    const key = getProjectKey(link);
    return projectAccents[key] || projectAccents["planet-gold"];
}

function clearProjectThemeClasses() {
    document.body.classList.remove(
        "theme-freelancer-protocol",
        "theme-nia-os",
        "theme-dome-shell",
        "theme-laskagomba-mester"
    );
}

function applyProjectAccent(link) {
    const accent = getProjectAccent(link);

    activeTheme = accent.theme;

    clearProjectThemeClasses();
    document.body.classList.add(`theme-${accent.theme}`);
    document.body.dataset.activeProject = accent.theme;

    document.documentElement.style.setProperty("--project-accent", accent.accent);
    document.documentElement.style.setProperty("--project-accent-soft", accent.soft);
    document.documentElement.style.setProperty("--project-accent-deep", accent.deep);
    document.documentElement.style.setProperty("--project-portal", accent.portal);

    if (stargate) {
        stargate.classList.remove("gate-pulse-burst");
        window.clearTimeout(activationTimer);

        requestAnimationFrame(() => {
            stargate.classList.add("gate-pulse-burst");
        });

        activationTimer = window.setTimeout(() => {
            stargate.classList.remove("gate-pulse-burst");
        }, 650);
    }
}

function resetProjectAccent() {
    activeTheme = null;
    clearProjectThemeClasses();
    document.body.removeAttribute("data-active-project");

    document.documentElement.style.setProperty("--project-accent", "rgba(255,205,92,.95)");
    document.documentElement.style.setProperty("--project-accent-soft", "rgba(255,205,92,.20)");
    document.documentElement.style.setProperty("--project-accent-deep", "rgba(255,205,92,.08)");
    document.documentElement.style.setProperty("--project-portal", "rgba(255,205,92,.20)");
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
        stargate.classList.remove("gate-pulse-burst");
    }

    resetProjectAccent();

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
        stargate.classList.add("gate-pulse-burst");
    }

    window.setTimeout(() => {
        link.classList.remove("activating");
        window.location.hash = target;
    }, 200);
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
    }, PERFORMANCE.resizeDelayMs);
});

document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAnimation();
    else startAnimation();
});

resetProjectAccent();
resizeCanvas();
setupPortalCanvas();
renderNebulaToBuffer(performance.now());
startAnimation();