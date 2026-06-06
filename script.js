const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });

let stars = [];
let dustStars = [];
let nebulaClouds = [];
let deepParticles = [];
let cyberLines = [];
let distantGalaxies = [];
let gravityWaves = [];
let deepVeils = [];
let width = 0;
let height = 0;
let animationFrameId = null;
let lastFrameTime = 0;
let frameCounter = 0;
let isPageVisible = true;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const PERFORMANCE = {
    targetFps: prefersReducedMotion ? 30 : 50,
    nebulaRefreshMs: prefersReducedMotion ? 800 : 260,
    maxPortalDpr: 1.5,
    starCount: 4700,
    dustQuality: 0.82,
    deepSpaceQuality: 1
};

let frameInterval = 1000 / PERFORMANCE.targetFps;
let backgroundCanvas = document.createElement("canvas");
let backgroundCtx = backgroundCanvas.getContext("2d", { alpha: false, desynchronized: true });
let lastNebulaRender = -Infinity;

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

function createDeepParticles(count) {
    return Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.8 + 0.7,
        alpha: Math.random() * 0.12 + 0.05,
        speedX: (Math.random() - 0.5) * 0.018,
        speedY: Math.random() * 0.018 + 0.004,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.006 + 0.002,
        warm: Math.random() < 0.28
    }));
}

function createCyberLines(count) {
    return Array.from({ length: count }, () => {
        const horizontal = Math.random() < 0.55;

        return {
            x: Math.random() * width,
            y: Math.random() * height,
            length: Math.random() * 180 + 80,
            alpha: Math.random() * 0.035 + 0.012,
            speed: Math.random() * 0.08 + 0.025,
            horizontal,
            phase: Math.random() * Math.PI * 2,
            hue: Math.random() < 0.5 ? "cyan" : "violet"
        };
    });
}

function createDistantGalaxies(count) {
    return Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radiusX: Math.random() * 190 + 90,
        radiusY: Math.random() * 34 + 18,
        rotation: Math.random() * Math.PI,
        alpha: Math.random() * 0.055 + 0.018,
        driftX: (Math.random() - 0.5) * 0.004,
        driftY: (Math.random() - 0.5) * 0.003,
        color: Math.random() < 0.5
            ? { r: 90, g: 150, b: 255 }
            : { r: 185, g: 90, b: 255 }
    }));
}

function createGravityWaves(count) {
    return Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 170 + 140,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.006 + 0.002,
        alpha: Math.random() * 0.012 + 0.004,
        color: Math.random() < 0.55
            ? "0,210,255"
            : "255,175,80"
    }));
}

function createDeepVeils() {
    return [
        {
            x: width * 0.18,
            y: height * 0.50,
            width: width * 0.44,
            height: height * 1.25,
            rotation: -0.28,
            color: [80, 40, 180],
            alpha: 0.040,
            drift: 0.010
        },
        {
            x: width * 0.82,
            y: height * 0.50,
            width: width * 0.46,
            height: height * 1.18,
            rotation: 0.26,
            color: [255, 110, 45],
            alpha: 0.035,
            drift: 0.012
        },
        {
            x: width * 0.50,
            y: height * 0.18,
            width: width * 0.68,
            height: height * 0.36,
            rotation: 0.02,
            color: [0, 190, 255],
            alpha: 0.022,
            drift: 0.008
        }
    ];
}

