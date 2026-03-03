import { Entity } from './Entity';
import { Vector2 } from '../utils/Vector2';
import { CONFIG, STARTLE_CONFIG, FEATURE_FLAGS, POPIN_CONFIG } from '../config';
import { BehaviorSystem } from '../systems/BehaviorSystem';
import { PlayDeadBehavior } from '../behaviors/PlayDeadBehavior';
import { VocalizationBehavior } from '../behaviors/VocalizationBehavior';
import { RabbitRenderer } from './RabbitRenderer';
import { YarnRenderer } from './YarnRenderer';
import { MultiLineRenderer } from './MultiLineRenderer';

export class ImageTarget extends Entity {
    constructor(position, config, mouseRenderer = null, butterflyRenderer = null, fishRenderer = null, yarnRenderer = null, multilineRenderer = null, birdRenderer = null, ladybugRenderer = null) {
        super(position, config.radius);

        // 基础属性
        this.config = config;
        this.points = config.points;
        this.velocity = null;
        this.image = null;
        this.imageLoaded = false;
        this.time = Math.random() * Math.PI * 2;
        this.baseY = position.y;
        this.baseX = position.x;
        this.direction = Math.random() < 0.5 ? -1 : 1;

        // 保存渲染器实例
        this.mouseRenderer = mouseRenderer;
        this.butterflyRenderer = butterflyRenderer;
        this.fishRenderer = fishRenderer;
        this.yarnRenderer = yarnRenderer;
        this.multilineRenderer = multilineRenderer;
        this.birdRenderer = birdRenderer;
        this.ladybugRenderer = ladybugRenderer;

        // 存储 canvas 尺寸供渲染使用
        this.canvasWidth = 0;
        this.canvasHeight = 0;

        // 如果使用 butterfly 运动模式，初始化速度
        if (config.movement === 'butterfly') {
            const angle = Math.random() * Math.PI * 2;
            this.velocity = new Vector2(
                Math.cos(angle) * config.speed,
                Math.sin(angle) * config.speed
            );
        }

        // 头部朝向相关属性
        this.currentRotation = 0;  // 当前旋转角度
        this.previousPosition = position.clone();  // 前一帧位置（用于计算无速度模式的方向）

        // 受惊机制相关属性
        this.isStartled = false;
        this.startleTimer = 0;
        this.startleCooldown = 0;
        this.originalSpeed = config.speed;
        this.exclamationTimer = 0;
        this.startleScale = 1;           // 受惊时的缩放（替代闪烁）
        this.startleSpeedFactor = 1;     // 速度渐变因子
        this.preStartleMovement = null;  // 受惊前的运动模式
        this.preStartleVelocity = null;  // 受惊前的速度

        // 点击反馈相关属性
        this.isClicked = false;           // 是否被点击
        this.clickTime = 0;               // 点击时间戳
        this.clickIntensity = 0;          // 点击强度（0-1，随时间衰减）

        // 窜出动画相关属性
        this.popInState = 'NORMAL';           // 状态: 'NORMAL' | 'POPPING_OUT' | 'FADING'
        this.popInProgress = 0;               // 动画进度 0-1
        this.popInDuration = 1.5;             // 动画持续时间（秒）
        this.popInStartPos = null;            // 起始位置（画布外）
        this.popInTargetPos = null;           // 目标位置（画布内）
        this.lastPopInTime = 0;               // 上次窜出时间（冷却）
        this.prePopInState = null;            // 受惊前的状态备份

        // 若隐若现效果
        this.opacity = 1;                     // 当前透明度
        this.flickerPhase = 0;                // 闪烁相位
        this.isFlickering = false;            // 是否闪烁中

        // 动画系统预留属性
        this.animationType = 'static';  // 'static' | 'gif' | 'spritesheet'
        this.spriteFrames = [];
        this.currentFrame = 0;
        this.frameInterval = 100;
        this.lastFrameTime = 0;

        // 获取运动参数（合并默认配置和自定义配置）
        const movementType = config.movement || 'bounce';
        const defaultParams = CONFIG.MOVEMENT_PARAMS[movementType] || {};
        this.movementParams = {
            ...defaultParams,
            ...(config.movementConfig || {})
        };

        // 初始化图片或Canvas渲染器
        this.renderType = config.renderType || 'image';
        this.renderer = null;

        if (this.renderType === 'canvas' || this.renderType === 'multiline') {
            // Canvas渲染模式 - 根据目标ID选择渲染器
            if (config.id === 'butterfly' && butterflyRenderer) {
                this.renderer = butterflyRenderer;
            } else if (config.id === 'mouse' && mouseRenderer) {
                this.renderer = mouseRenderer;
            } else if (config.id === 'yarn' && yarnRenderer) {
                this.renderer = yarnRenderer;
            } else if (config.id === 'yarn' && multilineRenderer) {
                this.renderer = multilineRenderer;
            } else if (config.id === 'bird' && birdRenderer) {
                this.renderer = birdRenderer;
            } else if (config.id === 'ladybug' && ladybugRenderer) {
                this.renderer = ladybugRenderer;
            } else {
                // 默认使用 RabbitRenderer（兼容其他Canvas渲染目标）
                this.renderer = new RabbitRenderer(config);
            }
            this.imageLoaded = true;  // 标记为已加载，跳过图片加载
        } else {
            // 图片渲染模式（默认）
            this.image = tt.createImage();
            this.image.onload = () => {
                this.imageLoaded = true;
            };
            this.image.src = config.image;
        }

        // 初始速度向量
        const angle = Math.random() * Math.PI * 2;
        this.velocity = new Vector2(
            Math.cos(angle) * config.speed,
            Math.sin(angle) * config.speed
        );

        // 初始化运动特定状态
        this.initMovement(position);

        // 初始化行为系统（可选，基于特性开关）
        this.behaviorSystem = null;
        if (FEATURE_FLAGS.behaviorSystem) {
            this.initBehaviorSystem();
        }
    }

    /**
     * 初始化行为系统
     */
    initBehaviorSystem() {
        this.behaviorSystem = new BehaviorSystem(this);

        // 注册装死行为
        if (FEATURE_FLAGS.playDead) {
            this.behaviorSystem.registerBehavior('playDead', new PlayDeadBehavior());
        }

        // 注册叫声行为
        if (FEATURE_FLAGS.vocalization) {
            this.behaviorSystem.registerBehavior('vocalization', new VocalizationBehavior());
        }
    }

