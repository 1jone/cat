import { RANK_CONFIG } from '../config.js';

/**
 * RankManager - 排行榜管理器（已修复抖音排行榜BUG）
 */
export class RankManager {
    constructor(settingsManager) {
        this.settings = settingsManager;
        this.isAvailable = false;
        this.unavailableReason = '';
        this.loginCode = null;
        this.isLoggedIn = false;

        this._checkAvailability();
    }

    _checkAvailability() {
        if (typeof tt === 'undefined') {
            this.unavailableReason = '非抖音环境';
            console.log('[RankManager] 非抖音环境，排行榜功能禁用');
            return;
        }

        if (typeof tt.getImRankList !== 'function' || typeof tt.setImRankData !== 'function') {
            const rankListExists = typeof tt.getImRankList === 'function';
            const rankDataExists = typeof tt.setImRankData === 'function';
            this.unavailableReason = `API不存在: getImRankList=${rankListExists}, setImRankData=${rankDataExists}`;
            console.log('[RankManager] 排行榜API不存在:', this.unavailableReason);
            return;
        }

        try {
            const systemInfo = tt.getSystemInfoSync();
            const sdkVersion = systemInfo.SDKVersion || '0.0.0';
            const appVersion = systemInfo.appVersion || '0.0.0';

            const sdkOk = this._compareVersion(sdkVersion, RANK_CONFIG.MIN_SDK_VERSION) >= 0;
            const appVersionMissing = appVersion === '0.0.0';
            const appOk = appVersionMissing || this._compareVersion(appVersion, RANK_CONFIG.MIN_APP_VERSION) >= 0;

            this.isAvailable = sdkOk && appOk;

            if (!this.isAvailable) {
                this.unavailableReason = `SDK: ${sdkVersion}(需>=${RANK_CONFIG.MIN_SDK_VERSION}), App: ${appVersion}(需>=${RANK_CONFIG.MIN_APP_VERSION})`;
                console.log('[RankManager] API不可用:', this.unavailableReason);
            } else {
                console.log('[RankManager] 排行榜API可用, SDK:', sdkVersion, 'App:', appVersion);
            }
        } catch (e) {
            this.unavailableReason = `检查可用性异常: ${e.message || e}`;
            console.error('[RankManager] 检查可用性失败:', this.unavailableReason);
            this.isAvailable = false;
        }
    }

    _compareVersion(a, b) {
        const pa = a.split('.').map(Number);
        const pb = b.split('.').map(Number);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            const na = pa[i] || 0;
            const nb = pb[i] || 0;
            if (na > nb) return 1;
            if (na < nb) return -1;
        }
        return 0;
    }

    async login() {
        if (this.isLoggedIn) return this.loginCode;
        if (!this.isAvailable) return null;

        return new Promise((resolve) => {
            tt.login({
                success: (res) => {
                    this.loginCode = res.code;
                    this.isLoggedIn = true;
                    console.log('[RankManager] 登录成功');
                    resolve(res.code);
                },
                fail: (err) => {
                    console.error('[RankManager] 登录失败:', err);
                    resolve(null);
                }
            });
        });
    }

    // ======================
    // 提交分数（已修复）
    // ======================
    async submitScore(score, isEndlessMode) {
        if (!this.isAvailable) return;
        if (!this.isLoggedIn) await this.login();
        if (!this.isLoggedIn) return;

        // 对应你后台的两个排行榜 KEY
        const rankKey = isEndlessMode ? "Endless" : "TimeMode";
        const zoneId = "default"; // 固定用 default 就不会报错

        try {
            await new Promise((resolve, reject) => {
                tt.setImRankData({
                    rankKey: rankKey,    // ✅ 必传！
                    dataType: RANK_CONFIG.DATA_TYPE,
                    value: String(score),
                    zoneId: zoneId,      // ✅ 固定 default
                    success: resolve,
                    fail: reject
                });
            });
            console.log('[RankManager] 分数提交成功:', score, rankKey, zoneId);
        } catch (e) {
            console.error('[RankManager] 分数提交失败:', e.errMsg || e);
        }
    }

    // ======================
    // 打开排行榜（已修复）
    // ======================
    async openRankList(isEndlessMode) {
        if (!this.isAvailable) {
            console.log('[RankManager] 排行榜不可用，原因:', this.unavailableReason);
            tt.showToast?.({ title: '排行榜暂不可用', icon: 'none' });
            return;
        }
        if (!this.isLoggedIn) await this.login();
        if (!this.isLoggedIn) {
            tt.showToast?.({ title: '登录失败，请重试', icon: 'none' });
            return;
        }

        // ✅ 对应你后台配置的两个排行榜
        const rankKey = isEndlessMode ? "Endless" : "TimeMode";
        const zoneId = "default";
        const rankTitle = isEndlessMode ? RANK_CONFIG.RANK_TITLE.ENDLESS : RANK_CONFIG.RANK_TITLE.NORMAL;

        try {
            await new Promise((resolve, reject) => {
                tt.getImRankList({
                    rankKey: rankKey,     // ✅【最关键】你之前漏了这个！
                    relationType: RANK_CONFIG.RELATION_TYPE,
                    dataType: RANK_CONFIG.DATA_TYPE,
                    rankType: RANK_CONFIG.RANK_TYPE,
                    zoneId: zoneId,       // ✅ 固定 default
                    rankTitle: rankTitle,
                    suffix: RANK_CONFIG.UNIT,
                    success: resolve,
                    fail: reject
                });
            });
            console.log('[RankManager] 打开排行榜成功:', rankKey, zoneId);
            tt.showToast?.({ title: '打开排行榜成功', icon: 'success' });
        } catch (e) {
            console.error('[RankManager] 打开排行榜失败:', e.errMsg || e);
            tt.showToast?.({ title: '打开失败，请稍后重试', icon: 'none' });
        }
    }
}