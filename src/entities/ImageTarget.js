import { Entity } from './Entity';
import { Vector2 } from '../utils/Vector2';
import { CONFIG } from '../config';

export class ImageTarget extends Entity {
    constructor(position, config) {
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

        // 获取运动参数（合并默认配置和自定义配置）
        const movementType = config.movement || 'bounce';
        const defaultParams = CONFIG.MOVEMENT_PARAMS[movementType] || {};
        this.movementParams = {
            ...defaultParams,
            ...(config.movementConfig || {})
        };

        // 初始化图片
        this.image = tt.createImage();
        this.image.onload = () => {
            this.imageLoaded = true;
        };
        this.image.src = config.image;

        // 初始速度向量
        const angle = Math.random() * Math.PI * 2;
        this.velocity = new Vector2(
            Math.cos(angle) * config.speed,
            Math.sin(angle) * config.speed
        );

        // 初始化运动特定状态
        this.initMovement(position);
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
        }
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
     * 冲刺运动 - 快速冲刺 + 停顿
     */
    updateDash(dt, canvasWidth, canvasHeight) {
        const params = this.movementParams;
        const dashSpeed = params.dashSpeed || 200;
        const dashDuration = params.dashDuration || 0.4;
        const pauseDuration = params.pauseDuration || 0.8;

        this.dashTimer += dt;

        if (this.isDashing) {
            // 冲刺阶段 - 快速移动
            this.position.x += this.dashVelocity.x * dt;
            this.position.y += this.dashVelocity.y * dt;

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
            // 停顿阶段 - 轻微晃动
            const wobbleX = Math.sin(this.time * 8) * 2;
            const wobbleY = Math.cos(this.time * 8) * 2;
            this.position.x += wobbleX * dt;
            this.position.y += wobbleY * dt;

            // 停顿结束，开始新的冲刺
            if (this.dashTimer >= pauseDuration) {
                this.isDashing = true;
                this.dashTimer = 0;

                // 随机新方向
                const angle = Math.random() * Math.PI * 2;
                this.dashVelocity = new Vector2(
                    Math.cos(angle) * dashSpeed,
                    Math.sin(angle) * dashSpeed
                );
            }
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

    // ==================== 渲染 ====================

    render(ctx) {
        ctx.save();

        const wobble = Math.sin(this.time * 3) * 0.1;
        const scale = 1 + wobble * 0.1;

        if (this.imageLoaded) {
            const size = this.radius * 2 * scale;
            ctx.drawImage(
                this.image,
                this.position.x - size / 2,
                this.position.y - size / 2,
                size,
                size
            );
        } else {
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