function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;

    backgroundCanvas.width = width;
    backgroundCanvas.height = height;
    lastNebulaRender = -Infinity;

    const mobileMultiplier = width < 780 ? 0.62 : 1;
    const tabletMultiplier = width < 1180 ? 0.78 : 1;
    const qualityMultiplier = mobileMultiplier * tabletMultiplier;

    stars = Array.from({ length: Math.round(PERFORMANCE.starCount * qualityMultiplier) }, () =>
        createStar(Math.random() * width, Math.random() * height)
    );

    dustStars = [
        ...createDustCluster(width * 0.22, height * 0.22, width * 0.38, height * 0.32, 2400 * qualityMultiplier, 0.38),
        ...createDustCluster(width * 0.78, height * 0.22, width * 0.42, height * 0.34, 2500 * qualityMultiplier, 0.72),
        ...createDustCluster(width * 0.16, height * 0.76, width * 0.22, height * 0.18, 750 * qualityMultiplier, 0.28),
        ...createDustCluster(width * 0.79, height * 0.76, width * 0.22, height * 0.18, 750 * qualityMultiplier, 0.76),
        ...createDustCluster(width * 0.50, height * 0.48, width * 0.56, height * 0.46, 2400 * qualityMultiplier, 0.48),
        ...createDustCluster(width * 0.50, height * 0.20, width * 0.52, height * 0.17, 1100 * qualityMultiplier, 0.50),
        ...createDustCluster(width * 0.50, height * 0.86, width * 0.54, height * 0.16, 900 * qualityMultiplier, 0.46)
    ];

    nebulaClouds = [
        { x: width * 0.18, y: height * 0.18, r: width * 0.56, color: [130, 40, 225], alpha: 0.145, drift: 0.020 },
        { x: width * 0.26, y: height * 0.24, r: width * 0.32, color: [230, 65, 55], alpha: 0.065, drift: 0.018 },
        { x: width * 0.28, y: height * 0.16, r: width * 0.27, color: [80, 125, 245], alpha: 0.045, drift: 0.015 },

        { x: width * 0.78, y: height * 0.20, r: width * 0.66, color: [230, 110, 35], alpha: 0.135, drift: 0.018 },
        { x: width * 0.72, y: height * 0.28, r: width * 0.38, color: [245, 155, 45], alpha: 0.060, drift: 0.016 },
        { x: width * 0.70, y: height * 0.15, r: width * 0.27, color: [65, 105, 235], alpha: 0.040, drift: 0.014 },

        { x: width * 0.14, y: height * 0.82, r: width * 0.30, color: [0, 115, 245], alpha: 0.090, drift: 0.012 },
        { x: width * 0.82, y: height * 0.82, r: width * 0.28, color: [245, 155, 35], alpha: 0.080, drift: 0.012 },

        { x: width * 0.50, y: height * 0.47, r: width * 0.58, color: [0, 165, 245], alpha: 0.052, drift: 0.010 },
        { x: width * 0.50, y: height * 0.52, r: width * 0.86, color: [0, 75, 145], alpha: 0.034, drift: 0.008 },

        { x: width * 0.38, y: height * 0.32, r: width * 0.42, color: [140, 55, 255], alpha: 0.038, drift: 0.011 },
        { x: width * 0.62, y: height * 0.68, r: width * 0.46, color: [0, 210, 255], alpha: 0.026, drift: 0.009 }
    ];

    deepParticles = createDeepParticles(Math.round(70 * qualityMultiplier));
    cyberLines = createCyberLines(Math.round(22 * qualityMultiplier));
    distantGalaxies = createDistantGalaxies(Math.round(7 * qualityMultiplier * PERFORMANCE.deepSpaceQuality));
    gravityWaves = createGravityWaves(Math.round(8 * qualityMultiplier * PERFORMANCE.deepSpaceQuality));
    deepVeils = createDeepVeils();
}

/* BACKGROUND LAYERS */

