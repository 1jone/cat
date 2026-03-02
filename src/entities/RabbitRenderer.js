/**
 * RabbitRenderer - 高刺激抓捕型兔子
 * 特点：
 * - 高频神经抖动
 * - 冲刺拉伸
 * - 尾巴快速摆动
 * - 耳朵警觉后压
 * - 眼睛快速闪烁
 */

export class RabbitRenderer {
    constructor(config = {}) {
        this.config = {
            bodyColor: '#FFFFFF',
            earInnerColor: '#FFB6C1',
            noseColor: '#FFB6C1',
            eyeColor: '#222222',
            eyeHighlight: '#FFFFFF',

            glow: {
                enabled: false
            },

            bounce: {
                amplitude: 8,
                frequency: 8,
                squashAmount: 0.15
            },

            proportions: {
                headSize: 0.45,
                earLength: 0.7,
                earWidth: 0.2,
                bodyWidth: 0.9,
                bodyHeight: 0.5,
                legLength: 0.25,
                tailSize: 0.15
            }
        };

        Object.assign(this.config, config.renderConfig || {});
    }

    render(ctx, position, radius, rotation, time, scale = 1, isMoving = false, speed = 100) {
        ctx.save();
        ctx.translate(position.x, position.y);

        // 高频抖动
        const jitterX = isMoving ? Math.sin(time * 40) * 2 : 0;
        const jitterY = isMoving ? Math.cos(time * 35) * 2 : 0;
        ctx.translate(jitterX, jitterY);

        // 微方向抽动
        const microTwitch = Math.sin(time * 25) * 0.02;
        ctx.rotate(rotation + microTwitch);

        ctx.scale(scale, scale);

        const bounceOffset = this.calculateBounce(time, isMoving, speed);
        const squash = this.calculateSquash(time, isMoving, speed);

        ctx.translate(0, -bounceOffset);

        this.renderTail(ctx, radius, time);
        this.renderBackLegs(ctx, radius, time, isMoving);
        this.renderBody(ctx, radius, squash, isMoving);
        this.renderFrontLegs(ctx, radius, time, isMoving);
        this.renderHead(ctx, radius);
        this.renderEars(ctx, radius, time, isMoving);
        this.renderEyes(ctx, radius, time);
        this.renderNose(ctx, radius);

        ctx.restore();
    }

    calculateBounce(time, isMoving, speed) {
        if (!isMoving) return 0;
        const { bounce } = this.config;
        const frequency = bounce.frequency * (speed / 100);
        const phase = (time * frequency) % (Math.PI * 2);
        return Math.abs(Math.sin(phase)) * bounce.amplitude;
    }

    calculateSquash(time, isMoving, speed) {
        if (!isMoving) return { x: 1, y: 1 };

        const { bounce } = this.config;
        const frequency = bounce.frequency * (speed / 100);
        const phase = (time * frequency) % (Math.PI * 2);
        const bottom = Math.sin(phase);
        const squashAmount = Math.max(0, 1 - Math.abs(bottom)) * bounce.squashAmount;

        return {
            x: 1 + squashAmount,
            y: 1 - squashAmount * 0.5
        };
    }

    renderTail(ctx, radius, time) {
        const { bodyColor, proportions } = this.config;
        const shake = Math.sin(time * 30) * 0.6;

        ctx.save();
        ctx.fillStyle = bodyColor;
        ctx.translate(-radius * proportions.bodyWidth, 0);
        ctx.rotate(shake);

        ctx.beginPath();
        ctx.arc(0, 0, radius * proportions.tailSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    renderBody(ctx, radius, squash, isMoving) {
        const { bodyColor, proportions } = this.config;

        ctx.save();
        ctx.fillStyle = bodyColor;

        ctx.scale(
            squash.x * (isMoving ? 1.2 : 1),
            squash.y * (isMoving ? 0.85 : 1)
        );

        ctx.beginPath();
        ctx.ellipse(
            -radius * 0.1,
            0,
            radius * proportions.bodyWidth,
            radius * proportions.bodyHeight,
            0,
            0,
            Math.PI * 2
        );
        ctx.fill();

        ctx.restore();
    }

    renderBackLegs(ctx, radius, time, isMoving) {
        const { bodyColor, proportions } = this.config;
        const legLength = radius * proportions.legLength;
        const swing = isMoving ? Math.sin(time * 12) * 0.25 : 0;

        ctx.save();
        ctx.fillStyle = bodyColor;

        ctx.translate(-radius * 0.5, 0);
        ctx.rotate(swing);

        ctx.beginPath();
        ctx.ellipse(0, legLength, legLength * 0.4, legLength, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    renderFrontLegs(ctx, radius, time, isMoving) {
        const { bodyColor, proportions } = this.config;
        const legLength = radius * proportions.legLength;
        const swing = isMoving ? Math.sin(time * 12 + Math.PI) * 0.2 : 0;

        ctx.save();
        ctx.fillStyle = bodyColor;

        ctx.translate(radius * 0.3, 0);
        ctx.rotate(swing);

        ctx.beginPath();
        ctx.ellipse(0, legLength, legLength * 0.3, legLength, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    renderHead(ctx, radius) {
        const { bodyColor, proportions } = this.config;
        const headSize = radius * proportions.headSize;

        ctx.save();
        ctx.fillStyle = bodyColor;

        ctx.beginPath();
        ctx.arc(radius * 0.6, 0, headSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    renderEars(ctx, radius, time, isMoving) {
        const { bodyColor, earInnerColor, proportions } = this.config;
        const headSize = radius * proportions.headSize;
        const earLength = radius * proportions.earLength;
        const earWidth = radius * proportions.earWidth;

        const baseX = radius * 0.6;
        const baseY = -headSize * 0.6;

        const sway = Math.sin(time * 2) * 0.05;
        const tilt = isMoving ? -0.8 : -0.3;

        ctx.save();
        ctx.translate(baseX - earWidth, baseY);
        ctx.rotate(tilt + sway);

        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, -earLength * 0.5, earWidth, earLength, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = earInnerColor;
        ctx.beginPath();
        ctx.ellipse(0, -earLength * 0.5, earWidth * 0.6, earLength * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    renderEyes(ctx, radius, time) {
        const { eyeColor, eyeHighlight, proportions } = this.config;
        const headSize = radius * proportions.headSize;
        const eyeSize = headSize * 0.2;

        const blink = Math.sin(time * 20) > 0.85 ? 0 : 1;

        ctx.save();
        ctx.globalAlpha = blink;

        const eyeX = radius * 0.6 + headSize * 0.4;

        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(eyeX, -eyeSize * 0.3, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = eyeHighlight;
        ctx.beginPath();
        ctx.arc(eyeX - eyeSize * 0.3, -eyeSize * 0.6, eyeSize * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    renderNose(ctx, radius) {
        const { noseColor, proportions } = this.config;
        const headSize = radius * proportions.headSize;
        const noseSize = headSize * 0.12;

        ctx.save();
        ctx.fillStyle = noseColor;

        const noseX = radius * 0.6 + headSize * 0.85;

        ctx.beginPath();
        ctx.ellipse(noseX, 0, noseSize, noseSize * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}