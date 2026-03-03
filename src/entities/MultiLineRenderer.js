/**
 * 多彩自由游动线群渲染器（蛇形版本）
 * 特点：
 * - 多根线独立运动
 * - 真正拖尾结构
 * - 自然摆动 + 惯性
 * - 从屏幕边缘窜出
 * - 出界自动重生
 * - 线条自然变细
 */
export class MultiLineRenderer {
    constructor(config = {}) {
        this.config = {
            lineCount: 6,
            segmentCount: 30,
            segmentSpacing: 6,
            maxSpeed: 120,
            turnSpeed: 2,
            colors: [
                '#FF6B6B',
                '#4ECDC4',
                '#95E1D3',
                '#F38181',
                '#AA96DA',
                '#FCBAD3',
                '#FFFFD2',
                '#A8D8EA'
            ]
        };

        Object.assign(this.config, config);

        this.lines = [];
        this.initLines();
    }

    initLines() {
        for (let i = 0; i < this.config.lineCount; i++) {
            this.lines.push(this.createLine(i));
        }
    }

    createLine(index) {
        return {
            headX: 0,
            headY: 0,
            velocityX: 0,
            velocityY: 0,
            angle: Math.random() * Math.PI * 2,
            segments: [],
            color: this.config.colors[index % this.config.colors.length],
            active: false
        };
    }

    spawnFromEdge(line, w, h) {
        const edge = Math.floor(Math.random() * 4);

        switch (edge) {
            case 0:
                line.headX = Math.random() * w;
                line.headY = -50;
                break;
            case 1:
                line.headX = w + 50;
                line.headY = Math.random() * h;
                break;
            case 2:
                line.headX = Math.random() * w;
                line.headY = h + 50;
                break;
            case 3:
                line.headX = -50;
                line.headY = Math.random() * h;
                break;
        }

        line.angle = Math.random() * Math.PI * 2;

        const speed = this.config.maxSpeed * 0.5 + Math.random() * 40;
        line.velocityX = Math.cos(line.angle) * speed;
        line.velocityY = Math.sin(line.angle) * speed;

        line.segments = [];
        for (let i = 0; i < this.config.segmentCount; i++) {
            line.segments.push({ x: line.headX, y: line.headY });
        }

        line.active = true;
    }

    update(dt, w, h) {
        for (const line of this.lines) {

            if (!line.active) {
                this.spawnFromEdge(line, w, h);
                continue;
            }

            // 随机轻微转向
            line.angle += (Math.random() - 0.5) * this.config.turnSpeed * dt;

            const speed = Math.sqrt(line.velocityX ** 2 + line.velocityY ** 2);
            line.velocityX = Math.cos(line.angle) * speed;
            line.velocityY = Math.sin(line.angle) * speed;

            line.headX += line.velocityX * dt;
            line.headY += line.velocityY * dt;

            // 更新拖尾
            line.segments.unshift({ x: line.headX, y: line.headY });

            while (line.segments.length > this.config.segmentCount) {
                line.segments.pop();
            }

            // 出界重生
            if (
                line.headX < -200 || line.headX > w + 200 ||
                line.headY < -200 || line.headY > h + 200
            ) {
                line.active = false;
            }
        }
    }

    render(ctx) {
        for (const line of this.lines) {
            if (!line.active) continue;

            ctx.save();
            ctx.strokeStyle = line.color;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for (let i = 1; i < line.segments.length; i++) {

                const p1 = line.segments[i - 1];
                const p2 = line.segments[i];

                const t = i / line.segments.length;

                ctx.lineWidth = 6 * (1 - t * 0.8);
                ctx.globalAlpha = 1 - t * 0.4;

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }

            ctx.restore();
        }
    }
}