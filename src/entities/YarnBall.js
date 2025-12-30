import { Entity } from './Entity';
import { Vector2 } from '../utils/Vector2';
import { CONFIG } from '../config';
export class YarnBall extends Entity {
    constructor(position) {
        super(position, CONFIG.YARN_BALL.RADIUS);
        Object.defineProperty(this, "velocity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.points = CONFIG.YARN_BALL.POINTS;
        const angle = Math.random() * Math.PI * 2;
        const speed = CONFIG.YARN_BALL.SPEED;
        this.velocity = new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed);
    }
    update(dt, canvasWidth, canvasHeight) {
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;
        if (this.position.x - this.radius < 0) {
            this.position.x = this.radius;
            this.velocity.x *= -1;
        }
        else if (this.position.x + this.radius > canvasWidth) {
            this.position.x = canvasWidth - this.radius;
            this.velocity.x *= -1;
        }
        if (this.position.y - this.radius < 0) {
            this.position.y = this.radius;
            this.velocity.y *= -1;
        }
        else if (this.position.y + this.radius > canvasHeight) {
            this.position.y = canvasHeight - this.radius;
            this.velocity.y *= -1;
        }
    }
    render(ctx) {
        ctx.save();
        ctx.fillStyle = CONFIG.YARN_BALL.COLOR;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#CC5555';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.position.x - 5, this.position.y - 5, 8, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(this.position.x + 3, this.position.y + 3, 5, Math.PI * 0.5, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = '#FF8888';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.position.x + this.radius * 0.7, this.position.y + this.radius * 0.3);
        ctx.quadraticCurveTo(this.position.x + this.radius * 1.5, this.position.y + this.radius * 0.5, this.position.x + this.radius * 1.8, this.position.y + this.radius * 1.2);
        ctx.stroke();
        ctx.restore();
    }
}