    /**
     * 初始化运动模式特定的状态变量
     */
    initMovement(position) {
        const movement = this.config.movement;
        const params = this.movementParams;

        switch (movement) {
            case 'circular':
                // 圆周运动 - 轨道中心和相位
                this.orbitCenterX = position.x;
                this.orbitCenterY = position.y;
                this.phase = Math.random() * Math.PI * 2;
                break;

            case 'spiral':
                // 螺旋运动 - 螺旋中心、相位和扩展方向
                this.spiralCenterX = position.x;
                this.spiralCenterY = position.y;
                this.phase = Math.random() * Math.PI * 2;
                this.spiralExpanding = true;
                this.spiralRadius = params.baseRadius;
                break;

            case 'zigzag':
                // 锯齿运动 - 基线Y
                this.baseY = position.y;
                break;

            case 'figure8':
                // 8字形运动 - 中心点
                this.figure8CenterX = position.x;
                this.figure8CenterY = position.y;
                break;

            case 'dash':
                // 冲刺运动 - 状态和计时器
                this.isDashing = false;
                this.dashTimer = Math.random() * params.pauseDuration; // 随机初始延迟
                this.dashVelocity = new Vector2(0, 0);
                break;

            case 'hover':
                // 悬停运动 - 基础位置和漂移方向
                this.baseX = position.x;
                this.baseY = position.y;
                this.driftDirectionX = (Math.random() - 0.5) * 2;
                this.driftDirectionY = (Math.random() - 0.5) * 2;
                // 归一化漂移方向
                const driftLen = Math.sqrt(
                    this.driftDirectionX * this.driftDirectionX +
                    this.driftDirectionY * this.driftDirectionY
                );
                if (driftLen > 0) {
                    this.driftDirectionX /= driftLen;
                    this.driftDirectionY /= driftLen;
                }
                break;

            case 'pendulum':
                // 钟摆运动 - 支点位置
                this.pivotX = position.x;
                this.pivotY = position.y - params.pendulumLength;
                break;

            case 'chase':
                // 追逐运动 - 无需额外初始化
                break;

            case 'sprintStop':
                // 冲刺停止运动 - 三阶段循环
                this.sprintStopPhase = 'slow';  // slow, sprint, stop
                this.sprintStopTimer = 0;
                // 随机初始方向
                const angle = Math.random() * Math.PI * 2;
                this.sprintStopVelocity = new Vector2(
                    Math.cos(angle),
                    Math.sin(angle)
                );
                break;
        }
    }

    update(dt, canvasWidth, canvasHeight) {
        this.time += dt * 2;

        // 存储 canvas 尺寸供渲染使用
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;

        // 更新多线渲染器（yarn目标使用multiline类型时）
        if (this.config.id === 'yarn' && this.multilineRenderer) {
            this.multilineRenderer.update(dt, canvasWidth, canvasHeight);
        }

        // 保存当前位置用于计算移动方向
        this.previousPosition = this.position.clone();

        // 更新窜出状态（优先级：受惊 > 窜出 > 正常运动）
        this.updatePopInState(dt);

        // 更新闪烁效果
        if (this.isFlickering) {
            this.updateFlicker(dt);
        }

        // 更新行为系统（在运动更新之前）
        if (this.behaviorSystem) {
            this.behaviorSystem.update(dt);

            // 检查是否应该跳过运动更新（装死时）
            if (this.behaviorSystem.shouldSkipMovement()) {
                return;  // 装死时跳过运动更新
            }
        }

        // 更新受惊状态（优先级最高）
        this.updateStartle(dt);

        // 如果处于受惊状态，使用受惊运动
        if (this.isStartled) {
            this.updateStartleMovement(dt, canvasWidth, canvasHeight);
            return;
        }

        // 处理窜出动画
        if (this.popInState === 'POPPING_OUT') {
            this.updatePopInMovement(dt);
            return;
        }

        // 检查是否应该触发窜出（仅在 NORMAL 状态）
        if (this.popInState === 'NORMAL' && this.shouldTriggerPopIn()) {
            this.startPopIn(canvasWidth, canvasHeight);
            return;
        }

        switch (this.config.movement) {
            case 'bounce':
                this.updateBounce(dt, canvasWidth, canvasHeight);
                break;
            case 'wave':
                this.updateWave(dt, canvasWidth, canvasHeight);
                break;
            case 'butterfly':
                this.updateButterflyFlight(dt, canvasWidth, canvasHeight);
                break;
            case 'random':
                this.updateRandom(dt, canvasWidth, canvasHeight);
                break;
            case 'circular':
                this.updateCircular(dt, canvasWidth, canvasHeight);
                break;
            case 'spiral':
                this.updateSpiral(dt, canvasWidth, canvasHeight);
                break;
            case 'zigzag':
                this.updateZigzag(dt, canvasWidth, canvasHeight);
                break;
            case 'figure8':
                this.updateFigure8(dt, canvasWidth, canvasHeight);
                break;
            case 'dash':
                this.updateDash(dt, canvasWidth, canvasHeight);
                break;
            case 'hover':
                this.updateHover(dt, canvasWidth, canvasHeight);
                break;
            case 'pendulum':
                this.updatePendulum(dt, canvasWidth, canvasHeight);
                break;
            case 'chase':
                this.updateChase(dt, canvasWidth, canvasHeight);
                break;
            case 'sprintStop':
                this.updateSprintStop(dt, canvasWidth, canvasHeight);
                break;
            default:
                this.updateBounce(dt, canvasWidth, canvasHeight);
        }
    }

    // ==================== 原有运动模式 ====================

    updateBounce(dt, canvasWidth, canvasHeight) {
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;

        if (this.position.x - this.radius < 0) {
            this.position.x = this.radius;
            this.velocity.x *= -1;
        } else if (this.position.x + this.radius > canvasWidth) {
            this.position.x = canvasWidth - this.radius;
            this.velocity.x *= -1;
        }

        if (this.position.y - this.radius < 0) {
            this.position.y = this.radius;
            this.velocity.y *= -1;
        } else if (this.position.y + this.radius > canvasHeight - 80) {
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
        } else if (this.position.x + this.radius > canvasWidth) {
            this.position.x = canvasWidth - this.radius;
            this.direction = -1;
        }

        if (this.position.y - this.radius < 50) {
            this.baseY = 50 + this.radius + 50;
        } else if (this.position.y + this.radius > canvasHeight - 80) {
            this.baseY = canvasHeight - 80 - this.radius - 50;
        }
    }

    updateRandom(dt, canvasWidth, canvasHeight) {
        if (Math.random() < 0.02) {
            const angle = Math.random() * Math.PI * 2;
            this.velocity = new Vector2(
                Math.cos(angle) * this.config.speed,
                Math.sin(angle) * this.config.speed
            );
        }
        this.updateBounce(dt, canvasWidth, canvasHeight);
    }

    /**
     * 蝴蝶飞行模式 - 频繁变向 + 贴边飞行
     */
    updateButterflyFlight(dt, canvasWidth, canvasHeight) {
        const params = this.config.butterflyParams || {
            directionChangeProbability: 0.08,  // 8% 概率变向
            edgeHuggingProbability: 0.3,        // 30% 概率贴边
            edgeDistance: 60,                    // 边缘距离
            speedVariation: 0.4                  // 速度变化 ±40%
        };

        // 1. 频繁方向改变
        if (Math.random() < params.directionChangeProbability) {
            const angle = Math.random() * Math.PI * 2;
            const speedVariation = 1 + (Math.random() - 0.5) * params.speedVariation;
            this.velocity = new Vector2(
                Math.cos(angle) * this.config.speed * speedVariation,
                Math.sin(angle) * this.config.speed * speedVariation
            );
        }

        // 2. 贴边吸引行为
        if (Math.random() < params.edgeHuggingProbability) {
            this.applyEdgeAttraction(params.edgeDistance, canvasWidth, canvasHeight);
        }

        // 3. 应用移动（使用边界反弹）
        this.updateBounce(dt, canvasWidth, canvasHeight);
    }

    /**
     * 应用边缘吸引力（贴边飞行）
     * @param {number} edgeDistance - 边缘触发距离
     * @param {number} canvasWidth - 画布宽度
     * @param {number} canvasHeight - 画布高度
     */
    applyEdgeAttraction(edgeDistance, canvasWidth, canvasHeight) {
        const distToLeft = this.position.x;
        const distToRight = canvasWidth - this.position.x;
        const distToTop = this.position.y;
        const distToBottom = canvasHeight - 80 - this.position.y;

        const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

        // 如果靠近某条边，减少垂直或水平移动，沿边飞行
        if (minDist < edgeDistance * 2) {
            if (minDist === distToLeft || minDist === distToRight) {
                // 靠近左右边，减少垂直移动
                this.velocity.y *= 0.3;
            } else if (minDist === distToTop || minDist === distToBottom) {
                // 靠近上下边，减少水平移动
                this.velocity.x *= 0.3;
            }
        }
    }

