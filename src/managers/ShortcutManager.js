/**
 * ShortcutManager - 桌面快捷方式管理器
 *
 * 职责：
 * - 封装 tt.addShortcut API 调用
 * - 处理添加成功/失败回调
 * - 与奖励系统集成
 */

export class ShortcutManager {
    /**
     * @param {SettingsManager} settingsManager - 设置管理器
     * @param {StaminaManager} staminaManager - 体力管理器
     */
    constructor(settingsManager, staminaManager) {
        this.settingsManager = settingsManager;
        this.staminaManager = staminaManager;
        this.addingShortcut = false;
    }

    /**
     * 检查环境是否支持快捷方式
     * @returns {boolean}
     */
    isShortcutAvailable() {
        if (typeof tt === 'undefined') {
            console.log('[ShortcutManager] 非抖音环境');
            return false;
        }

        if (!tt.addShortcut) {
            console.log('[ShortcutManager] addShortcut API 不可用');
            return false;
        }

        return true;
    }

    /**
     * 检查是否应该显示快捷方式提示
     * @returns {boolean}
     */
    shouldShowPrompt() {
        // 如果已经添加过，不再显示
        if (this.settingsManager.hasAddedShortcut()) {
            return false;
        }

        // 如果已经看过提示并跳过，不再显示
        if (this.settingsManager.hasSeenShortcutPrompt()) {
            return false;
        }

        return true;
    }

    /**
     * 添加桌面快捷方式
     * @returns {Promise<{success: boolean, message: string, rewardAmount: number}>}
     */
    async addShortcut() {
        if (this.addingShortcut) {
            return { success: false, message: '正在添加中...' };
        }

        if (!this.isShortcutAvailable()) {
            return { success: false, message: '当前环境不支持添加快捷方式' };
        }

        this.addingShortcut = true;

        return new Promise((resolve) => {
            try {
                tt.addShortcut({
                    success: () => {
                        console.log('[ShortcutManager] ✅ 快捷方式添加成功');
                        this.addingShortcut = false;

                        // 标记已添加
                        this.settingsManager.setAddedShortcut(true);
                        this.settingsManager.save();

                        // 发放体力奖励
                        const rewardAmount = this.settingsManager.getShortcutReward();
                        const actualAdded = this.staminaManager.addStamina(rewardAmount);

                        resolve({
                            success: true,
                            message: '添加成功！获得' + actualAdded + '点体力',
                            rewardAmount: actualAdded
                        });
                    },
                    fail: (err) => {
                        console.error('[ShortcutManager] ❌ 快捷方式添加失败:', err);
                        this.addingShortcut = false;

                        let errorMessage = '添加失败';
                        if (err && err.errMsg) {
                            errorMessage = err.errMsg;
                        }

                        resolve({
                            success: false,
                            message: errorMessage
                        });
                    }
                });
            } catch (error) {
                console.error('[ShortcutManager] ❌ 调用 addShortcut 异常:', error);
                this.addingShortcut = false;
                resolve({
                    success: false,
                    message: '添加快捷方式出错: ' + error.message
                });
            }
        });
    }

    /**
     * 用户选择跳过快捷方式提示
     */
    skipPrompt() {
        this.settingsManager.setSeenShortcutPrompt(true);
        this.settingsManager.save();
        console.log('[ShortcutManager] 用户已跳过快捷方式提示');
    }
}
