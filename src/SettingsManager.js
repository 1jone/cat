/**
 * SettingsManager - 游戏设置管理器
 * 单例模式，负责设置的读取、保存和管理
 */

import { CONFIG } from './config';

export class SettingsManager {
    static instance = null;

    constructor() {
        // 默认设置
        this.defaultSettings = {
            audio: {
                bgmVolume: 0.5,
                // 音频分层：游戏音效（原名 sfxVolume，保持向后兼容）
                gameSfxVolume: 0.8,
                // 音频分层：目标音效（新增）
                targetSfxVolume: 0.8,
                targetSfxEnabled: true,
                // 向后兼容：保留 sfxVolume，迁移时映射到 gameSfxVolume
                sfxVolume: 0.8,
                muted: false
            },
            game: {
                vibration: true,
                // 按关卡独立存储游戏参数
                // 结构: { targetId: { spawnInterval: ms, maxTargets: count, speedMultiplier: number } }
                targetGameSettings: {},
                // 无尽模式独立设置
                endlessGameSettings: {
                    spawnInterval: CONFIG.SPAWN.INTERVAL,
                    maxTargets: CONFIG.SPAWN.MAX_TARGETS,
                    speedMultiplier: CONFIG.SPAWN.SPEED_MULTIPLIER
                }
            },
            stats: {
                highScore: 0,
                totalGames: 0,
                totalPlayCount: 0,    // 总游戏次数（用于广告概率计算）
                targetHighScores: {}, // 按目标类型分别统计（动态结构）
                endless: {            // 无尽模式统计
                    highScore: 0,
                    longestTime: 0
                }
            },
            // 广告相关数据
            ad: {
                unlockData: {},      // 目标解锁时间记录 { targetId: timestamp }
                adWatchCount: 0      // 累计观看广告次数
            },
            // 侧边栏奖励相关数据
            sidebar: {
                hasAddedToSidebar: false,  // 是否已添加到侧边栏
                lastRewardTime: 0,         // 上次领取奖励时间戳
                totalRewardsReceived: 0,   // 累计领取奖励次数
                guideShown: false          // 是否已显示过引导
            }
        };

        // 当前设置（初始化为默认值的深拷贝）
        this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
    }

    /**
     * 获取单例实例
     */
    static getInstance() {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }

    /**
     * 从本地存储加载设置
     */
    load() {
        try {
            const data = tt.getStorageSync('gameSettings');
            if (data) {
                const saved = JSON.parse(data);
                // 深度合并，确保新增的默认设置项也存在
                this.settings = this.deepMerge(this.defaultSettings, saved);

                // 向后兼容：迁移旧的 sfxVolume 到 gameSfxVolume
                if (saved.audio && saved.audio.sfxVolume !== undefined) {
                    if (this.settings.audio.gameSfxVolume === undefined) {
                        this.settings.audio.gameSfxVolume = saved.audio.sfxVolume;
                    }
                    // 保留 sfxVolume 以保持完全兼容
                    this.settings.audio.sfxVolume = saved.audio.sfxVolume;
                }
            }
            console.log('Settings loaded:', this.settings);
        } catch (e) {
            console.warn('Settings load failed, using defaults:', e);
            this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
        }
    }

    /**
     * 保存设置到本地存储
     */
    save() {
        try {
            tt.setStorageSync('gameSettings', JSON.stringify(this.settings));
            console.log('Settings saved');
        } catch (e) {
            console.warn('Settings save failed:', e);
        }
    }

