/**
 * AdManager - 广告管理器
 * 负责管理游戏中的广告解锁、触发和展示逻辑
 */
import { TARGET_TYPES, AD_CONFIG } from '../config.js';

export class AdManager {
    constructor(settingsManager) {
        this.settings = settingsManager;
        this.sessionAdCount = 0;
        this.lastAdTime = 0;
        this.consecutivePlays = 0;
        this.targetSessionAdCount = {};  // 每个目标的会话广告计数

        // 从本地存储加载解锁数据
        this.unlockData = this.settings.getUnlockData() || {};

        // 预加载广告实例
        this.rewardedAd = null;
        this.interstitialAd = null;

        // 新增：Banner广告和游戏推荐面板
        this.bannerAd = null;
        this.gridGamePanel = null;
        this.isBannerVisible = false;
        this.isGridPanelVisible = false;

        this.initAds();
    }

    /**
     * 初始化广告实例
     */
    initAds() {
        if (typeof tt === 'undefined') {
            console.log('[AdManager] 非抖音环境，广告功能禁用');
            return;
        }

        // 初始化激励视频广告
        if (tt.createRewardedVideoAd) {
            try {
                this.rewardedAd = tt.createRewardedVideoAd({
                    adUnitId: AD_CONFIG.adUnitIds.rewarded
                });
                this.rewardedAd.load();
                console.log('[AdManager] 激励视频广告初始化成功');
            } catch (err) {
                console.error('[AdManager] 激励视频广告初始化失败:', err);
            }
        }

        // 初始化插屏广告
        if (tt.createInterstitialAd) {
            try {
                this.interstitialAd = tt.createInterstitialAd({
                    adUnitId: AD_CONFIG.adUnitIds.interstitial
                });
                this.interstitialAd.load();
                console.log('[AdManager] 插屏广告初始化成功');
            } catch (err) {
                console.error('[AdManager] 插屏广告初始化失败:', err);
            }
        }
    }

    /**
     * 检查目标是否已解锁（考虑时效）
     * @param {string} targetId - 目标ID
     * @returns {boolean} 是否已解锁
     */
    isTargetUnlocked(targetId) {
        const target = TARGET_TYPES.find(t => t.id === targetId);
        if (!target) return false;

        // 免费目标始终解锁
        if (target.unlock.type === 'free') return true;

        // 检查是否有有效的解锁记录
        const unlockTime = this.unlockData[targetId];
        if (!unlockTime) return false;

        // 永久解锁（unlockDuration <= 0 或 -1）
        const duration = target.unlock.unlockDuration;
        if (duration <= 0) return true;

        // 检查是否过期
        const now = Date.now();
        if ((now - unlockTime) > duration) {
            // 已过期，清除记录
            delete this.unlockData[targetId];
            this.settings.saveUnlockData(this.unlockData);
            return false;
        }

        return true;
    }

    /**
     * 获取目标剩余解锁时间（毫秒）
     * @param {string} targetId - 目标ID
     * @returns {number} 剩余时间，-1表示永久解锁，0表示未解锁
     */
    getUnlockRemainingTime(targetId) {
        const target = TARGET_TYPES.find(t => t.id === targetId);
        if (!target || target.unlock.type === 'free') return -1;

        const unlockTime = this.unlockData[targetId];
        if (!unlockTime) return 0;

        // 永久解锁
        const duration = target.unlock.unlockDuration;
        if (duration <= 0) return -1;

        const now = Date.now();
        const remaining = (unlockTime + duration) - now;

        return Math.max(0, remaining);
    }

