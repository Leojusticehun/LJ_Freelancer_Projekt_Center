const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");

let stars = [];
let dustStars = [];
let nebulaClouds = [];
let width = 0;
let height = 0;

/* STARFIELD */

function createStar(x, y, localBoost = 1) {
    const sizeRoll = Math.random();

    let radius;
    let alpha;
    let speed;
    let depth;

    if (sizeRoll < 0.88) {
        radius = Math.random() * 0.42 + 0.06;
        alpha = Math.random() * 0.48 + 0.20;
        speed = Math.random() * 0.020 + 0.004;
        depth = 0.35;
    } else if (sizeRoll < 0.985) {
        radius = Math.random() * 0.85 + 0.28;
        alpha = Math.random() * 0.52 + 0.30;
        speed = Math.random() * 0.045 + 0.010;
        depth = 0.65;
    } else {
        radius = Math.random() * 1.25 + 0.60;
        alpha = Math.random() * 0.40 + 0.45;
        speed = Math.random() * 0.075 + 0.018;
        depth = 1.0;
    }

    const warmStar = Math.random() < 0.18;

    return {
        x,
        y,
        radius: radius * localBoost,
        speed,
        depth,
        baseAlpha: alpha,
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.012 + 0.003,
        color: warmStar
            ? { r: 255, g: 214, b: 145 }
            : { r: 185, g: 238, b: 255 }
    };
}

