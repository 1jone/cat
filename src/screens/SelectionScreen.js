/**
 * SelectionScreen - 选择界面
 * 负责目标选择界面的逻辑和渲染
 */

import { SELECTION_CONFIG, TARGET_TYPES } from '../config';
import { drawRoundRect } from '../utils/CanvasUtils';
import { ButterflyRenderer } from '../entities/ButterflyRenderer';
import { MouseRenderer } from '../entities/MouseRenderer';
import { FishRenderer } from '../entities/FishRenderer';

export class SelectionScreen {
    constructor(canvas, ctx, resourceManager, adManager = null, settingsManager = null, emojiManager = null, butterflyRenderer = null, mouseRenderer = null, fishRenderer = null, yarnRenderer = null, multilineRenderer = null) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.resourceManager = resourceManager;
        this.adManager = adManager;  // 广告管理器
        this.settingsManager = settingsManager;  // 设置管理器（用于获取最高分）
        this.emojiManager = emojiManager;  // Emoji 管理器
        this.butterflyRenderer = butterflyRenderer || new ButterflyRenderer();  // 蝴蝶渲染器
        this.mouseRenderer = mouseRenderer || new MouseRenderer();  // 老鼠渲染器
        this.fishRenderer = fishRenderer || new FishRenderer();  // 小鱼渲染器
        this.yarnRenderer = yarnRenderer;  // 毛线球渲染器
        this.multilineRenderer = multilineRenderer;  // 多线渲染器
        this.dpr = 1;  // 设备像素比

        // 滚动选择相关属性
        this.scrollOffset = 0;
        this.scrollVelocity = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartOffset = 0;
        this.currentIndex = 0;
        this.autoScrollTimer = 0;
        this.lastTouchX = 0;
        this.lastTouchTime = 0;
        this.isSnapping = false;

        // 解锁确认弹窗状态
        this.showUnlockDialog = false;
        this.unlockDialogTarget = null;

        // 模式选择弹窗状态
        this.showModeDialog = false;
        this.selectedTarget = null;

        // 粒子动画时间
        this.particleTime = 0;

