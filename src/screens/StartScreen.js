/**
 * StartScreen - 开始界面
 * 负责渲染游戏开始界面
 */

export class StartScreen {
    constructor(canvas, ctx, emojiManager) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.emojiManager = emojiManager;
    }

    /**
     * 渲染开始界面
     */
    render() {
        const ctx = this.ctx;

        // 半透明遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 标题 - 使用 emoji 图片渲染猫咪
        const titleY = this.canvas.height / 2 - 60;
        this.emojiManager.draw(ctx, 'cat', this.canvas.width / 2 - 130, titleY - 5, 42);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(' 小猫追追追', this.canvas.width / 2 + 10, titleY);

        // 说明文字
        ctx.font = '24px Arial';
        ctx.fillText('点击屏幕上移动的目标得分！', this.canvas.width / 2, this.canvas.height / 2);

        // 开始提示 - 使用 emoji 图片渲染手指
        const startY = this.canvas.height / 2 + 80;
        this.emojiManager.draw(ctx, 'finger', this.canvas.width / 2 - 80, startY - 5, 28);
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(' 点击开始', this.canvas.width / 2 + 10, startY);
    }
}
