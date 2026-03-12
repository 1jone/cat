/**
 * 静态线群渲染器
 * 用于选择界面预览，显示多条固定的彩色线
 *
 * 特点：
 * - 无需 update 调用，初始化即可渲染
 * - 线条固定在指定区域内
 * - 使用波浪形路径
 * - 支持多种颜色和渐变效果
 */
export class StaticLineRenderer {
    /**
     * @param {Object} config - 配置对象
     * @param {number} config.lineCount - 线的数量（默认5）
     * @param {number} config.segmentCount - 每条线的段数（默认20）
     * @param {number} config.size - 渲染区域大小（默认100）
     * @param {string[]} config.colors - 颜色数组
     */
    constructor(config = {}) {
        this.config = {
            lineCount: 5,
            segmentCount: 20,
            size: 100,
            colors: [
                '#FF6B6B', '#4ECDC4', '#95E1D3',
                '#F38181', '#AA96DA', '#FCBAD3',
                '#FFFFD2', '#A8D8EA'
            ]
        };

        Object.assign(this.config, config);
        this.lines = [];
        this.initLines();
    }

    /**
     * 初始化所有线条
     */
    initLines() {
        for (let i = 0; i < this.config.lineCount; i++) {
            this.lines.push(this.generateLine(i));
        }
    }

    /**
     * 生成单条线的路径
     * @param {number} index - 线的索引
     * @returns {Object} 线对象，包含颜色和段坐标
     */
    generateLine(index) {
        const line = {
            color: this.config.colors[index % this.config.colors.length],
            segments: []
        };

        // 生成波浪形路径
        for (let i = 0; i <= this.config.segmentCount; i++) {
            const t = i / this.config.segmentCount;
            const x = t * this.config.size;
            // 使用正弦波生成Y坐标，每条线有相位偏移
            const y = this.config.size / 2 +
                      Math.sin(t * Math.PI * 4 + index * 0.8) * 15;
            line.segments.push({ x, y });
        }

        return line;
    }

    /**
     * 渲染静态线群
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {number} centerX - 中心 X 坐标
     * @param {number} centerY - 中心 Y 坐标
     * @param {number} scale - 缩放比例（默认1）
     */
    render(ctx, centerX, centerY, scale = 1) {
        const size = this.config.size * scale;
        const offsetX = centerX - size / 2;
        const offsetY = centerY - size / 2;

        for (const line of this.lines) {
            ctx.save();
            ctx.strokeStyle = line.color;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // 绘制线段
            for (let i = 1; i < line.segments.length; i++) {
                const p1 = line.segments[i - 1];
                const p2 = line.segments[i];

                // 根据位置计算线宽和透明度（渐变效果）
                const t = i / line.segments.length;
                ctx.lineWidth = 4 * (1 - t * 0.5) * scale;
                ctx.globalAlpha = 1 - t * 0.3;

                ctx.beginPath();
                ctx.moveTo(
                    offsetX + p1.x * scale,
                    offsetY + p1.y * scale
                );
                ctx.lineTo(
                    offsetX + p2.x * scale,
                    offsetY + p2.y * scale
                );
                ctx.stroke();
            }

            ctx.restore();
        }
    }
}
