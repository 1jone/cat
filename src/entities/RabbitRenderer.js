/**
 * RabbitRenderer - Canvas绘制的趴着兔子渲染器
 *
 * 特性：
 * - 趴在地上的小兔子造型
 * - 弹跳动画（移动时上下起伏）
 * - 金色光晕脉冲效果
 * - 纯白色+粉色细节配色
 */

export class RabbitRenderer {
    constructor(config) {
        // 默认配置
        this.config = {
            // 颜色配置 - 纯白色+粉色细节
            bodyColor: '#FFFFFF',      // 白色身体
            earInnerColor: '#FFB6C1',  // 粉色内耳
            noseColor: '#FFB6C1',      // 粉色鼻子
            eyeColor: '#333333',       // 深色眼睛
            eyeHighlight: '#FFFFFF',   // 眼睛高光

            // 发光配置 - 金色光晕
            glow: {
                enabled: true,
                color: '#FFD700',      // 金色光晕
                blur: 20,
                pulseSpeed: 2,
                minIntensity: 0.5,
                maxIntensity: 1.0
            },

            // 弹跳配置
            bounce: {
                amplitude: 8,          // 弹跳高度（像素）
                frequency: 8,          // 弹跳频率
                squashAmount: 0.15     // 落地时挤压程度
            },

            // 比例配置
            proportions: {
                headSize: 0.45,        // 头部大小相对于radius
                earLength: 0.7,        // 耳朵长度相对于radius
                earWidth: 0.2,         // 耳朵宽度相对于radius
                bodyWidth: 0.9,        // 身体宽度相对于radius（横向）
                bodyHeight: 0.5,       // 身体高度相对于radius（趴着）
                legLength: 0.25,       // 腿长度
                tailSize: 0.15         // 尾巴大小
            }
        };

        // 合并用户配置
        if (config.renderConfig) {
            Object.assign(this.config.glow, config.renderConfig.glow || {});
            Object.assign(this.config.bounce, config.renderConfig.bounce || {});
            Object.assign(this.config.proportions, config.renderConfig.proportions || {});
            if (config.renderConfig.bodyColor) this.config.bodyColor = config.renderConfig.bodyColor;
            if (config.renderConfig.earInnerColor) this.config.earInnerColor = config.renderConfig.earInnerColor;
            if (config.renderConfig.noseColor) this.config.noseColor = config.renderConfig.noseColor;
            if (config.renderConfig.eyeColor) this.config.eyeColor = config.renderConfig.eyeColor;
            if (config.renderConfig.eyeHighlight) this.config.eyeHighlight = config.renderConfig.eyeHighlight;
        }
    }

    /**
     * 主渲染方法
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     * @param {Object} position - 位置 {x, y}
     * @param {number} radius - 半径
     * @param {number} rotation - 旋转角度（弧度）
     * @param {number} time - 时间（秒）
     * @param {number} scale - 额外缩放（受惊等效果）
     * @param {boolean} isMoving - 是否正在移动
     * @param {number} speed - 当前移动速度（用于调整弹跳频率）
     */
    render(ctx, position, radius, rotation, time, scale = 1, isMoving = false, speed = 100) {
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);

        // 计算弹跳偏移和挤压
        const bounceOffset = this.calculateBounce(time, isMoving, speed);
        const squash = this.calculateSquash(time, isMoving, speed);

        // 应用弹跳位移（垂直方向）
        ctx.translate(0, -bounceOffset);

        // 1. 绘制发光层（最底层）
        if (this.config.glow.enabled) {
            this.renderGlow(ctx, radius, time);
        }

        // 2. 绘制尾巴（小绒球）
        this.renderTail(ctx, radius);

        // 3. 绘制后腿（趴着姿态）
        this.renderBackLegs(ctx, radius, time, isMoving);

        // 4. 绘制身体（横向椭圆，趴着姿态，带挤压）
        this.renderBody(ctx, radius, squash);

        // 5. 绘制前腿（趴着姿态）
        this.renderFrontLegs(ctx, radius, time, isMoving);

        // 6. 绘制头部（朝向移动方向）
        this.renderHead(ctx, radius);

        // 7. 绘制耳朵（竖起或微微后倾）
        this.renderEars(ctx, radius, time);

        // 8. 绘制眼睛
        this.renderEyes(ctx, radius);

        // 9. 绘制鼻子
        this.renderNose(ctx, radius);

