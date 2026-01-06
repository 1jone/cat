/**
 * SidebarRewardUI - 侧边栏奖励 UI 组件
 * 负责渲染入口按钮、引导弹窗和奖励成功弹窗
 */

import { SETTINGS_CONFIG, SIDEBAR_REWARD_CONFIG } from './config.js';
import { drawRoundRect } from './utils/CanvasUtils.js';

export class SidebarRewardUI {
    constructor(canvas, ctx, sidebarManager, emojiManager = null) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.sidebarManager = sidebarManager;
        this.emojiManager = emojiManager;
        this.dpr = 1;

        // UI 状态
        this.showingGuide = false;      // 是否显示引导弹窗
        this.showingReward = false;     // 是否显示奖励弹窗
        this.currentReward = null;      // 当前奖励信息

        // 按钮区域（用于点击检测）
        this.entryButton = null;
        this.guideButton = null;
        this.rewardButton = null;
        this.closeButton = null;

        // 动画状态
        this.animationTime = 0;
        this.redDotPulse = 0;

        // 奖励关卡图片
        this.rewardImage = null;
    }

    /**
     * 更新布局
     * @param {number} dpr - 设备像素比
     */
    updateLayout(dpr = 1) {
        this.dpr = dpr;
    }

    /**
     * 更新动画
     * @param {number} dt - 时间增量（秒）
     */
    update(dt) {
        this.animationTime += dt;
        this.redDotPulse = (Math.sin(this.animationTime * 3) + 1) / 2; // 0-1 脉冲
    }

    /**
     * 渲染入口按钮（在开始界面调用）
     * @param {number} x - 按钮中心 X
     * @param {number} y - 按钮中心 Y
     * @returns {boolean} 是否渲染了按钮
     */
    renderEntryButton(x, y) {
        // 检查是否应该显示按钮
        if (!this.sidebarManager.shouldShowEntryButton()) {
            // 清除按钮区域，避免点击检测
            this.entryButton = null;
            return false;
        }

        const ctx = this.ctx;
        const cfg = SIDEBAR_REWARD_CONFIG.ui;
        const colors = SETTINGS_CONFIG.COLORS;

        // 按钮尺寸
        const buttonWidth = 120;
        const buttonHeight = 40;
        const buttonX = x - buttonWidth / 2;
        const buttonY = y - buttonHeight / 2;

        // 保存按钮区域用于点击检测
        this.entryButton = {
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };

        ctx.save();

        // 按钮背景（毛玻璃风格）
        ctx.fillStyle = 'rgba(255, 215, 0, 0.2)'; // 金色半透明
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 2;

        // 圆角矩形
        const radius = buttonHeight / 2;
        drawRoundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, radius);
        ctx.fill();
        ctx.stroke();

        // 图标和文字
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const text = cfg.buttonText || '入口有奖';

        // 使用 emoji 精灵图渲染图标
        if (this.emojiManager) {
            this.emojiManager.draw(ctx, 'gift', x - 40, y, 20);
            ctx.fillText(text, x + 10, y);
        } else {
            ctx.fillText(`🎁 ${text}`, x, y);
        }

        // 红点提示
        if (this.sidebarManager.shouldShowRedDot()) {
            const dotRadius = 6 + this.redDotPulse * 2; // 脉冲效果
            const dotX = buttonX + buttonWidth - 8;
            const dotY = buttonY + 8;

            ctx.beginPath();
            ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 59, 48, ${0.8 + this.redDotPulse * 0.2})`;
            ctx.fill();

            // 白色边框
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        ctx.restore();
        return true;
    }

    /**
     * 显示引导弹窗
     */
    showGuide() {
        this.showingGuide = true;
    }

    /**
     * 隐藏引导弹窗
     */
    hideGuide() {
        this.showingGuide = false;
    }

    /**
     * 显示奖励弹窗
     * @param {Object} reward - 奖励信息 { targetId, targetName, targetImage, duration }
     */
    showReward(reward) {
        this.currentReward = reward;
        this.showingReward = true;

        // 加载奖励关卡图片
        if (reward.targetImage) {
            this.rewardImage = tt.createImage();
            this.rewardImage.src = reward.targetImage;
        }
    }

    /**
     * 隐藏奖励弹窗
     */
    hideReward() {
        this.showingReward = false;
        this.currentReward = null;
        this.rewardImage = null;
    }

    /**
     * 渲染弹窗（如果有）
     */
    render() {
        if (this.showingGuide) {
            this.renderGuidePopup();
        } else if (this.showingReward) {
            this.renderRewardPopup();
        }
    }

    /**
     * 渲染引导弹窗
     */
    renderGuidePopup() {
        const ctx = this.ctx;
        const colors = SETTINGS_CONFIG.COLORS;
        const text = SIDEBAR_REWARD_CONFIG.text;

        const canvasW = this.canvas.width / this.dpr;
        const canvasH = this.canvas.height / this.dpr;

        // 弹窗尺寸
        const popupWidth = Math.min(300, canvasW * 0.85);
        const popupHeight = 320;
        const popupX = (canvasW - popupWidth) / 2;
        const popupY = (canvasH - popupHeight) / 2;

        ctx.save();

        // 遮罩
        ctx.fillStyle = colors.overlay;
        ctx.fillRect(0, 0, canvasW, canvasH);

        // 弹窗背景
        ctx.fillStyle = colors.panelBg;
        ctx.strokeStyle = colors.panelBorder;
        ctx.lineWidth = 2;
        drawRoundRect(ctx, popupX, popupY, popupWidth, popupHeight, 20);
        ctx.fill();
        ctx.stroke();

        // 标题
        ctx.fillStyle = colors.title;
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const titleY = popupY + 45;
        if (this.emojiManager) {
            this.emojiManager.draw(ctx, 'gift', canvasW / 2 - 60, titleY, 24);
            ctx.fillText(text.guideTitle, canvasW / 2 + 10, titleY);
        } else {
            ctx.fillText(`🎁 ${text.guideTitle}`, canvasW / 2, titleY);
        }

        // 描述文字
        ctx.fillStyle = colors.text;
        ctx.font = '15px sans-serif';
        const descLines = this.wrapText(text.guideDesc, popupWidth - 40);
        let lineY = popupY + 90;
        for (const line of descLines) {
            ctx.fillText(line, canvasW / 2, lineY);
            lineY += 24;
        }

        // 侧边栏示意区域
        const guideBoxY = popupY + 160;
        const guideBoxHeight = 70;
        ctx.fillStyle = colors.innerBg;
        drawRoundRect(ctx, popupX + 20, guideBoxY, popupWidth - 40, guideBoxHeight, 10);
        ctx.fill();

        // 示意文字
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '13px sans-serif';
        ctx.fillText('从侧边栏进入游戏领取奖励', canvasW / 2, guideBoxY + guideBoxHeight / 2);

        // 按钮
        const buttonY = popupY + popupHeight - 60;
        const buttonWidth = popupWidth - 60;
        const buttonHeight = 44;
        const buttonX = popupX + 30;

        this.guideButton = {
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };

        // 按钮背景
        ctx.fillStyle = colors.accent;
        drawRoundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, buttonHeight / 2);
        ctx.fill();

        // 按钮文字
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(text.guideButton, canvasW / 2, buttonY + buttonHeight / 2);

        // 关闭按钮（右上角 X）
        const closeSize = 30;
        const closeX = popupX + popupWidth - closeSize - 10;
        const closeY = popupY + 10;

        this.closeButton = {
            x: closeX,
            y: closeY,
            width: closeSize,
            height: closeSize
        };

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(closeX + closeSize / 2, closeY + closeSize / 2, closeSize / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(closeX + 10, closeY + 10);
        ctx.lineTo(closeX + closeSize - 10, closeY + closeSize - 10);
        ctx.moveTo(closeX + closeSize - 10, closeY + 10);
        ctx.lineTo(closeX + 10, closeY + closeSize - 10);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * 渲染奖励弹窗
     */
    renderRewardPopup() {
        if (!this.currentReward) return;

        const ctx = this.ctx;
        const colors = SETTINGS_CONFIG.COLORS;
        const text = SIDEBAR_REWARD_CONFIG.text;
        const reward = this.currentReward;

        const canvasW = this.canvas.width / this.dpr;
        const canvasH = this.canvas.height / this.dpr;

        // 弹窗尺寸
        const popupWidth = Math.min(300, canvasW * 0.85);
        const popupHeight = 360;
        const popupX = (canvasW - popupWidth) / 2;
        const popupY = (canvasH - popupHeight) / 2;

        ctx.save();

        // 遮罩
        ctx.fillStyle = colors.overlay;
        ctx.fillRect(0, 0, canvasW, canvasH);

        // 弹窗背景
        ctx.fillStyle = colors.panelBg;
        ctx.strokeStyle = colors.panelBorder;
        ctx.lineWidth = 2;
        drawRoundRect(ctx, popupX, popupY, popupWidth, popupHeight, 20);
        ctx.fill();
        ctx.stroke();

        // 标题
        ctx.fillStyle = colors.title;
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const titleY = popupY + 45;
        if (this.emojiManager) {
            this.emojiManager.draw(ctx, 'party', canvasW / 2 - 60, titleY, 24);
            ctx.fillText(text.rewardTitle, canvasW / 2 + 10, titleY);
        } else {
            ctx.fillText(`🎉 ${text.rewardTitle}`, canvasW / 2, titleY);
        }

        // 关卡图片
        const imageSize = 100;
        const imageX = canvasW / 2 - imageSize / 2;
        const imageY = popupY + 80;

        if (this.rewardImage && this.rewardImage.complete) {
            ctx.drawImage(this.rewardImage, imageX, imageY, imageSize, imageSize);
        } else {
            // 占位符
            ctx.fillStyle = colors.innerBg;
            drawRoundRect(ctx, imageX, imageY, imageSize, imageSize, 15);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.font = '40px sans-serif';
            ctx.fillText('?', canvasW / 2, imageY + imageSize / 2);
        }

        // 关卡名称
        ctx.fillStyle = colors.accent;
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(`【${reward.targetName}】关卡已解锁`, canvasW / 2, imageY + imageSize + 35);

        // 限时文字
        ctx.fillStyle = colors.text;
        ctx.font = '15px sans-serif';
        const durationText = this.sidebarManager.formatDuration(reward.duration);
        ctx.fillText(`限时 ${durationText}`, canvasW / 2, imageY + imageSize + 65);

        // 按钮
        const buttonY = popupY + popupHeight - 60;
        const buttonWidth = popupWidth - 60;
        const buttonHeight = 44;
        const buttonX = popupX + 30;

        this.rewardButton = {
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };

        // 按钮背景
        ctx.fillStyle = colors.accent;
        drawRoundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, buttonHeight / 2);
        ctx.fill();

        // 按钮文字
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(text.rewardButton, canvasW / 2, buttonY + buttonHeight / 2);

        ctx.restore();
    }

    /**
     * 处理点击事件
     * @param {number} x - 点击 X 坐标
     * @param {number} y - 点击 Y 坐标
     * @returns {string|null} 点击结果：'entry'|'guide-confirm'|'reward-confirm'|'close'|null
     */
    handleClick(x, y) {
        // 检查引导弹窗
        if (this.showingGuide) {
            if (this.isInRect(x, y, this.guideButton)) {
                return 'guide-confirm';
            }
            if (this.isInRect(x, y, this.closeButton)) {
                return 'close';
            }
            return 'popup-background'; // 点击了弹窗区域但非按钮
        }

        // 检查奖励弹窗
        if (this.showingReward) {
            if (this.isInRect(x, y, this.rewardButton)) {
                return 'reward-confirm';
            }
            return 'popup-background';
        }

        // 检查入口按钮
        if (this.entryButton && this.isInRect(x, y, this.entryButton)) {
            return 'entry';
        }

        return null;
    }

    /**
     * 检查点是否在矩形内
     */
    isInRect(x, y, rect) {
        if (!rect) return false;
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }

    /**
     * 文字换行
     * @param {string} text - 原文
     * @param {number} maxWidth - 最大宽度
     * @returns {string[]} 分行后的文字数组
     */
    wrapText(text, maxWidth) {
        const ctx = this.ctx;
        const lines = [];
        let currentLine = '';

        for (const char of text) {
            const testLine = currentLine + char;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = char;
            } else {
                currentLine = testLine;
            }
        }

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    /**
     * 是否正在显示任何弹窗
     * @returns {boolean}
     */
    isShowingPopup() {
        return this.showingGuide || this.showingReward;
    }
}
