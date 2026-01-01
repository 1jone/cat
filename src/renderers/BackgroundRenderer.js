/**
 * BackgroundRenderer - 背景和草地渲染器
 * 负责绘制游戏背景和草地装饰
 */

import { CONFIG } from '../config';

export class BackgroundRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // 草地离屏Canvas缓存（性能优化）
        this.grassCanvas = null;
        // 草地装饰元素缓存
        this.grassElements = null;
    }

    /**
     * 渲染背景
     * @param {HTMLImageElement|null} backgroundImage - 背景图片
     * @param {boolean} showGrass - 是否显示草地
     */
    render(backgroundImage, showGrass = true) {
        if (backgroundImage) {
            this.drawBackgroundWithImage(backgroundImage, showGrass);
        } else {
            // 回退到纯色背景
            this.ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawGrass();
        }
    }

    /**
     * 绘制草地
     */
    drawGrass() {
        // 如果草地Canvas未生成，先生成
        if (!this.grassCanvas) {
            this.generateGrassElements();
        }

        // 直接绘制预渲染的草地（性能优化：从368个绘制调用减少到1个）
        this.ctx.drawImage(
            this.grassCanvas,
            0,
            this.canvas.height - this.grassCanvas.height
        );
    }

    /**
     * 生成草地装饰元素（预渲染到离屏Canvas）
     */
    generateGrassElements() {
        const grassHeight = 80;
        const canvasWidth = this.canvas.width;

        // 创建离屏Canvas预渲染草地
        const grassCanvas = tt.createCanvas();
        grassCanvas.width = canvasWidth;
        grassCanvas.height = grassHeight;
        const grassCtx = grassCanvas.getContext('2d');

        // 绘制渐变背景
        const gradient = grassCtx.createLinearGradient(0, 0, 0, grassHeight);
        gradient.addColorStop(0, '#7EC850');   // 顶部较浅的绿色
        gradient.addColorStop(0.3, '#5DA038'); // 中间绿色
        gradient.addColorStop(1, '#3D7A28');   // 底部较深的绿色
        grassCtx.fillStyle = gradient;
        grassCtx.fillRect(0, 0, canvasWidth, grassHeight);

        // 生成草叶数据（保持高密度，因为使用离屏Canvas只渲染一次）
        const blades = [];
        const grassBladeCount = Math.floor(canvasWidth / 6); // 更密集的草叶
        for (let i = 0; i < grassBladeCount; i++) {
            blades.push({
                x: (i * 6) + Math.random() * 3,
                height: 6 + Math.random() * 14,
                width: 1.5 + Math.random() * 2.5
            });
        }

        // 绘制草丛到离屏Canvas
        grassCtx.fillStyle = 'rgba(100, 160, 50, 0.35)';
        for (const blade of blades) {
            grassCtx.beginPath();
            grassCtx.moveTo(blade.x, 0);
            grassCtx.quadraticCurveTo(
                blade.x + blade.width / 2,
                -blade.height,
                blade.x + blade.width,
                0
            );
            grassCtx.fill();
        }

        // 生成小圆点数据（保持高密度）
        const dots = [];
        const dotCount = Math.floor(canvasWidth / 12); // 更多小圆点
        for (let i = 0; i < dotCount; i++) {
            dots.push({
                x: Math.random() * canvasWidth,
                y: Math.random() * (grassHeight * 0.75),
                size: 2 + Math.random() * 6
            });
        }

        // 绘制小圆点到离屏Canvas
        grassCtx.fillStyle = 'rgba(70, 140, 35, 0.5)';
        for (const dot of dots) {
            grassCtx.beginPath();
            grassCtx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2);
            grassCtx.fill();
        }

        this.grassCanvas = grassCanvas;
        this.grassElements = { blades, dots };
    }

    /**
     * 绘制背景图片（居中裁剪适配，类似 CSS object-fit: cover）
     * @param {HTMLImageElement} image - 背景图片
     * @param {boolean} showGrass - 是否显示草地
     */
    drawBackgroundWithImage(image, showGrass = true) {
        const canvas = this.canvas;
        const ctx = this.ctx;

        // 计算居中裁剪参数
        const canvasRatio = canvas.width / canvas.height;
        const imageRatio = image.width / image.height;

        let renderWidth, renderHeight, offsetX, offsetY;

        if (imageRatio > canvasRatio) {
            // 图片更宽，以高度为准
            renderHeight = canvas.height;
            renderWidth = image.width * (canvas.height / image.height);
            offsetX = (canvas.width - renderWidth) / 2;
            offsetY = 0;
        } else {
            // 图片更高，以宽度为准
            renderWidth = canvas.width;
            renderHeight = image.height * (canvas.width / image.width);
            offsetX = 0;
            offsetY = (canvas.height - renderHeight) / 2;
        }

        // 绘制背景图片
        ctx.drawImage(image, offsetX, offsetY, renderWidth, renderHeight);

        // 根据配置决定是否绘制草地
        if (showGrass) {
            this.drawGrass();
        }
    }

    /**
     * 窗口大小变化时重新生成草地
     */
    resize() {
        this.grassCanvas = null;
        this.grassElements = null;
        this.generateGrassElements();
    }
}
