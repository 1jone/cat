/**
 * GameStateManager - 游戏状态管理器
 * 集中管理游戏状态、分数、模式等
 */

import { CONFIG, ENDLESS_CONFIG, TARGET_TYPES } from '../config';

/**
 * 游戏状态枚举
 * @readonly
 * @enum {string}
 */
export const GameState = {
    START: 'start',
    SELECT: 'select',
    PLAYING: 'playing',
    OVER: 'over',
    SETTINGS: 'settings'
};

export class GameStateManager {
    constructor() {
        // 基础状态
        this.state = GameState.START;
        this.previousState = null; // 进入设置前的状态

        // 分数和时间
        this.score = 0;
        this.timeLeft = CONFIG.GAME_DURATION;
        this.gameTimer = 0;

        // 无尽模式相关
        this.isEndlessMode = false;
        this.currentMultipliers = {
            speed: 1,
            radius: 1,
            points: 1
        };
        this.attributeChangeTimer = 0;

        // 解锁系统
        this.unlockedTargetIndices = [];
        this.nextUnlockScore = ENDLESS_CONFIG.UNLOCK_SCORE_INTERVAL;
        this.unlockNotification = null;

        // 当前选择的目标
        this.selectedTarget = null;
        this.currentTargetId = null;  // 当前目标ID（用于得分统计）

        // 抓取特效
        this.catchEffect = null;

        // 倒计时音效状态
        this.lastCountdownSecond = -1;

        // 广告管理器（由 Game.js 设置）
        this.adManager = null;

        // 待处理的解锁广告
        this.pendingUnlockAd = false;
    }

    /**
     * 设置广告管理器
     * @param {AdManager} adManager - 广告管理器实例
     */
    setAdManager(adManager) {
        this.adManager = adManager;
    }

    /**
     * 获取当前状态
     * @returns {string} 当前游戏状态
     */
    getState() {
        return this.state;
    }

    /**
     * 设置状态
     * @param {string} newState - 新状态
     */
    setState(newState) {
        this.state = newState;
    }

    /**
     * 进入设置界面
     */
    enterSettings() {
        this.previousState = this.state;
        this.state = GameState.SETTINGS;
    }

    /**
     * 退出设置界面
     */
    exitSettings() {
        if (this.previousState) {
            this.state = this.previousState;
            this.previousState = null;
        } else {
            this.state = GameState.SELECT;
        }
    }

    /**
     * 开始游戏
     * @param {object} target - 选中的目标配置
     * @param {boolean} isEndless - 是否无尽模式
     */
    startGame(target, isEndless = false) {
        this.state = GameState.PLAYING;
        this.score = 0;
        this.gameTimer = 0;
        this.isEndlessMode = isEndless;
        this.timeLeft = isEndless ? Infinity : CONFIG.GAME_DURATION;
        this.attributeChangeTimer = 0;
        this.lastCountdownSecond = -1;
        this.selectedTarget = target;
        this.currentTargetId = target ? target.id : null;  // 记录目标ID

        // 重置乘数
        this.currentMultipliers = {
            speed: 1,
            radius: 1,
            points: 1
        };
    }

    /**
     * 开始无尽模式
     */
    startEndlessMode() {
        // 随机选择初始目标
        const initialIndex = Math.floor(Math.random() * TARGET_TYPES.length);
        this.unlockedTargetIndices = [initialIndex];
        this.nextUnlockScore = ENDLESS_CONFIG.UNLOCK_SCORE_INTERVAL;

        this.startGame(TARGET_TYPES[initialIndex], true);
    }

    /**
     * 结束游戏
     */
    endGame() {
        this.state = GameState.OVER;
    }

    /**
     * 重置到选择界面
     */
    resetToSelect() {
        this.state = GameState.SELECT;
        this.score = 0;
        this.isEndlessMode = false;
        this.unlockedTargetIndices = [];
        this.selectedTarget = null;
    }

    /**
     * 增加分数
     * @param {number} points - 增加的分数
     */
    addScore(points) {
        this.score += points;
    }

    /**
     * 获取当前目标ID
     * @returns {string|null} 当前目标ID
     */
    getCurrentTargetId() {
        return this.currentTargetId;
    }

    /**
     * 设置抓取特效
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     * @param {number} points - 分数
     */
    setCatchEffect(x, y, points) {
        this.catchEffect = {
            x,
            y,
            time: 0.4,
            points
        };
    }

    /**
     * 更新抓取特效
     * @param {number} dt - 时间增量
     */
    updateCatchEffect(dt) {
        if (this.catchEffect) {
            this.catchEffect.time -= dt;
            if (this.catchEffect.time <= 0) {
                this.catchEffect = null;
            }
        }
    }

