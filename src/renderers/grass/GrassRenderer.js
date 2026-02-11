/**
 * GrassRenderer - 草地渲染器
 * 主渲染器，协作风系统、触摸影响和多层草地渲染
 */

import { GrassBlade } from './GrassBlade';
import { GrassDecoration, DecorationFactory } from './GrassDecoration';
import { WindSystem } from './WindSystem';
import { TouchInfluenceSystem } from './TouchInfluenceSystem';
import { Vector2 } from '../../utils/Vector2';

export class GrassRenderer {
    /**
     * @param {HTMLCanvasElement} canvas - Canvas 元素
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {number} dpr - 设备像素比
     * @param {Object} config - 配置对象
     */
    constructor(canvas, ctx, dpr = 1, config = {}) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.dpr = dpr;
        this.config = config;

        // 核心系统
        this.windSystem = new WindSystem({
            baseAngle: config.wind?.baseAngle || 0,
            gustDuration: config.wind?.gustDuration || 3000,
            gustIntensity: config.wind?.gustIntensity || 0.8
        });

        this.touchSystem = new TouchInfluenceSystem({
            influenceRadius: config.touch?.influenceRadius || 60,
            decay: config.touch?.decay || 0.95,
            maxInfluences: config.touch?.maxInfluences || 5
        });

        // 草叶集合（三层）
        this.layers = {
            foreground: [], // 前景（大草）
            midground: [],  // 中景
            background: []  // 远景（小草）
        };

        // 装饰元素
        this.decorations = [];

        // 渲染区域
        this.renderArea = { x: 0, y: 0, width: 0, height: 0 };

        // LOD（细节层次）系统
        this.lodLevel = 'high';
        this.fpsHistory = [];
        this.lastFPSUpdate = 0;

