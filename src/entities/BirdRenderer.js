export class BirdRenderer {
    constructor(config = {}) {
        this.config = {
            bodyColor: '#9C7B5E',
            bellyColor: '#EAD7C5',
            wingColor: '#6B4F3A',
            beakColor: '#D79B3B',
            eyeColor: '#111111',
            eyeHighlight: '#FFFFFF',

            bodyRadius: 0.93,
            headRadius: 0.73,
            wingLength: 1.17,

            wingFlapSpeed: 16,
            blinkInterval: 4,
            blinkDuration: 0.18,

            highlightEnabled: true
        }

        Object.assign(this.config, config.renderConfig || {})
    }

    render(ctx, position, radius, rotation, time, scale = 1, isMoving = true, speed = 120) {
        ctx.save()
        ctx.translate(position.x, position.y)
        ctx.scale(scale, scale)

        // 自动轻微俯仰
        const autoTilt = isMoving ? Math.sin(time * 4) * 0.08 : 0
        ctx.rotate(rotation + autoTilt)

        // 轻微上下浮动
        const floatY = isMoving ? Math.sin(time * 3) * 4 : 0
        ctx.translate(0, floatY)

        const frontFlap = Math.sin(time * this.config.wingFlapSpeed) * 0.6
        const backFlap = Math.sin(time * this.config.wingFlapSpeed + 0.6) * 0.6
        const blinkFactor = this.calculateBlink(time)

        this.renderWingBack(ctx, radius, backFlap)
        this.renderBody(ctx, radius)
        this.renderHead(ctx, radius)
        this.renderWingFront(ctx, radius, frontFlap)
        this.renderEye(ctx, radius, blinkFactor)
        this.renderBeak(ctx, radius)

        ctx.restore()
    }

    calculateBlink(time) {
        const { blinkInterval, blinkDuration } = this.config
        const cycle = time % blinkInterval

        if (cycle < blinkDuration) {
            const t = cycle / blinkDuration
            return t < 0.5 ? 1 - t * 2 : (t - 0.5) * 2
        }

        return 1
    }

    renderBody(ctx, radius) {
        const r = radius * this.config.bodyRadius

        ctx.fillStyle = this.config.bodyColor
        ctx.beginPath()
        ctx.ellipse(0, 0, r * 0.8, r * 0.9, 0, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = this.config.bellyColor
        ctx.beginPath()
        ctx.ellipse(0, r * 0.2, r * 0.5, r * 0.6, 0, 0, Math.PI * 2)
        ctx.fill()
    }

    renderHead(ctx, radius) {
        const headR = radius * this.config.headRadius
        const headX = radius * 0.5

        ctx.fillStyle = this.config.bodyColor
        ctx.beginPath()
        ctx.arc(headX, 0, headR, 0, Math.PI * 2)
        ctx.fill()
    }

    renderWingBack(ctx, radius, flap) {
        this.drawWing(ctx, radius, flap, 0.85)
    }

    renderWingFront(ctx, radius, flap) {
        this.drawWing(ctx, radius, flap, 1)
    }

    drawWing(ctx, radius, flap, scaleFactor) {
        const wingLen = radius * this.config.wingLength
        const wingWidth = wingLen * 0.6

        ctx.save()
        ctx.scale(scaleFactor, scaleFactor)

        ctx.rotate(flap)

        ctx.fillStyle = this.config.wingColor
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.quadraticCurveTo(-wingWidth * 0.5, -wingLen * 0.5, -wingWidth, -wingLen * 0.8)
        ctx.quadraticCurveTo(-wingWidth * 0.7, -wingLen * 0.2, 0, 0)
        ctx.fill()

        ctx.scale(-1, 1)
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.quadraticCurveTo(-wingWidth * 0.5, -wingLen * 0.5, -wingWidth, -wingLen * 0.8)
        ctx.quadraticCurveTo(-wingWidth * 0.7, -wingLen * 0.2, 0, 0)
        ctx.fill()

        ctx.restore()
    }

    renderEye(ctx, radius, blinkFactor) {
        const headR = radius * this.config.headRadius
        const eyeSize = headR * 0.25
        const eyeX = radius * 0.5 + headR * 0.3

        ctx.save()
        ctx.scale(1, blinkFactor)

        ctx.fillStyle = this.config.eyeColor
        ctx.beginPath()
        ctx.arc(eyeX, -headR * 0.2, eyeSize, 0, Math.PI * 2)
        ctx.fill()

        ctx.restore()
    }

    renderBeak(ctx, radius) {
        const headR = radius * this.config.headRadius
        const headX = radius * 0.5 + headR * 0.9

        ctx.fillStyle = this.config.beakColor
        ctx.beginPath()
        ctx.moveTo(headX, 0)
        ctx.lineTo(headX + headR * 0.5, -headR * 0.2)
        ctx.lineTo(headX + headR * 0.5, headR * 0.2)
        ctx.closePath()
        ctx.fill()
    }
}