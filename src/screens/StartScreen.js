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

        // 半透明遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);

        // 标题 - 使用 emoji 图片渲染猫咪
        const titleY = logicalHeight / 2 - 60;
        this.emojiManager.draw(ctx, 'cat', logicalWidth / 2 - 130, titleY - 5, 42);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(' 小猫追追追', logicalWidth / 2 + 10, titleY);

        // 说明文字
        ctx.font = '24px Arial';
        ctx.fillText('点击屏幕上移动的目标得分！', logicalWidth / 2, logicalHeight / 2);

        // 开始提示 - 使用 emoji 图片渲染手指
        const startY = logicalHeight / 2 + 80;
        this.emojiManager.draw(ctx, 'finger', logicalWidth / 2 - 80, startY - 5, 28);
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(' 点击开始', logicalWidth / 2 + 10, startY);
    }
}
