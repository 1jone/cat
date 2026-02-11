/**
 * GrassBlade - 单个草叶类
 * 支持风吹摆动动画和触摸交互
 */

export class GrassBlade {
    /**
     * @param {Object} config - 草叶配置
     * @param {number} config.x - 草叶底部 X 坐标
     * @param {number} config.baseY - 草叶底部 Y 坐标
     * @param {number} config.height - 草叶高度
     * @param {number} config.width - 草叶宽度
     * @param {string} config.color - 草叶颜色
     * @param {number} config.opacity - 透明度
     * @param {number} config.layerFactor - 层级因子（影响摆动幅度）
     */
    constructor(config) {
        this.x = config.x;
        this.baseY = config.baseY;
        this.height = config.height;
        this.width = config.width;
        this.color = config.color;
        this.opacity = config.opacity;
        this.layerFactor = config.layerFactor || 1.0;

        // 动画状态
        this.phase = Math.random() * Math.PI * 2; // 随机相位
        this.windFactor = Math.random() * 0.5 - 0.25; // 风响应因子

        // 当前尖端位置
        this.tipX = 0;
        this.controlX = 0;
        this.controlY = 0;
        this.tipY = 0;

        // 初始化静态位置
        this.tipY = -this.height;
        this.controlY = -this.height * 0.6;
    }

    /**
     * 更新风吹动画
     * @param {number} time - 当前时间（毫秒）
     * @param {Vector2} windVector - 风向向量
     * @param {number} layerFactor - 层级摆动因子
     */
    updateWind(time, windVector, layerFactor) {
        const windIntensity = windVector.magnitude();
        const windAngle = Math.atan2(windVector.y, windVector.x);

        // 将 Three.js GLSL 风效逻辑转换为 Canvas 2D
        // 原始 GLSL: float swayAmplitude = sin(uTime / 500.0 + factor);
        const frequency = 0.002;
        const sway = Math.sin(time * frequency + this.phase + this.windFactor);

        // 高度因子 - 较高的草摆动更多
        const heightFactor = Math.pow(this.height / 20, 2) * 0.15;

        // 计算摆动幅度
        const swayAmplitude = sway * heightFactor * layerFactor * 15;

        // 应用风向和强度
        this.tipX = Math.cos(windAngle) * swayAmplitude * windIntensity;
        this.controlX = this.tipX * 0.5; // 控制点偏移是尖端的一半

        // 添加一些垂直摆动
        this.tipY = -this.height + Math.abs(sway) * 2;
        this.controlY = -this.height * 0.6 + Math.abs(sway);
    }

    /**
     * 应用触摸影响
     * @param {Vector2} influence - 触摸影响向量
     */
    applyTouchInfluence(influence) {
        this.tipX += influence.x;
        this.controlX += influence.x * 0.5;
        this.tipY += influence.y;
        this.controlY += influence.y * 0.5;
    }

    /**
     * 绘制草叶（使用三次贝塞尔曲线）
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     */
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;

        // 绘制草叶主体（三次贝塞尔曲线）
        ctx.beginPath();
        ctx.moveTo(this.x, this.baseY);

        // 三次贝塞尔曲线创建自然的草叶形状
        ctx.bezierCurveTo(
            this.x + this.controlX - this.width * 0.5,
            this.baseY + this.controlY,
            this.x + this.controlX + this.width * 0.5,
            this.baseY + this.controlY,
            this.x + this.tipX,
            this.baseY + this.tipY
        );

        // 返回到底部
        ctx.bezierCurveTo(
            this.x + this.controlX + this.width * 0.3,
            this.baseY + this.controlY,
            this.x + this.width,
            this.baseY - this.height * 0.3,
            this.x + this.width,
            this.baseY
        );

        ctx.closePath();

        // 填充渐变色（增加深度感）
        const gradient = ctx.createLinearGradient(
            this.x - this.width, this.baseY,
            this.x + this.width, this.baseY + this.tipY
        );
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.6, this._lightenColor(this.color, 20));
        gradient.addColorStop(1, this._lightenColor(this.color, 10));

        ctx.fillStyle = gradient;
        ctx.fill();

        // 添加高光
        if (this.layerFactor > 0.8) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x + this.width * 0.3, this.baseY);
            ctx.quadraticCurveTo(
                this.x + this.controlX,
                this.baseY + this.controlY * 0.7,
                this.x + this.tipX * 0.8,
                this.baseY + this.tipY * 0.7
            );
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * 辅助方法：调亮颜色
     * @param {string} color - 十六进制颜色
     * @param {number} percent - 调亮百分比
     * @returns {string} 调亮后的颜色
     */
    _lightenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return `rgb(${R}, ${G}, ${B})`;
    }

    /**
     * 获取草叶尖端的世界坐标
     * @returns {{x: number, y: number}}
     */
    getTipPosition() {
        return {
            x: this.x + this.tipX,
            y: this.baseY + this.tipY
        };
    }

    /**
     * 获取草叶根部世界坐标
     * @returns {{x: number, y: number}}
     */
    getBasePosition() {
        return {
            x: this.x,
            y: this.baseY
        };
    }
}
