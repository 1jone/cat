/**
 * Game - 游戏主类（核心协调器）
 * 负责协调各个模块，处理游戏主循环
 */

import { CONFIG, AUDIO_CONFIG, TARGET_TYPES, STAMINA_CONFIG, CHECKIN_CONFIG, RANK_CONFIG, FEATURE_FLAGS } from './config';
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

// 实体渲染器
import { MouseRenderer } from './entities/MouseRenderer';
import { ButterflyRenderer } from './entities/ButterflyRenderer';
import { FishRenderer } from './entities/FishRenderer';
import { YarnRenderer } from './entities/YarnRenderer';
import { MultiLineRenderer } from './entities/MultiLineRenderer';
import { StaticLineRenderer } from './entities/StaticLineRenderer';
import { BirdRenderer } from './entities/BirdRenderer';
import { LadybugRenderer } from './entities/LadybugRenderer';
import { MosquitoRenderer } from './entities/MosquitoRenderer';
import { JellyfishRenderer } from './entities/JellyfishRenderer';
import { BouncyBallRenderer } from './entities/BouncyBallRenderer';
import { BubbleFishRenderer } from './entities/BubbleFishRenderer';

import { StaminaManager } from './managers/StaminaManager';
import { ShortcutManager } from './managers/ShortcutManager';
import { ChatGroupManager } from './managers/ChatGroupManager';
import { RankManager } from './managers/RankManager';
import { CoinManager } from './managers/CoinManager';

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

        // // 初始化 SpawnManager（传入设置管理器）
        // this.spawnManager = new SpawnManager(this.settingsManager);

        // 预加载 emoji 精灵图
        this.emojiManager.preload();

        // 初始化首帧必需的屏幕
        this.startScreen = new StartScreen(canvas, ctx, this.emojiManager);

        // 初始化首帧必需的渲染器
        this.bgRenderer = new BackgroundRenderer(canvas, ctx);
        this.hudRenderer = new HUDRenderer(canvas, ctx, this.emojiManager);

        // 初始化输入管理器
        this.inputManager = new InputManager(canvas);
        this.inputManager.onTouchStart = (pos) => this.handleTouchStart(pos);
        this.inputManager.onTouchMove = (pos) => this.handleTouchMove(pos);
        this.inputManager.onTouchEnd = (pos) => this.handleTouchEnd(pos);
        this.inputManager.onTouch = (pos) => this.handleTouch(pos);

        // 初始化音频管理器
        this.audioManager = getAudioManager();
        this.audioInitialized = false;

        // 防止点击穿透
        this.skipNextTouchEnd = false;
        this.stateChangeTime = 0;

        // 延迟初始化标记
        this._deferredInitialized = false;

        // 游戏循环
        this.lastTime = 0;
        this.lastFrameErrorTime = 0;
        this.gameLoop = (currentTime) => {
            // 首帧时执行延迟初始化（在渲染前同步完成）
            if (!this._deferredInitialized) {
                this._deferredInitialized = true;
                this.initDeferred();
            }
            // 性能测试、切后台或调试暂停后可能出现超大 dt，限制单帧追赶量。
            const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
            this.lastTime = currentTime;
            try {
                this.update(deltaTime);
                this.render();
            } catch (error) {
                // 单帧异常不应永久终止 requestAnimationFrame 循环。
                const now = Date.now();
                if (now - this.lastFrameErrorTime > 1000) {
                    console.error('[Game] 帧循环异常:', error);
                    this.lastFrameErrorTime = now;
                }
            } finally {
                requestAnimationFrame(this.gameLoop);
            }
        };

        // 调整大小并应用设置
        this.resize();
        this.applySettings();

        // 🔥 注册抖音原生触摸事件（必须在第一帧直接调用 tt.joinGroup）
        if (typeof tt !== 'undefined' && tt.onTouchStart) {
            this.registerNativeTouchHandler();
        }
    }

    /**
     * 延迟初始化 — 首帧必需的初始化完成后，在第一帧 gameLoop 中同步调用。
     * 包含广告 SDK、资源预加载、实体渲染器、非首屏 UI 等重量级操作。
     */
    initDeferred() {
        const canvas = this.canvas;
        const ctx = this.ctx;

        // 非首屏屏幕
        this.gameOverScreen = new GameOverScreen(canvas, ctx, this.emojiManager);

        // 特效渲染器（仅 PLAYING 状态使用）
        this.effectsRenderer = new EffectsRenderer(canvas, ctx, this.emojiManager);

        // 实体渲染器（仅 PLAYING 状态使用）
        this.mouseRenderer = new MouseRenderer();
        this.butterflyRenderer = new ButterflyRenderer();
        this.fishRenderer = new FishRenderer();
        this.yarnRenderer = new YarnRenderer(
            TARGET_TYPES.find(t => t.id === 'yarn') || {}
        );
        this.multilineRenderer = new MultiLineRenderer(
            (TARGET_TYPES.find(t => t.id === 'yarn') || {}).renderConfig || {}
        );
        this.staticLineRenderer = new StaticLineRenderer(
            (TARGET_TYPES.find(t => t.id === 'yarn') || {}).renderConfig || {}
        );
        this.birdRenderer = new BirdRenderer();
        this.ladybugRenderer = new LadybugRenderer();
        this.mosquitoRenderer = new MosquitoRenderer();
        this.jellyfishRenderer = new JellyfishRenderer();
        this.bouncyballRenderer = new BouncyBallRenderer();
        this.bubblefishRenderer = new BubbleFishRenderer();

        // SpawnManager（仅 PLAYING 状态使用）
        this.spawnManager = new SpawnManager(this.settingsManager, this.audioManager, this.mouseRenderer, this.butterflyRenderer, this.fishRenderer, this.yarnRenderer, this.multilineRenderer, this.birdRenderer, this.ladybugRenderer, this.mosquitoRenderer, this.bubblefishRenderer, this.bouncyballRenderer, this.jellyfishRenderer);

        // 广告管理器（Banner 在 SELECT 界面才可见）
        this.adManager = new AdManager(this.settingsManager);
        this.adManager.initBannerAd();
        this.adManager.createGameRecommendation();

        // 体力管理器（必须在 adManager 之后）
        this.staminaManager = new StaminaManager(this.settingsManager);
        this.staminaManager.adManager = this.adManager;
        this.showStaminaDialog = false;

        // 群聊管理器
        this.chatGroupManager = new ChatGroupManager(this.settingsManager);

        // 金币管理器
        this.coinManager = new CoinManager(this.settingsManager);

        // 排行榜管理器（异步登录）
        if (FEATURE_FLAGS.friendRank) {
            this.rankManager = new RankManager(this.settingsManager);
            this.rankManager.login().then(code => {
                if (code) console.log('[Game] 排行榜预登录成功');
            });
        } else {
            this.rankManager = null;
        }

        // 快捷方式管理器
        this.shortcutManager = new ShortcutManager(this.settingsManager, this.staminaManager);
        this.showShortcutDialog = false;
        this.shortcutDialogButtons = null;

        // 签到系统
        this.showCheckinDialog = false;
        this.checkinDialogButtons = null;
        this.isCheckinAdPlaying = false;
        this.initCheckinData();

        // 试玩模式标记
        this.isTrialMode = false;

        // 设置界面
        this.settingsUI = new SettingsUI(canvas, ctx, this.settingsManager, this.audioManager, this.emojiManager);

        // 侧边栏管理器 + UI
        this.sidebarManager = new SidebarManager(this);
        this.sidebarRewardUI = new SidebarRewardUI(canvas, ctx, this.sidebarManager, this.emojiManager);

        // 预加载目标资源（异步，不阻塞渲染）
        this.resourceManager.preloadImages();

        // 选择界面（需要资源管理器、广告管理器、渲染器等）
        this.selectionScreen = new SelectionScreen(canvas, ctx, this.resourceManager, this.adManager, this.settingsManager, this.emojiManager, this.butterflyRenderer, this.mouseRenderer, this.fishRenderer, this.yarnRenderer, this.multilineRenderer, this.birdRenderer, this.ladybugRenderer, this.staticLineRenderer, this.staminaManager, this.mosquitoRenderer, this.jellyfishRenderer, this.bouncyballRenderer, this.bubblefishRenderer, this.coinManager);

        // 延迟初始化后更新 DPR 相关组件
        this._applyDeferredResize();
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
     * 🔥 注册抖音原生触摸事件处理器
     * 用于 tt.joinGroup 等必须在用户手势同步回调中调用的 API
     * 完全绕过 canvas 和 tmg-core 框架
     */
    registerNativeTouchHandler() {
        if (typeof tt === 'undefined' || !tt.onTouchStart) {
            console.log('[Game] 非抖音环境或 tt.onTouchStart 不可用');
            return;
        }

        console.log('[Game] 🔥 注册 tt.onTouchStart 全局监听器');

        tt.onTouchStart((res) => {
            const touch = res.touches[0];
            if (!touch) return;

            const touchX = touch.clientX;
            const touchY = touch.clientY;

            console.log('[tt.onTouchStart] 触发:', { touchX, touchY });

            // 🔥 关键：只在 SELECT 状态下响应（功能按钮在选择页面）
            const currentState = this.stateManager.getState();
            if (currentState !== GameState.SELECT || !this.selectionScreen) {
                return;
            }

            // 获取按钮区域（从 SelectionScreen）
            const groupButtonArea = this.selectionScreen.getGroupButtonArea();
            const checkinButtonArea = this.selectionScreen.getCheckinButtonArea();
            const rankButtonArea = this.selectionScreen.getRankButtonArea();

            // 🔥 关键：使用屏幕坐标（不除以 DPR）
            // Canvas 满屏，所以 clientX/Y 直接对应绘制坐标

            // 检测加群按钮点击
            if (groupButtonArea &&
                touchX >= groupButtonArea.left && touchX <= groupButtonArea.right &&
                touchY >= groupButtonArea.top && touchY <= groupButtonArea.bottom) {

                console.log('[tt.onTouchStart] 🔥 检测到加群按钮点击');

                // ✅ 在第一帧直接调用，不做任何逻辑判断
                tt.joinGroup({
                    groupid: '4F9U1aXLC8g0ay7zMNpoEKD51WeGOv6AM5F2rg+kK1ERavH81nDifmIujgn96zUF4et6ZbFrLr/Vbf4GfcPnJw==',
                    success: () => {
                        console.log('[tt.onTouchStart] ✅ 成功加入官方群');
                    },
                    fail: (err) => {
                        console.error('[tt.onTouchStart] ❌ 加入官方群失败:', err);
                    }
                });
                return;
            }

            // 检测签到按钮点击
            if (checkinButtonArea &&
                touchX >= checkinButtonArea.left && touchX <= checkinButtonArea.right &&
                touchY >= checkinButtonArea.top && touchY <= checkinButtonArea.bottom) {

                console.log('[tt.onTouchStart] 🔥 检测到签到按钮点击');
                this.handleCheckin();
                return;
            }

            // 检测排行榜按钮点击
            if (rankButtonArea &&
                touchX >= rankButtonArea.left && touchX <= rankButtonArea.right &&
                touchY >= rankButtonArea.top && touchY <= rankButtonArea.bottom) {

                console.log('[tt.onTouchStart] 检测到排行榜按钮点击');
                if (this.rankManager) {
                    this.rankManager.openRankList(false);
                }
                return;
            }
        });
    }

    /**
     * 调整画布大小（支持高 DPI 设备）
     */
    resize() {
        const systemInfo = tt.getSystemInfoSync();
        // Canvas 内存和填充成本随 DPR 平方增长；小游戏场景 2x 已足够清晰。
        const dpr = Math.min(systemInfo.pixelRatio || 1, 2);
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

        // 更新首帧必需组件
        this.bgRenderer.resize(dpr);
        this.hudRenderer.resize(dpr);
        this.startScreen.setDpr(dpr);

        // 如果延迟初始化已完成，更新延迟组件
        if (this._deferredInitialized) {
            this._applyDeferredResize();
        }
    }

    /**
     * 更新延迟初始化组件的 DPR（在 resize 和 initDeferred 中调用）
     */
    _applyDeferredResize() {
        const dpr = this.dpr;
        if (this.effectsRenderer) this.effectsRenderer.setDpr(dpr);
        if (this.gameOverScreen) this.gameOverScreen.setDpr(dpr);
        if (this.selectionScreen) this.selectionScreen.setDpr(dpr);
        if (this.settingsUI) this.settingsUI.updateLayout(dpr);
        if (this.sidebarRewardUI) this.sidebarRewardUI.updateLayout(dpr);
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
        const currentTime = performance.now();
        const state = this.stateManager.getState();

        // 更新草地动画（所有状态下都更新）
        this.bgRenderer.update(dt, currentTime);

        // 更新体力恢复（所有状态下都更新）
        if (this.staminaManager) this.staminaManager.update(dt);

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
            if (this.selectionScreen) this.selectionScreen.update(dt);
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
        const currentTime = performance.now();
        const state = this.stateManager.getState();

        // === 背景渲染逻辑改进 ===
        let backgroundImage = null;
        let showGrass = true;
        let targetId = null;

        if (state === GameState.SELECT || state === GameState.START) {
            // SELECT/START 状态: 始终使用选择界面背景（纯色 + 草地）
            backgroundImage = null;
            showGrass = true;
            targetId = null;
        } else {
            // PLAYING/OVER/SETTINGS 状态: 使用游戏背景
            const currentConfig = this.stateManager.selectedTarget;
            const hasBackgroundImage = currentConfig && currentConfig.background && currentConfig.background.image;
            backgroundImage = hasBackgroundImage
                ? this.resourceManager.getBackground(currentConfig.id)
                : null;
            showGrass = currentConfig && currentConfig.background && currentConfig.background.showGrass !== false;
            targetId = currentConfig ? currentConfig.id : null;
        }

        this.bgRenderer.render(backgroundImage, showGrass, targetId, currentTime / 1000);  // 传递目标ID和时间（秒）

        // 根据状态渲染不同界面
        switch (state) {
            case GameState.START:
                this.startScreen.render();

                // 整体向上偏移，让布局更居中
                const offsetY = -50;

                // 渲染侧边栏入口按钮（在"点击开始"下方，增加间距）
                if (this.sidebarRewardUI) {
                    const buttonY = this.logicalHeight / 2 + 130 + offsetY;
                    this.sidebarRewardUI.renderEntryButton(this.logicalWidth / 2, buttonY);
                    // 如果有弹窗，渲染弹窗
                    this.sidebarRewardUI.render();
                }

                // 渲染健康游戏忠告（弹窗打开时不渲染，避免遮住弹窗）
                const isSidebarPopupOpen = this.sidebarRewardUI && (this.sidebarRewardUI.showingGuide || this.sidebarRewardUI.showingReward);
                if (!isSidebarPopupOpen) {
                const ctx = this.ctx;
                const healthAdviceY = this.logicalHeight / 2 + 180 + offsetY;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                // 标题 - 降低不透明度，更柔和
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.font = 'bold 15px Arial';
                ctx.fillText('《健康游戏忠告》', this.logicalWidth / 2, healthAdviceY);

                // 内容 - 降低不透明度，缩小字体
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.font = '13px Arial';
                const line1 = '抵制不良游戏，拒绝盗版游戏。';
                const line2 = '注意自我保护，谨防受骗上当。';
                const line3 = '适度游戏益脑，沉迷游戏伤身。';
                const line4 = '合理安排时间，享受健康生活。';

                const lineHeight = 19;
                const contentStartY = healthAdviceY + 22;
                ctx.fillText(line1, this.logicalWidth / 2, contentStartY);
                ctx.fillText(line2, this.logicalWidth / 2, contentStartY + lineHeight);
                ctx.fillText(line3, this.logicalWidth / 2, contentStartY + lineHeight * 2);
                ctx.fillText(line4, this.logicalWidth / 2, contentStartY + lineHeight * 3);
                }
                break;

            case GameState.SELECT:
                if (this.selectionScreen) this.selectionScreen.render();
                this.hudRenderer.renderMuteButton(this.audioManager && this.audioManager.isMuted);
                this.hudRenderer.renderSettingsButton();
                break;

            case GameState.PLAYING:
                // 渲染目标
                for (const target of this.targets) {
                    target.render(this.ctx);
                }
                // 渲染特效
                if (this.effectsRenderer) {
                    this.effectsRenderer.renderCatchEffect(this.stateManager.catchEffect);
                    this.effectsRenderer.renderFireworkEffect(this.stateManager.fireworkEffect);
                    this.effectsRenderer.renderUnlockNotification(this.stateManager.unlockNotification);
                }
                // 渲染 HUD
                this.hudRenderer.coinBalance = this.coinManager.getBalance();
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
                if (this.gameOverScreen) this.gameOverScreen.render({
                    score: this.stateManager.score,
                    isEndlessMode: this._lastGameResult && this._lastGameResult.wasEndlessMode || false,
                    gameTimer: this.stateManager.gameTimer,
                    highScore: this._lastGameResult && this._lastGameResult.highScore || 0,
                    isNewRecord: this._lastGameResult && this._lastGameResult.isNewRecord || false,
                    hitCount: this._lastGameResult && this._lastGameResult.hitCount || 0,
                    coinsEarned: this._lastGameResult && this._lastGameResult.coinsEarned || 0
                });
                break;

            case GameState.SETTINGS:
                // 先渲染之前状态的背景
                if (this.stateManager.previousState === GameState.SELECT) {
                    if (this.selectionScreen) this.selectionScreen.render();
                } else if (this.stateManager.previousState === GameState.PLAYING) {
                    for (const target of this.targets) {
                        target.render(this.ctx);
                    }
                    if (this.effectsRenderer) {
                        this.effectsRenderer.renderCatchEffect(this.stateManager.catchEffect);
                        this.effectsRenderer.renderFireworkEffect(this.stateManager.fireworkEffect);
                        this.effectsRenderer.renderUnlockNotification(this.stateManager.unlockNotification);
                    }
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

        // 渲染体力不足弹窗（所有状态下都可能显示）
        if (this.showStaminaDialog) {
            this.renderStaminaDialog();
        }

        // 渲染签到弹窗（所有状态下都可能显示）
        if (this.showCheckinDialog) {
            this.renderCheckinDialog();
        }

        // 渲染快捷方式提示弹窗（所有状态下都可能显示）
        if (this.showShortcutDialog) {
            this.renderShortcutDialog();
        }
    }

    /**
     * 渲染体力不足弹窗
     */
    renderStaminaDialog() {
        const ctx = this.ctx;
        const canvasWidth = this.logicalWidth;
        const canvasHeight = this.logicalHeight;

        // 半透明遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 弹窗参数
        const dialogWidth = Math.min(400, canvasWidth * 0.85);
        const dialogHeight = 380;
        const dialogX = (canvasWidth - dialogWidth) / 2;
        const dialogY = (canvasHeight - dialogHeight) / 2;

        // 弹窗背景
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        this.roundRect(ctx, dialogX, dialogY, dialogWidth, dialogHeight, 16);
        ctx.fill();

        // 标题
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('💔 体力不足', dialogX + dialogWidth / 2, dialogY + 30);

        // 当前体力
        const currentStamina = this.staminaManager.getCurrentStamina();
        const maxStamina = this.staminaManager.getMaxStamina();
        ctx.font = '20px Arial';
        ctx.fillText(`当前体力: ${currentStamina}/${maxStamina}`, dialogX + dialogWidth / 2, dialogY + 80);

        // 恢复倒计时
        const nextRestoreTime = this.staminaManager.getNextRestoreTime();
        if (nextRestoreTime > 0) {
            const minutes = Math.floor(nextRestoreTime / 60000);
            const seconds = Math.floor((nextRestoreTime % 60000) / 1000);
            const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            ctx.font = '18px Arial';
            ctx.fillStyle = '#666666';
            ctx.fillText(`⏰ ${timeStr} 后恢复1点体力`, dialogX + dialogWidth / 2, dialogY + 120);
        }

        // 按钮样式
        const buttonWidth = dialogWidth - 60;
        const buttonHeight = 60;
        const buttonY1 = dialogY + 170;
        const buttonY2 = dialogY + 260;

        // 看广告按钮
        const adCount = this.staminaManager.getRemainingDailyAdCount();
        ctx.fillStyle = '#FF6B6B';
        this.roundRect(ctx, dialogX + 30, buttonY1, buttonWidth, buttonHeight, 12);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎬 看广告恢复体力', dialogX + dialogWidth / 2, buttonY1 + 22);
        ctx.font = '16px Arial';
        ctx.fillText(`+1 体力 (今日剩余${adCount}次)`, dialogX + dialogWidth / 2, buttonY1 + 45);

        // 分享按钮
        ctx.fillStyle = '#4ECDC4';
        this.roundRect(ctx, dialogX + 30, buttonY2, buttonWidth, buttonHeight, 12);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📤 分享获取体力', dialogX + dialogWidth / 2, buttonY2 + 22);
        ctx.font = '16px Arial';
        ctx.fillText('+2 体力', dialogX + dialogWidth / 2, buttonY2 + 45);

        // 提示文字 - 使用配置值动态显示恢复时间
        const recoveryMinutes = STAMINA_CONFIG.RECOVERY_INTERVAL / 60;
        ctx.fillStyle = '#999999';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(`或等待${recoveryMinutes}分钟自动恢复`, dialogX + dialogWidth / 2, dialogY + 340);

        // 关闭按钮
        const closeSize = 40;
        const closeX = dialogX + dialogWidth - closeSize - 10;
        const closeY = dialogY + 10;

        ctx.fillStyle = '#CCCCCC';
        this.roundRect(ctx, closeX, closeY, closeSize, closeSize, 8);
        ctx.fill();

        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(closeX + 12, closeY + 12);
        ctx.lineTo(closeX + closeSize - 12, closeY + closeSize - 12);
        ctx.moveTo(closeX + closeSize - 12, closeY + 12);
        ctx.lineTo(closeX + 12, closeY + closeSize - 12);
        ctx.stroke();

        ctx.restore();

        // 保存按钮区域用于点击检测
        this.staminaDialogButtons = {
            ad: { x: dialogX + 30, y: buttonY1, width: buttonWidth, height: buttonHeight },
            share: { x: dialogX + 30, y: buttonY2, width: buttonWidth, height: buttonHeight },
            close: { x: closeX, y: closeY, width: closeSize, height: closeSize }
        };
        // console.log('[StaminaDialog] 按钮区域已保存:', this.staminaDialogButtons);
    }

    /**
     * 绘制圆角矩形
     */
    roundRect(ctx, x, y, width, height, radius) {
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
     * 渲染签到弹窗
     */
renderCheckinDialog() {
    const ctx = this.ctx;
    const canvasWidth = this.logicalWidth;
    const canvasHeight = this.logicalHeight;

    // 半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 弹窗参数
    const dialogWidth = Math.min(380, canvasWidth * 0.9);
    const dialogHeight = 520;
    const dialogX = (canvasWidth - dialogWidth) / 2;
    const dialogY = (canvasHeight - dialogHeight) / 2;

    // 弹窗背景
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    this.roundRect(ctx, dialogX, dialogY, dialogWidth, dialogHeight, 16);
    ctx.fill();

    // 标题
    ctx.fillStyle = '#FF6B6B';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('✨ 每日签到', dialogX + dialogWidth / 2, dialogY + 20);

    // 副标题 - 显示连续签到天数和漏签状态
    const consecutiveDays = this.getConsecutiveDays();
    const missedDays = this.getMissedDays();
    ctx.fillStyle = '#666666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';

    if (consecutiveDays >= CHECKIN_CONFIG.CYCLE_DAYS) {
        ctx.fillText('🎉 已完成7天签到！', dialogX + dialogWidth / 2, dialogY + 58);
    } else if (!this.checkinData.firstCheckinDone) {
        ctx.fillText('开始签到，连续7天领取丰厚奖励', dialogX + dialogWidth / 2, dialogY + 58);
    } else if (missedDays.length > 0) {
        ctx.fillText(`连续签到 ${consecutiveDays}/7 天 · ${missedDays.length}天未签到`, dialogX + dialogWidth / 2, dialogY + 58);
    } else {
        ctx.fillText(`连续签到 ${consecutiveDays}/7 天`, dialogX + dialogWidth / 2, dialogY + 58);
    }

    // 签到天数网格
    const CIRCLE_RADIUS = 24;
    const ROW1_CENTER_Y = dialogY + 110;
    const ROW2_CENTER_Y = dialogY + 200;
    const H_PADDING = 30;
    const LABEL_Y_OFFSET = CIRCLE_RADIUS + 16;

    // 第一行：第1-4天
    const row1Count = 4;
    const row1Spacing = (dialogWidth - H_PADDING * 2) / row1Count;

    for (let i = 0; i < row1Count; i++) {
        const dayNumber = i + 1;
        const centerX = dialogX + H_PADDING + row1Spacing * i + row1Spacing / 2;
        const centerY = ROW1_CENTER_Y;
        const status = this.getDayStatus(dayNumber);

        this.drawCheckinDayCircle(ctx, centerX, centerY, dayNumber, status, CIRCLE_RADIUS, LABEL_Y_OFFSET);
    }

    // 第二行：第5-7天（居中对齐）
    const row2Count = 3;
    const row2Spacing = (dialogWidth - H_PADDING * 2) / row1Count;
    const row2OffsetX = (dialogWidth - row2Spacing * row2Count) / 2;

    for (let i = 0; i < row2Count; i++) {
        const dayNumber = i + 5;
        const centerX = dialogX + row2OffsetX + row2Spacing * i + row2Spacing / 2;
        const centerY = ROW2_CENTER_Y;
        const status = this.getDayStatus(dayNumber);

        this.drawCheckinDayCircle(ctx, centerX, centerY, dayNumber, status, CIRCLE_RADIUS, LABEL_Y_OFFSET);
    }

    // 奖励说明
    ctx.fillStyle = '#999999';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('奇数天+1体力，偶数天+50金币，第7天无限体力', dialogX + dialogWidth / 2, ROW2_CENTER_Y + CIRCLE_RADIUS + 50);

    // 按钮区域
    const todayDate = this.dateToYYYYMMDD(new Date());
    const todayStatus = this.getDayStatus(this.dateDiffDays(this.checkinData.weekStartDate, todayDate) + 1);
    const canCheckin = todayStatus === 'today';
    const hasMissed = missedDays.length > 0;
    const isCompleted = consecutiveDays >= CHECKIN_CONFIG.CYCLE_DAYS;

    // 关闭按钮
    const closeButtonWidth = 100;
    const closeButtonHeight = 40;
    const closeButtonX = dialogX + (dialogWidth - closeButtonWidth) / 2;
    const closeButtonY = dialogY + dialogHeight - 60;

    ctx.fillStyle = '#2196F3';
    this.roundRect(ctx, closeButtonX, closeButtonY, closeButtonWidth, closeButtonHeight, 20);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('关闭', closeButtonX + closeButtonWidth / 2, closeButtonY + closeButtonHeight / 2);

    this.checkinDialogButtons = {
        close: {
            x: closeButtonX,
            y: closeButtonY,
            width: closeButtonWidth,
            height: closeButtonHeight
        }
    };

    // 补签按钮（有漏签天数时显示）
    if (hasMissed) {
        const makeupButtonWidth = 200;
        const makeupButtonHeight = 44;
        const makeupButtonX = dialogX + (dialogWidth - makeupButtonWidth) / 2;
        const makeupButtonY = dialogY + dialogHeight - 170;

        ctx.fillStyle = CHECKIN_CONFIG.COLORS.makeup_button;
        this.roundRect(ctx, makeupButtonX, makeupButtonY, makeupButtonWidth, makeupButtonHeight, 22);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`补签 (${missedDays.length}天)`, makeupButtonX + makeupButtonWidth / 2, makeupButtonY + makeupButtonHeight / 2);

        this.checkinDialogButtons.makeup = {
            x: makeupButtonX,
            y: makeupButtonY,
            width: makeupButtonWidth,
            height: makeupButtonHeight
        };
    }

    // 签到按钮（今天未签到且未完成7天）
    if (canCheckin && !isCompleted) {
        const checkinButtonWidth = 200;
        const checkinButtonHeight = 44;
        const checkinButtonX = dialogX + (dialogWidth - checkinButtonWidth) / 2;
        const checkinButtonY = dialogY + dialogHeight - 115;

        ctx.fillStyle = '#FF6B6B';
        this.roundRect(ctx, checkinButtonX, checkinButtonY, checkinButtonWidth, checkinButtonHeight, 22);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        let buttonText;
        if (!this.checkinData.firstCheckinDone) {
            buttonText = '开始签到';
        } else if (hasMissed) {
            buttonText = '重新开始签到';
        } else {
            buttonText = '立即签到';
        }
        ctx.fillText(buttonText, checkinButtonX + checkinButtonWidth / 2, checkinButtonY + checkinButtonHeight / 2);

        this.checkinDialogButtons.checkin = {
            x: checkinButtonX,
            y: checkinButtonY,
            width: checkinButtonWidth,
            height: checkinButtonHeight
        };
    }

    // 开始新周期按钮（完成7天后显示）
    if (isCompleted) {
        const newCycleButtonWidth = 200;
        const newCycleButtonHeight = 44;
        const newCycleButtonX = dialogX + (dialogWidth - newCycleButtonWidth) / 2;
        const newCycleButtonY = dialogY + dialogHeight - 115;

        ctx.fillStyle = '#4CAF50';
        this.roundRect(ctx, newCycleButtonX, newCycleButtonY, newCycleButtonWidth, newCycleButtonHeight, 22);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('开始新周期', newCycleButtonX + newCycleButtonWidth / 2, newCycleButtonY + newCycleButtonHeight / 2);

        this.checkinDialogButtons.newCycle = {
            x: newCycleButtonX,
            y: newCycleButtonY,
            width: newCycleButtonWidth,
            height: newCycleButtonHeight
        };
    }

    ctx.restore();
}

/**
 * 绘制单个签到天数圆形
 * @param {string} status - 'checked' | 'makeup' | 'missed' | 'today' | 'future'
 */
drawCheckinDayCircle(ctx, centerX, centerY, dayNumber, status, radius, labelYOffset) {
    const colors = CHECKIN_CONFIG.COLORS;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

    switch (status) {
        case 'checked':
            ctx.fillStyle = colors.checked;
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✓', centerX, centerY);
            break;

        case 'makeup':
            ctx.fillStyle = colors.makeup;
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✓', centerX, centerY);
            break;

        case 'blank':
            ctx.fillStyle = colors.blank_bg;
            ctx.fill();
            ctx.strokeStyle = colors.blank_border;
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = colors.blank_text;
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dayNumber.toString(), centerX, centerY);
            break;

        case 'missed':
            ctx.fillStyle = colors.missed_bg;
            ctx.fill();
            ctx.strokeStyle = colors.missed_border;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = colors.missed_text;
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('补', centerX, centerY);
            break;

        case 'today':
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.strokeStyle = colors.today_border;
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = colors.today_border;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dayNumber.toString(), centerX, centerY);
            break;

        case 'future':
            ctx.fillStyle = colors.future;
            ctx.fill();
            ctx.fillStyle = colors.future_text;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dayNumber.toString(), centerX, centerY);
            break;
    }

    // 下方标签
    ctx.textBaseline = 'top';
    ctx.font = '11px Arial';

    const labelY = centerY + labelYOffset;
    const isClaimed = status === 'checked' || status === 'makeup';
    const rewardConfig = CHECKIN_CONFIG.DAILY_REWARDS[dayNumber - 1];
    let label;
    if (rewardConfig.type === 'stamina') {
        label = `${dayNumber}天 ⚡+1`;
    } else if (rewardConfig.type === 'coins') {
        label = `${dayNumber}天 🪙+50`;
    } else {
        label = `${dayNumber}天 ♾️无限`;
    }
    ctx.fillStyle = isClaimed ? colors.reward_checked : colors.reward_normal;
    ctx.fillText(label, centerX, labelY);
}

    /**
     * 渲染快捷方式提示弹窗
     */
    renderShortcutDialog() {
        const ctx = this.ctx;
        const canvasWidth = this.logicalWidth;
        const canvasHeight = this.logicalHeight;

        // 半透明遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 弹窗参数
        const panelWidth = Math.min(320, canvasWidth - 40);
        const panelHeight = 260;
        const panelX = (canvasWidth - panelWidth) / 2;
        const panelY = (canvasHeight - panelHeight) / 2;
        const borderRadius = 16;

        // 弹窗背景（毛玻璃效果）
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.roundRect(ctx, panelX, panelY, panelWidth, panelHeight, borderRadius);
        ctx.fill();

        // 边框
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.3)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, panelX, panelY, panelWidth, panelHeight, borderRadius);
        ctx.stroke();

        // 标题
        ctx.fillStyle = '#333';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText('💡 添加桌面快捷方式', canvasWidth / 2, panelY + 25);

        // 描述文字
        ctx.fillStyle = '#666';
        ctx.font = '15px Arial';
        ctx.textBaseline = 'top';

        const descriptions = [
            '将游戏添加到桌面，下次即可直接进入',
            '立即获得 1 点体力奖励！'
        ];

        let descY = panelY + 70;
        for (const desc of descriptions) {
            ctx.fillText(desc, canvasWidth / 2, descY);
            descY += 24;
        }

        // 按钮配置
        const buttonWidth = 120;
        const buttonHeight = 44;
        const buttonGap = 15;
        const buttonY = panelY + panelHeight - 60;

        const addButtonX = (canvasWidth - buttonWidth * 2 - buttonGap) / 2;
        const skipButtonX = addButtonX + buttonWidth + buttonGap;

        // 保存按钮区域供点击检测
        this.shortcutDialogButtons = {
            add: {
                x: addButtonX,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight
            },
            skip: {
                x: skipButtonX,
                y: buttonY,
                width: buttonWidth,
                height: buttonHeight
            }
        };

        // "添加快捷方式" 按钮
        ctx.fillStyle = '#4CAF50';
        this.roundRect(ctx, addButtonX, buttonY, buttonWidth, buttonHeight, 10);
        ctx.fill();

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('添加并奖励', addButtonX + buttonWidth / 2, buttonY + buttonHeight / 2);

        // "跳过" 按钮
        ctx.fillStyle = '#999';
        this.roundRect(ctx, skipButtonX, buttonY, buttonWidth, buttonHeight, 10);
        ctx.fill();

        ctx.fillStyle = '#FFF';
        ctx.fillText('跳过', skipButtonX + buttonWidth / 2, buttonY + buttonHeight / 2);

        // 图标装饰
        ctx.font = '40px Arial';
        ctx.fillText('🎮', canvasWidth / 2, panelY + 165);

        ctx.restore();
    }

    /**
     * 处理触摸（兼容旧代码）
     */
    handleTouch(pos) {
        // 传递触摸事件到草地系统
        this.bgRenderer.handleTouch(pos);

        const state = this.stateManager.getState();

        if (state === GameState.START) {
            this.stateManager.setState(GameState.SELECT);
            if (this.selectionScreen) this.selectionScreen.reset();
            if (this.adManager) this.adManager.showBannerAd();  // 显示Banner广告
                    } else if (state === GameState.PLAYING) {
            this.tryToCatch(pos);
        } else if (state === GameState.OVER) {
            this.stateManager.setState(GameState.SELECT);
            if (this.selectionScreen) this.selectionScreen.reset();
            if (this.adManager) this.adManager.showBannerAd();  // 显示Banner广告
                    }
    }

    /**
     * 处理触摸开始
     */
    handleTouchStart(pos) {
        // 初始化音频（用户首次交互）
        this.initAudio();

        // 传递触摸事件到草地系统
        this.bgRenderer.handleTouch(pos);

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
            if (this.selectionScreen) this.selectionScreen.reset();
            if (this.adManager) this.adManager.showBannerAd();  // 显示Banner广告
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
            // 注意：加群按钮由 tt.onTouchStart 原生事件处理，不在这里检测

            // 检测其他按钮点击
            const buttonAction = this.gameOverScreen.handleButtonClick(pos.x, pos.y);

            if (buttonAction === 'restart') {
                // 再玩一次：使用当前配置重新开始
                this.restartGame();
                return;
            } else if (buttonAction === 'home') {
                // 返回首页：清理广告并返回选择界面
                this.returnToHome();
                return;
            }

            // 注意：加群按钮由 tt.onTouchStart 原生事件处理，不在这里处理

            // 点击其他区域: 完整清理后返回选择界面
            // 注意：这里也尝试展示插屏广告（不阻塞返回流程）
            this.showGameOverHomeAd();  // fire-and-forget，不等待

            this.cleanupGameSession();  // 新增: 完整清理
            this.stateManager.setState(GameState.SELECT);
            this.selectionScreen.reset();
            this.adManager.showBannerAd();  // 显示Banner广告
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
        // 传递触摸事件到草地系统
        this.bgRenderer.handleTouch(pos);

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

        // 调试日志
        console.log('[TouchEnd] 位置:', pos);
        console.log('[TouchEnd] 游戏状态:', state);
        console.log('[TouchEnd] showStaminaDialog:', this.showStaminaDialog);
        console.log('[TouchEnd] showCheckinDialog:', this.showCheckinDialog);

        // 签到弹窗按钮处理（优先级最高）
        if (this.showCheckinDialog) {
            console.log('[TouchEnd] 进入签到对话框处理');
            this.handleCheckinDialogClick(pos);
            return;
        }

        // 快捷方式弹窗按钮处理（优先级最高）
        if (this.showShortcutDialog) {
            console.log('[TouchEnd] 进入快捷方式对话框处理');
            this.handleShortcutDialogClick(pos);
            return;
        }

        // 体力弹窗按钮处理
        if (this.showStaminaDialog) {
            console.log('[TouchEnd] 进入体力对话框处理');
            this.handleStaminaDialogClick(pos);
            return;
        }

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

            const selectionResult = this.selectionScreen.handleTouchEnd(pos);
            if (selectionResult) {
                const { config, mode, isTrial } = selectionResult;
                // 保存试玩模式标记
                this.isTrialMode = isTrial || false;
                if (mode === 'endless') {
                    this.startEndlessMode(config);
                } else {
                    this.startGame(config);
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

            // multiline 类型使用线段碰撞检测
            if (target.config.renderType === 'multiline' && target.multilineRenderer) {
                const hitPoint = target.multilineRenderer.hitTest(pos.x, pos.y, 20);
                if (hitPoint) {
                    target.isActive = false;
                    this.stateManager.addScore(target.points);

                    target.isClicked = true;
                    target.clickTime = Date.now();
                    target.clickIntensity = 1.0;

                    this.audioManager.playCatch(target.points);

                    if (tt && this.settingsManager.isVibrationEnabled()) {
                        tt.vibrateShort();
                    }

                    this.stateManager.setCatchEffect(hitPoint.x, hitPoint.y, target.points, target.config.type || 'default');

                    if (target.config.id === 'yarn' && target.config.renderType === 'multiline') {
                        const colors = target.config.renderConfig && target.config.renderConfig.colors || ['#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA'];
                        this.stateManager.setFireworkEffect(hitPoint.x, hitPoint.y, colors);
                    }

                    return;
                }
                continue;
            }

            const distance = pos.distanceTo(target.position);
            if (distance < target.radius + 25) {
                // 气泡鱼：多击机制
                if (target.maxHp > 1) {
                    const result = target.takeDamage();

                    if (result.destroyed) {
                        const capturePoints = (target.config.bubblefishConfig && target.config.bubblefishConfig.capturePoints) || target.points;
                        this.stateManager.addScore(capturePoints);
                        this.audioManager.playCatch(capturePoints);
                        this.stateManager.setCatchEffect(target.position.x, target.position.y, capturePoints, 'bubblefish');
                        const colors = (target.config.bubblefishConfig && target.config.bubblefishConfig.explosionColors) || ['#87CEEB'];
                        this.stateManager.setFireworkEffect(target.position.x, target.position.y, colors);
                    } else {
                        const popPoints = (target.config.bubblefishConfig && target.config.bubblefishConfig.bubblePopPoints) || 5;
                        this.stateManager.addScore(popPoints);
                        this.audioManager.playCatch(popPoints);
                        this.stateManager.setCatchEffect(target.position.x, target.position.y, popPoints, 'bubblefish');
                    }

                    if (tt && this.settingsManager.isVibrationEnabled()) {
                        tt.vibrateShort();
                    }
                    return;
                }

                // 弹力球：combo 机制
                if (target.config.id === 'bouncyball') {
                    const comboCount = target.incrementCombo();
                    const multiplier = target.getComboMultiplier();
                    const totalPoints = target.points * multiplier;

                    target.isActive = false;
                    this.stateManager.addScore(totalPoints);

                    target.isClicked = true;
                    target.clickTime = Date.now();
                    target.clickIntensity = 1.0;

                    this.audioManager.playCatch(totalPoints);

                    if (tt && this.settingsManager.isVibrationEnabled()) {
                        tt.vibrateShort();
                    }

                    const effectLabel = comboCount >= 2 ? `x${multiplier}` : '';
                    this.stateManager.setCatchEffect(target.position.x, target.position.y, totalPoints, 'bouncyball', effectLabel);

                    if (comboCount >= 2) {
                        const colors = (target.config.bouncyballConfig && target.config.bouncyballConfig.explosionColors) || ['#FF4444'];
                        this.stateManager.setFireworkEffect(target.position.x, target.position.y, colors);
                    }
                    return;
                }

                target.isActive = false;
                this.stateManager.addScore(target.points);

                // 设置点击反馈状态
                target.isClicked = true;
                target.clickTime = Date.now();
                target.clickIntensity = 1.0;

                // 播放得分音效
                this.audioManager.playCatch(target.points);

                // 震动反馈
                if (tt && this.settingsManager.isVibrationEnabled()) {
                    tt.vibrateShort();
                }

                // 设置抓取特效（包含目标类型）
                this.stateManager.setCatchEffect(target.position.x, target.position.y, target.points, target.config.type || 'default');

                // 如果是多彩线群，触发烟花特效
                if (target.config.id === 'yarn' && target.config.renderType === 'multiline') {
                    const colors = target.config.renderConfig && target.config.renderConfig.colors || ['#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA'];
                    this.stateManager.setFireworkEffect(target.position.x, target.position.y, colors);
                }
                // 如果是萤火虫，触发爆炸粒子特效
                else if (target.config.id === 'ladybug') {
                    const colors = target.config.renderConfig && target.config.renderConfig.explosionColors || ['#B6FF00', '#FFFF66', '#88DD00'];
                    this.stateManager.setFireworkEffect(target.position.x, target.position.y, colors);
                }    else if (target.config.id === 'sparkle') {
                    const colors = target.config.renderConfig && target.config.renderConfig.explosionColors || ['#FFF176', '#FFD54F', '#FFEE58','#FFF9C4'];
                    this.stateManager.setFireworkEffect(target.position.x, target.position.y, colors);
                } else if (target.config.id === 'fish') {
                    const colors = target.config.renderConfig && target.config.renderConfig.explosionColors || ['#FFFFFF', '#E6F7FF', '#B3ECFF','#80DFFF','rgba(200,240,255,0.3)'];
                    this.stateManager.setFireworkEffect(target.position.x, target.position.y, colors);

                } else if (target.config.id === 'butterfly') {
                    const colors = target.config.renderConfig && target.config.renderConfig.explosionColors || ['#FFF176', '#FFD54F', '#FFD54F'];
                    this.stateManager.setFireworkEffect(target.position.x, target.position.y, colors);
                } else if (target.config.id === 'mosquito') {
                    const colors = target.config.renderConfig && target.config.renderConfig.explosionColors || ['#FFF176', '#FFE066', '#FFD54F', '#FFF9C4', '#FFFFFF'];
                    this.stateManager.setFireworkEffect(target.position.x, target.position.y, colors);
                } else if (target.config.id === 'jellyfish') {
                    const colors = (target.config.jellyfishConfig && target.config.jellyfishConfig.explosionColors) || ['#B478FF', '#DDB4FF', '#E8D0FF'];
                    this.stateManager.setFireworkEffect(target.position.x, target.position.y, colors);
                }

                return;
            }
        }
    }

    /**
     * 处理体力弹窗按钮点击
     * @param {Vector2} pos - 点击位置
     */
    async handleStaminaDialogClick(pos) {
        console.log('[StaminaDialog] 按钮点击处理');
        console.log('[StaminaDialog] staminaDialogButtons:', this.staminaDialogButtons);

        if (!this.staminaDialogButtons) {
            console.error('[StaminaDialog] staminaDialogButtons 为 null!');
            return;
        }

        const { ad, share, close } = this.staminaDialogButtons;
        console.log('[StaminaDialog] 按钮区域:', { ad, share, close });
        console.log('[StaminaDialog] 点击位置:', pos);

        // 检查是否点击看广告按钮
        const hitAd = pos.x >= ad.x && pos.x <= ad.x + ad.width &&
                      pos.y >= ad.y && pos.y <= ad.y + ad.height;
        console.log('[StaminaDialog] 是否点击广告按钮:', hitAd);

        if (hitAd) {
            console.log('[StaminaDialog] 调用广告恢复体力...');

            // ============ 新增诊断日志 ============
            console.log('[StaminaDialog] staminaManager 存在?', !!this.staminaManager);
            console.log('[StaminaDialog] staminaManager 类型:', typeof this.staminaManager);
            console.log('[StaminaDialog] restoreByAd 方法存在?', this.staminaManager && typeof this.staminaManager.restoreByAd === 'function');
            // =====================================

            // 调用广告恢复体力
            const result = await this.staminaManager.restoreByAd();
            if (result.success) {
                // 关闭弹窗
                this.showStaminaDialog = false;
                this.staminaDialogButtons = null;
            }
            // TODO: 显示结果消息（result.message）
            return;
        }

        // 检查是否点击分享按钮
        if (pos.x >= share.x && pos.x <= share.x + share.width &&
            pos.y >= share.y && pos.y <= share.y + share.height) {
            // 调用分享恢复体力
            const result = await this.staminaManager.restoreByShare();
            if (result.success) {
                // 关闭弹窗
                this.showStaminaDialog = false;
                this.staminaDialogButtons = null;
            }
            // TODO: 显示结果消息（result.message）
            return;
        }

        // 检查是否点击关闭按钮
        if (pos.x >= close.x && pos.x <= close.x + close.width &&
            pos.y >= close.y && pos.y <= close.y + close.height) {
            // 关闭弹窗
            this.showStaminaDialog = false;
            this.staminaDialogButtons = null;
        }
    }

    /**
     * 处理签到弹窗按钮点击
     * @param {Vector2} pos - 点击位置
     */
    async handleCheckinDialogClick(pos) {
        console.log('[CheckinDialog] 按钮点击处理');
        console.log('[CheckinDialog] checkinDialogButtons:', this.checkinDialogButtons);
        console.log('[CheckinDialog] 点击位置:', pos);

        if (!this.checkinDialogButtons) {
            console.error('[CheckinDialog] checkinDialogButtons 为 null!');
            return;
        }

        // 防止广告播放期间重复点击
        if (this.isCheckinAdPlaying) {
            console.log('[CheckinDialog] 广告播放中，忽略点击');
            return;
        }

        const { checkin, close, makeup, newCycle } = this.checkinDialogButtons;

        // 检查是否点击开始新周期按钮
        if (newCycle && pos.x >= newCycle.x && pos.x <= newCycle.x + newCycle.width &&
            pos.y >= newCycle.y && pos.y <= newCycle.y + newCycle.height) {
            console.log('[CheckinDialog] 点击开始新周期按钮');
            const todayDate = this.dateToYYYYMMDD(new Date());
            this._resetCycleForNewStart(todayDate);
            this.audioManager.playButtonClick();
            return;
        }

        // 检查是否点击补签按钮
        if (makeup && pos.x >= makeup.x && pos.x <= makeup.x + makeup.width &&
            pos.y >= makeup.y && pos.y <= makeup.y + makeup.height) {
            console.log('[CheckinDialog] 点击补签按钮');

            const missedDays = this.getMissedDays();
            if (missedDays.length === 0) return;

            const targetDay = missedDays[0];

            this.isCheckinAdPlaying = true;
            const result = await this.performMakeupCheckin(targetDay);
            this.isCheckinAdPlaying = false;

            if (result.success) {
                console.log('[CheckinDialog] ✅ 补签成功:', result);
                this.audioManager.playButtonClick();
                // 不关闭弹窗，让用户继续补签或签到
            } else {
                console.log('[CheckinDialog] 补签失败:', result.message);
            }
            return;
        }

        // 检查是否点击签到按钮
        if (checkin && pos.x >= checkin.x && pos.x <= checkin.x + checkin.width &&
            pos.y >= checkin.y && pos.y <= checkin.y + checkin.height) {
            console.log('[CheckinDialog] 点击签到按钮');

            const result = this.performCheckin();

            if (result.success) {
                console.log('[CheckinDialog] ✅ 签到成功:', result);
                this.audioManager.playButtonClick();
                this.showCheckinDialog = false;
                this.checkinDialogButtons = null;

                // 在 SelectionScreen 上显示签到成功弹窗
                if (this.selectionScreen) {
                    const reward = result.reward;
                    const isUnlimited = reward.type === 'unlimited';
                    this.selectionScreen.showCheckinSuccessDialog = true;
                    this.selectionScreen.checkinSuccessData = {
                        coins: reward.coins || 0,
                        stamina: isUnlimited ? 0 : (reward.type === 'stamina' ? reward.amount : 0),
                        unlimited: isUnlimited ? reward.duration : 0,
                        day: result.day,
                        consecutiveDays: this.checkinData.consecutiveDays
                    };
                }
            } else {
                console.log('[CheckinDialog] 签到失败:', result.message);
            }
            return;
        }

        // 检查是否点击关闭按钮
        if (pos.x >= close.x && pos.x <= close.x + close.width &&
            pos.y >= close.y && pos.y <= close.y + close.height) {
            console.log('[CheckinDialog] 点击关闭按钮');
            this.audioManager.playButtonClick();
            this.showCheckinDialog = false;
            this.checkinDialogButtons = null;
            return;
        }
    }

    /**
     * 处理快捷方式弹窗按钮点击
     * @param {Vector2} pos - 点击位置
     */
    async handleShortcutDialogClick(pos) {
        console.log('[ShortcutDialog] 按钮点击处理');

        if (!this.shortcutDialogButtons) {
            console.error('[ShortcutDialog] shortcutDialogButtons 为 null!');
            return;
        }

        const { add, skip } = this.shortcutDialogButtons;
        const x = pos.x;
        const y = pos.y;

        // 检查"添加快捷方式"按钮
        if (x >= add.x && x <= add.x + add.width &&
            y >= add.y && y <= add.y + add.height) {

            // 播放点击音效
            this.audioManager.playButtonClick();

            // 显示加载提示
            console.log('[Game] 正在添加快捷方式...');

            // 调用 ShortcutManager 添加快捷方式
            const result = await this.shortcutManager.addShortcut();

            if (result.success) {
                console.log('[Game] ✅ ' + result.message);

                // 关闭弹窗
                this.showShortcutDialog = false;
                this.shortcutDialogButtons = null;

                // 继续开始游戏
                this.continueAfterShortcut();
            } else {
                console.log('[Game] ❌ ' + result.message);

                // 显示错误提示，但不关闭弹窗
                // 用户可以重试或选择跳过
            }

            return;
        }

        // 检查"跳过"按钮
        if (x >= skip.x && x <= skip.x + skip.width &&
            y >= skip.y && y <= skip.y + skip.height) {

            // 播放点击音效
            this.audioManager.playButtonClick();

            // 标记用户已看过提示
            this.shortcutManager.skipPrompt();

            // 关闭弹窗
            this.showShortcutDialog = false;
            this.shortcutDialogButtons = null;

            // 继续开始游戏
            this.continueAfterShortcut();

            return;
        }
    }

    /**
     * 开始游戏（计时模式）
     * @param {Object} targetConfig - 目标配置
     * @param {boolean} skipAdCheck - 是否跳过广告检查（广告后调用时为true）
     */
    async startGame(targetConfig, skipAdCheck = false) {
        // 隐藏Banner广告（游戏开始时）
        this.adManager.hideBannerAd();

        // 检查体力是否足够
        if (!this.staminaManager.hasEnoughStamina()) {
            console.log('[Game] 体力不足，显示体力不足弹窗');
            this.showStaminaDialog = true;
            return;  // 体力不足，不开始游戏
        }

        // 消耗体力 - 每次游戏都消耗，包括第一次游戏
        const consumed = this.staminaManager.consumeStamina();
        if (!consumed) {
            console.log('[Game] 体力消耗失败，显示体力不足弹窗');
            this.showStaminaDialog = true;
            return;
        }

        console.log('[Game] 体力消耗成功，开始游戏');

        // 增加游戏次数统计（用于广告概率计算）
        this.settingsManager.incrementPlayCount();
        this.adManager.incrementConsecutivePlays();

        // 移除选择后的插屏广告，改为在选择页面停留时随机展示

        this.stateManager.startGame(targetConfig, false);
        this.targets = [];
        this.spawnManager.reset();

        // 保持屏幕常亮
        if (tt && tt.setKeepScreenOn) {
            tt.setKeepScreenOn({ keepScreenOn: true });
        }

        // 播放游戏开始音效
        this.audioManager.playGameStart();
        // 根据目标类型选择BGM
        const bgmName = targetConfig.id || 'game';
        this.audioManager.playBGM(bgmName, { volume: AUDIO_CONFIG.BGM_VOLUME.game });

        // 生成初始目标
        this.targets = this.spawnManager.spawnInitialTargets({
            canvasWidth: this.logicalWidth,
            canvasHeight: this.logicalHeight,
            selectedTarget: targetConfig,
            isEndlessMode: false,
            multipliers: { speed: 1, radius: 1, points: 1 }
        });
    }

    /**
     * 开始无尽模式
     */
    async startEndlessMode(targetConfig) {
        // 隐藏Banner广告（游戏开始时）
        this.adManager.hideBannerAd();

        // 检查体力是否足够
        if (!this.staminaManager.hasEnoughStamina()) {
            console.log('[Game] 无尽模式 - 体力不足，显示体力不足弹窗');
            this.showStaminaDialog = true;
            return;  // 体力不足，不开始游戏
        }

        // 消耗体力 - 每次游戏都消耗，包括第一次游戏
        const consumed = this.staminaManager.consumeStamina();
        if (!consumed) {
            console.log('[Game] 无尽模式 - 体力消耗失败，显示体力不足弹窗');
            this.showStaminaDialog = true;
            return;
        }

        console.log('[Game] 无尽模式 - 体力消耗成功，开始无尽模式');

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

        // 传递目标配置给 stateManager
        this.stateManager.setAdManager(this.adManager);
        this.stateManager.startEndlessMode(targetConfig);

        this.targets = [];
        this.spawnManager.reset();

        // 保持屏幕常亮
        if (tt && tt.setKeepScreenOn) {
            tt.setKeepScreenOn({ keepScreenOn: true });
        }

        // 播放模式选择音效
        this.audioManager.playModeSelect();
        this.audioManager.playGameStart();
        // 根据目标类型选择BGM
        const bgmName = targetConfig.id || 'menu';
        this.audioManager.playBGM(bgmName, { volume: AUDIO_CONFIG.BGM_VOLUME.endless });

        // 生成初始目标
        this.targets = this.spawnManager.spawnInitialTargets({
            canvasWidth: this.logicalWidth,
            canvasHeight: this.logicalHeight,
            selectedTarget: this.stateManager.selectedTarget,
            isEndlessMode: true,
            multipliers: this.stateManager.currentMultipliers
        });
    }

    /**
     * 结束游戏
     */
    async endGame() {
        // 取消屏幕常亮
        if (tt && tt.setKeepScreenOn) {
            tt.setKeepScreenOn({ keepScreenOn: false });
        }

        // 保存当前模式和分数信息（在 endGame 之前保存）
        const wasEndlessMode = this.stateManager.isEndlessMode;
        const finalScore = this.stateManager.score;
        const gameTimer = this.stateManager.gameTimer;
        const targetId = this.stateManager.getCurrentTargetId();
        const hitCount = this.stateManager.getHitCount();  // 新增：获取命中目标数

        // 检查是否是试玩模式，如果是，则标记试玩已完成
        if (this.isTrialMode && targetId) {
            console.log('[Game] 试玩模式结束，标记目标已试玩:', targetId);
            this.adManager.markTrialPlayed(targetId);
            this.isTrialMode = false;  // 清除试玩标记
        }

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
            hitCount,  // 新增：命中目标数
            highScore: wasEndlessMode
                ? this.settingsManager.getEndlessStats().highScore
                : this.settingsManager.getTargetHighScore(targetId)
        };

        // 结算金币
        const coinsEarned = this.coinManager.calculateSettlementCoins(finalScore);
        this.coinManager.addCoins(coinsEarned, 'settlement');
        this._lastGameResult.coinsEarned = coinsEarned;

        // 提交分数到排行榜：仅计时模式且刷新最高分时提交
        if (this.rankManager && !wasEndlessMode && isNewRecord) {
            this.rankManager.submitScore(finalScore, false);
        }

        // 检查是否应该触发游戏结束广告（无尽模式且分数达到要求）
        if (wasEndlessMode &&
            this.adManager.shouldTriggerEndlessAd('gameOver', finalScore)) {
            console.log('[Game] 触发游戏结束广告');
            const adShown = await this.adManager.showInterstitialAd('endless_game_over');
            if (adShown) {
                this.adManager.recordAdShown();
            }
        }

        // 显示游戏推荐面板
        this.adManager.showGameRecommendation();

        // 注意：不在这里重置无尽模式标志，因为 restartGame() 需要使用
        // isEndlessMode 应该只在真正需要重置时才重置（如返回首页）
    }

    /**
     * 清理游戏会话状态
     * 用于从 PLAYING/OVER 状态返回到 SELECT 状态时的完整清理
     */
    cleanupGameSession() {
        console.log('[Game] 清理游戏会话');

        // 1. 清理游戏目标
        this.targets = [];

        // 2. 重置生成管理器
        this.spawnManager.reset();

        // 3. 隐藏游戏推荐面板
        this.adManager.hideGameRecommendation();

        // 4. 清理特效状态
        this.stateManager.catchEffect = null;
        this.stateManager.fireworkEffect = null;
        this.stateManager.unlockNotification = null;

        console.log('[Game] 游戏会话清理完成');
    }

    /**
     * 再玩一次
     */
    async restartGame() {
        console.log('[Game] 再玩一次');

        // 检查当前目标是否需要广告解锁
        const lastResult = this._lastGameResult;
        if (lastResult && lastResult.targetId) {
            const targetConfig = TARGET_TYPES.find(t => t.id === lastResult.targetId);

            // 仅对需要广告解锁且当前未解锁的目标触发广告
            if (targetConfig && targetConfig.unlock.adRequired &&
                !this.adManager.isTargetUnlocked(lastResult.targetId)) {
                console.log('[Game] 再玩一次 - 目标未解锁，需要观看广告:', lastResult.targetId);
                const unlocked = await this.adManager.requestUnlock(lastResult.targetId);
                if (!unlocked) {
                    console.log('[Game] 再玩一次 - 广告观看失败或取消，不重新开始');
                    return;
                }
                console.log('[Game] 再玩一次 - 广告观看成功，目标已解锁');
            }
        }

        // 执行重新游戏的实际逻辑（快捷方式弹窗不阻塞重启）
        this.doRestartGame();
    }

    /**
     * 执行重新游戏的实际逻辑
     */
    doRestartGame() {
        console.log('[Game] 执行重新游戏');

        // 检查体力是否足够
        if (!this.staminaManager.hasEnoughStamina()) {
            console.log('[Game] 重新游戏 - 体力不足，显示体力不足弹窗');
            this.showStaminaDialog = true;
            return;  // 体力不足，不重新开始
        }

        // 消耗体力 - 每次游戏都消耗，包括第一次游戏
        const consumed = this.staminaManager.consumeStamina();
        if (!consumed) {
            console.log('[Game] 重新游戏 - 体力消耗失败，显示体力不足弹窗');
            this.showStaminaDialog = true;
            return;
        }

        console.log('[Game] 重新游戏 - 体力消耗成功，开始重新游戏');

        // 1. 隐藏结算页面的广告
        this.adManager.hideGameRecommendation();
        this.adManager.hideBannerAd();

        // 2. 保存当前配置
        const wasEndlessMode = this.stateManager.isEndlessMode;
        const currentTarget = this.stateManager.selectedTarget;

        // 3. 清理旧会话
        this.targets = [];
        this.spawnManager.reset();
        this.stateManager.catchEffect = null;
        this.stateManager.fireworkEffect = null;

        // 4. 重置并重新开始
        this.stateManager.reset();
        if (wasEndlessMode) {
            this.stateManager.startEndlessMode(currentTarget);
        } else {
            this.stateManager.startGame(currentTarget);
        }

        // 5. 设置状态
        this.stateManager.setState(GameState.PLAYING);
        this.stateChangeTime = Date.now();

        // 6. 音效和音乐
        this.audioManager.playButtonClick();
        this.audioManager.playBGM(wasEndlessMode ? 'endless' : 'game');

        // 7. 屏幕常亮
        if (tt && tt.setKeepScreenOn) {
            tt.setKeepScreenOn({ keepScreenOn: true });
        }

        // 8. 生成初始目标
        this.targets = this.spawnManager.spawnInitialTargets({
            canvasWidth: this.logicalWidth,
            canvasHeight: this.logicalHeight,
            selectedTarget: currentTarget,
            isEndlessMode: wasEndlessMode,
            multipliers: wasEndlessMode ? this.stateManager.currentMultipliers : { speed: 1, radius: 1, points: 1 }
        });
    }

    /**
     * 快捷方式弹窗处理完成后继续游戏
     */
    continueAfterShortcut() {
        console.log('[Game] 快捷方式弹窗处理完成，继续游戏');
        // 继续执行重新游戏的逻辑
        this.doRestartGame();
    }

    /**
     * 返回首页
     */
    async returnToHome() {
        console.log('[Game] 返回首页');

        // 展示游戏结束返回首页的插屏广告（80%概率）
        await this.showGameOverHomeAd();

        // 1. 完整清理游戏会话
        this.cleanupGameSession();

        // 2. 显示Banner广告
        this.adManager.showBannerAd();

        // 3. 重置游戏状态
        this.stateManager.reset();

        // 4. 切换到选择界面
        this.stateManager.setState(GameState.SELECT);
        this.selectionScreen.reset();
        this.skipNextTouchEnd = true;
        this.stateChangeTime = Date.now();

        // 5. 音效和音乐
        this.audioManager.playButtonClick();
        this.audioManager.playBGM('menu', { volume: AUDIO_CONFIG.BGM_VOLUME.select });
    }

    /**
     * 加入官方群
     */
