/**
 * MouseRenderer - 吸猫优化版
 * 更自然动态 + 更真实体积 + 更强视觉吸引
 */

export class MouseRenderer {
    constructor(config) {
        this.config = {
            bodyColor: '#4A4A4A',
            darkColor: '#2A2A2A',
            tailColor: '#3A3A3A',
            earColor: '#4A4A4A',
            innerEarColor: '#777777',
            eyeColor: '#000000',
            noseColor: '#888888',

            size: 30,
            bodyWidth: 1.0,
            bodyHeight: 0.7,
            headSize: 0.35,
            earSize: 0.15,

            tailLength: 1.6,
            tailWidth: 0.12,
            tailSwingSpeed: 8,
            tailSwingSpeedStartled: 18
        };

        if (config) Object.assign(this.config, config);
    }

    render(ctx, x, y, scale, time, state = {}) {
        const { size } = this.config;
        const isStartled = state.isStartled || false;
        const isClicked = state.isClicked || false;
        const clickIntensity = state.clickIntensity || 0;

        ctx.save();
        ctx.translate(x, y);

        // 呼吸效果
        const breathe = 1 + Math.sin(time * 2) * 0.02;
        ctx.scale(scale * breathe, scale * breathe);

        // 点击发光
        if (isClicked && clickIntensity > 0) {
            ctx.shadowColor = 'rgba(255,255,255,0.8)';
            ctx.shadowBlur = 30 * clickIntensity;
        }

        // 地面阴影
        this.renderGroundShadow(ctx);

        // 尾巴
        this.renderTail(ctx, time, isStartled);

        // 身体
        this.renderBody(ctx, time, isStartled);

        // 头部
        this.renderHead(ctx, time, isStartled);

        // 耳朵
        this.renderEars(ctx, time, isStartled);

        // 眼睛
        this.renderEyes(ctx, time, isStartled);

        // 鼻子 + 胡须
        this.renderNoseAndWhiskers(ctx);

        ctx.restore();
    }

    renderGroundShadow(ctx) {
        const { size } = this.config;
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, size * 0.4, size * 0.6, size * 0.2, 0, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fill();
        ctx.restore();
    }

    renderTail(ctx, time, isStartled) {
        const { size, tailLength, tailWidth, tailColor,
                tailSwingSpeed, tailSwingSpeedStartled } = this.config;

        const speed = isStartled ? tailSwingSpeedStartled : tailSwingSpeed;
        const length = size * tailLength;
        const width = size * tailWidth;

        const sway = Math.sin(time * speed) * length * 0.2;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(-size * 0.3, 0);
        ctx.quadraticCurveTo(
            -size * 0.8,
            -length * 0.3 + sway,
            -size * 1.2,
            -length * 0.5
        );

        ctx.strokeStyle = tailColor;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.restore();
    }

    renderBody(ctx, time, isStartled) {
        const { size, bodyWidth, bodyHeight, bodyColor, darkColor } = this.config;

        const shake = isStartled ? Math.sin(time * 50) * 3 : 0;

        ctx.save();
        ctx.translate(shake, 0);

        const w = size * bodyWidth;
        const h = size * bodyHeight;

        ctx.beginPath();
        ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);

        const gradient = ctx.createRadialGradient(
            -size * 0.1, -size * 0.1, 0,
            0, 0, size * 0.6
        );
        gradient.addColorStop(0, bodyColor);
        gradient.addColorStop(1, darkColor);

        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.restore();
    }

    renderHead(ctx, time, isStartled) {
        const { size, headSize, bodyColor } = this.config;

        const headX = size * 0.35;
        const headY = -size * 0.15;
        const r = size * headSize;

        const shake = isStartled ? Math.sin(time * 60) * 2 : 0;

        ctx.save();
        ctx.translate(shake, 0);

        ctx.beginPath();
        ctx.arc(headX, headY, r, 0, Math.PI * 2);
        ctx.fillStyle = bodyColor;
        ctx.fill();

        // 头部高光
        const gradient = ctx.createRadialGradient(
            headX - r * 0.4,
            headY - r * 0.4,
            0,
            headX,
            headY,
            r
        );
        gradient.addColorStop(0, 'rgba(255,255,255,0.15)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.05)');

        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.restore();
    }
    renderEars(ctx) {
        const { size, earSize } = this.config;
    
        const headX = size * 0.35;
        const headY = -size * 0.15;
    
        // 放大一点
        const r = size * earSize * 1.3;
    
        ctx.save();
    
        // 左耳
        ctx.beginPath();
        ctx.arc(
            headX - r,
            headY - r * 1.8,   // 上移更多
            r,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = '#5a5a5a';
        ctx.fill();
    
        // 内耳
        ctx.beginPath();
        ctx.arc(
            headX - r,
            headY - r * 1.8,
            r * 0.6,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = '#8a8a8a';
        ctx.fill();
    
        // 右耳
        ctx.beginPath();
        ctx.arc(
            headX + r,
            headY - r * 1.8,
            r,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = '#5a5a5a';
        ctx.fill();
    
        ctx.beginPath();
        ctx.arc(
            headX + r,
            headY - r * 1.8,
            r * 0.6,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = '#8a8a8a';
        ctx.fill();
    
        ctx.restore();
    }

    renderEyes(ctx) {
        const { size, headSize, eyeColor } = this.config;

        const headX = size * 0.35;
        const headY = -size * 0.15;
        const eyeSize = size * 0.06;

        ctx.save();

        // 左眼
        ctx.beginPath();
        ctx.arc(headX - eyeSize * 2, headY - eyeSize * 0.5,
                eyeSize, 0, Math.PI * 2);
        ctx.fillStyle = eyeColor;
        ctx.fill();

        // 高光
        ctx.beginPath();
        ctx.arc(headX - eyeSize * 2 + 1, headY - eyeSize * 0.5 - 1,
                eyeSize * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();

        // 右眼
        ctx.beginPath();
        ctx.arc(headX + eyeSize * 2, headY - eyeSize * 0.5,
                eyeSize, 0, Math.PI * 2);
        ctx.fillStyle = eyeColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(headX + eyeSize * 2 + 1, headY - eyeSize * 0.5 - 1,
                eyeSize * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();

        ctx.restore();
    }

    renderNoseAndWhiskers(ctx) {
        const { size, noseColor } = this.config;

        const headX = size * 0.35;
        const headY = -size * 0.15;

        ctx.save();

        // 鼻子
        ctx.beginPath();
        ctx.arc(headX + 5, headY + 3, 2, 0, Math.PI * 2);
        ctx.fillStyle = noseColor;
        ctx.fill();

        // 胡须
        ctx.strokeStyle = '#aaa';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(headX + 5, headY + 3);
        ctx.lineTo(headX + 15, headY);
        ctx.moveTo(headX + 5, headY + 3);
        ctx.lineTo(headX + 15, headY + 6);
        ctx.stroke();

        ctx.restore();
    }

    getSize() {
        return this.config.size;
    }
}