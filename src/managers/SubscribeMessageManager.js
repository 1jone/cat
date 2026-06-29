/**
 * SubscribeMessageManager - 抖音小游戏订阅消息管理器
 *
 * 职责：
 * - 管理 tt.requestSubscribeMessage 的调用时机和策略
 * - 随机选择模板弹出订阅面板（每次只弹一个）
 * - 记录用户订阅状态和弹窗冷却数据
 * - 处理错误和降级策略
 *
 * 关键限制：
 * - tt.requestSubscribeMessage 必须在用户手势回调（bindtap/tt.pay）中同步调用
 * - 长期模板只需订阅一次，重复订阅返回 repeat 但不影响下发
 * - 一次性模板和长期模板不可混用
 */

import { SUBSCRIBE_MESSAGE_CONFIG } from '../config';

export class SubscribeMessageManager {
    /**
     * @param {import('../SettingsManager').SettingsManager} settingsManager
     */
    constructor(settingsManager) {
        this.settingsManager = settingsManager;
        this.sessionPromptCount = 0;
        this.subscribeData = this._loadSubscribeData();
        this.isAvailable = this._checkAvailability();
    }

    // ==================== 公共方法 ====================

    /**
     * 判断指定场景下是否应该弹出订阅面板
     * @param {'game_over' | 'checkin_reward'} triggerScene
     * @returns {boolean}
     */
    shouldPrompt(triggerScene) {
        if (!SUBSCRIBE_MESSAGE_CONFIG.enabled) return false;
        if (!this.isAvailable) return false;

        const trigger = SUBSCRIBE_MESSAGE_CONFIG.triggers[triggerScene];
        if (!trigger || !trigger.enabled) return false;

        if (Math.random() > trigger.probability) return false;
        if (!this._checkCooldown()) return false;
        if (this._isAllSubscribed()) return false;

        return true;
    }

    /**
     * 随机选择模板并调用 tt.requestSubscribeMessage
     * 必须在用户手势回调中同步调用
     * @param {'game_over' | 'checkin_reward'} triggerScene
     * @returns {Promise<{success: boolean, results: Object|null, error: string|null}>}
     */
    requestSubscribe(triggerScene) {
        if (!this.shouldPrompt(triggerScene)) {
            return Promise.resolve({ success: false, error: '条件不满足，不弹出' });
        }

        const tmplId = this._selectTemplate();
        if (!tmplId) {
            return Promise.resolve({ success: false, error: '无可用模板' });
        }

        console.log('[SubscribeMsg] 请求订阅:', SUBSCRIBE_MESSAGE_CONFIG.templateLabels[tmplId],
            '场景:', triggerScene);

        return new Promise((resolve) => {
            try {
                tt.requestSubscribeMessage({
                    tmplIds: [tmplId],
                    success: (res) => {
                        console.log('[SubscribeMsg] 订阅回调:', res);
                        this._handleSubscribeResult(res, tmplId, triggerScene);
                        this._recordPrompt(triggerScene, tmplId);
                        this.sessionPromptCount++;
                        resolve({ success: true, results: res });
                    },
                    fail: (err) => {
                        console.warn('[SubscribeMsg] 订阅失败:', err);
                        this._handleSubscribeError(err);
                        resolve({ success: false, error: err.errMsg });
                    },
                });
            } catch (e) {
                console.error('[SubscribeMsg] 调用异常:', e);
                resolve({ success: false, error: e.message });
            }
        });
    }

    /**
     * 引导用户去设置页开启订阅消息
     */
    guideToSetting() {
        if (typeof tt === 'undefined' || !tt.openSetting) return;
        try {
            tt.openSetting({
                success: (res) => console.log('[SubscribeMsg] 设置页已打开'),
                fail: (err) => console.warn('[SubscribeMsg] 打开设置页失败:', err),
            });
        } catch (e) {
            console.error('[SubscribeMsg] 打开设置页异常:', e);
        }
    }

    // ==================== 私有方法 ====================

    _checkAvailability() {
        if (typeof tt === 'undefined') {
            console.log('[SubscribeMsg] 非抖音环境，订阅消息功能禁用');
            return false;
        }
        if (!tt.requestSubscribeMessage) {
            console.log('[SubscribeMsg] tt.requestSubscribeMessage API 不可用');
            return false;
        }

        try {
            const info = tt.getSystemInfoSync();
            if (info && info.SDKVersion) {
                if (this._compareVersion(info.SDKVersion, SUBSCRIBE_MESSAGE_CONFIG.minSDKVersion) < 0) {
                    console.warn('[SubscribeMsg] 基础库版本过低:', info.SDKVersion);
                    return false;
                }
            }
        } catch (e) {
            // 版本检查失败不阻断
        }

        console.log('[SubscribeMsg] 订阅消息功能可用');
        return true;
    }

