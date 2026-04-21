/**
 * StaminaManager - 体力管理器
 *
 * 职责：
 * - 管理体力值和恢复时间
 * - 计算自动恢复（每3分钟恢复1点）
 * - 处理广告/分享奖励
 * - 持久化数据到 SettingsManager
 */

import { STAMINA_CONFIG } from '../config';

export class StaminaManager {
    /**
     * @param {SettingsManager} settingsManager - 设置管理器
     */
    constructor(settingsManager) {
        this.settingsManager = settingsManager;
        this.data = this.loadStaminaData();
        this.adManager = null; // 将在 Game.js 中设置
    }

    /**
     * 加载体力数据
     * @returns {Object} 体力数据
     */
    loadStaminaData() {
        // 直接访问 settings 属性
        const settings = this.settingsManager.settings;

        // 始终使用配置文件中的最大体力值
        const configuredMax = STAMINA_CONFIG.MAX_STAMINA;
        const configuredInterval = STAMINA_CONFIG.RECOVERY_INTERVAL;

        // 如果没有体力数据，初始化默认值
        if (!settings.stamina) {
            return {
                current: configuredMax,
                max: configuredMax,
                lastRestoreTime: Date.now(),
                recoveryInterval: configuredInterval,  // 保存配置值
                dailyAdCount: 0,
                lastAdDate: this.getTodayDate(),
                unlimitedStamina: false,  // 是否无限体力
                unlimitedStaminaEndTime: 0  // 无限体力结束时间
            };
        }

        // 如果已有体力数据，确保使用最新的配置值
        const savedData = settings.stamina;
        let needsSave = false;

        // 如果保存的最大体力与配置不符，更新最大体力值
        if (savedData.max !== configuredMax) {
            console.log(`[StaminaManager] 最大体力配置变更: ${savedData.max} → ${configuredMax}`);
            savedData.max = configuredMax;
            if (savedData.current > configuredMax) {
                savedData.current = configuredMax;
            }
            needsSave = true;
        }

        // 检查恢复间隔配置是否变更（通过对比保存的配置值）
        if (savedData.recoveryInterval !== undefined &&
            savedData.recoveryInterval !== configuredInterval) {
            console.log(`[StaminaManager] 恢复间隔配置变更: ${savedData.recoveryInterval}秒 → ${configuredInterval}秒`);
            // 重置lastRestoreTime为当前时间
            savedData.lastRestoreTime = Date.now();
            savedData.recoveryInterval = configuredInterval;
            needsSave = true;
        }

        // 如果是旧数据（没有recoveryInterval字段），添加该字段
        if (savedData.recoveryInterval === undefined) {
            console.log(`[StaminaManager] 旧数据升级，添加recoveryInterval字段: ${configuredInterval}秒`);
            savedData.recoveryInterval = configuredInterval;
            needsSave = true;
        }

        if (needsSave) {
            this.settingsManager.set('stamina', savedData);
            this.settingsManager.save();
        }

        return savedData;
    }

    /**
     * 保存体力数据
     */
    save() {
        // 使用 SettingsManager 的 set 方法
        this.settingsManager.set('stamina', this.data);
        // 然后保存到持久化存储
        this.settingsManager.save();
    }

    /**
     * 获取当前体力值
     * @returns {number} 当前体力
     */
    getCurrentStamina() {
        // 如果是无限体力模式，返回最大体力
        if (this.isUnlimitedStamina()) {
            return this.data.max;
        }
        return this.data.current;
    }

    /**
     * 获取最大体力值
     * @returns {number} 最大体力
     */
    getMaxStamina() {
        return this.data.max;
    }

    /**
     * 检查是否有足够体力
     * @param {number} amount - 需要的体力数量
     * @returns {boolean} 是否足够
     */
    hasEnoughStamina(amount = 1) {
        return this.data.current >= amount;
    }

    /**
     * 消耗体力
     * @param {number} amount - 消耗的体力数量
     * @returns {boolean} 是否成功消耗
     */
    consumeStamina(amount = 1) {
        const playCount = this.settingsManager.settings.stats?.totalPlayCount || 0;
        console.log(`[StaminaManager] 消耗体力 - 当前体力: ${this.data.current}, 游戏次数: ${playCount}`);

        if (!this.hasEnoughStamina(amount)) {
            console.warn('[StaminaManager] 体力不足，无法消耗');
            return false;
        }

        this.data.current = Math.max(0, this.data.current - amount);
        console.log(`[StaminaManager] 体力已消耗 - 剩余体力: ${this.data.current}`);

        this.save();
        return true;
    }