    /**
     * 深度合并对象
     */
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    result[key] = this.deepMerge(target[key] || {}, source[key]);
                } else {
                    result[key] = source[key];
                }
            }
        }
        return result;
    }

    /**
     * 获取设置值
     * @param {string} key - 点分隔的键路径，如 'audio.bgmVolume'
     * @returns {*} 设置值
     */
    get(key) {
        const keys = key.split('.');
        let value = this.settings;
        for (const k of keys) {
            if (value === undefined || value === null) return undefined;
            value = value[k];
        }
        return value;
    }

    /**
     * 设置值并自动保存
     * @param {string} key - 点分隔的键路径
     * @param {*} value - 要设置的值
     */
    set(key, value) {
        const keys = key.split('.');
        let obj = this.settings;
        for (let i = 0; i < keys.length - 1; i++) {
            if (obj[keys[i]] === undefined) {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
        this.save();
    }

    /**
     * 获取 BGM 音量
     */
    getBGMVolume() {
        return this.get('audio.bgmVolume');
    }

    /**
     * 设置 BGM 音量
     */
    setBGMVolume(volume) {
        this.set('audio.bgmVolume', Math.max(0, Math.min(1, volume)));
    }

    /**
     * 获取音效音量（游戏音效，向后兼容）
     */
    getSFXVolume() {
        // 优先返回 gameSfxVolume，如果不存在则返回 sfxVolume
        const gameSfx = this.get('audio.gameSfxVolume');
        if (gameSfx !== undefined) return gameSfx;
        return this.get('audio.sfxVolume') || 0.8;
    }

    /**
     * 设置音效音量（游戏音效，向后兼容）
     */
    setSFXVolume(volume) {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        this.set('audio.gameSfxVolume', clampedVolume);
        this.set('audio.sfxVolume', clampedVolume);  // 保持兼容
    }

    /**
     * 获取游戏音效音量（GAME_SFX 层）
     */
    getGameSFXVolume() {
        return this.get('audio.gameSfxVolume') || this.get('audio.sfxVolume') || 0.8;
    }

    /**
     * 设置游戏音效音量（GAME_SFX 层）
     */
    setGameSFXVolume(volume) {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        this.set('audio.gameSfxVolume', clampedVolume);
        this.set('audio.sfxVolume', clampedVolume);  // 保持兼容
    }

    /**
     * 获取目标音效音量（TARGET_SFX 层）
     */
    getTargetSFXVolume() {
        return this.get('audio.targetSfxVolume') || 0.8;
    }

    /**
     * 设置目标音效音量（TARGET_SFX 层）
     */
    setTargetSFXVolume(volume) {
        this.set('audio.targetSfxVolume', Math.max(0, Math.min(1, volume)));
    }

    /**
     * 获取目标音效开关状态
     */
    isTargetSFXEnabled() {
        return this.get('audio.targetSfxEnabled') !== false;  // 默认启用
    }

    /**
     * 设置目标音效开关
     */
    setTargetSFXEnabled(enabled) {
        this.set('audio.targetSfxEnabled', enabled);
    }

    /**
     * 获取静音状态
     */
    isMuted() {
        return this.get('audio.muted');
    }

    /**
     * 设置静音状态
     */
    setMuted(muted) {
        this.set('audio.muted', muted);
    }

    /**
     * 获取震动设置
     */
    isVibrationEnabled() {
        return this.get('game.vibration');
    }

    /**
     * 设置震动
     */
    setVibration(enabled) {
        this.set('game.vibration', enabled);
    }

    /**
     * 获取最高分
     */
    getHighScore() {
        return this.get('stats.highScore');
    }

    /**
     * 更新最高分（如果新分数更高）
     * @param {number} score - 新分数
     * @returns {boolean} 是否更新了最高分
     */
    updateHighScore(score) {
        const current = this.getHighScore();
        if (score > current) {
            this.set('stats.highScore', score);
            return true;
        }
        return false;
    }

    // ==================== 目标得分统计方法 ====================

    /**
     * 更新特定目标的最高分（动态添加）
     * @param {string} targetId - 目标ID
     * @param {number} score - 新分数
     * @returns {boolean} 是否更新了最高分
     */
    updateTargetHighScore(targetId, score) {
        const targetScores = this.get('stats.targetHighScores') || {};
        const currentHigh = targetScores[targetId] || 0;

        if (score > currentHigh) {
            targetScores[targetId] = score;
            this.set('stats.targetHighScores', targetScores);
            // 同时更新全局最高分
            this.updateHighScore(score);
            return true;
        }
        return false;
    }

    /**
     * 获取特定目标的最高分
     * @param {string} targetId - 目标ID
     * @returns {number} 最高分
     */
    getTargetHighScore(targetId) {
        const targetScores = this.get('stats.targetHighScores') || {};
        return targetScores[targetId] || 0;
    }

    /**
     * 获取所有目标最高分
     * @returns {Object} 所有目标的最高分 { targetId: score }
     */
    getAllTargetHighScores() {
        return this.get('stats.targetHighScores') || {};
    }

    // ==================== 无尽模式统计方法 ====================

    /**
     * 更新无尽模式记录
     * @param {number} score - 分数
     * @param {number} gameTimeMs - 游戏时长（毫秒）
     * @returns {boolean} 是否更新了任何记录
     */
    updateEndlessStats(score, gameTimeMs) {
        const endless = this.get('stats.endless') || {};
        let updated = false;

        if (score > (endless.highScore || 0)) {
            this.set('stats.endless.highScore', score);
            updated = true;
        }

        const gameTimeSec = Math.floor(gameTimeMs / 1000);
        if (gameTimeSec > (endless.longestTime || 0)) {
            this.set('stats.endless.longestTime', gameTimeSec);
            updated = true;
        }

        // 同时更新全局最高分
        this.updateHighScore(score);

        return updated;
    }

    /**
     * 获取无尽模式统计
     * @returns {Object} { highScore, longestTime }
     */
    getEndlessStats() {
        return this.get('stats.endless') || {
            highScore: 0,
            longestTime: 0
        };
    }

    /**
     * 获取总游戏次数
     */
    getTotalGames() {
        return this.get('stats.totalGames');
    }

    /**
     * 增加游戏次数
     */
    incrementGames() {
        const current = this.getTotalGames();
        this.set('stats.totalGames', current + 1);
    }

    // ==================== 广告相关方法 ====================

    /**
     * 获取目标解锁数据
     * @returns {Object} 解锁数据 { targetId: timestamp }
     */
    getUnlockData() {
        return this.get('ad.unlockData') || {};
    }

    /**
     * 保存目标解锁数据
     * @param {Object} unlockData - 解锁数据
     */
    saveUnlockData(unlockData) {
        this.set('ad.unlockData', unlockData);
    }

    /**
     * 获取总游戏次数（用于广告概率计算）
     * @returns {number} 总游戏次数
     */
    getTotalPlayCount() {
        return this.get('stats.totalPlayCount') || 0;
    }

    /**
     * 增加总游戏次数
     */
    incrementPlayCount() {
        const current = this.getTotalPlayCount();
        this.set('stats.totalPlayCount', current + 1);
    }

    /**
     * 获取广告观看次数
     * @returns {number} 广告观看次数
     */
    getAdWatchCount() {
        return this.get('ad.adWatchCount') || 0;
    }

    /**
     * 增加广告观看次数
     */
    incrementAdWatchCount() {
        const current = this.getAdWatchCount();
        this.set('ad.adWatchCount', current + 1);
    }

    // ==================== 侧边栏奖励相关方法 ====================

    /**
     * 检查是否已添加到侧边栏
     * @returns {boolean}
     */
    hasAddedToSidebar() {
        return this.get('sidebar.hasAddedToSidebar') || false;
    }

    /**
     * 设置已添加到侧边栏
     * @param {boolean} added
     */
    setAddedToSidebar(added) {
        this.set('sidebar.hasAddedToSidebar', added);
    }

    /**
     * 获取上次领取奖励时间
     * @returns {number} 时间戳
     */
    getLastSidebarRewardTime() {
        return this.get('sidebar.lastRewardTime') || 0;
    }

    /**
     * 设置上次领取奖励时间
     * @param {number} timestamp
     */
    setLastSidebarRewardTime(timestamp) {
        this.set('sidebar.lastRewardTime', timestamp);
    }

    /**
     * 获取累计领取奖励次数
     * @returns {number}
     */
    getTotalSidebarRewards() {
        return this.get('sidebar.totalRewardsReceived') || 0;
    }

    /**
     * 增加累计领取奖励次数
     */
    incrementSidebarRewards() {
        const current = this.getTotalSidebarRewards();
        this.set('sidebar.totalRewardsReceived', current + 1);
    }

    /**
     * 检查是否已显示过引导
     * @returns {boolean}
     */
    hasSidebarGuideShown() {
        return this.get('sidebar.guideShown') || false;
    }

    /**
     * 设置已显示过引导
     * @param {boolean} shown
     */
    setSidebarGuideShown(shown) {
        this.set('sidebar.guideShown', shown);
    }

    // ==================== 其他方法 ====================

    /**
     * 重置设置到默认值
     */
    resetToDefault() {
        this.settings = JSON.parse(JSON.stringify(this.defaultSettings));
        this.save();
    }

    /**
     * 触发震动（如果启用）
     * @param {string} type - 震动类型：'light', 'medium', 'heavy'
     */
    vibrate(type = 'light') {
        if (!this.isVibrationEnabled()) return;

        try {
            tt.vibrateShort({
                type: type,
                success: () => {},
                fail: () => {}
            });
        } catch (e) {
            // 忽略震动失败
        }
    }

    // ==================== 游戏参数设置方法（按关卡独立） ====================

    /**
     * 获取指定关卡的生成间隔
     * @param {string} targetId - 目标ID
     * @param {boolean} isEndlessMode - 是否无尽模式
     * @returns {number} 生成间隔（毫秒）
     */
    getSpawnInterval(targetId, isEndlessMode = false) {
        if (isEndlessMode) {
            var val = this.get('game.endlessGameSettings.spawnInterval');
            return val != null ? val : CONFIG.SPAWN.INTERVAL;
        }
        const settings = this.get('game.targetGameSettings') || {};
        return (settings[targetId] && settings[targetId].spawnInterval) || CONFIG.SPAWN.INTERVAL;
    }

    /**
     * 设置指定关卡的生成间隔
     * @param {string} targetId - 目标ID
     * @param {number} ms - 生成间隔（毫秒）
     * @param {boolean} isEndlessMode - 是否无尽模式
     */
    setSpawnInterval(targetId, ms, isEndlessMode = false) {
        const clampedMs = Math.max(CONFIG.SPAWN.INTERVAL_MIN, Math.min(CONFIG.SPAWN.INTERVAL_MAX, ms));
        if (isEndlessMode) {
            this.set('game.endlessGameSettings.spawnInterval', clampedMs);
        } else {
            const settings = this.get('game.targetGameSettings') || {};
            if (!settings[targetId]) settings[targetId] = {};
            settings[targetId].spawnInterval = clampedMs;
            this.set('game.targetGameSettings', settings);
        }
    }

    /**
     * 获取指定关卡的最大实体数量
     * @param {string} targetId - 目标ID
     * @param {boolean} isEndlessMode - 是否无尽模式
     * @returns {number} 最大实体数量
     */
    getMaxTargets(targetId, isEndlessMode = false) {
        if (isEndlessMode) {
            var val = this.get('game.endlessGameSettings.maxTargets');
            return val != null ? val : CONFIG.SPAWN.MAX_TARGETS;
        }
        const settings = this.get('game.targetGameSettings') || {};
        return (settings[targetId] && settings[targetId].maxTargets) || CONFIG.SPAWN.MAX_TARGETS;
    }

    /**
     * 设置指定关卡的最大实体数量
     * @param {string} targetId - 目标ID
     * @param {number} count - 最大实体数量
     * @param {boolean} isEndlessMode - 是否无尽模式
     */
    setMaxTargets(targetId, count, isEndlessMode = false) {
        const clampedCount = Math.max(CONFIG.SPAWN.MAX_TARGETS_MIN, Math.min(CONFIG.SPAWN.MAX_TARGETS_MAX, count));
        if (isEndlessMode) {
            this.set('game.endlessGameSettings.maxTargets', clampedCount);
        } else {
            const settings = this.get('game.targetGameSettings') || {};
            if (!settings[targetId]) settings[targetId] = {};
            settings[targetId].maxTargets = clampedCount;
            this.set('game.targetGameSettings', settings);
        }
    }

    /**
     * 获取指定关卡的速度乘数
     * @param {string} targetId - 目标ID
     * @param {boolean} isEndlessMode - 是否无尽模式
     * @returns {number} 速度乘数
     */
    getSpeedMultiplier(targetId, isEndlessMode = false) {
        if (isEndlessMode) {
            var val = this.get('game.endlessGameSettings.speedMultiplier');
            return val != null ? val : CONFIG.SPAWN.SPEED_MULTIPLIER;
        }
        const settings = this.get('game.targetGameSettings') || {};
        return (settings[targetId] && settings[targetId].speedMultiplier) || CONFIG.SPAWN.SPEED_MULTIPLIER;
    }

    /**
     * 设置指定关卡的速度乘数
     * @param {string} targetId - 目标ID
     * @param {number} multiplier - 速度乘数
     * @param {boolean} isEndlessMode - 是否无尽模式
     */
    setSpeedMultiplier(targetId, multiplier, isEndlessMode = false) {
        const clampedMultiplier = Math.max(CONFIG.SPAWN.SPEED_MULTIPLIER_MIN, Math.min(CONFIG.SPAWN.SPEED_MULTIPLIER_MAX, multiplier));
        if (isEndlessMode) {
            this.set('game.endlessGameSettings.speedMultiplier', clampedMultiplier);
        } else {
            const settings = this.get('game.targetGameSettings') || {};
            if (!settings[targetId]) settings[targetId] = {};
            settings[targetId].speedMultiplier = clampedMultiplier;
            this.set('game.targetGameSettings', settings);
        }
    }
}

// 导出获取实例的便捷函数
export function getSettingsManager() {
    return SettingsManager.getInstance();
}
