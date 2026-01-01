/**
 * EffectsRenderer - 特效渲染器
 * 负责绘制抓取特效和解锁通知等
 */

import { drawRoundRect } from '../utils/CanvasUtils';

export class EffectsRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
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
        ctx.globalAlpha = alpha;

        // 爪印
        ctx.font = `${40 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('🐾', effect.x, effect.y - offsetY);

        // 分数
        ctx.font = `bold ${24 * scale}px Arial`;
        ctx.fillStyle = '#FFD700';
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

        ctx.save();
        ctx.globalAlpha = alpha;

        // 金色背景框
        ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
        drawRoundRect(ctx, this.canvas.width / 2 - 150, this.canvas.height / 2 - 30, 300, 60, 15);
        ctx.fill();

        // 白色文字
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(notification.message, this.canvas.width / 2, this.canvas.height / 2 + 8);

        ctx.restore();
    }
}
