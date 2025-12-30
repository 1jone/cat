import { Entity } from './Entity';
import { CONFIG } from '../config';
export class Butterfly extends Entity {
    constructor(position) {
        super(position, CONFIG.BUTTERFLY.RADIUS);
        Object.defineProperty(this, "baseY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "time", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "direction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.points = CONFIG.BUTTERFLY.POINTS;
        this.baseY = position.y;
        this.direction = Math.random() < 0.5 ? -1 : 1;
        this.time = Math.random() * Math.PI * 2;
    }
    update(dt, canvasWidth, canvasHeight) {
        this.time += dt * CONFIG.BUTTERFLY.FREQUENCY * Math.PI;
        this.position.x += this.direction * CONFIG.BUTTERFLY.SPEED * dt;
        this.position.y = this.baseY + Math.sin(this.time) * CONFIG.BUTTERFLY.AMPLITUDE;
        if (this.position.x - this.radius < 0) {
            this.position.x = this.radius;
            this.direction = 1;
        }
        else if (this.position.x + this.radius > canvasWidth) {
            this.position.x = canvasWidth - this.radius;
            this.direction = -1;
        }
        if (this.position.y - this.radius < 50) {
            this.baseY = 50 + this.radius + CONFIG.BUTTERFLY.AMPLITUDE;
        }
        else if (this.position.y + this.radius > canvasHeight - 50) {
            this.baseY = canvasHeight - 50 - this.radius - CONFIG.BUTTERFLY.AMPLITUDE;
        }
    }
    render(ctx) {
        ctx.save();
        const wingOffset = Math.sin(this.time * 3) * 5;
        ctx.fillStyle = CONFIG.BUTTERFLY.COLOR;
        ctx.beginPath();
        ctx.ellipse(this.position.x - 12 - wingOffset, this.position.y - 5, 15, 20, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.position.x + 12 + wingOffset, this.position.y - 5, 15, 20, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#7B4397';
        ctx.beginPath();
        ctx.ellipse(this.position.x - 10 - wingOffset * 0.5, this.position.y + 10, 10, 12, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.position.x + 10 + wingOffset * 0.5, this.position.y + 10, 10, 12, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.ellipse(this.position.x, this.position.y, 5, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.position.x - 3, this.position.y - 15);
        ctx.quadraticCurveTo(this.position.x - 8, this.position.y - 25, this.position.x - 5, this.position.y - 30);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.position.x + 3, this.position.y - 15);
        ctx.quadraticCurveTo(this.position.x + 8, this.position.y - 25, this.position.x + 5, this.position.y - 30);
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(this.position.x - 15, this.position.y - 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.position.x + 15, this.position.y - 8, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.restore();
    }
}
