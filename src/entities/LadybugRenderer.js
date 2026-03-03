/**
 * LadybugRenderer - 瓢虫Canvas渲染器
 *
 * 特点：
 * - 七星瓢虫外观（鲜红色背壳、黑色斑点、半圆黑头）
 * - 6只腿爬行动画
 * - 受惊时红色硬翅打开，透明翅膀快速扇动
 * - 真实的昆虫立体感
 */
export class LadybugRenderer {
    constructor(config = {}) {
        this.config = {
            // 颜色配置
            headColor: '#000000',           // 纯黑头部
            bodyColor: '#FF0000',           // 鲜红色背壳
            bodyColorDark: '#CC0000',        // 深红色渐变
            spotColor: '#000000',           // 黑色斑点
            wingColor: 'rgba(255, 255, 255, 0.6)',  // 半透明白色翅膀
            antennaColor: '#000000',        // 黑色触角

            // 尺寸比例（相对于 radius）
            headRadius: 0.4,                // 头部半径
            bodyLength: 0.85,               // 身体长度
            bodyWidth: 0.75,                // 身体宽度
            wingLength: 0.7,                // 翅膀长度
            wingWidth: 0.65,                // 翅膀宽度

            // 动画参数
            legMoveSpeed: 8,                // 腿部摆动速度
            wingFlapSpeed: 25,              // 翅膀扇动速度
            wingOpenDuration: 0.15,         // 硬翅打开时长（秒）

            // 七星瓢虫斑点位置（相对于身体中心，[-1, 1]坐标系）
            spots: [
                // 中线斑点
                { x: 0, y: -0.15, size: 0.18 },
                // 右侧斑点
                { x: 0.25, y: 0.05, size: 0.15 },
                { x: 0.35, y: -0.25, size: 0.15 },
                { x: 0.35, y: 0.25, size: 0.15 },
                // 左侧斑点（镜像）
                { x: -0.25, y: 0.05, size: 0.15 },
                { x: -0.35, y: -0.25, size: 0.15 },
                { x: -0.35, y: 0.25, size: 0.15 }
            ]
        };

        Object.assign(this.config, config.renderConfig || {});
    }

    /**
     * 主渲染方法
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {Object} position - 位置 {x, y}
     * @param {number} radius - 半径
     * @param {number} rotation - 旋转角度（弧度）
     * @param {number} time - 当前时间（秒）
     * @param {number} scale - 缩放
     * @param {boolean} isMoving - 是否在移动
     * @param {number} speed - 移动速度
     * @param {boolean} isStartled - 是否受惊（关键参数）
     */
    render(ctx, position, radius, rotation, time, scale = 1, isMoving = true, speed = 60, isStartled = false) {
        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.scale(scale, scale);
        ctx.rotate(rotation);

        // 计算翅膀状态（受惊时打开）
        const wingState = this.calculateWingState(time, isStartled);

        // 按照Z轴顺序渲染（从后到前）
        this.renderLegs(ctx, radius, time, isMoving, true);    // 1. 后腿
        this.renderWings(ctx, radius, wingState);               // 2. 翅膀
        this.renderBody(ctx, radius);                           // 3. 身体
        this.renderHead(ctx, radius);                           // 4. 头部
        this.renderLegs(ctx, radius, time, isMoving, false);   // 5. 前腿

        ctx.restore();
    }

    /**
     * 计算翅膀状态
     */
    calculateWingState(time, isStartled) {
        // 如果不受惊，翅膀完全闭合
        if (!isStartled) {
            return {
                elytraOpen: 0,              // 硬翅打开角度（0 = 闭合，1 = 完全展开）
                wingFlap: 0,                // 透明翅扇动角度
                showTransparentWings: false
            };
        }

        // 受惊时：硬翅平滑打开，然后透明翅开始扇动
        const openPhase = Math.min(time / this.config.wingOpenDuration, 1);

        // 使用缓动函数 easeOutCubic
        const easedOpen = 1 - Math.pow(1 - openPhase, 3);

        // 硬翅打开角度：0 -> 1（在 0.15 秒内完成）
        const elytraOpen = easedOpen;

        // 透明翅扇动：硬翅打开后才开始
        const showTransparentWings = openPhase >= 1;
        const wingFlap = showTransparentWings ?
            Math.sin(time * this.config.wingFlapSpeed) * 0.5 : 0;

        return { elytraOpen, wingFlap, showTransparentWings };
    }

