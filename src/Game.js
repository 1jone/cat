/**
 * Game - 游戏主类（核心协调器）
 * 负责协调各个模块，处理游戏主循环
 */

import { CONFIG, AUDIO_CONFIG } from './config';
import { InputManager } from './InputManager';
import { getAudioManager } from './AudioManager';
import { getSettingsManager } from './SettingsManager';
import { SettingsUI } from './SettingsUI';
import { SidebarRewardUI } from './SidebarRewardUI';

// 管理器
import { GameStateManager, GameState } from './managers/GameStateManager';
import { ResourceManager } from './managers/ResourceManager';
import { SpawnManager } from './managers/SpawnManager';
import { AdManager } from './managers/AdManager';
import { EmojiManager } from './managers/EmojiManager';
import { SidebarManager } from './managers/SidebarManager';

// 屏幕
import { SelectionScreen } from './screens/SelectionScreen';
import { StartScreen } from './screens/StartScreen';
import { GameOverScreen } from './screens/GameOverScreen';

// 渲染器
import { BackgroundRenderer } from './renderers/BackgroundRenderer';
import { HUDRenderer } from './renderers/HUDRenderer';
import { EffectsRenderer } from './renderers/EffectsRenderer';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Cannot get 2d context');
        this.ctx = ctx;

        // 目标列表
        this.targets = [];

        // 初始化管理器
        this.stateManager = new GameStateManager();
        this.resourceManager = new ResourceManager();
        this.emojiManager = new EmojiManager();

        // 初始化设置管理器（需要在 SpawnManager 之前）
        this.settingsManager = getSettingsManager();
        this.settingsManager.load();

        // 初始化 SpawnManager（传入设置管理器）
        this.spawnManager = new SpawnManager(this.settingsManager);

        // 预加载 emoji 精灵图
        this.emojiManager.preload();

        // 初始化屏幕
        this.startScreen = new StartScreen(canvas, ctx, this.emojiManager);
        this.gameOverScreen = new GameOverScreen(canvas, ctx, this.emojiManager);

        // 初始化渲染器
        this.bgRenderer = new BackgroundRenderer(canvas, ctx);
        this.hudRenderer = new HUDRenderer(canvas, ctx, this.emojiManager);
        this.effectsRenderer = new EffectsRenderer(canvas, ctx, this.emojiManager);

        // 初始化输入管理器
        this.inputManager = new InputManager(canvas);
        this.inputManager.onTouchStart = (pos) => this.handleTouchStart(pos);
        this.inputManager.onTouchMove = (pos) => this.handleTouchMove(pos);
        this.inputManager.onTouchEnd = (pos) => this.handleTouchEnd(pos);
        this.inputManager.onTouch = (pos) => this.handleTouch(pos);

        // 初始化音频管理器
        this.audioManager = getAudioManager();
        this.audioInitialized = false;

        // 初始化广告管理器
        this.adManager = new AdManager(this.settingsManager);

        // 初始化设置界面
        this.settingsUI = new SettingsUI(canvas, ctx, this.settingsManager, this.audioManager, this.emojiManager);

        // 初始化侧边栏管理器
        this.sidebarManager = new SidebarManager(this);

        // 初始化侧边栏奖励UI
        this.sidebarRewardUI = new SidebarRewardUI(canvas, ctx, this.sidebarManager, this.emojiManager);

        // 预加载资源
        this.resourceManager.preloadImages();

        // 初始化选择界面（需要在资源管理器之后，传入广告管理器和设置管理器）
        this.selectionScreen = new SelectionScreen(canvas, ctx, this.resourceManager, this.adManager, this.settingsManager, this.emojiManager);

        // 防止点击穿透
        this.skipNextTouchEnd = false;
        this.stateChangeTime = 0;

        // 游戏循环
        this.lastTime = 0;
        this.gameLoop = (currentTime) => {
            const deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;
            this.update(deltaTime);
            this.render();
            requestAnimationFrame(this.gameLoop);
        };

        // 调整大小并应用设置
        this.resize();
        this.applySettings();
    }

    /**
     * 初始化音频（需要在用户首次交互时调用）
     */
    initAudio() {
        if (this.audioInitialized) return;
        this.audioManager.init();
        this.audioInitialized = true;
        this.audioManager.playBGM('menu', { volume: AUDIO_CONFIG.BGM_VOLUME.menu });
    }

    /**
     * 应用已保存的设置
     */
    applySettings() {
        if (!this.settingsManager || !this.audioManager) return;

        const bgmVolume = this.settingsManager.getBGMVolume();
        const sfxVolume = this.settingsManager.getSFXVolume();
        this.audioManager.setBGMVolume(bgmVolume);
        this.audioManager.setSFXVolume(sfxVolume);

        if (this.settingsManager.isMuted()) {
            this.audioManager.mute();
        }
    }

    /**
     * 调整画布大小（支持高 DPI 设备）
     */
    resize() {
        const systemInfo = tt.getSystemInfoSync();
        const dpr = systemInfo.pixelRatio || 1;
        const width = systemInfo.windowWidth;
        const height = systemInfo.windowHeight;

        // 设置 Canvas 物理尺寸（高分辨率）
        this.canvas.width = Math.floor(width * dpr);
        this.canvas.height = Math.floor(height * dpr);

        // 缩放上下文以匹配逻辑坐标（使用 setTransform 避免累积）
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // 高质量图像渲染
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        // 存储逻辑尺寸供其他组件使用
        this.logicalWidth = width;
        this.logicalHeight = height;
        this.dpr = dpr;

        // 更新各组件（传递 dpr）
        this.bgRenderer.resize(dpr);
        this.hudRenderer.resize(dpr);
        this.effectsRenderer.setDpr(dpr);
        this.startScreen.setDpr(dpr);
        this.gameOverScreen.setDpr(dpr);
        this.selectionScreen.setDpr(dpr);

        if (this.settingsUI) {
            this.settingsUI.updateLayout(dpr);
        }

        if (this.sidebarRewardUI) {
            this.sidebarRewardUI.updateLayout(dpr);
        }
    }

    /**
     * 启动游戏循环
     */
    start() {
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }

    /**
     * 更新游戏逻辑
     * @param {number} dt - 时间增量（秒）
     */
    update(dt) {
        const state = this.stateManager.getState();

        // 设置界面状态：跳过游戏逻辑更新
        if (state === GameState.SETTINGS) {
            return;
        }

        // 开始界面：更新侧边栏奖励UI动画
        if (state === GameState.START) {
            if (this.sidebarRewardUI) {
                this.sidebarRewardUI.update(dt);
            }
            // 检查并显示待处理的奖励
            this.checkPendingSidebarReward();
            return;
        }

        // 选择界面的更新逻辑
        if (state === GameState.SELECT) {
            this.selectionScreen.update(dt);
            return;
        }

        if (state !== GameState.PLAYING) return;

        // 更新状态管理器
        const updateResult = this.stateManager.update(dt);

        // 处理倒计时音效
        if (updateResult.shouldPlayCountdown) {
            this.audioManager.playCountdown();
        }

        // 处理游戏结束
        if (updateResult.shouldEndGame) {
            this.endGame();
            return;
        }

        // 更新目标
        const touchPos = this.inputManager.currentTouchPosition;
        for (const target of this.targets) {
            // 检查受惊（在更新前检测触摸位置）
            target.checkStartle(touchPos);
            target.update(dt, this.logicalWidth, this.logicalHeight);
        }
        this.targets = this.targets.filter(t => t.isActive);

        // 生成新目标
        const newTarget = this.spawnManager.update(dt, {
            canvasWidth: this.logicalWidth,
            canvasHeight: this.logicalHeight,
            targets: this.targets,
            selectedTarget: this.stateManager.selectedTarget,
            isEndlessMode: this.stateManager.isEndlessMode,
            unlockedIndices: this.stateManager.unlockedTargetIndices,
            multipliers: this.stateManager.currentMultipliers
        });

        if (newTarget) {
            this.targets.push(newTarget);
        }
    }

    /**
     * 渲染游戏
     */
    render() {
        const state = this.stateManager.getState();

        // 渲染背景
        const currentConfig = this.stateManager.selectedTarget;
        const hasBackgroundImage = currentConfig && currentConfig.background && currentConfig.background.image;
        const backgroundImage = hasBackgroundImage
            ? this.resourceManager.getBackground(currentConfig.id)
            : null;
        const showGrass = currentConfig && currentConfig.background && currentConfig.background.showGrass !== false;

        this.bgRenderer.render(backgroundImage, showGrass);

        // 根据状态渲染不同界面
        switch (state) {
            case GameState.START:
                this.startScreen.render();
                // 渲染侧边栏入口按钮（在"点击开始"下方）
                if (this.sidebarRewardUI) {
                    const buttonY = this.logicalHeight / 2 + 160;
                    this.sidebarRewardUI.renderEntryButton(this.logicalWidth / 2, buttonY);
                    // 如果有弹窗，渲染弹窗
                    this.sidebarRewardUI.render();
                }
                break;

            case GameState.SELECT:
                this.selectionScreen.render();
                this.hudRenderer.renderMuteButton(this.audioManager && this.audioManager.isMuted);
                this.hudRenderer.renderSettingsButton();
                break;

            case GameState.PLAYING:
                // 渲染目标
                for (const target of this.targets) {
                    target.render(this.ctx);
                }
                // 渲染特效
                this.effectsRenderer.renderCatchEffect(this.stateManager.catchEffect);
                this.effectsRenderer.renderUnlockNotification(this.stateManager.unlockNotification);
                // 渲染 HUD
                this.hudRenderer.renderHUD({
                    score: this.stateManager.score,
                    timeLeft: this.stateManager.timeLeft,
                    isEndlessMode: this.stateManager.isEndlessMode,
                    gameTimer: this.stateManager.gameTimer
                });
                this.hudRenderer.renderMuteButton(this.audioManager && this.audioManager.isMuted);
                this.hudRenderer.renderSettingsButton();
                break;

            case GameState.OVER:
                // 渲染目标
                for (const target of this.targets) {
                    target.render(this.ctx);
                }
                // 渲染结束界面（传递额外的统计信息）
                this.gameOverScreen.render({
                    score: this.stateManager.score,
                    isEndlessMode: this._lastGameResult && this._lastGameResult.wasEndlessMode || false,
                    gameTimer: this.stateManager.gameTimer,
                    highScore: this._lastGameResult && this._lastGameResult.highScore || 0,
                    isNewRecord: this._lastGameResult && this._lastGameResult.isNewRecord || false
                });
                break;

            case GameState.SETTINGS:
                // 先渲染之前状态的背景
                if (this.stateManager.previousState === GameState.SELECT) {
                    this.selectionScreen.render();
                } else if (this.stateManager.previousState === GameState.PLAYING) {
                    for (const target of this.targets) {
                        target.render(this.ctx);
                    }
                    this.effectsRenderer.renderCatchEffect(this.stateManager.catchEffect);
                    this.effectsRenderer.renderUnlockNotification(this.stateManager.unlockNotification);
                    this.hudRenderer.renderHUD({
                        score: this.stateManager.score,
                        timeLeft: this.stateManager.timeLeft,
                        isEndlessMode: this.stateManager.isEndlessMode,
                        gameTimer: this.stateManager.gameTimer
                    });
                }
                // 再渲染设置界面
                if (this.settingsUI) {
                    this.settingsUI.render();
                }
                break;
        }
    }

    /**
     * 处理触摸（兼容旧代码）
     */
    handleTouch(pos) {
        const state = this.stateManager.getState();

        if (state === GameState.START) {
            this.stateManager.setState(GameState.SELECT);
            this.selectionScreen.reset();
        } else if (state === GameState.PLAYING) {
            this.tryToCatch(pos);
        } else if (state === GameState.OVER) {
            this.stateManager.setState(GameState.SELECT);
            this.selectionScreen.reset();
        }
    }

    /**
     * 处理触摸开始
     */
    handleTouchStart(pos) {
        // 初始化音频（用户首次交互）
        this.initAudio();

        const state = this.stateManager.getState();

        // 设置页面状态下，交给 settingsUI 处理
        if (state === GameState.SETTINGS) {
            if (this.settingsUI) {
                this.settingsUI.handleTouchStart(pos);
            }
            return;
        }

        // 检测静音按钮（所有状态下都可用，除了 start）
        if (state !== GameState.START && this.hudRenderer.checkMuteButtonClick(pos)) {
            const wasMuted = this.audioManager.isMuted;
            this.audioManager.toggleMute();
            if (wasMuted) {
                this.audioManager.playButtonClick();
            }
            return;
        }

        // 检测设置按钮（select 和 playing 状态可用）
        if ((state === GameState.SELECT || state === GameState.PLAYING) &&
            this.hudRenderer.checkSettingsButtonClick(pos)) {
            this.openSettings();
            return;
        }

        if (state === GameState.START) {
            // 检查侧边栏奖励UI点击（弹窗优先）
            if (this.sidebarRewardUI) {
                const clickResult = this.sidebarRewardUI.handleClick(pos.x, pos.y);
                if (clickResult) {
                    this.handleSidebarRewardClick(clickResult);
                    return;
                }
            }

            // 如果没有点击弹窗或按钮，则进入选择界面
            this.stateManager.setState(GameState.SELECT);
            this.selectionScreen.reset();
            this.skipNextTouchEnd = true;
            this.stateChangeTime = Date.now();
            this.audioManager.playBGM('menu', { volume: AUDIO_CONFIG.BGM_VOLUME.select });
            this.audioManager.playButtonClick();
            return;
        }

        if (state === GameState.SELECT) {
            this.selectionScreen.handleTouchStart(pos);
            return;
        }

        if (state === GameState.PLAYING) {
            this.tryToCatch(pos);
        }

        if (state === GameState.OVER) {
            this.stateManager.setState(GameState.SELECT);
            this.selectionScreen.reset();
            this.skipNextTouchEnd = true;
            this.stateChangeTime = Date.now();
            this.audioManager.playBGM('menu', { volume: AUDIO_CONFIG.BGM_VOLUME.select });
            this.audioManager.playButtonClick();
        }
    }

    /**
     * 处理触摸移动
     */
    handleTouchMove(pos) {
        const state = this.stateManager.getState();

        if (state === GameState.SETTINGS) {
            if (this.settingsUI) {
                this.settingsUI.handleTouchMove(pos);
            }
            return;
        }

        if (state === GameState.SELECT) {
            this.selectionScreen.handleTouchMove(pos);
        }
    }

    /**
     * 处理触摸结束
     */
    handleTouchEnd(pos) {
        const state = this.stateManager.getState();

        // 设置页面状态下，交给 settingsUI 处理
        if (state === GameState.SETTINGS) {
            if (this.settingsUI) {
                const result = this.settingsUI.handleTouchEnd(pos);
                if (result && result.shouldClose) {
                    if (result.shouldExit) {
                        this.exitToSelect();
                    } else {
                        this.closeSettings();
                    }
                }
            }
            return;
        }

        if (state === GameState.SELECT) {
            // 防止点击穿透
            if (this.stateChangeTime && Date.now() - this.stateChangeTime < 300) {
                this.skipNextTouchEnd = false;
                return;
            }

            const selectedConfig = this.selectionScreen.handleTouchEnd(pos);
            if (selectedConfig) {
                if (selectedConfig.isEndless) {
                    this.startEndlessMode();
                } else {
                    this.startGame(selectedConfig);
                }
            }
        }
    }

    /**
     * 尝试抓取目标
     */
    tryToCatch(pos) {
        for (const target of this.targets) {
            if (!target.isActive) continue;

            const distance = pos.distanceTo(target.position);
            if (distance < target.radius + 25) {
                target.isActive = false;
                this.stateManager.addScore(target.points);

                // 播放得分音效
                this.audioManager.playCatch(target.points);

                // 震动反馈
                if (tt && this.settingsManager.isVibrationEnabled()) {
                    tt.vibrateShort();
                }

                // 检查是否解锁新目标
                const unlockedTarget = this.stateManager.checkUnlock();
                if (unlockedTarget) {
                    this.audioManager.playUnlock();
                }

                // 设置抓取特效
                this.stateManager.setCatchEffect(target.position.x, target.position.y, target.points);
                return;
            }
        }
    }

    /**
     * 开始游戏（计时模式）
     * @param {Object} targetConfig - 目标配置
     * @param {boolean} skipAdCheck - 是否跳过广告检查（广告后调用时为true）
     */
    async startGame(targetConfig, skipAdCheck = false) {
        // 增加游戏次数统计（用于广告概率计算）
        this.settingsManager.incrementPlayCount();
        this.adManager.incrementConsecutivePlays();

        // 检查是否应该触发选择广告
        if (!skipAdCheck && this.adManager.shouldTriggerSelectionAd(targetConfig)) {
            console.log('[Game] 触发选择广告');
            const adShown = await this.adManager.showInterstitialAd('selection_' + targetConfig.id);
            if (adShown) {
                this.adManager.recordAdShown(targetConfig.id);
            }
            // 广告结束后继续开始游戏
        }

        this.stateManager.startGame(targetConfig, false);
        this.targets = [];
        this.spawnManager.reset();

        // 播放游戏开始音效
        this.audioManager.playGameStart();
        this.audioManager.playBGM('game', { volume: AUDIO_CONFIG.BGM_VOLUME.game });

        // 生成初始目标
        this.targets = this.spawnManager.spawnInitialTargets({
            canvasWidth: this.logicalWidth,
            canvasHeight: this.logicalHeight,
            selectedTarget: targetConfig,
            isEndlessMode: false,
            unlockedIndices: [],
            multipliers: { speed: 1, radius: 1, points: 1 }
        });
    }

    /**
     * 开始无尽模式
     */
    async startEndlessMode() {
        // 增加游戏次数统计
        this.settingsManager.incrementPlayCount();
        this.adManager.incrementConsecutivePlays();

        // 检查是否应该触发无尽模式入口广告
        if (this.adManager.shouldTriggerEndlessAd('entry')) {
            console.log('[Game] 触发无尽模式入口广告');
            const adShown = await this.adManager.showInterstitialAd('endless_entry');
            if (adShown) {
                this.adManager.recordAdShown();
            }
        }

        this.stateManager.startEndlessMode();
        // 传递 AdManager 给 GameStateManager 用于解锁时的广告触发
        this.stateManager.setAdManager(this.adManager);

        this.targets = [];
        this.spawnManager.reset();

        // 播放模式选择音效
        this.audioManager.playModeSelect();
        this.audioManager.playGameStart();
        this.audioManager.playBGM('menu', { volume: AUDIO_CONFIG.BGM_VOLUME.endless });

        // 生成初始目标
        this.targets = this.spawnManager.spawnInitialTargets({
            canvasWidth: this.logicalWidth,
            canvasHeight: this.logicalHeight,
            selectedTarget: this.stateManager.selectedTarget,
            isEndlessMode: true,
            unlockedIndices: this.stateManager.unlockedTargetIndices,
            multipliers: this.stateManager.currentMultipliers
        });
    }

    /**
     * 结束游戏
     */
    async endGame() {
        // 保存当前模式和分数信息（在 endGame 之前保存）
        const wasEndlessMode = this.stateManager.isEndlessMode;
        const finalScore = this.stateManager.score;
        const gameTimer = this.stateManager.gameTimer;
        const targetId = this.stateManager.getCurrentTargetId();

        this.stateManager.endGame();

        // 播放游戏结束音效
        this.audioManager.stopBGM(true);
        this.audioManager.playGameOver();

        // 更新统计数据（根据模式分别保存）
        let isNewRecord = false;
        if (this.settingsManager) {
            if (wasEndlessMode) {
                // 无尽模式：保存无尽模式专属统计
                isNewRecord = this.settingsManager.updateEndlessStats(finalScore, gameTimer);
            } else {
                // 计时模式：保存到对应目标的最高分
                isNewRecord = this.settingsManager.updateTargetHighScore(targetId, finalScore);
            }
            this.settingsManager.incrementGames();
        }

        // 保存是否破纪录状态（供渲染使用）
        this._lastGameResult = {
            isNewRecord,
            wasEndlessMode,
            targetId,
            highScore: wasEndlessMode
                ? this.settingsManager.getEndlessStats().highScore
                : this.settingsManager.getTargetHighScore(targetId)
        };

        // 检查是否应该触发游戏结束广告（无尽模式且分数达到要求）
        if (wasEndlessMode &&
            this.adManager.shouldTriggerEndlessAd('gameOver', finalScore)) {
            console.log('[Game] 触发游戏结束广告');
            const adShown = await this.adManager.showInterstitialAd('endless_game_over');
            if (adShown) {
                this.adManager.recordAdShown();
            }
        }

        // 重置无尽模式标志
        this.stateManager.isEndlessMode = false;
        this.stateManager.unlockedTargetIndices = [];
    }

    /**
     * 打开设置页面
     */
    openSettings() {
        this.stateManager.enterSettings();
        this.audioManager.playButtonClick();

        if (this.settingsUI) {
            const isInGame = (this.stateManager.previousState === GameState.PLAYING);
            this.settingsUI.isInGame = isInGame;

            // 传递当前游戏状态信息（用于显示对应的最高分）
            if (isInGame) {
                this.settingsUI.currentGameInfo = {
                    isEndlessMode: this.stateManager.isEndlessMode,
                    targetId: this.stateManager.getCurrentTargetId(),
                    targetName: this.stateManager.selectedTarget && this.stateManager.selectedTarget.name || null
                };
            } else {
                this.settingsUI.currentGameInfo = null;
            }

            this.settingsUI.updateLayout(this.dpr);
        }
    }

    /**
     * 关闭设置页面
     */
    closeSettings() {
        this.stateManager.exitSettings();
    }

    /**
     * 退出游戏回到选择界面
     */
    exitToSelect() {
        // 如果正在游戏中，先保存当前分数
        if (this.stateManager.previousState === GameState.PLAYING) {
            this.saveCurrentGameScore();
        }

        this.stateManager.resetToSelect();
        this.targets = [];
        this.selectionScreen.reset();

        // 切换回菜单 BGM
        this.audioManager.playBGM('menu', { volume: AUDIO_CONFIG.BGM_VOLUME.select });
    }

    /**
     * 保存当前游戏分数（用于中途退出时）
     */
    saveCurrentGameScore() {
        if (!this.settingsManager) return;

        const score = this.stateManager.score;
        const gameTimer = this.stateManager.gameTimer;
        const isEndlessMode = this.stateManager.isEndlessMode;
        const targetId = this.stateManager.getCurrentTargetId();

        if (score <= 0) return; // 没有分数不需要保存

        if (isEndlessMode) {
            // 无尽模式：保存无尽模式专属统计
            this.settingsManager.updateEndlessStats(score, gameTimer);
            console.log(`[Game] 无尽模式退出，保存分数: ${score}, 时长: ${Math.floor(gameTimer / 1000)}秒`);
        } else if (targetId) {
            // 计时模式：保存到对应目标的最高分
            this.settingsManager.updateTargetHighScore(targetId, score);
            console.log(`[Game] 计时模式退出，保存分数: ${score}, 目标: ${targetId}`);
        }
    }

    /**
     * 处理侧边栏奖励UI点击
     * @param {string} clickResult - 点击结果
     */
    handleSidebarRewardClick(clickResult) {
        this.audioManager.playButtonClick();

        switch (clickResult) {
            case 'entry':
                // 如果当前会话是从侧边栏进入的
                if (this.sidebarManager.isCurrentSessionFromSidebar()) {
                    // 检查是否有待处理奖励（应该已经自动检测并设置）
                    this.checkPendingSidebarReward();
                    // 不再进行跳转操作，避免无限循环
                    return;
                }

                // 非侧边栏进入的情况，执行正常引导/跳转流程
                if (this.sidebarManager.shouldShowGuide()) {
                    // 首次显示引导弹窗
                    this.sidebarRewardUI.showGuide();
                } else {
                    // 直接跳转到侧边栏
                    this.sidebarManager.navigateToSidebar();
                }
                break;

            case 'guide-confirm':
                // 确认引导，跳转到侧边栏
                this.sidebarRewardUI.hideGuide();
                this.sidebarManager.markGuideShown();
                this.sidebarManager.navigateToSidebar();
                break;

            case 'close':
                // 关闭引导弹窗
                this.sidebarRewardUI.hideGuide();
                this.sidebarManager.markGuideShown();
                break;

            case 'reward-confirm':
                // 确认奖励，进入游戏体验
                const reward = this.sidebarRewardUI.currentReward;
                this.sidebarRewardUI.hideReward();
                if (reward) {
                    // 跳转到选择界面并选中奖励关卡
                    this.stateManager.setState(GameState.SELECT);
                    this.selectionScreen.reset();
                    this.selectionScreen.selectTargetById(reward.targetId);
                    this.audioManager.playBGM('menu', { volume: AUDIO_CONFIG.BGM_VOLUME.select });
                }
                break;

            case 'popup-background':
                // 点击弹窗背景，不做任何操作
                break;
        }
    }

    /**
     * 检查并显示待处理的侧边栏奖励
     */
    checkPendingSidebarReward() {
        if (!this.sidebarManager || !this.sidebarRewardUI) return;

        // 如果已经在显示弹窗，跳过
        if (this.sidebarRewardUI.isShowingPopup()) return;

        // 检查是否有待处理的奖励
        if (this.sidebarManager.hasPendingReward()) {
            const reward = this.sidebarManager.consumePendingReward();
            if (reward) {
                console.log('[Game] 显示侧边栏奖励弹窗:', reward);
                this.sidebarRewardUI.showReward(reward);
                this.audioManager.playUnlock();
            }
        }
    }
}