    /**
     * 格式化剩余时间显示
     * @param {number} remainingMs - 剩余毫秒数
     * @returns {string} 格式化的时间字符串
     */
    formatRemainingTime(remainingMs) {
        if (remainingMs < 0) return '永久';  // 永久解锁
        if (remainingMs === 0) return '';

        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}小时${minutes}分钟`;
        }
        return `${minutes}分钟`;
    }

    /**
     * 请求解锁目标（观看广告）
     * @param {string} targetId - 目标ID
     * @returns {Promise<boolean>} 是否解锁成功
     */
    async requestUnlock(targetId) {
        const target = TARGET_TYPES.find(t => t.id === targetId);
        if (!target || target.unlock.type !== 'ad') return false;

        const adWatched = await this.showRewardedAd('unlock_target');
        if (adWatched) {
            this.unlockData[targetId] = Date.now();
            this.settings.saveUnlockData(this.unlockData);
            this.recordAdShown();

            // 计算有效期描述
            const duration = target.unlock.unlockDuration;
            const durationText = duration <= 0 ? '永久' :
                duration >= 48 * 60 * 60 * 1000 ? '48小时' :
                duration >= 24 * 60 * 60 * 1000 ? '24小时' :
                `${Math.floor(duration / (60 * 60 * 1000))}小时`;

            console.log(`[AdManager] 目标 ${targetId} 解锁成功，有效期${durationText}`);
            return true;
        }
        return false;
    }

    /**
     * 检查是否应该触发选择广告
     * @param {Object} targetConfig - 目标配置
     * @returns {boolean} 是否应该触发广告
     */
    shouldTriggerSelectionAd(targetConfig) {
        if (!AD_CONFIG.globalEnabled) return false;
        if (!targetConfig.adTrigger || !targetConfig.adTrigger.enabled) return false;

        // 检查会话限制
        if (this.sessionAdCount >= AD_CONFIG.maxAdsPerSession) return false;

        const targetCount = this.targetSessionAdCount[targetConfig.id] || 0;
        if (targetCount >= targetConfig.adTrigger.maxPerSession) return false;

        // 检查冷却
        const timeSinceLastAd = (Date.now() - this.lastAdTime) / 1000;
        if (timeSinceLastAd < AD_CONFIG.minIntervalSeconds) return false;
        if (timeSinceLastAd < targetConfig.adTrigger.cooldown) return false;

        // 计算最终概率
        const finalProbability = this.calculateFinalProbability(targetConfig);

        const shouldTrigger = Math.random() < finalProbability;
        console.log(`[AdManager] 选择广告检查: ${targetConfig.id}, 概率=${finalProbability.toFixed(2)}, 触发=${shouldTrigger}`);
        return shouldTrigger;
    }

    /**
     * 检查无尽模式是否应该触发广告
     * @param {string} type - 广告类型 ('entry'|'unlock'|'gameOver')
     * @param {number} score - 当前分数（仅gameOver时使用）
     * @returns {boolean} 是否应该触发广告
     */
    shouldTriggerEndlessAd(type, score = 0) {
        if (!AD_CONFIG.globalEnabled) return false;

        const timeSinceLastAd = (Date.now() - this.lastAdTime) / 1000;
        if (timeSinceLastAd < AD_CONFIG.minIntervalSeconds) return false;

        let shouldTrigger = false;
        switch (type) {
            case 'entry':
                shouldTrigger = Math.random() < AD_CONFIG.endless.entryProbability;
                break;
            case 'unlock':
                shouldTrigger = Math.random() < AD_CONFIG.endless.unlockProbability;
                break;
            case 'gameOver':
                if (score < AD_CONFIG.endless.gameOverMinScore) return false;
                shouldTrigger = Math.random() < AD_CONFIG.endless.gameOverProbability;
                break;
            default:
                return false;
        }

        console.log(`[AdManager] 无尽模式广告检查: type=${type}, score=${score}, 触发=${shouldTrigger}`);
        return shouldTrigger;
    }

    /**
     * 计算最终广告概率
     * @param {Object} targetConfig - 目标配置
     * @returns {number} 最终概率 (0-1)
     */
    calculateFinalProbability(targetConfig) {
        let probability = targetConfig.adTrigger.probability;

        // 新用户降低概率
        const playCount = this.settings.getTotalPlayCount() || 0;
        if (playCount < 5) {
            probability *= AD_CONFIG.factors.newUser;
        }

        // 连续游戏增加概率
        const consecutiveFactor = Math.min(
            1 + this.consecutivePlays * AD_CONFIG.factors.consecutivePlays,
            2.0
        );
        probability *= consecutiveFactor;

        return Math.min(probability, 1.0);
    }

    /**
     * 显示激励视频广告
     * @param {string} placement - 广告位置标识
     * @returns {Promise<boolean>} 是否完整观看
     */
    async showRewardedAd(placement) {
        console.log(`[AdManager] 请求显示激励视频广告: ${placement}`);

        return new Promise((resolve) => {
            // 非抖音环境模拟
            if (typeof tt === 'undefined' || !this.rewardedAd) {
                console.log('[AdManager] 广告API不可用，模拟观看完成');
                setTimeout(() => resolve(true), 500);
                return;
            }

            const onClose = (res) => {
                this.rewardedAd.offClose(onClose);
                this.rewardedAd.offError(onError);

                if (res && res.isEnded) {
                    console.log('[AdManager] 激励视频观看完成');
                    resolve(true);
                } else {
                    console.log('[AdManager] 激励视频未完整观看');
                    resolve(false);
                }

                // 重新加载下一个广告
                this.rewardedAd.load();
            };

            const onError = (err) => {
                this.rewardedAd.offClose(onClose);
                this.rewardedAd.offError(onError);
                console.error('[AdManager] 激励视频广告错误:', err);
                resolve(false);
            };

            this.rewardedAd.onClose(onClose);
            this.rewardedAd.onError(onError);

            this.rewardedAd.show().catch((err) => {
                console.log('[AdManager] 激励视频显示失败，尝试重新加载');
                this.rewardedAd.load()
                    .then(() => this.rewardedAd.show())
                    .catch(() => {
                        this.rewardedAd.offClose(onClose);
                        this.rewardedAd.offError(onError);
                        resolve(false);
                    });
            });
        });
    }

    /**
     * 显示插屏广告
     * @param {string} placement - 广告位置标识
     * @returns {Promise<boolean>} 是否显示成功
     */
    async showInterstitialAd(placement) {
        console.log(`[AdManager] 请求显示插屏广告: ${placement}`);

        return new Promise((resolve) => {
            // 非抖音环境模拟
            if (typeof tt === 'undefined' || !this.interstitialAd) {
                console.log('[AdManager] 插屏广告API不可用');
                resolve(false);
                return;
            }

            const onClose = () => {
                this.interstitialAd.offClose(onClose);
                this.interstitialAd.offError(onError);
                console.log('[AdManager] 插屏广告关闭');
                resolve(true);

                // 重新加载下一个广告
                this.interstitialAd.load();
            };

            const onError = (err) => {
                this.interstitialAd.offClose(onClose);
                this.interstitialAd.offError(onError);
                console.error('[AdManager] 插屏广告错误:', err);
                resolve(false);
            };

            this.interstitialAd.onClose(onClose);
            this.interstitialAd.onError(onError);

            this.interstitialAd.show().catch((err) => {
                console.log('[AdManager] 插屏广告显示失败，尝试重新加载');
                this.interstitialAd.load()
                    .then(() => this.interstitialAd.show())
                    .catch(() => {
                        this.interstitialAd.offClose(onClose);
                        this.interstitialAd.offError(onError);
                        resolve(false);
                    });
            });
        });
    }

    /**
     * 记录广告展示
     * @param {string|null} targetId - 目标ID（可选）
     */
    recordAdShown(targetId = null) {
        this.sessionAdCount++;
        this.lastAdTime = Date.now();

        if (targetId) {
            this.targetSessionAdCount[targetId] =
                (this.targetSessionAdCount[targetId] || 0) + 1;
        }

        // 更新统计数据
        this.settings.incrementAdWatchCount();
        console.log(`[AdManager] 广告展示记录: 会话=${this.sessionAdCount}, 总计=${this.settings.getAdWatchCount()}`);
    }

    /**
     * 重置会话数据
     */
    resetSession() {
        this.sessionAdCount = 0;
        this.targetSessionAdCount = {};
        this.consecutivePlays = 0;
        console.log('[AdManager] 会话数据已重置');
    }

    /**
     * 增加连续游戏计数
     */
    incrementConsecutivePlays() {
        this.consecutivePlays++;
        console.log(`[AdManager] 连续游戏次数: ${this.consecutivePlays}`);
    }

    /**
     * 获取目标的解锁状态信息
     * @param {string} targetId - 目标ID
     * @returns {Object} 解锁状态信息
     */
    getUnlockStatus(targetId) {
        const target = TARGET_TYPES.find(t => t.id === targetId);
        if (!target) {
            return { unlocked: false, type: 'unknown', remaining: 0 };
        }

        const isUnlocked = this.isTargetUnlocked(targetId);
        const remaining = this.getUnlockRemainingTime(targetId);

        return {
            unlocked: isUnlocked,
            type: target.unlock.type,
            remaining: remaining,
            remainingText: this.formatRemainingTime(remaining),
            adRequired: target.unlock.adRequired
        };
    }

    /**
     * 显示体力恢复激励视频广告
     * @returns {Promise<Object>} 结果对象 {success: boolean, message: string}
     */
    async showStaminaAd() {
        console.log('[AdManager] 请求显示体力恢复激励视频广告');

        return new Promise((resolve) => {
            // 非抖音环境模拟
            if (typeof tt === 'undefined' || !this.rewardedAd) {
                console.log('[AdManager] 广告API不可用，模拟观看完成');
                setTimeout(() => {
                    resolve({ success: true, message: '广告观看完成（模拟）' });
                }, 500);
                return;
            }

            const onClose = (res) => {
                this.rewardedAd.offClose(onClose);
                this.rewardedAd.offError(onError);

                if (res && res.isEnded) {
                    console.log('[AdManager] 体力恢复广告观看完成');
                    this.recordAdShown('stamina');
                    resolve({ success: true, message: '广告观看完成' });
                } else {
                    console.log('[AdManager] 体力恢复广告未完整观看');
                    resolve({ success: false, message: '广告未完整观看' });
                }

                // 重新加载下一个广告
                this.rewardedAd.load();
            };

            const onError = (err) => {
                this.rewardedAd.offClose(onClose);
                this.rewardedAd.offError(onError);
                console.error('[AdManager] 体力恢复广告错误:', err);
                resolve({ success: false, message: '广告加载失败' });
            };

            this.rewardedAd.onClose(onClose);
            this.rewardedAd.onError(onError);

            this.rewardedAd.show().catch((err) => {
                console.log('[AdManager] 体力恢复广告显示失败，尝试重新加载');
                this.rewardedAd.load()
                    .then(() => this.rewardedAd.show())
                    .catch(() => {
                        this.rewardedAd.offClose(onClose);
                        this.rewardedAd.offError(onError);
                        resolve({ success: false, message: '广告显示失败' });
                    });
            });
        });
    }

    /**
     * 初始化Banner广告
     */
    initBannerAd() {
        if (typeof tt === 'undefined') {
            console.log('[AdManager] 非抖音环境，Banner广告功能禁用');
            return;
        }

        if (!tt.createBannerAd) {
            console.log('[AdManager] Banner广告API不可用');
            return;
        }

        try {
            // 获取系统信息动态计算Banner位置
            const systemInfo = tt.getSystemInfoSync();
            const screenWidth = systemInfo.windowWidth || systemInfo.screenWidth;
            const screenHeight = systemInfo.windowHeight || systemInfo.screenHeight;
            const bannerHeight = 150; // Banner标准高度

            // 动态计算Banner样式（固定在屏幕底部）
            const bannerStyle = {
                left: 0,
                top: screenHeight - bannerHeight,  // 屏幕底部
                width: screenWidth,                 // 全屏宽度
                height: bannerHeight
            };

            console.log('[AdManager] Banner样式配置:', bannerStyle);

            this.bannerAd = tt.createBannerAd({
                adUnitId: AD_CONFIG.adUnitIds.banner,
                style: bannerStyle
            });

            // 监听广告事件
            this.bannerAd.onLoad(() => {
                console.log('[AdManager] ✅ Banner广告加载成功');
            });

            this.bannerAd.onError((err) => {
                console.error('[AdManager] ❌ Banner广告错误:', err);
            });

            console.log('[AdManager] Banner广告初始化成功');
        } catch (err) {
            console.error('[AdManager] Banner广告初始化失败:', err);
        }
    }

    /**
     * 显示Banner广告
     */
    showBannerAd() {
        console.log('[AdManager] 🎯 请求显示Banner广告');

        if (typeof tt === 'undefined' || !this.bannerAd) {
            console.log('[AdManager] Banner广告不可用，跳过显示');
            return;
        }

        this.bannerAd.show().then(() => {
            this.isBannerVisible = true;
            console.log('[AdManager] ✅ Banner广告显示成功');
        }).catch((err) => {
            console.error('[AdManager] ❌ Banner广告显示失败:', err);
        });
    }

    /**
     * 隐藏Banner广告
     */
    hideBannerAd() {
        console.log('[AdManager] 🎯 请求隐藏Banner广告');

        if (!this.bannerAd || !this.isBannerVisible) {
            return;
        }

        this.bannerAd.hide().then(() => {
            this.isBannerVisible = false;
            console.log('[AdManager] ✅ Banner广告隐藏成功');
        }).catch((err) => {
            console.error('[AdManager] ❌ Banner广告隐藏失败:', err);
        });
    }

    /**
     * 创建游戏推荐面板
     */
    createGameRecommendation() {
        console.log('[AdManager] 🎯 请求创建游戏推荐面板');

        if (typeof tt === 'undefined') {
            console.log('[AdManager] 非抖音环境，游戏推荐面板功能禁用');
            return;
        }

        if (!tt.createGridGamePanel) {
            console.log('[AdManager] 游戏推荐面板API不可用');
            return;
        }

        try {
            // 获取当前游戏appId
            const accountInfo = tt.getAccountManagerSync ? tt.getAccountManagerSync() : null;
            const currentAppId = accountInfo?.appId || '';

            // 传入游戏ID列表（至少需要一个游戏ID）
            this.gridGamePanel = tt.createGridGamePanel({
                gameIdList: [currentAppId], // 至少需要一个游戏ID
                gridCount: "four"
            });

            this.gridGamePanel.onShow(() => {
                this.isGridPanelVisible = true;
                console.log('[AdManager] ✅ 游戏推荐面板显示成功');
            });

            this.gridGamePanel.onHide(() => {
                this.isGridPanelVisible = false;
                console.log('[AdManager] ✅ 游戏推荐面板隐藏');
            });

            console.log('[AdManager] 游戏推荐面板创建成功');
        } catch (err) {
            console.error('[AdManager] 游戏推荐面板创建失败:', err);
        }
    }

    /**
     * 显示游戏推荐面板
     */
    showGameRecommendation() {
        console.log('[AdManager] 🎯 请求显示游戏推荐面板');

        if (!this.gridGamePanel) {
            this.createGameRecommendation();
        }

        if (this.gridGamePanel) {
            this.gridGamePanel.show();
        }
    }

    /**
     * 隐藏游戏推荐面板
     */
    hideGameRecommendation() {
        console.log('[AdManager] 🎯 请求隐藏游戏推荐面板');

        // 强制隐藏面板，不依赖状态标记
        if (this.gridGamePanel) {
            try {
                this.gridGamePanel.hide();
                console.log('[AdManager] ✅ 已调用 hide() 方法');
            } catch (err) {
                console.error('[AdManager] ❌ 面板隐藏失败:', err);
                this.isGridPanelVisible = false;  // 确保状态更新
            }
        } else {
            console.log('[AdManager] ⚠️  游戏推荐面板不存在');
        }

        // 无论调用是否成功，都标记为已隐藏
        this.isGridPanelVisible = false;
    }

    /**
     * 销毁广告资源（游戏退出时调用）
     */
    destroyAds() {
        console.log('[AdManager] 🎯 销毁广告资源');

        if (this.bannerAd) {
            this.bannerAd.destroy();
            this.bannerAd = null;
        }

        if (this.gridGamePanel) {
            this.gridGamePanel.destroy();
            this.gridGamePanel = null;
        }

        this.isBannerVisible = false;
        this.isGridPanelVisible = false;
    }
}