function drawDeepVeilsToBuffer(t) {
    backgroundCtx.save();
    backgroundCtx.globalCompositeOperation = "screen";

    for (const veil of deepVeils) {
        const driftX = Math.sin(t * veil.drift + veil.rotation) * 26;
        const driftY = Math.cos(t * veil.drift + veil.rotation) * 18;

        backgroundCtx.save();
        backgroundCtx.translate(veil.x + driftX, veil.y + driftY);
        backgroundCtx.rotate(veil.rotation);

        const gradient = backgroundCtx.createRadialGradient(
            0,
            0,
            0,
            0,
            0,
            Math.max(veil.width, veil.height) * 0.62
        );

        gradient.addColorStop(0, `rgba(${veil.color[0]}, ${veil.color[1]}, ${veil.color[2]}, ${veil.alpha})`);
        gradient.addColorStop(0.42, `rgba(${veil.color[0]}, ${veil.color[1]}, ${veil.color[2]}, ${veil.alpha * 0.38})`);
        gradient.addColorStop(0.78, `rgba(${veil.color[0]}, ${veil.color[1]}, ${veil.color[2]}, ${veil.alpha * 0.10})`);
        gradient.addColorStop(1, "rgba(0,0,0,0)");

        backgroundCtx.scale(veil.width / veil.height, 1);
        backgroundCtx.fillStyle = gradient;
        backgroundCtx.beginPath();
        backgroundCtx.arc(0, 0, veil.height * 0.62, 0, Math.PI * 2);
        backgroundCtx.fill();

        backgroundCtx.restore();
    }

    backgroundCtx.restore();
}

function drawDistantGalaxiesToBuffer(t) {
    backgroundCtx.save();
    backgroundCtx.globalCompositeOperation = "screen";

    for (const galaxy of distantGalaxies) {
        const driftX = Math.sin(t * 0.010 + galaxy.rotation) * 18;
        const driftY = Math.cos(t * 0.008 + galaxy.rotation) * 10;

        galaxy.x += galaxy.driftX;
        galaxy.y += galaxy.driftY;

        if (galaxy.x < -galaxy.radiusX) galaxy.x = width + galaxy.radiusX;
        if (galaxy.x > width + galaxy.radiusX) galaxy.x = -galaxy.radiusX;
        if (galaxy.y < -galaxy.radiusX) galaxy.y = height + galaxy.radiusX;
        if (galaxy.y > height + galaxy.radiusX) galaxy.y = -galaxy.radiusX;

        backgroundCtx.save();
        backgroundCtx.translate(galaxy.x + driftX, galaxy.y + driftY);
        backgroundCtx.rotate(galaxy.rotation);

        const core = backgroundCtx.createRadialGradient(0, 0, 0, 0, 0, galaxy.radiusX);
        core.addColorStop(0, `rgba(255,255,255,${galaxy.alpha * 0.75})`);
        core.addColorStop(0.18, `rgba(${galaxy.color.r},${galaxy.color.g},${galaxy.color.b},${galaxy.alpha})`);
        core.addColorStop(0.52, `rgba(${galaxy.color.r},${galaxy.color.g},${galaxy.color.b},${galaxy.alpha * 0.24})`);
        core.addColorStop(1, "rgba(0,0,0,0)");

        backgroundCtx.scale(1, galaxy.radiusY / galaxy.radiusX);
        backgroundCtx.fillStyle = core;
        backgroundCtx.beginPath();
        backgroundCtx.arc(0, 0, galaxy.radiusX, 0, Math.PI * 2);
        backgroundCtx.fill();

        backgroundCtx.restore();
    }

    backgroundCtx.restore();
}

