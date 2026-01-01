/**
 * SoundGenerator - 音效播放器
 * 使用预渲染的 MP3 文件播放游戏音效
 */
import { AUDIO_CONFIG, getPointsTier } from './config';

export class SoundGenerator {
    constructor() {
        this.initialized = false;
        this.volume = 0.8; // 音效音量
    }

    /**
     * 初始化音效系统
     */
    init() {
        if (this.initialized) return;
        this.initialized = true;
        console.log('音效系统已初始化（使用预渲染 MP3 文件）');
    }

    /**
     * 恢复音频（兼容接口）
     */
    resume() {
        // MP3 播放不需要恢复
    }

    /**
     * 设置主音量
     */
    setVolume(value) {
        this.volume = Math.max(0, Math.min(1, value));
    }

    /**
     * 静音
     */
    mute() {
        this.volume = 0;
    }

    /**
     * 取消静音
     */
    unmute(volume = 0.8) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * 播放音效文件
     */
    _playSound(soundPath) {
        if (!soundPath) return;

        try {
            const audio = tt.createInnerAudioContext();
            audio.src = soundPath;
            audio.volume = this.volume;
            audio.play();

            // 自动销毁
            audio.onEnded(() => {
                audio.destroy();
            });

            audio.onError((err) => {
                console.warn(`音效播放失败: ${soundPath}`, err);
                audio.destroy();
            });
        } catch (e) {
            console.warn(`播放音效失败: ${soundPath}`, e);
        }
    }

    /**
     * 得分音效
     */
    playCatch(points = 10) {
        const tier = getPointsTier(points);
        this._playSound(AUDIO_CONFIG.SFX_PATHS.catch(tier));
    }

    /**
     * 解锁音效
     */
    playUnlock() {
        this._playSound(AUDIO_CONFIG.SFX_PATHS.unlock);
    }

    /**
     * 倒计时音效
     */
    playCountdown() {
        this._playSound(AUDIO_CONFIG.SFX_PATHS.countdown);
    }

    /**
     * 游戏开始音效
     */
    playGameStart() {
        this._playSound(AUDIO_CONFIG.SFX_PATHS.gameStart);
    }

    /**
     * 游戏结束音效
     */
    playGameOver() {
        this._playSound(AUDIO_CONFIG.SFX_PATHS.gameOver);
    }

    /**
     * 按钮点击音效
     */
    playButtonClick() {
        this._playSound(AUDIO_CONFIG.SFX_PATHS.buttonClick);
    }

    /**
     * 卡片滑动音效
     */
    playCardScroll() {
        this._playSound(AUDIO_CONFIG.SFX_PATHS.cardScroll);
    }

    /**
     * 模式选择音效
     */
    playModeSelect() {
        this._playSound(AUDIO_CONFIG.SFX_PATHS.modeSelect);
    }

    /**
     * 销毁音效系统
     */
    destroy() {
        this.initialized = false;
    }
}
