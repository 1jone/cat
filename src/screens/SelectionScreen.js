/**
 * SelectionScreen - 选择界面
 * 负责目标选择界面的逻辑和渲染
 */

import { SELECTION_CONFIG, TARGET_TYPES, COIN_CONFIG } from '../config';
import { drawRoundRect } from '../utils/CanvasUtils';
import { ButterflyRenderer } from '../entities/ButterflyRenderer';
import { MouseRenderer } from '../entities/MouseRenderer';
import { FishRenderer } from '../entities/FishRenderer';
import { BirdRenderer } from '../entities/BirdRenderer';
import { LadybugRenderer } from '../entities/LadybugRenderer';
import { MosquitoRenderer } from '../entities/MosquitoRenderer';
import { StaticLineRenderer } from '../entities/StaticLineRenderer';
import { JellyfishRenderer } from '../entities/JellyfishRenderer';
import { BouncyBallRenderer } from '../entities/BouncyBallRenderer';
import { BubbleFishRenderer } from '../entities/BubbleFishRenderer';

export class SelectionScreen {
    constructor(canvas, ctx, resourceManager, adManager = null, settingsManager = null,
                emojiManager = null, butterflyRenderer = null, mouseRenderer = null,
                fishRenderer = null, yarnRenderer = null, multilineRenderer = null,
                birdRenderer = null, ladybugRenderer = null, staticLineRenderer = null,
                staminaManager = null, mosquitoRenderer = null,
                jellyfishRenderer = null, bouncyballRenderer = null, bubblefishRenderer = null,
                coinManager = null) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.resourceManager = resourceManager;
        this.adManager = adManager;  // 广告管理器
        this.settingsManager = settingsManager;  // 设置管理器（用于获取最高分）
        this.emojiManager = emojiManager;  // Emoji 管理器
        this.butterflyRenderer = butterflyRenderer || new ButterflyRenderer();  // 蝴蝶渲染器
        this.mouseRenderer = mouseRenderer || new MouseRenderer();  // 老鼠渲染器
        this.fishRenderer = fishRenderer || new FishRenderer();  // 小鱼渲染器
        this.yarnRenderer = yarnRenderer;  // 毛线球渲染器
        this.multilineRenderer = multilineRenderer;  // 多线渲染器
        this.birdRenderer = birdRenderer || new BirdRenderer();  // 小鸟渲染器
        this.ladybugRenderer = ladybugRenderer || new LadybugRenderer();  // 萤火虫渲染器
        this.staticLineRenderer = staticLineRenderer || new StaticLineRenderer();  // 静态线群渲染器
        this.mosquitoRenderer = mosquitoRenderer || new MosquitoRenderer();  // 蚊子渲染器
        this.jellyfishRenderer = jellyfishRenderer || new JellyfishRenderer();  // 水母渲染器
        this.bouncyballRenderer = bouncyballRenderer || new BouncyBallRenderer();  // 弹力球渲染器
        this.bubblefishRenderer = bubblefishRenderer || new BubbleFishRenderer();  // 气泡鱼渲染器
        this.staminaManager = staminaManager;  // 体力管理器
        this.coinManager = coinManager;  // 金币管理器
        this.dpr = 1;  // 设备像素比

        // 滚动选择相关属性
        this.scrollOffset = 0;
        this.scrollVelocity = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartOffset = 0;
        this.currentIndex = 0;
        this.autoScrollTimer = 0;
        this.lastTouchX = 0;
        this.lastTouchTime = 0;
        this.isSnapping = false;

        // 解锁确认弹窗状态
        this.showUnlockDialog = false;
        this.unlockDialogTarget = null;
        this.unlockDialogButtons = null;

        // 购买体力按钮区域
        this.buyStaminaButtonArea = null;

        // 购买体力弹窗状态
        this.showBuyStaminaDialog = false;
        this.buyStaminaDialogButtons = null;
        this.unlimitedStaminaAdPlaying = false;  // 是否正在播放无限体力广告

        // 模式选择弹窗状态
        this.showModeDialog = false;
        this.selectedTarget = null;
        this.isTrialMode = false;  // 试玩模式标记

        // 粒子动画时间
        this.particleTime = 0;

        // 新增：插屏广告相关
        this.selectionEnterTime = Date.now();  // 进入选择页面的时间
        this.interstitialAdTimer = 0;  // 插屏广告计时器
        this.interstitialAdInterval = 20000;  // 每20秒检查一次是否展示插屏广告
        this.interstitialAdProbability = 0.4;  // 40%概率展示插屏广告

