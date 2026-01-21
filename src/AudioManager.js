/**
 * AudioManager - 游戏音频管理器
 * 管理 BGM 播放和音效触发
 * 音频分层架构:
 * - BGM: 背景音乐
 * - GAME_SFX: 游戏音效（得分、倒计时等）
 * - TARGET_SFX: 目标音效（动物叫声）
 */
import { SoundGenerator } from './SoundGenerator';
import { AUDIO_CONFIG } from './config';

// 音频层枚举
export const AudioLayer = {
    BGM: 'bgm',
    GAME_SFX: 'game_sfx',
    TARGET_SFX: 'target_sfx'
};

export class AudioManager {
    constructor() {
        this.bgm = null;                    // 当前 BGM 实例
        this.currentBGMName = null;         // 当前 BGM 名称
        this.soundGenerator = null;         // 音效生成器
        this.isMuted = false;               // 静音状态

        // 音频分层音量
        this.bgmVolume = 0.5;               // BGM 音量
        this.gameSfxVolume = 0.8;           // 游戏音效音量（原名 sfxVolume）
        this.targetSfxVolume = 0.8;         // 目标音效音量（新增）
        this.targetSfxEnabled = true;       // 目标音效总开关（新增）

        // 向后兼容：保留 sfxVolume 作为 gameSfxVolume 的别名
        Object.defineProperty(this, 'sfxVolume', {
            get() { return this.gameSfxVolume; },
            set(value) { this.gameSfxVolume = value; }
        });

        this.initialized = false;           // 是否已初始化
        this.fadeInterval = null;           // 淡入淡出定时器

        // 目标音效缓存（避免重复创建音频实例）
        this.targetSfxCache = new Map();
    }

    /**
     * 初始化音频系统（需要在用户交互后调用）
     */
    init() {
        if (this.initialized) return;

        // 初始化音效生成器
        this.soundGenerator = new SoundGenerator();
        this.soundGenerator.init();

        this.initialized = true;
        console.log('AudioManager 初始化完成');
    }

    /**
     * 获取 BGM 文件路径
     */
    getBGMPath(name) {
        const paths = {
            'menu': 'music/summer_breeze_cruise-52322afd-e3d0-4d6d-aa63-57e653a2337c.mp3',
            'game': 'music/summer_breeze_cruise-817a5819-90e8-48ad-a24e-8c7268c6c4f4.mp3'
        };
        return paths[name] || paths['menu'];
    }

    /**
     * 播放 BGM
     * @param {string} name - BGM 名称 ('menu' 或 'game')
     * @param {object} options - 播放选项
     */
    playBGM(name, options = {}) {
        if (this.isMuted) return;

        const {
            volume = AUDIO_CONFIG.BGM_VOLUME[name] || 0.5,
            loop = true,
            fadeIn = true
        } = options;

        // 如果是同一首 BGM，只调整音量
        if (this.currentBGMName === name && this.bgm) {
            this.fadeBGM(volume, 500);
            return;
        }

        // 停止当前 BGM
        if (this.bgm) {
            this.stopBGM(false);
        }

        try {
            // 创建新的音频实例
            this.bgm = tt.createInnerAudioContext();
            this.bgm.src = this.getBGMPath(name);
            this.bgm.loop = loop;
            this.bgm.volume = fadeIn ? 0 : volume;
            this.currentBGMName = name;
            this.bgmVolume = volume;

            this.bgm.onCanplay(() => {
                if (this.bgm && !this.isMuted) {
                    this.bgm.play();
                    if (fadeIn) {
                        this.fadeBGM(volume, 1000);
                    }
                }
            });

            this.bgm.onError((err) => {
                console.warn('BGM 播放错误:', err);
            });

        } catch (e) {
            console.warn('创建 BGM 失败:', e);
        }
    }

    /**
     * 停止 BGM
     * @param {boolean} fadeOut - 是否淡出
     */
    stopBGM(fadeOut = true) {
        if (!this.bgm) return;

        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }

