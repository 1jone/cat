/**
 * BubbleFishRenderer - 气泡鱼渲染器
 * 透明气泡包裹的小鱼 + HP 气泡缩小 + 气泡高光 + HP 指示器
 * 需要多次点击才能捕获
 */

export class BubbleFishRenderer {
    constructor(config = {}) {
        this.config = {
            fishColor: '#FF8C42',
            fishHighlight: '#FFB366',
            fishSize: 0.6,
            bubbleColor: 'rgba(135, 206, 250, 0.4)',
            bubbleStroke: 'rgba(135, 206, 250, 0.7)',
            bubbleHighlight: 'rgba(255, 255, 255, 0.6)',
            bubbleWobbleSpeed: 3,
            bubbleWobbleAmplitude: 2,
            bubbleShrinkFactor: 0.7,
            explosionColors: [
                '#87CEEB', '#ADD8E6', '#B0E0E6', '#E0F7FA', '#FFFFFF'
            ],
        };
        if (config.bubblefishConfig) Object.assign(this.config, config.bubblefishConfig);
    }

    render(ctx, position, radius, rotation, time, scale = 1, isMoving = true, speed = 100, state = {}) {
        const { hp = 1, maxHp = 1, isStartled = false, clickIntensity = 0 } = state;
        const hpRatio = maxHp > 1 ? hp / maxHp : 1;

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.scale(scale, scale);

        const clickWobble = clickIntensity > 0 ? Math.sin(time * 30) * 5 * clickIntensity : 0;
        ctx.translate(clickWobble, 0);

        this.renderBubble(ctx, radius, time, hpRatio);
        this.renderFish(ctx, radius, time, isStartled);
        this.renderBubbleHighlight(ctx, radius, time, hpRatio);

        if (maxHp > 1) {
            this.renderHpIndicator(ctx, radius, hp, maxHp);
        }

        ctx.restore();
    }

    renderBubble(ctx, radius, time, hpRatio) {
        const shrinkRange = 1.0 - this.config.bubbleShrinkFactor;
        const bubbleRadius = radius * (this.config.bubbleShrinkFactor + shrinkRange * hpRatio);
        const wobble = Math.sin(time * this.config.bubbleWobbleSpeed) * this.config.bubbleWobbleAmplitude;

        ctx.beginPath();
        ctx.arc(wobble, 0, bubbleRadius, 0, Math.PI * 2);
        ctx.fillStyle = this.config.bubbleColor;
        ctx.fill();
        ctx.strokeStyle = this.config.bubbleStroke;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    renderFish(ctx, radius, time, isStartled) {
        const fishSize = radius * this.config.fishSize;
        const tailFlutter = Math.sin(time * 10) * (isStartled ? 0.6 : 0.3);

        ctx.save();
        ctx.scale(-1, 1);

        // 鱼尾
        ctx.fillStyle = this.config.fishColor;
        ctx.beginPath();
        ctx.moveTo(-fishSize * 0.5, 0);
        ctx.lineTo(-fishSize * 1.2, -fishSize * 0.5 + tailFlutter * fishSize * 0.3);
        ctx.lineTo(-fishSize * 1.2, fishSize * 0.5 + tailFlutter * fishSize * 0.3);
        ctx.closePath();
        ctx.fill();

        // 鱼身
        ctx.fillStyle = this.config.fishHighlight;
        ctx.beginPath();
        ctx.ellipse(0, 0, fishSize * 0.8, fishSize * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 鱼身渐变覆盖
        const bodyGrad = ctx.createRadialGradient(fishSize * 0.1, -fishSize * 0.1, 0, 0, 0, fishSize * 0.8);
        bodyGrad.addColorStop(0, this.config.fishHighlight);
        bodyGrad.addColorStop(1, this.config.fishColor);
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, fishSize * 0.8, fishSize * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // 鱼眼
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(fishSize * 0.35, -fishSize * 0.1, fishSize * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(fishSize * 0.4, -fishSize * 0.1, fishSize * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // 鱼鳍
        ctx.fillStyle = 'rgba(255, 140, 66, 0.7)';
        ctx.beginPath();
        ctx.moveTo(0, fishSize * 0.3);
        ctx.lineTo(-fishSize * 0.3, fishSize * 0.7);
        ctx.lineTo(fishSize * 0.2, fishSize * 0.3);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    renderBubbleHighlight(ctx, radius, time, hpRatio) {
        const shrinkRange = 1.0 - this.config.bubbleShrinkFactor;
        const bubbleRadius = radius * (this.config.bubbleShrinkFactor + shrinkRange * hpRatio);
        const wobble = Math.sin(time * this.config.bubbleWobbleSpeed) * this.config.bubbleWobbleAmplitude;

        ctx.save();
        ctx.translate(wobble - bubbleRadius * 0.25, -bubbleRadius * 0.3);
        ctx.scale(1, 0.6);
        ctx.fillStyle = this.config.bubbleHighlight;
        ctx.beginPath();
        ctx.arc(0, 0, bubbleRadius * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    renderHpIndicator(ctx, radius, hp, maxHp) {
        const dotRadius = 3;
        const dotSpacing = 10;
        const startX = -(maxHp - 1) * dotSpacing / 2;
        const y = -radius - 8;

        for (let i = 0; i < maxHp; i++) {
            ctx.beginPath();
            ctx.arc(startX + i * dotSpacing, y, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = i < hp ? '#87CEEB' : 'rgba(150, 150, 150, 0.4)';
            ctx.fill();
        }
    }
}
