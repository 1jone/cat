/**
 * StartScreen - 开始界面
 * 负责渲染游戏开始界面
 */

export class StartScreen {
    constructor(canvas, ctx, emojiManager) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.emojiManager = emojiManager;
        this.dpr = 1;  // 设备像素比
    }

    /**
     * 更新设备像素比
     * @param {number} dpr - 设备像素比
     */
    setDpr(dpr) {
        this.dpr = dpr;
    }

    /**
     * 获取逻辑尺寸
     */
    getLogicalSize() {
        return {
            width: this.canvas.width / this.dpr,
            height: this.canvas.height / this.dpr
        };
    }

    /**
     * 渲染开始界面
     */
    render() {
        const ctx = this.ctx;
        const { width: logicalWidth, height: logicalHeight } = this.getLogicalSize();

        // 半透明遮罩 - 降低不透明度，让背景更清晰
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);

        // 整体向上偏移，让布局更居中
        const offsetY = -50;

        // 标题区域
        const titleY = logicalHeight / 2 - 90 + offsetY;

        // 猫咪图标 - 增大尺寸并调整位置
        this.emojiManager.draw(ctx, 'cat', logicalWidth / 2 - 140, titleY - 8, 48);

        // 游戏标题 - 增加阴影效果，更醒目
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 52px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(' 小猫追追追', logicalWidth / 2 + 10, titleY);

        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // 说明文字 - 增加间距，颜色更柔和
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '22px Arial';
        ctx.fillText('点击屏幕上移动的目标得分！', logicalWidth / 2, logicalHeight / 2 - 15 + offsetY);

        // 开始提示 - 调整位置和样式
        const startY = logicalHeight / 2 + 50 + offsetY;

        // 手指图标
        this.emojiManager.draw(ctx, 'finger', logicalWidth / 2 - 75, startY - 5, 30);

        // 金色渐变效果的开始按钮文字
        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctx.shadowBlur = 12;
        ctx.font = 'bold 34px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(' 点击开始', logicalWidth / 2 + 10, startY);

        // 重置阴影
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }
}
