/**
 * TouchInfluenceSystem - 触摸影响系统
 * 处理触摸对草地的影响效果
 */

import { Vector2 } from '../../utils/Vector2';

export class TouchInfluenceSystem {
    /**
     * @param {Object} config - 触摸影响配置
     * @param {number} config.influenceRadius - 影响半径
     * @param {number} config.decay - 衰减系数
     * @param {number} config.maxInfluences - 最大同时影响数量
     */
    constructor(config) {
        this.influenceRadius = config.influenceRadius || 60;
        this.decay = config.decay || 0.95;
        this.maxInfluences = config.maxInfluences || 5;

        // 活跃的影响点列表
        this.influences = [];
    }

    /**
     * 添加触摸影响点
     * @param {{x: number, y: number}} position - 触摸位置
     */
    addTouch(position) {
        // 检查是否已经存在接近的影响点
        const existingIndex = this.influences.findIndex(inf => {
            const dx = inf.x - position.x;
            const dy = inf.y - position.y;
            return Math.sqrt(dx * dx + dy * dy) < this.influenceRadius * 0.5;
        });

        // 更新现有影响点或添加新的
        if (existingIndex >= 0) {
            this.influences[existingIndex].x = position.x;
            this.influences[existingIndex].y = position.y;
            this.influences[existingIndex].strength = Math.min(
                this.influences[existingIndex].strength + 0.3,
                1.5
            );
        } else {
            this.influences.push({
                x: position.x,
                y: position.y,
                strength: 1.0,
                radius: this.influenceRadius,
                age: 0
            });

            // 限制最大数量
            if (this.influences.length > this.maxInfluences) {
                this.influences.shift();
            }
        }
    }

    /**
     * 更新所有影响点
     * @param {number} dt - 时间增量（秒）
     */
    update(dt) {
        for (let i = this.influences.length - 1; i >= 0; i--) {
            const inf = this.influences[i];

            // 衰减强度
            inf.strength *= this.decay;
            inf.age += dt;

            // 移除强度过低的影响点
            if (inf.strength < 0.1) {
                this.influences.splice(i, 1);
            }
        }
    }

    /**
     * 获取指定位置的影响向量
     * @param {{x: number, y: number}} bladePosition - 草叶位置
     * @param {number} grassY - 草地顶部 Y 坐标
     * @returns {Vector2|null} 影响向量，如果无影响则返回 null
     */
    getInfluence(bladePosition, grassY) {
        for (const inf of this.influences) {
            const dx = bladePosition.x - inf.x;
            const dy = bladePosition.y - inf.y;

            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < inf.radius && bladePosition.y >= grassY - 20) {
                // 计算影响因子（距离越近影响越大）
                const factor = (1 - distance / inf.radius) * inf.strength;

                // 计算推开方向（从触摸点向外）
                const pushAngle = Math.atan2(dy, dx);

                // 返回影响向量
                return new Vector2(
                    Math.cos(pushAngle) * factor * 20,
                    Math.sin(pushAngle) * factor * 20 * 0.3 // Y轴影响较小
                );
            }
        }
        return null;
    }

    /**
     * 获取活跃影响点数量
     * @returns {number}
     */
    getActiveCount() {
        return this.influences.length;
    }

    /**
     * 清除所有影响点
     */
    clear() {
        this.influences = [];
    }

    /**
     * 调试：绘制影响范围
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     */
    debugDraw(ctx) {
        for (const inf of this.influences) {
            ctx.save();
            ctx.globalAlpha = inf.strength * 0.3;
            ctx.strokeStyle = '#FF6B6B';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(inf.x, inf.y, inf.radius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#FF6B6B';
            ctx.beginPath();
            ctx.arc(inf.x, inf.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}