joinOfficialGroup() {
    console.log('[Game] 加入官方群');

    // 播放按钮点击音效
    this.audioManager.playButtonClick();

    // 检查是否有群聊管理器
    if (!this.chatGroupManager) {
        console.warn('[Game] ❌ 群聊管理器未初始化');
        return;
    }

    // 🔥 关键：不能 await！直接调用！
    this.chatGroupManager.openOfficialGroup();
}

    /**
     * 处理签到按钮点击
     */
handleCheckin() {
    console.log('[Game] 签到按钮点击');

    // 播放按钮点击音效
    this.audioManager.playButtonClick();

    // 如果从未签过到且已过 weekStartDate，重置为今天
    if (!this.checkinData.firstCheckinDone) {
        const todayDate = this.dateToYYYYMMDD(new Date());
        if (todayDate !== this.checkinData.weekStartDate) {
            this.checkinData.weekStartDate = todayDate;
            this.saveCheckinData();
            console.log('[Game] 首签未完成，重置 weekStartDate 为今天');
        }
    }

    // 显示签到弹窗
    this.showCheckinDialog = true;
    this.checkinDialogButtons = null;

    // 渲染弹窗按钮（需要在下一帧渲染时计算）
    console.log('[Game] 显示签到弹窗');
}

    /**
     * 初始化签到数据
     */
