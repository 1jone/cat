/**
 * BackgroundRenderer - 背景和草地渲染器
 * 负责绘制游戏背景和草地装饰
 */

import { CONFIG, GRASS_CONFIG, FEATURE_FLAGS } from '../config';
import { OffscreenCanvasCache } from '../utils/CanvasUtils';
import { GrassRenderer } from './grass/GrassRenderer';

export class BackgroundRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.dpr = 1;  // 设备像素比

        // 新的草地渲染器（动画系统）
        this.grassRenderer = new GrassRenderer(canvas, ctx, this.dpr, GRASS_CONFIG);

        // 保留旧的静态草地缓存作为回退
        this.grassCache = new OffscreenCanvasCache({ dpr: this.dpr });
        this.grassElements = null;
    }

    /**
     * 渲染背景
     * @param {HTMLImageElement|null} backgroundImage - 背景图片
     * @param {boolean} showGrass - 是否显示草地
     * @param {string} [targetId=null] - 目标类型ID（用于特殊背景）
     * @param {number} [time=0] - 当前时间（用于动画）
     */
    render(backgroundImage, showGrass = true, targetId = null, time = 0) {
        const dpr = this.dpr;
        const logicalWidth = this.canvas.width / dpr;
        const logicalHeight = this.canvas.height / dpr;

        // 优先级：特殊背景 > 背景图片 > 纯色背景
        if (targetId && this.hasSpecialBackground(targetId)) {
            // 根据目标类型渲染特殊背景
            if (targetId === 'fish') {
                this.renderWaterBackground(logicalWidth, logicalHeight, time);
            } else if (targetId === 'butterfly') {
                this.renderButterflyGrassBackground(logicalWidth, logicalHeight, time);
            } else if (targetId === 'yarn') {
                this.renderDarkGradientBackground(logicalWidth, logicalHeight);
            } else if (targetId === 'ladybug') {
                this.renderFireflyBackground(logicalWidth, logicalHeight, time);
            } else {
                this.renderSparkleBackground(logicalWidth, logicalHeight);
            }
            return;
        }

        if (backgroundImage) {
            this.drawBackgroundWithImage(backgroundImage, showGrass, logicalWidth, logicalHeight);
        } else {
            // 回退到纯色背景
            this.ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
            this.ctx.fillRect(0, 0, logicalWidth, logicalHeight);
                        this.drawGrass(logicalHeight, logicalWidth);
        }
    }

    /**
     * 绘制草地
     * @param {number} logicalHeight - 画布逻辑高度
     * @param {number} logicalWidth - 画布逻辑宽度
     */
    drawGrass(logicalHeight, logicalWidth) {
        const grassLogicalHeight = 80;  // 增加草地高度区域

        // 使用新的动画草地渲染器（如果启用）
        if (FEATURE_FLAGS.animatedGrass && GRASS_CONFIG.enabled) {
            this.grassRenderer.render(
                0,
                logicalHeight - grassLogicalHeight,
                logicalWidth,
                grassLogicalHeight
            );
        } else {
            // 回退到静态草地
            // 如果草地缓存未生成，先生成
            if (!this.grassCache.isValid()) {
                this.generateGrassElements(logicalWidth);
            }

            // 使用 OffscreenCanvasCache 的 draw 方法
            this.grassCache.draw(
                this.ctx,
                0,
                logicalHeight - grassLogicalHeight,
                logicalWidth,
                grassLogicalHeight
            );
        }
    }

    /**
     * 生成草地装饰元素（预渲染到离屏Canvas，支持高 DPI）
     * @param {number} logicalWidth - 逻辑宽度
     */
    generateGrassElements(logicalWidth) {
        const grassHeight = 140;  // 增加草地高度区域

        // 生成草叶数据
        const blades = [];
        const grassBladeCount = Math.floor(logicalWidth / 4); // 更密集的草叶
        for (let i = 0; i < grassBladeCount; i++) {
            blades.push({
                x: (i * 4) + Math.random() * 2,
                height: 15 + Math.random() * 35,  // 增加草叶高度范围
                width: 2 + Math.random() * 3
            });
        }

        // 生成小圆点数据
        const dots = [];
        const dotCount = Math.floor(logicalWidth / 10); // 更多小圆点
        for (let i = 0; i < dotCount; i++) {
            dots.push({
                x: Math.random() * logicalWidth,
                y: Math.random() * (grassHeight * 0.75),
                size: 2 + Math.random() * 6
            });
        }

        this.grassElements = { blades, dots };

        // 使用 OffscreenCanvasCache 生成离屏 Canvas
        this.grassCache.generate(logicalWidth, grassHeight, (ctx, w, h) => {
            // 绘制渐变背景
            const gradient = ctx.createLinearGradient(0, 0, 0, h);
            gradient.addColorStop(0, '#7EC850');   // 顶部较浅的绿色
            gradient.addColorStop(0.3, '#5DA038'); // 中间绿色
            gradient.addColorStop(1, '#3D7A28');   // 底部较深的绿色
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);

            // 绘制草丛
            ctx.fillStyle = 'rgba(100, 160, 50, 0.35)';
            for (const blade of blades) {
                ctx.beginPath();
                ctx.moveTo(blade.x, 0);
                ctx.quadraticCurveTo(
                    blade.x + blade.width / 2,
                    -blade.height,
                    blade.x + blade.width,
                    0
                );
                ctx.fill();
            }

            // 绘制小圆点
            ctx.fillStyle = 'rgba(70, 140, 35, 0.5)';
            for (const dot of dots) {
                ctx.beginPath();
                ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }

    /**
     * 绘制背景图片（居中裁剪适配，类似 CSS object-fit: cover）
     * @param {HTMLImageElement} image - 背景图片
     * @param {boolean} showGrass - 是否显示草地
     * @param {number} logicalWidth - 画布逻辑宽度
     * @param {number} logicalHeight - 画布逻辑高度
     */
    drawBackgroundWithImage(image, showGrass, logicalWidth, logicalHeight) {
        const ctx = this.ctx;

        // 计算居中裁剪参数（使用逻辑尺寸）
        const canvasRatio = logicalWidth / logicalHeight;
        const imageRatio = image.width / image.height;

        let renderWidth, renderHeight, offsetX, offsetY;

        if (imageRatio > canvasRatio) {
            // 图片更宽，以高度为准
            renderHeight = logicalHeight;
            renderWidth = image.width * (logicalHeight / image.height);
            offsetX = (logicalWidth - renderWidth) / 2;
            offsetY = 0;
        } else {
            // 图片更高，以宽度为准
            renderWidth = logicalWidth;
            renderHeight = image.height * (logicalWidth / image.width);
            offsetX = 0;
            offsetY = (logicalHeight - renderHeight) / 2;
        }

        // 绘制背景图片（使用逻辑坐标）
        ctx.drawImage(image, offsetX, offsetY, renderWidth, renderHeight);

        // 根据配置决定是否绘制草地
        if (showGrass) {
            this.drawGrass(logicalHeight, logicalWidth);
        }
    }

    /**
     * 检查目标是否有特殊背景
     * @param {string} targetId - 目标类型ID
     * @returns {boolean}
     */
    hasSpecialBackground(targetId) {
        const specialBackgroundTargets = ['sparkle', 'butterfly', 'fish', 'yarn', 'ladybug','laser'];
        return specialBackgroundTargets.includes(targetId);
    }

    /**
     * 渲染深蓝黑渐变背景（全局背景）
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     */
    renderDarkGradientBackground(width, height) {
        const ctx = this.ctx;

        // 清空画布
        ctx.clearRect(0, 0, width, height);

        // === 深蓝黑径向渐变 ===
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height) * 0.8
        );

        // 渐变色标 - 从中心到边缘
        gradient.addColorStop(0, '#0A1628');      // 中心深蓝黑
        gradient.addColorStop(0.5, '#0D1F3C');    // 中间深蓝灰
        gradient.addColorStop(1, '#000000');      // 边缘纯黑

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // === 微弱地面质感 ===
        this.renderGroundTexture(ctx, width, height);
    }

    /**
     * 渲染地面纹理（微弱质感）
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     */
    renderGroundTexture(ctx, width, height) {
        const time = Date.now() / 1000;  // 当前时间（秒）

        ctx.save();
        ctx.globalAlpha = 0.05;  // 低不透明度
        ctx.strokeStyle = '#1A2A4A';
        ctx.lineWidth = 1;

        // === 绘制细密的网格纹理 ===
        const gridSize = 40;
        const offsetX = Math.floor(time * 10) % gridSize;
        const offsetY = Math.floor(time * 5) % gridSize;

        // 垂直线
        for (let x = offsetX; x < width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }

        // 水平线
        for (let y = offsetY; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // === 添加随机噪点（模拟地面质感）===
        this.renderGroundNoise(ctx, width, height, time);

        ctx.restore();
    }

    /**
     * 渲染地面噪点
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     * @param {number} time - 当前时间（秒）
     */
    renderGroundNoise(ctx, width, height, time) {
        const noiseCount = 50;
        const noiseSize = 2;

        ctx.fillStyle = '#1A2A4A';

        for (let i = 0; i < noiseCount; i++) {
            // 使用确定性随机（基于时间和索引）
            const seed = (time * 0.1 + i * 100) % 1000;
            const x = (Math.sin(seed) * 0.5 + 0.5) * width;
            const y = (Math.cos(seed * 1.3) * 0.5 + 0.5) * height;

            ctx.beginPath();
            ctx.arc(x, y, noiseSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * 渲染光点的深蓝黑渐变背景
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     */
    renderSparkleBackground(width, height) {
        const ctx = this.ctx;

        // 计算中心点和最大半径
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.max(width, height) * 0.7;

        // 创建径向渐变（从中心向外）
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, maxRadius
        );

        // 渐变色标：中心微亮 → 中间深蓝 → 边缘深黑
        gradient.addColorStop(0, 'rgba(20, 40, 80, 0.4)');     // 中心：微亮深蓝
        gradient.addColorStop(0.3, 'rgba(10, 25, 50, 0.7)');   // 中层：深蓝
        gradient.addColorStop(0.6, 'rgba(5, 15, 30, 0.85)');   // 外层：更深蓝
        gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');          // 边缘：纯黑

        // 填充整个画布
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    /**
     * 渲染萤火虫夜晚背景
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     * @param {number} time - 当前时间（秒）
     */
    renderFireflyBackground(width, height, time) {
        const ctx = this.ctx;

        // === 1. 三层垂直渐变背景 ===
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0B1F3A');      // 深夜蓝
        gradient.addColorStop(0.5, '#132F4C');    // 深蓝
        gradient.addColorStop(1, '#0F3A2E');      // 暗绿色

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // === 2. 微粒子效果 ===
        this.renderFireflyParticles(width, height, time);
    }

    /**
     * 渲染萤火虫微粒子效果
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     * @param {number} time - 当前时间（秒）
     */
    renderFireflyParticles(width, height, time) {
        const ctx = this.ctx;
        const particleCount = 12;  // 非常少

        // 粒子颜色配置
        const particleColors = [
            'rgba(255, 255, 255, 0.2)',   // 白色
            'rgba(180, 220, 255, 0.15)'    // 淡蓝色
        ];

        // 使用确定性随机（固定种子）
        const seed = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
                      110, 220, 330, 440, 550, 660, 770, 880, 990, 110];

        for (let i = 0; i < particleCount; i++) {
            // 基础位置（固定种子）
            const baseX = seed[i] % width;
            const baseY = seed[(i + 1) % seed.length] % (height * 0.8);

            // 缓慢水平漂移（5px/s）
            const driftOffset = (time * 5 + i * 50) % width;
            const x = (baseX + driftOffset) % width;

            // 垂直缓慢波动（正弦波）
            const floatOffset = Math.sin(time * 0.3 + i * 0.5) * 15;
            const y = (baseY + floatOffset) % (height * 0.8);

            // 粒子大小（1-2px）
            const size = 1 + (i % 2);

            // 粒子颜色（交替使用）
            const color = particleColors[i % particleColors.length];

            // 绘制粒子
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }
    }

    /**
     * 渲染深绿草地背景（蝴蝶专用）
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     * @param {number} time - 当前时间（秒）
     */
    renderButterflyGrassBackground(width, height, time) {
        const ctx = this.ctx;

        // 1. 基础渐变（天空到草地）
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#87CEEB');       // 天空浅蓝
        gradient.addColorStop(0.6, '#98D8AA');     // 地平线雾绿
        gradient.addColorStop(1, '#2D5016');       // 前景深绿
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 2. 密集草地层（底部 120px）
        const grassHeight = 120;
        const grassY = height - grassHeight;

        // 深绿草地渐变
        const grassGradient = ctx.createLinearGradient(0, grassY, 0, height);
        grassGradient.addColorStop(0, '#4A7C23');     // 中绿顶部
        grassGradient.addColorStop(0.3, '#3D6B1C');   // 中绿
        grassGradient.addColorStop(1, '#1A3D0C');     // 深绿底部
        ctx.fillStyle = grassGradient;
        ctx.fillRect(0, grassY, width, grassHeight);

        // 3. 绘制密集草叶
        this.renderDenseGrassBlades(width, grassY, grassHeight, time);

        // 4. 绘制漂浮粒子（花粉/灰尘）
        this.renderFloatingParticles(width, height, time);
    }

    /**
     * 渲染密集草叶
     * @param {number} width - 宽度
     * @param {number} startY - 起始Y坐标
     * @param {number} height - 草地高度
     * @param {number} time - 当前时间（秒）
     */
    renderDenseGrassBlades(width, startY, height, time) {
        const ctx = this.ctx;
        const bladeCount = Math.floor(width / 3);  // 密集草叶（3px间距）

        for (let i = 0; i < bladeCount; i++) {
            // 基于索引的固定位置
            const baseX = i * 3;

            // 微小的风吹摆动动画（基于时间）
            const sway = Math.sin(time * 1.5 + i * 0.1) * 1.5;  // ±1.5px
            const x = baseX + sway;

            // 基于索引的固定高度
            const bladeHeight = 25 + (i % 5) * 8;  // 25, 33, 41, 49, 57 循环

            // 固定的倾斜角度（基于索引）
            const baseAngle = ((i % 7) - 3) * 0.04;  // -0.12 到 +0.12
            const leanAngle = baseAngle + Math.sin(time * 2 + i * 0.2) * 0.03;  // 微小摆动

            ctx.save();
            ctx.translate(x, startY);
            ctx.rotate(leanAngle);

            // 绘制草叶（二次曲线）
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(
                bladeHeight * 0.3, -bladeHeight * 0.7,
                0, -bladeHeight
            );

            // 草叶渐变
            const bladeGradient = ctx.createLinearGradient(0, 0, 0, -bladeHeight);
            bladeGradient.addColorStop(0, '#2D5016');      // 深绿基部
            bladeGradient.addColorStop(0.6, '#4A7C23');    // 中绿
            bladeGradient.addColorStop(1, '#6B8E23');      // 浅绿尖端

            ctx.strokeStyle = bladeGradient;
            ctx.lineWidth = 2;  // 固定线宽
            ctx.lineCap = 'round';
            ctx.stroke();

            ctx.restore();
        }
    }

    /**
     * 渲染漂浮粒子（花粉/灰尘）
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {number} time - 当前时间（秒）
     */
    renderFloatingParticles(width, height, time) {
        const ctx = this.ctx;
        const particleCount = 30;
        const seed = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000,
                      110, 220, 330, 440, 550, 660, 770, 880, 990, 110,
                      120, 240, 360, 480, 600, 720, 840, 960, 1080, 120];

        for (let i = 0; i < particleCount; i++) {
            // 使用固定种子确定基础位置
            const seedX = seed[i] % width;
            const seedY = seed[(i + 1) % seed.length] % (height * 0.8);
            const baseX = seedX;
            const baseY = seedY;

            // 缓慢的水平漂移动画
            const driftOffset = (time * 5 + i * 50) % width;  // 5px/s 慢速
            const x = (baseX + driftOffset) % width;

            // 垂直方向的缓慢波动
            const floatOffset = Math.sin(time * 0.5 + i * 0.3) * 10;
            const y = (baseY + floatOffset) % (height * 0.8);

            // 基于索引的大小（固定）
            const size = 1 + (i % 3);  // 1-3px

            // 透明度基于时间波动
            const alpha = 0.2 + Math.sin(time * 1.5 + i) * 0.1;  // 0.1-0.3

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;  // 浅黄粒子
            ctx.fill();
        }
    }

    /**
     * 窗口大小变化时重新生成草地
     * @param {number} dpr - 设备像素比
     */
    resize(dpr = 1) {
        this.dpr = dpr;
        this.grassCache.setDpr(dpr);
        this.grassRenderer.resize(dpr);
        this.grassElements = null;
    }

    /**
     * 更新草地动画
     * @param {number} dt - 时间增量（秒）
     * @param {number} time - 当前时间（毫秒）
     */
    update(dt, time) {
        this.grassRenderer.update(dt, time);
    }

    /**
     * 处理触摸事件
     * @param {{x: number, y: number}} position - 触摸位置
     */
    handleTouch(position) {
        this.grassRenderer.handleTouch(position);
    }

    /**
     * 渲染水体背景（深蓝渐变 + 水波 + 气泡）
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     * @param {number} time - 当前时间（用于动画）
     */
    renderWaterBackground(width, height, time) {
        const ctx = this.ctx;

        // 1. 深蓝渐变背景
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0A2463');   // 深蓝
        gradient.addColorStop(0.5, '#1E3A8A'); // 中蓝
        gradient.addColorStop(1, '#0F4C75');   // 底部蓝

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // 2. 微弱水波效果（正弦波线条）
        this.renderWaterWaves(width, height, time);

        // 3. 漂浮气泡
        this.renderBubbles(width, height, time);
    }

    /**
     * 渲染水波效果
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     * @param {number} time - 当前时间
     */
    renderWaterWaves(width, height, time) {
        const ctx = this.ctx;
        const waveCount = 5;

        for (let w = 0; w < waveCount; w++) {
            const y = (height / waveCount) * w + 50;
            const amplitude = 10 + w * 2;
            const frequency = 0.01 + w * 0.002;
            const phase = time * (0.5 + w * 0.1);
            const alpha = 0.05 + w * 0.01;

            ctx.beginPath();
            ctx.moveTo(0, y);

            for (let x = 0; x <= width; x += 10) {
                const waveY = y + Math.sin(x * frequency + phase) * amplitude;
                ctx.lineTo(x, waveY);
            }

            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    /**
     * 渲染漂浮气泡
     * 使用伪随机生成固定位置的气泡，但透明度和位置有轻微波动
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     * @param {number} time - 当前时间
     */
    renderBubbles(width, height, time) {
        const ctx = this.ctx;

        // 使用固定的种子生成10个气泡（基于位置的伪随机）
        const bubbleCount = 10;
        const seed = [123, 456, 789, 234, 567, 890, 345, 678, 901, 234];

        for (let i = 0; i < bubbleCount; i++) {
            // 基于种子的伪随机位置
            const baseX = (seed[i] % width);
            const baseY = (seed[(i + 1) % seed.length] % height);
            const bubbleSize = 3 + (seed[i] % 10);

            // 气泡缓慢上升动画
            const riseOffset = (time * 20 + i * 50) % height;
            const y = (baseY - riseOffset + height) % height;

            // 透明度波动
            const alpha = 0.1 + Math.sin(time * 2 + i) * 0.05;

            ctx.beginPath();
            ctx.arc(baseX, y, bubbleSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fill();

            // 气泡高光
            ctx.beginPath();
            ctx.arc(baseX - bubbleSize * 0.3, y - bubbleSize * 0.3, bubbleSize * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 1.5})`;
            ctx.fill();
        }
    }
}