    /**
     * 添加体力
     * @param {number} amount - 添加的体力数量
     * @returns {number} 实际添加的体力（考虑上限）
     */
    addStamina(amount) {
        const before = this.data.current;
        this.data.current = Math.min(this.data.max, this.data.current + amount);
        const actualAdded = this.data.current - before;
        this.save();
        return actualAdded;
    }

    /**
     * 更新体力恢复（每帧调用）
     * @param {number} dt - 时间增量（秒）
     */
    update() {

        if (this.data.current >= this.data.max) return;

        const now = Date.now();
        const lastRestore = this.data.lastRestoreTime || now;

        const interval = STAMINA_CONFIG.RECOVERY_INTERVAL * 1000;

        const elapsed = now - lastRestore;

        const recoveryCount = Math.floor(elapsed / interval);

        if (recoveryCount > 0) {

            const actualRecovery = Math.min(
                recoveryCount,
                this.data.max - this.data.current
            );

            this.data.current += actualRecovery;

            // 重置lastRestoreTime为当前时间
            // 这样每次恢复后，倒计时重新从3分钟开始
            this.data.lastRestoreTime = now;

            console.log(`[StaminaManager] 体力恢复 +${actualRecovery}, 当前体力: ${this.data.current}/${this.data.max}`);

            this.save();
        }
    }

    /**
     * 获取下次恢复时间（毫秒）
     * @returns {number} 距离下次恢复的毫秒数
     */
    getNextRestoreTime() {
        // 如果已满，返回0
        if (this.data.current >= this.data.max) {
            return 0;
        }

        const now = Date.now();
        const lastRestore = this.data.lastRestoreTime || now;
        const interval = STAMINA_CONFIG.RECOVERY_INTERVAL * 1000;
        const nextRestore = lastRestore + interval;
        const remaining = Math.max(0, nextRestore - now);


        return remaining;
    }

    /**
     * 获取每日广告使用次数
     * @returns {number} 今日已使用次数
     */
    getDailyAdCount() {
        this.checkAndResetDailyCount();
        return this.data.dailyAdCount;
    }

    /**
     * 获取剩余每日广告次数
     * @returns {number} 剩余次数
     */
    getRemainingDailyAdCount() {
        return Math.max(0, STAMINA_CONFIG.DAILY_AD_LIMIT - this.getDailyAdCount());
    }

    /**
     * 检查并重置每日次数（跨天）
     */
    checkAndResetDailyCount() {
        const today = this.getTodayDate();
        if (this.data.lastAdDate !== today) {
            this.data.dailyAdCount = 0;
            this.data.lastAdDate = today;
            this.save();
        }
    }

    /**
     * 获取今天的日期（YYYY-MM-DD格式）
     * @returns {string} 日期字符串
     */
    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * 通过广告恢复体力
     * @returns {Promise<Object>} 恢复结果 {success: boolean, message: string}
     */
    async restoreByAd() {
        console.log('[StaminaManager] restoreByAd 被调用');

        // 检查并重置每日次数
        this.checkAndResetDailyCount();
        console.log('[StaminaManager] 当前状态:', {
            dailyAdCount: this.data.dailyAdCount,
            limit: STAMINA_CONFIG.DAILY_AD_LIMIT,
            currentStamina: this.data.current,
            maxStamina: this.data.max,
            hasAdManager: !!this.adManager
        });

        // 检查次数限制
        if (this.data.dailyAdCount >= STAMINA_CONFIG.DAILY_AD_LIMIT) {
            console.warn('[StaminaManager] 今日广告次数已用完');
            return {
                success: false,
                message: '今日广告次数已用完，请明天再试'
            };
        }

        // 检查体力是否已满
        if (this.data.current >= this.data.max) {
            console.warn('[StaminaManager] 体力已满');
            return {
                success: false,
                message: '体力已满'
            };
        }

        // 调用广告（需要 AdManager）
        if (!this.adManager) {
            console.error('[StaminaManager] adManager 未初始化!');
            return {
                success: false,
                message: '广告系统未初始化'
            };
        }

        console.log('[StaminaManager] 开始调用 adManager.showStaminaAd()...');
        try {
            const result = await this.adManager.showStaminaAd();
            console.log('[StaminaManager] showStaminaAd 返回:', result);

            if (result.success) {
                // 增加体力
                const actualAdded = this.addStamina(STAMINA_CONFIG.AD_REWARD);
                // 增加使用次数
                this.data.dailyAdCount++;
                this.save();

                console.log('[StaminaManager] 广告恢复成功，获得体力:', actualAdded);
                return {
                    success: true,
                    message: `获得${actualAdded}点体力`,
                    amount: actualAdded
                };
            } else {
                console.warn('[StaminaManager] showStaminaAd 返回失败:', result.message);
                return {
                    success: false,
                    message: result.message || '广告播放失败'
                };
            }
        } catch (error) {
            console.error('[StaminaManager] restoreByAd 异常:', error);
            return {
                success: false,
                message: '广告播放出错: ' + error.message
            };
        }
    }

