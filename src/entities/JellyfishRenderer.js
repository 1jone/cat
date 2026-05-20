/**
 * JellyfishRenderer - 水母渲染器
 * 半透明发光水母 + 呼吸动画 + 触须飘动
 * 膨胀时体积大但低分，收缩时体积小但高分
 */

export class JellyfishRenderer {
    constructor(config = {}) {
        this.config = {
            bodyColor: 'rgba(180, 120, 255, 0.6)',
            bodyHighlight: 'rgba(220, 180, 255, 0.4)',
            tentacleColor: 'rgba(160, 100, 240, 0.5)',
            tentacleCount: 6,
            tentacleLength: 1.2,
            glowColor: 'rgba(180, 120, 255, 0.3)',
            innerGlow: 'rgba(255, 200, 255, 0.5)',
            breathSpeed: 1.5,
            breathAmplitude: 0.4,
        };
        if (config.jellyfishConfig) Object.assign(this.config, config.jellyfishConfig);
    }

    render(ctx, position, radius, rotation, time, scale = 1, isMoving = true, speed = 50) {
        const breathPhase = (Math.sin(time * this.config.breathSpeed) + 1) / 2;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.scale(scale, scale);

        this.renderGlow(ctx, radius, time);
        this.renderTentacles(ctx, radius, time, breathPhase);
        this.renderBody(ctx, radius, breathPhase, time);
        this.renderInnerGlow(ctx, radius, breathPhase);
        this.renderPointsIndicator(ctx, radius, breathPhase);

        ctx.restore();
    }

    renderGlow(ctx, radius, time) {
        const pulse = 1 + Math.sin(time * 2) * 0.1;
        const glowR = radius * 1.8 * pulse;
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR);
        gradient.addColorStop(0, this.config.glowColor);
        gradient.addColorStop(1, 'rgba(180, 120, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowR, 0, Math.PI * 2);
        ctx.fill();
    }

    renderTentacles(ctx, radius, time, breathPhase) {
        const count = this.config.tentacleCount;
        const tentacleLen = radius * this.config.tentacleLength;

        for (let i = 0; i < count; i++) {
            const angle = (i / (count - 1)) * Math.PI * 0.8 - Math.PI * 0.4 + Math.PI / 2;
            const startX = Math.cos(angle) * radius * 0.5;
            const startY = radius * 0.15;

            ctx.save();
            ctx.translate(startX, startY);

            const waveOffset = Math.sin(time * 2 + i * 0.8) * radius * 0.3;
            const waveOffset2 = Math.sin(time * 2.5 + i * 1.2) * radius * 0.2;

            ctx.strokeStyle = this.config.tentacleColor;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(
                waveOffset, tentacleLen * 0.3,
                waveOffset2, tentacleLen * 0.6,
                waveOffset * 0.5, tentacleLen * (0.8 + breathPhase * 0.4)
            );
            ctx.stroke();

            ctx.restore();
        }
    }

    renderBody(ctx, radius, breathPhase, time) {
        const squish = 1 - breathPhase * this.config.breathAmplitude * 0.5;
        const width = radius * squish;
        const height = radius * (1 + breathPhase * 0.3);

        const gradient = ctx.createRadialGradient(0, -height * 0.2, 0, 0, 0, width);
        gradient.addColorStop(0, this.config.innerGlow);
        gradient.addColorStop(0.6, this.config.bodyColor);
        gradient.addColorStop(1, 'rgba(140, 80, 220, 0.3)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, width, height, 0, Math.PI, 0);
        ctx.quadraticCurveTo(width * 0.3, height * 0.15, 0, height * 0.1);
        ctx.quadraticCurveTo(-width * 0.3, height * 0.15, -width, 0);
        ctx.fill();

        ctx.strokeStyle = 'rgba(220, 200, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, width, height, 0, Math.PI, 0);
        ctx.stroke();
    }

    renderInnerGlow(ctx, radius, breathPhase) {
        const intensity = 0.3 + breathPhase * 0.4;
        const innerR = radius * 0.4;
        const gradient = ctx.createRadialGradient(0, -radius * 0.1, 0, 0, -radius * 0.1, innerR);
        gradient.addColorStop(0, `rgba(255, 220, 255, ${intensity})`);
        gradient.addColorStop(1, 'rgba(255, 220, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, -radius * 0.1, innerR, 0, Math.PI * 2);
        ctx.fill();
    }

    renderPointsIndicator(ctx, radius, breathPhase) {
        if (breathPhase > 0.5) {
            const alpha = (breathPhase - 0.5) * 2;
            ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
            ctx.font = `bold ${Math.round(radius * 0.5)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText('!', 0, radius * this.config.tentacleLength + 5);
        }
    }
}
