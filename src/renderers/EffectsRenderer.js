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
     * @param {object|null} effect - 特效对象 { x, y, time, points, type }
     */
    renderCatchEffect(effect) {
        if (!effect) return;

        const ctx = this.ctx;
        const maxDuration = 0.4;  // 持续时间（秒）
        const progress = Math.min(effect.time / maxDuration, 1);
        const alpha = 0.4 * (1 - progress);  // 从 0.4 淡出到 0
        const scale = 1 + (1 - progress) * 0.3;  // 缩放动画
        const offsetY = (1 - progress) * 30;

        // 根据目标类型选择特效
        // butterfly 和 particle 不显示爪印，只显示分数
        const showPawPrint = !['butterfly', 'particle'].includes(effect.type);

        ctx.save();

        // 如果需要显示爪印（mouse、rabbit 等）
        if (showPawPrint) {
            // 根据目标类型调整爪印大小
            const sizeMap = {
                'mouse': 15,    // 老鼠的小爪印
                'rabbit': 20,   // 兔子的爪印
                'default': 18   // 默认大小
            };
            const pawSize = sizeMap[effect.type] || sizeMap['default'];

            // 使用 emoji 图片渲染爪印（淡淡的小爪印）
            this.emojiManager.drawScaled(ctx, 'paw', effect.x, effect.y - offsetY, pawSize, scale, alpha);

            // 分数（也跟随淡出）
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${20 * scale}px Arial`;
            ctx.fillStyle = '#CCCCCC';  // 浅灰色分数
            ctx.textAlign = 'center';
            ctx.fillText(`+${effect.points}`, effect.x, effect.y - offsetY - pawSize);
        } else {
            // butterfly 或 particle - 只显示分数，不显示爪印
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${24 * scale}px Arial`;
            ctx.fillStyle = '#CCCCCC';  // 浅灰色分数
            ctx.textAlign = 'center';
            ctx.fillText(`+${effect.points}`, effect.x, effect.y - offsetY);
        }

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
