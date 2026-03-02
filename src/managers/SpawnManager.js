/**
 * SpawnManager - 目标生成管理器
 * 负责目标生成逻辑
 */

import { CONFIG, TARGET_TYPES } from '../config';
import { Vector2 } from '../utils/Vector2';
import { ImageTarget } from '../entities/ImageTarget';
import { ParticleTarget } from '../entities/ParticleTarget';
import { FishRenderer } from '../entities/FishRenderer';

export class SpawnManager {
    /**
     * @param {import('../SettingsManager').SettingsManager} settingsManager - 设置管理器
     * @param {import('../AudioManager').AudioManager} audioManager - 音频管理器
     * @param {import('../entities/MouseRenderer').MouseRenderer} mouseRenderer - 老鼠渲染器
     * @param {import('../entities/ButterflyRenderer').ButterflyRenderer} butterflyRenderer - 蝴蝶渲染器
     * @param {import('../entities/FishRenderer').FishRenderer} fishRenderer - 小鱼渲染器
     */
    constructor(settingsManager = null, audioManager = null, mouseRenderer = null, butterflyRenderer = null, fishRenderer = null) {
        // 生成计时器
        this.spawnTimer = 0;
        // 设置管理器
        this.settingsManager = settingsManager;
        // 音频管理器
        this.audioManager = audioManager;
        // 老鼠渲染器
        this.mouseRenderer = mouseRenderer;
        // 蝴蝶渲染器
        this.butterflyRenderer = butterflyRenderer;
        // 小鱼渲染器
        this.fishRenderer = fishRenderer;
    }

    /**
     * 重置计时器
     */
    reset() {
        this.spawnTimer = 0;
    }

    /**
     * 更新生成逻辑
     * @param {number} dt - 时间增量（秒）
     * @param {object} params - 参数
     * @param {number} params.canvasWidth - 画布宽度
     * @param {number} params.canvasHeight - 画布高度
     * @param {Array} params.targets - 当前目标数组
     * @param {object} params.selectedTarget - 选中的目标配置
     * @param {boolean} params.isEndlessMode - 是否无尽模式
     * @param {object} params.multipliers - 属性乘数
     * @returns {ImageTarget|null} 新生成的目标或 null
     */
    update(dt, { canvasWidth, canvasHeight, targets, selectedTarget, isEndlessMode, multipliers }) {
        this.spawnTimer += dt * 1000;

        const targetId = selectedTarget ? selectedTarget.id : undefined;

        // 从设置读取生成间隔和最大实体数，否则使用默认值
        const interval = (this.settingsManager && this.settingsManager.getSpawnInterval(targetId, isEndlessMode))
            || CONFIG.SPAWN.INTERVAL;
        const maxTargets = (this.settingsManager && this.settingsManager.getMaxTargets(targetId, isEndlessMode))
            || CONFIG.SPAWN.MAX_TARGETS;

        if (this.spawnTimer >= interval && targets.length < maxTargets) {
            this.spawnTimer = 0;
            return this.spawnTarget({
                canvasWidth,
                canvasHeight,
                selectedTarget,
                isEndlessMode,
                multipliers
            });
        }

        return null;
    }

    /**
     * 生成单个目标
     * @param {object} params - 参数
     * @returns {ImageTarget} 新生成的目标
     */
    spawnTarget({ canvasWidth, canvasHeight, selectedTarget, isEndlessMode, multipliers }) {
        const padding = 100;
        const x = padding + Math.random() * (canvasWidth - padding * 2);
        const y = padding + Math.random() * (canvasHeight - padding * 2 - 80);
        const position = new Vector2(x, y);

        const targetId = selectedTarget ? selectedTarget.id : undefined;

        // 获取用户设置的速度乘数
        const userSpeedMultiplier = (this.settingsManager && this.settingsManager.getSpeedMultiplier(targetId, isEndlessMode)) || 1;

        // 两种模式都使用用户选择的目标，但无尽模式会应用随机属性乘数来增加难度
        const baseTarget = selectedTarget;
        let targetConfig;
        if (isEndlessMode) {
            // 无尽模式：应用游戏内随机乘数和用户设置的速度乘数
            targetConfig = {
                ...baseTarget,
                speed: baseTarget.speed * (multipliers && multipliers.speed || 1) * userSpeedMultiplier,
                radius: baseTarget.radius * (multipliers && multipliers.radius || 1),
                points: Math.floor(baseTarget.points * (multipliers && multipliers.points || 1))
            };
        } else {
            // 计时模式：应用用户设置的速度乘数
            targetConfig = {
                ...baseTarget,
                speed: baseTarget.speed * userSpeedMultiplier
            };
        }

        // 根据 renderType 选择目标类
        if (targetConfig.renderType === 'particle') {
            return new ParticleTarget(position, targetConfig);
        }

        // 传入所有渲染器，由 ImageTarget 根据 config.id 选择
        const target = new ImageTarget(position, targetConfig, this.mouseRenderer, this.butterflyRenderer, this.fishRenderer);
        // 注入 audioManager 供行为系统使用
        if (this.audioManager) {
            target.audioManager = this.audioManager;
        }
        return target;
    }

    /**
     * 生成初始目标
     * @param {object} params - 参数
     * @returns {ImageTarget[]} 初始目标数组
     */
    spawnInitialTargets(params) {
        const targets = [];
        for (let i = 0; i < CONFIG.SPAWN.INITIAL_COUNT; i++) {
            targets.push(this.spawnTarget(params));
        }
        return targets;
    }
}