initCheckinData() {
    const savedData = tt.getStorageSync('checkinData');
    if (savedData) {
        try {
            this.checkinData = JSON.parse(savedData);
            console.log('[Game] 签到数据已加载:', this.checkinData);

            if (!this.checkinData.version || this.checkinData.version < 2) {
                this.migrateCheckinDataV1ToV2(this.checkinData);
            }
            if (this.checkinData.version < CHECKIN_CONFIG.DATA_VERSION) {
                this.migrateCheckinDataV2ToV3(this.checkinData);
            }
        } catch (e) {
            console.warn('[Game] 签到数据解析失败:', e);
            this.initNewCheckinWeek();
        }
    } else {
        this.initNewCheckinWeek();
    }
}

    /**
     * 迁移旧版签到数据到 v2 格式
     */
migrateCheckinDataV1ToV2(oldData) {
    const todayDate = this.dateToYYYYMMDD(new Date());
    const daysAgo = oldData.lastCheckinDate > 0 ? this.dateDiffDays(oldData.lastCheckinDate, todayDate) : 999;

    if (oldData.consecutiveDays > 0 && daysAgo <= 1) {
        const weekStart = this.addDaysToDate(oldData.lastCheckinDate, -(oldData.consecutiveDays - 1));
        const checkedDays = [];
        for (let i = 0; i < oldData.consecutiveDays; i++) {
            checkedDays.push({
                date: this.addDaysToDate(weekStart, i),
                day: i + 1,
                type: 'normal'
            });
        }
        this.checkinData = {
            version: CHECKIN_CONFIG.DATA_VERSION,
            weekStartDate: weekStart,
            checkedDays,
            makeupDays: [],
            lastCheckinTime: oldData.lastCheckinTime,
            lastCheckinDate: oldData.lastCheckinDate,
            totalCheckinDays: oldData.totalCheckinDays || 0,
            consecutiveDays: oldData.consecutiveDays
        };
    } else {
        this.checkinData = {
            version: CHECKIN_CONFIG.DATA_VERSION,
            weekStartDate: todayDate,
            checkedDays: [],
            makeupDays: [],
            lastCheckinTime: 0,
            lastCheckinDate: 0,
            totalCheckinDays: oldData.totalCheckinDays || 0,
            consecutiveDays: 0
        };
    }
    this.saveCheckinData();
    console.log('[Game] 签到数据已迁移到 v2');
}

    /**
     * 迁移 v2 签到数据到 v3 格式（新增 firstCheckinDone 字段）
     */
