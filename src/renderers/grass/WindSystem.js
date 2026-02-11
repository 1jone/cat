/**
 * WindSystem - 风系统
 * 计算全局风向和阵风效果
 */

import { Vector2 } from '../../utils/Vector2';

export class WindSystem {
    /**
     * @param {Object} config - 风系统配置
     * @param {number} config.baseAngle - 基础风向角度（弧度）
     * @param {number} config.gustDuration - 阵风周期（毫秒）
     * @param {number} config.gustIntensity - 阵风强度（0-1）
     */
    constructor(config) {
        this.baseAngle = config.baseAngle || 0;
        this.gustDuration = config.gustDuration || 3000;
        this.gustIntensity = config.gustIntensity || 0.8;

        // 状态
        this.gustTimer = 0;
        this.gustPhase = 0; // 阵风相位（0-1）
        this.currentIntensity = 1;
        this.currentWindVector = new Vector2(1, 0);
    }

    /**
     * 更新风系统状态
     * @param {number} dt - 时间增量（秒）
     * @param {number} time - 当前时间（毫秒）
     * @returns {Vector2} 当前风向向量
     */
    update(dt, time) {
        // 更新阵风计时器
        this.gustTimer += dt * 1000;

        // 计算阵风相位（0-1 循环）
        this.gustPhase = (this.gustTimer % this.gustDuration) / this.gustDuration;

        // 阵风使用正弦波，产生周期性的强弱变化
        // 使用半个正弦波周期，让阵风有"积蓄-释放-恢复"的感觉
        const gustFactor = Math.sin(this.gustPhase * Math.PI);

        // 计算当前强度（基础强度 + 阵风影响）
        this.currentIntensity = 1 + gustFactor * this.gustIntensity;

        // 风向轻微摆动（±0.2 弧度，约 ±11.5 度）
        // 使用不同的频率产生更自然的变化
        const angleVariance = Math.sin(time * 0.001) * 0.15 + Math.sin(time * 0.0007) * 0.05;

        // 计算最终风向
        const finalAngle = this.baseAngle + angleVariance;

        // 更新风向量
        this.currentWindVector = new Vector2(
            Math.cos(finalAngle) * this.currentIntensity,
            Math.sin(finalAngle) * this.currentIntensity
        );

        return this.currentWindVector;
    }

    /**
     * 获取当前风向向量
     * @returns {Vector2}
     */
    getWindVector() {
        return this.currentWindVector;
    }

    /**
     * 获取当前强度
     * @returns {number}
     */
    getIntensity() {
        return this.currentIntensity;
    }

    /**
     * 获取阵风信息（用于调试或可视化）
     * @returns {{phase: number, intensity: number}}
     */
    getGustInfo() {
        return {
            phase: this.gustPhase,
            intensity: this.currentIntensity
        };
    }

    /**
     * 重置风系统状态
     */
    reset() {
        this.gustTimer = 0;
        this.gustPhase = 0;
        this.currentIntensity = 1;
    }

    /**
     * 设置基础风向
     * @param {number} angle - 风向角度（弧度）
     */
    setBaseDirection(angle) {
        this.baseAngle = angle;
    }
}