        if (fadeOut) {
            this.fadeBGM(0, 500, () => {
                this._destroyBGM();
            });
        } else {
            this._destroyBGM();
        }
    }

    /**
     * 销毁 BGM 实例
     */
    _destroyBGM() {
        if (this.bgm) {
            try {
                this.bgm.stop();
                this.bgm.destroy();
            } catch (e) {
                // 忽略销毁错误
            }
            this.bgm = null;
            this.currentBGMName = null;
        }
    }

    /**
     * 暂停 BGM
     */
    pauseBGM() {
        if (this.bgm) {
            try {
                this.bgm.pause();
            } catch (e) {
                // 忽略错误
            }
        }
    }

    /**
     * 恢复 BGM
     */
    resumeBGM() {
        if (this.bgm && !this.isMuted) {
            try {
                this.bgm.play();
            } catch (e) {
                // 忽略错误
            }
        }
    }

    /**
     * BGM 音量渐变
     * @param {number} targetVolume - 目标音量 (0-1)
     * @param {number} duration - 渐变时长 (ms)
     * @param {function} callback - 完成回调
     */
    fadeBGM(targetVolume, duration = 500, callback = null) {
        if (!this.bgm) {
            if (callback) callback();
            return;
        }

        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
        }

        const startVolume = this.bgm.volume;
        const volumeDiff = targetVolume - startVolume;
        const steps = 20;
        const stepDuration = duration / steps;
        const volumeStep = volumeDiff / steps;
        let currentStep = 0;

        this.fadeInterval = setInterval(() => {
            currentStep++;
            if (currentStep >= steps) {
                clearInterval(this.fadeInterval);
                this.fadeInterval = null;
                if (this.bgm) {
                    this.bgm.volume = targetVolume;
                }
                if (callback) callback();
            } else if (this.bgm) {
                this.bgm.volume = startVolume + volumeStep * currentStep;
            }
        }, stepDuration);
    }

    /**
     * 设置 BGM 音量
     */
    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.bgm && !this.isMuted) {
            this.bgm.volume = this.bgmVolume;
        }
    }

    /**
     * 设置音效音量（游戏音效，向后兼容）
     */
    setSFXVolume(volume) {
        this.setGameSFXVolume(volume);
    }

    /**
     * 设置游戏音效音量（GAME_SFX 层）
     */
    setGameSFXVolume(volume) {
        this.gameSfxVolume = Math.max(0, Math.min(1, volume));
        if (this.soundGenerator) {
            this.soundGenerator.setVolume(this.gameSfxVolume);
        }
    }

    /**
     * 设置目标音效音量（TARGET_SFX 层）
     */
    setTargetSFXVolume(volume) {
        this.targetSfxVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * 设置目标音效开关
     */
    setTargetSFXEnabled(enabled) {
        this.targetSfxEnabled = enabled;
    }

    /**
     * 获取目标音效开关状态
     */
    isTargetSFXEnabled() {
        return this.targetSfxEnabled;
    }

    /**
     * 静音
     */
    mute() {
        this.isMuted = true;
        if (this.bgm) {
            this.bgm.volume = 0;
        }
        if (this.soundGenerator) {
            this.soundGenerator.mute();
        }
        // 停止所有播放中的目标音效
        this.targetSfxCache.forEach(audio => {
            try { audio.stop(); } catch (e) {}
        });
    }

    /**
     * 取消静音
     */
    unmute() {
        this.isMuted = false;
        if (this.bgm) {
            this.bgm.volume = this.bgmVolume;
        }
        if (this.soundGenerator) {
            this.soundGenerator.unmute(this.gameSfxVolume);
        }
    }

    /**
     * 切换静音状态
     */
    toggleMute() {
        if (this.isMuted) {
            this.unmute();
        } else {
            this.mute();
        }
        return this.isMuted;
    }

    // ============ 音效播放方法 ============

    /**
     * 播放得分音效
     * @param {number} points - 得分（影响音调）
     */
    playCatch(points = 10) {
        if (this.isMuted || !this.soundGenerator) return;
        this.soundGenerator.playCatch(points);
    }

    /**
     * 播放解锁音效
     */
    playUnlock() {
        if (this.isMuted || !this.soundGenerator) return;
        this.soundGenerator.playUnlock();
    }

    /**
     * 播放倒计时音效
     */
    playCountdown() {
        if (this.isMuted || !this.soundGenerator) return;
        this.soundGenerator.playCountdown();
    }

    /**
     * 播放游戏开始音效
     */
    playGameStart() {
        if (this.isMuted || !this.soundGenerator) return;
        this.soundGenerator.playGameStart();
    }

    /**
     * 播放游戏结束音效
     */
    playGameOver() {
        if (this.isMuted || !this.soundGenerator) return;
        this.soundGenerator.playGameOver();
    }

    /**
     * 播放按钮点击音效
     */
    playButtonClick() {
        if (this.isMuted || !this.soundGenerator) return;
        this.soundGenerator.playButtonClick();
    }

    /**
     * 播放卡片滑动音效
     */
    playCardScroll() {
        if (this.isMuted || !this.soundGenerator) return;
        this.soundGenerator.playCardScroll();
    }

    /**
     * 播放模式选择音效
     */
    playModeSelect() {
        if (this.isMuted || !this.soundGenerator) return;
        this.soundGenerator.playModeSelect();
    }

    // ============ 目标音效方法（TARGET_SFX 层）============

    /**
     * 获取目标音效文件路径
     * @param {string} targetId - 目标类型 ID（如 'captain', 'bear', 'octopus'）
     * @param {string} soundId - 音效 ID（如 'meow1', 'meow2', 'growl1'）
     * @returns {string} 音效文件路径
     */
    getTargetSFXPath(targetId, soundId) {
        // 从配置中获取音效路径映射（将在 config.js 中定义）
        if (AUDIO_CONFIG.TARGET_SFX_PATHS && AUDIO_CONFIG.TARGET_SFX_PATHS[targetId]) {
            const sounds = AUDIO_CONFIG.TARGET_SFX_PATHS[targetId];
            return sounds[soundId] || sounds[Object.keys(sounds)[0]];
        }
        // 默认路径
        return `assets/target/${targetId}/${soundId}.mp3`;
    }

    /**
     * 播放目标音效（动物叫声等）
     * @param {string} soundId - 音效 ID
     * @param {string} targetId - 目标类型 ID
     */
    playTargetSFX(soundId, targetId) {
        // 检查是否启用和静音
        if (!this.targetSfxEnabled || this.isMuted) return;

        const soundPath = this.getTargetSFXPath(targetId, soundId);

        try {
            // 创建新的音频实例
            const audio = tt.createInnerAudioContext();
            audio.src = soundPath;
            audio.volume = this.targetSfxVolume;

            // 播放完成后清理缓存
            audio.onEnded(() => {
                this.targetSfxCache.delete(soundPath);
                try { audio.destroy(); } catch (e) {}
            });

            audio.onError((err) => {
                console.warn('目标音效播放错误:', soundPath, err);
                this.targetSfxCache.delete(soundPath);
                try { audio.destroy(); } catch (e) {}
            });

            audio.play();
            this.targetSfxCache.set(soundPath, audio);

        } catch (e) {
            console.warn('创建目标音效失败:', soundPath, e);
        }
    }

    /**
     * 销毁音频管理器
     */
    destroy() {
        this.stopBGM(false);
        if (this.soundGenerator) {
            this.soundGenerator.destroy();
            this.soundGenerator = null;
        }
        // 清理目标音效缓存
        this.targetSfxCache.forEach(audio => {
            try {
                audio.stop();
                audio.destroy();
            } catch (e) {}
        });
        this.targetSfxCache.clear();
        this.initialized = false;
    }
}

// 创建单例
let audioManagerInstance = null;

export function getAudioManager() {
    if (!audioManagerInstance) {
        audioManagerInstance = new AudioManager();
    }
    return audioManagerInstance;
}
