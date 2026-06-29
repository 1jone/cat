/**
 * BackgroundRenderer - 背景和草地渲染器
 * 负责绘制游戏背景和草地装饰
 */

import { CONFIG, GRASS_CONFIG, FEATURE_FLAGS } from '../config';
import { OffscreenCanvasCache } from '../utils/CanvasUtils';
import { GrassRenderer } from './grass/GrassRenderer';
import { getQualityConfig } from '../utils/QualityManager';

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

        // 静态背景离屏缓存
        this._bgCacheCanvas = null;
        this._bgCacheWidth = 0;
        this._bgCacheHeight = 0;
        this._bgCacheKey = '';
    }

    /**
     * 获取或创建静态背景离屏缓存
     * @param {string} key - 缓存标识
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     * @param {boolean} [dirty=true] - 是否需要重新绘制
     * @returns {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, isNew: boolean }}
     */
    _getStaticBgCache(key, width, height, dirty = true) {
        const sizeChanged = this._bgCacheWidth !== width || this._bgCacheHeight !== height;
        const keyChanged = this._bgCacheKey !== key;

        if (sizeChanged || keyChanged) {
            this._bgCacheCanvas = tt.createCanvas();
            this._bgCacheCanvas.width = width;
            this._bgCacheCanvas.height = height;
            this._bgCacheWidth = width;
            this._bgCacheHeight = height;
            this._bgCacheKey = key;
            return { canvas: this._bgCacheCanvas, ctx: this._bgCacheCanvas.getContext('2d'), isNew: true };
        }

        return { canvas: this._bgCacheCanvas, ctx: null, isNew: false };
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
                this.renderMosquitoBackground(logicalWidth, logicalHeight, time);
            } else if (targetId === 'yarn') {
                this.renderDarkGradientBackground(logicalWidth, logicalHeight);
            } else if (targetId === 'ladybug') {
                this.renderFireflyBackground(logicalWidth, logicalHeight, time);
            } else if (targetId === 'mosquito') {
                this.renderMosquitoBackground(logicalWidth, logicalHeight, time);
            } else if (targetId === 'jellyfish' || targetId === 'captain' || targetId === 'octopus' || targetId === 'bear' || targetId === 'seagull') {
                this.renderDeepSeaBackground(logicalWidth, logicalHeight, time);
            } else if (targetId === 'bubblefish') {
                this.renderBubblefishBackground(logicalWidth, logicalHeight, time);
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
        const specialBackgroundTargets = ['sparkle', 'butterfly', 'fish', 'yarn', 'ladybug','laser', 'mosquito', 'jellyfish', 'bubblefish', 'captain', 'octopus', 'bear', 'seagull'];
        return specialBackgroundTargets.includes(targetId);
    }

    /**
     * 渲染深蓝黑渐变背景（全局背景）
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     */
    renderDarkGradientBackground(width, height) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, width, height);

        // 使用离屏缓存（首次创建时绘制，后续直接复用）
        const cache = this._getStaticBgCache('darkGradient', width, height);
        if (cache.isNew) {
            const gradient = cache.ctx.createRadialGradient(
                width / 2, height / 2, 0,
                width / 2, height / 2, Math.max(width, height) * 0.8
            );
            gradient.addColorStop(0, '#0A1628');
            gradient.addColorStop(0.5, '#0D1F3C');
            gradient.addColorStop(1, '#000000');
            cache.ctx.fillStyle = gradient;
            cache.ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(cache.canvas, 0, 0);

        // 地面纹理带时间动画，不缓存
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

        // 使用离屏缓存
        const cache = this._getStaticBgCache('sparkle', width, height);
        if (cache.isNew) {
            const centerX = width / 2;
            const centerY = height / 2;
            const maxRadius = Math.max(width, height) * 0.7;

            const gradient = cache.ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, maxRadius
            );
            gradient.addColorStop(0, 'rgba(20, 40, 80, 0.4)');
            gradient.addColorStop(0.3, 'rgba(10, 25, 50, 0.7)');
            gradient.addColorStop(0.6, 'rgba(5, 15, 30, 0.85)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
            cache.ctx.fillStyle = gradient;
            cache.ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(cache.canvas, 0, 0);
    }

    /**
     * 渲染萤火虫夜晚背景
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     * @param {number} time - 当前时间（秒）
     */
    renderFireflyBackground(width, height, time) {
        const ctx = this.ctx;

        // 缓存静态渐变底色（仅在首次或尺寸变化时创建）
        const cache = this._getStaticBgCache('firefly', width, height);
        if (cache.isNew) {
            const gradient = cache.ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#0B1F3A');
            gradient.addColorStop(0.5, '#132F4C');
            gradient.addColorStop(1, '#0F3A2E');
            cache.ctx.fillStyle = gradient;
            cache.ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(cache.canvas, 0, 0);

        // 微粒子效果（每帧动画）
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
        const quality = getQualityConfig();
        const particleCount = Math.max(4, Math.floor(12 * quality.particleCount));

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
        const quality = getQualityConfig();
        const particleCount = Math.max(8, Math.floor(30 * quality.particleCount));
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

        // 缓存静态渐变底色
        const cache = this._getStaticBgCache('water', width, height);
        if (cache.isNew) {
            const gradient = cache.ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#0A2463');
            gradient.addColorStop(0.5, '#1E3A8A');
            gradient.addColorStop(1, '#0F4C75');
            cache.ctx.fillStyle = gradient;
            cache.ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(cache.canvas, 0, 0);

        // 水波效果（每帧动画）
        this.renderWaterWaves(width, height, time);

        // 漂浮气泡（每帧动画）
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
        const quality = getQualityConfig();
        const waveCount = Math.max(2, Math.floor(5 * quality.particleCount));
        const step = quality.waterWaveStep;

        for (let w = 0; w < waveCount; w++) {
            const y = (height / waveCount) * w + 50;
            const amplitude = 10 + w * 2;
            const frequency = 0.01 + w * 0.002;
            const phase = time * (0.5 + w * 0.1);
            const alpha = 0.05 + w * 0.01;

            ctx.beginPath();
            ctx.moveTo(0, y);

            for (let x = 0; x <= width; x += step) {
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
        const quality = getQualityConfig();

        const bubbleCount = Math.max(3, Math.floor(10 * quality.particleCount));
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

    /**
     * 渲染蚊子专属背景（深蓝黑 + 霓虹线条 + 扫描光）
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     * @param {number} time - 当前时间（秒）
     */
    renderMosquitoBackground(width, height, time) {
        const ctx = this.ctx;

        // 缓存静态径向渐变底色
        const cache = this._getStaticBgCache('mosquito', width, height);
        if (cache.isNew) {
            const gradient = cache.ctx.createRadialGradient(
                width / 2, height / 2, 0,
                width / 2, height / 2, Math.max(width, height) * 0.8
            );
            gradient.addColorStop(0, '#0A1628');
            gradient.addColorStop(0.6, '#060E1A');
            gradient.addColorStop(1, '#020408');
            cache.ctx.fillStyle = gradient;
            cache.ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(cache.canvas, 0, 0);

        // === 2. 霓虹线条 ===
        this.renderNeonLines(ctx, width, height, time);

        // === 3. 扫描光 ===
        this.renderScanLight(ctx, width, height, time);
    }

    /**
     * 渲染霓虹线条
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} width
     * @param {number} height
     * @param {number} time
     */
    renderNeonLines(ctx, width, height, time) {
        ctx.save();
        const quality = getQualityConfig();

        const lineCount = 6;
        const neonColors = [
            { r: 0, g: 200, b: 255 },    // 青色
            { r: 150, g: 0, b: 255 },     // 紫色
            { r: 0, g: 255, b: 150 },     // 青绿
            { r: 255, g: 50, b: 100 },    // 品红
            { r: 100, g: 150, b: 255 },   // 蓝紫
            { r: 0, g: 255, b: 255 },     // 亮青
        ];

        for (let i = 0; i < lineCount; i++) {
            const color = neonColors[i % neonColors.length];
            const baseY = height * (i + 1) / (lineCount + 1);
            const waveAmplitude = 20 + i * 8;
            const waveFreq = 0.008 + i * 0.002;
            const speed = 0.5 + i * 0.15;

            const alpha = 0.08 + Math.sin(time * 0.8 + i * 1.2) * 0.04;

            ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
            ctx.lineWidth = quality.neonLineWidth;
            ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha * 2})`;
            ctx.shadowBlur = quality.enableShadowBlur ? 8 : 0;

            ctx.beginPath();
            for (let x = 0; x <= width; x += 4) {
                const y = baseY + Math.sin(x * waveFreq + time * speed) * waveAmplitude
                              + Math.sin(x * waveFreq * 2.3 + time * speed * 0.7) * waveAmplitude * 0.3;
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * 渲染微弱扫描光
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} width
     * @param {number} height
     * @param {number} time
     */
    renderScanLight(ctx, width, height, time) {
        ctx.save();

        const scanPeriod = 6;
        const scanProgress = (time % scanPeriod) / scanPeriod;
        const scanY = scanProgress * (height + 100) - 50;
        const scanHeight = 60;

        const scanGradient = ctx.createLinearGradient(0, scanY - scanHeight / 2, 0, scanY + scanHeight / 2);
        scanGradient.addColorStop(0, 'rgba(0, 200, 255, 0)');
        scanGradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.04)');
        scanGradient.addColorStop(1, 'rgba(0, 200, 255, 0)');

        ctx.fillStyle = scanGradient;
        ctx.fillRect(0, scanY - scanHeight / 2, width, scanHeight);

        ctx.restore();
    }

    /**
     * 渲染深海背景（水母专用 - 深海渐变 + 光线 + 海草/珊瑚剪影 + 海洋雪粒子）
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     * @param {number} time - 当前时间（秒）
     */
    renderDeepSeaBackground(width, height, time) {
        const ctx = this.ctx;

        // 缓存静态渐变底色 + 珊瑚（珊瑚不依赖 time，是纯静态的）
        const cache = this._getStaticBgCache('deepSea', width, height);
        if (cache.isNew) {
            const gradient = cache.ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0,    '#020B18');
            gradient.addColorStop(0.15, '#061428');
            gradient.addColorStop(0.5,  '#0A1E3D');
            gradient.addColorStop(0.8,  '#081A2A');
            gradient.addColorStop(1,    '#04101A');
            cache.ctx.fillStyle = gradient;
            cache.ctx.fillRect(0, 0, width, height);

            // 珊瑚（纯静态，缓存后不再每帧绘制）
            this._renderCoralStatic(cache.ctx, width, height);
        }
        ctx.drawImage(cache.canvas, 0, 0);

        // === 2. 微弱光线 ===
        this.renderDeepSeaLightRays(ctx, width, height, time);

        // === 3. 底部海草（仅海草需要动画，珊瑚已缓存） ===
        this.renderDeepSeaSeaweed(ctx, width, height, time);

        // === 4. 海洋雪粒子 ===
        this.renderMarineSnow(width, height, time);
    }

    /**
     * 渲染深海微弱光线（从上方投射的淡蓝光柱）
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} width
     * @param {number} height
     * @param {number} time
     */
    renderDeepSeaLightRays(ctx, width, height, time) {
        const quality = getQualityConfig();
        ctx.save();
        ctx.globalAlpha = 0.03;

        const rayCount = Math.max(1, Math.floor(3 * quality.lightRayCount));
        for (let i = 0; i < rayCount; i++) {
            const baseX = width * (0.2 + i * 0.3);
            const sway = Math.sin(time * 0.15 + i * 2.1) * 30;
            const rayWidth = 40 + i * 15;

            const rayGrad = ctx.createLinearGradient(0, 0, 0, height * 0.7);
            rayGrad.addColorStop(0, 'rgba(100, 180, 255, 1)');
            rayGrad.addColorStop(1, 'rgba(100, 180, 255, 0)');

            ctx.fillStyle = rayGrad;
            ctx.beginPath();
            ctx.moveTo(baseX + sway - rayWidth / 2, 0);
            ctx.lineTo(baseX + sway + rayWidth / 2, 0);
            ctx.lineTo(baseX + sway + rayWidth * 1.5, height * 0.7);
            ctx.lineTo(baseX + sway - rayWidth * 0.5, height * 0.7);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * 渲染深海底部植被剪影（海草 + 珊瑚）
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} width
     * @param {number} height
     * @param {number} time
     */
    /**
     * 渲染深海海草（需要 time 参数的动态部分，每帧调用）
     */
    renderDeepSeaSeaweed(ctx, width, height, time) {
        const quality = getQualityConfig();
        const seaweedSeeds = [73, 189, 312, 456, 534, 678, 723, 891, 956, 1034, 1156, 1287];
        const maxCount = Math.min(seaweedSeeds.length, Math.floor(width / 50));
        const seaweedCount = Math.max(2, Math.floor(maxCount * quality.seaweedCount));

        ctx.strokeStyle = 'rgba(5, 30, 25, 0.6)';
        ctx.lineCap = 'round';

        for (let i = 0; i < seaweedCount; i++) {
            const baseX = (seaweedSeeds[i] % (width - 40)) + 20;
            const stalkHeight = 50 + (seaweedSeeds[i] % 80);

            const sway = Math.sin(time * 0.4 + i * 0.7) * 8;
            const sway2 = Math.sin(time * 0.6 + i * 1.3) * 5;

            ctx.lineWidth = 3 + (seaweedSeeds[i] % 4);
            ctx.beginPath();
            ctx.moveTo(baseX, height);
            ctx.bezierCurveTo(
                baseX + sway2 * 0.3, height - stalkHeight * 0.4,
                baseX + sway, height - stalkHeight * 0.8,
                baseX + sway * 1.2, height - stalkHeight
            );
            ctx.stroke();
        }
    }

    /**
     * 渲染静态珊瑚（不依赖 time，缓存到静态背景中只绘制一次）
     */
    _renderCoralStatic(ctx, width, height) {
        const quality = getQualityConfig();
        const coralSeeds = [234, 567, 890, 1123, 1345, 1567];
        const coralCount = Math.max(1, Math.min(coralSeeds.length,
            Math.floor(Math.min(coralSeeds.length, width / 100) * quality.coralCount)));

        ctx.strokeStyle = 'rgba(15, 25, 40, 0.7)';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < coralCount; i++) {
            const baseX = (coralSeeds[i] % (width - 60)) + 30;
            const coralHeight = 25 + (coralSeeds[i] % 35);
            const branches = 2 + (coralSeeds[i] % 2);

            ctx.lineWidth = 4 + (coralSeeds[i] % 3);

            ctx.beginPath();
            ctx.moveTo(baseX, height);
            ctx.lineTo(baseX, height - coralHeight);
            ctx.stroke();

            for (let b = 0; b < branches; b++) {
                const branchY = height - coralHeight * (0.4 + b * 0.25);
                const direction = (b % 2 === 0) ? 1 : -1;
                const branchLen = 10 + (coralSeeds[(i + b) % coralSeeds.length] % 15);
                const angle = direction * (0.3 + b * 0.2);

                ctx.beginPath();
                ctx.moveTo(baseX, branchY);
                ctx.lineTo(
                    baseX + Math.sin(angle) * branchLen,
                    branchY - Math.cos(angle) * branchLen * 0.6
                );
                ctx.stroke();
            }
        }
    }

    /**
     * 渲染海洋雪粒子（深海漂浮微粒，缓慢下落）
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     * @param {number} time - 当前时间（秒）
     */
    renderMarineSnow(width, height, time) {
        const ctx = this.ctx;
        const quality = getQualityConfig();
        const particleCount = Math.max(4, Math.floor(15 * quality.particleCount));
        const seed = [87, 213, 349, 478, 592, 631, 745, 823, 934, 1042,
                      1167, 1253, 1389, 1423, 1567];

        for (let i = 0; i < particleCount; i++) {
            const baseX = seed[i] % width;
            const baseY = seed[(i + 3) % seed.length] % height;

            const fallOffset = (time * 8 + i * 40) % height;
            const y = (baseY + fallOffset) % height;

            const drift = Math.sin(time * 0.3 + i * 1.7) * 6;
            const x = (baseX + drift + width) % width;

            const size = 1 + (i % 2);
            const alpha = 0.12 + Math.sin(time * 0.8 + i * 2.3) * 0.06;

            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180, 220, 255, ${alpha})`;
            ctx.fill();
        }
    }

    /**
     * 渲染气泡鱼背景（浅海明亮 - 渐变 + 少量气泡 + 海草剪影 + 阳光波纹）
     * @param {number} width - 画布宽度
     * @param {number} height - 画布高度
     * @param {number} time - 当前时间（秒）
     */
    renderBubblefishBackground(width, height, time) {
        const ctx = this.ctx;

        // 缓存静态渐变底色
        const cache = this._getStaticBgCache('bubblefish', width, height);
        if (cache.isNew) {
            const gradient = cache.ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0,    '#AEEBFF');
            gradient.addColorStop(0.3,  '#74D3F4');
            gradient.addColorStop(0.7,  '#4AA8D4');
            gradient.addColorStop(1,    '#2D7EA3');
            cache.ctx.fillStyle = gradient;
            cache.ctx.fillRect(0, 0, width, height);
        }
        ctx.drawImage(cache.canvas, 0, 0);

        // === 2. 阳光波纹（水面折射光斑） ===
        this.renderSunlightRipples(ctx, width, height, time);

        // === 3. 少量漂浮气泡 ===
        this.renderBubblefishBubbles(width, height, time);

        // === 4. 底部海草剪影 ===
        this.renderBubblefishSeaweed(ctx, width, height, time);
    }

    /**
     * 渲染阳光波纹（水面折射产生的光斑效果）
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} width
     * @param {number} height
     * @param {number} time
     */
    renderSunlightRipples(ctx, width, height, time) {
        ctx.save();

        // 顶部光柱（从水面向下延伸）
        const rayCount = 4;
        for (let i = 0; i < rayCount; i++) {
            const baseX = width * (0.15 + i * 0.22);
            const sway = Math.sin(time * 0.3 + i * 1.8) * 25;
            const rayWidth = 30 + i * 10;

            const rayGrad = ctx.createLinearGradient(0, 0, 0, height * 0.6);
            rayGrad.addColorStop(0, 'rgba(216, 248, 255, 0.15)');
            rayGrad.addColorStop(0.5, 'rgba(174, 235, 255, 0.06)');
            rayGrad.addColorStop(1, 'rgba(174, 235, 255, 0)');

            ctx.fillStyle = rayGrad;
            ctx.beginPath();
            ctx.moveTo(baseX + sway - rayWidth / 2, 0);
            ctx.lineTo(baseX + sway + rayWidth / 2, 0);
            ctx.lineTo(baseX + sway + rayWidth * 2, height * 0.6);
            ctx.lineTo(baseX + sway - rayWidth, height * 0.6);
            ctx.closePath();
            ctx.fill();
        }

        // 水面波纹线（正弦波，模拟焦散效果）
        const waveCount = 3;
        for (let w = 0; w < waveCount; w++) {
            const baseY = 30 + w * 25;
            const amplitude = 6 + w * 3;
            const frequency = 0.015 + w * 0.003;
            const phase = time * (0.8 + w * 0.2);

            ctx.beginPath();
            ctx.moveTo(0, baseY);
            for (let x = 0; x <= width; x += 6) {
                const waveY = baseY + Math.sin(x * frequency + phase) * amplitude
                                    + Math.sin(x * frequency * 2.1 + phase * 0.6) * amplitude * 0.3;
                ctx.lineTo(x, waveY);
            }

            ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 - w * 0.03})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * 渲染气泡鱼场景的少量气泡
     * @param {number} width
     * @param {number} height
     * @param {number} time
     */
    renderBubblefishBubbles(width, height, time) {
        const ctx = this.ctx;
        const quality = getQualityConfig();
        const bubbleCount = Math.max(3, Math.floor(8 * quality.particleCount));
        const seed = [156, 289, 423, 567, 634, 789, 856, 923];

        for (let i = 0; i < bubbleCount; i++) {
            const baseX = (seed[i] * 3) % width;
            const baseY = (seed[(i + 2) % seed.length] * 5) % height;
            const bubbleSize = 4 + (seed[i] % 8);

            const riseOffset = (time * 15 + i * 60) % height;
            const y = (baseY - riseOffset + height) % height;

            const drift = Math.sin(time * 0.5 + i * 1.1) * 4;
            const x = (baseX + drift + width) % width;

            const alpha = 0.15 + Math.sin(time * 1.2 + i * 0.9) * 0.08;

            // 气泡主体
            ctx.beginPath();
            ctx.arc(x, y, bubbleSize, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(216, 248, 255, ${alpha})`;
            ctx.fill();

            // 气泡边缘
            ctx.beginPath();
            ctx.arc(x, y, bubbleSize, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // 气泡高光
            ctx.beginPath();
            ctx.arc(x - bubbleSize * 0.3, y - bubbleSize * 0.3, bubbleSize * 0.25, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 1.5})`;
            ctx.fill();
        }
    }

    /**
     * 渲染气泡鱼场景的底部海草（浅海风格，较明亮）
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} width
     * @param {number} height
     * @param {number} time
     */
    renderBubblefishSeaweed(ctx, width, height, time) {
        const quality = getQualityConfig();
        const seaweedSeeds = [95, 234, 378, 512, 645, 778, 912, 1045, 1178];
        const maxCount = Math.min(seaweedSeeds.length, Math.floor(width / 45));
        const seaweedCount = Math.max(2, Math.floor(maxCount * quality.seaweedCount));

        // low/medium 层使用纯色替代渐变，减少每帧渐变创建
        const useGradientColor = quality.particleCount > 0.5;

        for (let i = 0; i < seaweedCount; i++) {
            const baseX = (seaweedSeeds[i] % (width - 30)) + 15;
            const stalkHeight = 40 + (seaweedSeeds[i] % 60);

            const sway = Math.sin(time * 0.5 + i * 0.8) * 10;
            const sway2 = Math.sin(time * 0.7 + i * 1.4) * 6;

            ctx.lineWidth = 2 + (seaweedSeeds[i] % 3);
            ctx.lineCap = 'round';

            if (useGradientColor) {
                const bladeGrad = ctx.createLinearGradient(0, height, 0, height - stalkHeight);
                bladeGrad.addColorStop(0, 'rgba(20, 80, 60, 0.5)');
                bladeGrad.addColorStop(0.6, 'rgba(30, 110, 80, 0.35)');
                bladeGrad.addColorStop(1, 'rgba(50, 140, 100, 0.2)');
                ctx.strokeStyle = bladeGrad;
            } else {
                ctx.strokeStyle = 'rgba(30, 100, 70, 0.35)';
            }

            ctx.beginPath();
            ctx.moveTo(baseX, height);
            ctx.bezierCurveTo(
                baseX + sway2 * 0.3, height - stalkHeight * 0.4,
                baseX + sway, height - stalkHeight * 0.75,
                baseX + sway * 1.2, height - stalkHeight
            );
            ctx.stroke();
        }
    }
}