    /**
     * 渲染腿部（爬行动画）- 分节昆虫腿
     */
    renderLegs(ctx, radius, time, isMoving, isBackLegs) {
        if (!isMoving) return;

        const phaseOffset = Math.PI * 2 / 6;
        const startIndex = isBackLegs ? 0 : 3;

        for (let i = startIndex; i < startIndex + 3; i++) {
            const phase = time * this.config.legMoveSpeed + i * phaseOffset;
            const swing = Math.sin(phase) * 0.3;

            const side = i < 3 ? 1 : -1;
            const legIndex = i % 3;
            const forwardOffset = (legIndex - 1) * 0.3;

            const socketX = side * radius * 0.32;
            const socketY = forwardOffset * radius;

            // 绘制分节的单腿
            this.renderInsectLeg(ctx, radius, socketX, socketY, side, swing, legIndex);
        }
    }

    /**
     * 绘制单条分节昆虫腿
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {number} radius - 瓢虫半径
     * @param {number} socketX - 腿部起点X
     * @param {number} socketY - 腿部起点Y
     * @param {number} side - 1（右侧）或 -1（左侧）
     * @param {number} swing - 摆动幅度
     * @param {number} legIndex - 腿的索引（0-2）
     */
    renderInsectLeg(ctx, radius, socketX, socketY, side, swing, legIndex) {
        const legLength = radius * 0.65;

        // 基节（粗短）
        const coxaLength = legLength * 0.2;
        const trochanterX = socketX + side * coxaLength;
        const trochanterY = socketY;

        // 腿节（最长，向后延伸）
        const femurLength = legLength * 0.4;
        const kneeX = trochanterX + side * femurLength * 0.7;
        const kneeY = trochanterY + swing * radius * 0.5;

        // 胫节（中等）
        const tibiaLength = legLength * 0.3;
        const ankleX = kneeX + side * tibiaLength * 0.6;
        const ankleY = kneeY + swing * radius;

        // 跗节（细长）
        const tarsusLength = legLength * 0.25;
        const tipX = ankleX + side * tarsusLength * 0.8 + side * legLength * 0.3;
        const tipY = ankleY + swing * radius * 1.5;

        ctx.strokeStyle = '#000000';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 基节（粗）
        ctx.lineWidth = radius * 0.06;
        ctx.beginPath();
        ctx.moveTo(socketX, socketY);
        ctx.lineTo(trochanterX, trochanterY);
        ctx.stroke();

        // 腿节（中等）
        ctx.lineWidth = radius * 0.045;
        ctx.beginPath();
        ctx.moveTo(trochanterX, trochanterY);
        ctx.quadraticCurveTo(trochanterX + side * femurLength * 0.3, trochanterY,
                            kneeX, kneeY);
        ctx.stroke();

        // 胫节（细）
        ctx.lineWidth = radius * 0.035;
        ctx.beginPath();
        ctx.moveTo(kneeX, kneeY);
        ctx.lineTo(ankleX, ankleY);
        ctx.stroke();

        // 跗节（最细）
        ctx.lineWidth = radius * 0.025;
        ctx.beginPath();
        ctx.moveTo(ankleX, ankleY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // 末端爪（微小）
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(tipX, tipY, radius * 0.02, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 渲染翅膀
     */
    renderWings(ctx, radius, wingState) {
        const { elytraOpen, wingFlap, showTransparentWings } = wingState;
        const wingLength = radius * this.config.wingLength;
        const wingWidth = radius * this.config.wingWidth;

        ctx.save();

        // === 1. 绘制透明翅（底层，受惊时扇动）===
        if (showTransparentWings) {
            const flapScale = Math.cos(wingFlap) * 0.5 + 0.5;

            ctx.fillStyle = this.config.wingColor;

            // 右透明翅
            ctx.save();
            ctx.scale(flapScale, 1);
            ctx.beginPath();
            ctx.ellipse(
                wingWidth * 0.5,
                -wingLength * 0.1,
                wingWidth * 0.4,
                wingLength * 0.4,
                -0.2,
                0,
                Math.PI * 2
            );
            ctx.fill();
            ctx.restore();

            // 左透明翅（镜像）
            ctx.save();
            ctx.scale(-flapScale, 1);
            ctx.beginPath();
            ctx.ellipse(
                wingWidth * 0.5,
                -wingLength * 0.1,
                wingWidth * 0.4,
                wingLength * 0.4,
                -0.2,
                0,
                Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        }

        // === 2. 绘制硬翅（顶层，从闭合到打开）===
        const elytraAngle = elytraOpen * 0.8;  // 最大打开角度 0.8 弧度

        // 右硬翅
        ctx.save();
        ctx.translate(0, -wingLength * 0.3);
        ctx.rotate(elytraAngle);

        ctx.fillStyle = this.config.bodyColor;
        ctx.beginPath();
        ctx.ellipse(
            wingWidth * 0.5,
            0,
            wingWidth * 0.45,
            wingLength * 0.45,
            0,
            -Math.PI * 0.6,
            Math.PI * 0.6
        );
        ctx.fill();

        // 硬翅上的黑斑
        this.renderElytraSpots(ctx, radius, 1);
        ctx.restore();

        // 左硬翅（镜像）
        ctx.save();
        ctx.translate(0, -wingLength * 0.3);
        ctx.rotate(-elytraAngle);
        ctx.scale(-1, 1);

        ctx.fillStyle = this.config.bodyColor;
        ctx.beginPath();
        ctx.ellipse(
            wingWidth * 0.5,
            0,
            wingWidth * 0.45,
            wingLength * 0.45,
            0,
            -Math.PI * 0.6,
            Math.PI * 0.6
        );
        ctx.fill();

        this.renderElytraSpots(ctx, radius, -1);
        ctx.restore();

        ctx.restore();
    }

    /**
     * 渲染身体（背壳）- 半球形立体感
     */
    renderBody(ctx, radius) {
        const bodyLength = radius * this.config.bodyLength;
        const bodyWidth = radius * this.config.bodyWidth;

        // 底层阴影（营造厚度）
        const shadowGradient = ctx.createRadialGradient(
            0, 0, 0,
            0, 0, bodyWidth * 0.5
        );
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.ellipse(2, 2, bodyWidth * 0.48, bodyLength * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();

        // 主身体：多层径向渐变（模拟半球形高光）
        const bodyGradient = ctx.createRadialGradient(
            -bodyWidth * 0.15, -bodyLength * 0.2, 0,           // 高光点偏左上
            0, 0, bodyLength * 0.5                           // 扩散到边缘
        );
        bodyGradient.addColorStop(0, this.config.bodyColorLight || '#FF3333');  // 高光区（亮红）
        bodyGradient.addColorStop(0.3, this.config.bodyColorMain || '#FF0000');   // 中间区（鲜红）
        bodyGradient.addColorStop(0.7, this.config.bodyColorMid || '#CC0000');    // 过渡区（深红）
        bodyGradient.addColorStop(1, this.config.bodyColorDark || '#990000');    // 边缘区（暗红）

        ctx.fillStyle = bodyGradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, bodyWidth * 0.48, bodyLength * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();

        // 顶部高光（模拟光泽）
        const highlightGradient = ctx.createRadialGradient(
            -bodyWidth * 0.2, -bodyLength * 0.25, 0,
            -bodyWidth * 0.2, -bodyLength * 0.25, bodyWidth * 0.15
        );
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.ellipse(-bodyWidth * 0.2, -bodyLength * 0.25,
                    bodyWidth * 0.15, bodyLength * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        // 绘制中间黑线（从头到尾）
        ctx.strokeStyle = this.config.spotColor;
        ctx.lineWidth = radius * 0.05;
        ctx.beginPath();
        ctx.moveTo(0, -bodyLength * 0.42);
        ctx.lineTo(0, bodyLength * 0.42);
        ctx.stroke();

        // 中线边缘高光（模拟凹陷感）
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = radius * 0.015;
        ctx.beginPath();
        ctx.moveTo(0, -bodyLength * 0.42);
        ctx.lineTo(0, bodyLength * 0.42);
        ctx.stroke();

        // 绘制七星黑斑
        this.renderSpots(ctx, radius);
    }

    /**
     * 渲染七星黑斑 - 边缘渐变和自然形状
     */
    renderSpots(ctx, radius) {
        const bodyLength = radius * this.config.bodyLength;
        const bodyWidth = radius * this.config.bodyWidth;

        this.config.spots.forEach((spot, index) => {
            const spotX = spot.x * bodyWidth;
            const spotY = spot.y * bodyLength;
            const spotSize = spot.size * radius;

            // 径向渐变（边缘柔和）
            const spotGradient = ctx.createRadialGradient(
                spotX, spotY, 0,
                spotX, spotY, spotSize
            );
            spotGradient.addColorStop(0, '#000000');           // 中心纯黑
            spotGradient.addColorStop(0.7, '#000000');          // 保持黑色
            spotGradient.addColorStop(0.85, 'rgba(0,0,0,0.8)'); // 边缘开始淡
            spotGradient.addColorStop(1, 'rgba(0,0,0,0)');     // 完全透明

            ctx.fillStyle = spotGradient;

            // 轻微不规则（随机微调）
            const irregularity = index % 3 === 0 ? 1.05 : 0.95;
            ctx.beginPath();
            ctx.ellipse(spotX, spotY, spotSize * irregularity, spotSize * 0.95 * irregularity,
                        index * 0.1, 0, Math.PI * 2);
            ctx.fill();

            // 小高光（让斑点有立体感）
            const highlightGradient = ctx.createRadialGradient(
                spotX - spotSize * 0.2, spotY - spotSize * 0.2, 0,
                spotX - spotSize * 0.2, spotY - spotSize * 0.2, spotSize * 0.3
            );
            highlightGradient.addColorStop(0, 'rgba(255,255,255,0.15)');
            highlightGradient.addColorStop(1, 'rgba(255,255,255,0)');

            ctx.fillStyle = highlightGradient;
            ctx.beginPath();
            ctx.ellipse(spotX - spotSize * 0.2, spotY - spotSize * 0.2,
                        spotSize * 0.3, spotSize * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /**
     * 渲染头部 - 添加复眼
     */
    renderHead(ctx, radius) {
        const headRadius = radius * this.config.headRadius;
        const headY = -radius * this.config.bodyLength * 0.4;

        // 头部底色（深色渐变）
        const headGradient = ctx.createRadialGradient(
            0, headY, 0,
            0, headY, headRadius
        );
        headGradient.addColorStop(0, this.config.headColorLight || '#1a1a1a');
        headGradient.addColorStop(1, this.config.headColorMain || '#000000');

        ctx.fillStyle = headGradient;
        ctx.beginPath();
        ctx.arc(0, headY, headRadius, Math.PI, 0);
        ctx.fill();

        // 复眼（大而明显）
        const eyeSize = headRadius * 0.35;
        const eyeX = headRadius * 0.5;
        const eyeY = headY - headRadius * 0.1;

        // 右眼
        const rightEyeGradient = ctx.createRadialGradient(
            eyeX + 2, eyeY - 2, 0,
            eyeX, eyeY, eyeSize
        );
        rightEyeGradient.addColorStop(0, '#4a4a4a');      // 反光
        rightEyeGradient.addColorStop(0.3, '#000000');    // 瞳孔
        rightEyeGradient.addColorStop(1, '#000000');

        ctx.fillStyle = rightEyeGradient;
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, eyeSize, eyeSize * 1.1, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // 左眼（镜像）
        ctx.save();
        ctx.scale(-1, 1);
        ctx.fillStyle = rightEyeGradient;
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, eyeSize, eyeSize * 1.1, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 眼睛高光（增加生动感）
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(eyeX - eyeSize * 0.3, eyeY - eyeSize * 0.3, eyeSize * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // 左眼高光
        ctx.save();
        ctx.scale(-1, 1);
        ctx.beginPath();
        ctx.arc(eyeX - eyeSize * 0.3, eyeY - eyeSize * 0.3, eyeSize * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 绘制触角
        this.renderAntennae(ctx, radius, headY);

        // 绘制口器
        this.renderMouthparts(ctx, radius, headY);
    }

    /**
     * 渲染口器细节
     */
    renderMouthparts(ctx, radius, headY) {
        const headRadius = radius * this.config.headRadius;
        const mouthY = headY + headRadius * 0.3;

        // 上颚（mandibles）
        ctx.fillStyle = '#1a1a1a';

        // 右上颚
        ctx.beginPath();
        ctx.moveTo(0, mouthY);
        ctx.lineTo(radius * 0.08, mouthY + radius * 0.08);
        ctx.lineTo(radius * 0.06, mouthY + radius * 0.12);
        ctx.lineTo(0, mouthY + radius * 0.05);
        ctx.fill();

        // 左上颚（镜像）
        ctx.save();
        ctx.scale(-1, 1);
        ctx.beginPath();
        ctx.moveTo(0, mouthY);
        ctx.lineTo(radius * 0.08, mouthY + radius * 0.08);
        ctx.lineTo(radius * 0.06, mouthY + radius * 0.12);
        ctx.lineTo(0, mouthY + radius * 0.05);
        ctx.fill();
        ctx.restore();
    }

    /**
     * 渲染膝状触角 - 分节结构
     */
    renderAntennae(ctx, radius, headY) {
        const headRadius = radius * this.config.headRadius;
        const antennaLength = radius * 0.5;
        const antennaWidth = radius * 0.035;

        ctx.strokeStyle = '#000000';
        ctx.lineCap = 'round';

        // 右触角（膝状：柄节 + 梗节 + 鞭节）
        const socketX = radius * 0.25;
        const socketY = headY - headRadius * 0.7;
        const elbowX = socketX + radius * 0.1;
        const elbowY = socketY - antennaLength * 0.35;
        const tipX = elbowX + radius * 0.25;
        const tipY = elbowY - antennaLength * 0.25;
        const clubX = tipX + radius * 0.08;
        const clubY = tipY - antennaLength * 0.1;

        // 绘制柄节（粗，垂直向上）
        ctx.lineWidth = antennaWidth * 1.5;
        ctx.beginPath();
        ctx.moveTo(socketX, socketY);
        ctx.quadraticCurveTo(socketX + radius * 0.05, socketY - antennaLength * 0.2,
                             elbowX, elbowY);
        ctx.stroke();

        // 绘制梗节（细，向前弯曲）
        ctx.lineWidth = antennaWidth;
        ctx.beginPath();
        ctx.moveTo(elbowX, elbowY);
        ctx.quadraticCurveTo(elbowX + radius * 0.15, elbowY - antennaLength * 0.15,
                             tipX, tipY);
        ctx.stroke();

        // 绘制末端膨大（棒状）
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(clubX, clubY, antennaWidth * 2, antennaWidth * 1.5,
                    Math.PI * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // 左触角（镜像）
        ctx.save();
        ctx.scale(-1, 1);

        // 柄节
        ctx.lineWidth = antennaWidth * 1.5;
        ctx.beginPath();
        ctx.moveTo(socketX, socketY);
        ctx.quadraticCurveTo(socketX + radius * 0.05, socketY - antennaLength * 0.2,
                             elbowX, elbowY);
        ctx.stroke();

        // 梗节
        ctx.lineWidth = antennaWidth;
        ctx.beginPath();
        ctx.moveTo(elbowX, elbowY);
        ctx.quadraticCurveTo(elbowX + radius * 0.15, elbowY - antennaLength * 0.15,
                             tipX, tipY);
        ctx.stroke();

        // 末端膨大
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(clubX, clubY, antennaWidth * 2, antennaWidth * 1.5,
                    Math.PI * 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * 渲染硬翅上的黑斑
     */
    renderElytraSpots(ctx, radius, side) {
        const wingLength = radius * this.config.wingLength;
        const wingWidth = radius * this.config.wingWidth;

        // 硬翅上的斑点（简化版，只画2个）
        const spots = [
            { x: 0.3, y: -0.1, size: 0.08 },
            { x: 0.25, y: 0.15, size: 0.06 }
        ];

        ctx.fillStyle = this.config.spotColor;

        spots.forEach(spot => {
            const spotX = spot.x * wingWidth * (side === 1 ? 1 : -1);
            const spotY = spot.y * wingLength;
            const spotSize = spot.size * radius;

            ctx.beginPath();
            ctx.ellipse(
                spotX,
                spotY,
                spotSize,
                spotSize * 0.9,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();
        });
    }
}
