/**
 * VocalizationBehavior - 叫声行为
 * 动物随机发出叫声（音效）
 * 此行为可以与其他行为同时发生（如装死时也可以叫）
 */

import { BEHAVIOR_CONFIG } from '../config';

export class VocalizationBehavior {
    /**
     * 检查是否应该触发叫声行为
     * @param {Entity} entity - 目标实体
     * @param {number} dt - 时间增量
     * @returns {boolean}
     */
    shouldTrigger(entity, dt) {
        const config = BEHAVIOR_CONFIG.vocalization;

        // 检查上次叫声时间
        if (entity.lastVocalizationTime && Date.now() - entity.lastVocalizationTime < config.minInterval * 1000) {
            return false;
        }

        // 计算触发概率（基于配置的间隔范围）
        // 平均每 (intervalRange[0] + intervalRange[1]) / 2 秒触发一次
        const avgInterval = (config.intervalRange[0] + config.intervalRange[1]) / 2;
        const probability = dt / avgInterval;

        if (Math.random() < probability) {
            return true;
        }

        return false;
    }

    /**
     * 行为开始时调用
     * @param {Entity} entity - 目标实体
     */
    onEnter(entity) {
        const config = BEHAVIOR_CONFIG.vocalization;

        // 记录触发时间
        entity.lastVocalizationTime = Date.now();

        // 播放音效
        this.playVocalizationSound(entity);

        // 设置持续时间
        entity.vocalizationDuration = config.duration;
        entity.vocalizationTimer = 0;
        entity.isVocalizing = true;

        console.log(`Vocalization started for ${entity.config.id}`);
    }

    /**
     * 每帧更新时调用
     * @param {Entity} entity - 目标实体
     * @param {number} dt - 时间增量
     */
    onUpdate(entity, dt) {
        entity.vocalizationTimer += dt;

        // 叫声可以与其他行为同时发生，不需要特殊处理

        // 检查是否结束
        if (entity.vocalizationTimer >= entity.vocalizationDuration) {
            entity.behaviorSystem.endBehavior('vocalization');
        }
    }

    /**
     * 行为结束时调用
     * @param {Entity} entity - 目标实体
     */
    onExit(entity) {
        entity.isVocalizing = false;
        entity.vocalizationTimer = 0;
        entity.vocalizationDuration = 0;

        console.log(`Vocalization ended for ${entity.config.id}`);
    }

    /**
     * 播放叫声音效
     * @param {Entity} entity - 目标实体
     */
    playVocalizationSound(entity) {
        const config = BEHAVIOR_CONFIG.vocalization;
        const targetId = entity.config.id;

        // 获取该目标类型的音效列表
        const sfxPaths = entity.audioManager?.getTargetSFXPath?.(targetId, '');
        if (!sfxPaths) {
            console.warn(`No vocalization sounds for target: ${targetId}`);
            return;
        }

        // 从配置中获取音效映射
        const targetSounds = this.getTargetSounds(targetId);
        if (!targetSounds || Object.keys(targetSounds).length === 0) {
            console.warn(`No vocalization sounds configured for: ${targetId}`);
            return;
        }

        // 随机选择一个音效
        let soundId;
        if (config.randomVariant) {
            const soundIds = Object.keys(targetSounds);
            soundId = soundIds[Math.floor(Math.random() * soundIds.length)];
        } else {
            soundId = Object.keys(targetSounds)[0];
        }

        // 播放音效
        if (entity.audioManager && entity.audioManager.playTargetSFX) {
            entity.audioManager.playTargetSFX(soundId, targetId);
        }
    }

    /**
     * 获取目标类型的音效列表
     * @param {string} targetId - 目标类型 ID
     * @returns {Object} 音效映射表
     */
    getTargetSounds(targetId) {
        // 从 BEHAVIOR_CONFIG 或 AUDIO_CONFIG 获取音效列表
        // 这里需要访问 AudioManager 的配置
        // 为了解耦，我们假设 entity 有一个方法可以获取音效列表

        // 简化版：硬编码支持的目标类型
        const supportedSounds = {
            captain: ['meow1', 'meow2', 'meow3', 'purr'],
            bear: ['growl1', 'growl2', 'purr1', 'roar'],
            octopus: ['bubble1', 'bubble2', 'squirt'],
            mouse: ['squeak1', 'squeak2', 'squeak3'],
            seagull: ['call1', 'call2'],
            bird: ['chirp1', 'chirp2', 'chirp3']
        };

        return supportedSounds[targetId] || {};
    }

    /**
     * 渲染叫声视觉效果（可选）
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {Entity} entity - 目标实体
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     */
    renderVisual(ctx, entity, x, y) {
        if (!entity.isVocalizing) return;

        ctx.save();
        ctx.translate(x, y);

        // 绘制声波效果（可选）
        const waveRadius = (entity.vocalizationTimer / entity.vocalizationDuration) * 30;
        ctx.strokeStyle = `rgba(255, 215, 0, ${1 - entity.vocalizationTimer / entity.vocalizationDuration})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -entity.radius - 15, waveRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}