        // 初始化粒子状态
        this.initParticleStates();
    }

    /**
     * 初始化粒子状态（用于粒子预览）
     */
    initParticleStates() {
        this.particleStates = new Map();

        // 为每个粒子类型目标初始化状态
        for (const item of this.resourceManager.selectionItems) {
            if (item.config.renderType === 'particle') {
                const particleCount = item.config.id === 'laser' ? 4 : 6;
                const particles = [];

                for (let i = 0; i < particleCount; i++) {
                    const angle = (i / particleCount) * Math.PI * 2;
                    particles.push({
                        angle: angle,
                        phase: Math.random() * Math.PI * 2,
                        radiusOffset: Math.random() * 0.3 - 0.15,
                        size: 0.8 + Math.random() * 0.4,
                    });
                }

                this.particleStates.set(item.config.id, {
                    particles: particles,
                    randomPhase: Math.random() * Math.PI * 2
                });
            }
        }
    }

    /**
     * 获取粒子配置（适配卡片尺寸）
     */
    getParticleConfig(config, cardSize) {
        const baseRadius = cardSize * 0.35;  // 基于卡片尺寸

        return {
            coreRadius: baseRadius * 0.4,
            coreColor: config.id === 'laser' ? '#FF0000' : '#FFD700',
            glowRadius: baseRadius * 1.5,
            glowColor: config.id === 'laser' ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 215, 0, 0.3)',
            particleCount: config.id === 'laser' ? 4 : 6,
            particleRadius: baseRadius * 0.15,
            orbitRadius: baseRadius * 0.8,
            orbitSpeed: config.id === 'laser' ? 4 : 2,
            pulseSpeed: config.id === 'laser' ? 6 : 3,
            pulseAmplitude: 0.3,
            twinkleSpeed: config.id === 'laser' ? 10 : 5,
            twinkleMin: 0.6,
            twinkleMax: 1.0,
        };
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
     * 设置广告管理器
     * @param {AdManager} adManager - 广告管理器实例
     */
    setAdManager(adManager) {
        this.adManager = adManager;
    }

    /**
     * 重置滚动状态
     */
    reset() {
        this.scrollOffset = 0;
        this.scrollVelocity = 0;
        this.isDragging = false;
        this.currentIndex = 0;
        this.autoScrollTimer = 0;
        this.isSnapping = false;
        this.showUnlockDialog = false;
        this.unlockDialogTarget = null;
        this.showModeDialog = false;
        this.selectedTarget = null;

        // 重置插屏广告计时器
        this.selectionEnterTime = Date.now();
        this.interstitialAdTimer = 0;
    }

    /**
     * 根据目标ID选中对应卡片
     * @param {string} targetId - 目标ID
     */
    selectTargetById(targetId) {
        const items = this.resourceManager.selectionItems;
        const targetIndex = items.findIndex(item => item.config.id === targetId);

        if (targetIndex !== -1) {
            const cardStep = SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING;
            this.currentIndex = targetIndex;
            this.scrollOffset = targetIndex * cardStep;
            this.autoScrollTimer = 0;
            console.log(`[SelectionScreen] 选中目标: ${targetId}, 索引: ${targetIndex}`);
        } else {
            console.warn(`[SelectionScreen] 未找到目标: ${targetId}`);
        }
    }

    /**
     * 处理触摸开始
     * @param {object} pos - 触摸位置 { x, y }
     */
    handleTouchStart(pos) {
        this.isDragging = true;
        this.dragStartX = pos.x;
        this.dragStartOffset = this.scrollOffset;
        this.lastTouchX = pos.x;
        this.lastTouchTime = performance.now();
        this.scrollVelocity = 0;
        this.isSnapping = false;
    }

    /**
     * 处理触摸移动
     * @param {object} pos - 触摸位置 { x, y }
     */
    handleTouchMove(pos) {
        if (!this.isDragging) return;

        const deltaX = pos.x - this.dragStartX;
        this.scrollOffset = this.dragStartOffset - deltaX;

        // 计算滚动速度（添加上限防止过快滑动）
        const now = performance.now();
        const dt = now - this.lastTouchTime;
        if (dt > 0) {
            const rawVelocity = (this.lastTouchX - pos.x) / dt * 16;
            const maxVelocity = 25; // 最大速度限制
            this.scrollVelocity = Math.max(-maxVelocity, Math.min(maxVelocity, rawVelocity));
        }
        this.lastTouchX = pos.x;
        this.lastTouchTime = now;

        // 边界限制（允许一点弹性）
        const cardStep = SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING;
        const maxOffset = (this.resourceManager.selectionItems.length - 1) * cardStep;
        const elasticRange = 50;

        if (this.scrollOffset < -elasticRange) {
            this.scrollOffset = -elasticRange;
        }
        if (this.scrollOffset > maxOffset + elasticRange) {
            this.scrollOffset = maxOffset + elasticRange;
        }
    }

    /**
     * 处理触摸结束
     * @param {object} pos - 触摸位置 { x, y }
     * @returns {object|null} 选中的目标配置或 null
     */
    handleTouchEnd(pos) {
        // 优先级1: 模式选择弹窗
        if (this.showModeDialog) {
            return this.handleModeDialogClick(pos);
        }

        // 优先级1.5: 购买体力弹窗
        if (this.showBuyStaminaDialog) {
            return this.handleBuyStaminaDialogClick(pos);
        }

        // 优先级2: 解锁弹窗
        if (this.showUnlockDialog) {
            return this.handleUnlockDialogClick(pos);
        }

        // 优先级2.5: 购买体力按钮
        if (this.buyStaminaButtonArea && this.isInRect(pos, this.buyStaminaButtonArea)) {
            this.isDragging = false;
            this.autoScrollTimer = 0;
            this.handleBuyStamina();
            return null;
        }

        // 优先级3: 主按钮（立即开玩）
        if (this.mainButtonArea && this.isInRect(pos, this.mainButtonArea)) {
            this.isDragging = false;
            this.autoScrollTimer = 0;
            return this.handleCardClick(pos);
        }

        // 优先级4: 签到按钮
        if (this.checkinButtonArea && this.isInRect(pos, this.checkinButtonArea)) {
            this.isDragging = false;
            this.autoScrollTimer = 0;
            console.log('[SelectionScreen] 签到按钮点击');
            this.handleCheckin();
            return null;
        }

        // 优先级5: 加群按钮
        if (this.groupButtonArea && this.isInRect(pos, this.groupButtonArea)) {
            this.isDragging = false;
            this.autoScrollTimer = 0;
            console.log('[SelectionScreen] 加群按钮点击');
            this.handleGroupJoin();
            return null;
        }

        if (!this.isDragging) return null;

        this.isDragging = false;

        // 判断是点击还是滑动
        const dragDistance = Math.abs(pos.x - this.dragStartX);
        if (dragDistance < SELECTION_CONFIG.DRAG_THRESHOLD) {
            // 这是一个点击，检查是否点击了中间的卡片
            const result = this.handleCardClick(pos);
            this.autoScrollTimer = 0;
            return result;
        } else {
            // 这是一个滑动，启动惯性滚动
            this.isSnapping = true;
            this.autoScrollTimer = 0;
            return null;
        }
    }

    /**
     * 检测点是否在矩形区域内
     */
    isInRect(pos, rect) {
        return pos.x >= rect.x && pos.x <= rect.x + rect.width &&
               pos.y >= rect.y && pos.y <= rect.y + rect.height;
    }

    /**
     * 处理卡片点击
     * @param {object} pos - 点击位置 { x, y }
     * @returns {object|null} 选中的目标配置或 null
     */
    handleCardClick(pos) {
        const cardStep = SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING;
        const targetIndex = Math.round(this.scrollOffset / cardStep);
        const clampedIndex = Math.max(0, Math.min(this.resourceManager.selectionItems.length - 1, targetIndex));

        const { width: w, height: h } = this.getLogicalSize();
        const scale = w / 375;
        const BANNER_HEIGHT = 120 * scale;
        const contentBottom = h - BANNER_HEIGHT;
        const centerY = contentBottom * 0.32;
        const cardWidth = w * 0.55;
        const cardHeight = SELECTION_CONFIG.CARD_HEIGHT * scale * 0.75;
        const centerX = w / 2;

        // 检查点击是否在中间卡片区域内（扩大检测范围）
        if (pos.x >= centerX - cardWidth / 2 - 20 &&
            pos.x <= centerX + cardWidth / 2 + 20 &&
            pos.y >= centerY - cardHeight / 2 - 20 &&
            pos.y <= centerY + cardHeight / 2 + 50) {

            const selectedItem = this.resourceManager.selectionItems[clampedIndex].config;

            // 检查是否是需要广告解锁的目标
            if (this.adManager && selectedItem.unlock && selectedItem.unlock.adRequired) {
                const isUnlocked = this.adManager.isTargetUnlocked(selectedItem.id);
                const canTrial = this.adManager.canTrialPlay(selectedItem.id);

                if (!isUnlocked && !canTrial) {
                    // 既未解锁也不能试玩，显示解锁确认弹窗
                    this.showUnlockDialog = true;
                    this.unlockDialogTarget = selectedItem;
                    return null;
                }

                if (canTrial) {
                    // 可以试玩，标记为试玩模式
                    this.isTrialMode = true;
                    console.log('[SelectionScreen] 进入试玩模式:', selectedItem.id);
                }
            }

            // 显示模式选择弹窗（而不是直接返回配置）
            this.showModeDialog = true;
            this.selectedTarget = selectedItem;
            return null;
        }

        return null;
    }

    /**
     * 处理解锁弹窗点击
     * @param {object} pos - 点击位置 { x, y }
     * @returns {object|null} 解锁成功后返回目标配置
     */
    handleUnlockDialogClick(pos) {
        if (!this.unlockDialogButtons) return null;
        const btns = this.unlockDialogButtons;

        // 观看广告按钮
        const ad = btns.ad;
        if (pos.x >= ad.x && pos.x <= ad.x + ad.w && pos.y >= ad.y && pos.y <= ad.y + ad.h) {
            this.requestUnlockTarget();
            return null;
        }

        // 金币解锁按钮
        const coin = btns.coin;
        if (pos.x >= coin.x && pos.x <= coin.x + coin.w && pos.y >= coin.y && pos.y <= coin.y + coin.h) {
            this.requestCoinUnlock();
            return null;
        }

        // 取消按钮
        const cancel = btns.cancel;
        if (pos.x >= cancel.x && pos.x <= cancel.x + cancel.w && pos.y >= cancel.y && pos.y <= cancel.y + cancel.h) {
            this.showUnlockDialog = false;
            this.unlockDialogTarget = null;
            return null;
        }

        // 点击弹窗外部关闭
        const { width: logicalWidth, height: logicalHeight } = this.getLogicalSize();
        const centerX = logicalWidth / 2;
        const centerY = logicalHeight / 2;
        const dialogWidth = 300;
        const dialogHeight = 230;
        if (pos.x < centerX - dialogWidth / 2 ||
            pos.x > centerX + dialogWidth / 2 ||
            pos.y < centerY - dialogHeight / 2 ||
            pos.y > centerY + dialogHeight / 2) {
            this.showUnlockDialog = false;
            this.unlockDialogTarget = null;
        }

        return null;
    }

    /**
     * 请求解锁目标（观看广告）
     */
    async requestUnlockTarget() {
        if (!this.adManager || !this.unlockDialogTarget) return;

        const targetId = this.unlockDialogTarget.id;
        const success = await this.adManager.requestUnlock(targetId);

        if (success) {
            console.log(`[SelectionScreen] 目标 ${targetId} 解锁成功`);
            this.showUnlockDialog = false;
            this.unlockDialogTarget = null;
        } else {
            console.log(`[SelectionScreen] 目标 ${targetId} 解锁失败`);
            this.showUnlockDialog = false;
            this.unlockDialogTarget = null;
        }
    }

    /**
     * 请求金币永久解锁目标
     */
    requestCoinUnlock() {
        if (!this.coinManager || !this.unlockDialogTarget) return;

        const targetId = this.unlockDialogTarget.id;
        const result = this.coinManager.permanentUnlockTarget(targetId);

        if (result.success) {
            console.log(`[SelectionScreen] 目标 ${targetId} 金币永久解锁成功`);
            this.showUnlockDialog = false;
            this.unlockDialogTarget = null;
        } else {
            console.log(`[SelectionScreen] 目标 ${targetId} 金币解锁失败: 余额不足`);
        }
    }

    /**
     * 处理模式选择弹窗点击
     * @param {object} pos - 点击位置 { x, y }
     * @returns {object|null} 选择结果 { config, mode, isTrial } 或 null
     */
    handleModeDialogClick(pos) {
        const { width: logicalWidth, height: logicalHeight } = this.getLogicalSize();
        const centerX = logicalWidth / 2;
        const centerY = logicalHeight / 2;
        const buttonWidth = 120;
        const buttonHeight = 50;
        const buttonY = centerY + 30;

        // 保存试玩模式标记
        const isTrial = this.isTrialMode || false;

        // 无限模式按钮（左侧）
        const endlessX = centerX - 70;
        if (pos.x >= endlessX - buttonWidth / 2 &&
            pos.x <= endlessX + buttonWidth / 2 &&
            pos.y >= buttonY - buttonHeight / 2 &&
            pos.y <= buttonY + buttonHeight / 2) {
            // 清除试玩标记
            this.isTrialMode = false;
            return { config: this.selectedTarget, mode: 'endless', isTrial };
        }

        // 闯关模式按钮（右侧）
        const challengeX = centerX + 70;
        if (pos.x >= challengeX - buttonWidth / 2 &&
            pos.x <= challengeX + buttonWidth / 2 &&
            pos.y >= buttonY - buttonHeight / 2 &&
            pos.y <= buttonY + buttonHeight / 2) {
            // 清除试玩标记
            this.isTrialMode = false;
            return { config: this.selectedTarget, mode: 'challenge', isTrial };
        }

        // 点击弹窗外部关闭
        const dialogWidth = 320;
        const dialogHeight = 200;
        if (pos.x < centerX - dialogWidth / 2 ||
            pos.x > centerX + dialogWidth / 2 ||
            pos.y < centerY - dialogHeight / 2 ||
            pos.y > centerY + dialogHeight / 2) {
            this.showModeDialog = false;
            this.selectedTarget = null;
        }

        return null;
    }

    /**
     * 更新选择界面逻辑
     * @param {number} dt - 时间增量（秒）
     */
    update(dt) {
        // 更新粒子动画时间
        if (typeof dt === 'number' && isFinite(dt)) {
            this.particleTime += dt;
        }

        // 检查是否应该展示插屏广告
        this.checkAndShowInterstitialAd(dt);

        const cardStep = SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING;
        const maxOffset = (this.resourceManager.selectionItems.length - 1) * cardStep;

        if (!this.isDragging) {
            // 惯性滚动 - 使用渐进式阻尼
            if (Math.abs(this.scrollVelocity) > 1) {
                // 边界附近增加阻尼，防止冲出太远
                let friction = SELECTION_CONFIG.SCROLL_FRICTION;
                if (this.scrollOffset < 0 || this.scrollOffset > maxOffset) {
                    friction = 0.7; // 超出边界时大幅增加阻尼
                }

                this.scrollOffset += this.scrollVelocity;
                this.scrollVelocity *= friction;

                // 硬边界限制，防止冲出太远
                const hardLimit = cardStep * 0.5;
                if (this.scrollOffset < -hardLimit) {
                    this.scrollOffset = -hardLimit;
                    this.scrollVelocity = 0;
                }
                if (this.scrollOffset > maxOffset + hardLimit) {
                    this.scrollOffset = maxOffset + hardLimit;
                    this.scrollVelocity = 0;
                }
            } else {
                this.scrollVelocity = 0;
            }

            // 吸附到最近的卡片
            if (this.isSnapping || Math.abs(this.scrollVelocity) < 1) {
                const targetIndex = Math.round(this.scrollOffset / cardStep);
                const clampedIndex = Math.max(0, Math.min(this.resourceManager.selectionItems.length - 1, targetIndex));
                const targetOffset = clampedIndex * cardStep;

                // 平滑吸附
                this.scrollOffset += (targetOffset - this.scrollOffset) * SELECTION_CONFIG.SNAP_SPEED;

                // 如果接近目标位置，直接设置
                if (Math.abs(this.scrollOffset - targetOffset) < 0.5) {
                    this.scrollOffset = targetOffset;
                    this.currentIndex = clampedIndex;
                    this.isSnapping = false;
                }
            }

            // 边界回弹
            if (this.scrollOffset < 0) {
                this.scrollOffset += (0 - this.scrollOffset) * 0.2;
            }
            if (this.scrollOffset > maxOffset) {
                this.scrollOffset += (maxOffset - this.scrollOffset) * 0.2;
            }

            // 自动轮播
            this.autoScrollTimer += dt * 1000;
            if (this.autoScrollTimer >= SELECTION_CONFIG.AUTO_SCROLL_INTERVAL) {
                this.autoScrollTimer = 0;
                let nextIndex = this.currentIndex + 1;
                if (nextIndex >= this.resourceManager.selectionItems.length) {
                    nextIndex = 0;
                }
                this.currentIndex = nextIndex;
                this.isSnapping = true;

                // 如果从最后一个到第一个，需要特殊处理
                if (nextIndex === 0 && this.scrollOffset > cardStep) {
                    this.scrollVelocity = -this.scrollOffset / 10;
                }
            }
        } else {
            // 正在拖动时重置自动轮播计时器
            this.autoScrollTimer = 0;
        }
    }

    // ==================== 金币相关方法 ====================

    /**
     * 处理签到
     */
    handleCheckin() {
        if (!this.coinManager) return;
        const result = this.coinManager.doCheckin();
        if (!result.success) {
            console.log('[SelectionScreen] 签到失败:', result.reason);
        } else {
            console.log(`[SelectionScreen] 签到成功: +${result.reward} 金币, 连续${result.consecutiveDays}天`);
        }
    }

    /**
     * 处理加群奖励领取
     */
    handleGroupJoin() {
        if (!this.coinManager) return;
        const state = this.coinManager.getGroupJoinRewardState();
        if (!state.canClaim) {
            console.log('[SelectionScreen] 加群奖励已领取');
            return;
        }
        // 打开加群（由外部 Game.js 中的 chatGroupManager 处理）
        // 加群成功后通过 claimGroupJoinReward 领取
        // 这里先标记为已领取（实际应在加群成功回调中）
        const result = this.coinManager.claimGroupJoinReward();
        if (result.success) {
            console.log(`[SelectionScreen] 加群奖励: +${result.reward} 金币`);
        }
    }

    /**
     * 打开购买体力弹窗
     */
    handleBuyStamina() {
        this.showBuyStaminaDialog = true;
    }

    /**
     * 处理购买体力弹窗点击
     */
    handleBuyStaminaDialogClick(pos) {
        if (!this.buyStaminaDialogButtons) return null;
        const btns = this.buyStaminaDialogButtons;

        // 选项1: 150金币买1点体力
        const opt1 = btns.option1;
        if (opt1 && pos.x >= opt1.x && pos.x <= opt1.x + opt1.w && pos.y >= opt1.y && pos.y <= opt1.y + opt1.h) {
            this.executeBuyStamina1();
            return null;
        }

        // 选项2: 299金币买2点体力
        const opt2 = btns.option2;
        if (opt2 && pos.x >= opt2.x && pos.x <= opt2.x + opt2.w && pos.y >= opt2.y && pos.y <= opt2.y + opt2.h) {
            this.executeBuyStamina2();
            return null;
        }

        // 选项3: 看3个广告获24h无限体力
        const opt3 = btns.option3;
        if (opt3 && pos.x >= opt3.x && pos.x <= opt3.x + opt3.w && pos.y >= opt3.y && pos.y <= opt3.y + opt3.h) {
            this.executeWatchAdForUnlimited();
            return null;
        }

        // 取消按钮
        const cancel = btns.cancel;
        if (cancel && pos.x >= cancel.x && pos.x <= cancel.x + cancel.w && pos.y >= cancel.y && pos.y <= cancel.y + cancel.h) {
            this.showBuyStaminaDialog = false;
            return null;
        }

        // 点击弹窗外关闭
        const { width: logicalWidth, height: logicalHeight } = this.getLogicalSize();
        const cx = logicalWidth / 2, cy = logicalHeight / 2;
        const dw = 300, dh = 320;
        if (pos.x < cx - dw / 2 || pos.x > cx + dw / 2 || pos.y < cy - dh / 2 || pos.y > cy + dh / 2) {
            this.showBuyStaminaDialog = false;
        }

        return null;
    }

    executeBuyStamina1() {
        if (!this.coinManager || !this.staminaManager) return;
        const result = this.coinManager.buyStamina1(this.staminaManager);
        if (result.success) {
            console.log('[SelectionScreen] 150金币购买1点体力成功');
            this.showBuyStaminaDialog = false;
        }
    }

    executeBuyStamina2() {
        if (!this.coinManager || !this.staminaManager) return;
        const result = this.coinManager.buyStamina2(this.staminaManager);
        if (result.success) {
            console.log('[SelectionScreen] 299金币购买2点体力成功');
            this.showBuyStaminaDialog = false;
        }
    }

    async executeWatchAdForUnlimited() {
        if (!this.adManager || !this.coinManager || !this.staminaManager) return;
        if (this.unlimitedStaminaAdPlaying) return;

        this.unlimitedStaminaAdPlaying = true;
        const adResult = await this.adManager.showStaminaAd();
        this.unlimitedStaminaAdPlaying = false;

        if (adResult.success) {
            const progress = this.coinManager.recordUnlimitedStaminaAd();
            if (progress.completed) {
                this.staminaManager.enableUnlimitedStamina(COIN_CONFIG.STAMINA_AD_DURATION);
                console.log('[SelectionScreen] 观看广告完成，无限体力已激活');
                this.showBuyStaminaDialog = false;
            } else {
                console.log(`[SelectionScreen] 广告观看 ${progress.progress}/${progress.total}`);
            }
        }
    }

    /**
     * 渲染金币余额（左上角，体力恢复时间下方）
     */
    renderCoinDisplay() {
        if (!this.coinManager) return;
        const ctx = this.ctx;
        const balance = this.coinManager.getBalance();
        const scale = this.canvas.width / this.dpr / 375;
        const x = 20;
        const y = 90;

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';

        ctx.fillStyle = '#FFA500';
        ctx.font = `bold ${Math.round(14 * scale)}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const coinText = `💰 ${balance}`;
        ctx.strokeText(coinText, x, y);
        ctx.fillText(coinText, x, y);
    }

    /**
     * 渲染体力显示（左上角，简化版）
     */
    renderStaminaDisplay() {
        if (!this.staminaManager) return;

        const x = 20;
        const y = 55;

        if (this.staminaManager.isUnlimitedStamina()) {
            this.buyStaminaButtonArea = null;
            this._renderUnlimitedStaminaDisplay(x, y);
        } else {
            this._renderNormalStaminaDisplay(x, y);
        }
    }

    /**
     * 渲染普通体力显示（含购买按钮）
     */
    _renderNormalStaminaDisplay(x, y) {
        const ctx = this.ctx;
        const scale = this.canvas.width / this.dpr / 375;
        const current = this.staminaManager.getCurrentStamina();
        const max = this.staminaManager.getMaxStamina();

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';

        // 体力文字
        const text = `⚡ ${current}/${max}`;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);

        // +购买 按钮（紧跟体力文字右侧）
        const textWidth = ctx.measureText(text).width;
        const btnX = x + textWidth + 8 * scale;
        const btnW = 54 * scale;
        const btnH = 20 * scale;
        const btnY = y - btnH / 2;

        drawRoundRect(ctx, btnX, btnY, btnW, btnH, 10 * scale);
        ctx.fillStyle = '#FF9800';
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(11 * scale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+购买', btnX + btnW / 2, btnY + btnH / 2);

        this.buyStaminaButtonArea = {
            x: btnX,
            y: btnY,
            width: btnW,
            height: btnH
        };

        // 体力未满时显示恢复时间
        if (current < max) {
            const nextRestoreTime = this.staminaManager.getNextRestoreTime();
            if (nextRestoreTime > 0) {
                const minutes = Math.floor(nextRestoreTime / 60000);
                const seconds = Math.floor((nextRestoreTime % 60000) / 1000);
                const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                ctx.font = '12px Arial';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.textBaseline = 'top';

                const restoreText = `⏰ ${timeStr} 后恢复`;
                ctx.strokeText(restoreText, x, y + 14);
                ctx.fillText(restoreText, x, y + 14);
            }
        }
    }

    /**
     * 渲染无限体力显示（金色脉冲 + 倒计时）
     */
    _renderUnlimitedStaminaDisplay(x, y) {
        const pulse = 0.85 + Math.sin(this.particleTime * 2) * 0.15;
        const text = '无限体力';

        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'middle';

        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.lineJoin = 'round';

        this.ctx.strokeText(text, x, y);
        this.ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
        this.ctx.fillText(text, x, y);

        // 显示剩余时间倒计时
        const remainingMs = this.staminaManager.getUnlimitedStaminaRemainingTime();
        if (remainingMs > 0) {
            const hours = Math.floor(remainingMs / 3600000);
            const minutes = Math.floor((remainingMs % 3600000) / 60000);
            const seconds = Math.floor((remainingMs % 60000) / 1000);
            const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

            this.ctx.font = '12px Arial';
            this.ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
            this.ctx.textBaseline = 'top';

            const countdownText = `⏰ 剩余 ${timeStr}`;
            this.ctx.strokeText(countdownText, x, y + 14);
            this.ctx.fillText(countdownText, x, y + 14);
        }
    }

    /**
     * 渲染选择界面（新版竖屏卡片布局）
     */
    render() {
        const ctx = this.ctx;
        const { width: w, height: h } = this.getLogicalSize();
        const scale = w / 375;

        // === 1. 渐变背景 ===
        this.renderBackground(ctx, w, h);

        // === 2. 体力显示 ===
        this.renderStaminaDisplay();

        // === 2.5 金币余额 + 购买体力按钮 ===
        this.renderCoinDisplay();

        // === 3. 标题 ===
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(26 * scale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('选择目标', w / 2, 80 * scale);

        // === 4. 布局参数 ===
        const BOTTOM_SAFE = 60 * scale;
        const cardWidth = w * 0.55;
        const cardStep = cardWidth + 16 * scale;

        // 可用高度（标题下方到Banner上方）
        const titleBottom = 95 * scale;
        const availableH = h - titleBottom - BOTTOM_SAFE;

        // 卡片高度自适应：大屏用配置值，小屏压缩
        const rawCardH = SELECTION_CONFIG.CARD_HEIGHT * scale * 0.75;
        const cardHeight = Math.min(rawCardH, availableH * 0.32);
        const cardCenterY = titleBottom + cardHeight / 2 + 20 * scale;

        // === 5. 渲染滚动卡片列表 ===
        const centerX = w / 2;
        const renderOrder = [];
        for (let i = 0; i < this.resourceManager.selectionItems.length; i++) {
            const cardStepRatio = cardStep / (SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING);
            const cardOffset = i * cardStep - this.scrollOffset * cardStepRatio;
            renderOrder.push({ index: i, offset: cardOffset, absOffset: Math.abs(cardOffset) });
        }
        renderOrder.sort((a, b) => b.absOffset - a.absOffset);

        for (const item of renderOrder) {
            this.renderCardScaled(item.index, centerX, cardCenterY, item.offset, cardWidth, cardHeight, cardStep);
        }

        // === 6. 卡片光效装饰（中间卡片发光 + 漂浮粒子） ===
        this.renderCardGlow(centerX, cardCenterY, cardWidth, cardHeight, scale);

        // === 7. 分页指示点 ===
        const cardBottom = cardCenterY + cardHeight / 2 + 35 * scale;

        // 下方内容总高度（指示点到排行榜底部）
        const BTN_H = 48 * scale;
        const CHECKIN_H = 62 * scale;
        const GROUP_H = 58 * scale;
        const RANK_H = 58 * scale;
        const MIN_GAP = 10 * scale;
        const contentH = MIN_GAP + BTN_H + MIN_GAP + CHECKIN_H + MIN_GAP + GROUP_H + MIN_GAP + RANK_H;
        const contentStart = cardBottom;

        // 如果内容超出可用空间，等比压缩间距
        const totalNeeded = contentH;
        const spaceLeft = (h - BOTTOM_SAFE) - contentStart;
        const compressionRatio = spaceLeft < totalNeeded ? spaceLeft / totalNeeded : 1;
        const gap = MIN_GAP * compressionRatio;
        const btnH = BTN_H * compressionRatio;
        const checkinH = CHECKIN_H * Math.max(0.8, compressionRatio);
        const groupH = GROUP_H * Math.max(0.8, compressionRatio);
        const rankH = RANK_H * Math.max(0.8, compressionRatio);

        const indicatorY = contentStart;
        // this.renderIndicatorsScaled(indicatorY, cardStep);

        // === 8. 主按钮（带呼吸动画） ===
        const mainBtnY = indicatorY + gap;
        this.renderMainButton(centerX, mainBtnY, w * 0.6, btnH, scale);

        // === 9. 签到卡片 ===
        const checkinCardY = mainBtnY + btnH + gap;
        this.renderCheckinCardScaled(w, checkinCardY, scale, checkinH);

        // === 10. 加群卡片 ===
        const groupCardY = checkinCardY + checkinH + gap;
        this.renderGroupCardScaled(w, groupCardY, scale, groupH);

        // === 11. 排行榜卡片 ===
        const rankCardY = groupCardY + groupH + gap;
        this.renderRankCardScaled(w, rankCardY, scale, rankH);

        // === 12. 弹窗（优先级最高）===
        if (this.showModeDialog) {
            this.renderModeDialog();
        }
        if (this.showBuyStaminaDialog) {
            this.renderBuyStaminaDialog();
        }
        if (this.showUnlockDialog && this.unlockDialogTarget) {
            this.renderUnlockDialog();
        }
    }

    /**
     * 渲染渐变背景
     */
    renderBackground(ctx, w, h) {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#4A90D9');
        grad.addColorStop(1, '#87CEEB');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }

    /**
     * 检查目标是否锁定
     */
    isTargetLocked(config) {
        if (!config.unlock || !config.unlock.adRequired) return false;
        if (!this.adManager) return false;
        return !this.adManager.isTargetUnlocked(config.id);
    }

    /**
     * 检查是否可以试玩
     */
    canTrialPlay(config) {
        if (!config.unlock || !config.unlock.adRequired) return false;
        if (!this.adManager) return false;
        return this.adManager.canTrialPlay(config.id);
    }

    /**
     * 渲染指示器小圆点（适配缩放版）
     * @param {number} y - Y 坐标
     * @param {number} cardStep - 卡片步长
     */
    renderIndicatorsScaled(y, cardStep) {
        const ctx = this.ctx;
        const { width: w } = this.getLogicalSize();
        const scale = w / 375;
        const dotSize = 7 * scale;
        const dotSpacing = 14 * scale;
        const items = this.resourceManager.selectionItems;
        const totalWidth = (items.length - 1) * dotSpacing;
        const startX = (w - totalWidth) / 2;

        const scaledCardStep = SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING;
        const currentIndex = Math.round(this.scrollOffset / scaledCardStep);

        for (let i = 0; i < items.length; i++) {
            const x = startX + i * dotSpacing;
            const isActive = i === Math.max(0, Math.min(items.length - 1, currentIndex));

            ctx.beginPath();
            ctx.arc(x, y, isActive ? dotSize + 1 : dotSize, 0, Math.PI * 2);
            ctx.fillStyle = isActive ? '#FFD700' : 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
        }
    }

    /**
     * 渲染缩放版卡片
     */
    renderCardScaled(index, centerX, centerY, offset, cardWidth, cardHeight, cardStep) {
        const ctx = this.ctx;
        const item = this.resourceManager.selectionItems[index];
        const { width: w } = this.getLogicalSize();
        const scale = w / 375;

        const distanceRatio = Math.min(Math.abs(offset) / cardStep, 1);
        const sideScale = 0.85;
        const sideOpacity = 0.5;
        const scaleVal = 1 - distanceRatio * (1 - sideScale);
        const opacity = 1 - distanceRatio * (1 - sideOpacity);

        const x = centerX + offset;

        if (x < -cardWidth || x > w + cardWidth) return;

        ctx.save();
        ctx.globalAlpha = opacity;

        const scaledW = cardWidth * scaleVal;
        const scaledH = cardHeight * scaleVal;

        // 卡片背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        drawRoundRect(ctx, x - scaledW / 2 - 6, centerY - scaledH / 2 - 6, scaledW + 12, scaledH + 38, 14 * scaleVal);
        ctx.fill();

        // 金色边框（中间卡片）或灰色（两侧）
        if (distanceRatio < 0.3) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2.5;
        } else {
            ctx.strokeStyle = '#CCCCCC';
            ctx.lineWidth = 1.5;
        }
        ctx.stroke();

        // 渲染目标内容
        if (item.config.renderType === 'particle') {
            const imgSize = scaledW * 0.7;
            const imgCenterY = centerY - scaledH / 2 + 14 + imgSize / 2;
            this.renderParticlePreview(x, imgCenterY, scaledW, item.config, scaleVal);
        } else if (item.config.renderType === 'canvas' || item.config.renderer) {
            this.renderCanvasPreviewScaled(x, centerY, scaledW, scaledH, item.config, scaleVal);
        } else if (item.config.renderType === 'multiline') {
            this.renderCanvasPreviewScaled(x, centerY, scaledW, scaledH, item.config, scaleVal);
        } else if (item.loaded) {
            const imgSize = scaledW * 0.7;
            ctx.drawImage(item.image, x - imgSize / 2, centerY - scaledH / 2 + 14, imgSize, imgSize);
        } else {
            ctx.fillStyle = '#CCCCCC';
            const imgSize = scaledW * 0.7;
            ctx.fillRect(x - imgSize / 2, centerY - scaledH / 2 + 14, imgSize, imgSize);
        }

        // 名称
        ctx.fillStyle = '#333333';
        ctx.font = `bold ${Math.round(14 * scaleVal)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(item.config.name, x, centerY + scaledH / 2 + 14);

        // 分数
        ctx.fillStyle = '#666666';
        ctx.font = `${Math.round(11 * scaleVal)}px Arial`;
        ctx.fillText(`${item.config.points}分/个`, x, centerY + scaledH / 2 + 28);

        // 最高分（显示在卡片内部顶部）
        if (this.settingsManager) {
            const highScore = this.settingsManager.getTargetHighScore(item.config.id);
            if (highScore > 0) {
                ctx.fillStyle = '#FFD700';
                ctx.font = `bold ${Math.round(10 * scaleVal)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(`最高: ${highScore}`, x, centerY - scaledH / 2 + 2);
            }
        }

        // 锁定状态
        const isLocked = this.isTargetLocked(item.config);
        if (isLocked) {
            this.renderLockOverlayScaled(x, centerY, scaledW, scaledH, scaleVal, item.config);
        } else {
            this.renderUnlockTimerScaled(x, centerY, scaledH, scaleVal, item.config);
        }

        // 试玩徽章
        if (this.canTrialPlay(item.config)) {
            this.renderTrialBadgeScaled(x, centerY, scaledW, scaledH, scaleVal);
        }

        ctx.restore();
    }

    /**
     * 渲染 Canvas 预览（适配缩放版）
     */
    renderCanvasPreviewScaled(x, y, scaledWidth, scaledHeight, config, scale) {
        const ctx = this.ctx;
        const imgSize = scaledWidth * 0.8;
        const imgCenterY = y - scaledHeight / 2 + 10 + imgSize / 2;
        const time = this.particleTime;

        if (config.id === 'butterfly') {
            this.butterflyRenderer.render(ctx, { x, y: imgCenterY }, imgSize / 2, 0, time, scale, false, 0);
        } else if (config.id === 'mouse') {
            const rendererScale = (imgSize / 2) / 40;
            this.mouseRenderer.render(ctx, x, imgCenterY, rendererScale, time, { isStartled: false });
        } else if (config.id === 'fish') {
            const rendererScale = (imgSize / 2) / 52;
            this.fishRenderer.render(ctx, x, imgCenterY, rendererScale, time, { isStartled: false, isPreview: true });
        } else if (config.id === 'bird') {
            this.birdRenderer.render(ctx, { x, y: imgCenterY }, imgSize / 2 * 0.75, 0, time, scale, false, 0);
        } else if (config.id === 'ladybug') {
            this.ladybugRenderer.render(ctx, { x, y: imgCenterY }, imgSize / 2, 0, time, scale);
        } else if (config.id === 'mosquito') {
            this.mosquitoRenderer.render(ctx, { x, y: imgCenterY }, imgSize / 2, 0, time, scale, false, 0);
        } else if (config.id === 'jellyfish') {
            this.jellyfishRenderer.render(ctx, { x, y: imgCenterY }, imgSize / 2, 0, time, scale, false, 0);
        } else if (config.id === 'bouncyball') {
            this.bouncyballRenderer.render(ctx, { x, y: imgCenterY }, imgSize / 2, 0, time, scale, false, 0);
        } else if (config.id === 'bubblefish') {
            const bubbleState = { hp: 3, maxHp: 3, isStartled: false, clickIntensity: 0 };
            this.bubblefishRenderer.render(ctx, { x, y: imgCenterY }, imgSize / 2, 0, time, scale, false, 0, bubbleState);
        } else if (config.id === 'yarn') {
            this.staticLineRenderer.render(ctx, x, imgCenterY, scale);
        } else {
            ctx.fillStyle = '#CCCCCC';
            ctx.fillRect(x - imgSize / 2, imgCenterY - imgSize / 2, imgSize, imgSize);
        }
    }

    /**
     * 渲染锁定遮罩（适配缩放版）
     */
    renderLockOverlayScaled(x, y, width, height, scale, config) {
        const ctx = this.ctx;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        drawRoundRect(ctx, x - width / 2 - 8, y - height / 2 - 8, width + 16, height + 50, 16 * scale);
        ctx.fill();

        // 锁图标
        if (this.emojiManager) {
            this.emojiManager.draw(ctx, 'lock', x, y - 10 * scale, 36 * scale);
        } else {
            ctx.font = `bold ${36 * scale}px Arial`;
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔒', x, y - 10 * scale);
        }

        ctx.font = `bold ${Math.round(13 * scale)}px Arial`;
        ctx.fillStyle = '#FFD700';
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'center';
        ctx.fillText('观看广告解锁', x, y + 28 * scale);

        ctx.font = `${Math.round(11 * scale)}px Arial`;
        ctx.fillStyle = '#AAAAAA';
        let timeLeft = config.unlock.unlockDuration;
        if (timeLeft > 0) {
            ctx.fillText(`解锁后有效${timeLeft / 1000 / 60 / 60}小时`, x, y + 46 * scale);
        } else if (timeLeft === -1 || timeLeft === 0) {
            ctx.fillText('解锁后永久有效', x, y + 46 * scale);
        }
    }

    /**
     * 渲染解锁剩余时间（适配缩放版）
     */
    renderUnlockTimerScaled(x, y, height, scale, config) {
        if (!this.adManager || !config.unlock || config.unlock.type !== 'ad') return;
        const remaining = this.adManager.getUnlockRemainingTime(config.id);
        if (remaining <= 0) return;

        const ctx = this.ctx;
        const timerText = this.adManager.formatRemainingTime(remaining);
        ctx.font = `bold ${Math.round(9 * scale)}px Arial`;
        ctx.fillStyle = '#4CAF50';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(`剩余 ${timerText}`, x, y + height / 3);
    }

    /**
     * 渲染试玩徽章（适配缩放版）
     */
    renderTrialBadgeScaled(x, y, width, height, scale) {
        const ctx = this.ctx;
        const badgeSize = 44 * scale;
        const badgeX = x + width / 2 - 8;
        const badgeY = y - height / 2 - 8;

        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#FF6B35';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = `bold ${Math.round(13 * scale)}px Arial`;
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('试玩', badgeX, badgeY);
    }

    /**
     * 渲染卡片光效（发光 + 漂浮粒子）
     */
    renderCardGlow(cx, cy, cardW, cardH, scale) {
        const ctx = this.ctx;
        const time = this.particleTime;

        // 中心柔光脉冲
        const pulse = 0.12 + Math.sin(time * 1.8) * 0.06;
        const glowRadius = Math.max(1, cardW * 0.55);
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
        glow.addColorStop(0, `rgba(255, 215, 0, ${pulse})`);
        glow.addColorStop(0.6, `rgba(255, 215, 0, ${pulse * 0.3})`);
        glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(cx - glowRadius, cy - glowRadius, glowRadius * 2, glowRadius * 2);

        // 漂浮小粒子（6颗，缓慢环绕）
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + time * 0.3;
            const radiusX = cardW * 0.38 + Math.sin(time * 0.8 + i) * 6 * scale;
            const radiusY = cardH * 0.42 + Math.cos(time * 0.6 + i * 1.5) * 5 * scale;
            const px = cx + Math.cos(angle) * radiusX;
            const py = cy + Math.sin(angle) * radiusY;
            const size = (2 + Math.sin(time * 2 + i * 2) * 1) * scale;
            const alpha = 0.3 + Math.sin(time * 1.5 + i) * 0.15;

            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 230, 150, ${alpha})`;
            ctx.fill();
        }
    }

    /**
     * 渲染主按钮（带呼吸动画）
     */
  renderMainButton(cx, cy, width, height, scale) {
    const ctx = this.ctx;

    // ======================
    // 【关键：添加按钮上边距】
    // 增大这个值 = 按钮越往下移
    // ======================
    const marginTop = 20 * scale; 

    // 按钮坐标：整体往下移动 marginTop
    const btnX = cx - width / 2;
    const btnY = cy - height / 2 + marginTop; // <-- 这里加了上边距

    // 呼吸动画：轻微缩放脉冲
    const breath = 1 + Math.sin(this.particleTime * 2.5) * 0.015;
    const breathOffset = (1 - breath) * height / 2;

    ctx.save();

    // 外发光（呼吸）
    const glowAlpha = 0.25 + Math.sin(this.particleTime * 2.5) * 0.1;
    ctx.shadowColor = `rgba(255, 100, 0, ${glowAlpha})`;
    ctx.shadowBlur = 18 * scale;
    ctx.shadowOffsetY = 6 * scale;

    // 橙色渐变（更高对比）
    const grad = ctx.createLinearGradient(btnX, btnY + breathOffset, btnX, btnY + height - breathOffset);
    grad.addColorStop(0, '#FFB347');
    grad.addColorStop(0.5, '#FF8C00');
    grad.addColorStop(1, '#E65100');

    drawRoundRect(ctx, btnX, btnY + breathOffset, width, height - breathOffset * 2, 25 * scale);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();

    // 白色文字（自动跟着按钮下移）
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.round(18 * scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🔥 立刻开玩', cx, cy + marginTop); // <-- 文字同步下移

    // 点击区域同步下移（非常重要）
    this.mainButtonArea = { 
        x: btnX, 
        y: btnY, // <-- 点击区也下移
        width, 
        height 
    };
}

    /**
     * 渲染签到卡片（自适应高度）
     */
    renderCheckinCardScaled(screenWidth, y, scale, cardH) {
        const ctx = this.ctx;
        const cardW = screenWidth * 0.9;
        const cardX = (screenWidth - cardW) / 2;

        const checkinState = this.coinManager ? this.coinManager.getCheckinState() : { canCheckin: true, consecutiveDays: 0, todayReward: 0 };
        const isChecked = !checkinState.canCheckin;

        ctx.fillStyle = isChecked ? '#F5F5F5' : '#E8F5E9';
        drawRoundRect(ctx, cardX, y, cardW, cardH, 12 * scale);
        ctx.fill();

        ctx.font = `${Math.round(20 * scale)}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('📅', cardX + 12 * scale, y + cardH / 2);

        const textX = cardX + 42 * scale;
        ctx.fillStyle = '#333333';
        ctx.font = `bold ${Math.round(13 * scale)}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText('今日签到', textX, y + 16 * scale);

        ctx.fillStyle = '#E65100';
        ctx.font = `bold ${Math.round(10 * scale)}px Arial`;

        if (isChecked) {
            ctx.fillStyle = '#999999';
            ctx.fillText('✅ 今日已签到', textX, y + 33 * scale);
        } else {
            const groupTag = checkinState.hasGroupBonus ? '🔥今日双倍  ' : '';
            const dayText = `第${checkinState.consecutiveDays}天`;
            const rewardText = `🎁 +${checkinState.todayReward}金币`;
            ctx.fillText(`${groupTag}${dayText} ${rewardText}`, textX, y + 33 * scale);
        }

        ctx.fillStyle = '#999999';
        ctx.font = `${Math.round(9 * scale)}px Arial`;
        ctx.fillText('连续签到奖励更丰厚', textX, y + 48 * scale);

        const btnW = 68 * scale;
        const btnH = 30 * scale;
        const btnX = cardX + cardW - btnW - 10 * scale;
        const btnY = y + (cardH - btnH) / 2;

        drawRoundRect(ctx, btnX, btnY, btnW, btnH, 15 * scale);
        ctx.fillStyle = isChecked ? '#BDBDBD' : '#43A047';
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(11 * scale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isChecked ? '已签到' : '领取奖励', btnX + btnW / 2, btnY + btnH / 2);

        if (!isChecked) {
            ctx.beginPath();
            ctx.arc(btnX + btnW - 2 * scale, btnY + 2 * scale, 5 * scale, 0, Math.PI * 2);
            ctx.fillStyle = '#FF1744';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(btnX + btnW - 2 * scale, btnY + 2 * scale, 2.5 * scale, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
        }

        this.checkinButtonArea = { left: btnX, right: btnX + btnW, top: btnY, bottom: btnY + btnH };
    }

    /**
     * 渲染加群卡片（自适应高度）
     */
    renderGroupCardScaled(screenWidth, y, scale, cardH) {
        const ctx = this.ctx;
        const cardW = screenWidth * 0.9;
        const cardX = (screenWidth - cardW) / 2;

        const groupState = this.coinManager ? this.coinManager.getGroupJoinRewardState() : { canClaim: true };
        const isClaimed = !groupState.canClaim;

        ctx.fillStyle = isClaimed ? '#F5F5F5' : '#FFF8E1';
        drawRoundRect(ctx, cardX, y, cardW, cardH, 12 * scale);
        ctx.fill();

        ctx.font = `${Math.round(20 * scale)}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎁', cardX + 12 * scale, y + cardH / 2);

        const textX = cardX + 42 * scale;
        ctx.fillStyle = '#333333';
        ctx.font = `bold ${Math.round(13 * scale)}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText(isClaimed ? '加群奖励' : '加群立领100金币', textX, y + 16 * scale);

        ctx.fillStyle = '#888888';
        ctx.font = `${Math.round(10 * scale)}px Arial`;
        ctx.fillText('✔ 签到奖励翻倍  ✔ 每日额外奖励', textX, y + 34 * scale);

        const btnW = 60 * scale;
        const btnH = 30 * scale;
        const btnX = cardX + cardW - btnW - 10 * scale;
        const btnY = y + (cardH - btnH) / 2;

        drawRoundRect(ctx, btnX, btnY, btnW, btnH, 15 * scale);
        ctx.fillStyle = isClaimed ? '#BDBDBD' : '#FF9800';
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(11 * scale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isClaimed ? '已领取' : '去加群', btnX + btnW / 2, btnY + btnH / 2);

        this.groupButtonArea = { left: btnX, right: btnX + btnW, top: btnY, bottom: btnY + btnH };
    }

    /**
     * 渲染排行榜卡片（自适应高度）
     */
    renderRankCardScaled(screenWidth, y, scale, cardH) {
        const ctx = this.ctx;
        const cardW = screenWidth * 0.9;
        const cardX = (screenWidth - cardW) / 2;

        ctx.fillStyle = '#E3F2FD';
        drawRoundRect(ctx, cardX, y, cardW, cardH, 12 * scale);
        ctx.fill();

        ctx.font = `${Math.round(20 * scale)}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏆', cardX + 12 * scale, y + cardH / 2);

        const textX = cardX + 42 * scale;
        ctx.fillStyle = '#333333';
        ctx.font = `bold ${Math.round(13 * scale)}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText('排行榜', textX, y + 16 * scale);

        ctx.fillStyle = '#888888';
        ctx.font = `${Math.round(10 * scale)}px Arial`;
        ctx.fillText('与好友比拼分数，冲击榜首', textX, y + 34 * scale);

        const btnW = 60 * scale;
        const btnH = 30 * scale;
        const btnX = cardX + cardW - btnW - 10 * scale;
        const btnY = y + (cardH - btnH) / 2;

        drawRoundRect(ctx, btnX, btnY, btnW, btnH, 15 * scale);
        ctx.fillStyle = '#2196F3';
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(11 * scale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('排行榜', btnX + btnW / 2, btnY + btnH / 2);

        this.rankButtonArea = { left: btnX, right: btnX + btnW, top: btnY, bottom: btnY + btnH };
    }

    /**
     * 渲染签到卡片
     */
    renderCheckinCard(screenWidth, y, scale) {
        const ctx = this.ctx;
        const cardW = screenWidth * 0.9;
        const cardH = 62 * scale;
        const cardX = (screenWidth - cardW) / 2;

        // 浅绿色背景
        ctx.fillStyle = '#E8F5E9';
        drawRoundRect(ctx, cardX, y, cardW, cardH, 12 * scale);
        ctx.fill();

        // 左侧日历图标
        ctx.font = `${Math.round(22 * scale)}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('📅', cardX + 14 * scale, y + cardH / 2);

        // 文案
        const textX = cardX + 46 * scale;
        ctx.fillStyle = '#333333';
        ctx.font = `bold ${Math.round(14 * scale)}px Arial`;
        ctx.fillText('今日签到', textX, y + 18 * scale);

        ctx.fillStyle = '#E65100';
        ctx.font = `bold ${Math.round(11 * scale)}px Arial`;
        ctx.fillText('🔥今日双倍  第3天 🎁 +200金币', textX, y + 37 * scale);

        ctx.fillStyle = '#999999';
        ctx.font = `${Math.round(10 * scale)}px Arial`;
        ctx.fillText('连续签到奖励更丰厚', textX, y + 53 * scale);

        // 右侧按钮
        const btnW = 72 * scale;
        const btnH = 32 * scale;
        const btnX = cardX + cardW - btnW - 12 * scale;
        const btnY = y + (cardH - btnH) / 2;

        drawRoundRect(ctx, btnX, btnY, btnW, btnH, 16 * scale);
        ctx.fillStyle = '#43A047';
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(12 * scale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('领取奖励', btnX + btnW / 2, btnY + btnH / 2);

        // 红点提示
        ctx.beginPath();
        ctx.arc(btnX + btnW - 2 * scale, btnY + 2 * scale, 6 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#FF1744';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(btnX + btnW - 2 * scale, btnY + 2 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // 记录点击区域
        this.checkinButtonArea = {
            left: btnX,
            right: btnX + btnW,
            top: btnY,
            bottom: btnY + btnH
        };
    }

    /**
     * 渲染加群卡片
     */
    renderGroupCard(screenWidth, y, scale) {
        const ctx = this.ctx;
        const cardW = screenWidth * 0.9;
        const cardH = 58 * scale;
        const cardX = (screenWidth - cardW) / 2;

        // 米色背景
        ctx.fillStyle = '#FFF8E1';
        drawRoundRect(ctx, cardX, y, cardW, cardH, 12 * scale);
        ctx.fill();

        // 左侧礼物图标
        ctx.font = `${Math.round(22 * scale)}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('🎁', cardX + 14 * scale, y + cardH / 2);

        // 文案
        const textX = cardX + 46 * scale;
        ctx.fillStyle = '#333333';
        ctx.font = `bold ${Math.round(14 * scale)}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText('加群立领100金币', textX, y + 18 * scale);

        ctx.fillStyle = '#888888';
        ctx.font = `${Math.round(11 * scale)}px Arial`;
        ctx.fillText('✔ 签到奖励翻倍  ✔ 每日额外奖励', textX, y + 38 * scale);

        // 右侧按钮
        const btnW = 64 * scale;
        const btnH = 32 * scale;
        const btnX = cardX + cardW - btnW - 12 * scale;
        const btnY = y + (cardH - btnH) / 2;

        drawRoundRect(ctx, btnX, btnY, btnW, btnH, 16 * scale);
        ctx.fillStyle = '#FF9800';
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(12 * scale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('去加群', btnX + btnW / 2, btnY + btnH / 2);

        // 记录点击区域
        this.groupButtonArea = {
            left: btnX,
            right: btnX + btnW,
            top: btnY,
            bottom: btnY + btnH
        };
    }

    /**
     * 渲染排行榜卡片
     */
    renderRankCard(screenWidth, y, scale) {
        const ctx = this.ctx;
        const cardW = screenWidth * 0.9;
        const cardH = 58 * scale;
        const cardX = (screenWidth - cardW) / 2;

        // 浅蓝色背景
        ctx.fillStyle = '#E3F2FD';
        drawRoundRect(ctx, cardX, y, cardW, cardH, 12 * scale);
        ctx.fill();

        // 左侧奖杯图标
        ctx.font = `${Math.round(22 * scale)}px Arial`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏆', cardX + 14 * scale, y + cardH / 2);

        // 文案
        const textX = cardX + 46 * scale;
        ctx.fillStyle = '#333333';
        ctx.font = `bold ${Math.round(14 * scale)}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText('排行榜', textX, y + 18 * scale);

        ctx.fillStyle = '#888888';
        ctx.font = `${Math.round(11 * scale)}px Arial`;
        ctx.fillText('与好友比拼分数，冲击榜首', textX, y + 38 * scale);

        // 右侧按钮
        const btnW = 64 * scale;
        const btnH = 32 * scale;
        const btnX = cardX + cardW - btnW - 12 * scale;
        const btnY = y + (cardH - btnH) / 2;

        drawRoundRect(ctx, btnX, btnY, btnW, btnH, 16 * scale);
        ctx.fillStyle = '#2196F3';
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold ${Math.round(12 * scale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('排行榜', btnX + btnW / 2, btnY + btnH / 2);

        // 记录点击区域
        this.rankButtonArea = {
            left: btnX,
            right: btnX + btnW,
            top: btnY,
            bottom: btnY + btnH
        };
    }

    /**
     * 渲染购买体力弹窗
     */
    renderBuyStaminaDialog() {
        const ctx = this.ctx;
        const { width: logicalWidth, height: logicalHeight } = this.getLogicalSize();
        const centerX = logicalWidth / 2;
        const centerY = logicalHeight / 2;
        const dialogWidth = 300;
        const dialogHeight = 320;

        // 全屏遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);

        // 弹窗背景
        const gradient = ctx.createLinearGradient(
            centerX - dialogWidth / 2, centerY - dialogHeight / 2,
            centerX + dialogWidth / 2, centerY + dialogHeight / 2
        );
        gradient.addColorStop(0, 'rgba(50, 50, 70, 0.98)');
        gradient.addColorStop(1, 'rgba(30, 30, 50, 0.98)');

        drawRoundRect(ctx, centerX - dialogWidth / 2, centerY - dialogHeight / 2, dialogWidth, dialogHeight, 20);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 标题
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡ 补充体力', centerX, centerY - 130);

        // 当前金币
        const balance = this.coinManager ? this.coinManager.getBalance() : 0;
        ctx.fillStyle = '#FFA500';
        ctx.font = '14px Arial';
        ctx.fillText(`当前 💰 ${balance}`, centerX, centerY - 105);

        // 选项按钮
        const btnW = 240;
        const btnH = 48;
        const btnX = centerX - btnW / 2;
        const gap = 12;

        // 选项1: 150金币 → +1体力
        const y1 = centerY - 72;
        const canAfford1 = this.coinManager && this.coinManager.canAfford(COIN_CONFIG.STAMINA_PRICE_1);
        drawRoundRect(ctx, btnX, y1, btnW, btnH, 12);
        ctx.fillStyle = canAfford1 ? '#43A047' : '#555555';
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('⚡ +1 体力', centerX, y1 + 17);
        ctx.font = '13px Arial';
        ctx.fillStyle = canAfford1 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)';
        ctx.fillText(`💰 ${COIN_CONFIG.STAMINA_PRICE_1}`, centerX, y1 + 36);

        // 选项2: 299金币 → +2体力
        const y2 = y1 + btnH + gap;
        const canAfford2 = this.coinManager && this.coinManager.canAfford(COIN_CONFIG.STAMINA_PRICE_2);
        drawRoundRect(ctx, btnX, y2, btnW, btnH, 12);
        ctx.fillStyle = canAfford2 ? '#1976D2' : '#555555';
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('⚡ +2 体力', centerX, y2 + 17);
        ctx.font = '13px Arial';
        ctx.fillStyle = canAfford2 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)';
        ctx.fillText(`💰 ${COIN_CONFIG.STAMINA_PRICE_2}`, centerX, y2 + 36);

        // 选项3: 看广告 → 24h无限体力
        const y3 = y2 + btnH + gap;
        const adProgress = this.coinManager ? this.coinManager.getUnlimitedStaminaAdProgress() : 0;
        const adTotal = COIN_CONFIG.STAMINA_AD_COUNT;
        const isWatching = this.unlimitedStaminaAdPlaying;
        drawRoundRect(ctx, btnX, y3, btnW, btnH, 12);
        ctx.fillStyle = isWatching ? '#666666' : '#E65100';
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('🌟 24小时无限体力', centerX, y3 + 17);
        ctx.font = '13px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        const progressText = `观看广告 ${adProgress}/${adTotal}`;
        ctx.fillText(isWatching ? '加载中...' : progressText, centerX, y3 + 36);

        // 取消按钮
        const cancelY = y3 + btnH + gap;
        const cancelW = 100;
        const cancelH = 34;
        drawRoundRect(ctx, centerX - cancelW / 2, cancelY, cancelW, cancelH, 10);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '14px Arial';
        ctx.fillText('取消', centerX, cancelY + cancelH / 2);

        // 保存按钮区域
        this.buyStaminaDialogButtons = {
            option1: { x: btnX, y: y1, w: btnW, h: btnH },
            option2: { x: btnX, y: y2, w: btnW, h: btnH },
            option3: { x: btnX, y: y3, w: btnW, h: btnH },
            cancel: { x: centerX - cancelW / 2, y: cancelY, w: cancelW, h: cancelH }
        };
    }

    /**
     * 渲染解锁确认弹窗
     */
    renderUnlockDialog() {
        const ctx = this.ctx;
        const { width: logicalWidth, height: logicalHeight } = this.getLogicalSize();
        const centerX = logicalWidth / 2;
        const centerY = logicalHeight / 2;
        const dialogWidth = 300;
        const dialogHeight = 230;

        // 全屏遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);

        // 弹窗背景
        const gradient = ctx.createLinearGradient(
            centerX - dialogWidth / 2,
            centerY - dialogHeight / 2,
            centerX + dialogWidth / 2,
            centerY + dialogHeight / 2
        );
        gradient.addColorStop(0, 'rgba(50, 50, 70, 0.98)');
        gradient.addColorStop(1, 'rgba(30, 30, 50, 0.98)');

        drawRoundRect(
            ctx,
            centerX - dialogWidth / 2,
            centerY - dialogHeight / 2,
            dialogWidth,
            dialogHeight,
            20
        );
        ctx.fillStyle = gradient;
        ctx.fill();

        // 金色边框
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 标题
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('解锁目标', centerX, centerY - 70);

        // 目标名称
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(this.unlockDialogTarget.name, centerX, centerY - 38);

        // 说明文字
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '13px Arial';
        ctx.fillText('选择解锁方式', centerX, centerY - 10);

        // 按钮
        const buttonWidth = 120;
        const buttonHeight = 38;

        // 观看广告按钮（左）
        const adX = centerX - 68;
        const adY = centerY + 30;
        drawRoundRect(ctx, adX - buttonWidth / 2, adY - buttonHeight / 2, buttonWidth, buttonHeight, 10);
        ctx.fillStyle = '#4CAF50';
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px Arial';
        ctx.fillText('观看广告', adX, adY - 5);
        ctx.font = '10px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('解锁24小时', adX, adY + 10);

        // 金币解锁按钮（右）
        const coinX = centerX + 68;
        const coinY = centerY + 30;
        const canAfford = this.coinManager ? this.coinManager.canAfford(COIN_CONFIG.PERMANENT_UNLOCK_PRICE) : false;
        drawRoundRect(ctx, coinX - buttonWidth / 2, coinY - buttonHeight / 2, buttonWidth, buttonHeight, 10);
        ctx.fillStyle = canAfford ? '#FF9800' : '#555555';
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px Arial';
        ctx.fillText(`💰 ${COIN_CONFIG.PERMANENT_UNLOCK_PRICE}`, coinX, coinY - 5);
        ctx.font = '10px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.fillText('永久解锁', coinX, coinY + 10);

        // 取消按钮（底部居中）
        const cancelY = centerY + 80;
        const cancelW = 80;
        const cancelH = 32;
        drawRoundRect(ctx, centerX - cancelW / 2, cancelY - cancelH / 2, cancelW, cancelH, 10);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '13px Arial';
        ctx.fillText('取消', centerX, cancelY);

        // 保存按钮区域
        this.unlockDialogButtons = {
            ad: { x: adX - buttonWidth / 2, y: adY - buttonHeight / 2, w: buttonWidth, h: buttonHeight },
            coin: { x: coinX - buttonWidth / 2, y: coinY - buttonHeight / 2, w: buttonWidth, h: buttonHeight },
            cancel: { x: centerX - cancelW / 2, y: cancelY - cancelH / 2, w: cancelW, h: cancelH }
        };
    }

    /**
     * 渲染模式选择弹窗
     */
    renderModeDialog() {
        const ctx = this.ctx;
        const { width: logicalWidth, height: logicalHeight } = this.getLogicalSize();
        const centerX = logicalWidth / 2;
        const centerY = logicalHeight / 2;
        const dialogWidth = 320;
        const dialogHeight = 200;

        // 全屏遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);

        // 弹窗背景
        const gradient = ctx.createLinearGradient(
            centerX - dialogWidth / 2,
            centerY - dialogHeight / 2,
            centerX + dialogWidth / 2,
            centerY + dialogHeight / 2
        );
        gradient.addColorStop(0, 'rgba(50, 50, 70, 0.98)');
        gradient.addColorStop(1, 'rgba(30, 30, 50, 0.98)');

        drawRoundRect(
            ctx,
            centerX - dialogWidth / 2,
            centerY - dialogHeight / 2,
            dialogWidth,
            dialogHeight,
            20
        );
        ctx.fillStyle = gradient;
        ctx.fill();

        // 金色边框
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 标题
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('选择游戏模式', centerX, centerY - 60);

        // 目标名称
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(this.selectedTarget.name, centerX, centerY - 25);

        // 按钮
        const buttonWidth = 120;
        const buttonHeight = 50;
        const buttonY = centerY + 30;

        // 无限模式按钮
        const endlessX = centerX - 70;
        const endlessGradient = ctx.createLinearGradient(
            endlessX - buttonWidth / 2,
            buttonY - buttonHeight / 2,
            endlessX + buttonWidth / 2,
            buttonY + buttonHeight / 2
        );
        endlessGradient.addColorStop(0, '#9C27B0');
        endlessGradient.addColorStop(1, '#6A1B9A');

        drawRoundRect(ctx, endlessX - buttonWidth / 2, buttonY - buttonHeight / 2,
                     buttonWidth, buttonHeight, 12);
        ctx.fillStyle = endlessGradient;
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('♾️ 无限模式', endlessX, buttonY - 8);
        ctx.font = '12px Arial';
        ctx.fillStyle = '#CCCCCC';
        ctx.fillText('无时间限制', endlessX, buttonY + 12);

        // 闯关模式按钮
        const challengeX = centerX + 70;
        drawRoundRect(ctx, challengeX - buttonWidth / 2, buttonY - buttonHeight / 2,
                     buttonWidth, buttonHeight, 12);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('⏱️ 闯关模式', challengeX, buttonY - 8);
        ctx.font = '12px Arial';
        ctx.fillStyle = '#CCCCCC';
        ctx.fillText('60秒挑战', challengeX, buttonY + 12);
    }

    /**
     * 渲染粒子预览效果
     * @param {number} x - 中心 X 坐标
     * @param {number} y - 中心 Y 坐标
     * @param {number} scaledWidth - 缩放后的卡片宽度
     * @param {object} config - 目标配置
     * @param {number} scale - 缩放比例
     */
    renderParticlePreview(x, y, scaledWidth, config, scale) {
        const ctx = this.ctx;
        const pConfig = this.getParticleConfig(config, scaledWidth);
        const state = this.particleStates.get(config.id);
        const time = this.particleTime + (state && state.randomPhase || 0);

        ctx.save();

        // 计算脉冲缩放
        const pulse = 1 + Math.sin(time * pConfig.pulseSpeed) * pConfig.pulseAmplitude;

        // 计算闪烁亮度
        const twinkle = pConfig.twinkleMin + (pConfig.twinkleMax - pConfig.twinkleMin) *
            (0.5 + 0.5 * Math.sin(time * pConfig.twinkleSpeed));

        // 1. 绘制外层光晕
        this.drawParticleGlow(ctx, x, y, pConfig.glowRadius * pulse, pConfig.glowColor, twinkle);

        // 2. 绘制中层光晕
        this.drawParticleGlow(ctx, x, y, pConfig.glowRadius * 0.6 * pulse, pConfig.glowColor, twinkle * 0.8);

        // 3. 绘制环绕粒子
        if (state) {
            this.drawParticleOrbits(ctx, x, y, time, pConfig, state.particles);
        }

        // 4. 绘制核心光点
        this.drawParticleCore(ctx, x, y, pConfig.coreRadius * pulse, pConfig.coreColor, twinkle);

        // 5. 绘制核心高光
        this.drawParticleHighlight(ctx, x, y, pConfig.coreRadius * pulse * 0.5, twinkle);

        ctx.restore();
    }

    /**
     * 绘制粒子光晕
     */
    drawParticleGlow(ctx, x, y, radius, color, alpha) {
        if (!color || typeof color !== 'string') return;
        const safeRadius = Math.max(1, radius);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, safeRadius);

        const baseColor = color.replace(/[\d.]+\)$/, '');
        gradient.addColorStop(0, baseColor + (0.6 * alpha) + ')');
        gradient.addColorStop(0.5, baseColor + (0.3 * alpha) + ')');
        gradient.addColorStop(1, baseColor + '0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, safeRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 绘制粒子核心
     */
    drawParticleCore(ctx, x, y, radius, color, alpha) {
        ctx.globalAlpha = alpha;

        const safeRadius = Math.max(1, radius);

        // 核心实心圆
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, safeRadius);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.3, color);
        gradient.addColorStop(1, this.darkenColor(color, 0.3));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, safeRadius, 0, Math.PI * 2);
        ctx.fill();

        // 外发光边缘
        ctx.shadowColor = color;
        ctx.shadowBlur = safeRadius * 2;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, safeRadius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.globalAlpha = 1;
    }

    /**
     * 绘制粒子高光
     */
    drawParticleHighlight(ctx, x, y, radius, alpha) {
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    /**
     * 绘制环绕粒子
     */
    drawParticleOrbits(ctx, centerX, centerY, time, pConfig, particles) {
        particles.forEach((particle) => {
            // 计算当前角度
            const currentAngle = particle.angle + time * pConfig.orbitSpeed + particle.phase;

            // 计算轨道半径
            const radius = pConfig.orbitRadius * (1 + particle.radiusOffset);

            // 计算位置
            const px = centerX + Math.cos(currentAngle) * radius;
            const py = centerY + Math.sin(currentAngle) * radius;

            // 计算粒子大小（带脉动）
            const sizePulse = 0.8 + 0.4 * Math.sin(time * 4 + particle.phase);
            const size = Math.max(1, pConfig.particleRadius * particle.size * sizePulse);

            // 计算粒子透明度
            const distanceAlpha = 0.5 + 0.5 * Math.cos(currentAngle - time * pConfig.orbitSpeed);

            // 绘制粒子
            ctx.globalAlpha = distanceAlpha * 0.8;

            const gradient = ctx.createRadialGradient(px, py, 0, px, py, size);
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.5, pConfig.coreColor);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;
    }

    /**
     * 辅助方法：加深颜色
     */
    darkenColor(color, factor) {
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);

            const dr = Math.floor(r * (1 - factor));
            const dg = Math.floor(g * (1 - factor));
            const db = Math.floor(b * (1 - factor));

            return `rgb(${dr}, ${dg}, ${db})`;
        }
        return color;
    }

    /**
     * 检查并展示插屏广告（在选择页面停留时随机触发）
     * @param {number} dt - 时间增量（秒）
     */
    checkAndShowInterstitialAd(dt) {
        // 如果没有广告管理器，不执行
        if (!this.adManager) return;

        // 如果有弹窗显示，不触发广告
        if (this.showUnlockDialog || this.showModeDialog) {
            return;
        }

        // 累积计时器
        this.interstitialAdTimer += dt * 1000;  // 转换为毫秒

        // 检查是否达到检查间隔
        if (this.interstitialAdTimer >= this.interstitialAdInterval) {
            this.interstitialAdTimer = 0;  // 重置计时器

            // 检查游戏启动时间是否超过30秒（抖音冷启动保护）
            const timeSinceGameStart = Date.now() - this.selectionEnterTime;
            const COLD_START_PROTECTION = 30000;  // 30秒冷启动保护

            if (timeSinceGameStart < COLD_START_PROTECTION) {
                console.log(`[SelectionScreen] ⏰ 冷启动保护中，暂不展示插屏广告 (${timeSinceGameStart/1000}s < ${COLD_START_PROTECTION/1000}s)`);
                return;
            }

            // 检查距离上次插屏广告是否超过60秒
            const timeSinceLastAd = Date.now() - this.adManager.lastInterstitialAdTime;
            const MIN_INTERSTITIAL_INTERVAL = 60000;  // 60秒最小间隔

            if (timeSinceLastAd < MIN_INTERSTITIAL_INTERVAL) {
                console.log(`[SelectionScreen] ⏰ 插屏广告冷却中，暂不展示 (${timeSinceLastAd/1000}s < ${MIN_INTERSTITIAL_INTERVAL/1000}s)`);
                return;
            }

            // 随机决定是否展示广告
            const shouldShow = Math.random() < this.interstitialAdProbability;

            if (shouldShow) {
                console.log('[SelectionScreen] 🎬 触发停留插屏广告');
                this.adManager.showInterstitialAd('selection_stay');
            } else {
                console.log('[SelectionScreen] 🎲 本次不展示插屏广告');
            }
        }
    }

    /**
     * 绘制圆形按钮
     */
    drawCircleButton(ctx, centerX, centerY, radius, bgColor, icon) {
        // 绘制圆形背景
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = bgColor;
        ctx.fill();

        // 绘制图标
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, centerX, centerY);
    }

    /**
     * 获取加群按钮区域（供 tt.onTouchStart 使用）
     * @returns {Object|null} 按钮区域 {left, right, top, bottom}
     */
    getGroupButtonArea() {
        return this.groupButtonArea || null;
    }

    /**
     * 获取签到按钮区域
     * @returns {Object|null} 按钮区域 {left, right, top, bottom}
     */
    getCheckinButtonArea() {
        return this.checkinButtonArea || null;
    }

    /**
     * 获取排行榜按钮区域
     * @returns {Object|null} 按钮区域 {left, right, top, bottom}
     */
    getRankButtonArea() {
        return this.rankButtonArea || null;
    }
}
