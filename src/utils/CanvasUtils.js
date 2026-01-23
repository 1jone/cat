/**
 * CanvasUtils - Canvas 绘制工具函数
 * 提供通用的 Canvas 绘制方法
 */

/**
 * 绘制圆角矩形路径（兼容不支持 roundRect 的环境）
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
 * @param {number} x - 左上角 x 坐标
 * @param {number} y - 左上角 y 坐标
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} radius - 圆角半径
 */
export function drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
}

/**
 * 离屏 Canvas 缓存类
 * 自动处理 DPR 缩放和主 Canvas 渲染
 */
export class OffscreenCanvasCache {
    /**
     * @param {Object} options - 配置选项
     * @param {number} options.dpr - 设备像素比 (默认: 1)
     */
    constructor(options = {}) {
        /** @type {OffscreenCanvas|null} */
        this.canvas = null;
        /** @type {CanvasRenderingContext2D|null} */
        this.ctx = null;
        /** @type {number} */
        this.dpr = options.dpr || 1;
        /** @type {boolean} */
        this.dirty = true;
    }

    /**
     * 初始化/重新生成离屏 Canvas
     * @param {number} logicalWidth - 逻辑宽度
     * @param {number} logicalHeight - 逻辑高度
     * @param {Function} renderFn - 渲染函数，接收 (ctx, logicalWidth, logicalHeight) 作为参数
     */
    generate(logicalWidth, logicalHeight, renderFn) {
        if (!this.dirty && this.canvas) return;

        this.canvas = tt.createCanvas();
        this.canvas.width = Math.floor(logicalWidth * this.dpr);
        this.canvas.height = Math.floor(logicalHeight * this.dpr);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        renderFn(this.ctx, logicalWidth, logicalHeight);
        this.dirty = false;
    }

    /**
     * 绘制到主 Canvas
     * @param {CanvasRenderingContext2D} destCtx - 目标上下文
     * @param {number} x - 目标 X（逻辑坐标）
     * @param {number} y - 目标 Y（逻辑坐标）
     * @param {number} logicalWidth - 目标逻辑宽度
     * @param {number} logicalHeight - 目标逻辑高度
     */
    draw(destCtx, x, y, logicalWidth, logicalHeight) {
        if (!this.canvas) return;

        destCtx.drawImage(
            this.canvas,
            0, 0, this.canvas.width, this.canvas.height,
            x, y, logicalWidth, logicalHeight
        );
    }

    /**
     * 标记为需要重新生成
     */
    invalidate() {
        this.dirty = true;
    }

    /**
     * 更新 DPR（自动标记为 dirty）
     * @param {number} dpr - 新的设备像素比
     */
    setDpr(dpr) {
        this.dpr = dpr;
        this.invalidate();
    }

    /**
     * 获取逻辑尺寸
     * @returns {{width: number, height: number}|null}
     */
    getLogicalSize() {
        if (!this.canvas) return null;
        return {
            width: this.canvas.width / this.dpr,
            height: this.canvas.height / this.dpr
        };
    }

    /**
     * 获取物理尺寸
     * @returns {{width: number, height: number}|null}
     */
    getPhysicalSize() {
        if (!this.canvas) return null;
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }

    /**
     * 检查缓存是否有效
     * @returns {boolean}
     */
    isValid() {
        return this.canvas !== null && !this.dirty;
    }

    /**
     * 清理资源
     */
    dispose() {
        this.canvas = null;
        this.ctx = null;
        this.dirty = true;
    }
}

/**
 * 创建离屏 Canvas（一次性使用场景）
 * @param {number} logicalWidth - 逻辑宽度
 * @param {number} logicalHeight - 逻辑高度
 * @param {number} dpr - 设备像素比 (默认: 1)
 * @returns {{canvas: OffscreenCanvas, ctx: CanvasRenderingContext2D}}
 */
export function createOffscreenCanvas(logicalWidth, logicalHeight, dpr = 1) {
    const canvas = tt.createCanvas();
    canvas.width = Math.floor(logicalWidth * dpr);
    canvas.height = Math.floor(logicalHeight * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { canvas, ctx };
}

/**
 * 计算逻辑尺寸
 * @param {HTMLCanvasElement|OffscreenCanvas} canvas - Canvas 元素
 * @param {number} dpr - 设备像素比
 * @returns {{width: number, height: number}}
 */
export function getLogicalSize(canvas, dpr) {
    return {
        width: canvas.width / dpr,
        height: canvas.height / dpr
    };
}

/**
 * 绘制离屏 Canvas 到主 Canvas
 * @param {CanvasRenderingContext2D} destCtx - 目标上下文
 * @param {HTMLCanvasElement|OffscreenCanvas} srcCanvas - 源 Canvas
 * @param {number} x - 目标 X（逻辑坐标）
 * @param {number} y - 目标 Y（逻辑坐标）
 * @param {number} logicalWidth - 目标逻辑宽度
 * @param {number} logicalHeight - 目标逻辑高度
 */
export function drawOffscreenCanvas(destCtx, srcCanvas, x, y, logicalWidth, logicalHeight) {
    destCtx.drawImage(
        srcCanvas,
        0, 0, srcCanvas.width, srcCanvas.height,
        x, y, logicalWidth, logicalHeight
    );
}
