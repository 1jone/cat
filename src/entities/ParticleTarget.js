import { ImageTarget } from './ImageTarget';

/**
 * ParticleTarget - 粒子发光目标
 * 用于光点(sparkle)和激光点(laser)等需要特殊渲染的目标
 * 继承 ImageTarget 以复用运动逻辑，重写渲染方法实现粒子效果
 */
export class ParticleTarget extends ImageTarget {
    constructor(position, config) {
        super(position, config);

        // 粒子效果配置
        this.particleConfig = {
            // 核心配置
            coreRadius: config.radius * 0.4,      // 核心半径
            coreColor: config.id === 'laser' ? '#FF0000' : '#FFD700',  // 核心颜色

            // 光晕配置
            glowRadius: config.radius * 1.5,      // 光晕半径
            glowColor: config.id === 'laser' ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 215, 0, 0.3)',

            // 环绕粒子配置
            particleCount: config.id === 'laser' ? 4 : 6,  // 粒子数量
            particleRadius: config.radius * 0.15,  // 粒子半径
            orbitRadius: config.radius * 0.8,      // 轨道半径
            orbitSpeed: config.id === 'laser' ? 4 : 2,  // 轨道速度

            // 脉冲配置
            pulseSpeed: config.id === 'laser' ? 6 : 3,  // 脉冲速度
            pulseAmplitude: 0.3,                   // 脉冲幅度

            // 闪烁配置
            twinkleSpeed: config.id === 'laser' ? 10 : 5,  // 闪烁速度
            twinkleMin: 0.6,                       // 最小亮度
            twinkleMax: 1.0,                       // 最大亮度
        };

        // 粒子状态
        this.particles = [];
        this.initParticles();

        // 额外的时间变量用于粒子动画
        this.particleTime = Math.random() * Math.PI * 2;
    }

    /**
     * 初始化环绕粒子
     */
    initParticles() {
        const { particleCount, orbitRadius } = this.particleConfig;

        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            this.particles.push({
                angle: angle,
                phase: Math.random() * Math.PI * 2,  // 随机相位
                radiusOffset: Math.random() * 0.3 - 0.15,  // 轨道半径偏移
                size: 0.8 + Math.random() * 0.4,  // 大小变化
            });
        }
    }

    /**
     * 更新方法 - 调用父类更新并更新粒子动画
     */
    update(dt, canvasWidth, canvasHeight) {
        super.update(dt, canvasWidth, canvasHeight);

        // 更新粒子动画时间
        this.particleTime += dt;
    }

    /**
     * 重写渲染方法 - 实现粒子发光效果
     */
    render(ctx) {
        const {
            coreRadius, coreColor,
            glowRadius, glowColor,
            particleRadius, orbitRadius, orbitSpeed,
            pulseSpeed, pulseAmplitude,
            twinkleSpeed, twinkleMin, twinkleMax
        } = this.particleConfig;

        ctx.save();

        // 计算脉冲缩放
        const pulse = 1 + Math.sin(this.particleTime * pulseSpeed) * pulseAmplitude;

        // 计算闪烁亮度
        const twinkle = twinkleMin + (twinkleMax - twinkleMin) *
            (0.5 + 0.5 * Math.sin(this.particleTime * twinkleSpeed));

        // 受惊时的抖动
        let shakeX = 0, shakeY = 0;
        if (this.isStartled) {
            const shakeProgress = this.startleTimer / 0.8;  // STARTLE_CONFIG.DURATION
            const currentShakeIntensity = 6 * shakeProgress;
            const shakePhase = this.time * 25 * Math.PI * 2;
            shakeX = Math.sin(shakePhase) * currentShakeIntensity;
            shakeY = Math.cos(shakePhase * 1.3) * currentShakeIntensity * 0.7;
        }

        const x = this.position.x + shakeX;
        const y = this.position.y + shakeY;

        // 1. 绘制外层光晕
        this.drawGlow(ctx, x, y, glowRadius * pulse, glowColor, twinkle);

        // 2. 绘制中层光晕
        this.drawGlow(ctx, x, y, glowRadius * 0.6 * pulse, glowColor, twinkle * 0.8);

        // 3. 绘制环绕粒子
        this.drawParticles(ctx, x, y, orbitRadius * pulse, orbitSpeed, particleRadius);

        // 4. 绘制核心光点
        this.drawCore(ctx, x, y, coreRadius * pulse * this.startleScale, coreColor, twinkle);

        // 5. 绘制核心高光
        this.drawHighlight(ctx, x, y, coreRadius * pulse * 0.5, twinkle);

        ctx.restore();

        // 绘制惊叹号（受惊时）
        if (this.exclamationTimer > 0) {
            this.renderExclamation(ctx);
        }
    }

    /**
     * 绘制光晕
     */
    drawGlow(ctx, x, y, radius, color, alpha) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

        // 根据颜色创建渐变
        const baseColor = color.replace(/[\d.]+\)$/, '');
        gradient.addColorStop(0, baseColor + (0.6 * alpha) + ')');
        gradient.addColorStop(0.5, baseColor + (0.3 * alpha) + ')');
        gradient.addColorStop(1, baseColor + '0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 绘制核心光点
     */
    drawCore(ctx, x, y, radius, color, alpha) {
        ctx.globalAlpha = alpha;

        // 核心实心圆
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.3, color);
        gradient.addColorStop(1, this.darkenColor(color, 0.3));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 外发光边缘
        ctx.shadowColor = color;
        ctx.shadowBlur = radius * 2;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.globalAlpha = 1;
    }

    /**
     * 绘制高光
     */
    drawHighlight(ctx, x, y, radius, alpha) {
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    /**
     * 绘制环绕粒子
     */
    drawParticles(ctx, centerX, centerY, orbitRadius, orbitSpeed, particleRadius) {
        const { particleCount } = this.particleConfig;

        this.particles.forEach((particle, index) => {
            // 计算当前角度（考虑轨道速度和相位）
            const currentAngle = particle.angle + this.particleTime * orbitSpeed + particle.phase;

            // 计算轨道半径（带偏移）
            const radius = orbitRadius * (1 + particle.radiusOffset);

            // 计算位置
            const px = centerX + Math.cos(currentAngle) * radius;
            const py = centerY + Math.sin(currentAngle) * radius;

            // 计算粒子大小（带脉动）
            const sizePulse = 0.8 + 0.4 * Math.sin(this.particleTime * 4 + particle.phase);
            const size = particleRadius * particle.size * sizePulse;

            // 计算粒子透明度（距离核心越远越暗）
            const distanceAlpha = 0.5 + 0.5 * Math.cos(currentAngle - this.particleTime * orbitSpeed);

            // 绘制粒子
            ctx.globalAlpha = distanceAlpha * 0.8;

            const gradient = ctx.createRadialGradient(px, py, 0, px, py, size);
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.5, this.particleConfig.coreColor);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;
    }

    /**
     * 辅助方法：加深颜色
     */
    darkenColor(color, factor) {
        // 简单的颜色加深实现
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);

            const dr = Math.floor(r * (1 - factor));
            const dg = Math.floor(g * (1 - factor));
            const db = Math.floor(b * (1 - factor));

            return `rgb(${dr}, ${dg}, ${db})`;
        }
        return color;
    }

    /**
     * 检查点击命中（扩大检测范围以匹配视觉效果）
     */
    containsPoint(point) {
        const distance = this.position.distanceTo(point);
        // 使用核心半径作为命中判定，而不是光晕半径
        return distance <= this.radius;
    }
}