        // 初始化粒子状态
        this.initParticleStates();
    }

    /**
     * 初始化粒子状态（用于粒子预览）
     */
    initParticleStates() {
        this.particleStates = new Map();

        // 为每个粒子类型目标初始化状态
        for (const item of this.resourceManager.selectionItems) {
            if (item.config.renderType === 'particle') {
                const particleCount = item.config.id === 'laser' ? 4 : 6;
                const particles = [];

                for (let i = 0; i < particleCount; i++) {
                    const angle = (i / particleCount) * Math.PI * 2;
                    particles.push({
                        angle: angle,
                        phase: Math.random() * Math.PI * 2,
                        radiusOffset: Math.random() * 0.3 - 0.15,
                        size: 0.8 + Math.random() * 0.4,
                    });
                }

                this.particleStates.set(item.config.id, {
                    particles: particles,
                    randomPhase: Math.random() * Math.PI * 2
                });
            }
        }
    }

    /**
     * 获取粒子配置（适配卡片尺寸）
     */
    getParticleConfig(config, cardSize) {
        const baseRadius = cardSize * 0.35;  // 基于卡片尺寸

        return {
            coreRadius: baseRadius * 0.4,
            coreColor: config.id === 'laser' ? '#FF0000' : '#FFD700',
            glowRadius: baseRadius * 1.5,
            glowColor: config.id === 'laser' ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 215, 0, 0.3)',
            particleCount: config.id === 'laser' ? 4 : 6,
            particleRadius: baseRadius * 0.15,
            orbitRadius: baseRadius * 0.8,
            orbitSpeed: config.id === 'laser' ? 4 : 2,
            pulseSpeed: config.id === 'laser' ? 6 : 3,
            pulseAmplitude: 0.3,
            twinkleSpeed: config.id === 'laser' ? 10 : 5,
            twinkleMin: 0.6,
            twinkleMax: 1.0,
        };
    }

    /**
     * 更新设备像素比
     * @param {number} dpr - 设备像素比
     */
    setDpr(dpr) {
        this.dpr = dpr;
    }

    /**
     * 获取逻辑尺寸
     */
    getLogicalSize() {
        return {
            width: this.canvas.width / this.dpr,
            height: this.canvas.height / this.dpr
        };
    }

    /**
     * 设置广告管理器
     * @param {AdManager} adManager - 广告管理器实例
     */
    setAdManager(adManager) {
        this.adManager = adManager;
    }

    /**
     * 重置滚动状态
     */
    reset() {
        this.scrollOffset = 0;
        this.scrollVelocity = 0;
        this.isDragging = false;
        this.currentIndex = 0;
        this.autoScrollTimer = 0;
        this.isSnapping = false;
        this.showUnlockDialog = false;
        this.unlockDialogTarget = null;
        this.showModeDialog = false;
        this.selectedTarget = null;
    }

    /**
     * 根据目标ID选中对应卡片
     * @param {string} targetId - 目标ID
     */
    selectTargetById(targetId) {
        const items = this.resourceManager.selectionItems;
        const targetIndex = items.findIndex(item => item.config.id === targetId);

        if (targetIndex !== -1) {
            const cardStep = SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING;
            this.currentIndex = targetIndex;
            this.scrollOffset = targetIndex * cardStep;
            this.autoScrollTimer = 0;
            console.log(`[SelectionScreen] 选中目标: ${targetId}, 索引: ${targetIndex}`);
        } else {
            console.warn(`[SelectionScreen] 未找到目标: ${targetId}`);
        }
    }

    /**
     * 处理触摸开始
     * @param {object} pos - 触摸位置 { x, y }
     */
    handleTouchStart(pos) {
        this.isDragging = true;
        this.dragStartX = pos.x;
        this.dragStartOffset = this.scrollOffset;
        this.lastTouchX = pos.x;
        this.lastTouchTime = performance.now();
        this.scrollVelocity = 0;
        this.isSnapping = false;
    }

    /**
     * 处理触摸移动
     * @param {object} pos - 触摸位置 { x, y }
     */
    handleTouchMove(pos) {
        if (!this.isDragging) return;

        const deltaX = pos.x - this.dragStartX;
        this.scrollOffset = this.dragStartOffset - deltaX;

        // 计算滚动速度（添加上限防止过快滑动）
        const now = performance.now();
        const dt = now - this.lastTouchTime;
        if (dt > 0) {
            const rawVelocity = (this.lastTouchX - pos.x) / dt * 16;
            const maxVelocity = 25; // 最大速度限制
            this.scrollVelocity = Math.max(-maxVelocity, Math.min(maxVelocity, rawVelocity));
        }
        this.lastTouchX = pos.x;
        this.lastTouchTime = now;

        // 边界限制（允许一点弹性）
        const cardStep = SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING;
        const maxOffset = (this.resourceManager.selectionItems.length - 1) * cardStep;
        const elasticRange = 50;

        if (this.scrollOffset < -elasticRange) {
            this.scrollOffset = -elasticRange;
        }
        if (this.scrollOffset > maxOffset + elasticRange) {
            this.scrollOffset = maxOffset + elasticRange;
        }
    }

    /**
     * 处理触摸结束
     * @param {object} pos - 触摸位置 { x, y }
     * @returns {object|null} 选中的目标配置或 null
     */
    handleTouchEnd(pos) {
        // 优先级1: 模式选择弹窗
        if (this.showModeDialog) {
            return this.handleModeDialogClick(pos);
        }

        // 优先级2: 解锁弹窗
        if (this.showUnlockDialog) {
            return this.handleUnlockDialogClick(pos);
        }

        if (!this.isDragging) return null;

        this.isDragging = false;

        // 判断是点击还是滑动
        const dragDistance = Math.abs(pos.x - this.dragStartX);
        if (dragDistance < SELECTION_CONFIG.DRAG_THRESHOLD) {
            // 这是一个点击，检查是否点击了中间的卡片
            const result = this.handleCardClick(pos);
            this.autoScrollTimer = 0;
            return result;
        } else {
            // 这是一个滑动，启动惯性滚动
            this.isSnapping = true;
            this.autoScrollTimer = 0;
            return null;
        }
    }

    /**
     * 处理卡片点击
     * @param {object} pos - 点击位置 { x, y }
     * @returns {object|null} 选中的目标配置或 null
     */
    handleCardClick(pos) {
        const cardStep = SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING;
        const targetIndex = Math.round(this.scrollOffset / cardStep);
        const clampedIndex = Math.max(0, Math.min(this.resourceManager.selectionItems.length - 1, targetIndex));

        // 计算中间卡片的位置（使用逻辑尺寸）
        const { width: logicalWidth, height: logicalHeight } = this.getLogicalSize();
        const centerX = logicalWidth / 2;
        const centerY = logicalHeight / 2 + 30;
        const cardWidth = SELECTION_CONFIG.CARD_WIDTH;
        const cardHeight = SELECTION_CONFIG.CARD_HEIGHT;

        // 检查点击是否在中间卡片区域内
        if (pos.x >= centerX - cardWidth / 2 - 20 &&
            pos.x <= centerX + cardWidth / 2 + 20 &&
            pos.y >= centerY - cardHeight / 2 - 20 &&
            pos.y <= centerY + cardHeight / 2 + 40) {

            const selectedItem = this.resourceManager.selectionItems[clampedIndex].config;

            // 检查是否是需要广告解锁的目标
            if (this.adManager && selectedItem.unlock && selectedItem.unlock.adRequired) {
                const isUnlocked = this.adManager.isTargetUnlocked(selectedItem.id);
                if (!isUnlocked) {
                    // 显示解锁确认弹窗
                    this.showUnlockDialog = true;
                    this.unlockDialogTarget = selectedItem;
                    return null;
                }
            }

            // 显示模式选择弹窗（而不是直接返回配置）
            this.showModeDialog = true;
            this.selectedTarget = selectedItem;
            return null;
        }

        return null;
    }

    /**
     * 处理解锁弹窗点击
     * @param {object} pos - 点击位置 { x, y }
     * @returns {object|null} 解锁成功后返回目标配置
     */
    handleUnlockDialogClick(pos) {
        const { width: logicalWidth, height: logicalHeight } = this.getLogicalSize();
        const centerX = logicalWidth / 2;
        const centerY = logicalHeight / 2;
        const dialogWidth = 280;
        const dialogHeight = 180;
        const buttonWidth = 100;
        const buttonHeight = 40;
        const buttonY = centerY + 40;

        // 确认按钮（观看广告）
        const confirmX = centerX - 60;
        if (pos.x >= confirmX - buttonWidth / 2 &&
            pos.x <= confirmX + buttonWidth / 2 &&
            pos.y >= buttonY - buttonHeight / 2 &&
            pos.y <= buttonY + buttonHeight / 2) {

            // 请求观看广告解锁
            this.requestUnlockTarget();
            return null;
        }

        // 取消按钮
        const cancelX = centerX + 60;
        if (pos.x >= cancelX - buttonWidth / 2 &&
            pos.x <= cancelX + buttonWidth / 2 &&
            pos.y >= buttonY - buttonHeight / 2 &&
            pos.y <= buttonY + buttonHeight / 2) {

            this.showUnlockDialog = false;
            this.unlockDialogTarget = null;
            return null;
        }

        // 点击弹窗外部关闭
        if (pos.x < centerX - dialogWidth / 2 ||
            pos.x > centerX + dialogWidth / 2 ||
            pos.y < centerY - dialogHeight / 2 ||
            pos.y > centerY + dialogHeight / 2) {

            this.showUnlockDialog = false;
            this.unlockDialogTarget = null;
        }

        return null;
    }

    /**
     * 请求解锁目标（观看广告）
     */
    async requestUnlockTarget() {
        if (!this.adManager || !this.unlockDialogTarget) return;

        const targetId = this.unlockDialogTarget.id;
        const success = await this.adManager.requestUnlock(targetId);

        if (success) {
            console.log(`[SelectionScreen] 目标 ${targetId} 解锁成功`);
            // 解锁成功后关闭弹窗
            this.showUnlockDialog = false;
            this.unlockDialogTarget = null;
        } else {
            console.log(`[SelectionScreen] 目标 ${targetId} 解锁失败`);
            // 解锁失败也关闭弹窗
            this.showUnlockDialog = false;
            this.unlockDialogTarget = null;
        }
    }

    /**
     * 处理模式选择弹窗点击
     * @param {object} pos - 点击位置 { x, y }
     * @returns {object|null} 选择结果 { config, mode } 或 null
     */
    handleModeDialogClick(pos) {
        const { width: logicalWidth, height: logicalHeight } = this.getLogicalSize();
        const centerX = logicalWidth / 2;
        const centerY = logicalHeight / 2;
        const buttonWidth = 120;
        const buttonHeight = 50;
        const buttonY = centerY + 30;

        // 无限模式按钮（左侧）
        const endlessX = centerX - 70;
        if (pos.x >= endlessX - buttonWidth / 2 &&
            pos.x <= endlessX + buttonWidth / 2 &&
            pos.y >= buttonY - buttonHeight / 2 &&
            pos.y <= buttonY + buttonHeight / 2) {
            return { config: this.selectedTarget, mode: 'endless' };
        }

        // 闯关模式按钮（右侧）
        const challengeX = centerX + 70;
        if (pos.x >= challengeX - buttonWidth / 2 &&
            pos.x <= challengeX + buttonWidth / 2 &&
            pos.y >= buttonY - buttonHeight / 2 &&
            pos.y <= buttonY + buttonHeight / 2) {
            return { config: this.selectedTarget, mode: 'challenge' };
        }

        // 点击弹窗外部关闭
        const dialogWidth = 320;
        const dialogHeight = 200;
        if (pos.x < centerX - dialogWidth / 2 ||
            pos.x > centerX + dialogWidth / 2 ||
            pos.y < centerY - dialogHeight / 2 ||
            pos.y > centerY + dialogHeight / 2) {
            this.showModeDialog = false;
            this.selectedTarget = null;
        }

        return null;
    }

    /**
     * 更新选择界面逻辑
     * @param {number} dt - 时间增量（秒）
     */
    update(dt) {
        // 更新粒子动画时间
        this.particleTime += dt;

        const cardStep = SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING;
        const maxOffset = (this.resourceManager.selectionItems.length - 1) * cardStep;

        if (!this.isDragging) {
            // 惯性滚动 - 使用渐进式阻尼
            if (Math.abs(this.scrollVelocity) > 1) {
                // 边界附近增加阻尼，防止冲出太远
                let friction = SELECTION_CONFIG.SCROLL_FRICTION;
                if (this.scrollOffset < 0 || this.scrollOffset > maxOffset) {
                    friction = 0.7; // 超出边界时大幅增加阻尼
                }

                this.scrollOffset += this.scrollVelocity;
                this.scrollVelocity *= friction;

                // 硬边界限制，防止冲出太远
                const hardLimit = cardStep * 0.5;
                if (this.scrollOffset < -hardLimit) {
                    this.scrollOffset = -hardLimit;
                    this.scrollVelocity = 0;
                }
                if (this.scrollOffset > maxOffset + hardLimit) {
                    this.scrollOffset = maxOffset + hardLimit;
                    this.scrollVelocity = 0;
                }
            } else {
                this.scrollVelocity = 0;
            }

            // 吸附到最近的卡片
            if (this.isSnapping || Math.abs(this.scrollVelocity) < 1) {
                const targetIndex = Math.round(this.scrollOffset / cardStep);
                const clampedIndex = Math.max(0, Math.min(this.resourceManager.selectionItems.length - 1, targetIndex));
                const targetOffset = clampedIndex * cardStep;

                // 平滑吸附
                this.scrollOffset += (targetOffset - this.scrollOffset) * SELECTION_CONFIG.SNAP_SPEED;

                // 如果接近目标位置，直接设置
                if (Math.abs(this.scrollOffset - targetOffset) < 0.5) {
                    this.scrollOffset = targetOffset;
                    this.currentIndex = clampedIndex;
                    this.isSnapping = false;
                }
            }

            // 边界回弹
            if (this.scrollOffset < 0) {
                this.scrollOffset += (0 - this.scrollOffset) * 0.2;
            }
            if (this.scrollOffset > maxOffset) {
                this.scrollOffset += (maxOffset - this.scrollOffset) * 0.2;
            }

            // 自动轮播
            this.autoScrollTimer += dt * 1000;
            if (this.autoScrollTimer >= SELECTION_CONFIG.AUTO_SCROLL_INTERVAL) {
                this.autoScrollTimer = 0;
                let nextIndex = this.currentIndex + 1;
                if (nextIndex >= this.resourceManager.selectionItems.length) {
                    nextIndex = 0;
                }
                this.currentIndex = nextIndex;
                this.isSnapping = true;

                // 如果从最后一个到第一个，需要特殊处理
                if (nextIndex === 0 && this.scrollOffset > cardStep) {
                    this.scrollVelocity = -this.scrollOffset / 10;
                }
            }
        } else {
            // 正在拖动时重置自动轮播计时器
            this.autoScrollTimer = 0;
        }
    }

    /**
     * 渲染选择界面
     */
    render() {
        const ctx = this.ctx;
        const { width: logicalWidth, height: logicalHeight } = this.getLogicalSize();

        // 半透明背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);

        // 标题
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('选择的目标', logicalWidth / 2, logicalHeight / 2 - 160);

        // 渲染滚动卡片列表
        const centerX = logicalWidth / 2;
        const centerY = logicalHeight / 2 + 30;
        const cardStep = SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING;

        // 按从远到近的顺序渲染（先渲染两侧，再渲染中间）
        const renderOrder = [];
        for (let i = 0; i < this.resourceManager.selectionItems.length; i++) {
            const cardOffset = i * cardStep - this.scrollOffset;
            renderOrder.push({ index: i, offset: cardOffset, absOffset: Math.abs(cardOffset) });
        }

        // 按距离中心的距离从大到小排序（远的先渲染）
        renderOrder.sort((a, b) => b.absOffset - a.absOffset);

        for (const item of renderOrder) {
            this.renderCard(item.index, centerX, centerY, item.offset);
        }

        // 渲染指示器小圆点
        this.renderIndicators(centerY);

        // 渲染模式选择弹窗（优先级最高）
        if (this.showModeDialog) {
            this.renderModeDialog();
        }

        // 渲染解锁确认弹窗
        if (this.showUnlockDialog && this.unlockDialogTarget) {
            this.renderUnlockDialog();
        }
    }

    /**
     * 渲染单个卡片
     * @param {number} index - 卡片索引
     * @param {number} centerX - 中心 X 坐标
     * @param {number} centerY - 中心 Y 坐标
     * @param {number} offset - 偏移量
     */
    renderCard(index, centerX, centerY, offset) {
        const ctx = this.ctx;
        const item = this.resourceManager.selectionItems[index];
        const cardWidth = SELECTION_CONFIG.CARD_WIDTH;
        const cardHeight = SELECTION_CONFIG.CARD_HEIGHT;
        const cardStep = SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING;
        const { width: logicalWidth } = this.getLogicalSize();

        // 计算缩放和透明度
        const distanceRatio = Math.min(Math.abs(offset) / cardStep, 1);
        const scale = 1 - distanceRatio * (1 - SELECTION_CONFIG.SIDE_SCALE);
        const opacity = 1 - distanceRatio * (1 - SELECTION_CONFIG.SIDE_OPACITY);

        // 卡片位置
        const x = centerX + offset;
        const y = centerY;

        // 如果卡片完全超出屏幕，不渲染
        if (x < -cardWidth || x > logicalWidth + cardWidth) {
            return;
        }

        ctx.save();
        ctx.globalAlpha = opacity;

        // 计算缩放后的尺寸
        const scaledWidth = cardWidth * scale;
        const scaledHeight = cardHeight * scale;

        // 卡片背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        drawRoundRect(
            ctx,
            x - scaledWidth / 2 - 10,
            y - scaledHeight / 2 - 10,
            scaledWidth + 20,
            scaledHeight + 60,
            15
        );
        ctx.fill();

        // 边框 - 中间卡片用金色，两侧用灰色
        if (distanceRatio < 0.3) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;
        } else {
            ctx.strokeStyle = '#CCCCCC';
            ctx.lineWidth = 2;
        }
        ctx.stroke();

        // 图片或粒子效果
        if (item.config.renderType === 'particle') {
            // 渲染粒子特效
            const imgSize = scaledWidth * 0.85;
            const imgCenterY = y - scaledHeight / 2 + 10 + imgSize / 2;
            this.renderParticlePreview(x, imgCenterY, scaledWidth, item.config, scale);
        } else if (item.config.renderType === 'canvas' || item.config.renderer) {
            // Canvas 渲染的目标（如蝴蝶、老鼠、小鱼）- 使用 CanvasRenderer 渲染预览
            this.renderCanvasPreview(x, y, scaledWidth, scaledHeight, item.config, scale);
        } else if (item.loaded) {
            // 渲染普通图片
            const imgSize = scaledWidth * 0.85;
            ctx.drawImage(
                item.image,
                x - imgSize / 2,
                y - scaledHeight / 2 + 10,
                imgSize,
                imgSize
            );
        } else {
            // 图片未加载的占位符
            ctx.fillStyle = '#CCCCCC';
            const imgSize = scaledWidth * 0.85;
            ctx.fillRect(x - imgSize / 2, y - scaledHeight / 2 + 10, imgSize, imgSize);
        }

        // 名称
        ctx.fillStyle = '#333333';
        ctx.font = `bold ${18 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(item.config.name, x, y + scaledHeight / 2 + 15);

        // 分数
        ctx.fillStyle = '#666666';
        ctx.font = `${14 * scale}px Arial`;
        ctx.fillText(`${item.config.points}分/个`, x, y + scaledHeight / 2 + 35);

        // 最高分（如果有）
        if (this.settingsManager) {
            const highScore = this.settingsManager.getTargetHighScore(item.config.id);
            if (highScore > 0) {
                ctx.fillStyle = '#FFD700';
                ctx.font = `bold ${12 * scale}px Arial`;
                ctx.fillText(`最高: ${highScore}`, x, y + scaledHeight / 2 - 25);
            }
        }

        // 检查是否锁定
        const isLocked = this.isTargetLocked(item.config);
        if (isLocked) {
            this.renderLockOverlay(x, y, scaledWidth, scaledHeight, scale, item.config);
        } else {
            // 如果已解锁但有时限，显示剩余时间
            this.renderUnlockTimer(x, y, scaledHeight, scale, item.config);
        }

        ctx.restore();
    }

    /**
     * 检查目标是否锁定
     * @param {Object} config - 目标配置
     * @returns {boolean} 是否锁定
     */
    isTargetLocked(config) {
        if (!config.unlock || !config.unlock.adRequired) return false;
        if (!this.adManager) return false;
        return !this.adManager.isTargetUnlocked(config.id);
    }

    /**
     * 渲染锁定遮罩
     */
    renderLockOverlay(x, y, width, height, scale, config) {
        const ctx = this.ctx;

        // 半透明遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        drawRoundRect(
            ctx,
            x - width / 2 - 10,
            y - height / 2 - 10,
            width + 20,
            height + 60,
            15
        );
        ctx.fill();

        // 锁图标 - 使用 emoji 图片渲染
        if (this.emojiManager) {
            this.emojiManager.draw(ctx, 'lock', x, y - 10 * scale, 40 * scale);
        } else {
            ctx.font = `bold ${40 * scale}px Arial`;
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔒', x, y - 10 * scale);
        }

        // 解锁提示文字
        ctx.font = `bold ${14 * scale}px Arial`;
        ctx.fillStyle = '#FFD700';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('观看广告解锁', x, y + 30 * scale);

        // 有效期提示
        ctx.font = `${12 * scale}px Arial`;
        ctx.fillStyle = '#AAAAAA';
        let timeLeft= config.unlock.unlockDuration
        if(timeLeft>0){
            timeLeft= timeLeft/1000/60/60
            ctx.fillText(`解锁后有效${timeLeft}小时`, x, y + 50 * scale);
        }else if(timeLeft == -1 || timeLeft == 0){
            ctx.fillText(`解锁后永久有效`, x, y + 50 * scale);
        }
    }

    /**
     * 渲染解锁剩余时间
     */
    renderUnlockTimer(x, y, height, scale, config) {
        if (!this.adManager || !config.unlock || config.unlock.type !== 'ad') return;

        const remaining = this.adManager.getUnlockRemainingTime(config.id);
        if (remaining <= 0) return;

        const ctx = this.ctx;
        const timerText = this.adManager.formatRemainingTime(remaining);

        // 在卡片底部显示剩余时间
        ctx.font = `${10 * scale}px Arial`;
        ctx.fillStyle = '#4CAF50';  // 绿色表示已解锁
        ctx.textAlign = 'center';
        ctx.fillText(`剩余 ${timerText}`, x, y + height / 2 + 52);
    }

    /**
     * 渲染指示器小圆点
     * @param {number} centerY - 中心 Y 坐标
     */
    renderIndicators(centerY) {
        const ctx = this.ctx;
        const { width: logicalWidth } = this.getLogicalSize();
        const dotSize = 8;
        const dotSpacing = 16;
        const totalWidth = (this.resourceManager.selectionItems.length - 1) * dotSpacing;
        const startX = (logicalWidth - totalWidth) / 2;
        const y = centerY + SELECTION_CONFIG.CARD_HEIGHT / 2 + 80;

        const cardStep = SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING;
        const currentIndex = Math.round(this.scrollOffset / cardStep);

        for (let i = 0; i < this.resourceManager.selectionItems.length; i++) {
            const x = startX + i * dotSpacing;
            const isActive = i === Math.max(0, Math.min(this.resourceManager.selectionItems.length - 1, currentIndex));

            ctx.beginPath();
            ctx.arc(x, y, isActive ? dotSize / 2 + 2 : dotSize / 2, 0, Math.PI * 2);
            ctx.fillStyle = isActive ? '#FFD700' : 'rgba(255, 255, 255, 0.5)';
            ctx.fill();
        }
    }

    /**
     * 渲染解锁确认弹窗
     */
    renderUnlockDialog() {
        const ctx = this.ctx;
        const { width: logicalWidth, height: logicalHeight } = this.getLogicalSize();
        const centerX = logicalWidth / 2;
        const centerY = logicalHeight / 2;
        const dialogWidth = 280;
        const dialogHeight = 180;

        // 全屏遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);

        // 弹窗背景
        const gradient = ctx.createLinearGradient(
            centerX - dialogWidth / 2,
            centerY - dialogHeight / 2,
            centerX + dialogWidth / 2,
            centerY + dialogHeight / 2
        );
        gradient.addColorStop(0, 'rgba(50, 50, 70, 0.98)');
        gradient.addColorStop(1, 'rgba(30, 30, 50, 0.98)');

        drawRoundRect(
            ctx,
            centerX - dialogWidth / 2,
            centerY - dialogHeight / 2,
            dialogWidth,
            dialogHeight,
            20
        );
        ctx.fillStyle = gradient;
        ctx.fill();

        // 金色边框
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 标题
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('解锁目标', centerX, centerY - 55);

        // 目标名称
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(this.unlockDialogTarget.name, centerX, centerY - 20);

        // 说明文字
        ctx.fillStyle = '#AAAAAA';
        ctx.font = '14px Arial';
        ctx.fillText('观看广告后解锁24小时', centerX, centerY + 10);

        // 按钮
        const buttonWidth = 100;
        const buttonHeight = 40;
        const buttonY = centerY + 50;

        // 确认按钮（观看广告）
        const confirmX = centerX - 60;
        drawRoundRect(ctx, confirmX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 10);
        ctx.fillStyle = '#4CAF50';
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px Arial';
        ctx.fillText('观看广告', confirmX, buttonY);

        // 取消按钮
        const cancelX = centerX + 60;
        drawRoundRect(ctx, cancelX - buttonWidth / 2, buttonY - buttonHeight / 2, buttonWidth, buttonHeight, 10);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('取消', cancelX, buttonY);
    }

    /**
     * 渲染模式选择弹窗
     */
    renderModeDialog() {
        const ctx = this.ctx;
        const { width: logicalWidth, height: logicalHeight } = this.getLogicalSize();
        const centerX = logicalWidth / 2;
        const centerY = logicalHeight / 2;
        const dialogWidth = 320;
        const dialogHeight = 200;

        // 全屏遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);

        // 弹窗背景
        const gradient = ctx.createLinearGradient(
            centerX - dialogWidth / 2,
            centerY - dialogHeight / 2,
            centerX + dialogWidth / 2,
            centerY + dialogHeight / 2
        );
        gradient.addColorStop(0, 'rgba(50, 50, 70, 0.98)');
        gradient.addColorStop(1, 'rgba(30, 30, 50, 0.98)');

        drawRoundRect(
            ctx,
            centerX - dialogWidth / 2,
            centerY - dialogHeight / 2,
            dialogWidth,
            dialogHeight,
            20
        );
        ctx.fillStyle = gradient;
        ctx.fill();

        // 金色边框
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 标题
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('选择游戏模式', centerX, centerY - 60);

        // 目标名称
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 20px Arial';
        ctx.fillText(this.selectedTarget.name, centerX, centerY - 25);

        // 按钮
        const buttonWidth = 120;
        const buttonHeight = 50;
        const buttonY = centerY + 30;

        // 无限模式按钮
        const endlessX = centerX - 70;
        const endlessGradient = ctx.createLinearGradient(
            endlessX - buttonWidth / 2,
            buttonY - buttonHeight / 2,
            endlessX + buttonWidth / 2,
            buttonY + buttonHeight / 2
        );
        endlessGradient.addColorStop(0, '#9C27B0');
        endlessGradient.addColorStop(1, '#6A1B9A');

        drawRoundRect(ctx, endlessX - buttonWidth / 2, buttonY - buttonHeight / 2,
                     buttonWidth, buttonHeight, 12);
        ctx.fillStyle = endlessGradient;
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('♾️ 无限模式', endlessX, buttonY - 8);
        ctx.font = '12px Arial';
        ctx.fillStyle = '#CCCCCC';
        ctx.fillText('无时间限制', endlessX, buttonY + 12);

        // 闯关模式按钮
        const challengeX = centerX + 70;
        drawRoundRect(ctx, challengeX - buttonWidth / 2, buttonY - buttonHeight / 2,
                     buttonWidth, buttonHeight, 12);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('⏱️ 闯关模式', challengeX, buttonY - 8);
        ctx.font = '12px Arial';
        ctx.fillStyle = '#CCCCCC';
        ctx.fillText('60秒挑战', challengeX, buttonY + 12);
    }

    /**
     * 渲染粒子预览效果
     * @param {number} x - 中心 X 坐标
     * @param {number} y - 中心 Y 坐标
     * @param {number} scaledWidth - 缩放后的卡片宽度
     * @param {object} config - 目标配置
     * @param {number} scale - 缩放比例
     */
    renderParticlePreview(x, y, scaledWidth, config, scale) {
        const ctx = this.ctx;
        const pConfig = this.getParticleConfig(config, scaledWidth);
        const state = this.particleStates.get(config.id);
        const time = this.particleTime + (state && state.randomPhase || 0);

        ctx.save();

        // 计算脉冲缩放
        const pulse = 1 + Math.sin(time * pConfig.pulseSpeed) * pConfig.pulseAmplitude;

        // 计算闪烁亮度
        const twinkle = pConfig.twinkleMin + (pConfig.twinkleMax - pConfig.twinkleMin) *
            (0.5 + 0.5 * Math.sin(time * pConfig.twinkleSpeed));

        // 1. 绘制外层光晕
        this.drawParticleGlow(ctx, x, y, pConfig.glowRadius * pulse, pConfig.glowColor, twinkle);

        // 2. 绘制中层光晕
        this.drawParticleGlow(ctx, x, y, pConfig.glowRadius * 0.6 * pulse, pConfig.glowColor, twinkle * 0.8);

        // 3. 绘制环绕粒子
        if (state) {
            this.drawParticleOrbits(ctx, x, y, time, pConfig, state.particles);
        }

        // 4. 绘制核心光点
        this.drawParticleCore(ctx, x, y, pConfig.coreRadius * pulse, pConfig.coreColor, twinkle);

        // 5. 绘制核心高光
        this.drawParticleHighlight(ctx, x, y, pConfig.coreRadius * pulse * 0.5, twinkle);

        ctx.restore();
    }

    /**
     * 绘制粒子光晕
     */
    drawParticleGlow(ctx, x, y, radius, color, alpha) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

        const baseColor = color.replace(/[\d.]+\)$/, '');
        gradient.addColorStop(0, baseColor + (0.6 * alpha) + ')');
        gradient.addColorStop(0.5, baseColor + (0.3 * alpha) + ')');
        gradient.addColorStop(1, baseColor + '0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 绘制粒子核心
     */
    drawParticleCore(ctx, x, y, radius, color, alpha) {
        ctx.globalAlpha = alpha;

        // 核心实心圆
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(0.3, color);
        gradient.addColorStop(1, this.darkenColor(color, 0.3));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // 外发光边缘
        ctx.shadowColor = color;
        ctx.shadowBlur = radius * 2;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.globalAlpha = 1;
    }

    /**
     * 绘制粒子高光
     */
    drawParticleHighlight(ctx, x, y, radius, alpha) {
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    /**
     * 绘制环绕粒子
     */
    drawParticleOrbits(ctx, centerX, centerY, time, pConfig, particles) {
        particles.forEach((particle) => {
            // 计算当前角度
            const currentAngle = particle.angle + time * pConfig.orbitSpeed + particle.phase;

            // 计算轨道半径
            const radius = pConfig.orbitRadius * (1 + particle.radiusOffset);

            // 计算位置
            const px = centerX + Math.cos(currentAngle) * radius;
            const py = centerY + Math.sin(currentAngle) * radius;

            // 计算粒子大小（带脉动）
            const sizePulse = 0.8 + 0.4 * Math.sin(time * 4 + particle.phase);
            const size = pConfig.particleRadius * particle.size * sizePulse;

            // 计算粒子透明度
            const distanceAlpha = 0.5 + 0.5 * Math.cos(currentAngle - time * pConfig.orbitSpeed);

            // 绘制粒子
            ctx.globalAlpha = distanceAlpha * 0.8;

            const gradient = ctx.createRadialGradient(px, py, 0, px, py, size);
            gradient.addColorStop(0, '#FFFFFF');
            gradient.addColorStop(0.5, pConfig.coreColor);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;
    }

    /**
     * 辅助方法：加深颜色
     */
    darkenColor(color, factor) {
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);

            const dr = Math.floor(r * (1 - factor));
            const dg = Math.floor(g * (1 - factor));
            const db = Math.floor(b * (1 - factor));

            return `rgb(${dr}, ${dg}, ${db})`;
        }
        return color;
    }

    /**
     * 渲染 Canvas 预览效果（用于 Canvas 渲染的目标，如蝴蝶）
     * @param {number} x - 中心 X 坐标
     * @param {number} y - 中心 Y 坐标
     * @param {number} scaledWidth - 缩放后的卡片宽度
     * @param {number} scaledHeight - 缩放后的卡片高度
     * @param {object} config - 目标配置
     * @param {number} scale - 缩放比例
     */
    renderCanvasPreview(x, y, scaledWidth, scaledHeight, config, scale) {
        const ctx = this.ctx;
        const imgSize = scaledWidth * 0.85;
        const imgCenterY = y - scaledHeight / 2 + 10 + imgSize / 2;

        // 根据目标 ID 渲染不同的 Canvas 预览
        const time = this.particleTime;  // 使用粒子动画时间实现动画效果

        if (config.id === 'butterfly') {
            // 使用 ButterflyRenderer 渲染蝴蝶预览
            const position = { x: x, y: imgCenterY };
            const rotation = 0;  // 预览时不旋转
            const radius = imgSize / 2;
            const isMoving = false;  // 预览时静止
            const speed = 0;

            this.butterflyRenderer.render(ctx, position, radius, rotation, time, scale, isMoving, speed);
        } else if (config.id === 'mouse') {
            // 使用 MouseRenderer 渲染老鼠预览
            const rendererScale = (imgSize / 2) / 25;  // 根据卡片大小调整缩放
            this.mouseRenderer.render(ctx, x, imgCenterY, rendererScale, time, { isStartled: false });
        } else if (config.id === 'fish') {
            // 使用 FishRenderer 渲染小鱼预览
            const rendererScale = (imgSize / 2) / 32;  // 根据卡片大小调整缩放
            this.fishRenderer.render(ctx, x, imgCenterY, rendererScale, time, { isStartled: false });
        } else if (config.id === 'yarn' && config.renderType === 'multiline' && this.multilineRenderer) {
            // 使用 MultiLineRenderer 渲染多线预览
            // 预览时在固定区域内显示几条线
            const previewWidth = imgSize * 2;
            const previewHeight = imgSize * 2;
            const previewX = x - previewWidth / 2;
            const previewY = imgCenterY - previewHeight / 2;

            ctx.save();
            ctx.beginPath();
            ctx.rect(x - imgSize / 2, imgCenterY - imgSize / 2, imgSize, imgSize);
            ctx.clip();  // 限制预览在卡片区域内
            this.multilineRenderer.render(ctx, this.canvas.width, this.canvas.height, time);
            ctx.restore();
        } else if (config.id === 'yarn' && this.yarnRenderer) {
            // 使用 YarnRenderer 渲染毛线球预览
            const position = { x: x, y: imgCenterY };
            const rotation = 0;
            const radius = imgSize / 2;
            const isMoving = false;
            const speed = 0;

            this.yarnRenderer.render(ctx, position, radius, rotation, time, scale, isMoving, speed);
        } else {
            // 未知 Canvas 渲染类型，显示占位符
            ctx.fillStyle = '#CCCCCC';
            ctx.fillRect(x - imgSize / 2, imgCenterY - imgSize / 2, imgSize, imgSize);
            ctx.fillStyle = '#666666';
            ctx.font = `${12 * scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Canvas', x, imgCenterY);
        }
    }
}