    _compareVersion(v1, v2) {
        const a = v1.split('.').map(Number);
        const b = v2.split('.').map(Number);
        const len = Math.max(a.length, b.length);
        for (let i = 0; i < len; i++) {
            const x = a[i] || 0;
            const y = b[i] || 0;
            if (x > y) return 1;
            if (x < y) return -1;
        }
        return 0;
    }

    _loadSubscribeData() {
        const saved = this.settingsManager.get('subscribeMessage');
        if (saved) return saved;

        return {
            templateStatuses: {},
            lastPromptTime: 0,
            lastPromptScene: null,
            dailyPromptCount: 0,
            dailyPromptDate: null,
            totalPrompts: 0,
        };
    }

    _saveSubscribeData() {
        this.settingsManager.set('subscribeMessage', this.subscribeData);
    }

    _checkCooldown() {
        const cooldown = SUBSCRIBE_MESSAGE_CONFIG.cooldown;
        const now = Date.now();

        if (this.sessionPromptCount >= cooldown.maxPerSession) return false;

        const today = this._getTodayDate();
        if (this.subscribeData.dailyPromptDate !== today) {
            this.subscribeData.dailyPromptCount = 0;
            this.subscribeData.dailyPromptDate = today;
        }
        if (this.subscribeData.dailyPromptCount >= cooldown.maxPerDay) return false;

        if (this.subscribeData.lastPromptTime > 0) {
            if (now - this.subscribeData.lastPromptTime < cooldown.minIntervalMs) return false;
        }

        return true;
    }

    _isAllSubscribed() {
        const statuses = this.subscribeData.templateStatuses;
        return SUBSCRIBE_MESSAGE_CONFIG.tmplIds.every(
            (id) => statuses[id] === 'accept' || statuses[id] === 'repeat'
        );
    }

    /**
     * 智能选择模板：优先未弹过的 → 被拒绝的 → 失败的
     */
    _selectTemplate() {
        const statuses = this.subscribeData.templateStatuses;
        const ids = [...SUBSCRIBE_MESSAGE_CONFIG.tmplIds];

        const unknown = ids.filter((id) => !statuses[id] || statuses[id] === 'unknown');
        if (unknown.length > 0) return unknown[Math.floor(Math.random() * unknown.length)];

        const rejected = ids.filter((id) => statuses[id] === 'reject');
        if (rejected.length > 0) return rejected[Math.floor(Math.random() * rejected.length)];

        const failed = ids.filter((id) => statuses[id] === 'fail');
        if (failed.length > 0) return failed[Math.floor(Math.random() * failed.length)];

        // 全部已订阅，无需再弹
        if (this._isAllSubscribed()) return null;

        return null;
    }

    _handleSubscribeResult(res, tmplId, scene) {
        if (res.templateSettings) {
            for (const id of Object.keys(res.templateSettings)) {
                const setting = res.templateSettings[id];
                console.log('[SubscribeMsg] 模板结果:', SUBSCRIBE_MESSAGE_CONFIG.templateLabels[id],
                    '状态:', setting.status, '长期:', setting.alwaysSubscribe);
                this.subscribeData.templateStatuses[id] = setting.status;
            }
        } else {
            // 旧版基础库兼容
            for (const id of SUBSCRIBE_MESSAGE_CONFIG.tmplIds) {
                if (res[id]) {
                    this.subscribeData.templateStatuses[id] = res[id];
                }
            }
        }
        this._saveSubscribeData();
    }

    _handleSubscribeError(err) {
        const code = err.errorCode;
        const handling = SUBSCRIBE_MESSAGE_CONFIG.errorHandling;

        switch (code) {
            case 118508: // 主开关关闭
                if (handling.mainSwitchOff && handling.mainSwitchOff.guideToSetting) {
                    this.guideToSetting();
                }
                break;
            case 118509: // 所有模板长期拒绝
                if (handling.allDenied && handling.allDenied.guideToSetting) {
                    this.guideToSetting();
                }
                break;
            case 118585: // 网络不可用 → 静默
            case 118506: // 用户拒绝登录 → 静默
            case 118505: // 用户拒绝授权 → 静默
                break;
            case 118502: // 一次性/长期模板混用
                console.error('[SubscribeMsg] 严重：模板类型混用！');
                break;
            case 118501: // 模板无效
                console.error('[SubscribeMsg] 模板 ID 无效');
                break;
            default:
                console.warn('[SubscribeMsg] 未处理错误:', code, err.errMsg);
                break;
        }
    }

    _recordPrompt(scene, tmplId) {
        const today = this._getTodayDate();
        if (this.subscribeData.dailyPromptDate !== today) {
            this.subscribeData.dailyPromptCount = 0;
            this.subscribeData.dailyPromptDate = today;
        }
        this.subscribeData.dailyPromptCount++;
        this.subscribeData.totalPrompts++;
        this.subscribeData.lastPromptTime = Date.now();
        this.subscribeData.lastPromptScene = scene;
        this._saveSubscribeData();
    }

    _getTodayDate() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
}
