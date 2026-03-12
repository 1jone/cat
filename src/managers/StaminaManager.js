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

        // 如果没有体力数据，初始化默认值
        if (!settings.stamina) {
            return {
                current: STAMINA_CONFIG.MAX_STAMINA,
                max: STAMINA_CONFIG.MAX_STAMINA,
                lastRestoreTime: Date.now(),
                dailyAdCount: 0,
                lastAdDate: this.getTodayDate()
            };
        }

        return settings.stamina;
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
        if (!this.hasEnoughStamina(amount)) {
            return false;
        }

        this.data.current = Math.max(0, this.data.current - amount);
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
    
            // 保留剩余时间
            this.data.lastRestoreTime += recoveryCount * interval;
    
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
        const nextRestore = lastRestore + STAMINA_CONFIG.RECOVERY_INTERVAL * 1000;
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
        // 检查并重置每日次数
        this.checkAndResetDailyCount();

        // 检查次数限制
        if (this.data.dailyAdCount >= STAMINA_CONFIG.DAILY_AD_LIMIT) {
            return {
                success: false,
                message: '今日广告次数已用完，请明天再试'
            };
        }

        // 检查体力是否已满
        if (this.data.current >= this.data.max) {
            return {
                success: false,
                message: '体力已满'
            };
        }

        // 调用广告（需要 AdManager）
        if (!this.adManager) {
            return {
                success: false,
                message: '广告系统未初始化'
            };
        }

        try {
            const result = await this.adManager.showStaminaAd();

            if (result.success) {
                // 增加体力
                const actualAdded = this.addStamina(STAMINA_CONFIG.AD_REWARD);
                // 增加使用次数
                this.data.dailyAdCount++;
                this.save();

                return {
                    success: true,
                    message: `获得${actualAdded}点体力`,
                    amount: actualAdded
                };
            } else {
                return {
                    success: false,
                    message: result.message || '广告播放失败'
                };
            }
        } catch (error) {
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
}
