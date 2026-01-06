/**
 * SidebarManager - 侧边栏复访能力管理器
 * 负责处理抖音侧边栏添加、入口检测和奖励发放
 */

import { TARGET_TYPES, SIDEBAR_REWARD_CONFIG } from '../config.js';

export class SidebarManager {
    constructor(game) {
        this.game = game;
        this.settingsManager = game.settingsManager;

        // 待展示的奖励（用于UI显示）
        this.pendingReward = null;

        // 标记当前会话是否从侧边栏进入
        this.currentSessionFromSidebar = false;

        // 检测首次启动场景（必须在 setupEventListeners 之前）
        this.checkInitialLaunch();

        // 绑定 onShow 事件监听
        this.setupEventListeners();
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        if (typeof tt !== 'undefined' && tt.onShow) {
            tt.onShow((options) => {
                this.handleAppShow(options);
            });
        }
    }

    /**
     * 检测首次启动场景
     * 使用 tt.getLaunchOptionsSync() 获取启动参数
     */
    checkInitialLaunch() {
        if (typeof tt !== 'undefined' && tt.getLaunchOptionsSync) {
            try {
                const launchOptions = tt.getLaunchOptionsSync();
                console.log('[SidebarManager] Initial launch options:', launchOptions);

                // 检查是否从侧边栏启动
                if (this.isSidebarEntryScene(launchOptions)) {
                    console.log('[SidebarManager] Detected sidebar entry on initial launch');
                    this.currentSessionFromSidebar = true;
                    this.settingsManager.setAddedToSidebar(true);

                    // 检查是否可以领取奖励
                    if (this.canReceiveReward()) {
                        const reward = this.grantReward();
                        if (reward) {
                            this.pendingReward = reward;
                            console.log('[SidebarManager] Reward granted on initial launch:', reward);
                        }
                    } else {
                        console.log('[SidebarManager] Reward on cooldown (initial launch)');
                    }
                }
            } catch (e) {
                console.error('[SidebarManager] getLaunchOptionsSync error:', e);
            }
        }
    }

    /**
     * 判断是否为侧边栏进入场景
     * 使用 launch_from + location 字段判断（根据最新抖音API文档）
     * @param {Object} options - 启动/显示参数
     * @returns {boolean} 是否从侧边栏进入
     */
    isSidebarEntryScene(options) {
        if (!options) return false;

        // 通过 launch_from + location 判断
        // sidebar_card: 抖音首页侧边栏
        // homepage_expand: 侧边栏高价值区
        if (options.launch_from === 'homepage') {
            if (options.location === 'sidebar_card' ||
                options.location === 'homepage_expand') {
                console.log('[SidebarManager] Sidebar entry detected:', {
                    launch_from: options.launch_from,
                    location: options.location
                });
                return true;
            }
        }

        return false;
    }

    /**
     * 处理应用显示事件
     * @param {Object} options - 启动/显示参数
     */
    handleAppShow(options) {
        console.log('[SidebarManager] App show with options:', options);

        // 检查是否从侧边栏进入
        if (this.checkSidebarEntry(options)) {
            console.log('[SidebarManager] Detected sidebar entry');
        }
    }

    /**
     * 检查是否从侧边栏进入
     * @param {Object} options - 启动参数
     * @returns {boolean} 是否从侧边栏进入
     */
    checkSidebarEntry(options) {
        // 使用新的场景检测方法
        if (!this.isSidebarEntryScene(options)) {
            return false;
        }

        // 标记当前会话从侧边栏进入
        this.currentSessionFromSidebar = true;

        // 标记已添加到侧边栏
        this.settingsManager.setAddedToSidebar(true);

        // 检查是否可以领取奖励
        if (this.canReceiveReward()) {
            const reward = this.grantReward();
            if (reward) {
                this.pendingReward = reward;
                console.log('[SidebarManager] Reward granted:', reward);
                return true;
            }
        } else {
            console.log('[SidebarManager] Reward on cooldown');
        }

        return false;
    }

    /**
     * 调用侧边栏添加
     * @returns {Promise<boolean>} 是否成功
     */
    async navigateToSidebar() {
        // 开发环境模拟
        if (typeof tt === 'undefined' || !tt.navigateToScene) {
            console.log('[SidebarManager] Dev mode: simulating sidebar navigation');
            this.settingsManager.setAddedToSidebar(true);
            this.settingsManager.setSidebarGuideShown(true);
            return true;
        }

        return new Promise((resolve) => {
            tt.navigateToScene({
                scene: 'sidebar',
                success: () => {
                    console.log('[SidebarManager] Navigate to sidebar success');
                    this.settingsManager.setAddedToSidebar(true);
                    this.settingsManager.setSidebarGuideShown(true);
                    resolve(true);
                },
                fail: (err) => {
                    console.error('[SidebarManager] Navigate to sidebar failed:', err);
                    resolve(false);
                }
            });
        });
    }

    /**
     * 检查是否可以领取奖励
     * @returns {boolean}
     */
    canReceiveReward() {
        if (!SIDEBAR_REWARD_CONFIG.enabled) {
            return false;
        }

        const lastRewardTime = this.settingsManager.getLastSidebarRewardTime();
        const cooldownMs = SIDEBAR_REWARD_CONFIG.cooldownDays * 24 * 60 * 60 * 1000;

        return Date.now() - lastRewardTime >= cooldownMs;
    }