migrateCheckinDataV2ToV3(oldData) {
    const todayDate = this.dateToYYYYMMDD(new Date());
    const hasCheckedDays = oldData.checkedDays && oldData.checkedDays.length > 0;

    if (hasCheckedDays) {
        this.checkinData = {
            ...oldData,
            version: CHECKIN_CONFIG.DATA_VERSION,
            firstCheckinDone: true
        };
    } else {
        const daysSinceWeekStart = this.dateDiffDays(oldData.weekStartDate, todayDate);
        if (daysSinceWeekStart >= 0 && daysSinceWeekStart < CHECKIN_CONFIG.CYCLE_DAYS) {
            this.checkinData = {
                ...oldData,
                version: CHECKIN_CONFIG.DATA_VERSION,
                firstCheckinDone: false
            };
        } else {
            const preservedTotal = oldData.totalCheckinDays || 0;
            this.checkinData = {
                version: CHECKIN_CONFIG.DATA_VERSION,
                weekStartDate: todayDate,
                checkedDays: [],
                makeupDays: [],
                lastCheckinTime: 0,
                lastCheckinDate: 0,
                totalCheckinDays: preservedTotal,
                consecutiveDays: 0,
                firstCheckinDone: false
            };
        }
    }
    this.saveCheckinData();
    console.log('[Game] 签到数据已迁移到 v3');
}

    /**
     * 初始化新的签到周期
     */
