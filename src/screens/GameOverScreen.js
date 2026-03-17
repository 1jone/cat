/**
 * GameOverScreen - 游戏结束界面
 * 负责渲染游戏结束界面
 */

export class GameOverScreen {
    constructor(canvas, ctx, emojiManager) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.emojiManager = emojiManager;
        this.dpr = 1;  // 设备像素比

        // 新增：按钮区域定义
        this.buttonHeight = 50;
        this.buttonWidth = 140;
        this.buttonGap = 20;

        // 新增：游戏推荐区域
        this.recommendationHeight = 200;
        this.recommendationTop = 0;  // 动态计算

        // 新增：Banner广告区域
        this.bannerHeight = 150;
        this.bannerBottom = 0;  // 动态计算
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
     * 渲染游戏结束界面
     * @param {object} params - 参数
     * @param {number} params.score - 最终分数
     * @param {boolean} params.isEndlessMode - 是否无尽模式
     * @param {number} params.gameTimer - 游戏时长（毫秒）
     * @param {number} params.highScore - 历史最高分
     * @param {boolean} params.isNewRecord - 是否破纪录
     * @param {number} params.hitCount - 命中目标数
     */
    render({ score, isEndlessMode, gameTimer, highScore = 0, isNewRecord = false, hitCount = 0 }) {
        const ctx = this.ctx;
        const { width: logicalWidth, height: logicalHeight } = this.getLogicalSize();

        // 半透明遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);

        let yOffset = logicalHeight / 2 - 120;

        // === 标题区 ===
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        if (isNewRecord) {
            this.emojiManager.draw(ctx, 'party', logicalWidth / 2 - 120, yOffset - 10, 40);
            ctx.fillStyle = '#FFD700';
            ctx.fillText(' 新纪录！', logicalWidth / 2 + 10, yOffset);
        } else {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(' 游戏结束', logicalWidth / 2, yOffset);
        }
        yOffset += 50;

        // === 分数区 ===
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#AAAAAA';
        
        ctx.fillText('本局得分', logicalWidth / 2, yOffset);
        yOffset += 70;

        ctx.font = 'bold 56px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`${score}`, logicalWidth / 2, yOffset);
        yOffset += 50;

        // === 命中目标数 ===
        ctx.font = '22px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`命中目标：${hitCount}`, logicalWidth / 2, yOffset);
        yOffset += 50;

        // === 按钮区 ===
        const buttonY = yOffset + 20;
        const centerX = logicalWidth / 2;

        // 再玩一次按钮（左）
        this.drawButton(ctx, centerX - this.buttonWidth - this.buttonGap/2, buttonY,
                        this.buttonWidth, this.buttonHeight, '#4CAF50', '再玩一次');

        // 返回首页按钮（右）
        this.drawButton(ctx, centerX + this.buttonGap/2, buttonY,
                        this.buttonWidth, this.buttonHeight, '#2196F3', '返回首页');

        // === 猜你喜欢标题 ===
        this.recommendationTop = buttonY + this.buttonHeight + 40;
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('— 猜你喜欢 —', logicalWidth / 2, this.recommendationTop);

        // 游戏推荐面板由抖音API渲染，预留空间
        // 实际渲染位置由API控制

        // === Banner广告区域（底部） ===
        this.bannerBottom = logicalHeight - this.bannerHeight;
        ctx.font = '16px Arial';
        ctx.fillStyle = '#666666';
        // ctx.fillText('广告', logicalWidth / 2, this.bannerBottom - 10);
    }

    /**
     * 绘制按钮
     */
    drawButton(ctx, x, y, width, height, color, text) {
        // 按钮背景（圆角矩形）
        const radius = 12;
        ctx.fillStyle = color;
        this.roundRect(ctx, x, y, width, height, radius);
        ctx.fill();

        // 按钮文字
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x + width / 2, y + height / 2);
        ctx.textBaseline = 'alphabetic';  // 恢复默认
    }

    /**
     * 绘制圆角矩形
     */
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    /**
     * 检测按钮点击
     * @param {number} x - 触摸点X坐标
     * @param {number} y - 触摸点Y坐标
     * @returns {string|null} 'restart'|'home'|null
     */
    handleButtonClick(x, y) {
        const { width: logicalWidth, height: logicalHeight } = this.getLogicalSize();

        // 计算按钮位置（需要与render保持一致）
        let yOffset = logicalHeight / 2 - 120 + 70 + 40 + 50 + 50 + 20;
        const buttonY = yOffset;
        const centerX = logicalWidth / 2;

        // 再玩一次按钮（左）
        const restartLeft = centerX - this.buttonWidth - this.buttonGap/2;
        const restartRight = restartLeft + this.buttonWidth;
        const restartTop = buttonY;
        const restartBottom = buttonY + this.buttonHeight;

        if (x >= restartLeft && x <= restartRight && y >= restartTop && y <= restartBottom) {
            return 'restart';
        }

        // 返回首页按钮（右）
        const homeLeft = centerX + this.buttonGap/2;
        const homeRight = homeLeft + this.buttonWidth;
        const homeTop = buttonY;
        const homeBottom = buttonY + this.buttonHeight;

        if (x >= homeLeft && x <= homeRight && y >= homeTop && y <= homeBottom) {
            return 'home';
        }

        return null;
    }
}
