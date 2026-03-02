/**
 * ButterflyRenderer - 亮黄色蝴蝶渲染器
 * Canvas 绘制实现，包含翅膀扇动动画和翅脉细节
 */

export class ButterflyRenderer {
    constructor(config = {}) {
        this.config = {
            // 颜色方案 - 亮黄色蝴蝶
            primaryWingColor: '#FFD700',      // 金色
            secondaryWingColor: '#FFC125',    // 金菊色
            wingVeinColor: '#DAA520',         // 金菊色翅脉
            bodyColor: '#8B4513',             // 马鞍棕色身体

            // 翅膀动画
            wingFlapSpeed: 15,                // 扇动频率
            wingFlapAmplitude: 0.4,           // 闭合程度

            // 比例（相对于 radius）
            wingSpan: 1.6,                    // 总翼展宽度
            wingLength: 1.2,                  // 翅膀长度（前后）
            bodyWidth: 0.15,                  // 身体厚度
            bodyLength: 0.8,                  // 身体长度

            // 发光效果
            glow: {
                enabled: true,
                color: 'rgba(255, 215, 0, 0.3)',
                blur: 15
            }
        };

        Object.assign(this.config, config.renderConfig || {});
    }

    /**
     * 主渲染方法
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {Vector2} position - 位置
     * @param {number} radius - 半径
     * @param {number} rotation - 旋转角度（弧度）
     * @param {number} time - 当前时间
     * @param {number} scale - 缩放
     * @param {boolean} isMoving - 是否在移动
     * @param {number} speed - 移动速度
     */
    render(ctx, position, radius, rotation, time, scale = 1, isMoving = true, speed = 90) {
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.scale(scale, scale);
        ctx.rotate(rotation);

        // 发光效果
        if (this.config.glow.enabled) {
            ctx.shadowColor = this.config.glow.color;
            ctx.shadowBlur = this.config.glow.blur;
        }

        // 计算翅膀扇动
        const flapFactor = this.calculateWingFlap(time, isMoving, speed);

        // 渲染翅膀
        this.renderWings(ctx, radius, flapFactor);

        // 渲染身体
        this.renderBody(ctx, radius);

        // 渲染触角
        this.renderAntennae(ctx, radius);

        ctx.restore();
    }

    /**
     * 计算翅膀扇动因子（0-1）
     * @param {number} time - 当前时间
     * @param {boolean} isMoving - 是否在移动
     * @param {number} speed - 移动速度
     * @returns {number} 扇动因子（0=完全闭合，1=完全展开）
     */
    calculateWingFlap(time, isMoving, speed) {
        const flapSpeed = this.config.wingFlapSpeed;
        const flapAmplitude = this.config.wingFlapAmplitude;

        // 基础扇动动画
        const baseFlap = Math.sin(time * flapSpeed) * 0.5 + 0.5;

        // 速度影响扇动速度
        const speedFactor = isMoving ? Math.min(speed / 100, 1.5) : 0.5;

        return Math.max(0, 1 - baseFlap * flapAmplitude * speedFactor);
    }

    /**
     * 渲染所有翅膀
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {number} radius - 半径
     * @param {number} flapFactor - 扇动因子（0-1）
     */
    renderWings(ctx, radius, flapFactor) {
        const wingSpan = radius * this.config.wingSpan;
        const wingLength = radius * this.config.wingLength;

        ctx.save();

        // 翅膀扇动变换（Y轴缩放）
        ctx.scale(1, flapFactor);

        // 右翅膀
        this.renderForewing(ctx, wingLength, wingSpan * 0.6, 1);
        this.renderHindwing(ctx, wingLength * 0.7, wingSpan * 0.4, 1);

        // 左翅膀（镜像）
        ctx.scale(-1, 1);
        this.renderForewing(ctx, wingLength, wingSpan * 0.6, 1);
        this.renderHindwing(ctx, wingLength * 0.7, wingSpan * 0.4, 1);

        ctx.restore();
    }

    /**
     * 渲染前翅
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {number} length - 翅膀长度
     * @param {number} width - 翅膀宽度
     * @param {number} side - 侧边（1=右，-1=左）
     */
    renderForewing(ctx, length, width, side) {
        ctx.save();

        // 前翅形状（三角形，贝塞尔曲线）
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(width * 0.5, -length * 0.3, width, -length * 0.8);
        ctx.quadraticCurveTo(width * 0.8, -length * 0.5, width * 0.6, 0);
        ctx.closePath();

        // 翅膀渐变
        const gradient = ctx.createRadialGradient(
            width * 0.3, -length * 0.4, 0,
            width * 0.5, -length * 0.4, length
        );
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
        gradient.addColorStop(0.5, this.config.primaryWingColor);
        gradient.addColorStop(1, this.config.secondaryWingColor);

        ctx.fillStyle = gradient;
        ctx.fill();

        // 翅脉纹理
        this.renderWingVeins(ctx, length, width, 0);

        ctx.restore();
    }

