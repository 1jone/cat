/**
 * SelectionScreen - 选择界面
 * 负责目标选择界面的逻辑和渲染
 */

import { SELECTION_CONFIG, TARGET_TYPES, ENDLESS_MODE_CARD } from '../config';
import { drawRoundRect } from '../utils/CanvasUtils';

export class SelectionScreen {
    constructor(canvas, ctx, resourceManager, adManager = null, settingsManager = null, emojiManager = null) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.resourceManager = resourceManager;
        this.adManager = adManager;  // 广告管理器
        this.settingsManager = settingsManager;  // 设置管理器（用于获取最高分）
        this.emojiManager = emojiManager;  // Emoji 管理器
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

        // 计算滚动速度
        const now = performance.now();
        const dt = now - this.lastTouchTime;
        if (dt > 0) {
            this.scrollVelocity = (this.lastTouchX - pos.x) / dt * 16;
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
        // 如果解锁弹窗显示中，处理弹窗点击
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

            return selectedItem;
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
     * 更新选择界面逻辑
     * @param {number} dt - 时间增量（秒）
     */
    update(dt) {
        const cardStep = SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING;
        const maxOffset = (this.resourceManager.selectionItems.length - 1) * cardStep;

        if (!this.isDragging) {
            // 惯性滚动
            if (Math.abs(this.scrollVelocity) > 0.5) {
                this.scrollOffset += this.scrollVelocity;
                this.scrollVelocity *= SELECTION_CONFIG.SCROLL_FRICTION;
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

        // 无尽模式卡片使用特殊渲染
        if (item.config.isEndless) {
            this.renderEndlessCard({ x, y }, scale, opacity);
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

        // 图片
        if (item.loaded) {
            const imgSize = scaledWidth * 0.85;
            ctx.drawImage(
                item.image,
                x - imgSize / 2,
                y - scaledHeight / 2 + 10,
                imgSize,
                imgSize
            );
        } else {
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
        ctx.fillText('解锁后有效24小时', x, y + 50 * scale);
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
     * 渲染无尽模式卡片
     * @param {object} center - 中心位置 { x, y }
     * @param {number} scale - 缩放比例
     * @param {number} alpha - 透明度
     */
    renderEndlessCard(center, scale, alpha) {
        const ctx = this.ctx;
        const cardWidth = SELECTION_CONFIG.CARD_WIDTH;
        const cardHeight = SELECTION_CONFIG.CARD_HEIGHT;
        const width = cardWidth * scale;
        const height = cardHeight * scale;
        const x = center.x - width / 2;
        const y = center.y - height / 2;

        ctx.globalAlpha = alpha;

        // 渐变背景（紫色到深紫色）
        const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
        gradient.addColorStop(0, '#9C27B0');
        gradient.addColorStop(1, '#6A1B9A');

        // 圆角矩形背景
        drawRoundRect(ctx, x - 10, y - 10, width + 20, height + 60, 15);
        ctx.fillStyle = gradient;
        ctx.fill();

        // 金色发光边框
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4 * scale;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // ∞ 图标 - 使用 emoji 图片渲染 (♾️)
        if (this.emojiManager) {
            this.emojiManager.draw(ctx, 'infinite', center.x, center.y - 20 * scale, 60 * scale);
        } else {
            ctx.font = `bold ${60 * scale}px Arial`;
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('∞', center.x, center.y - 20 * scale);
        }

        // 标题文字
        ctx.font = `bold ${20 * scale}px Arial`;
        ctx.fillStyle = '#FFD700';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('无尽模式', center.x, center.y + 35 * scale);

        // 无尽模式统计（如果有）
        if (this.settingsManager) {
            const endlessStats = this.settingsManager.getEndlessStats();
            if (endlessStats.highScore > 0 || endlessStats.longestTime > 0) {
                ctx.font = `${12 * scale}px Arial`;
                ctx.fillStyle = '#FFFFFF';

                if (endlessStats.highScore > 0) {
                    ctx.fillText(`最高: ${endlessStats.highScore}分`, center.x, center.y + 55 * scale);
                }
                if (endlessStats.longestTime > 0) {
                    ctx.fillText(`最长: ${endlessStats.longestTime}秒`, center.x, center.y + 72 * scale);
                }
            } else {
                // 没有记录时显示描述
                ctx.font = `${14 * scale}px Arial`;
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText('挑战无限关卡', center.x, center.y + 55 * scale);
            }
        } else {
            // 没有 settingsManager 时显示默认描述
            ctx.font = `${14 * scale}px Arial`;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('挑战无限关卡', center.x, center.y + 55 * scale);
        }

        ctx.globalAlpha = 1;
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
}
