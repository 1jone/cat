/**
 * 写实风毛线球渲染器
 * 特点：
 * - 柔和径向渐变球体
 * - 椭圆弧线模拟真实缠绕
 * - 平滑真实拖尾
 * - 尾部逐渐变细
 */

export class YarnRenderer {
    constructor(config = {}) {
        this.config = {
            mainColor: '#d97a1e',
            highlightColor: '#ffb347',
            shadowColor: '#a85a14',
            threadColor: '#c96d18',
            threadLineWidth: 1.5
        };

        Object.assign(this.config, config);

        this.trail = [];
        this.maxTrailLength = 30;
    }

    /* ================== 主渲染 ================== */

    render(ctx, position, radius, rotation = 0) {
        ctx.save();

        // 先画拖尾
        this.renderTrail(ctx);

        // 移动到球位置
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);

        // 球体
        this.renderBase(ctx, radius);

        // 缠绕线条
        this.renderThreads(ctx, radius);

        // 高光
        this.renderHighlight(ctx, radius);

        ctx.restore();
    }

    /* ================== 球体 ================== */

    renderBase(ctx, radius) {
        const gradient = ctx.createRadialGradient(
            -radius * 0.4,
            -radius * 0.4,
            radius * 0.1,
            0,
            0,
            radius
        );

        gradient.addColorStop(0, this.config.highlightColor);
        gradient.addColorStop(0.5, this.config.mainColor);
        gradient.addColorStop(1, this.config.shadowColor);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    /* ================== 缠绕线条 ================== */

    renderThreads(ctx, radius) {
        ctx.strokeStyle = this.config.threadColor;
        ctx.lineWidth = this.config.threadLineWidth;
        ctx.globalAlpha = 0.8;

        const ringCount = 8;

        for (let i = 0; i < ringCount; i++) {
            const offset = (i / ringCount - 0.5) * radius * 1.6;

            ctx.beginPath();
            ctx.ellipse(
                0,
                offset * 0.3,
                radius * 0.9,
                radius * 0.4,
                0,
                0,
                Math.PI * 2
            );
            ctx.stroke();
        }

        // 交叉纵向线
        ctx.save();
        ctx.rotate(Math.PI / 2);

        for (let i = 0; i < ringCount; i++) {
            const offset = (i / ringCount - 0.5) * radius * 1.6;

            ctx.beginPath();
            ctx.ellipse(
                0,
                offset * 0.3,
                radius * 0.9,
                radius * 0.4,
                0,
                0,
                Math.PI * 2
            );
            ctx.stroke();
        }

        ctx.restore();
        ctx.globalAlpha = 1;
    }

    /* ================== 高光 ================== */

    renderHighlight(ctx, radius) {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.ellipse(
            -radius * 0.3,
            -radius * 0.3,
            radius * 0.4,
            radius * 0.25,
            Math.PI / 4,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    /* ================== 更新拖尾 ================== */

    updateTrail(position) {
        this.trail.unshift({ x: position.x, y: position.y });

        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }
    }

    /* ================== 绘制拖尾 ================== */

    renderTrail(ctx) {
        if (this.trail.length < 2) return;

        ctx.save();
        ctx.strokeStyle = this.config.threadColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < this.trail.length - 1; i++) {
            const p1 = this.trail[i];
            const p2 = this.trail[i + 1];

            const t = i / this.trail.length;

            // 尾巴逐渐变细
            ctx.lineWidth = 3 * (1 - t);

            ctx.globalAlpha = 1 - t * 0.8;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);

            // 平滑中点
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;

            ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
            ctx.stroke();
        }

        ctx.restore();
    }
}