/**
 * SoundGenerator - Web Audio API 音效合成器
 * 使用代码生成游戏音效，无需外部音效文件
 */
export class SoundGenerator {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.initialized = false;
    }

    /**
     * 初始化音频上下文（需要在用户交互后调用）
     */
    init() {
        if (this.initialized) return;

        try {
            // 尝试使用抖音小游戏的 WebAudio API
            const AudioContext = window.AudioContext || window.webkitAudioContext || tt.createInnerAudioContext;
            if (typeof AudioContext === 'function') {
                this.audioContext = new AudioContext();
            } else if (typeof tt !== 'undefined' && tt.createInnerAudioContext) {
                this.audioContext = tt.createInnerAudioContext();
            }

            if (this.audioContext) {
                this.masterGain = this.audioContext.createGain();
                this.masterGain.connect(this.audioContext.destination);
                this.masterGain.gain.value = 0.8;
                this.initialized = true;
            }
        } catch (e) {
            console.warn('Web Audio API 不可用:', e);
        }
    }

    /**
     * 恢复音频上下文（某些浏览器需要）
     */
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * 设置主音量
     */
    setVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, value));
        }
    }

    /**
     * 静音
     */
    mute() {
        if (this.masterGain) {
            this.masterGain.gain.value = 0;
        }
    }

    /**
     * 取消静音
     */
    unmute(volume = 0.8) {
        if (this.masterGain) {
            this.masterGain.gain.value = volume;
        }
    }

    /**
     * 创建振荡器
     */
    createOscillator(type, frequency) {
        if (!this.audioContext) return null;
        const osc = this.audioContext.createOscillator();
        osc.type = type;
        osc.frequency.value = frequency;
        return osc;
    }

    /**
     * 创建增益节点
     */
    createGain(value = 1) {
        if (!this.audioContext) return null;
        const gain = this.audioContext.createGain();
        gain.gain.value = value;
        return gain;
    }

    /**
     * 得分音效 - 清脆的"叮"声
     * 正弦波 + 频率下降 + 快速衰减
     */
    playCatch(points = 10) {
        if (!this.audioContext || !this.initialized) return;
        this.resume();

        const now = this.audioContext.currentTime;

        // 根据分数调整基础频率（分数越高音调越高）
        const baseFreq = 800 + Math.min(points * 10, 400);

        // 主音（正弦波）
        const osc1 = this.createOscillator('sine', baseFreq);
        const gain1 = this.createGain(0.4);

        osc1.connect(gain1);
        gain1.connect(this.masterGain);

        // 频率下降
        osc1.frequency.setValueAtTime(baseFreq, now);
        osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.15);

        // 音量包络
        gain1.gain.setValueAtTime(0.4, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        // 泛音（增加金属感）
        const osc2 = this.createOscillator('sine', baseFreq * 2.5);
        const gain2 = this.createGain(0.15);

        osc2.connect(gain2);
        gain2.connect(this.masterGain);

        gain2.gain.setValueAtTime(0.15, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        // 播放
        osc1.start(now);
        osc1.stop(now + 0.25);
        osc2.start(now);
        osc2.stop(now + 0.15);
    }

    /**
     * 解锁音效 - 欢快的上升音阶
     */
    playUnlock() {
        if (!this.audioContext || !this.initialized) return;
        this.resume();

        const now = this.audioContext.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

        notes.forEach((freq, i) => {
            const osc = this.createOscillator('sine', freq);
            const gain = this.createGain(0);

            osc.connect(gain);
            gain.connect(this.masterGain);

            const startTime = now + i * 0.1;

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

            osc.start(startTime);
            osc.stop(startTime + 0.25);
        });

        // 闪亮音效（高频正弦波）
        const sparkle = this.createOscillator('sine', 2000);
        const sparkleGain = this.createGain(0);

        sparkle.connect(sparkleGain);
        sparkleGain.connect(this.masterGain);

        sparkleGain.gain.setValueAtTime(0, now + 0.3);
        sparkleGain.gain.linearRampToValueAtTime(0.15, now + 0.35);
        sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        sparkle.start(now + 0.3);
        sparkle.stop(now + 0.55);
    }

    /**
     * 倒计时音效 - 滴答声
     */
    playCountdown() {
        if (!this.audioContext || !this.initialized) return;
        this.resume();

        const now = this.audioContext.currentTime;

        // 短促的滴答声
        const osc = this.createOscillator('square', 1000);
        const gain = this.createGain(0.2);

        osc.connect(gain);
        gain.connect(this.masterGain);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    /**
     * 游戏开始音效 - 活泼的上升音
     */
    playGameStart() {
        if (!this.audioContext || !this.initialized) return;
        this.resume();

        const now = this.audioContext.currentTime;

        // 上升的滑音
        const osc = this.createOscillator('sawtooth', 200);
        const gain = this.createGain(0.2);

        // 低通滤波器让声音更柔和
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.2);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.setValueAtTime(0.2, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.4);

        // 结束音
        const endOsc = this.createOscillator('sine', 800);
        const endGain = this.createGain(0);

        endOsc.connect(endGain);
        endGain.connect(this.masterGain);

        endGain.gain.setValueAtTime(0, now + 0.2);
        endGain.gain.linearRampToValueAtTime(0.3, now + 0.25);
        endGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        endOsc.start(now + 0.2);
        endOsc.stop(now + 0.45);
    }

    /**
     * 游戏结束音效 - 温和的结束感
     */
    playGameOver() {
        if (!this.audioContext || !this.initialized) return;
        this.resume();

        const now = this.audioContext.currentTime;

        // 下降的和弦
        const notes = [523.25, 392.00, 329.63, 261.63]; // C5, G4, E4, C4

        notes.forEach((freq, i) => {
            const osc = this.createOscillator('sine', freq);
            const gain = this.createGain(0);

            osc.connect(gain);
            gain.connect(this.masterGain);

            const startTime = now + i * 0.15;

            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.25, startTime + 0.05);
            gain.gain.setValueAtTime(0.25, startTime + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

            osc.start(startTime);
            osc.stop(startTime + 0.55);
        });

        // 最后的和弦持续音
        setTimeout(() => {
            if (!this.audioContext) return;
            const finalNow = this.audioContext.currentTime;
            const chordNotes = [261.63, 329.63, 392.00]; // C4, E4, G4

            chordNotes.forEach(freq => {
                const osc = this.createOscillator('sine', freq);
                const gain = this.createGain(0);

                osc.connect(gain);
                gain.connect(this.masterGain);

                gain.gain.setValueAtTime(0, finalNow);
                gain.gain.linearRampToValueAtTime(0.15, finalNow + 0.1);
                gain.gain.setValueAtTime(0.15, finalNow + 0.3);
                gain.gain.exponentialRampToValueAtTime(0.01, finalNow + 0.8);

                osc.start(finalNow);
                osc.stop(finalNow + 0.85);
            });
        }, 600);
    }

    /**
     * 按钮点击音效 - 短促清脆
     */
    playButtonClick() {
        if (!this.audioContext || !this.initialized) return;
        this.resume();

        const now = this.audioContext.currentTime;

        const osc = this.createOscillator('sine', 600);
        const gain = this.createGain(0.15);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    /**
     * 卡片滑动音效 - 轻微的滑动声
     */
    playCardScroll() {
        if (!this.audioContext || !this.initialized) return;
        this.resume();

        const now = this.audioContext.currentTime;

        // 使用噪声模拟滑动
        const bufferSize = this.audioContext.sampleRate * 0.05;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.1;
        }

        const noise = this.audioContext.createBufferSource();
        noise.buffer = buffer;

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;

        const gain = this.createGain(0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        noise.start(now);
    }

    /**
     * 模式选择音效 - 特殊激活音
     */
    playModeSelect() {
        if (!this.audioContext || !this.initialized) return;
        this.resume();

        const now = this.audioContext.currentTime;

        // 低音基础
        const bass = this.createOscillator('sine', 150);
        const bassGain = this.createGain(0.2);

        bass.connect(bassGain);
        bassGain.connect(this.masterGain);

        bassGain.gain.setValueAtTime(0.2, now);
        bassGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        bass.start(now);
        bass.stop(now + 0.25);

        // 上升的音效
        const sweep = this.createOscillator('sawtooth', 300);
        const sweepGain = this.createGain(0.1);

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1500;

        sweep.connect(filter);
        filter.connect(sweepGain);
        sweepGain.connect(this.masterGain);

        sweep.frequency.setValueAtTime(300, now);
        sweep.frequency.exponentialRampToValueAtTime(600, now + 0.15);

        sweepGain.gain.setValueAtTime(0.1, now);
        sweepGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        sweep.start(now);
        sweep.stop(now + 0.25);

        // 高音点缀
        const high = this.createOscillator('sine', 1200);
        const highGain = this.createGain(0);

        high.connect(highGain);
        highGain.connect(this.masterGain);

        highGain.gain.setValueAtTime(0, now + 0.1);
        highGain.gain.linearRampToValueAtTime(0.2, now + 0.15);
        highGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        high.start(now + 0.1);
        high.stop(now + 0.35);
    }

    /**
     * 销毁音频上下文
     */
    destroy() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
            this.masterGain = null;
            this.initialized = false;
        }
    }
}