function drawGravityWaves(time) {
    if (prefersReducedMotion) return;

    const t = time * 0.001;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (const wave of gravityWaves) {
        wave.phase += wave.speed;

        const pulse = (Math.sin(wave.phase) + 1) * 0.5;
        const radius = wave.radius * (0.92 + pulse * 0.18);
        const alpha = wave.alpha * (0.35 + pulse * 0.65);

        ctx.beginPath();
        ctx.arc(wave.x, wave.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${wave.color}, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(${wave.color}, ${alpha * 1.6})`;
        ctx.stroke();

        wave.x += Math.sin(t * 0.05 + wave.y * 0.001) * 0.012;
        wave.y += Math.cos(t * 0.04 + wave.x * 0.001) * 0.010;

        if (wave.x < -radius) wave.x = width + radius;
        if (wave.x > width + radius) wave.x = -radius;
        if (wave.y < -radius) wave.y = height + radius;
        if (wave.y > height + radius) wave.y = -radius;
    }

    ctx.restore();
    ctx.shadowBlur = 0;
}

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

    gradient.addColorStop(0, "#031026");
    gradient.addColorStop(0.42, "#010614");
    gradient.addColorStop(0.78, "#00030a");
    gradient.addColorStop(1, "#000000");

    backgroundCtx.globalCompositeOperation = "source-over";
    backgroundCtx.fillStyle = gradient;
    backgroundCtx.fillRect(0, 0, width, height);

    drawDeepVeilsToBuffer(t);
    drawDistantGalaxiesToBuffer(t);

    backgroundCtx.save();
    backgroundCtx.globalCompositeOperation = "screen";

    for (const cloud of nebulaClouds) {
        const driftX = Math.sin(t * cloud.drift + cloud.x * 0.001) * 24;
        const driftY = Math.cos(t * cloud.drift + cloud.y * 0.001) * 16;

        const cloudGradient = backgroundCtx.createRadialGradient(
            cloud.x + driftX,
            cloud.y + driftY,
            0,
            cloud.x + driftX,
            cloud.y + driftY,
            cloud.r
        );

        cloudGradient.addColorStop(0, `rgba(${cloud.color[0]}, ${cloud.color[1]}, ${cloud.color[2]}, ${cloud.alpha})`);
        cloudGradient.addColorStop(0.38, `rgba(${cloud.color[0]}, ${cloud.color[1]}, ${cloud.color[2]}, ${cloud.alpha * 0.42})`);
        cloudGradient.addColorStop(0.76, `rgba(${cloud.color[0]}, ${cloud.color[1]}, ${cloud.color[2]}, ${cloud.alpha * 0.10})`);
        cloudGradient.addColorStop(1, "rgba(0,0,0,0)");

        backgroundCtx.fillStyle = cloudGradient;
        backgroundCtx.fillRect(0, 0, width, height);
    }

    drawCyberGridToBuffer(t);
    backgroundCtx.restore();
}

function drawCyberGridToBuffer(t) {
    const centerX = width * 0.50;
    const centerY = height * 0.47;
    const gap = width < 780 ? 86 : 118;
    const opacity = width < 780 ? 0.010 : 0.014;

    backgroundCtx.save();
    backgroundCtx.globalCompositeOperation = "screen";

    for (let x = -gap; x < width + gap; x += gap) {
        const drift = Math.sin(t * 0.05 + x * 0.01) * 10;

        backgroundCtx.beginPath();
        backgroundCtx.moveTo(x + drift, 0);
        backgroundCtx.lineTo(centerX + (x - centerX) * 0.22, centerY);
        backgroundCtx.strokeStyle = `rgba(0, 210, 255, ${opacity})`;
        backgroundCtx.lineWidth = 1;
        backgroundCtx.stroke();
    }

    for (let y = -gap; y < height + gap; y += gap) {
        const drift = Math.cos(t * 0.045 + y * 0.01) * 8;

        backgroundCtx.beginPath();
        backgroundCtx.moveTo(0, y + drift);
        backgroundCtx.lineTo(centerX, centerY + (y - centerY) * 0.22);
        backgroundCtx.strokeStyle = `rgba(160, 70, 255, ${opacity * 0.65})`;
        backgroundCtx.lineWidth = 1;
        backgroundCtx.stroke();
    }

    const scan = backgroundCtx.createLinearGradient(0, 0, width, height);
    scan.addColorStop(0, "rgba(0,0,0,0)");
    scan.addColorStop(0.46, "rgba(0,220,255,0.012)");
    scan.addColorStop(0.50, "rgba(255,190,80,0.010)");
    scan.addColorStop(0.54, "rgba(0,220,255,0.012)");
    scan.addColorStop(1, "rgba(0,0,0,0)");

    backgroundCtx.fillStyle = scan;
    backgroundCtx.fillRect(0, 0, width, height);

    backgroundCtx.restore();
}

function drawDeepParticles(time) {
    const t = time * 0.001;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (const particle of deepParticles) {
        particle.pulse += particle.pulseSpeed;

        const alpha = particle.alpha + Math.sin(particle.pulse) * 0.025;
        const color = particle.warm ? "255,190,95" : "120,220,255";

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(${color}, ${alpha * 1.4})`;
        ctx.fillStyle = `rgba(${color}, ${alpha})`;
        ctx.fill();

        particle.x += particle.speedX + Math.sin(t * 0.08 + particle.y * 0.002) * 0.006;
        particle.y += particle.speedY;

        if (particle.x < -20) particle.x = width + 20;
        if (particle.x > width + 20) particle.x = -20;
        if (particle.y > height + 20) {
            particle.y = -20;
            particle.x = Math.random() * width;
        }
    }

    ctx.restore();
    ctx.shadowBlur = 0;
}

function drawCyberLines(time) {
    if (prefersReducedMotion) return;

    const t = time * 0.001;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (const line of cyberLines) {
        line.phase += 0.004;

        const alpha = line.alpha + Math.sin(line.phase) * 0.008;
        const color = line.hue === "cyan" ? "0,220,255" : "160,80,255";

        ctx.beginPath();

        if (line.horizontal) {
            ctx.moveTo(line.x, line.y);
            ctx.lineTo(line.x + line.length, line.y + Math.sin(t + line.phase) * 6);
            line.x += line.speed;
            if (line.x > width + line.length) line.x = -line.length;
        } else {
            ctx.moveTo(line.x, line.y);
            ctx.lineTo(line.x + Math.sin(t + line.phase) * 6, line.y + line.length);
            line.y += line.speed;
            if (line.y > height + line.length) line.y = -line.length;
        }

        ctx.strokeStyle = `rgba(${color}, ${Math.max(0, alpha)})`;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 7;
        ctx.shadowColor = `rgba(${color}, ${Math.max(0, alpha * 1.4)})`;
        ctx.stroke();
    }

    ctx.restore();
    ctx.shadowBlur = 0;
}

function drawGateEnergyField(time) {
    const t = time * 0.001;
    const cx = width * 0.50;
    const cy = height * 0.47;
    const maxRadius = Math.min(width, height) * 0.34;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 1.45);
    glow.addColorStop(0, "rgba(0, 210, 255, 0.034)");
    glow.addColorStop(0.34, "rgba(255, 198, 80, 0.028)");
    glow.addColorStop(0.66, "rgba(0, 120, 255, 0.016)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    if (!prefersReducedMotion) {
        for (let i = 0; i < 3; i++) {
            const radius = maxRadius * (0.82 + i * 0.11 + Math.sin(t * 0.25 + i) * 0.004);

            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(0, 220, 255, ${0.009 - i * 0.0018})`;
            ctx.lineWidth = 1;
            ctx.shadowBlur = 4;
            ctx.shadowColor = "rgba(0, 220, 255, 0.06)";
            ctx.stroke();
        }
    }

    ctx.restore();
    ctx.shadowBlur = 0;
}

function drawStarPoint(star, isDust = false) {
    star.twinkle += star.twinkleSpeed;

    const finalAlpha = Math.max(
        0.045,
        Math.min(1, star.baseAlpha + Math.sin(star.twinkle) * (isDust ? 0.075 : 0.095))
    );

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

    ctx.shadowBlur = star.radius > 1.05 ? 5 : 1.8;
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

    drawGravityWaves(time);
    drawCyberLines(time);
    drawGateEnergyField(time);
    drawDeepParticles(time);

    const drawEveryDustParticle = frameCounter % 2 === 0;

    for (let i = 0; i < dustStars.length; i++) {
        const dust = dustStars[i];

        if (drawEveryDustParticle || i % 2 === 0) {
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
    const steps = prefersReducedMotion ? 90 : 140;

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
    portalCtx.lineWidth = 0.75;
    portalCtx.shadowBlur = 4;
    portalCtx.shadowColor = `rgba(0, 225, 255, ${alpha * 1.1})`;
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

    const liquidShiftX = Math.sin(t * 0.48) * 7;
    const liquidShiftY = Math.cos(t * 0.38) * 6;

    const sheen = portalCtx.createRadialGradient(
        c + liquidShiftX,
        c + liquidShiftY,
        r * 0.08,
        c,
        c,
        r
    );

    sheen.addColorStop(0, "rgba(255, 255, 255, 0.035)");
    sheen.addColorStop(0.24, "rgba(185, 245, 255, 0.040)");
    sheen.addColorStop(0.54, "rgba(0, 210, 255, 0.022)");
    sheen.addColorStop(0.86, "rgba(0, 20, 60, 0.16)");
    sheen.addColorStop(1, "rgba(0, 0, 0, 0)");

    portalCtx.fillStyle = sheen;
    portalCtx.fillRect(0, 0, portalSize, portalSize);

    const ringCount = prefersReducedMotion ? 3 : 4;

    for (let i = 0; i < ringCount; i++) {
        const radius = r * (0.27 + i * 0.13);
        const amp = 2.3 + i * 0.22;
        const alpha = 0.009 + i * 0.0016;

        drawLiquidRing(c, c, radius, amp, t, i * 0.83, alpha);
    }

    const horizontalWaveCount = prefersReducedMotion ? 6 : 8;

    for (let i = 0; i < horizontalWaveCount; i++) {
        const yBase = c - r * 0.58 + (i / (horizontalWaveCount - 1)) * r * 1.16;

        portalCtx.beginPath();

        let hasStarted = false;

        for (let x = c - r; x <= c + r; x += 8) {
            const normalized = (x - c) / r;
            const limit = Math.sqrt(Math.max(0, 1 - normalized * normalized));
            const wave =
                Math.sin(x * 0.019 + t * 0.9 + i * 0.48) * 1.8 +
                Math.sin(x * 0.041 - t * 0.50) * 0.7;

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

        portalCtx.strokeStyle = "rgba(210, 250, 255, 0.010)";
        portalCtx.lineWidth = 0.75;
        portalCtx.shadowBlur = 1.6;
        portalCtx.shadowColor = "rgba(0, 225, 255, 0.04)";
        portalCtx.stroke();
    }

    const membrane = portalCtx.createRadialGradient(c, c, r * 0.08, c, c, r * 0.74);
    membrane.addColorStop(0, "rgba(255,255,255,0.023)");
    membrane.addColorStop(0.24, "rgba(160,235,255,0.026)");
    membrane.addColorStop(0.58, "rgba(0,200,255,0.014)");
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

    projectTooltip.style.left = `${x}px`;
    projectTooltip.style.top = `${y}px`;
}

function showProjectTooltip(link, event) {
    applyProjectAccent(link);

    if (stargate) {
        stargate.classList.add("gate-active");
    }

    if (projectTooltip && tooltipTitle && tooltipSubtitle) {
        tooltipTitle.textContent = link.dataset.title || "L.J. Freelancer Project Center";
        tooltipSubtitle.textContent = link.dataset.subtitle || "Válassz egy projektet a belépéshez.";
        projectTooltip.classList.add("is-visible");
        projectTooltip.setAttribute("aria-hidden", "false");
        updateTooltipPosition(event);
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
    }, 260);
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
        drawEventHorizon(time);
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
    }, 140);
});

document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAnimation();
    else startAnimation();
});

resizeCanvas();
setupPortalCanvas();
renderNebulaToBuffer(performance.now());
startAnimation();