    /**
     * 渲染后翅
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {number} length - 翅膀长度
     * @param {number} width - 翅膀宽度
     * @param {number} side - 侧边（1=右，-1=左）
     */
    renderHindwing(ctx, length, width, side) {
        ctx.save();

        // 后翅形状（圆形，贝塞尔曲线）
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(width * 0.3, length * 0.5, width * 0.1, length * 0.8);
        ctx.quadraticCurveTo(-width * 0.2, length * 0.6, -width * 0.1, 0);
        ctx.closePath();

        // 翅膀渐变
        const gradient = ctx.createRadialGradient(
            width * 0.2, length * 0.4, 0,
            width * 0.2, length * 0.4, length * 0.8
        );
        gradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
        gradient.addColorStop(0.5, this.config.primaryWingColor);
        gradient.addColorStop(1, this.config.secondaryWingColor);

        ctx.fillStyle = gradient;
        ctx.fill();

        // 翅脉纹理
        this.renderWingVeins(ctx, length, width, 1);

        ctx.restore();
    }

    /**
     * 渲染翅脉
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {number} length - 翅膀长度
     * @param {number} width - 翅膀宽度
     * @param {number} type - 翅膀类型（0=前翅，1=后翅）
     */
    renderWingVeins(ctx, length, width, type) {
        ctx.strokeStyle = this.config.wingVeinColor;
        ctx.lineWidth = 0.5;

        const veinCount = type === 0 ? 5 : 3;

        for (let i = 0; i < veinCount; i++) {
            const t = (i + 1) / (veinCount + 1);

            if (type === 0) {
                // 前翅翅脉（辐射状）
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(
                    width * t * 0.8,
                    -length * t * 0.6,
                    width * t,
                    -length * t * 0.9
                );
                ctx.stroke();
            } else {
                // 后翅翅脉（弧形）
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(
                    width * t * 0.3,
                    length * t * 0.7,
                    width * t * 0.2,
                    length * t * 0.9
                );
                ctx.stroke();
            }
        }
    }

    /**
     * 渲染身体
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {number} radius - 半径
     */
    renderBody(ctx, radius) {
        const bodyLength = radius * this.config.bodyLength;
        const bodyWidth = radius * this.config.bodyWidth;

        ctx.save();

        // 身体（椭圆）
        ctx.beginPath();
        ctx.ellipse(0, 0, bodyWidth / 2, bodyLength / 2, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.config.bodyColor;
        ctx.fill();

        // 身体高光
        const gradient = ctx.createRadialGradient(
            -bodyWidth * 0.2, -bodyLength * 0.2, 0,
            0, 0, bodyWidth
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.restore();
    }

    /**
     * 渲染触角
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {number} radius - 半径
     */
    renderAntennae(ctx, radius) {
        const bodyLength = radius * this.config.bodyLength;
        const antennaLength = bodyLength * 0.6;

        ctx.save();
        ctx.strokeStyle = this.config.bodyColor;
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';

        // 左触角
        ctx.beginPath();
        ctx.moveTo(-2, -bodyLength * 0.4);
        ctx.quadraticCurveTo(
            -antennaLength * 0.5,
            -bodyLength * 0.4 - antennaLength * 0.5,
            -antennaLength * 0.3,
            -bodyLength * 0.4 - antennaLength
        );
        ctx.stroke();

        // 左触角端点
        ctx.beginPath();
        ctx.arc(-antennaLength * 0.3, -bodyLength * 0.4 - antennaLength, 2, 0, Math.PI * 2);
        ctx.fillStyle = this.config.bodyColor;
        ctx.fill();

        // 右触角
        ctx.beginPath();
        ctx.moveTo(2, -bodyLength * 0.4);
        ctx.quadraticCurveTo(
            antennaLength * 0.5,
            -bodyLength * 0.4 - antennaLength * 0.5,
            antennaLength * 0.3,
            -bodyLength * 0.4 - antennaLength
        );
        ctx.stroke();

        // 右触角端点
        ctx.beginPath();
        ctx.arc(antennaLength * 0.3, -bodyLength * 0.4 - antennaLength, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
