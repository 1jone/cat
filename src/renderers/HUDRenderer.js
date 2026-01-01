/**
 * HUDRenderer - HUD 和按钮渲染器
 * 负责绘制游戏界面的 HUD、静音按钮和设置按钮
 */

import { AUDIO_CONFIG, SETTINGS_CONFIG } from '../config';
import { drawRoundRect } from '../utils/CanvasUtils';

export class HUDRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;

        // 按钮位置
        this.muteButton = null;
        this.settingsButton = null;

        // 初始化按钮位置
        this.updateButtonPositions();
    }

    /**
     * 更新按钮位置（窗口大小变化时调用）
     */
    updateButtonPositions() {
        // 静音按钮
        const muteConfig = AUDIO_CONFIG.MUTE_BUTTON;
        this.muteButton = {
            x: this.canvas.width - muteConfig.SIZE / 2 - muteConfig.PADDING,
            y: muteConfig.SIZE / 2 + muteConfig.PADDING,
            size: muteConfig.SIZE
        };

        // 设置按钮（在静音按钮左侧）
        const settingsConfig = SETTINGS_CONFIG.SETTINGS_BUTTON;
        this.settingsButton = {
            x: this.canvas.width - muteConfig.SIZE - muteConfig.PADDING - settingsConfig.SIZE / 2 - 10,
            y: settingsConfig.SIZE / 2 + settingsConfig.PADDING,
            size: settingsConfig.SIZE
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

        // 无尽模式和计时模式使用一致的深灰色背景
        if (isEndlessMode) {
            ctx.fillStyle = 'rgba(51, 51, 51, 0.7)';
        } else {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        }
        drawRoundRect(ctx, 10, 10, 150, 95, 10);
        ctx.fill();

        // 无尽模式金色边框效果
        if (isEndlessMode) {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        if (isEndlessMode) {
            // 无尽模式显示
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('♾️ 无尽', 25, 35);
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = '#FFD700';
            ctx.fillText(`${Math.floor(gameTimer / 1000)}s`, 25, 58);
        } else {
            // 计时模式
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 26px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`⏱️ ${timeLeft}s`, 25, 45);
        }

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 22px Arial';
        ctx.fillText(`⭐ ${score}`, 25, 78);

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

        // 图标
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${AUDIO_CONFIG.MUTE_BUTTON.ICON_SIZE}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isMuted ? '🔇' : '🔊', btn.x, btn.y);
        ctx.textBaseline = 'alphabetic';
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

        // 齿轮图标
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${SETTINGS_CONFIG.SETTINGS_BUTTON.SIZE * 0.5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(SETTINGS_CONFIG.SETTINGS_BUTTON.ICON, btn.x, btn.y);
        ctx.textBaseline = 'alphabetic';
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
     */
    resize() {
        this.updateButtonPositions();
    }
}
