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
}
