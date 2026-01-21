/**
 * BehaviorSystem - 行为系统核心模块
 * 统一管理和协调实体的各种行为（装死、叫声等）
 *
 * 行为状态机：
 * - NORMAL: 正常状态，可以触发任何行为
 * - PLAYING_DEAD: 装死中，跳过运动更新
 * - STARTLED: 受惊中（优先级最高）
 */

import { BEHAVIOR_CONFIG } from '../config';

// 行为状态枚举
export const BehaviorState = {
    NORMAL: 'normal',
    PLAYING_DEAD: 'playingDead',
    STARTLED: 'startled'  // 已有，由 ImageTarget 管理
};

// 行为优先级
export const BehaviorPriority = {
    STARTLED: 100,
    PLAYING_DEAD: 50,
    VOCALIZATION: 10
};

export class BehaviorSystem {
    /**
     * @param {Entity} entity - 所属实体
     * @param {Object} config - 行为配置（BEHAVIOR_CONFIG）
     */
    constructor(entity, config = BEHAVIOR_CONFIG) {
        this.entity = entity;
        this.config = config;

        // 当前状态
        this.currentState = BehaviorState.NORMAL;

        // 注册的行为
        this.behaviors = new Map();

        // 行为计时器
        this.timers = {
            playDead: 0,
            vocalization: 0,
            cooldown: {
                playDead: 0,
                vocalization: 0
            }
        };

        // 当前激活的行为列表（按优先级排序）
        this.activeBehaviors = [];

        // 初始化行为
        this.initBehaviors();
    }

    /**
     * 初始化行为
     */
    initBehaviors() {
        // 行为将在外部注册
        // 例如：this.registerBehavior('playDead', new PlayDeadBehavior());
        // 例如：this.registerBehavior('vocalization', new VocalizationBehavior());
    }

    /**
     * 注册行为
     * @param {string} name - 行为名称
     * @param {Object} behavior - 行为实例
     */
    registerBehavior(name, behavior) {
        this.behaviors.set(name, behavior);
        console.log(`Behavior registered: ${name}`);
    }

    /**
     * 注销行为
     * @param {string} name - 行为名称
     */
    unregisterBehavior(name) {
        this.behaviors.delete(name);
    }

    /**
     * 更新行为系统（每帧调用）
     * @param {number} dt - 时间增量（秒）
     */
    update(dt) {
        // 更新冷却计时器
        this.updateCooldowns(dt);

        // 检查是否处于受惊状态（由外部管理）
        if (this.entity.isStartled) {
            this.currentState = BehaviorState.STARTLED;
            return;  // 受惊时跳过所有行为更新
        }

        // 更新激活的行为
        this.updateActiveBehaviors(dt);

        // 尝试触发新行为
        this.tryTriggerBehaviors(dt);
    }

    /**
     * 更新冷却计时器
     */
    updateCooldowns(dt) {
        for (const key in this.timers.cooldown) {
            if (this.timers.cooldown[key] > 0) {
                this.timers.cooldown[key] -= dt;
                if (this.timers.cooldown[key] < 0) {
                    this.timers.cooldown[key] = 0;
                }
            }
        }
    }

    /**
     * 更新当前激活的行为
     */
    updateActiveBehaviors(dt) {
        // 按优先级从高到低更新
        for (const behaviorName of this.activeBehaviors) {
            const behavior = this.behaviors.get(behaviorName);
            if (behavior && behavior.onUpdate) {
                behavior.onUpdate(this.entity, dt);
            }
        }
    }

    /**
     * 尝试触发新行为
     */
    tryTriggerBehaviors(dt) {
        // 检查装死行为
        if (this.canTriggerBehavior('playDead')) {
            const playDeadBehavior = this.behaviors.get('playDead');
            if (playDeadBehavior && playDeadBehavior.shouldTrigger && playDeadBehavior.shouldTrigger(this.entity, dt)) {
                this.triggerBehavior('playDead');
                return;
            }
        }

        // 检查叫声行为（可以与其他行为同时发生）
        if (this.canTriggerBehavior('vocalization')) {
            const vocalizationBehavior = this.behaviors.get('vocalization');
            if (vocalizationBehavior && vocalizationBehavior.shouldTrigger && vocalizationBehavior.shouldTrigger(this.entity, dt)) {
                this.triggerBehavior('vocalization');
            }
        }
    }

    /**
     * 检查行为是否可以触发
     */
    canTriggerBehavior(name) {
        // 检查是否注册
        if (!this.behaviors.has(name)) return false;

        // 检查冷却
        if (this.timers.cooldown[name] > 0) return false;

        // 检查当前状态
        if (this.currentState !== BehaviorState.NORMAL) {
            // 某些行为（如叫声）可以在其他状态下触发
            if (name === 'vocalization') return true;
            return false;
        }

        // 检查配置是否启用
        const config = this.config[name];
        if (!config || !config.enabled) return false;

        // 检查目标类型支持
        if (config.supportedTargets && config.supportedTargets.length > 0) {
            if (!config.supportedTargets.includes(this.entity.config.id)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 触发行为
     */
    triggerBehavior(name) {
        const behavior = this.behaviors.get(name);
        if (!behavior) return;

        // 设置冷却时间
        const config = this.config[name];
        if (config && config.cooldown) {
            this.timers.cooldown[name] = config.cooldown;
        }

        // 调用行为的 onEnter 钩子
        if (behavior.onEnter) {
            behavior.onEnter(this.entity);
        }

        // 添加到激活列表（如果不是低优先级行为）
        const priority = BehaviorPriority[name.toUpperCase()] || 0;
        if (priority >= BehaviorPriority.PLAYING_DEAD) {
            this.activeBehaviors.push(name);
            this.activeBehaviors.sort((a, b) => {
                const priorityA = BehaviorPriority[a.toUpperCase()] || 0;
                const priorityB = BehaviorPriority[b.toUpperCase()] || 0;
                return priorityB - priorityA;  // 降序排列
            });
        }

        // 更新状态
        if (name === 'playDead') {
            this.currentState = BehaviorState.PLAYING_DEAD;
        }

        console.log(`Behavior triggered: ${name}`);
    }

    /**
     * 结束行为
     */
    endBehavior(name) {
        const behavior = this.behaviors.get(name);
        if (!behavior) return;

        // 调用行为的 onExit 钩子
        if (behavior.onExit) {
            behavior.onExit(this.entity);
        }

        // 从激活列表中移除
        const index = this.activeBehaviors.indexOf(name);
        if (index > -1) {
            this.activeBehaviors.splice(index, 1);
        }

        // 更新状态
        if (name === 'playDead' && this.currentState === BehaviorState.PLAYING_DEAD) {
            this.currentState = BehaviorState.NORMAL;
        }

        console.log(`Behavior ended: ${name}`);
    }

    /**
     * 检查是否应该跳过运动更新
     * @returns {boolean}
     */
    shouldSkipMovement() {
        // 装死时跳过运动更新
        return this.currentState === BehaviorState.PLAYING_DEAD;
    }

    /**
     * 获取当前行为状态
     */
    getCurrentState() {
        return this.currentState;
    }

    /**
     * 重置行为系统
     */
    reset() {
        this.currentState = BehaviorState.NORMAL;
        this.activeBehaviors = [];
        for (const key in this.timers.cooldown) {
            this.timers.cooldown[key] = 0;
        }
        for (const key in this.timers) {
            if (key !== 'cooldown') {
                this.timers[key] = 0;
            }
        }
    }

    /**
     * 销毁行为系统
     */
    destroy() {
        this.behaviors.clear();
        this.activeBehaviors = [];
        this.reset();
    }
}
