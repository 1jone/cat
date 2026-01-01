/**
 * GameOverScreen - 游戏结束界面
 * 负责渲染游戏结束界面
 */

export class GameOverScreen {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
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

        // 半透明遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        let yOffset = this.canvas.height / 2 - 100;

        // 标题（破纪录时显示特殊标题）
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        if (isNewRecord) {
            ctx.fillStyle = '#FFD700';
            ctx.fillText('🎉 新纪录！', this.canvas.width / 2, yOffset);
        } else {
            ctx.fillText('🎉 游戏结束！', this.canvas.width / 2, yOffset);
        }
        yOffset += 60;

        // 当前分数
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`得分: ${score}`, this.canvas.width / 2, yOffset);
        yOffset += 45;

        // 历史最高分（仅在非破纪录时显示）
        if (!isNewRecord && highScore > 0) {
            ctx.font = '22px Arial';
            ctx.fillStyle = '#AAAAAA';
            ctx.fillText(`最高记录: ${highScore}`, this.canvas.width / 2, yOffset);
            yOffset += 35;
        }

        // 无尽模式显示游戏时长
        if (isEndlessMode) {
            ctx.font = '24px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(`游戏时长: ${Math.floor(gameTimer / 1000)}秒`, this.canvas.width / 2, yOffset);
            yOffset += 40;
        }

        // 继续提示
        yOffset = Math.max(yOffset + 20, this.canvas.height / 2 + 80);
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('👆 点击选择新目标', this.canvas.width / 2, yOffset);
    }
}
