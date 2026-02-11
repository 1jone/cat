/**
 * GrassDecoration - 草地装饰元素类
 * 添加花朵、石头、蝴蝶等装饰元素
 */

export class GrassDecoration {
    /**
     * @param {Object} config - 装饰元素配置
     * @param {string} config.type - 装饰类型 ('flower', 'stone', 'butterfly', 'dot')
     * @param {number} config.x - X 坐标
     * @param {number} config.y - Y 坐标
     * @param {number} config.size - 大小
     * @param {string} config.color - 颜色
     * @param {number} config.opacity - 透明度
     */
    constructor(config) {
        this.type = config.type || 'dot';
        this.x = config.x;
        this.y = config.y;
        this.size = config.size || 4;
        this.color = config.color || '#FFFFFF';
        this.opacity = config.opacity || 0.6;

        // 动画状态
        this.phase = Math.random() * Math.PI * 2;
        this.swayOffset = 0;
    }

    /**
     * 更新装饰元素动画
     * @param {number} time - 当前时间（毫秒）
     * @param {Vector2} windVector - 风向向量
     */
    update(time, windVector) {
        // 根据风向轻微摆动
        const sway = Math.sin(time * 0.003 + this.phase) * 2;
        this.swayOffset = sway * windVector.x;
    }

    /**
     * 绘制装饰元素
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     */
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.translate(this.x + this.swayOffset, this.y);

        switch (this.type) {
            case 'flower':
                this._drawFlower(ctx);
                break;
            case 'stone':
                this._drawStone(ctx);
                break;
            case 'butterfly':
                this._drawButterfly(ctx);
                break;
            case 'dot':
            default:
                this._drawDot(ctx);
                break;
        }

        ctx.restore();
    }

    /**
     * 绘制花朵
     * @param {CanvasRenderingContext2D} ctx
     */
    _drawFlower(ctx) {
        const petalCount = 5;
        const petalSize = this.size * 0.8;

        // 绘制花瓣
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            ctx.save();
            ctx.rotate(angle);

            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.ellipse(0, petalSize / 2, petalSize / 3, petalSize / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 绘制花心
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.25, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 绘制石头
     * @param {CanvasRenderingContext2D} ctx
     */
    _drawStone(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();

        // 不规则形状
        const points = 6;
        for (let i = 0; i <= points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const radius = this.size * (0.8 + Math.random() * 0.4);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius * 0.6; // 压扁成椭圆

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.closePath();
        ctx.fill();

        // 添加阴影效果
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(0, this.size * 0.3, this.size * 0.8, this.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 绘制蝴蝶（简化版）
     * @param {CanvasRenderingContext2D} ctx
     */
    _drawButterfly(ctx) {
        const wingSize = this.size * 0.6;

        // 翅膀颜色
        ctx.fillStyle = this.color;

        // 左上翅膀
        ctx.beginPath();
        ctx.ellipse(-wingSize * 0.7, -wingSize * 0.3, wingSize * 0.5, wingSize * 0.7, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // 右上翅膀
        ctx.beginPath();
        ctx.ellipse(wingSize * 0.7, -wingSize * 0.3, wingSize * 0.5, wingSize * 0.7, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // 左下翅膀
        ctx.beginPath();
        ctx.ellipse(-wingSize * 0.4, wingSize * 0.3, wingSize * 0.35, wingSize * 0.5, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // 右下翅膀
        ctx.beginPath();
        ctx.ellipse(wingSize * 0.4, wingSize * 0.3, wingSize * 0.35, wingSize * 0.5, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 身体
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.ellipse(0, 0, wingSize * 0.1, wingSize * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 绘制简单圆点
     * @param {CanvasRenderingContext2D} ctx
     */
    _drawDot(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 获取装饰元素的世界坐标
     * @returns {{x: number, y: number}}
     */
    getPosition() {
        return {
            x: this.x + this.swayOffset,
            y: this.y
        };
    }
}

/**
 * 装饰元素工厂
 */
export class DecorationFactory {
    /**
     * 生成装饰元素
     * @param {number} width - 区域宽度
     * @param {number} height - 区域高度
     * @param {Object} config - 配置选项
     * @returns {GrassDecoration[]}
     */
    static generateDecorations(width, height, config = {}) {
        const decorations = [];
        const {
            flowerCount = 3,
            stoneCount = 2,
            butterflyCount = 0,
            dotCount = 8
        } = config;

        // 生成花朵
        for (let i = 0; i < flowerCount; i++) {
            decorations.push(new GrassDecoration({
                type: 'flower',
                x: Math.random() * width,
                y: Math.random() * height * 0.8,
                size: 4 + Math.random() * 3,
                color: this._randomFlowerColor(),
                opacity: 0.8
            }));
        }

        // 生成石头
        for (let i = 0; i < stoneCount; i++) {
            decorations.push(new GrassDecoration({
                type: 'stone',
                x: Math.random() * width,
                y: Math.random() * height * 0.6,
                size: 5 + Math.random() * 4,
                color: this._randomStoneColor(),
                opacity: 0.7
            }));
        }

        // 生成蝴蝶（可选，取决于位置）
        for (let i = 0; i < butterflyCount; i++) {
            decorations.push(new GrassDecoration({
                type: 'butterfly',
                x: Math.random() * width,
                y: height * 0.2 + Math.random() * height * 0.5,
                size: 6 + Math.random() * 4,
                color: this._randomButterflyColor(),
                opacity: 0.9
            }));
        }

        // 生成小圆点（保持与原始实现一致）
        for (let i = 0; i < dotCount; i++) {
            decorations.push(new GrassDecoration({
                type: 'dot',
                x: Math.random() * width,
                y: Math.random() * height * 0.75,
                size: 2 + Math.random() * 3,
                color: 'rgba(70, 140, 35, 0.5)',
                opacity: 0.5
            }));
        }

        // 按 Y 坐标排序（下方的先绘制，在上层）
        decorations.sort((a, b) => b.y - a.y);

        return decorations;
    }

    /**
     * 随机花朵颜色
     * @returns {string}
     */
    static _randomFlowerColor() {
        const colors = ['#FF6B6B', '#FFE66D', '#4ECDC4', '#FF8ED4', '#95E1D3'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * 随机石头颜色
     * @returns {string}
     */
    static _randomStoneColor() {
        const colors = ['#8B8B8B', '#A0A0A0', '#B5B5B5', '#9A9A9A'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * 随机蝴蝶颜色
     * @returns {string}
     */
    static _randomButterflyColor() {
        const colors = ['#FF9A8B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6B9D'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}
