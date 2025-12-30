import { Entity } from './Entity';
import { Vector2 } from '../utils/Vector2';
export class ImageTarget extends Entity {
    constructor(position, config) {
        super(position, config.radius);
        Object.defineProperty(this, "velocity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "image", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "imageLoaded", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "config", {
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
        Object.defineProperty(this, "baseY", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "direction", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1
        });
        this.config = config;
        this.points = config.points;
        this.baseY = position.y;
        this.image = tt.createImage();
        this.image.onload = () => {
            this.imageLoaded = true;
        };
        this.image.src = config.image;
        const angle = Math.random() * Math.PI * 2;
        this.velocity = new Vector2(Math.cos(angle) * config.speed, Math.sin(angle) * config.speed);
        this.direction = Math.random() < 0.5 ? -1 : 1;
        this.time = Math.random() * Math.PI * 2;
    }
    update(dt, canvasWidth, canvasHeight) {
        this.time += dt * 2;
        switch (this.config.movement) {
            case 'bounce':
                this.updateBounce(dt, canvasWidth, canvasHeight);
                break;
            case 'wave':
                this.updateWave(dt, canvasWidth, canvasHeight);
                break;
            case 'random':
                this.updateRandom(dt, canvasWidth, canvasHeight);
                break;
        }
    }
    updateBounce(dt, canvasWidth, canvasHeight) {
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
        else if (this.position.y + this.radius > canvasHeight - 80) {
            this.position.y = canvasHeight - 80 - this.radius;
            this.velocity.y *= -1;
        }
    }
    updateWave(dt, canvasWidth, canvasHeight) {
        this.position.x += this.direction * this.config.speed * dt;
        this.position.y = this.baseY + Math.sin(this.time) * 50;
        if (this.position.x - this.radius < 0) {
            this.position.x = this.radius;
            this.direction = 1;
        }
        else if (this.position.x + this.radius > canvasWidth) {
            this.position.x = canvasWidth - this.radius;
            this.direction = -1;
        }
        if (this.position.y - this.radius < 50) {
            this.baseY = 50 + this.radius + 50;
        }
        else if (this.position.y + this.radius > canvasHeight - 80) {
            this.baseY = canvasHeight - 80 - this.radius - 50;
        }
    }
    updateRandom(dt, canvasWidth, canvasHeight) {
        if (Math.random() < 0.02) {
            const angle = Math.random() * Math.PI * 2;
            this.velocity = new Vector2(Math.cos(angle) * this.config.speed, Math.sin(angle) * this.config.speed);
        }
        this.updateBounce(dt, canvasWidth, canvasHeight);
    }
    render(ctx) {
        ctx.save();
        const wobble = Math.sin(this.time * 3) * 0.1;
        const scale = 1 + wobble * 0.1;
        if (this.imageLoaded) {
            const size = this.radius * 2 * scale;
            ctx.drawImage(this.image, this.position.x - size / 2, this.position.y - size / 2, size, size);
        }
        else {
            ctx.fillStyle = '#CCCCCC';
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y, this.radius * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#666666';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('加载中...', this.position.x, this.position.y + 5);
        }
        ctx.restore();
    }
}
