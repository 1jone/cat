import { Vector2 } from './utils/Vector2';
export class InputManager {
    constructor(canvas) {
        Object.defineProperty(this, "canvas", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "onTouchStart", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "onTouchMove", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "onTouchEnd", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        // 保留旧的 onTouch 用于兼容
        Object.defineProperty(this, "onTouch", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        // 记录最后一次触摸事件的时间戳，用于防止 touch/mouse 双重触发
        Object.defineProperty(this, "lastTouchTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        // 当前触摸/鼠标位置（用于受惊机制检测）
        Object.defineProperty(this, "currentTouchPosition", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        this.canvas = canvas;
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }
    handleTouchStart(e) {
        e.preventDefault();
        this.lastTouchTime = Date.now();
        const touch = e.touches[0];
        const pos = this.getCanvasPosition(touch.clientX, touch.clientY);
        this.currentTouchPosition = pos;
        this.onTouchStart?.(pos);
    }
    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const pos = this.getCanvasPosition(touch.clientX, touch.clientY);
        this.currentTouchPosition = pos;
        this.onTouchMove?.(pos);
    }
    handleTouchEnd(e) {
        e.preventDefault();
        // touchend 事件中 touches 为空，使用 changedTouches
        const touch = e.changedTouches[0];
        const pos = this.getCanvasPosition(touch.clientX, touch.clientY);
        this.currentTouchPosition = null;
        this.onTouchEnd?.(pos);
    }
    handleMouseDown(e) {
        // 防止 touch/mouse 双重触发：触摸事件后 100ms 内的鼠标事件将被忽略
        if (Date.now() - this.lastTouchTime < 100) {
            return;
        }
        const pos = this.getCanvasPosition(e.clientX, e.clientY);
        this.currentTouchPosition = pos;
        this.onTouchStart?.(pos);
        this.onTouch?.(pos);
    }
    handleMouseMove(e) {
        // 防止 touch/mouse 双重触发
        if (Date.now() - this.lastTouchTime < 200) {
            return;
        }
        const pos = this.getCanvasPosition(e.clientX, e.clientY);
        // 只有按住鼠标时才更新位置（用于受惊检测）
        if (e.buttons === 1) {
            this.currentTouchPosition = pos;
            this.onTouchMove?.(pos);
        }
    }
    handleMouseUp(e) {
        // 防止 touch/mouse 双重触发
        if (Date.now() - this.lastTouchTime < 200) {
            return;
        }
        const pos = this.getCanvasPosition(e.clientX, e.clientY);
        this.currentTouchPosition = null;
        this.onTouchEnd?.(pos);
    }
    getCanvasPosition(clientX, clientY) {
        // 触摸坐标直接对应逻辑坐标
        // Canvas 已通过 ctx.setTransform(dpr) 缩放，绘制使用逻辑坐标
        return new Vector2(clientX, clientY);
    }
}