initNewCheckinWeek() {
    const todayDate = this.dateToYYYYMMDD(new Date());
    const preservedTotal = this.checkinData ? this.checkinData.totalCheckinDays || 0 : 0;

    this.checkinData = {
        version: CHECKIN_CONFIG.DATA_VERSION,
        weekStartDate: todayDate,
        checkedDays: [],
        makeupDays: [],
        lastCheckinTime: 0,
        lastCheckinDate: 0,
        totalCheckinDays: preservedTotal,
        consecutiveDays: 0,
        firstCheckinDone: false
    };
    this.saveCheckinData();
    console.log('[Game] 初始化签到数据');
}

    /**
     * 保存签到数据到本地存储
     */
saveCheckinData() {
    try {
        tt.setStorageSync('checkinData', JSON.stringify(this.checkinData));
        console.log('[Game] 签到数据已保存');
    } catch (e) {
        console.warn('[Game] 签到数据保存失败:', e);
    }
}

    /**
     * 从 checkedDays 计算连续签到天数（从第 1 天起连续）
     */
getConsecutiveDays() {
    let count = 0;
    for (let day = 1; day <= CHECKIN_CONFIG.CYCLE_DAYS; day++) {
        if (this.checkinData.checkedDays.some(d => d.day === day)) {
            count++;
        } else {
            break;
        }
    }
    return count;
}

    /**
     * 获取指定天数的状态: 'checked' | 'makeup' | 'missed' | 'today' | 'future'
     */
