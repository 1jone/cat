/**
 * FishRenderer - 小鱼渲染器
 * 银白小鱼 + 高光闪烁 + 鳞片反光 + 尾巴抖动
 */

export class FishRenderer {
    constructor(config) {
        this.config = {
            // 颜色配置
            bodyColor: '#E8E8E8',      // 银白
            highlightColor: '#FFFFFF',  // 高光
            scaleColor: '#C0C0C0',      // 鳞片颜色

            // 尺寸配置
            size: 32,
            bodyLength: 1.8,
            bodyWidth: 0.6,
            headSize: 0.25,

            // 尾巴配置
            tailLength: 0.8,
            tailWidth: 0.5,
            tailFlutterSpeed: 12,  // 尾巴抖动速度

            // 鳞片配置
            scaleCount: 15,        // 鳞片数量
            scaleSize: 3,          // 鳞片大小
        };

        if (config) Object.assign(this.config, config);
    }

    render(ctx, x, y, scale, time, state = {}) {
        const { size } = this.config;
        const isStartled = state.isStartled || false;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // 1. 高光闪烁 (呼吸效果)
        const shimmer = 0.3 + Math.sin(time * 3) * 0.15;
        ctx.shadowColor = `rgba(255, 255, 255, ${shimmer})`;
        ctx.shadowBlur = 15;

        // 2. 尾巴（抖动）
        this.renderTail(ctx, time, isStartled);

        // 3. 身体
        this.renderBody(ctx, time);

        // 4. 鳞片（反光）
        this.renderScales(ctx, time);

        // 5. 眼睛
        this.renderEye(ctx);

        ctx.restore();
    }

    renderTail(ctx, time, isStartled) {
        const { tailLength, tailWidth, tailFlutterSpeed, size } = this.config;

        // 尾巴抖动（受惊时更快）
        const flutterSpeed = isStartled ? tailFlutterSpeed * 2 : tailFlutterSpeed;
        const tailAngle = Math.sin(time * flutterSpeed) * 0.3;

        ctx.save();
        ctx.translate(-size * 0.8, 0);
        ctx.rotate(tailAngle);

        // 绘制尾巴（三角形）
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-size * tailLength, -size * tailWidth / 2);
        ctx.lineTo(-size * tailLength, size * tailWidth / 2);
        ctx.closePath();

        ctx.fillStyle = this.config.bodyColor;
        ctx.fill();

        ctx.restore();
    }

    renderBody(ctx, time) {
        const { bodyLength, bodyWidth, size } = this.config;

        // 椭圆身体
        ctx.beginPath();
        ctx.ellipse(0, 0, size * bodyLength / 2, size * bodyWidth / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.config.bodyColor;
        ctx.fill();
    }

    renderScales(ctx, time) {
        const { scaleCount, scaleSize, bodyLength, bodyWidth, size } = this.config;
        const scaleColor = this.config.scaleColor;

        // 在身体上绘制鳞片（小菱形）
        for (let i = 0; i < scaleCount; i++) {
            const t = i / scaleCount;
            const x = (t - 0.5) * size * bodyLength * 0.7;
            const y = Math.sin(t * Math.PI * 4 + time * 2) * size * bodyWidth * 0.2;

            // 鳞片反光闪烁（每个鳞片有相位偏移）
            const shimmer = 0.2 + Math.sin(time * 2 + i * 0.5) * 0.2;

            ctx.save();
            ctx.translate(x, y);

            // 绘制菱形鳞片
            ctx.beginPath();
            ctx.moveTo(0, -scaleSize);
            ctx.lineTo(scaleSize, 0);
            ctx.lineTo(0, scaleSize);
            ctx.lineTo(-scaleSize, 0);
            ctx.closePath();

            ctx.fillStyle = `rgba(192, 192, 192, ${shimmer})`;
            ctx.fill();

            ctx.restore();
        }
    }

    renderEye(ctx) {
        const { headSize, size } = this.config;
        const eyeX = size * 0.5;
        const eyeY = -size * 0.05;
        const eyeSize = size * 0.08;

        // 眼白
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // 瞳孔
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeSize * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
    }
}
