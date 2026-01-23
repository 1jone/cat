/**
 * BackgroundRenderer - 背景和草地渲染器
 * 负责绘制游戏背景和草地装饰
 */

import { CONFIG } from '../config';
import { OffscreenCanvasCache } from '../utils/CanvasUtils';

export class BackgroundRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.dpr = 1;  // 设备像素比

        // 草地离屏Canvas缓存（使用 OffscreenCanvasCache）
        this.grassCache = new OffscreenCanvasCache({ dpr: this.dpr });
        // 草地装饰元素缓存
        this.grassElements = null;
    }

    /**
     * 渲染背景
     * @param {HTMLImageElement|null} backgroundImage - 背景图片
     * @param {boolean} showGrass - 是否显示草地
     */
    render(backgroundImage, showGrass = true) {
        const dpr = this.dpr;
        const logicalWidth = this.canvas.width / dpr;
        const logicalHeight = this.canvas.height / dpr;

        if (backgroundImage) {
            this.drawBackgroundWithImage(backgroundImage, showGrass, logicalWidth, logicalHeight);
        } else {
            // 回退到纯色背景
            this.ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
            this.ctx.fillRect(0, 0, logicalWidth, logicalHeight);
            this.drawGrass(logicalHeight);
        }
    }

    /**
     * 绘制草地
     * @param {number} logicalHeight - 画布逻辑高度
     */
    drawGrass(logicalHeight) {
        // 如果草地缓存未生成，先生成
        if (!this.grassCache.isValid()) {
            this.generateGrassElements();
        }

        const grassLogicalHeight = 80;
        const grassLogicalWidth = this.canvas.width / this.dpr;

        // 使用 OffscreenCanvasCache 的 draw 方法
        this.grassCache.draw(
            this.ctx,
            0,
            logicalHeight - grassLogicalHeight,
            grassLogicalWidth,
            grassLogicalHeight
        );
    }

    /**
     * 生成草地装饰元素（预渲染到离屏Canvas，支持高 DPI）
     */
    generateGrassElements() {
        const grassHeight = 80;  // 逻辑高度
        const logicalWidth = this.canvas.width / this.dpr;  // 逻辑宽度

        // 生成草叶数据
        const blades = [];
        const grassBladeCount = Math.floor(logicalWidth / 6); // 更密集的草叶
        for (let i = 0; i < grassBladeCount; i++) {
            blades.push({
                x: (i * 6) + Math.random() * 3,
                height: 6 + Math.random() * 14,
                width: 1.5 + Math.random() * 2.5
            });
        }

        // 生成小圆点数据
        const dots = [];
        const dotCount = Math.floor(logicalWidth / 12); // 更多小圆点
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
            this.drawGrass(logicalHeight);
        }
    }

    /**
     * 窗口大小变化时重新生成草地
     * @param {number} dpr - 设备像素比
     */
    resize(dpr = 1) {
        this.dpr = dpr;
        this.grassCache.setDpr(dpr);
        this.grassElements = null;
        this.generateGrassElements();
    }
}