    /**
     * 检查是否解锁新目标（无尽模式）
     * @returns {object|null} 解锁的目标配置或 null
     */
    checkUnlock() {
        if (!this.isEndlessMode) return null;
        if (this.unlockedTargetIndices.length >= TARGET_TYPES.length) return null;
        if (this.score < this.nextUnlockScore) return null;

        // 找到下一个未解锁的目标
        let nextIndex = -1;
        for (let i = 0; i < TARGET_TYPES.length; i++) {
            let unlocked = false;
            for (let j = 0; j < this.unlockedTargetIndices.length; j++) {
                if (this.unlockedTargetIndices[j] === i) {
                    unlocked = true;
                    break;
                }
            }
            if (!unlocked) {
                nextIndex = i;
                break;
            }
        }

        if (nextIndex !== -1) {
            this.unlockedTargetIndices.push(nextIndex);
            this.unlockNotification = {
                message: `解锁新目标：${TARGET_TYPES[nextIndex].name}！`,
                time: ENDLESS_CONFIG.UNLOCK_NOTIFICATION_DURATION / 1000
            };
            this.nextUnlockScore += ENDLESS_CONFIG.UNLOCK_SCORE_INTERVAL;

            // 检查是否应该触发无尽模式解锁广告（50%概率）
            if (this.adManager && this.adManager.shouldTriggerEndlessAd('unlock')) {
                console.log('[GameStateManager] 触发无尽模式解锁广告');
                // 标记需要显示广告（异步处理，不阻塞游戏）
                this.triggerUnlockAd(TARGET_TYPES[nextIndex]);
            }

            return TARGET_TYPES[nextIndex];
        }

        return null;
    }

    /**
     * 触发解锁广告（异步，不阻塞游戏）
     * @param {Object} unlockedTarget - 解锁的目标配置
     */
    async triggerUnlockAd(unlockedTarget) {
        if (!this.adManager) return;

        // 延迟显示广告，让玩家先看到解锁通知
        await new Promise(resolve => setTimeout(resolve, 500));

        const adShown = await this.adManager.showRewardedAd('endless_unlock_' + unlockedTarget.id);
        if (adShown) {
            this.adManager.recordAdShown();
            console.log(`[GameStateManager] 解锁广告完成: ${unlockedTarget.name}`);
        }
    }

    /**
     * 更新解锁通知
     * @param {number} dt - 时间增量
     */
    updateUnlockNotification(dt) {
        if (this.unlockNotification) {
            this.unlockNotification.time -= dt;
            if (this.unlockNotification.time <= 0) {
                this.unlockNotification = null;
            }
        }
    }

    /**
     * 随机化属性（无尽模式）
     */
    randomizeAttributes() {
        const [minSpeed, maxSpeed] = ENDLESS_CONFIG.SPEED_MULTIPLIER_RANGE;
        const [minRadius, maxRadius] = ENDLESS_CONFIG.RADIUS_MULTIPLIER_RANGE;
        const [minPoints, maxPoints] = ENDLESS_CONFIG.POINTS_MULTIPLIER_RANGE;

        this.currentMultipliers = {
            speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
            radius: minRadius + Math.random() * (maxRadius - minRadius),
            points: minPoints + Math.random() * (maxPoints - minPoints)
        };
    }

    /**
     * 更新游戏逻辑
     * @param {number} dt - 时间增量（秒）
     * @returns {object} 更新结果
     */
    update(dt) {
        const result = {
            shouldEndGame: false,
            shouldPlayCountdown: false
        };

        if (this.state !== GameState.PLAYING) {
            return result;
        }

        // 无尽模式：属性随机变化
        if (this.isEndlessMode) {
            this.attributeChangeTimer += dt * 1000;
            if (this.attributeChangeTimer >= ENDLESS_CONFIG.ATTRIBUTE_CHANGE_INTERVAL) {
                this.randomizeAttributes();
                this.attributeChangeTimer = 0;
            }
            this.gameTimer += dt * 1000;
        } else {
            // 计时模式：倒计时
            this.gameTimer += dt * 1000;
            this.timeLeft = Math.max(0, CONFIG.GAME_DURATION - Math.floor(this.gameTimer / 1000));

            // 最后10秒倒计时音效检测
            if (this.timeLeft <= 10 && this.timeLeft > 0) {
                if (this.lastCountdownSecond !== this.timeLeft) {
                    this.lastCountdownSecond = this.timeLeft;
                    result.shouldPlayCountdown = true;
                }
            }

            if (this.timeLeft <= 0) {
                result.shouldEndGame = true;
            }
        }

        // 更新特效
        this.updateCatchEffect(dt);
        this.updateUnlockNotification(dt);

        return result;
    }
}
