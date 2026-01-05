/**
 * EffectsRenderer - 特效渲染器
 * 负责绘制抓取特效和解锁通知等
 */

import { drawRoundRect } from '../utils/CanvasUtils';

export class EffectsRenderer {
    constructor(canvas, ctx, emojiManager) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.emojiManager = emojiManager;
        this.dpr = 1;  // 设备像素比
    }

    /**
     * 更新设备像素比
     * @param {number} dpr - 设备像素比
     */
    setDpr(dpr) {
        this.dpr = dpr;
    }

    /**
     * 获取逻辑尺寸
     */
    getLogicalSize() {
        return {
            width: this.canvas.width / this.dpr,
            height: this.canvas.height / this.dpr
        };
    }

    /**
     * 渲染抓取特效
     * @param {object|null} effect - 特效对象 { x, y, time, points }
     */
    renderCatchEffect(effect) {
        if (!effect) return;

        const ctx = this.ctx;
        const alpha = effect.time / 0.4;
        const scale = 1 + (1 - alpha) * 0.8;
        const offsetY = (1 - alpha) * 40;

        ctx.save();

        // 使用 emoji 图片渲染爪印（带缩放和透明度动画）
        this.emojiManager.drawScaled(ctx, 'paw', effect.x, effect.y - offsetY, 40, scale, alpha);

        // 分数
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${24 * scale}px Arial`;
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText(`+${effect.points}`, effect.x, effect.y - offsetY - 40);

        ctx.restore();
    }

    /**
     * 渲染解锁通知
     * @param {object|null} notification - 通知对象 { message, time }
     */
    renderUnlockNotification(notification) {
        if (!notification) return;

        const ctx = this.ctx;
        const alpha = Math.min(notification.time / 2, 1);
        const { width: logicalWidth, height: logicalHeight } = this.getLogicalSize();

        ctx.save();
        ctx.globalAlpha = alpha;

        // 金色背景框（使用逻辑坐标）
        ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
        drawRoundRect(ctx, logicalWidth / 2 - 150, logicalHeight / 2 - 30, 300, 60, 15);
        ctx.fill();

        // 白色文字
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(notification.message, logicalWidth / 2, logicalHeight / 2 + 8);

        ctx.restore();
    }
}
