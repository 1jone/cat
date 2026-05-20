/**
 * BouncyBallRenderer - 弹力球渲染器
 * 高速弹跳球 + 速度拖尾 + 脉冲光晕 + 旋转条纹
 */

export class BouncyBallRenderer {
    constructor(config = {}) {
        this.config = {
            ballColor: '#FF4444',
            ballHighlight: '#FF8888',
            ballGlow: 'rgba(255, 68, 68, 0.4)',
            trailLength: 5,
            explosionColors: ['#FF4444', '#FF6666', '#FF8888', '#FFAAAA', '#FFFFFF'],
        };
        if (config.bouncyballConfig) Object.assign(this.config, config.bouncyballConfig);
    }

    render(ctx, position, radius, rotation, time, scale = 1, isMoving = true, speed = 280) {
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.scale(scale, scale);

        if (isMoving && speed > 100) {
            this.renderTrail(ctx, radius, rotation);
        }

        this.renderGlow(ctx, radius, time);
        this.renderBody(ctx, radius, time);
        this.renderHighlight(ctx, radius);
        this.renderStripe(ctx, radius, rotation);

        ctx.restore();
    }

    renderTrail(ctx, radius, rotation) {
        const trailDir = rotation + Math.PI;
        for (let i = 1; i <= this.config.trailLength; i++) {
            const alpha = 0.3 * (1 - i / this.config.trailLength);
            const offset = i * radius * 0.6;
            const tx = Math.cos(trailDir) * offset;
            const ty = Math.sin(trailDir) * offset;
            const trailRadius = radius * (1 - i * 0.1);

            ctx.globalAlpha = alpha;
            ctx.fillStyle = this.config.ballColor;
            ctx.beginPath();
            ctx.arc(tx, ty, trailRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    renderGlow(ctx, radius, time) {
        const glowPulse = 1 + Math.sin(time * 8) * 0.15;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.5 * glowPulse);
        gradient.addColorStop(0, this.config.ballGlow);
        gradient.addColorStop(1, 'rgba(255, 68, 68, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.5 * glowPulse, 0, Math.PI * 2);
        ctx.fill();
    }

    renderBody(ctx, radius, time) {
        const bodyGrad = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
        bodyGrad.addColorStop(0, this.config.ballHighlight);
        bodyGrad.addColorStop(0.7, this.config.ballColor);
        bodyGrad.addColorStop(1, '#CC0000');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    renderHighlight(ctx, radius) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(-radius * 0.25, -radius * 0.25, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    renderStripe(ctx, radius, rotation) {
        ctx.save();
        ctx.rotate(rotation);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -radius * 0.6);
        ctx.lineTo(0, radius * 0.6);
        ctx.stroke();
        ctx.restore();
    }
}
