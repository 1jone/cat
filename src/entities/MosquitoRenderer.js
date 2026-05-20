export class MosquitoRenderer {
    constructor(config = {}) {
        this.config = {
            bodyColor: '#FFD93D',
            bodyHighlight: '#FFF3A3',
            wingColor: 'rgba(255,255,255,0.55)',
            wingVeinColor: 'rgba(255,255,255,0.18)',
            legColor: '#7A5A00',
            proboscisColor: '#B8860B',
            eyeColor: '#7DF9FF',

            bodyLength: 0.65,
            bodyWidth: 0.18,
            headRadius: 0.14,

            wingLength: 0.75,
            wingWidth: 0.3,
            wingFlapSpeed: 42,

            legLength: 0.7,
            legPairs: 3,

            proboscisLength: 0.5,

            glowColor: 'rgba(255, 235, 120, 0.75)',
            glowOuterColor: 'rgba(255, 220, 80, 0.25)',
            glowRadius: 1.8,
            pulseSpeed: 4,
        };

        Object.assign(this.config, config.renderConfig || {});
    }

    render(ctx, position, radius, rotation, time, scale = 1, isMoving = true, speed = 220) {
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.scale(scale, scale);

        const autoTilt = isMoving ? Math.sin(time * 5) * 0.1 : 0;
        ctx.rotate(rotation + autoTilt);

        const jitterX = isMoving ? Math.sin(time * 22) * 0.8 : 0;
        const jitterY = isMoving ? Math.cos(time * 19) * 0.8 : 0;
        ctx.translate(jitterX, jitterY);

        const wingFlap = Math.sin(time * this.config.wingFlapSpeed);

        this.renderGlow(ctx, radius, time);
        this.renderWings(ctx, radius, wingFlap);
        this.renderLegs(ctx, radius, time);
        this.renderBody(ctx, radius);
        this.renderHead(ctx, radius);
        this.renderProboscis(ctx, radius);
        this.renderEye(ctx, radius);

        ctx.restore();
    }

    renderGlow(ctx, radius, time) {
        const { glowColor, glowOuterColor, glowRadius, pulseSpeed } = this.config;
        const pulse = 1 + Math.sin(time * pulseSpeed) * 0.15;
        const outerR = radius * glowRadius * pulse;

        const outerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, outerR);
        outerGlow.addColorStop(0, glowColor);
        outerGlow.addColorStop(0.5, glowOuterColor);
        outerGlow.addColorStop(1, 'rgba(255, 220, 80, 0)');

        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(0, 0, outerR, 0, Math.PI * 2);
        ctx.fill();
    }

    renderBody(ctx, radius) {
        const { bodyColor, bodyHighlight, bodyLength, bodyWidth } = this.config;
        const len = radius * bodyLength;
        const wid = radius * bodyWidth;

        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, wid, len, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = bodyHighlight;
        ctx.beginPath();
        ctx.ellipse(wid * 0.3, -len * 0.1, wid * 0.3, len * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    renderHead(ctx, radius) {
        const { bodyColor, headRadius, bodyLength } = this.config;
        const headR = radius * headRadius;
        const headY = -radius * bodyLength - headR * 0.3;

        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, headY, headR, 0, Math.PI * 2);
        ctx.fill();
    }

    renderEye(ctx, radius) {
        const { eyeColor, headRadius, bodyLength } = this.config;
        const headR = radius * headRadius;
        const headY = -radius * bodyLength - headR * 0.3;
        const eyeSize = headR * 0.35;

        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(-headR * 0.5, headY - headR * 0.1, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(headR * 0.5, headY - headR * 0.1, eyeSize, 0, Math.PI * 2);
        ctx.fill();
    }

    renderProboscis(ctx, radius) {
        const { proboscisColor, proboscisLength, headRadius, bodyLength } = this.config;
        const headR = radius * headRadius;
        const headY = -radius * bodyLength - headR * 0.3;
        const probLen = radius * proboscisLength;

        ctx.strokeStyle = proboscisColor;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, headY - headR);
        ctx.lineTo(0, headY - headR - probLen);
        ctx.stroke();
    }

    renderWings(ctx, radius, flap) {
        const { wingColor, wingVeinColor, wingLength, wingWidth, bodyLength } = this.config;
        const wingLen = radius * wingLength;
        const wingWid = radius * wingWidth;
        const attachY = -radius * bodyLength * 0.3;

        ctx.save();

        ctx.fillStyle = wingColor;
        ctx.strokeStyle = wingVeinColor;
        ctx.lineWidth = 0.5;

        for (let side = -1; side <= 1; side += 2) {
            ctx.save();
            ctx.scale(side, 1);
            ctx.rotate(flap * 0.35 * side);

            ctx.beginPath();
            ctx.ellipse(wingWid * 0.3, attachY - wingLen * 0.5, wingWid * 0.5, wingLen * 0.5, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(wingWid * 0.1, attachY);
            ctx.quadraticCurveTo(wingWid * 0.5, attachY - wingLen * 0.3, wingWid * 0.4, attachY - wingLen * 0.9);
            ctx.stroke();

            ctx.restore();
        }

        ctx.restore();
    }

    renderLegs(ctx, radius, time) {
        const { legColor, legLength, legPairs, bodyLength } = this.config;
        const legLen = radius * legLength;

        ctx.strokeStyle = legColor;
        ctx.lineWidth = 0.8;
        ctx.lineCap = 'round';

        for (let i = 0; i < legPairs; i++) {
            const t = (i + 1) / (legPairs + 1);
            const attachY = radius * bodyLength * (1 - 2 * t);
            const swing = Math.sin(time * 12 + i * 1.2) * 0.15;

            for (let side = -1; side <= 1; side += 2) {
                ctx.save();
                ctx.translate(0, attachY);
                ctx.rotate(side * (0.5 + swing));

                ctx.beginPath();
                ctx.moveTo(0, 0);
                const midX = side * legLen * 0.5;
                const midY = legLen * 0.3;
                ctx.quadraticCurveTo(midX, midY, side * legLen * 0.7, legLen * 0.5);
                ctx.stroke();

                ctx.restore();
            }
        }
    }
}