        ctx.restore();
    }

    /**
     * 计算弹跳偏移
     * @returns {number} 垂直偏移量（向上为负）
     */
    calculateBounce(time, isMoving, speed) {
        if (!isMoving) return 0;

        const { bounce } = this.config;
        // 速度越快，弹跳频率越高
        const frequency = bounce.frequency * (speed / 100);
        // 使用正弦波绝对值模拟弹跳（只在上升和下降阶段）
        const phase = (time * frequency) % (Math.PI * 2);
        // sin²函数给出平滑的弹跳曲线（在底部停留较短，顶部较长）
        return Math.abs(Math.sin(phase)) * bounce.amplitude;
    }

    /**
     * 计算挤压程度
     * @returns {Object} {x: 横向挤压, y: 纵向挤压}
     */
    calculateSquash(time, isMoving, speed) {
        if (!isMoving) return { x: 1, y: 1 };

        const { bounce } = this.config;
        const frequency = bounce.frequency * (speed / 100);
        const phase = (time * frequency) % (Math.PI * 2);

        // 在弹跳底部（sin接近0或PI）时挤压
        const bottomPhase = Math.sin(phase);
        const squashAmount = Math.max(0, 1 - Math.abs(bottomPhase)) * bounce.squashAmount;

        // 落地时：横向变宽，纵向变矮
        return {
            x: 1 + squashAmount,    // 变宽
            y: 1 - squashAmount * 0.5  // 变矮
        };
    }

    /**
     * 绘制发光效果
     */
    renderGlow(ctx, radius, time) {
        const { glow } = this.config;

        // 计算脉冲强度
        const pulse = (Math.sin(time * glow.pulseSpeed) * 0.5 + 0.5);
        const intensity = glow.minIntensity + (glow.maxIntensity - glow.minIntensity) * pulse;

        ctx.save();
        ctx.shadowColor = glow.color;
        ctx.shadowBlur = glow.blur * intensity;
        ctx.fillStyle = glow.color;
        ctx.globalAlpha = 0.2 * intensity;

        // 绘制光晕椭圆（适应趴着的姿态）
        ctx.beginPath();
        ctx.ellipse(0, 0, radius * 1.4, radius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * 绘制尾巴（小绒球）
     */
    renderTail(ctx, radius) {
        const { bodyColor, proportions } = this.config;

        ctx.save();
        ctx.fillStyle = bodyColor;

        // 绘制小圆形尾巴（在身体后方）
        ctx.beginPath();
        ctx.arc(-radius * proportions.bodyWidth, 0, radius * proportions.tailSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * 绘制后腿（趴着姿态）
     */
    renderBackLegs(ctx, radius, time, isMoving) {
        const { bodyColor, proportions } = this.config;
        const legLength = radius * proportions.legLength;

        ctx.save();
        ctx.fillStyle = this.darkenColor(bodyColor, 10);

        // 腿部摆动角度（移动时）
        const legSwing = isMoving ? Math.sin(time * 8) * 0.15 : 0;

        // 左后腿（在身体后方）
        ctx.save();
        ctx.translate(-radius * 0.5, radius * 0.15);
        ctx.rotate(legSwing);
        ctx.beginPath();
        // 腿部（椭圆，趴着姿态）
        ctx.ellipse(0, legLength * 0.5, legLength * 0.3, legLength, 0, 0, Math.PI * 2);
        ctx.fill();
        // 脚掌
        ctx.beginPath();
        ctx.ellipse(0, legLength, legLength * 0.4, legLength * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 右后腿
        ctx.save();
        ctx.translate(-radius * 0.5, -radius * 0.15);
        ctx.rotate(-legSwing * 0.5);
        ctx.beginPath();
        ctx.ellipse(0, legLength * 0.5, legLength * 0.3, legLength, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, legLength, legLength * 0.4, legLength * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }

    /**
     * 绘制身体（横向椭圆，趴着姿态）
     */
    renderBody(ctx, radius, squash) {
        const { bodyColor, proportions } = this.config;

        ctx.save();
        ctx.fillStyle = bodyColor;

        // 应用挤压变形
        ctx.scale(squash.x, squash.y);

        // 绘制身体（横向椭圆，趴着姿态）
        ctx.beginPath();
        ctx.ellipse(-radius * 0.1, 0, radius * proportions.bodyWidth, radius * proportions.bodyHeight, 0, 0, Math.PI * 2);
        ctx.fill();

        // 添加身体阴影效果（底部渐变）
        const gradient = ctx.createRadialGradient(
            -radius * 0.1, radius * 0.2, 0,
            -radius * 0.1, 0, radius * proportions.bodyHeight
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.1)');

        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.restore();
    }

    /**
     * 绘制前腿（趴着姿态）
     */
    renderFrontLegs(ctx, radius, time, isMoving) {
        const { bodyColor, proportions } = this.config;
        const legLength = radius * proportions.legLength;

        ctx.save();
        ctx.fillStyle = bodyColor;

        // 腿部摆动角度（移动时）
        const legSwing = isMoving ? Math.sin(time * 8 + Math.PI) * 0.15 : 0;

        // 左前腿（在身体前方）
        ctx.save();
        ctx.translate(radius * 0.3, radius * 0.15);
        ctx.rotate(legSwing);
        ctx.beginPath();
        ctx.ellipse(0, legLength * 0.5, legLength * 0.3, legLength, 0.1, 0, Math.PI * 2);
        ctx.fill();
        // 脚掌
        ctx.beginPath();
        ctx.ellipse(0, legLength, legLength * 0.4, legLength * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 右前腿
        ctx.save();
        ctx.translate(radius * 0.3, -radius * 0.15);
        ctx.rotate(-legSwing * 0.5);
        ctx.beginPath();
        ctx.ellipse(0, legLength * 0.5, legLength * 0.3, legLength, -0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, legLength, legLength * 0.4, legLength * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }

    /**
     * 绘制头部（朝向移动方向）
     */
    renderHead(ctx, radius) {
        const { bodyColor, proportions } = this.config;
        const headSize = radius * proportions.headSize;

        ctx.save();
        ctx.fillStyle = bodyColor;

        // 绘制头部（圆形，在身体前方）
        ctx.beginPath();
        ctx.arc(radius * 0.6, 0, headSize, 0, Math.PI * 2);
        ctx.fill();

        // 添加头部高光（让头部看起来更圆润）
        const gradient = ctx.createRadialGradient(
            radius * 0.6 - headSize * 0.3, -headSize * 0.3, 0,
            radius * 0.6, 0, headSize
        );
        gradient.addColorStop(0, 'rgba(255,255,255,0.6)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.1)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.05)');

        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.restore();
    }

    /**
     * 绘制耳朵（竖起或微微后倾）
     */
    renderEars(ctx, radius, time) {
        const { bodyColor, earInnerColor, proportions } = this.config;
        const headSize = radius * proportions.headSize;
        const earLength = radius * proportions.earLength;
        const earWidth = radius * proportions.earWidth;

        ctx.save();

        // 耳朵位置（在头顶）
        const earBaseX = radius * 0.6;
        const earBaseY = -headSize * 0.6;

        // 微微的耳朵摆动（呼吸感）
        const earSway = Math.sin(time * 1.5) * 0.05;

        // 左耳
        ctx.save();
        ctx.translate(earBaseX - earWidth * 0.8, earBaseY);
        ctx.rotate(-0.3 + earSway);  // 向左后倾斜

        // 外耳（白色）
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, -earLength * 0.5, earWidth, earLength, 0, 0, Math.PI * 2);
        ctx.fill();

        // 内耳（粉色）
        ctx.fillStyle = earInnerColor;
        ctx.beginPath();
        ctx.ellipse(0, -earLength * 0.5, earWidth * 0.6, earLength * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // 右耳
        ctx.save();
        ctx.translate(earBaseX + earWidth * 0.8, earBaseY);
        ctx.rotate(0.3 - earSway);  // 向右后倾斜

        // 外耳（白色）
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.ellipse(0, -earLength * 0.5, earWidth, earLength, 0, 0, Math.PI * 2);
        ctx.fill();

        // 内耳（粉色）
        ctx.fillStyle = earInnerColor;
        ctx.beginPath();
        ctx.ellipse(0, -earLength * 0.5, earWidth * 0.6, earLength * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        ctx.restore();
    }

    /**
     * 绘制眼睛（带高光）
     */
    renderEyes(ctx, radius) {
        const { eyeColor, eyeHighlight, proportions } = this.config;
        const headSize = radius * proportions.headSize;
        const eyeSize = headSize * 0.2;

        ctx.save();

        // 眼睛位置（在头部前方）
        const eyeX = radius * 0.6 + headSize * 0.4;
        const eyeY = 0;

        // 左眼
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(eyeX - eyeSize * 0.8, eyeY - eyeSize * 0.3, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛高光
        ctx.fillStyle = eyeHighlight;
        ctx.beginPath();
        ctx.arc(eyeX - eyeSize * 0.8 - eyeSize * 0.3, eyeY - eyeSize * 0.3 - eyeSize * 0.3, eyeSize * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // 右眼
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(eyeX - eyeSize * 0.8, eyeY + eyeSize * 0.3, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // 眼睛高光
        ctx.fillStyle = eyeHighlight;
        ctx.beginPath();
        ctx.arc(eyeX - eyeSize * 0.8 - eyeSize * 0.3, eyeY + eyeSize * 0.3 - eyeSize * 0.3, eyeSize * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * 绘制鼻子
     */
    renderNose(ctx, radius) {
        const { noseColor, proportions } = this.config;
        const headSize = radius * proportions.headSize;
        const noseSize = headSize * 0.12;

        ctx.save();
        ctx.fillStyle = noseColor;

        // 鼻子位置（在头部最前方）
        const noseX = radius * 0.6 + headSize * 0.85;
        const noseY = 0;

        // 绘制鼻子（小椭圆）
        ctx.beginPath();
        ctx.ellipse(noseX, noseY, noseSize, noseSize * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // 鼻子高光
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.ellipse(noseX - noseSize * 0.2, noseY - noseSize * 0.2, noseSize * 0.3, noseSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * 辅助方法：加深颜色
     * @param {string} color - 原始颜色（hex）
     * @param {number} percent - 加深百分比
     * @returns {string} - 加深后的颜色（hex）
     */
    darkenColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max((num >> 16) - amt, 0);
        const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
        const B = Math.max((num & 0x0000FF) - amt, 0);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }
}