    /**
     * 计算朝向旋转角度（用于蝴蝶等需要根据运动方向旋转的目标）
     * @returns {number} 旋转角度（弧度）
     */
    calculateRotation() {
        // 如果使用速度运动，根据速度计算旋转
        if (this.velocity && (this.velocity.x !== 0 || this.velocity.y !== 0)) {
            const rotation = Math.atan2(this.velocity.y, this.velocity.x);

            // 蝴蝶需要调整90度，因为默认朝向是向上的
            const adjustedRotation = this.config.id === 'butterfly' ? rotation + Math.PI / 2 : rotation;

            // 平滑插值旋转
            if (this.currentRotation !== undefined) {
                let rotationDiff = adjustedRotation - this.currentRotation;

                // 处理角度跳变（-PI 到 PI）
                if (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
                if (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

                this.currentRotation += rotationDiff * 0.1;  // 平滑因子
            } else {
                this.currentRotation = adjustedRotation;
            }

            return this.currentRotation;
        }

        // 对于参数化运动模式，跟踪位置变化
        if (this.previousPosition) {
            const deltaX = this.position.x - this.previousPosition.x;
            const deltaY = this.position.y - this.previousPosition.y;

            // 如果有显著移动
            if (Math.abs(deltaX) > 0.1 || Math.abs(deltaY) > 0.1) {
                const rotation = Math.atan2(deltaY, deltaX);
                const adjustedRotation = this.config.id === 'butterfly' ? rotation + Math.PI / 2 : rotation;

                if (this.currentRotation !== undefined) {
                    let rotationDiff = adjustedRotation - this.currentRotation;

                    if (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
                    if (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;

                    this.currentRotation += rotationDiff * 0.1;
                } else {
                    this.currentRotation = adjustedRotation;
                }

                return this.currentRotation;
            }
        }

        this.previousPosition = this.position.clone();
        return this.currentRotation || 0;
    }

    // ==================== 新增运动模式 ====================

    /**
     * 圆周运动 - 绕固定中心点做圆周运动
     */
    updateCircular(dt, canvasWidth, canvasHeight) {
        const params = this.movementParams;
        const angularSpeed = params.angularSpeed || 2;
        const orbitRadius = params.orbitRadius || 80;

        // 计算新位置
        const newX = this.orbitCenterX + orbitRadius * Math.cos(this.time * angularSpeed + this.phase);
        const newY = this.orbitCenterY + orbitRadius * Math.sin(this.time * angularSpeed + this.phase);

        // 边界处理 - 如果超出边界，移动轨道中心
        const margin = orbitRadius + this.radius;
        const minY = margin;
        const maxY = canvasHeight - 80 - margin;
        const minX = margin;
        const maxX = canvasWidth - margin;

        if (newX < this.radius || newX > canvasWidth - this.radius) {
            this.orbitCenterX = canvasWidth / 2;
        }
        if (newY < this.radius || newY > canvasHeight - 80 - this.radius) {
            this.orbitCenterY = (canvasHeight - 80) / 2;
        }

        // 确保轨道中心在有效范围内
        this.orbitCenterX = Math.max(minX, Math.min(maxX, this.orbitCenterX));
        this.orbitCenterY = Math.max(minY, Math.min(maxY, this.orbitCenterY));

        // 更新位置
        this.position.x = this.orbitCenterX + orbitRadius * Math.cos(this.time * angularSpeed + this.phase);
        this.position.y = this.orbitCenterY + orbitRadius * Math.sin(this.time * angularSpeed + this.phase);
    }

    /**
     * 螺旋运动 - 半径周期性变化的圆周运动
     */
    updateSpiral(dt, canvasWidth, canvasHeight) {
        const params = this.movementParams;
        const baseRadius = params.baseRadius || 40;
        const maxRadius = params.maxRadius || 120;
        const spiralRate = params.spiralRate || 20;
        const angularSpeed = params.angularSpeed || 1.5;

        // 更新螺旋半径
        if (this.spiralExpanding) {
            this.spiralRadius += spiralRate * dt;
            if (this.spiralRadius >= maxRadius) {
                this.spiralRadius = maxRadius;
                this.spiralExpanding = false;
            }
        } else {
            this.spiralRadius -= spiralRate * dt;
            if (this.spiralRadius <= baseRadius) {
                this.spiralRadius = baseRadius;
                this.spiralExpanding = true;
            }
        }

        // 计算新位置
        const newX = this.spiralCenterX + this.spiralRadius * Math.cos(this.time * angularSpeed + this.phase);
        const newY = this.spiralCenterY + this.spiralRadius * Math.sin(this.time * angularSpeed + this.phase);

        // 边界处理
        const margin = maxRadius + this.radius;
        const minY = margin;
        const maxY = canvasHeight - 80 - margin;
        const minX = margin;
        const maxX = canvasWidth - margin;

        if (newX < this.radius || newX > canvasWidth - this.radius) {
            this.spiralCenterX = canvasWidth / 2;
        }
        if (newY < this.radius || newY > canvasHeight - 80 - this.radius) {
            this.spiralCenterY = (canvasHeight - 80) / 2;
        }

        this.spiralCenterX = Math.max(minX, Math.min(maxX, this.spiralCenterX));
        this.spiralCenterY = Math.max(minY, Math.min(maxY, this.spiralCenterY));

        this.position.x = this.spiralCenterX + this.spiralRadius * Math.cos(this.time * angularSpeed + this.phase);
        this.position.y = this.spiralCenterY + this.spiralRadius * Math.sin(this.time * angularSpeed + this.phase);
    }

    /**
     * 锯齿运动 - 水平移动 + 三角波垂直运动
     */
    updateZigzag(dt, canvasWidth, canvasHeight) {
        const params = this.movementParams;
        const amplitude = params.amplitude || 60;
        const frequency = params.frequency || 1;

        // 水平移动
        this.position.x += this.direction * this.config.speed * dt;

        // 三角波计算 (范围 -1 到 1)
        const t = (this.time * frequency) % 1;
        const triangleValue = t < 0.5 ? 4 * t - 1 : 3 - 4 * t;
        this.position.y = this.baseY + amplitude * triangleValue;

        // 水平边界处理
        if (this.position.x - this.radius < 0) {
            this.position.x = this.radius;
            this.direction = 1;
        } else if (this.position.x + this.radius > canvasWidth) {
            this.position.x = canvasWidth - this.radius;
            this.direction = -1;
        }

        // 垂直边界处理 - 调整基线
        if (this.position.y - this.radius < 0) {
            this.baseY = this.radius + amplitude;
        } else if (this.position.y + this.radius > canvasHeight - 80) {
            this.baseY = canvasHeight - 80 - this.radius - amplitude;
        }
    }

    /**
     * 8字形运动 (李萨如曲线 2:1)
     */
    updateFigure8(dt, canvasWidth, canvasHeight) {
        const params = this.movementParams;
        const amplitudeX = params.amplitudeX || 100;
        const amplitudeY = params.amplitudeY || 80;
        const angularSpeed = params.angularSpeed || 1.5;

        // 8字形轨迹 (李萨如曲线: x频率是y的2倍)
        const newX = this.figure8CenterX + amplitudeX * Math.sin(2 * this.time * angularSpeed);
        const newY = this.figure8CenterY + amplitudeY * Math.sin(this.time * angularSpeed);

        // 边界处理 - 如果超出边界，移动中心点
        const marginX = amplitudeX + this.radius;
        const marginY = amplitudeY + this.radius;
        const minY = marginY;
        const maxY = canvasHeight - 80 - marginY;
        const minX = marginX;
        const maxX = canvasWidth - marginX;

        if (newX < this.radius || newX > canvasWidth - this.radius) {
            this.figure8CenterX = canvasWidth / 2;
        }
        if (newY < this.radius || newY > canvasHeight - 80 - this.radius) {
            this.figure8CenterY = (canvasHeight - 80) / 2;
        }

        this.figure8CenterX = Math.max(minX, Math.min(maxX, this.figure8CenterX));
        this.figure8CenterY = Math.max(minY, Math.min(maxY, this.figure8CenterY));

        this.position.x = this.figure8CenterX + amplitudeX * Math.sin(2 * this.time * angularSpeed);
        this.position.y = this.figure8CenterY + amplitudeY * Math.sin(this.time * angularSpeed);
    }

    /**
     * 冲刺运动 - 快速冲刺 + 停顿（增强版）
     * 老鼠特有：停顿期高频抖动，冲刺时爆发加速
     */
    updateDash(dt, canvasWidth, canvasHeight) {
        const params = this.movementParams;

        // 检查是否为老鼠
        const isMouse = this.config.renderer === 'mouse';
        const mouseConfig = isMouse ? (this.config.mouseConfig || {}) : {};

        // 配置参数（老鼠使用增强参数）
        const baseDashSpeed = params.dashSpeed || 200;
        const dashSpeedMultiplier = isMouse ? (mouseConfig.dashSpeedMultiplier || 1.5) : 1.0;
        const dashDuration = params.dashDuration || 0.4;
        const pauseDuration = params.pauseDuration || 0.8;

        // 老鼠特有抖动参数
        const jitterAmplitude = isMouse ? (mouseConfig.jitterAmplitude || 2.0) : 1.0;
        const jitterFrequency = isMouse ? (mouseConfig.jitterFrequency || 15) : 8;

        this.dashTimer += dt;

        if (this.isDashing) {
            // === 冲刺阶段 - 快速移动 ===
            this.position.x += this.dashVelocity.x * dt;
            this.position.y += this.dashVelocity.y * dt;

            // 老鼠冲刺时的剧烈抖动
            if (isMouse) {
                const dashJitterIntensity = 5.0;
                const dashJitterX = (Math.random() - 0.5) * dashJitterIntensity;
                const dashJitterY = (Math.random() - 0.5) * dashJitterIntensity;
                this.position.x += dashJitterX;
                this.position.y += dashJitterY;
            }

            // 边界碰撞处理
            if (this.position.x - this.radius < 0) {
                this.position.x = this.radius;
                this.dashVelocity.x *= -1;
            } else if (this.position.x + this.radius > canvasWidth) {
                this.position.x = canvasWidth - this.radius;
                this.dashVelocity.x *= -1;
            }

            if (this.position.y - this.radius < 0) {
                this.position.y = this.radius;
                this.dashVelocity.y *= -1;
            } else if (this.position.y + this.radius > canvasHeight - 80) {
                this.position.y = canvasHeight - 80 - this.radius;
                this.dashVelocity.y *= -1;
            }

            // 冲刺结束
            if (this.dashTimer >= dashDuration) {
                this.isDashing = false;
                this.dashTimer = 0;
            }
        } else {
            // === 停顿阶段 - 小幅抖动（老鼠警觉效果）===
            const jitterX = Math.sin(this.time * jitterFrequency) * jitterAmplitude;
            const jitterY = Math.cos(this.time * jitterFrequency * 1.3) * jitterAmplitude;
            this.position.x += jitterX * dt * 60;
            this.position.y += jitterY * dt * 60;

            // 停顿结束，开始新的冲刺
            if (this.dashTimer >= pauseDuration) {
                this.isDashing = true;
                this.dashTimer = 0;

                // 随机新方向
                const angle = Math.random() * Math.PI * 2;
                const actualDashSpeed = baseDashSpeed * dashSpeedMultiplier;
                this.dashVelocity = new Vector2(
                    Math.cos(angle) * actualDashSpeed,
                    Math.sin(angle) * actualDashSpeed
                );
            }
        }
    }

    /**
     * 冲刺停止运动 - 三阶段循环：缓慢移动 → 急速冲刺 → 停止
     */
    updateSprintStop(dt, canvasWidth, canvasHeight) {
        const params = this.movementParams;
        const slowSpeed = params.slowSpeed || 50;        // 缓慢移动速度
        const sprintSpeed = params.sprintSpeed || 300;    // 急速冲刺速度
        const slowDuration = params.slowDuration || 2;    // 缓慢移动持续时间（秒）
        const sprintDuration = params.sprintDuration || 0.5;  // 冲刺持续时间（秒）
        const stopDuration = params.stopDuration || 1.5;  // 停止持续时间（秒）

        this.sprintStopTimer += dt;

        // 根据当前阶段执行不同的运动逻辑
        switch (this.sprintStopPhase) {
            case 'slow':
                // 阶段1：缓慢移动
                this.position.x += this.sprintStopVelocity.x * slowSpeed * dt;
                this.position.y += this.sprintStopVelocity.y * slowSpeed * dt;

                // 边界处理
                this.handleBoundaryCollision(canvasWidth, canvasHeight);

                // 阶段转换：缓慢 → 冲刺
                if (this.sprintStopTimer >= slowDuration) {
                    this.sprintStopPhase = 'sprint';
                    this.sprintStopTimer = 0;
                }
                break;

            case 'sprint':
                // 阶段2：急速冲刺（在原方向上加速）
                this.position.x += this.sprintStopVelocity.x * sprintSpeed * dt;
                this.position.y += this.sprintStopVelocity.y * sprintSpeed * dt;

                // 边界处理
                this.handleBoundaryCollision(canvasWidth, canvasHeight);

                // 阶段转换：冲刺 → 停止
                if (this.sprintStopTimer >= sprintDuration) {
                    this.sprintStopPhase = 'stop';
                    this.sprintStopTimer = 0;
                }
                break;

            case 'stop':
                // 阶段3：完全停止（轻微呼吸效果）
                const breathX = Math.sin(this.time * 2) * 1;
                const breathY = Math.cos(this.time * 2) * 1;
                this.position.x += breathX * dt;
                this.position.y += breathY * dt;

                // 阶段转换：停止 → 缓慢移动（开始新的循环）
                if (this.sprintStopTimer >= stopDuration) {
                    this.sprintStopPhase = 'slow';
                    this.sprintStopTimer = 0;

                    // 随机新方向
                    const angle = Math.random() * Math.PI * 2;
                    this.sprintStopVelocity = new Vector2(
                        Math.cos(angle),
                        Math.sin(angle)
                    );
                }
                break;
        }
    }

    /**
     * 处理边界碰撞（用于冲刺停止模式）
     */
    handleBoundaryCollision(canvasWidth, canvasHeight) {
        if (this.position.x - this.radius < 0) {
            this.position.x = this.radius;
            this.sprintStopVelocity.x *= -1;
        } else if (this.position.x + this.radius > canvasWidth) {
            this.position.x = canvasWidth - this.radius;
            this.sprintStopVelocity.x *= -1;
        }

        if (this.position.y - this.radius < 0) {
            this.position.y = this.radius;
            this.sprintStopVelocity.y *= -1;
        } else if (this.position.y + this.radius > canvasHeight - 80) {
            this.position.y = canvasHeight - 80 - this.radius;
            this.sprintStopVelocity.y *= -1;
        }
    }

    /**
     * 悬停运动 - 多频率叠加的自然飘动 + 缓慢漂移
     */
    updateHover(dt, canvasWidth, canvasHeight) {
        const params = this.movementParams;
        const hoverAmplitude = params.hoverAmplitude || 30;
        const driftSpeed = params.driftSpeed || 20;

        // 缓慢漂移
        this.baseX += this.driftDirectionX * driftSpeed * dt;
        this.baseY += this.driftDirectionY * driftSpeed * dt;

        // 多频率叠加产生自然飘动效果
        const amp = hoverAmplitude;
        const hoverX = amp * Math.sin(this.time * 1.5) + amp * 0.5 * Math.sin(this.time * 2.7);
        const hoverY = amp * Math.sin(this.time * 1.8) + amp * 0.5 * Math.sin(this.time * 3.1);

        this.position.x = this.baseX + hoverX;
        this.position.y = this.baseY + hoverY;

        // 边界处理 - 反转漂移方向
        const margin = hoverAmplitude + this.radius;

        if (this.baseX < margin) {
            this.baseX = margin;
            this.driftDirectionX = Math.abs(this.driftDirectionX);
        } else if (this.baseX > canvasWidth - margin) {
            this.baseX = canvasWidth - margin;
            this.driftDirectionX = -Math.abs(this.driftDirectionX);
        }

        if (this.baseY < margin) {
            this.baseY = margin;
            this.driftDirectionY = Math.abs(this.driftDirectionY);
        } else if (this.baseY > canvasHeight - 80 - margin) {
            this.baseY = canvasHeight - 80 - margin;
            this.driftDirectionY = -Math.abs(this.driftDirectionY);
        }
    }

    /**
     * 钟摆运动 - 绕支点摆动
     */
    updatePendulum(dt, canvasWidth, canvasHeight) {
        const params = this.movementParams;
        const pendulumLength = params.pendulumLength || 150;
        const maxAngle = params.maxAngle || Math.PI / 3;
        const angularFreq = params.angularFreq || 2;

        // 钟摆角度 (简谐运动)
        const angle = maxAngle * Math.sin(this.time * angularFreq);

        // 计算摆锤位置
        const newX = this.pivotX + pendulumLength * Math.sin(angle);
        const newY = this.pivotY + pendulumLength * Math.cos(angle);

        // 边界处理 - 移动支点
        const swingWidth = pendulumLength * Math.sin(maxAngle) + this.radius;
        const minX = swingWidth;
        const maxX = canvasWidth - swingWidth;
        const minPivotY = this.radius;
        const maxPendulumY = canvasHeight - 80 - this.radius;

        // 确保支点X在有效范围内
        if (this.pivotX < minX) {
            this.pivotX = minX;
        } else if (this.pivotX > maxX) {
            this.pivotX = maxX;
        }

        // 确保摆锤不会超出底部边界
        if (this.pivotY + pendulumLength + this.radius > maxPendulumY) {
            this.pivotY = maxPendulumY - pendulumLength - this.radius;
        }

        // 确保支点不会太靠近顶部
        if (this.pivotY < minPivotY) {
            this.pivotY = minPivotY;
        }

        this.position.x = this.pivotX + pendulumLength * Math.sin(angle);
        this.position.y = this.pivotY + pendulumLength * Math.cos(angle);
    }

    /**
     * 追逐运动 - 追逐一个做圆周运动的虚拟目标点
     */
    updateChase(dt, canvasWidth, canvasHeight) {
        const params = this.movementParams;
        const chaseSpeed = params.chaseSpeed || 80;
        const targetRadius = params.targetRadius || 100;
        const targetSpeed = params.targetSpeed || 1;

        // 计算虚拟目标点位置 (圆周运动)
        const centerX = canvasWidth / 2;
        const centerY = (canvasHeight - 80) / 2;
        const targetX = centerX + targetRadius * Math.sin(this.time * targetSpeed);
        const targetY = centerY + targetRadius * Math.cos(this.time * targetSpeed);

        // 计算追逐方向
        const dx = targetX - this.position.x;
        const dy = targetY - this.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 只有距离大于阈值时才移动（避免抖动）
        if (distance > 5) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            this.position.x += dirX * chaseSpeed * dt;
            this.position.y += dirY * chaseSpeed * dt;
        }

        // 边界处理
        if (this.position.x - this.radius < 0) {
            this.position.x = this.radius;
        } else if (this.position.x + this.radius > canvasWidth) {
            this.position.x = canvasWidth - this.radius;
        }

        if (this.position.y - this.radius < 0) {
            this.position.y = this.radius;
        } else if (this.position.y + this.radius > canvasHeight - 80) {
            this.position.y = canvasHeight - 80 - this.radius;
        }
    }

    // ==================== 受惊机制 ====================

    /**
     * 检查是否应该触发受惊（由外部调用）
     */
    checkStartle(touchPosition) {
        if (!touchPosition || this.startleCooldown > 0 || this.isStartled) return;

        const distance = this.position.distanceTo(touchPosition);
        if (distance < STARTLE_CONFIG.TRIGGER_RADIUS) {
            // 如果正在窜出，提前结束
            if (this.popInState === 'POPPING_OUT') {
                this.endPopInEarly();
            }

            // 如果正在闪烁，停止闪烁
            if (this.isFlickering) {
                this.isFlickering = false;
                this.opacity = 1;
            }

            this.triggerStartle(touchPosition);
        }
    }

    /**
     * 触发受惊状态
     */
    triggerStartle(touchPosition) {
        // 如果当前处于装死状态，强制结束装死行为
        if (this.isPlayingDead && this.behaviorSystem) {
            this.behaviorSystem.endBehavior('playDead');
        }

        // 保存窜出状态用于恢复
        this.prePopInState = this.popInState;

        this.isStartled = true;
        this.startleTimer = STARTLE_CONFIG.DURATION;
        this.exclamationTimer = STARTLE_CONFIG.EXCLAMATION_DURATION;
        this.startleScale = 1.3;         // 初始放大（惊吓反应）
        this.startleSpeedFactor = 1;     // 速度从1开始渐变到最大

        // 保存受惊前的状态
        this.preStartleVelocity = this.velocity ? this.velocity.clone() : null;

        // 计算逃离方向（远离触摸点）
        const dx = this.position.x - touchPosition.x;
        const dy = this.position.y - touchPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let fleeX, fleeY;
        if (distance > 0) {
            fleeX = dx / distance;
            fleeY = dy / distance;
        } else {
            // 触摸点和目标重合，随机选择方向
            const angle = Math.random() * Math.PI * 2;
            fleeX = Math.cos(angle);
            fleeY = Math.sin(angle);
        }

        // 添加随机偏差
        const angleVariance = (Math.random() - 0.5) * 2 * STARTLE_CONFIG.FLEE_ANGLE_VARIANCE * Math.PI / 180;
        const cos = Math.cos(angleVariance);
        const sin = Math.sin(angleVariance);
        const rotatedX = fleeX * cos - fleeY * sin;
        const rotatedY = fleeX * sin + fleeY * cos;

        // 保存逃离方向（用于渐变加速）
        this.fleeDirection = new Vector2(rotatedX, rotatedY);
    }

    /**
     * 更新受惊状态计时器
     */
    updateStartle(dt) {
        if (this.isStartled) {
            this.startleTimer -= dt;
            this.exclamationTimer -= dt;

            // 计算受惊进度 (0 = 刚开始, 1 = 结束)
            const progress = 1 - (this.startleTimer / STARTLE_CONFIG.DURATION);

            // 缩放渐变：1.3 -> 1.0（从放大恢复正常）
            this.startleScale = 1 + 0.3 * (1 - progress);

            // 速度渐变：快速加速到峰值，然后缓慢减速
            // 使用缓动函数：先快后慢
            if (progress < 0.2) {
                // 前20%：快速加速到峰值
                this.startleSpeedFactor = 1 + (STARTLE_CONFIG.SPEED_MULTIPLIER - 1) * (progress / 0.2);
            } else {
                // 后80%：缓慢减速回正常
                const decayProgress = (progress - 0.2) / 0.8;
                this.startleSpeedFactor = STARTLE_CONFIG.SPEED_MULTIPLIER - (STARTLE_CONFIG.SPEED_MULTIPLIER - 1) * decayProgress;
            }

            // 更新速度向量
            const currentSpeed = this.originalSpeed * this.startleSpeedFactor;
            this.velocity = new Vector2(
                this.fleeDirection.x * currentSpeed,
                this.fleeDirection.y * currentSpeed
            );

            // 受惊结束
            if (this.startleTimer <= 0) {
                this.isStartled = false;
                this.startleCooldown = STARTLE_CONFIG.COOLDOWN;
                this.startleScale = 1;
                this.startleSpeedFactor = 1;

                // 恢复之前的速度（如果有）
                if (this.preStartleVelocity) {
                    this.velocity = this.preStartleVelocity;
                    this.preStartleVelocity = null;
                }

                // 恢复之前的窜出状态（如果需要）
                if (this.prePopInState && this.prePopInState !== 'NORMAL') {
                    this.popInState = this.prePopInState;
                    this.prePopInState = null;
                }

                // 同步参数化运动模式的基准点，避免位置漂移回位
                this.syncMovementBasePoint();
            }
        }

        if (this.startleCooldown > 0) {
            this.startleCooldown -= dt;
        }
    }

    /**
     * 同步参数化运动模式的基准点
     * 受惊结束后调用，根据当前位置和时间反推正确的基准点，
     * 避免下一帧位置被强制"拉回"到旧基准点
     */
    syncMovementBasePoint() {
        const movement = this.config.movement;
        const params = this.movementParams || {};

        switch (movement) {
            case 'wave':
                // wave: position.y = baseY + sin(time) * 50
                // 反推: baseY = position.y - sin(time) * 50
                this.baseY = this.position.y - Math.sin(this.time) * 50;
                break;

            case 'hover': {
                // hover: position = base + hoverOffset
                const amp = params.hoverAmplitude || 30;
                const hoverX = amp * Math.sin(this.time * 1.5) + amp * 0.5 * Math.sin(this.time * 2.7);
                const hoverY = amp * Math.sin(this.time * 1.8) + amp * 0.5 * Math.sin(this.time * 3.1);
                this.baseX = this.position.x - hoverX;
                this.baseY = this.position.y - hoverY;
                break;
            }

            case 'pendulum': {
                // pendulum: position = pivot + length * sin/cos(angle)
                const pendulumLength = params.pendulumLength || 150;
                const maxAngle = params.maxAngle || Math.PI / 3;
                const angularFreq = params.angularFreq || 2;
                const angle = maxAngle * Math.sin(this.time * angularFreq);
                this.pivotX = this.position.x - pendulumLength * Math.sin(angle);
                this.pivotY = this.position.y - pendulumLength * Math.cos(angle);
                break;
            }

            case 'circular': {
                // circular: position = orbitCenter + radius * cos/sin(phase)
                const angularSpeed = params.angularSpeed || 2;
                const orbitRadius = params.orbitRadius || 80;
                this.orbitCenterX = this.position.x - orbitRadius * Math.cos(this.time * angularSpeed + this.phase);
                this.orbitCenterY = this.position.y - orbitRadius * Math.sin(this.time * angularSpeed + this.phase);
                break;
            }

            case 'spiral': {
                // spiral: position = spiralCenter + spiralRadius * cos/sin(phase)
                const angularSpeed = params.angularSpeed || 1.5;
                this.spiralCenterX = this.position.x - this.spiralRadius * Math.cos(this.time * angularSpeed + this.phase);
                this.spiralCenterY = this.position.y - this.spiralRadius * Math.sin(this.time * angularSpeed + this.phase);
                break;
            }

            case 'zigzag': {
                // zigzag: position.y = baseY + amplitude * triangleValue
                const amplitude = params.amplitude || 60;
                const frequency = params.frequency || 1;
                const t = (this.time * frequency) % 1;
                const triangleValue = t < 0.5 ? 4 * t - 1 : 3 - 4 * t;
                this.baseY = this.position.y - amplitude * triangleValue;
                break;
            }

            case 'figure8': {
                // figure8: position = center + amplitude * sin(...)
                const amplitudeX = params.amplitudeX || 100;
                const amplitudeY = params.amplitudeY || 80;
                const angularSpeed = params.angularSpeed || 1.5;
                this.figure8CenterX = this.position.x - amplitudeX * Math.sin(2 * this.time * angularSpeed);
                this.figure8CenterY = this.position.y - amplitudeY * Math.sin(this.time * angularSpeed);
                break;
            }

            // bounce、random、dash、chase 使用速度累积，不需要同步基准点
        }
    }

    /**
     * 受惊时的移动更新（高速弹跳）
     */
    updateStartleMovement(dt, canvasWidth, canvasHeight) {
        // 高速移动
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;

        // 边界碰撞反弹
        if (this.position.x - this.radius < 0) {
            this.position.x = this.radius;
            this.velocity.x *= -1;
        } else if (this.position.x + this.radius > canvasWidth) {
            this.position.x = canvasWidth - this.radius;
            this.velocity.x *= -1;
        }

        if (this.position.y - this.radius < 0) {
            this.position.y = this.radius;
            this.velocity.y *= -1;
        } else if (this.position.y + this.radius > canvasHeight - 80) {
            this.position.y = canvasHeight - 80 - this.radius;
            this.velocity.y *= -1;
        }
    }

    // ==================== 头部朝向 ====================

    /**
     * 角度插值（处理角度环绕问题）
     */
    lerpAngle(current, target, t) {
        let diff = target - current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        return current + diff * t;
    }

    /**
     * 计算目标旋转角度
     */
    getTargetRotation() {
        // 图片默认头部朝上，需要+90度（π/2）补偿
        let targetRotation = 0;  // 默认不旋转（朝上）

        // 优先使用速度向量
        if (this.velocity && (Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1)) {
            targetRotation = Math.atan2(this.velocity.y, this.velocity.x) + Math.PI / 2;
        } else {
            // 对于无速度的运动模式，使用位置差分计算方向
            const dx = this.position.x - this.previousPosition.x;
            const dy = this.position.y - this.previousPosition.y;
            if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
                targetRotation = Math.atan2(dy, dx) + Math.PI / 2;
            }
        }

        return targetRotation;
    }

    /**
     * 检查当前是否正在移动
     * @returns {boolean}
     */
    checkIsMoving() {
        // 如果受惊，总是认为在移动
        if (this.isStartled) return true;

        const movement = this.config.movement;

        // 对于冲刺停止运动，检查当前阶段
        if (movement === 'sprintStop') {
            return this.sprintStopPhase === 'slow' || this.sprintStopPhase === 'sprint';
        }

        // 对于冲刺运动，检查是否在冲刺阶段
        if (movement === 'dash') {
            return this.isDashing;
        }

        // 对于其他速度累积模式，检查速度
        if (this.velocity) {
            return Math.abs(this.velocity.x) > 1 || Math.abs(this.velocity.y) > 1;
        }

        return false;
    }

    /**
     * 获取当前移动速度
     * @returns {number} 当前速度值
     */
    getCurrentSpeed() {
        // 受惊时使用受惊速度
        if (this.isStartled) {
            return this.originalSpeed * this.startleSpeedFactor;
        }

        const movement = this.config.movement;

        // 冲刺停止运动的不同阶段有不同的速度
        if (movement === 'sprintStop') {
            const params = this.movementParams;
            if (this.sprintStopPhase === 'slow') {
                return params.slowSpeed || 50;
            } else if (this.sprintStopPhase === 'sprint') {
                return params.sprintSpeed || 300;
            }
            return 0;  // stop阶段
        }

        // 冲刺运动
        if (movement === 'dash' && this.isDashing) {
            const params = this.movementParams;
            return params.dashSpeed || 200;
        }

        // 默认使用配置的速度
        if (this.velocity) {
            return Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
        }

        return this.config.speed || 100;
    }

    // ==================== 渲染 ====================

    render(ctx) {
        ctx.save();

        // 计算并平滑旋转角度
        const targetRotation = this.getTargetRotation();
        this.currentRotation = this.lerpAngle(this.currentRotation, targetRotation, 0.15);

        // 抖动偏移（受惊时，强度随时间衰减）
        let shakeX = 0, shakeY = 0;
        if (this.isStartled) {
            // 抖动强度随受惊进度衰减
            const shakeProgress = this.startleTimer / STARTLE_CONFIG.DURATION;
            const currentShakeIntensity = STARTLE_CONFIG.SHAKE_INTENSITY * shakeProgress;
            const shakePhase = this.time * STARTLE_CONFIG.SHAKE_FREQUENCY * Math.PI * 2;
            shakeX = Math.sin(shakePhase) * currentShakeIntensity;
            shakeY = Math.cos(shakePhase * 1.3) * currentShakeIntensity * 0.7;
        }

        // 移动到目标中心点（含抖动偏移）
        ctx.translate(this.position.x + shakeX, this.position.y + shakeY);

        // 旋转画布
        ctx.rotate(this.currentRotation);

        // 基础晃动 + 受惊缩放
        const wobble = Math.sin(this.time * 3) * 0.1;
        let finalScale = (1 + wobble * 0.1) * this.startleScale;

        // 窜出时的额外缩放效果
        if (this.popInState === 'POPPING_OUT') {
            const popInScale = 1 + Math.sin(this.popInProgress * Math.PI) * 0.3;
            finalScale *= popInScale;
        }

        // 应用透明度（闪烁效果）
        if (this.isFlickering || this.popInState === 'FADING') {
            ctx.globalAlpha = this.opacity;
        }

        // 点击反馈：变亮和抖动效果
        if (this.isClicked) {
            this.renderClickFeedback(ctx);
        }

        // 根据渲染类型选择渲染方式
        if (this.config.renderer === 'mouse' && this.mouseRenderer) {
            // Canvas渲染模式（老鼠）
            ctx.restore();  // 先restore以避免影响renderer内部的变换
            const mouseState = {
                isStartled: this.isStartled,
                isClicked: this.isClicked,
                clickIntensity: this.clickIntensity
            };
            this.mouseRenderer.render(
                ctx,
                this.position.x,
                this.position.y,
                finalScale,
                this.time,
                mouseState
            );
            ctx.save();   // 重新save以匹配后面的restore
        } else if (this.config.renderer === 'fish' && this.fishRenderer) {
            // Canvas渲染模式（小鱼）
            ctx.restore();  // 先restore以避免影响renderer内部的变换
            const fishState = {
                isStartled: this.isStartled,
                isClicked: this.isClicked,
                clickIntensity: this.clickIntensity
            };
            this.fishRenderer.render(
                ctx,
                this.position.x,
                this.position.y,
                finalScale,
                this.time,
                fishState
            );
            ctx.save();   // 重新save以匹配后面的restore
        } else if (this.config.renderType === 'canvas' && this.config.id === 'butterfly' && this.butterflyRenderer) {
            // Canvas渲染模式（蝴蝶）
            ctx.restore();  // 先restore以避免影响renderer内部的变换
            const rotation = this.calculateRotation();
            const isMoving = this.velocity && this.velocity.magnitude() > 0;
            const speed = isMoving ? this.velocity.magnitude() : this.config.speed;
            this.butterflyRenderer.render(
                ctx,
                this.position,
                this.radius,
                rotation,
                this.time,
                finalScale * this.startleScale,
                isMoving,
                speed
            );
            ctx.save();   // 重新save以匹配后面的restore
        } else if (this.renderType === 'canvas' && this.config.renderer === 'ladybug' && this.ladybugRenderer) {
            // Canvas渲染模式（瓢虫）
            ctx.restore();  // 先restore以避免影响renderer内部的变换
            const isMoving = this.checkIsMoving();
            const currentSpeed = isMoving ? this.velocity ? this.velocity.magnitude() : this.config.speed : 0;

            this.ladybugRenderer.render(
                ctx,
                this.position,
                this.radius,
                this.currentRotation,
                this.time,
                finalScale,
                isMoving,
                currentSpeed,
                this.isStartled  // ← 传递受惊状态（关键参数）
            );
            ctx.save();   // 重新save以匹配后面的restore
        } else if (this.renderType === 'multiline' && this.multilineRenderer) {
            // 多线渲染模式（多彩线群）
            ctx.restore();  // 先restore以避免影响multiline renderer内部的变换
            this.multilineRenderer.render(ctx, this.canvasWidth, this.canvasHeight, this.time);
            ctx.save();   // 重新save以匹配后面的restore
        } else if (this.renderType === 'canvas' && this.renderer) {
            // Canvas渲染模式（兔子、毛线球等）
            ctx.restore();  // 先restore以避免影响renderer内部的变换
            const isMoving = this.checkIsMoving();
            const currentSpeed = this.getCurrentSpeed();

            // 更新毛线球轨迹
            if (this.config.id === 'yarn' && this.renderer.updateTrail) {
                this.renderer.updateTrail(this.position, currentSpeed);
            }

            this.renderer.render(ctx, this.position, this.radius, this.currentRotation, this.time, finalScale, isMoving, currentSpeed);
            ctx.save();   // 重新save以匹配后面的restore
        } else if (this.imageLoaded) {
            // 图片渲染模式（默认）
            const size = this.radius * 2 * finalScale;
            ctx.drawImage(
                this.image,
                -size / 2,
                -size / 2,
                size,
                size
            );
        } else {
            // 加载中占位符
            ctx.fillStyle = '#CCCCCC';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius * finalScale, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#666666';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('加载中...', 0, 5);
        }

        ctx.restore();

        // 绘制惊叹号（在目标上方，不受旋转影响）
        if (this.exclamationTimer > 0) {
            this.renderExclamation(ctx);
        }

        // 绘制行为相关的视觉效果
        this.renderBehaviors(ctx);
    }

    /**
     * 渲染点击反馈效果（变亮和抖动）
     */
    renderClickFeedback(ctx) {
        // 计算点击强度（随时间衰减）
        const timeSinceClick = Date.now() - this.clickTime;
        const maxDuration = 300; // 300ms

        if (timeSinceClick >= maxDuration) {
            this.isClicked = false;
            this.clickIntensity = 0;
            return;
        }

        // 线性衰减
        this.clickIntensity = 1 - (timeSinceClick / maxDuration);

        // 变亮效果
        ctx.globalAlpha = 0.8 + this.clickIntensity * 0.2;
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 20 * this.clickIntensity;

        // 抖动效果
        const jitterAmount = 5 * this.clickIntensity;
        const jitterX = (Math.random() - 0.5) * jitterAmount;
        const jitterY = (Math.random() - 0.5) * jitterAmount;

        ctx.translate(jitterX, jitterY);
    }

    /**
     * 渲染行为相关的视觉效果
     */
    renderBehaviors(ctx) {
        if (!this.behaviorSystem) return;

        // 绘制装死表情
        const playDeadBehavior = this.behaviorSystem.behaviors.get('playDead');
        if (playDeadBehavior && playDeadBehavior.renderExpression) {
            playDeadBehavior.renderExpression(ctx, this, this.position.x, this.position.y);
        }

        // 绘制叫声视觉效果
        const vocalizationBehavior = this.behaviorSystem.behaviors.get('vocalization');
        if (vocalizationBehavior && vocalizationBehavior.renderVisual) {
            vocalizationBehavior.renderVisual(ctx, this, this.position.x, this.position.y);
        }
    }

    /**
     * 渲染惊叹号特效
     */
    renderExclamation(ctx) {
        const alpha = Math.min(1, this.exclamationTimer / 0.2);  // 淡出效果

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#FF4444';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const x = this.position.x;
        const y = this.position.y + STARTLE_CONFIG.EXCLAMATION_OFFSET_Y;

        // 缩放动画（出现时放大然后收缩）
        const scaleProgress = 1 - alpha;
        const scale = 1 + scaleProgress * 0.5;

        ctx.translate(x, y);
        ctx.scale(scale, scale);

        ctx.strokeText('!', 0, 0);
        ctx.fillText('!', 0, 0);

        ctx.restore();
    }

    // ============ 窜出动画相关方法 ============

    /**
     * 检查是否应该触发窜出
     * @returns {boolean} 是否应该触发窜出
     */
    shouldTriggerPopIn() {
        const config = POPIN_CONFIG;
        const typeConfig = config.OVERRIDE[this.config.id] || {};

        // 1. 概率检查
        const probability = typeConfig.probability || config.PROBABILITY;
        if (Math.random() > probability) return false;

        // 2. 冷却时间检查
        if (this.lastPopInTime && Date.now() - this.lastPopInTime < config.COOLDOWN * 1000) {
            return false;
        }

        // 3. 状态检查（不能在受惊时触发）
        if (this.isStartled) return false;

        // 4. 运动检查（使用速度而不是位置距离）
        const speed = this.velocity ? this.velocity.magnitude() : this.originalSpeed;
        if (speed < 10) return false;  // 速度太慢时不触发

        return true;
    }

    /**
     * 开始窜出动画
     * @param {number} canvasWidth - 画布宽度
     * @param {number} canvasHeight - 画布高度
     */
    startPopIn(canvasWidth, canvasHeight) {
        this.popInState = 'POPPING_OUT';
        this.popInProgress = 0;
        this.lastPopInTime = Date.now();

        // 随机选择进入方向（0:上, 1:右, 2:下, 3:左）
        const edge = Math.floor(Math.random() * 4);
        const margin = POPIN_CONFIG.POPIN_MARGIN;

        // 保存当前位置作为目标位置
        this.popInTargetPos = this.position.clone();

        // 计算起始位置（画布外）
        switch (edge) {
            case 0: // 从上方
                this.popInStartPos = new Vector2(this.popInTargetPos.x, -margin);
                break;
            case 1: // 从右侧
                this.popInStartPos = new Vector2(canvasWidth + margin, this.popInTargetPos.y);
                break;
            case 2: // 从下方
                this.popInStartPos = new Vector2(this.popInTargetPos.x, canvasHeight - 80 + margin);
                break;
            case 3: // 从左侧
                this.popInStartPos = new Vector2(-margin, this.popInTargetPos.y);
                break;
        }

        // 随机动画持续时间
        const minDur = POPIN_CONFIG.MIN_POPIN_DURATION;
        const maxDur = POPIN_CONFIG.MAX_POPIN_DURATION;
        this.popInDuration = minDur + Math.random() * (maxDur - minDur);

        // 立即移动到起始位置
        this.position = this.popInStartPos.clone();
    }

    /**
     * 更新窜出状态
     * @param {number} dt - 时间增量（秒）
     */
    updatePopInState(dt) {
        if (this.popInState === 'POPPING_OUT') {
            this.popInProgress += dt / this.popInDuration;

            if (this.popInProgress >= 1) {
                // 窜出完成，进入闪烁状态
                this.popInState = 'FADING';
                this.popInProgress = 0;
                this.startFlickering();
                this.syncMovementBasePoint();
            }
        } else if (this.popInState === 'FADING') {
            // 闪烁持续一段时间后恢复正常
            if (this.popInProgress >= POPIN_CONFIG.FLICKER_DURATION) {
                this.popInState = 'NORMAL';
                this.isFlickering = false;
                this.opacity = 1;
            }
            this.popInProgress += dt;
        }
    }

    /**
     * 更新窜出移动
     * @param {number} dt - 时间增量（秒）
     */
    updatePopInMovement(dt) {
        const progress = Math.min(this.popInProgress, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3); // ease-out cubic

        // 位置插值
        this.position.x = this.popInStartPos.x + (this.popInTargetPos.x - this.popInStartPos.x) * easeOut;
        this.position.y = this.popInStartPos.y + (this.popInTargetPos.y - this.popInStartPos.y) * easeOut;
    }

    /**
     * 开始闪烁
     */
    startFlickering() {
        const typeConfig = POPIN_CONFIG.OVERRIDE[this.config.id] || {};

        // 特殊处理总是闪烁的目标
        if (typeConfig.isAlwaysFlickering) {
            this.isFlickering = true;
            this.flickerPhase = 0;
            return;
        }

        // 根据概率决定是否闪烁
        const flickerProb = typeConfig.flickerProbability || POPIN_CONFIG.FLICKER_PROBABILITY;
        if (Math.random() < flickerProb) {
            this.isFlickering = true;
            this.flickerPhase = 0;
        }
    }

    /**
     * 更新闪烁
     * @param {number} dt - 时间增量（秒）
     */
    updateFlicker(dt) {
        if (!this.isFlickering) return;

        const config = POPIN_CONFIG;
        this.flickerPhase += dt * config.FLICKER_SPEED;

        // 正弦波计算透明度
        const wave = Math.sin(this.flickerPhase);
        const t = (wave + 1) / 2; // 映射到 0-1
        this.opacity = config.MIN_OPACITY + (config.MAX_OPACITY - config.MIN_OPACITY) * t;
    }

    /**
     * 提前结束窜出（受惊时调用）
     */
    endPopInEarly() {
        if (this.popInState === 'POPPING_OUT') {
            // 立即移动到目标位置
            this.position = this.popInTargetPos.clone();
            this.popInState = 'FADING';
            this.popInProgress = 0;

            // 开始闪烁
            this.startFlickering();

            // 同步基准点
            this.syncMovementBasePoint();
        }
    }
}