getDayStatus(dayNumber) {
    const todayDate = this.dateToYYYYMMDD(new Date());
    const dayDate = this.getCycleDayDate(dayNumber);

    const checkedEntry = this.checkinData.checkedDays.find(d => d.day === dayNumber);
    const isMakeup = this.checkinData.makeupDays.some(d => d.day === dayNumber);

    if (checkedEntry) {
        return isMakeup ? 'makeup' : 'checked';
    }
    if (dayDate < todayDate) {
        if (!this.checkinData.firstCheckinDone) {
            return 'blank';
        }
        return 'missed';
    }
    if (dayDate === todayDate) {
        return 'today';
    }
    return 'future';
}

    /**
     * 获取所有漏签的天数
     */
getMissedDays() {
    const missed = [];
    for (let day = 1; day <= CHECKIN_CONFIG.CYCLE_DAYS; day++) {
        if (this.getDayStatus(day) === 'missed') {
            missed.push(day);
        }
    }
    return missed;
}

    /**
     * 是否有漏签天数
     */
hasMissedDays() {
    return this.getMissedDays().length > 0;
}

    /**
     * 内部方法：执行签到写入
     */
_doCheckin(date, dayNumber, type) {
    if (this.checkinData.checkedDays.some(d => d.day === dayNumber)) {
        return { success: false, message: '该天已签到' };
    }

    this.checkinData.checkedDays.push({ date, day: dayNumber, type });
    this.checkinData.firstCheckinDone = true;
    this.checkinData.lastCheckinTime = Date.now();
    this.checkinData.lastCheckinDate = date;
    this.checkinData.totalCheckinDays++;
    this.checkinData.consecutiveDays = this.getConsecutiveDays();

    const reward = this.grantCheckinReward(dayNumber);

    if (this.checkinData.consecutiveDays >= CHECKIN_CONFIG.CYCLE_DAYS) {
        console.log('[Game] 🎉 已完成7天签到！');
    }

    this.saveCheckinData();
    return { success: true, day: dayNumber, reward, type };
}

    /**
     * 内部方法：重置周期（断签后重新开始）
     */
