import { Entity } from './Entity';
import { CONFIG } from '../config';
export class Cat extends Entity {
    constructor(position) {
        super(position, CONFIG.CAT.RADIUS);
        Object.defineProperty(this, "targetPosition", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "speed", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: CONFIG.CAT.SPEED
        });
    }
    moveTo(target) {
        this.targetPosition = target.clone();
    }
    stop() {
        this.targetPosition = null;
    }
    update(dt, canvasWidth, canvasHeight) {
        if (!this.targetPosition)
            return;
        const direction = this.targetPosition.subtract(this.position);
        const distance = direction.magnitude();
        if (distance < 5) {
            this.targetPosition = null;
            return;
        }
        const normalized = direction.normalize();
        const movement = normalized.multiply(this.speed * dt);
        if (movement.magnitude() > distance) {
            this.position = this.targetPosition.clone();
            this.targetPosition = null;
        }
        else {
            this.position = this.position.add(movement);
        }
        this.position.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.position.x));
        this.position.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.position.y));
    }
    render(ctx) {
        ctx.save();
        ctx.fillStyle = CONFIG.CAT.COLOR;
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = CONFIG.CAT.COLOR;
        ctx.beginPath();
        ctx.moveTo(this.position.x - this.radius * 0.7, this.position.y - this.radius * 0.5);
        ctx.lineTo(this.position.x - this.radius * 0.3, this.position.y - this.radius);
        ctx.lineTo(this.position.x - this.radius * 0.1, this.position.y - this.radius * 0.5);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(this.position.x + this.radius * 0.7, this.position.y - this.radius * 0.5);
        ctx.lineTo(this.position.x + this.radius * 0.3, this.position.y - this.radius);
        ctx.lineTo(this.position.x + this.radius * 0.1, this.position.y - this.radius * 0.5);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(this.position.x - 10, this.position.y - 5, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.position.x + 10, this.position.y - 5, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(this.position.x - 10, this.position.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.position.x + 10, this.position.y - 5, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.ellipse(this.position.x, this.position.y + 5, 6, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        const whiskerLength = 20;
        ctx.beginPath();
        ctx.moveTo(this.position.x - 15, this.position.y + 5);
        ctx.lineTo(this.position.x - 15 - whiskerLength, this.position.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.position.x - 15, this.position.y + 8);
        ctx.lineTo(this.position.x - 15 - whiskerLength, this.position.y + 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.position.x + 15, this.position.y + 5);
        ctx.lineTo(this.position.x + 15 + whiskerLength, this.position.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.position.x + 15, this.position.y + 8);
        ctx.lineTo(this.position.x + 15 + whiskerLength, this.position.y + 10);
        ctx.stroke();
        ctx.restore();
    }
}
