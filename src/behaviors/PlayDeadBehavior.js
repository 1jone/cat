/**
 * PlayDeadBehavior - 装死行为
 * 动物停止运动，倒地旋转，显示 x_x 表情，轻微晃动
 */

import { BEHAVIOR_CONFIG } from '../config';

export class PlayDeadBehavior {
    /**
     * 检查是否应该触发装死行为
     * @param {Entity} entity - 目标实体
     * @param {number} dt - 时间增量
     * @returns {boolean}
     */
    shouldTrigger(entity, dt) {
        const config = BEHAVIOR_CONFIG.playDead;

        // 随机概率触发（每秒）
        if (Math.random() < config.triggerProbability * dt) {
            return true;
        }

        return false;
    }

    /**
     * 行为开始时调用
     * @param {Entity} entity - 目标实体
     */
    onEnter(entity) {
        const config = BEHAVIOR_CONFIG.playDead;

        // 设置装死状态
        entity.isPlayingDead = true;

        // 计算持续时间
        const minDuration = config.durationRange[0];
        const maxDuration = config.durationRange[1];
        entity.playDeadDuration = minDuration + Math.random() * (maxDuration - minDuration);
        entity.playDeadTimer = 0;

        // 设置旋转角度（90度倒地）
        entity.playDeadRotation = config.visual.rotation;

        // 保存原始旋转角度
        entity.originalRotation = entity.currentRotation || 0;

        console.log(`PlayDead started for ${entity.config.id}, duration: ${entity.playDeadDuration.toFixed(2)}s`);
    }

    /**
     * 每帧更新时调用
     * @param {Entity} entity - 目标实体
     * @param {number} dt - 时间增量
     */
    onUpdate(entity, dt) {
        entity.playDeadTimer += dt;

        // 轻微晃动效果
        const config = BEHAVIOR_CONFIG.playDead.visual;
        const wobbleOffset = Math.sin(entity.playDeadTimer * config.wobbleFrequency * Math.PI * 2) * config.wobbleAmplitude;
        entity.currentRotation = entity.playDeadRotation + wobbleOffset;

        // 检查是否结束
        if (entity.playDeadTimer >= entity.playDeadDuration) {
            entity.behaviorSystem.endBehavior('playDead');
        }
    }

    /**
     * 行为结束时调用
     * @param {Entity} entity - 目标实体
     */
    onExit(entity) {
        // 恢复状态
        entity.isPlayingDead = false;

        // 恢复原始旋转角度
        entity.currentRotation = entity.originalRotation || 0;

        // 清理计时器
        entity.playDeadTimer = 0;
        entity.playDeadDuration = 0;
        entity.playDeadRotation = 0;

        console.log(`PlayDead ended for ${entity.config.id}`);
    }

    /**
     * 渲染装死表情
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {Entity} entity - 目标实体
     * @param {number} x - X 坐标
     * @param {number} y - Y 坐标
     */
    renderExpression(ctx, entity, x, y) {
        if (!entity.isPlayingDead) return;

        const config = BEHAVIOR_CONFIG.playDead.visual;
        const expression = config.expression;

        ctx.save();
        ctx.translate(x, y);

        // 根据旋转调整表情位置
        ctx.rotate(entity.currentRotation);

        // 绘制 x_x 表情
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#333333';
        ctx.fillText(expression, 0, -entity.radius - 10);

        ctx.restore();
    }
}
