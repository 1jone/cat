/**
 * LadybugRenderer - 萤火虫Canvas渲染器
 *
 * 特点：
 * - 黄绿色光晕发光效果（#B6FF00）
 * - 淡黄色发光核心（#FFFF66）
 * - 深色椭圆身体（#222222）
 * - 不规则闪烁动画（正弦波 + 随机扰动）
 * - 受惊时加速闪烁（代替开翅）
 */
export class LadybugRenderer {
    constructor(config = {}) {
        this.config = {
            // 颜色配置
            glowColor: '#B6FF00',      // 黄绿色光晕
            coreColor: '#FFFF66',      // 淡黄色核心
            bodyColor: '#222222',      // 深色身体

            // 闪烁参数
            flicker: {
                baseIntensity: 0.6,    // 基础亮度
                sineAmplitude: 0.3,    // 正弦波幅度
                sineFrequency: 6,      // 正弦波频率
                randomAmount: 0.2,     // 随机扰动
                startleMultiplier: 2.5 // 受惊倍率
            },

            // 发光范围
            glow: {
                innerRadius: 1.2,      // 内发光半径（相对于radius）
                outerRadius: 2.0,      // 外发光半径（相对于radius）
                opacity: 0.8           // 发光透明度
            },

            // 身体尺寸
            bodyWidth: 0.3,            // 身体宽度（相对于radius）
            bodyLength: 0.5,           // 身体长度（相对于radius）
            headRadius: 0.15           // 头部半径（相对于radius）
        };

        // 合并外部配置
        Object.assign(this.config, config.renderConfig || {});
    }

    /**
     * 主渲染方法
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {Object} position - 位置 {x, y}
     * @param {number} radius - 半径
     * @param {number} rotation - 旋转角度（弧度）
     * @param {number} time - 当前时间（秒）
     * @param {number} scale - 缩放
     * @param {boolean} isMoving - 是否在移动（萤火虫不受影响）
     * @param {number} speed - 移动速度（萤火虫不受影响）
     * @param {boolean} isStartled - 是否受惊（关键参数：加速闪烁）
     */
    render(ctx, position, radius, rotation, time, scale = 1, isMoving = true, speed = 60, isStartled = false) {
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.scale(scale, scale);
        ctx.rotate(rotation);

        // 1. 计算闪烁强度
        const intensity = this.calculateGlowIntensity(time, isStartled);

        // 2. 渲染发光光晕（多层径向渐变）
        this.renderGlow(ctx, radius, intensity);

        // 3. 渲染身体（深色椭圆）
        this.renderBody(ctx, radius);

        // 4. 渲染发光核心（淡黄色）
        this.renderCore(ctx, radius, intensity);

        // 5. 渲染头部和眼睛（简化）
        this.renderHead(ctx, radius);

        ctx.restore();
    }

    /**
     * 计算闪烁强度
     * @param {number} time - 当前时间（秒）
     * @param {boolean} isStartled - 是否受惊
     * @returns {number} 闪烁强度 [0, 1]
     */
    calculateGlowIntensity(time, isStartled) {
        const { flicker } = this.config;

        // 基础闪烁：正弦波 + 随机扰动
        let intensity = flicker.baseIntensity
                      + Math.sin(time * flicker.sineFrequency) * flicker.sineAmplitude
                      + (Math.random() - 0.5) * flicker.randomAmount;

        // 受惊时：倍率增强 + 快速抖动
        if (isStartled) {
            intensity *= flicker.startleMultiplier;
            intensity += Math.sin(time * 15) * 0.2; // 快速抖动
        }

        // 限制范围 [0, 1]
        return Math.max(0, Math.min(1, intensity));
    }

