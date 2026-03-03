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

        // 当前选择的目标
        this.selectedTarget = null;
        this.currentTargetId = null;  // 当前目标ID（用于得分统计）

        // 抓取特效
        this.catchEffect = null;

        // 烟花特效（多彩线群专用）
        this.fireworkEffect = null;

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
     * 获取无尽模式可用的目标索引
     * @returns {number[]} 可用目标索引数组
     */
    getAvailableTargetIndices() {
        // 直接返回所有目标索引
        return TARGET_TYPES.map((_, i) => i);
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
    startEndlessMode(targetConfig) {
        // 直接使用用户选择的目标启动游戏
        this.startGame(targetConfig, true);
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
     * @param {string} type - 目标类型（用于调整爪印大小）
     */
    setCatchEffect(x, y, points, type = 'default') {
        this.catchEffect = {
            x,
            y,
            time: 0.4,
            points,
            type
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
     * 设置烟花绽开特效
     * @param {number} x - 点击位置X
     * @param {number} y - 点击位置Y
     * @param {string[]} colors - 颜色数组
     */
    setFireworkEffect(x, y, colors) {
        // 生成粒子数组
        const particleCount = 30; // 粒子数量
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            // 随机角度（0-2π）
            const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.2;

            // 随机速度（100-200 像素/秒）
            const speed = 100 + Math.random() * 100;

            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,  // X方向速度
                vy: Math.sin(angle) * speed,  // Y方向速度
                color: colors[Math.floor(Math.random() * colors.length)], // 随机颜色
                size: 3 + Math.random() * 3     // 粒子大小 3-6px
            });
        }

        this.fireworkEffect = {
            x,
            y,
            time: 0,
            colors,
            particles
        };
    }

    /**
     * 更新烟花特效
     * @param {number} dt - 时间增量（秒）
     */
    updateFireworkEffect(dt) {
        if (this.fireworkEffect) {
            this.fireworkEffect.time += dt;
            if (this.fireworkEffect.time >= 0.8) {  // 超过持续时间
                this.fireworkEffect = null;
            }
        }
    }

    /**
     * 检查是否解锁新目标（无尽模式）
     * @returns {object|null} 解锁的目标配置或 null
     */
    checkUnlock() {
        // 无尽模式不再有解锁系统，直接返回 null
        return null;
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
        this.updateFireworkEffect(dt);

        return result;
    }
}