        // 标记
        this.needsRegeneration = true;
        this.enabled = config.enabled !== false;
        this.animationEnabled = config.animationEnabled !== false;
        this.interactionEnabled = config.interactionEnabled !== false;
    }

    /**
     * 更新草地系统
     * @param {number} dt - 时间增量（秒）
     * @param {number} time - 当前时间（毫秒）
     */
    update(dt, time) {
        if (!this.enabled || !this.animationEnabled) return;

        // 更新风系统
        const windVector = this.windSystem.update(dt, time);

        // 更新触摸影响
        this.touchSystem.update(dt);

        // 更新装饰元素
        for (const deco of this.decorations) {
            deco.update(time, windVector);
        }

        // 更新草叶（按层级应用不同的摆动因子）
        this._updateLayer(this.layers.foreground, windVector, 1.5, time);
        this._updateLayer(this.layers.midground, windVector, 1.0, time);
        this._updateLayer(this.layers.background, windVector, 0.5, time);

        // 更新 LOD
        this._updateLOD(dt);
    }

    /**
     * 更新指定层级的草叶
     * @param {GrassBlade[]} layer - 草叶数组
     * @param {Vector2} windVector - 风向量
     * @param {number} swayFactor - 摆动因子
     * @param {number} time - 当前时间
     */
    _updateLayer(layer, windVector, swayFactor, time) {
        const skipRatio = this._getSkipRatio();

        for (let i = 0; i < layer.length; i++) {
            // LOD 跳过渲染
            if (skipRatio > 0 && Math.random() < skipRatio) continue;

            const blade = layer[i];

            // 更新风效果
            blade.updateWind(time, windVector, swayFactor);

            // 应用触摸影响
            if (this.interactionEnabled) {
                const basePos = blade.getBasePosition();
                const influence = this.touchSystem.getInfluence(basePos, this.renderArea.y);
                if (influence) {
                    blade.applyTouchInfluence(influence);
                }
            }
        }
    }

    /**
     * 渲染草地
     * @param {number} x - 渲染区域左上角 X
     * @param {number} y - 渲染区域左上角 Y
     * @param {number} width - 渲染区域宽度
     * @param {number} height - 渲染区域高度
     */
    render(x, y, width, height) {
        this.renderArea = { x, y, width, height };

        // 检查是否需要重新生成
        if (this.needsRegeneration) {
            this._generateGrass(width, height);
            this.needsRegeneration = false;
        }

        this.ctx.save();

        // 绘制背景渐变
        this._drawBackground(x, y, width, height);

        // 按层级顺序渲染（远景 → 中景 → 前景）
        this._drawLayer(this.layers.background, x, y);
        this._drawLayer(this.layers.midground, x, y);
        this._drawLayer(this.layers.foreground, x, y);

        // 绘制装饰元素
        this._drawDecorations(x, y);

        this.ctx.restore();
    }

    /**
     * 绘制背景渐变
     * @param {number} x - 左上角 X
     * @param {number} y - 左上角 Y
     * @param {number} width - 宽度
     * @param {number} height - 高度
     */
    _drawBackground(x, y, width, height) {
        const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, '#7EC850');   // 顶部较浅的绿色
        gradient.addColorStop(0.3, '#5DA038'); // 中间绿色
        gradient.addColorStop(1, '#3D7A28');   // 底部较深的绿色

        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(x, y, width, height);
    }

    /**
     * 绘制指定层级的草叶
     * @param {GrassBlade[]} layer - 草叶数组
     * @param {number} offsetX - X 偏移
     * @param {number} offsetY - Y 偏移
     */
    _drawLayer(layer, offsetX, offsetY) {
        const skipRatio = this._getSkipRatio();

        this.ctx.save();
        this.ctx.translate(offsetX, offsetY);

        for (let i = 0; i < layer.length; i++) {
            // LOD 跳过渲染
            if (skipRatio > 0 && Math.random() < skipRatio) continue;

            layer[i].draw(this.ctx);
        }

        this.ctx.restore();
    }

    /**
     * 绘制装饰元素
     * @param {number} offsetX - X 偏移
     * @param {number} offsetY - Y 偏移
     */
    _drawDecorations(offsetX, offsetY) {
        this.ctx.save();
        this.ctx.translate(offsetX, offsetY);

        for (const deco of this.decorations) {
            deco.draw(this.ctx);
        }

        this.ctx.restore();
    }

    /**
     * 生成草地（三层 + 装饰）
     * @param {number} width - 宽度
     * @param {number} height - 高度
     */
    _generateGrass(width, height) {
        this.layers = { foreground: [], midground: [], background: [] };
        this.decorations = [];

        const layerConfig = this.config.layers || this._getDefaultLayerConfig();

        // 生成远景层
        this._generateLayer(
            this.layers.background,
            width, height,
            layerConfig.background,
            0.5
        );

        // 生成中景层
        this._generateLayer(
            this.layers.midground,
            width, height,
            layerConfig.midground,
            1.0
        );

        // 生成前景层
        this._generateLayer(
            this.layers.foreground,
            width, height,
            layerConfig.foreground,
            1.5
        );

        // 生成装饰元素
        this.decorations = DecorationFactory.generateDecorations(width, height, {
            flowerCount: 6,
            stoneCount: 4,
            butterflyCount: 0,
            dotCount: 12
        });
    }

    /**
     * 生成单层草地
     * @param {GrassBlade[]} layer - 草叶数组
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {Object} config - 层级配置
     * @param {number} layerFactor - 层级因子
     */
    _generateLayer(layer, width, height, config, layerFactor) {
        const density = config.density || 8;
        const bladeCount = Math.floor(width / density);

        for (let i = 0; i < bladeCount; i++) {
            const x = (i * density) + Math.random() * (density * 0.6);
            const baseY = height; // 草叶根部在底部
            const heightRange = config.bladeHeight || [8, 14];
            const bladeHeight = heightRange[0] + Math.random() * (heightRange[1] - heightRange[0]);
            const bladeWidth = 1.5 + Math.random() * 2;

            layer.push(new GrassBlade({
                x,
                baseY,
                height: bladeHeight,
                width: bladeWidth,
                color: config.color || '#5DB835',
                opacity: config.opacity || 0.8,
                layerFactor
            }));
        }
    }

    /**
     * 获取默认层级配置
     * @returns {Object}
     */
    _getDefaultLayerConfig() {
        return {
            foreground: {
                bladeHeight: [12, 20],
                density: 5,
                opacity: 1.0,
                color: '#4A9E2D'
            },
            midground: {
                bladeHeight: [8, 14],
                density: 8,
                opacity: 0.8,
                color: '#5DB835'
            },
            background: {
                bladeHeight: [5, 10],
                density: 12,
                opacity: 0.6,
                color: '#7CD14A'
            }
        };
    }

    /**
     * 处理触摸事件
     * @param {{x: number, y: number}} position - 触摸位置
     */
    handleTouch(position) {
        if (!this.enabled || !this.interactionEnabled) return;

        // 转换到草地局部坐标
        const localPosition = {
            x: position.x - this.renderArea.x,
            y: position.y - this.renderArea.y
        };

        // 检查是否在草地范围内
        if (localPosition.y >= 0 && localPosition.y <= this.renderArea.height) {
            this.touchSystem.addTouch(localPosition);
        }
    }

    /**
     * 更新 LOD（细节层次）
     * @param {number} dt - 时间增量
     */
    _updateLOD(dt) {
        this.lastFPSUpdate += dt;

        // 每 0.5 秒更新一次 LOD
        if (this.lastFPSUpdate >= 0.5) {
            // 简化的 FPS 计算（在实际应用中应该从游戏循环获取）
            // 这里使用默认的高质量设置
            this.lodLevel = 'high';
            this.lastFPSUpdate = 0;
        }
    }

    /**
     * 获取跳过渲染的比例（LOD）
     * @returns {number} 0-1 之间的值
     */
    _getSkipRatio() {
        switch (this.lodLevel) {
            case 'high':
                return 0;
            case 'medium':
                return 0.2;
            case 'low':
                return 0.5;
            default:
                return 0;
        }
    }

    /**
     * 窗口大小变化时重新生成
     * @param {number} dpr - 设备像素比
     */
    resize(dpr = 1) {
        this.dpr = dpr;
        this.needsRegeneration = true;
    }

    /**
     * 启用/禁用草地渲染
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }

    /**
     * 启用/禁用动画
     * @param {boolean} enabled
     */
    setAnimationEnabled(enabled) {
        this.animationEnabled = enabled;
    }

    /**
     * 启用/禁用交互
     * @param {boolean} enabled
     */
    setInteractionEnabled(enabled) {
        this.interactionEnabled = enabled;
    }

    /**
     * 设置风向
     * @param {number} angle - 风向角度（弧度）
     */
    setWindDirection(angle) {
        this.windSystem.setBaseDirection(angle);
    }

    /**
     * 获取统计信息（用于调试）
     * @returns {Object}
     */
    getStats() {
        return {
            foregroundCount: this.layers.foreground.length,
            midgroundCount: this.layers.midground.length,
            backgroundCount: this.layers.background.length,
            decorationCount: this.decorations.length,
            totalBlades: this.layers.foreground.length +
                         this.layers.midground.length +
                         this.layers.background.length,
            activeTouches: this.touchSystem.getActiveCount(),
            lodLevel: this.lodLevel
        };
    }
}