    /**
     * 渲染发光光晕（多层径向渐变）
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {number} radius - 萤火虫半径
     * @param {number} intensity - 当前闪烁强度
     */
    renderGlow(ctx, radius, intensity) {
        const { glow, glowColor } = this.config;

        // === 外发光（大范围扩散）===
        const outerGlow = ctx.createRadialGradient(
            0, 0, 0,
            0, 0, radius * glow.outerRadius
        );
        outerGlow.addColorStop(0, `rgba(182, 255, 0, ${intensity * glow.opacity * 0.5})`);
        outerGlow.addColorStop(0.5, `rgba(182, 255, 0, ${intensity * glow.opacity * 0.2})`);
        outerGlow.addColorStop(1, 'rgba(182, 255, 0, 0)');

        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(0, 0, radius * glow.outerRadius, 0, Math.PI * 2);
        ctx.fill();

        // === 内发光（核心高亮）===
        const innerGlow = ctx.createRadialGradient(
            0, 0, 0,
            0, 0, radius * glow.innerRadius
        );
        innerGlow.addColorStop(0, `rgba(182, 255, 0, ${intensity * glow.opacity})`);
        innerGlow.addColorStop(0.7, `rgba(182, 255, 0, ${intensity * glow.opacity * 0.5})`);
        innerGlow.addColorStop(1, 'rgba(182, 255, 0, 0)');

        ctx.fillStyle = innerGlow;
        ctx.beginPath();
        ctx.arc(0, 0, radius * glow.innerRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 渲染身体（深色小椭圆）
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {number} radius - 萤火虫半径
     */
    renderBody(ctx, radius) {
        const { bodyColor, bodyWidth, bodyLength } = this.config;

        const width = radius * bodyWidth;
        const length = radius * bodyLength;

        // 身体阴影（营造立体感）
        const shadowGradient = ctx.createRadialGradient(
            0, 0, 0,
            0, 0, length * 0.5
        );
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.5)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.ellipse(2, 2, width / 2, length / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 身体主体（深色椭圆）
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, 0, width / 2, length / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // 身体高光（轻微）
        const highlightGradient = ctx.createRadialGradient(
            -width * 0.2, -length * 0.2, 0,
            -width * 0.2, -length * 0.2, width * 0.3
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.ellipse(-width * 0.1, -length * 0.15, width * 0.25, length * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 渲染发光核心（淡黄色，模拟萤火虫发光器）
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {number} radius - 萤火虫半径
     * @param {number} intensity - 当前闪烁强度
     */
    renderCore(ctx, radius, intensity) {
        const { coreColor, bodyWidth, bodyLength } = this.config;

        // 发光核心（淡黄色径向渐变）
        const coreGradient = ctx.createRadialGradient(
            0, 0, 0,
            0, 0, radius * 0.3
        );
        coreGradient.addColorStop(0, `rgba(255, 255, 102, ${intensity})`);
        coreGradient.addColorStop(0.5, `rgba(255, 255, 102, ${intensity * 0.6})`);
        coreGradient.addColorStop(1, 'rgba(255, 255, 102, 0)');

        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 0.15, radius * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // 核心高光点（最亮部分）
        const highlightGradient = ctx.createRadialGradient(
            0, -radius * 0.05, 0,
            0, -radius * 0.05, radius * 0.12
        );
        highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${intensity * 0.8})`);
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.arc(0, -radius * 0.05, radius * 0.08, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 渲染头部和眼睛（简化）
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {number} radius - 萤火虫半径
     */
    renderHead(ctx, radius) {
        const { bodyColor, headRadius, bodyLength } = this.config;

        // 头部位置
        const headY = -radius * bodyLength * 0.35;
        const headR = radius * headRadius;

        // 半圆头部
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(0, headY, headR, Math.PI, 0);
        ctx.fill();

        // 眼睛（小亮点，萤火虫眼睛较小）
        const eyeSize = headR * 0.35;
        const eyeX = headR * 0.5;
        const eyeY = headY - headR * 0.1;

        // 右眼
        const eyeGradient = ctx.createRadialGradient(
            eyeX, eyeY, 0,
            eyeX, eyeY, eyeSize
        );
        eyeGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        eyeGradient.addColorStop(0.3, 'rgba(200, 200, 200, 0.7)');
        eyeGradient.addColorStop(1, 'rgba(100, 100, 100, 0)');

        ctx.fillStyle = eyeGradient;
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // 左眼（镜像）
        ctx.save();
        ctx.scale(-1, 1);
        ctx.fillStyle = eyeGradient;
        ctx.beginPath();
        ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 细线触角（简化）
        ctx.strokeStyle = bodyColor;
        ctx.lineWidth = radius * 0.025;
        ctx.lineCap = 'round';

        // 右触角（简单曲线）
        ctx.beginPath();
        ctx.moveTo(radius * 0.15, headY - headR * 0.5);
        ctx.quadraticCurveTo(
            radius * 0.25, headY - headR * 1.5,
            radius * 0.35, headY - headR * 1.8
        );
        ctx.stroke();

        // 左触角（镜像）
        ctx.save();
        ctx.scale(-1, 1);
        ctx.beginPath();
        ctx.moveTo(radius * 0.15, headY - headR * 0.5);
        ctx.quadraticCurveTo(
            radius * 0.25, headY - headR * 1.5,
            radius * 0.35, headY - headR * 1.8
        );
        ctx.stroke();
        ctx.restore();
    }
}