function createDustCluster(cx, cy, spreadX, spreadY, count, warmBias = 0.5) {
    const cluster = [];

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.pow(Math.random(), 0.62);

        const x = cx + Math.cos(angle) * spreadX * distance;
        const y = cy + Math.sin(angle) * spreadY * distance;

        const warm = Math.random() < warmBias;

        cluster.push({
            x,
            y,
            radius: Math.random() * 0.46 + 0.045,
            baseAlpha: Math.random() * 0.30 + 0.10,
            twinkle: Math.random() * Math.PI * 2,
            twinkleSpeed: Math.random() * 0.010 + 0.003,
            driftX: (Math.random() - 0.5) * 0.010,
            driftY: (Math.random() - 0.5) * 0.010,
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

    stars = Array.from({ length: 5600 }, () =>
        createStar(Math.random() * width, Math.random() * height)
    );

    dustStars = [
        ...createDustCluster(width * 0.22, height * 0.22, width * 0.38, height * 0.32, 2300, 0.38),
        ...createDustCluster(width * 0.78, height * 0.22, width * 0.42, height * 0.34, 2400, 0.72),
        ...createDustCluster(width * 0.16, height * 0.76, width * 0.22, height * 0.18, 650, 0.28),
        ...createDustCluster(width * 0.79, height * 0.76, width * 0.22, height * 0.18, 650, 0.76),
        ...createDustCluster(width * 0.50, height * 0.48, width * 0.54, height * 0.44, 2100, 0.48),
        ...createDustCluster(width * 0.50, height * 0.20, width * 0.50, height * 0.16, 950, 0.50),
        ...createDustCluster(width * 0.50, height * 0.86, width * 0.52, height * 0.15, 750, 0.46)
    ];

    nebulaClouds = [
        { x: width * 0.18, y: height * 0.18, r: width * 0.52, color: [120, 40, 210], alpha: 0.13, drift: 0.020 },
        { x: width * 0.26, y: height * 0.24, r: width * 0.30, color: [220, 70, 55], alpha: 0.060, drift: 0.018 },
        { x: width * 0.28, y: height * 0.16, r: width * 0.24, color: [80, 120, 230], alpha: 0.040, drift: 0.015 },

        { x: width * 0.78, y: height * 0.20, r: width * 0.62, color: [220, 110, 35], alpha: 0.125, drift: 0.018 },
        { x: width * 0.72, y: height * 0.28, r: width * 0.34, color: [235, 150, 45], alpha: 0.055, drift: 0.016 },
        { x: width * 0.70, y: height * 0.15, r: width * 0.24, color: [60, 100, 220], alpha: 0.035, drift: 0.014 },

        { x: width * 0.14, y: height * 0.82, r: width * 0.28, color: [0, 110, 230], alpha: 0.080, drift: 0.012 },
        { x: width * 0.82, y: height * 0.82, r: width * 0.26, color: [235, 150, 35], alpha: 0.070, drift: 0.012 },

        { x: width * 0.50, y: height * 0.47, r: width * 0.56, color: [0, 150, 230], alpha: 0.050, drift: 0.010 },
        { x: width * 0.50, y: height * 0.52, r: width * 0.82, color: [0, 70, 135], alpha: 0.030, drift: 0.008 }
    ];
}

/* BACKGROUND LAYERS */

function drawNebula(time) {
    const t = time * 0.001;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (const cloud of nebulaClouds) {
        const driftX = Math.sin(t * cloud.drift + cloud.x * 0.001) * 24;
        const driftY = Math.cos(t * cloud.drift + cloud.y * 0.001) * 16;

        const gradient = ctx.createRadialGradient(
            cloud.x + driftX,
            cloud.y + driftY,
            0,
            cloud.x + driftX,
            cloud.y + driftY,
            cloud.r
        );

        gradient.addColorStop(0, `rgba(${cloud.color[0]}, ${cloud.color[1]}, ${cloud.color[2]}, ${cloud.alpha})`);
        gradient.addColorStop(0.38, `rgba(${cloud.color[0]}, ${cloud.color[1]}, ${cloud.color[2]}, ${cloud.alpha * 0.42})`);
        gradient.addColorStop(0.76, `rgba(${cloud.color[0]}, ${cloud.color[1]}, ${cloud.color[2]}, ${cloud.alpha * 0.10})`);
        gradient.addColorStop(1, "rgba(0,0,0,0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    ctx.restore();
}

function drawGateEnergyField(time) {
    const t = time * 0.001;
    const cx = width * 0.50;
    const cy = height * 0.47;
    const maxRadius = Math.min(width, height) * 0.34;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 1.45);
    glow.addColorStop(0, "rgba(0, 210, 255, 0.030)");
    glow.addColorStop(0.34, "rgba(255, 198, 80, 0.026)");
    glow.addColorStop(0.66, "rgba(0, 120, 255, 0.014)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 4; i++) {
        const radius = maxRadius * (0.76 + i * 0.105 + Math.sin(t * 0.35 + i) * 0.006);

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 220, 255, ${0.010 - i * 0.0017})`;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 6;
        ctx.shadowColor = "rgba(0, 220, 255, 0.08)";
        ctx.stroke();
    }

    ctx.restore();
    ctx.shadowBlur = 0;
}

function drawStarPoint(star, isDust = false) {
    star.twinkle += star.twinkleSpeed;

    const finalAlpha = Math.max(
        0.045,
        Math.min(1, star.baseAlpha + Math.sin(star.twinkle) * (isDust ? 0.09 : 0.11))
    );

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

    ctx.shadowBlur = star.radius > 1.05 ? 6 : 2.2;
    ctx.shadowColor = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${finalAlpha})`;
    ctx.fillStyle = `rgba(${star.color.r}, ${star.color.g}, ${star.color.b}, ${finalAlpha})`;
    ctx.fill();
    ctx.shadowBlur = 0;
}

function drawStars(time) {
    const t = time * 0.001;

    ctx.clearRect(0, 0, width, height);

    const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height)
    );

    gradient.addColorStop(0, "#020714");
    gradient.addColorStop(0.46, "#01040d");
    gradient.addColorStop(1, "#000000");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    drawNebula(time);
    drawGateEnergyField(time);

    for (const dust of dustStars) {
        drawStarPoint(dust, true);

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
        star.x += Math.sin(t * 0.08 + star.y * 0.002) * 0.006 * star.depth;

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
    portalCtx = portalCanvas.getContext("2d");

    resizePortalCanvas();
}

function resizePortalCanvas() {
    if (!portalCanvas || !gateCore) return;

    const rect = gateCore.getBoundingClientRect();
    portalSize = Math.max(1, Math.round(rect.width));
    portalDpr = Math.min(window.devicePixelRatio || 1, 2);

    portalCanvas.width = Math.round(portalSize * portalDpr);
    portalCanvas.height = Math.round(portalSize * portalDpr);

    portalCtx.setTransform(portalDpr, 0, 0, portalDpr, 0, 0);
}

function drawLiquidRing(cx, cy, baseRadius, amplitude, time, phase, alpha) {
    const steps = 220;

    portalCtx.beginPath();

    for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * Math.PI * 2;

        const ripple =
            Math.sin(angle * 2 + time * 0.65 + phase) * amplitude +
            Math.sin(angle * 5 - time * 0.45 + phase * 0.6) * amplitude * 0.42 +
            Math.sin(angle * 9 + time * 0.32) * amplitude * 0.18;

        const rr = baseRadius + ripple;
        const x = cx + Math.cos(angle) * rr;
        const y = cy + Math.sin(angle) * rr;

        if (i === 0) portalCtx.moveTo(x, y);
        else portalCtx.lineTo(x, y);
    }

    portalCtx.closePath();

    portalCtx.strokeStyle = `rgba(205, 250, 255, ${alpha})`;
    portalCtx.lineWidth = 0.8;
    portalCtx.shadowBlur = 5;
    portalCtx.shadowColor = `rgba(0, 225, 255, ${alpha * 1.25})`;
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
    base.addColorStop(0, "rgba(90, 205, 235, 0.10)");
    base.addColorStop(0.30, "rgba(30, 145, 210, 0.20)");
    base.addColorStop(0.58, "rgba(10, 72, 145, 0.48)");
    base.addColorStop(0.82, "rgba(2, 28, 76, 0.90)");
    base.addColorStop(1, "rgba(0, 4, 20, 1)");

    portalCtx.fillStyle = base;
    portalCtx.fillRect(0, 0, portalSize, portalSize);

    const liquidShiftX = Math.sin(t * 0.55) * 9;
    const liquidShiftY = Math.cos(t * 0.42) * 8;

    const sheen = portalCtx.createRadialGradient(
        c + liquidShiftX,
        c + liquidShiftY,
        r * 0.08,
        c,
        c,
        r
    );

    sheen.addColorStop(0, "rgba(255, 255, 255, 0.04)");
    sheen.addColorStop(0.24, "rgba(185, 245, 255, 0.045)");
    sheen.addColorStop(0.54, "rgba(0, 210, 255, 0.025)");
    sheen.addColorStop(0.86, "rgba(0, 20, 60, 0.16)");
    sheen.addColorStop(1, "rgba(0, 0, 0, 0)");

    portalCtx.fillStyle = sheen;
    portalCtx.fillRect(0, 0, portalSize, portalSize);

    for (let i = 0; i < 5; i++) {
        const radius = r * (0.25 + i * 0.115);
        const amp = 2.7 + i * 0.25;
        const alpha = 0.010 + i * 0.002;

        drawLiquidRing(c, c, radius, amp, t, i * 0.83, alpha);
    }

    for (let i = 0; i < 3; i++) {
        const pulseRadius = r * (0.30 + ((t * 0.055 + i * 0.28) % 0.62));
        const pulseAlpha = 0.035 * (1 - pulseRadius / r);

        drawLiquidRing(c, c, pulseRadius, 4.8, t, i * 1.7, pulseAlpha);
    }

    const horizontalWaveCount = 12;

    for (let i = 0; i < horizontalWaveCount; i++) {
        const yBase = c - r * 0.62 + (i / (horizontalWaveCount - 1)) * r * 1.24;

        portalCtx.beginPath();

        let hasStarted = false;

        for (let x = c - r; x <= c + r; x += 6) {
            const normalized = (x - c) / r;
            const limit = Math.sqrt(Math.max(0, 1 - normalized * normalized));
            const wave =
                Math.sin(x * 0.019 + t * 1.05 + i * 0.48) * 2.2 +
                Math.sin(x * 0.041 - t * 0.58) * 0.9;

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

        portalCtx.strokeStyle = "rgba(210, 250, 255, 0.012)";
        portalCtx.lineWidth = 0.8;
        portalCtx.shadowBlur = 2;
        portalCtx.shadowColor = "rgba(0, 225, 255, 0.05)";
        portalCtx.stroke();
    }

    const membrane = portalCtx.createRadialGradient(c, c, r * 0.08, c, c, r * 0.74);
    membrane.addColorStop(0, "rgba(255,255,255,0.026)");
    membrane.addColorStop(0.24, "rgba(160,235,255,0.028)");
    membrane.addColorStop(0.58, "rgba(0,200,255,0.015)");
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

/* PROJECT HOVER FALLBACK */

const projectLinks = document.querySelectorAll(".project-link");
const missionTitle = document.getElementById("missionTitle");
const missionSubtitle = document.getElementById("missionSubtitle");

if (missionTitle && missionSubtitle) {
    projectLinks.forEach((link) => {
        link.addEventListener("mouseenter", () => {
            missionTitle.textContent = link.dataset.title;
            missionSubtitle.textContent = link.dataset.subtitle;
        });

        link.addEventListener("mouseleave", () => {
            missionTitle.textContent = "L.J. Freelancer Project Center";
            missionSubtitle.textContent = "Válassz egy projektet a belépéshez.";
        });
    });
}

/* MAIN LOOP */

function animate(time) {
    drawStars(time);
    drawEventHorizon(time);
    requestAnimationFrame(animate);
}

window.addEventListener("resize", () => {
    resizeCanvas();
    resizePortalCanvas();
});

resizeCanvas();
setupPortalCanvas();
requestAnimationFrame(animate);