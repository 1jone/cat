export class Vector2 {
    constructor(x = 0, y = 0) {
        Object.defineProperty(this, "x", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: x
        });
        Object.defineProperty(this, "y", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: y
        });
    }
    add(v) {
        return new Vector2(this.x + v.x, this.y + v.y);
    }
    subtract(v) {
        return new Vector2(this.x - v.x, this.y - v.y);
    }
    multiply(scalar) {
        return new Vector2(this.x * scalar, this.y * scalar);
    }
    divide(scalar) {
        if (scalar === 0)
            return new Vector2(0, 0);
        return new Vector2(this.x / scalar, this.y / scalar);
    }
    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalize() {
        const mag = this.magnitude();
        if (mag === 0)
            return new Vector2(0, 0);
        return this.divide(mag);
    }
    distanceTo(v) {
        const dx = this.x - v.x;
        const dy = this.y - v.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    clone() {
        return new Vector2(this.x, this.y);
    }
    set(x, y) {
        this.x = x;
        this.y = y;
    }
    static random(minX, maxX, minY, maxY) {
        return new Vector2(minX + Math.random() * (maxX - minX), minY + Math.random() * (maxY - minY));
    }
}