_resetCycleForNewStart(todayDate) {
    const preservedTotal = this.checkinData.totalCheckinDays || 0;
    this.checkinData = {
        version: CHECKIN_CONFIG.DATA_VERSION,
        weekStartDate: todayDate,
        checkedDays: [],
        makeupDays: [],
        lastCheckinTime: 0,
        lastCheckinDate: 0,
        totalCheckinDays: preservedTotal,
        consecutiveDays: 0,
        firstCheckinDone: false
    };
    this.saveCheckinData();
    console.log('[Game] 签到周期已重置，今天为 Day 1');
}

    /**
     * 执行签到（严格日级判断）
     */
performCheckin() {
    const todayDate = this.dateToYYYYMMDD(new Date());
    console.log('[Game] 执行签到，当前连续天数:', this.getConsecutiveDays());

    // 检查是否已经签到过
    if (this.checkinData.checkedDays.some(d => d.date === todayDate)) {
        console.log('[Game] 今天已经签到过了');
        return { success: false, message: '今天已经签到过了' };
    }

    const daysSinceWeekStart = this.dateDiffDays(this.checkinData.weekStartDate, todayDate);

    // 首次签到：以今天为 Day 1 开始新周期
    if (!this.checkinData.firstCheckinDone) {
        console.log('[Game] 首次签到，今天为 Day 1');
        this._resetCycleForNewStart(todayDate);
        return this._doCheckin(todayDate, 1, 'normal');
    }

    // 周期内（0~6天偏移）
    if (daysSinceWeekStart >= 0 && daysSinceWeekStart < CHECKIN_CONFIG.CYCLE_DAYS) {
        const dayNumber = daysSinceWeekStart + 1;
        const allPreviousChecked = this.checkinData.checkedDays
            .filter(d => d.day < dayNumber).length === dayNumber - 1;

        if (allPreviousChecked) {
            return this._doCheckin(todayDate, dayNumber, 'normal');
        }
        // 有漏签 → 重置周期
        console.log('[Game] 检测到漏签，重置签到周期');
        this._resetCycleForNewStart(todayDate);
        return this._doCheckin(todayDate, 1, 'normal');
    }

    // 周期已过期或异常
    console.log('[Game] 签到周期已过期，重新开始');
    this._resetCycleForNewStart(todayDate);
    return this._doCheckin(todayDate, 1, 'normal');
}

    /**
     * 看广告补签
     */