    /**
     * 通过分享恢复体力
     * @returns {Promise<Object>} 恢复结果 {success: boolean, message: string}
     */
    async restoreByShare() {
        // 检查体力是否已满
        if (this.data.current >= this.data.max) {
            return {
                success: false,
                message: '体力已满'
            };
        }

        try {
            // 调用抖音分享 API（自定义分享内容）
            if (typeof tt !== 'undefined' && tt.shareAppMessage) {
                const result = await new Promise((resolve) => {
                    tt.shareAppMessage({
                        title: STAMINA_CONFIG.SHARE.title,
                        imageUrl: STAMINA_CONFIG.SHARE.imageUrl || undefined,
                        path: STAMINA_CONFIG.SHARE.path,
                        query: STAMINA_CONFIG.SHARE.query,
                        success: (res) => {
                            console.log('[StaminaManager] 分享成功:', res);
                            resolve(true);
                        },
                        fail: (err) => {
                            console.log('[StaminaManager] 分享失败或取消:', err);
                            resolve(false);
                        }
                    });
                });

                if (!result) {
                    return {
                        success: false,
                        message: '分享已取消'
                    };
                }
            } else {
                // 非抖音环境模拟分享成功
                console.log('[StaminaManager] 非抖音环境，模拟分享成功');
            }

            // 增加体力
            const actualAdded = this.addStamina(STAMINA_CONFIG.SHARE_REWARD);
            this.save();

            return {
                success: true,
                message: `分享成功，获得${actualAdded}点体力`,
                amount: actualAdded
            };
        } catch (error) {
            return {
                success: false,
                message: '分享失败: ' + error.message
            };
        }
    }

    /**
     * 启用无限体力模式
     * @param {number} duration - 持续时间（毫秒）
     */
    enableUnlimitedStamina(duration) {
        const now = Date.now();
        this.data.unlimitedStamina = true;
        this.data.unlimitedStaminaEndTime = now + duration;
        this.save();

        const durationMinutes = Math.floor(duration / (1000 * 60));
        const durationHours = (durationMinutes / 60).toFixed(1);

        console.log(`[StaminaManager] ✅ 启用无限体力，持续 ${durationHours} 小时`);
    }

    /**
     * 检查是否是无限体力模式
     * @returns {boolean} 是否无限体力
     */
    isUnlimitedStamina() {
        if (!this.data.unlimitedStamina) {
            return false;
        }

        // 检查是否已过期
        const now = Date.now();
        if (now >= this.data.unlimitedStaminaEndTime) {
            // 已过期，禁用无限体力
            this.data.unlimitedStamina = false;
            this.data.unlimitedStaminaEndTime = 0;
            this.save();
            console.log('[StaminaManager] 无限体力已过期');
            return false;
        }

        return true;
    }

    /**
     * 获取无限体力剩余时间（毫秒）
     * @returns {number} 剩余时间，如果不是无限体力返回0
     */
    getUnlimitedStaminaRemainingTime() {
        if (!this.data.unlimitedStamina) {
            return 0;
        }

        const now = Date.now();
        const remaining = this.data.unlimitedStaminaEndTime - now;

        return Math.max(0, remaining);
    }
}
