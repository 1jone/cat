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
     */
    render({ score, isEndlessMode, gameTimer, highScore = 0, isNewRecord = false }) {
        const ctx = this.ctx;
        const { width: logicalWidth, height: logicalHeight } = this.getLogicalSize();

        // 半透明遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);

        let yOffset = logicalHeight / 2 - 100;

        // 标题（破纪录时显示特殊标题）
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        if (isNewRecord) {
            // 使用 emoji 图片渲染庆祝图标
            this.emojiManager.draw(ctx, 'party', logicalWidth / 2 - 120, yOffset - 10, 40);
            ctx.fillStyle = '#FFD700';
            ctx.fillText(' 新纪录！', logicalWidth / 2 + 10, yOffset);
        } else {
            this.emojiManager.draw(ctx, 'party', logicalWidth / 2 - 130, yOffset - 10, 40);
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(' 游戏结束！', logicalWidth / 2 + 10, yOffset);
        }
        yOffset += 60;

        // 当前分数
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`得分: ${score}`, logicalWidth / 2, yOffset);
        yOffset += 45;

        // 历史最高分（仅在非破纪录时显示）
        if (!isNewRecord && highScore > 0) {
            ctx.font = '22px Arial';
            ctx.fillStyle = '#AAAAAA';
            ctx.fillText(`最高记录: ${highScore}`, logicalWidth / 2, yOffset);
            yOffset += 35;
        }

        // 无尽模式显示游戏时长
        if (isEndlessMode) {
            ctx.font = '24px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(`游戏时长: ${Math.floor(gameTimer / 1000)}秒`, logicalWidth / 2, yOffset);
            yOffset += 40;
        }

        // 继续提示 - 使用 emoji 图片渲染手指
        yOffset = Math.max(yOffset + 20, logicalHeight / 2 + 80);
        this.emojiManager.draw(ctx, 'finger', logicalWidth / 2 - 130, yOffset - 5, 26);
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(' 点击选择新目标', logicalWidth / 2 + 10, yOffset);
    }
}
