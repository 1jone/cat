/**
 * StartScreen - 开始界面
 * 负责渲染游戏开始界面
 */

export class StartScreen {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
    }

    /**
     * 渲染开始界面
     */
    render() {
        const ctx = this.ctx;

        // 半透明遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 标题
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🐱 小猫追追追', this.canvas.width / 2, this.canvas.height / 2 - 60);

        // 说明文字
        ctx.font = '24px Arial';
        ctx.fillText('点击屏幕上移动的目标得分！', this.canvas.width / 2, this.canvas.height / 2);

        // 开始提示
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('👆 点击开始', this.canvas.width / 2, this.canvas.height / 2 + 80);
    }
}
