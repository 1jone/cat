/**
 * HUDRenderer - HUD 和按钮渲染器
 * 负责绘制游戏界面的 HUD、静音按钮和设置按钮
 */

import { AUDIO_CONFIG, SETTINGS_CONFIG } from '../config';
import { drawRoundRect } from '../utils/CanvasUtils';

export class HUDRenderer {
    constructor(canvas, ctx, emojiManager) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.emojiManager = emojiManager;
        this.dpr = 1;  // 设备像素比

        // 按钮位置
        this.muteButton = null;
        this.settingsButton = null;

        // 初始化按钮位置
        this.updateButtonPositions();
    }

    /**
     * 更新按钮位置（窗口大小变化时调用）
     * 按钮位置：左下角，设置按钮在左，静音按钮在右
     */
    updateButtonPositions() {
        const muteConfig = AUDIO_CONFIG.MUTE_BUTTON;
        const settingsConfig = SETTINGS_CONFIG.SETTINGS_BUTTON;
        const logicalHeight = this.canvas.height / this.dpr;

        // 设置按钮: 左下角最左侧
        this.settingsButton = {
            x: settingsConfig.SIZE / 2 + settingsConfig.PADDING,
            y: logicalHeight - settingsConfig.SIZE / 2 - settingsConfig.PADDING,
            size: settingsConfig.SIZE
        };

        // 静音按钮: 设置按钮右侧
        this.muteButton = {
            x: settingsConfig.PADDING + settingsConfig.SIZE + 10 + muteConfig.SIZE / 2,
            y: logicalHeight - muteConfig.SIZE / 2 - muteConfig.PADDING,
            size: muteConfig.SIZE
        };
    }

    /**
     * 渲染 HUD（计分板和时间）
     * @param {object} params - HUD 参数
     * @param {number} params.score - 当前分数
     * @param {number} params.timeLeft - 剩余时间
     * @param {boolean} params.isEndlessMode - 是否无尽模式
     * @param {number} params.gameTimer - 游戏计时器（无尽模式用）
     */
    renderHUD({ score, timeLeft, isEndlessMode, gameTimer }) {
        const ctx = this.ctx;

        // 设置文字描边样式（确保在各种背景下可见）
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';

        if (isEndlessMode) {
            // 无尽模式显示
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            // 使用 emoji 图片渲染无尽模式图标
            this.emojiManager.draw(ctx, 'infinite', 32, 30, 18);
            ctx.strokeText(' 无尽', 42, 35);
            ctx.fillText(' 无尽', 42, 35);
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.strokeText(`${Math.floor(gameTimer / 1000)}s`, 25, 58);
            ctx.fillText(`${Math.floor(gameTimer / 1000)}s`, 25, 58);
        } else {
            // 计时模式
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 26px Arial';
            ctx.textAlign = 'left';
            // 使用 emoji 图片渲染计时器图标
            this.emojiManager.draw(ctx, 'timer', 38, 38, 24);
            ctx.strokeText(` ${timeLeft}s`, 50, 45);
            ctx.fillText(` ${timeLeft}s`, 50, 45);
        }

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 22px Arial';
        // 使用 emoji 图片渲染星星图标
        this.emojiManager.draw(ctx, 'star', 36, 72, 20);
        ctx.strokeText(` ${score}`, 48, 78);
        ctx.fillText(` ${score}`, 48, 78);

        // 渲染按钮
        this.renderMuteButton(false);
        this.renderSettingsButton();
    }

    /**
     * 渲染静音按钮
     * @param {boolean} isMuted - 是否静音
     */
    renderMuteButton(isMuted) {
        if (!this.muteButton) return;

        const ctx = this.ctx;
        const btn = this.muteButton;

        // 按钮背景
        ctx.fillStyle = isMuted ? 'rgba(200, 50, 50, 0.8)' : 'rgba(50, 50, 50, 0.7)';
        ctx.beginPath();
        ctx.arc(btn.x, btn.y, btn.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // 边框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 使用 emoji 图片渲染图标
        const iconKey = isMuted ? 'sound-off' : 'sound-on';
        this.emojiManager.draw(ctx, iconKey, btn.x, btn.y, AUDIO_CONFIG.MUTE_BUTTON.ICON_SIZE);
    }

    /**
     * 渲染设置按钮
     */
    renderSettingsButton() {
        if (!this.settingsButton) return;

        const ctx = this.ctx;
        const btn = this.settingsButton;

        // 按钮背景
        ctx.fillStyle = 'rgba(50, 50, 50, 0.7)';
        ctx.beginPath();
        ctx.arc(btn.x, btn.y, btn.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // 边框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 使用 emoji 图片渲染齿轮图标
        this.emojiManager.draw(ctx, 'settings', btn.x, btn.y, SETTINGS_CONFIG.SETTINGS_BUTTON.SIZE * 0.5);
    }

    /**
     * 检测静音按钮点击
     * @param {object} pos - 点击位置 { x, y }
     * @returns {boolean} 是否点击了静音按钮
     */
    checkMuteButtonClick(pos) {
        if (!this.muteButton) return false;

        const distance = Math.sqrt(
            Math.pow(pos.x - this.muteButton.x, 2) +
            Math.pow(pos.y - this.muteButton.y, 2)
        );

        // 增大点击区域
        return distance < this.muteButton.size / 2 + 15;
    }

    /**
     * 检测设置按钮点击
     * @param {object} pos - 点击位置 { x, y }
     * @returns {boolean} 是否点击了设置按钮
     */
    checkSettingsButtonClick(pos) {
        if (!this.settingsButton) return false;

        const distance = Math.sqrt(
            Math.pow(pos.x - this.settingsButton.x, 2) +
            Math.pow(pos.y - this.settingsButton.y, 2)
        );

        // 增大点击区域
        return distance < this.settingsButton.size / 2 + 15;
    }

    /**
     * 窗口大小变化时调用
     * @param {number} dpr - 设备像素比
     */
    resize(dpr = 1) {
        this.dpr = dpr;
        this.updateButtonPositions();
    }
}