async performMakeupCheckin(dayNumber) {
    const status = this.getDayStatus(dayNumber);
    if (status !== 'missed') {
        return { success: false, message: '该日期无法补签' };
    }

    const adWatched = await this.adManager.showRewardedAd(CHECKIN_CONFIG.MAKEUP_AD_PLACEMENT);
    if (!adWatched) {
        return { success: false, message: '广告未完整观看，补签失败' };
    }

    const dayDate = this.getCycleDayDate(dayNumber);
    const result = this._doCheckin(dayDate, dayNumber, 'makeup');

    if (result.success) {
        this.checkinData.makeupDays.push({ date: dayDate, day: dayNumber });
        this.saveCheckinData();
        console.log('[Game] ✅ 补签成功，第', dayNumber, '天');
    }
    return result;
}

    /**
     * 计算连续签到天数（兼容旧调用）
     */
calculateConsecutiveDays() {
    return this.getConsecutiveDays();
}

    /**
     * 发放签到奖励
     * 根据天数从 CHECKIN_CONFIG.DAILY_REWARDS 查表发放
     * 奇数天+1体力，偶数天+50金币，第7天无限体力
     */
grantCheckinReward(dayNumber) {
    const rewardConfig = CHECKIN_CONFIG.DAILY_REWARDS[dayNumber - 1];
    if (!rewardConfig) {
        console.warn('[Game] ⚠️ 签到天数超出奖励配置:', dayNumber);
        return { type: 'stamina', amount: 0 };
    }

    switch (rewardConfig.type) {
        case 'stamina':
            if (this.staminaManager) {
                this.staminaManager.data.current += rewardConfig.amount;
                this.staminaManager.save();
                console.log(`[Game] ✅ 签到奖励：+${rewardConfig.amount}体力，当前:`, this.staminaManager.data.current);
            }
            return { type: 'stamina', amount: rewardConfig.amount, coins: 0 };

        case 'coins':
            if (this.coinManager) {
                this.coinManager.addCoins(rewardConfig.amount, 'checkin_reward');
                console.log(`[Game] ✅ 签到奖励：+${rewardConfig.amount}金币`);
            }
            return { type: 'coins', amount: rewardConfig.amount, coins: rewardConfig.amount };

        case 'unlimited':
            if (this.staminaManager) {
                this.staminaManager.enableUnlimitedStamina(24 * 60 * 60 * 1000);
                console.log('[Game] ✅ 签到奖励：24小时无限体力');
            }
            return { type: 'unlimited', duration: rewardConfig.duration, coins: 0 };

        default:
            console.warn('[Game] ⚠️ 未知奖励类型:', rewardConfig.type);
            return { type: 'stamina', amount: 0, coins: 0 };
    }
}

    // ========== 签到日期工具方法 ==========

    dateToYYYYMMDD(date) {
        return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    }

    dateFromYYYYMMDD(yyyymmdd) {
        const year = Math.floor(yyyymmdd / 10000);
        const month = Math.floor((yyyymmdd % 10000) / 100);
        const day = yyyymmdd % 100;
        return new Date(year, month - 1, day);
    }

    addDaysToDate(yyyymmdd, days) {
        const date = this.dateFromYYYYMMDD(yyyymmdd);
        date.setDate(date.getDate() + days);
        return this.dateToYYYYMMDD(date);
    }

    dateDiffDays(dateA, dateB) {
        const a = this.dateFromYYYYMMDD(dateA);
        const b = this.dateFromYYYYMMDD(dateB);
        const msPerDay = 24 * 60 * 60 * 1000;
        return Math.round((b - a) / msPerDay);
    }

    getCycleDayDate(dayNumber) {
        return this.addDaysToDate(this.checkinData.weekStartDate, dayNumber - 1);
    }

    /**
     * 获取目标名称
     * @param {string} targetId - 目标ID
     * @returns {string} 目标名称
     */
    getTargetName(targetId) {
        const target = TARGET_TYPES.find(t => t.id === targetId);
        return target ? target.name : '猫咪';
    }

    /**
     * 展示游戏结束返回首页的插屏广告
     * 概率：80%
     */
    async showGameOverHomeAd() {
        const AD_PROBABILITY = 0.8;  // 80%概率

        if (Math.random() < AD_PROBABILITY) {
            console.log('[Game] 🎬 触发游戏结束返回首页插屏广告 (80%概率)');
            const adShown = await this.adManager.showInterstitialAd('game_over_home');
            if (adShown) {
                console.log('[Game] ✅ 插屏广告展示成功');
            } else {
                console.log('[Game] ❌ 插屏广告展示失败（频控限制或其他原因）');
            }
        } else {
            console.log('[Game] 🎲 本次不展示插屏广告');
        }
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
    async exitToSelect() {
        console.log('[Game] 退出到结算页面');

        // 如果正在游戏中，先触发游戏结束流程
        if (this.stateManager.previousState === GameState.PLAYING) {
            // 保存当前分数（endGame 之前保存）
            this.saveCurrentGameScore();

            // 调用 endGame() 进入结算页面
            await this.endGame();
        } else {
            // 如果不在游戏中，直接返回选择界面
            this.stateManager.resetToSelect();
            this.targets = [];
            this.selectionScreen.reset();

            // 切换回菜单 BGM
            this.audioManager.playBGM('menu', { volume: AUDIO_CONFIG.BGM_VOLUME.select });
        }
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
                    this.adManager.showBannerAd();  // 显示Banner广告
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
