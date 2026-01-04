/**
 * EmojiManager - Emoji 图片管理器
 * 负责 emoji 精灵图的加载和渲染
 *
 * 使用 Twemoji 图片资源保证跨平台一致性
 * Emoji graphics by Twitter (CC-BY 4.0)
 */

// 精灵图配置数据 (由工具生成)
const SPRITE_DATA = {
  image: 'assets/emoji/sprite.png',
  size: 72,
  frames: {
    'sound-on': { x: 0, y: 0 },
    'sound-off': { x: 72, y: 0 },
    'settings': { x: 144, y: 0 },
    'infinite': { x: 216, y: 0 },
    'timer': { x: 288, y: 0 },
    'star': { x: 360, y: 0 },
    'paw': { x: 432, y: 0 },
    'cat': { x: 504, y: 0 },
    'lock': { x: 576, y: 0 },
    'finger': { x: 648, y: 0 },
    'party': { x: 720, y: 0 },
  },
};

export class EmojiManager {
  constructor() {
    this.spriteImage = null;
    this.spriteData = SPRITE_DATA;
    this.loaded = false;
    this.loading = false;
  }

  /**
   * 预加载精灵图
   * @param {Function} onComplete - 加载完成回调
   */
  preload(onComplete) {
    if (this.loaded) {
      onComplete && onComplete();
      return;
    }

    if (this.loading) {
      return;
    }

    this.loading = true;

    const img = tt.createImage();

    img.onload = () => {
      this.spriteImage = img;
      this.loaded = true;
      this.loading = false;
      onComplete && onComplete();
    };

    img.onerror = () => {
      console.warn('Failed to load emoji sprite sheet');
      this.loading = false;
      onComplete && onComplete();
    };

    img.src = this.spriteData.image;
  }

  /**
   * 检查是否已加载
   * @returns {boolean}
   */
  isLoaded() {
    return this.loaded;
  }

  /**
   * 渲染 emoji 到 Canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {string} key - emoji 键名 (如 'sound-on', 'paw')
   * @param {number} x - 中心点 X 坐标
   * @param {number} y - 中心点 Y 坐标
   * @param {number} size - 渲染尺寸
   * @param {number} [alpha=1] - 透明度 (0-1)
   */
  draw(ctx, key, x, y, size, alpha = 1) {
    if (!this.loaded || !this.spriteImage) {
      this.drawFallback(ctx, key, x, y, size);
      return;
    }

    const frame = this.spriteData.frames[key];
    if (!frame) {
      console.warn(`Unknown emoji key: ${key}`);
      return;
    }

    const srcSize = this.spriteData.size;
    const halfSize = size / 2;

    if (alpha < 1) {
      ctx.save();
      ctx.globalAlpha = alpha;
    }

    ctx.drawImage(
      this.spriteImage,
      frame.x, frame.y, srcSize, srcSize, // 源区域
      x - halfSize, y - halfSize, size, size // 目标区域 (居中)
    );

    if (alpha < 1) {
      ctx.restore();
    }
  }

  /**
   * 渲染带旋转的 emoji
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {string} key - emoji 键名
   * @param {number} x - 中心点 X 坐标
   * @param {number} y - 中心点 Y 坐标
   * @param {number} size - 渲染尺寸
   * @param {number} rotation - 旋转角度 (弧度)
   * @param {number} [alpha=1] - 透明度
   */
  drawRotated(ctx, key, x, y, size, rotation, alpha = 1) {
    if (!this.loaded || !this.spriteImage) {
      this.drawFallback(ctx, key, x, y, size);
      return;
    }

    const frame = this.spriteData.frames[key];
    if (!frame) {
      return;
    }

    const srcSize = this.spriteData.size;
    const halfSize = size / 2;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    if (alpha < 1) {
      ctx.globalAlpha = alpha;
    }

    ctx.drawImage(
      this.spriteImage,
      frame.x, frame.y, srcSize, srcSize,
      -halfSize, -halfSize, size, size
    );

    ctx.restore();
  }

  /**
   * 渲染带缩放的 emoji (用于动画)
   * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
   * @param {string} key - emoji 键名
   * @param {number} x - 中心点 X 坐标
   * @param {number} y - 中心点 Y 坐标
   * @param {number} baseSize - 基础尺寸
   * @param {number} scale - 缩放因子
   * @param {number} [alpha=1] - 透明度
   */
  drawScaled(ctx, key, x, y, baseSize, scale, alpha = 1) {
    const size = baseSize * scale;
    this.draw(ctx, key, x, y, size, alpha);
  }

  /**
   * 后备渲染方案 - 当精灵图未加载时使用原始 emoji
   * @private
   */
  drawFallback(ctx, key, x, y, size) {
    const emojiMap = {
      'sound-on': '🔊',
      'sound-off': '🔇',
      'settings': '⚙️',
      'infinite': '♾️',
      'timer': '⏱️',
      'star': '⭐',
      'paw': '🐾',
      'cat': '🐱',
      'lock': '🔒',
      'finger': '👆',
      'party': '🎉',
    };

    const emoji = emojiMap[key];
    if (!emoji) return;

    ctx.save();
    ctx.font = `${size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x, y);
    ctx.restore();
  }

  /**
   * 获取所有可用的 emoji 键名
   * @returns {string[]}
   */
  getAvailableKeys() {
    return Object.keys(this.spriteData.frames);
  }
}
