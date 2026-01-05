/**
 * SettingsUI - 设置页面 UI 渲染和交互
 * 半透明毛玻璃效果设计
 */

import { SETTINGS_CONFIG, CONFIG } from './config';

export class SettingsUI {
    constructor(canvas, ctx, settingsManager, audioManager, emojiManager = null) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.settingsManager = settingsManager;
        this.audioManager = audioManager;
        this.emojiManager = emojiManager;
        this.dpr = 1;  // 设备像素比

        // 面板尺寸（延迟计算）
        this.panel = null;

        // 滑块状态
        this.sliders = [];
        this.activeSlider = null; // 当前拖动的滑块

        // 开关状态
        this.toggles = [];

        // 返回按钮
        this.backButton = null;

        // 退出游戏按钮
        this.exitButton = null;

        // 是否在游戏中（用于显示退出按钮）
        this.isInGame = false;

        // 当前游戏状态信息（用于显示对应的最高分）
        this.currentGameInfo = null;  // { isEndlessMode, targetId, targetName }

        // 初始化布局
        this.updateLayout();
    }

    /**
     * 更新布局（窗口大小变化时调用）
     * @param {number} dpr - 设备像素比
     */
    updateLayout(dpr = 1) {
        this.dpr = dpr;
        const cfg = SETTINGS_CONFIG;
        // 使用逻辑尺寸
        const canvasW = this.canvas.width / this.dpr;
        const canvasH = this.canvas.height / this.dpr;

        // 计算面板尺寸（游戏中时使用更高的面板以容纳额外滑块）
        const panelWidth = Math.min(canvasW * cfg.PANEL.widthRatio, cfg.PANEL.maxWidth);
        const panelHeight = this.isInGame ? cfg.PANEL.heightInGame : cfg.PANEL.height;
        const panelX = (canvasW - panelWidth) / 2;
        const panelY = (canvasH - panelHeight) / 2;

        this.panel = {
            x: panelX,
            y: panelY,
            width: panelWidth,
            height: panelHeight
        };

        // 内容区域
        const contentX = panelX + cfg.PANEL.padding;
        const contentWidth = panelWidth - cfg.PANEL.padding * 2;
        let currentY = panelY + cfg.PANEL.padding + 50; // 标题后

        // 音频分类标题
        currentY += 30;

        // BGM 音量滑块
        this.sliders = [];
        this.sliders.push({
            id: 'bgmVolume',
            label: '背景音乐',
            x: contentX,
            y: currentY,
            width: contentWidth,
            trackX: contentX + contentWidth - cfg.SLIDER.width,
            trackWidth: cfg.SLIDER.width,
            getValue: () => this.settingsManager.getBGMVolume(),
            setValue: (v) => {
                this.settingsManager.setBGMVolume(v);
                this.audioManager.setBGMVolume(v);
            }
        });
        currentY += cfg.SPACING.row + 30;

        // SFX 音量滑块
        this.sliders.push({
            id: 'sfxVolume',
            label: '音效',
            x: contentX,
            y: currentY,
            width: contentWidth,
            trackX: contentX + contentWidth - cfg.SLIDER.width,
            trackWidth: cfg.SLIDER.width,
            getValue: () => this.settingsManager.getSFXVolume(),
            setValue: (v) => {
                this.settingsManager.setSFXVolume(v);
                this.audioManager.setSFXVolume(v);
            }
        });
        currentY += cfg.SPACING.row + 30;

        // 开关组件
        this.toggles = [];

        // 静音开关
        this.toggles.push({
            id: 'muted',
            label: '静音',
            x: contentX,
            y: currentY,
            width: contentWidth,
            toggleX: contentX + contentWidth - cfg.TOGGLE.width,
            getValue: () => this.settingsManager.isMuted(),
            setValue: (v) => {
                this.settingsManager.setMuted(v);
                if (v) {
                    this.audioManager.mute();
                } else {
                    this.audioManager.unmute();
                }
            }
        });
        currentY += cfg.SPACING.group + 20;

        // 游戏分类
        currentY += 30;

        // 震动开关
        this.toggles.push({
            id: 'vibration',
            label: '震动反馈',
            x: contentX,
            y: currentY,
            width: contentWidth,
            toggleX: contentX + contentWidth - cfg.TOGGLE.width,
            getValue: () => this.settingsManager.isVibrationEnabled(),
            setValue: (v) => this.settingsManager.setVibration(v)
        });
        currentY += cfg.SPACING.row + 30;

        // 游戏参数滑块（仅在游戏中显示）
        // 标记游戏参数滑块的起始位置
        this.gameParamSlidersStartIndex = this.sliders.length;

        if (this.isInGame && this.currentGameInfo) {
            const { targetId, isEndlessMode } = this.currentGameInfo;

            // 生成间隔滑块（反向：滑块向右 = 间隔更短 = 生成更快）
            this.sliders.push({
                id: 'spawnInterval',
                label: '生成间隔',
                x: contentX,
                y: currentY,
                width: contentWidth,
                trackX: contentX + contentWidth - cfg.SLIDER.width,
                trackWidth: cfg.SLIDER.width,
                getValue: () => {
                    const ms = this.settingsManager.getSpawnInterval(targetId, isEndlessMode);
                    // 反向映射：值越大，间隔越短
                    return 1 - (ms - CONFIG.SPAWN.INTERVAL_MIN) / (CONFIG.SPAWN.INTERVAL_MAX - CONFIG.SPAWN.INTERVAL_MIN);
                },
                setValue: (v) => {
                    // 反向映射：滑块值越大，间隔越短
                    const ms = Math.round(CONFIG.SPAWN.INTERVAL_MAX - v * (CONFIG.SPAWN.INTERVAL_MAX - CONFIG.SPAWN.INTERVAL_MIN));
                    this.settingsManager.setSpawnInterval(targetId, ms, isEndlessMode);
                },
                formatValue: (v) => {
                    const ms = Math.round(CONFIG.SPAWN.INTERVAL_MAX - v * (CONFIG.SPAWN.INTERVAL_MAX - CONFIG.SPAWN.INTERVAL_MIN));
                    return (ms / 1000).toFixed(1) + 's';
                }
            });
            currentY += cfg.SPACING.row + 30;

            // 移动速度滑块
            this.sliders.push({
                id: 'speedMultiplier',
                label: '移动速度',
                x: contentX,
                y: currentY,
                width: contentWidth,
                trackX: contentX + contentWidth - cfg.SLIDER.width,
                trackWidth: cfg.SLIDER.width,
                getValue: () => {
                    const multiplier = this.settingsManager.getSpeedMultiplier(targetId, isEndlessMode);
                    // 0.5-2 映射到 0-1
                    return (multiplier - CONFIG.SPAWN.SPEED_MULTIPLIER_MIN) / (CONFIG.SPAWN.SPEED_MULTIPLIER_MAX - CONFIG.SPAWN.SPEED_MULTIPLIER_MIN);
                },
                setValue: (v) => {
                    const multiplier = CONFIG.SPAWN.SPEED_MULTIPLIER_MIN + v * (CONFIG.SPAWN.SPEED_MULTIPLIER_MAX - CONFIG.SPAWN.SPEED_MULTIPLIER_MIN);
                    this.settingsManager.setSpeedMultiplier(targetId, multiplier, isEndlessMode);
                },
                formatValue: (v) => {
                    const multiplier = CONFIG.SPAWN.SPEED_MULTIPLIER_MIN + v * (CONFIG.SPAWN.SPEED_MULTIPLIER_MAX - CONFIG.SPAWN.SPEED_MULTIPLIER_MIN);
                    return multiplier.toFixed(1) + 'x';
                }
            });
            currentY += cfg.SPACING.row + 30;

            // 最大实体数量滑块
            this.sliders.push({
                id: 'maxTargets',
                label: '实体数量',
                x: contentX,
                y: currentY,
                width: contentWidth,
                trackX: contentX + contentWidth - cfg.SLIDER.width,
                trackWidth: cfg.SLIDER.width,
                getValue: () => {
                    const count = this.settingsManager.getMaxTargets(targetId, isEndlessMode);
                    return (count - CONFIG.SPAWN.MAX_TARGETS_MIN) / (CONFIG.SPAWN.MAX_TARGETS_MAX - CONFIG.SPAWN.MAX_TARGETS_MIN);
                },
                setValue: (v) => {
                    const count = Math.round(CONFIG.SPAWN.MAX_TARGETS_MIN + v * (CONFIG.SPAWN.MAX_TARGETS_MAX - CONFIG.SPAWN.MAX_TARGETS_MIN));
                    this.settingsManager.setMaxTargets(targetId, count, isEndlessMode);
                },
                formatValue: (v) => {
                    return Math.round(CONFIG.SPAWN.MAX_TARGETS_MIN + v * (CONFIG.SPAWN.MAX_TARGETS_MAX - CONFIG.SPAWN.MAX_TARGETS_MIN)).toString();
                }
            });
            currentY += cfg.SPACING.row + 10;
        }

        currentY += cfg.SPACING.group;

        // 统计区域 Y 位置
        this.statsY = currentY + 30;

        // 按钮区域布局（退出和返回按钮在同一行）
        const buttonWidth = 120;
        const buttonHeight = cfg.BUTTON.height;
        const buttonSpacing = 15; // 按钮间距
        const buttonY = panelY + panelHeight - cfg.PANEL.padding - buttonHeight;

        // 计算两个按钮并排时的布局
        const totalButtonWidth = buttonWidth * 2 + buttonSpacing;
        const buttonsStartX = panelX + (panelWidth - totalButtonWidth) / 2;

        // 退出游戏按钮（左侧）
        this.exitButton = {
            x: buttonsStartX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };

        // 返回按钮（右侧，或当不在游戏中时居中）
        this.backButton = {
            x: buttonsStartX + buttonWidth + buttonSpacing,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        };

        // 如果不在游戏中，返回按钮居中显示
        if (!this.isInGame) {
            this.backButton.x = panelX + (panelWidth - buttonWidth) / 2;
        }
    }

    /**
     * 渲染设置界面
     */
    render() {
        const ctx = this.ctx;
        const cfg = SETTINGS_CONFIG;
        // 使用逻辑尺寸
        const logicalWidth = this.canvas.width / this.dpr;
        const logicalHeight = this.canvas.height / this.dpr;

        // 保存状态
        ctx.save();

        // 1. 全屏遮罩
        ctx.fillStyle = cfg.COLORS.overlay;
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);

        // 2. 毛玻璃面板
        this.renderGlassPanel();

        // 3. 标题
        this.renderTitle();

        // 4. 音频分类
        this.renderSectionTitle(this.panel.y + cfg.PANEL.padding + 50, '音频');

        // 5. 滑块
        for (const slider of this.sliders) {
            this.renderSlider(slider);
        }

        // 6. 静音开关
        const muteToggle = this.toggles.find(t => t.id === 'muted');
        if (muteToggle) {
            this.renderToggle(muteToggle);
        }

        // 7. 游戏分类
        const gameY = muteToggle.y + cfg.SPACING.group + 10;
        this.renderSectionTitle(gameY, '游戏');

        // 8. 震动开关
        const vibrationToggle = this.toggles.find(t => t.id === 'vibration');
        if (vibrationToggle) {
            this.renderToggle(vibrationToggle);
        }

        // 9. 统计分类
        this.renderSectionTitle(this.statsY - 30, '统计');
        this.renderStats();

        // 10. 退出游戏按钮（仅在游戏中显示）
        if (this.isInGame) {
            this.renderExitButton();
        }

        // 11. 返回按钮
        this.renderBackButton();

        // 恢复状态
        ctx.restore();
    }

    /**
     * 渲染毛玻璃面板
     */
    renderGlassPanel() {
        const ctx = this.ctx;
        const cfg = SETTINGS_CONFIG;
        const { x, y, width, height } = this.panel;

        // 面板背景
        ctx.fillStyle = cfg.COLORS.panelBg;
        this.roundRect(x, y, width, height, cfg.PANEL.borderRadius);
        ctx.fill();

        // 边框高光
        ctx.strokeStyle = cfg.COLORS.panelBorder;
        ctx.lineWidth = 1.5;
        this.roundRect(x, y, width, height, cfg.PANEL.borderRadius);
        ctx.stroke();

        // 内部区域
        const innerPadding = 8;
        ctx.fillStyle = cfg.COLORS.innerBg;
        this.roundRect(
            x + innerPadding,
            y + innerPadding,
            width - innerPadding * 2,
            height - innerPadding * 2,
            cfg.PANEL.borderRadius - 4
        );
        ctx.fill();
    }

    /**
     * 渲染标题
     */
    renderTitle() {
        const ctx = this.ctx;
        const cfg = SETTINGS_CONFIG;
        const titleX = this.panel.x + this.panel.width / 2;
        const titleY = this.panel.y + cfg.PANEL.padding + 20;

        // 使用 emoji 图片渲染设置图标
        if (this.emojiManager) {
            this.emojiManager.draw(ctx, 'settings', titleX - 50, titleY, 22);
            ctx.fillStyle = cfg.COLORS.title;
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(' 设置', titleX + 5, titleY);
        } else {
            ctx.fillStyle = cfg.COLORS.title;
            ctx.font = 'bold 22px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚙️ 设置', titleX, titleY);
        }
    }

    /**
     * 渲染分类标题
     */
    renderSectionTitle(y, text) {
        const ctx = this.ctx;
        const cfg = SETTINGS_CONFIG;

        ctx.fillStyle = cfg.COLORS.text;
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, this.panel.x + cfg.PANEL.padding, y);
    }

    /**
     * 渲染滑块
     */
    renderSlider(slider) {
        const ctx = this.ctx;
        const cfg = SETTINGS_CONFIG;
        const value = slider.getValue();

        // 标签
        ctx.fillStyle = cfg.COLORS.text;
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(slider.label, slider.x, slider.y);

        // 值显示（支持自定义格式化）
        ctx.fillStyle = cfg.COLORS.accent;
        ctx.textAlign = 'right';
        const displayValue = slider.formatValue ? slider.formatValue(value) : Math.round(value * 100) + '%';
        ctx.fillText(displayValue, slider.trackX - 10, slider.y);

        // 滑块轨道
        const trackY = slider.y - cfg.SLIDER.height / 2;
        ctx.fillStyle = cfg.COLORS.sliderTrack;
        this.roundRect(slider.trackX, trackY, slider.trackWidth, cfg.SLIDER.height, cfg.SLIDER.height / 2);
        ctx.fill();

        // 滑块填充
        const fillWidth = slider.trackWidth * value;
        if (fillWidth > 0) {
            ctx.fillStyle = cfg.COLORS.sliderFill;
            this.roundRect(slider.trackX, trackY, fillWidth, cfg.SLIDER.height, cfg.SLIDER.height / 2);
            ctx.fill();
        }

        // 滑块把手
        const thumbX = slider.trackX + slider.trackWidth * value;
        const thumbY = slider.y;

        // 把手阴影
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = cfg.COLORS.sliderThumb;
        ctx.beginPath();
        ctx.arc(thumbX, thumbY, cfg.SLIDER.thumbRadius, 0, Math.PI * 2);
        ctx.fill();

        // 清除阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        // 把手边框
        ctx.strokeStyle = cfg.COLORS.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(thumbX, thumbY, cfg.SLIDER.thumbRadius, 0, Math.PI * 2);
        ctx.stroke();
    }

    /**
     * 渲染开关
     */
    renderToggle(toggle) {
        const ctx = this.ctx;
        const cfg = SETTINGS_CONFIG;
        const value = toggle.getValue();

        // 标签
        ctx.fillStyle = cfg.COLORS.text;
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(toggle.label, toggle.x, toggle.y);

        // 开关背景
        const toggleX = toggle.toggleX;
        const toggleY = toggle.y - cfg.TOGGLE.height / 2;
        const radius = cfg.TOGGLE.height / 2;

        ctx.fillStyle = value ? cfg.COLORS.toggleOn : cfg.COLORS.toggleOff;
        this.roundRect(toggleX, toggleY, cfg.TOGGLE.width, cfg.TOGGLE.height, radius);
        ctx.fill();

        // 开关滑块
        const thumbRadius = radius - 3;
        const thumbX = value
            ? toggleX + cfg.TOGGLE.width - radius
            : toggleX + radius;
        const thumbY = toggle.y;

        // 滑块阴影
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = value ? -1 : 1;

        ctx.fillStyle = cfg.COLORS.toggleThumb;
        ctx.beginPath();
        ctx.arc(thumbX, thumbY, thumbRadius, 0, Math.PI * 2);
        ctx.fill();

        // 清除阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
    }

    /**
     * 渲染统计信息
     */
    renderStats() {
        const ctx = this.ctx;
        const cfg = SETTINGS_CONFIG;

        // 根据游戏状态决定显示哪个最高分
        let highScore = 0;
        let highScoreLabel = '最高分';

        if (this.isInGame && this.currentGameInfo) {
            // 在游戏中：显示当前关卡类型的最高分
            if (this.currentGameInfo.isEndlessMode) {
                const endlessStats = this.settingsManager.getEndlessStats();
                highScore = endlessStats.highScore;
                highScoreLabel = '无尽最高';
            } else if (this.currentGameInfo.targetId) {
                highScore = this.settingsManager.getTargetHighScore(this.currentGameInfo.targetId);
                highScoreLabel = this.currentGameInfo.targetName ?
                    `${this.currentGameInfo.targetName}最高` : '关卡最高';
            }
        } else {
            // 不在游戏中：显示全局最高分（从目标分数和无尽模式分数中选择最高）
            highScore = this.getGlobalHighScore();
            highScoreLabel = '最高分';
        }

        const totalGames = this.settingsManager.getTotalGames();

        ctx.fillStyle = cfg.COLORS.text;
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const statsX = this.panel.x + cfg.PANEL.padding;

        // 最高分
        ctx.fillText(highScoreLabel + ': ', statsX, this.statsY);
        ctx.fillStyle = cfg.COLORS.accent;
        const labelWidth = ctx.measureText(highScoreLabel + ': ').width;
        ctx.fillText(highScore.toString(), statsX + labelWidth, this.statsY);

        // 分隔符
        ctx.fillStyle = cfg.COLORS.text;
        const separatorX = statsX + labelWidth + ctx.measureText(highScore.toString()).width + 15;
        ctx.fillText('|', separatorX, this.statsY);

        // 游戏次数
        ctx.fillText('游戏次数: ', separatorX + 15, this.statsY);
        ctx.fillStyle = cfg.COLORS.accent;
        ctx.fillText(totalGames.toString(), separatorX + 85, this.statsY);
    }

    /**
     * 获取全局最高分（从所有目标和无尽模式中选择最高）
     */
    getGlobalHighScore() {
        let maxScore = 0;

        // 获取所有目标的最高分
        const targetScores = this.settingsManager.getAllTargetHighScores();
        for (const targetId in targetScores) {
            if (targetScores[targetId] > maxScore) {
                maxScore = targetScores[targetId];
            }
        }

        // 获取无尽模式最高分
        const endlessStats = this.settingsManager.getEndlessStats();
        if (endlessStats.highScore > maxScore) {
            maxScore = endlessStats.highScore;
        }

        return maxScore;
    }

    /**
     * 渲染返回按钮
     */
    renderBackButton() {
        const ctx = this.ctx;
        const cfg = SETTINGS_CONFIG;
        const btn = this.backButton;

        // 按钮背景
        ctx.fillStyle = cfg.COLORS.buttonBg;
        this.roundRect(btn.x, btn.y, btn.width, btn.height, cfg.BUTTON.borderRadius);
        ctx.fill();

        // 按钮边框
        ctx.strokeStyle = cfg.COLORS.panelBorder;
        ctx.lineWidth = 1;
        this.roundRect(btn.x, btn.y, btn.width, btn.height, cfg.BUTTON.borderRadius);
        ctx.stroke();

        // 按钮文字
        ctx.fillStyle = cfg.COLORS.title;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('返回', btn.x + btn.width / 2, btn.y + btn.height / 2);
    }

    /**
     * 渲染退出游戏按钮
     */
    renderExitButton() {
        const ctx = this.ctx;
        const cfg = SETTINGS_CONFIG;
        const btn = this.exitButton;
        const exitCfg = cfg.EXIT_BUTTON;

        // 按钮背景（红色）
        ctx.fillStyle = exitCfg.bgColor;
        this.roundRect(btn.x, btn.y, btn.width, btn.height, cfg.BUTTON.borderRadius);
        ctx.fill();

        // 按钮边框
        ctx.strokeStyle = exitCfg.borderColor;
        ctx.lineWidth = 1.5;
        this.roundRect(btn.x, btn.y, btn.width, btn.height, cfg.BUTTON.borderRadius);
        ctx.stroke();

        // 按钮文字（简化为"退出"以适应较小按钮）
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('退出', btn.x + btn.width / 2, btn.y + btn.height / 2);
    }

    /**
     * 绘制圆角矩形路径
     */
    roundRect(x, y, width, height, radius) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    /**
     * 处理触摸开始
     */
    handleTouchStart(pos) {
        const cfg = SETTINGS_CONFIG;

        // 检测滑块点击
        for (const slider of this.sliders) {
            const thumbX = slider.trackX + slider.trackWidth * slider.getValue();
            const thumbY = slider.y;

            // 检测是否点击在把手附近（扩大触摸区域）
            const touchRadius = cfg.SLIDER.thumbRadius + 15;
            const dx = pos.x - thumbX;
            const dy = pos.y - thumbY;

            if (dx * dx + dy * dy <= touchRadius * touchRadius) {
                this.activeSlider = slider;
                return true;
            }

            // 检测是否点击在轨道上
            if (pos.x >= slider.trackX &&
                pos.x <= slider.trackX + slider.trackWidth &&
                pos.y >= slider.y - 20 &&
                pos.y <= slider.y + 20) {
                this.activeSlider = slider;
                // 直接跳转到点击位置
                const newValue = (pos.x - slider.trackX) / slider.trackWidth;
                slider.setValue(Math.max(0, Math.min(1, newValue)));
                return true;
            }
        }

        return false;
    }

    /**
     * 处理触摸移动
     */
    handleTouchMove(pos) {
        if (!this.activeSlider) return;

        const slider = this.activeSlider;
        const newValue = (pos.x - slider.trackX) / slider.trackWidth;
        slider.setValue(Math.max(0, Math.min(1, newValue)));
    }

    /**
     * 处理触摸结束
     * @returns {{ shouldClose: boolean, shouldExit: boolean }} 是否应该关闭设置页面或退出游戏
     */
    handleTouchEnd(pos) {
        const cfg = SETTINGS_CONFIG;

        // 结束滑块拖动
        if (this.activeSlider) {
            this.activeSlider = null;
            // 播放音效反馈
            this.audioManager.playButtonClick();
        }

        // 检测开关点击
        for (const toggle of this.toggles) {
            const toggleX = toggle.toggleX;
            const toggleY = toggle.y - cfg.TOGGLE.height / 2;

            if (pos.x >= toggleX &&
                pos.x <= toggleX + cfg.TOGGLE.width &&
                pos.y >= toggleY &&
                pos.y <= toggleY + cfg.TOGGLE.height) {
                toggle.setValue(!toggle.getValue());
                this.audioManager.playButtonClick();
                // 如果是震动开关且刚开启，触发一次震动
                if (toggle.id === 'vibration' && toggle.getValue()) {
                    this.settingsManager.vibrate('light');
                }
                return { shouldClose: false, shouldExit: false };
            }
        }

        // 检测退出游戏按钮点击（仅在游戏中）
        if (this.isInGame && this.exitButton) {
            const exitBtn = this.exitButton;
            if (pos.x >= exitBtn.x &&
                pos.x <= exitBtn.x + exitBtn.width &&
                pos.y >= exitBtn.y &&
                pos.y <= exitBtn.y + exitBtn.height) {
                this.audioManager.playButtonClick();
                return { shouldClose: true, shouldExit: true };
            }
        }

        // 检测返回按钮点击
        const btn = this.backButton;
        if (pos.x >= btn.x &&
            pos.x <= btn.x + btn.width &&
            pos.y >= btn.y &&
            pos.y <= btn.y + btn.height) {
            this.audioManager.playButtonClick();
            return { shouldClose: true, shouldExit: false };
        }

        return { shouldClose: false, shouldExit: false };
    }

    /**
     * 检测点击是否在设置面板区域内
     */
    isInPanelArea(pos) {
        const { x, y, width, height } = this.panel;
        return pos.x >= x && pos.x <= x + width && pos.y >= y && pos.y <= y + height;
    }
}