    /**
     * 获取下次可领取奖励的剩余时间（毫秒）
     * @returns {number}
     */
    getNextRewardRemainingTime() {
        const lastRewardTime = this.settingsManager.getLastSidebarRewardTime();
        const cooldownMs = SIDEBAR_REWARD_CONFIG.cooldownDays * 24 * 60 * 60 * 1000;
        const nextRewardTime = lastRewardTime + cooldownMs;

        return Math.max(0, nextRewardTime - Date.now());
    }

    /**
     * 发放奖励
     * @returns {Object|null} 奖励信息 { targetId, targetName, targetImage, duration }
     */
    grantReward() {
        // 筛选可奖励的关卡（广告解锁类型且标记为可奖励）
        const rewardableTargets = TARGET_TYPES.filter(
            t => t.sidebarReward && t.sidebarReward.canBeRewarded && t.unlock && t.unlock.type === 'ad'
        );

        if (rewardableTargets.length === 0) {
            console.warn('[SidebarManager] No rewardable targets available');
            return null;
        }

        // 随机选择一个
        const target = rewardableTargets[
            Math.floor(Math.random() * rewardableTargets.length)
        ];

        // 使用关卡自身的 unlockDuration
        const unlockDuration = target.unlock.unlockDuration;

        // 复用现有的广告解锁存储机制
        const unlockData = this.settingsManager.getUnlockData();
        unlockData[target.id] = Date.now();
        this.settingsManager.saveUnlockData(unlockData);

        // 更新侧边栏奖励状态
        this.settingsManager.setLastSidebarRewardTime(Date.now());
        this.settingsManager.incrementSidebarRewards();

        const reward = {
            targetId: target.id,
            targetName: target.name,
            targetImage: target.image,
            duration: unlockDuration
        };

        console.log('[SidebarManager] Reward granted:', reward);
        return reward;
    }

    /**
     * 获取待展示的奖励并清除
     * @returns {Object|null}
     */
    consumePendingReward() {
        const reward = this.pendingReward;
        this.pendingReward = null;
        return reward;
    }

    /**
     * 检查是否有待展示的奖励
     * @returns {boolean}
     */
    hasPendingReward() {
        return this.pendingReward !== null;
    }

    /**
     * 检查当前会话是否从侧边栏进入
     * @returns {boolean}
     */
    isCurrentSessionFromSidebar() {
        return this.currentSessionFromSidebar;
    }

    /**
     * 检查是否应该显示入口有奖按钮
     * 当用户已领取奖励且处于冷却期时，完全隐藏按钮
     * @returns {boolean}
     */
    shouldShowEntryButton() {
        if (!SIDEBAR_REWARD_CONFIG.enabled) {
            return false;
        }

        // 如果当前会话从侧边栏进入且不可领取奖励（冷却中），隐藏按钮
        if (this.currentSessionFromSidebar && !this.canReceiveReward()) {
            return false;
        }

        // 如果已添加过侧边栏且在冷却中，隐藏按钮
        if (this.settingsManager.hasAddedToSidebar() && !this.canReceiveReward()) {
            return false;
        }

        return true;
    }

    /**
     * 检查是否应该显示入口按钮红点
     * 当可以领取奖励时显示红点
     * @returns {boolean}
     */
    shouldShowRedDot() {
        if (!SIDEBAR_REWARD_CONFIG.enabled || !SIDEBAR_REWARD_CONFIG.ui.showRedDot) {
            return false;
        }

        // 如果按钮都不显示，红点也不显示
        if (!this.shouldShowEntryButton()) {
            return false;
        }

        // 如果还没添加过侧边栏，显示红点引导
        if (!this.settingsManager.hasAddedToSidebar()) {
            return true;
        }

        // 如果可以领取奖励，显示红点
        return this.canReceiveReward();
    }

    /**
     * 检查是否需要显示引导弹窗
     * @returns {boolean}
     */
    shouldShowGuide() {
        if (!SIDEBAR_REWARD_CONFIG.enabled) {
            return false;
        }

        // 首次且配置为显示引导
        if (SIDEBAR_REWARD_CONFIG.showGuideOnFirstVisit &&
            !this.settingsManager.hasSidebarGuideShown()) {
            return true;
        }

        return false;
    }

    /**
     * 标记引导已显示
     */
    markGuideShown() {
        this.settingsManager.setSidebarGuideShown(true);
    }

    /**
     * 格式化剩余时间为可读字符串
     * @param {number} ms - 毫秒数
     * @returns {string}
     */
    formatRemainingTime(ms) {
        if (ms <= 0) return '可领取';

        const days = Math.floor(ms / (24 * 60 * 60 * 1000));
        const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

        if (days > 0) {
            return `${days}天${hours}小时后可领取`;
        } else if (hours > 0) {
            const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
            return `${hours}小时${minutes}分钟后可领取`;
        } else {
            const minutes = Math.floor(ms / (60 * 1000));
            return `${minutes}分钟后可领取`;
        }
    }

    /**
     * 格式化解锁时长为可读字符串
     * @param {number} ms - 毫秒数
     * @returns {string}
     */
    formatDuration(ms) {
        const hours = Math.floor(ms / (60 * 60 * 1000));
        if (hours >= 24) {
            const days = Math.floor(hours / 24);
            return `${days}天`;
        }
        return `${hours}小时`;
    }
}
