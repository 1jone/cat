import { drawRoundRect } from '../utils/CanvasUtils';

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
        // ctx.fillText('点击屏幕上移动的目标得分！', logicalWidth / 2, logicalHeight / 2 - 15 + offsetY);

        // 游戏说明卡片
        this.renderGameGuide(ctx, logicalWidth, logicalHeight, offsetY);

        // 开始按钮
        this.renderStartButton(ctx, logicalWidth, logicalHeight, offsetY);
    }

    /**
     * 渲染开始按钮文字
     */
    renderStartButton(ctx, logicalWidth, logicalHeight, offsetY) {
        const startY = logicalHeight / 2 + 130 + offsetY;

        ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
        ctx.shadowBlur = 12;
        ctx.font = 'bold 34px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText('开始游戏', logicalWidth / 2, startY);

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
    }

    /**
     * 渲染游戏说明卡片
     */
    renderGameGuide(ctx, logicalWidth, logicalHeight, offsetY) {
        const scale = logicalWidth / 370;

        const cardWidth = 300 * scale;
        const cardHeight = 90 * scale;
        const cardX = (logicalWidth - cardWidth) / 2;
        const cardY = logicalHeight / 2 -20 + offsetY;
        const radius = 14 * scale;

        // 卡片背景
        ctx.shadowColor = 'rgba(255, 255, 255, 0.08)';
        ctx.shadowBlur = 12 * scale;
        drawRoundRect(ctx, cardX, cardY, cardWidth, cardHeight, radius);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // 卡片边框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 3 行图文说明
        const guides = [
{ emoji: 'paw', text: '小猫出动！伸出爪爪抓住乱跑的小东西！' },
{ emoji: 'finger', text: '用爪垫轻轻点一下，会动的目标就被抓到啦~' },
{ emoji: 'star', text: '抓到不同猎物会得不同小鱼干分数，看看猫猫能拿多高！' },
        ];

        const fontSize = Math.round(10 * scale);
        const emojiSize = Math.round(20 * scale);
        const lineHeight = 24 * scale;
        const startX = cardX + 16 * scale;
        const startY = cardY + 14 * scale + fontSize / 2;

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = `${fontSize}px Arial`;

        guides.forEach((guide, i) => {
            const y = startY + i * lineHeight;
            this.emojiManager.draw(ctx, guide.emoji, startX + emojiSize / 2, y, emojiSize);
            ctx.fillText(guide.text, startX + emojiSize + 8 * scale, y);
        });
    }
}
