import { Vector2 } from './utils/Vector2';
import { CONFIG, TARGET_TYPES, ENDLESS_MODE_CARD, ENDLESS_CONFIG, SELECTION_CONFIG, AUDIO_CONFIG } from './config';
import { ImageTarget } from './entities/ImageTarget';
import { InputManager } from './InputManager';
import { getAudioManager } from './AudioManager';
export class Game {
    constructor(canvas) {
        Object.defineProperty(this, "canvas", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "ctx", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "targets", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "inputManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "score", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "timeLeft", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: CONFIG.GAME_DURATION
        });
        Object.defineProperty(this, "state", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 'start'
        });
        Object.defineProperty(this, "lastTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "spawnTimer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "gameTimer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "catchEffect", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "selectedTarget", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "selectionItems", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "isEndlessMode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "exitButton", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "attributeChangeTimer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "currentMultipliers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {
                speed: 1,
                radius: 1,
                points: 1
            }
        });
        Object.defineProperty(this, "unlockedTargetIndices", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        }); // 已解锁的目标索引
        Object.defineProperty(this, "nextUnlockScore", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 500
        }); // 下次解锁所需分数
        Object.defineProperty(this, "unlockNotification", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        }); // 解锁提示
        // 滚动选择相关属性
        Object.defineProperty(this, "scrollOffset", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        }); // 当前滚动偏移量
        Object.defineProperty(this, "scrollVelocity", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        }); // 滚动速度（惯性）
        Object.defineProperty(this, "isDragging", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        }); // 是否正在拖动
        Object.defineProperty(this, "dragStartX", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        }); // 拖动起始X坐标
        Object.defineProperty(this, "dragStartOffset", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        }); // 拖动起始时的偏移量
        Object.defineProperty(this, "currentIndex", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        }); // 当前选中的角色索引
        Object.defineProperty(this, "autoScrollTimer", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        }); // 自动轮播计时器
        Object.defineProperty(this, "lastTouchX", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        }); // 上次触摸X坐标（计算速度用）
        Object.defineProperty(this, "lastTouchTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        }); // 上次触摸时间
        Object.defineProperty(this, "isSnapping", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        }); // 是否正在吸附动画中
        Object.defineProperty(this, "skipNextTouchEnd", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        }); // 防止点击穿透：状态切换后跳过同一次触摸的 touchEnd 处理
        Object.defineProperty(this, "stateChangeTime", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        }); // 状态切换时间戳，用于防止模拟鼠标事件穿透
        // 音频相关属性
        Object.defineProperty(this, "audioManager", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "audioInitialized", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "muteButton", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: null
        });
        Object.defineProperty(this, "lastCountdownSecond", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: -1
        }); // 上次播放倒计时音效的秒数
        Object.defineProperty(this, "gameLoop", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: (currentTime) => {
                const deltaTime = (currentTime - this.lastTime) / 1000;
                this.lastTime = currentTime;
                this.update(deltaTime);
                this.render();
                requestAnimationFrame(this.gameLoop);
            }
        });
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw new Error('Cannot get 2d context');
        this.ctx = ctx;
        this.resize();
        this.inputManager = new InputManager(canvas);
        this.inputManager.onTouchStart = (pos) => this.handleTouchStart(pos);
        this.inputManager.onTouchMove = (pos) => this.handleTouchMove(pos);
        this.inputManager.onTouchEnd = (pos) => this.handleTouchEnd(pos);
        this.inputManager.onTouch = (pos) => this.handleTouch(pos);
        this.preloadImages();
        // 初始化音频管理器
        this.audioManager = getAudioManager();
        // 初始化静音按钮位置
        this.updateMuteButtonPosition();
    }
    // 初始化音频（需要在用户首次交互时调用）
    initAudio() {
        if (this.audioInitialized) return;
        this.audioManager.init();
        this.audioInitialized = true;
        // 播放菜单 BGM
        this.audioManager.playBGM('menu', { volume: AUDIO_CONFIG.BGM_VOLUME.menu });
    }
    // 更新静音按钮位置
    updateMuteButtonPosition() {
        const config = AUDIO_CONFIG.MUTE_BUTTON;
        this.muteButton = {
            x: this.canvas.width - config.SIZE / 2 - config.PADDING,
            y: config.SIZE / 2 + config.PADDING,
            size: config.SIZE
        };
    }
    preloadImages() {
        // 首先添加无尽模式卡片（不需要加载图片）
        const endlessItem = {
            config: ENDLESS_MODE_CARD,
            image: null,
            loaded: true,  // 无尽模式始终视为已加载
            x: 0,
            y: 0,
            size: 120
        };
        // 然后添加所有目标卡片
        const targetItems = TARGET_TYPES.map((config, _index) => {
            const img = tt.createImage();
            const item = {
                config,
                image: img,
                loaded: false,
                x: 0,
                y: 0,
                size: 120
            };
            img.onload = () => {
                item.loaded = true;
            };
            img.src = config.image;
            return item;
        });
        // 无尽模式卡片作为第一项
        this.selectionItems = [endlessItem, ...targetItems];
    }
    resize() {
        this.canvas.width = tt.getSystemInfoSync().windowWidth;
        this.canvas.height = tt.getSystemInfoSync().windowHeight;
        this.updateSelectionLayout();
        // 更新静音按钮位置
        this.updateMuteButtonPosition();
        // 更新退出按钮位置
        if (this.isEndlessMode) {
            this.exitButton = {
                x: this.canvas.width - ENDLESS_CONFIG.EXIT_BUTTON_SIZE - ENDLESS_CONFIG.EXIT_BUTTON_PADDING,
                y: ENDLESS_CONFIG.EXIT_BUTTON_SIZE + ENDLESS_CONFIG.EXIT_BUTTON_PADDING,
                size: ENDLESS_CONFIG.EXIT_BUTTON_SIZE
            };
        }
    }
    updateSelectionLayout() {
        const centerY = this.canvas.height / 2 + 30;
        const spacing = 160;
        const totalWidth = (this.selectionItems.length - 1) * spacing;
        const startX = (this.canvas.width - totalWidth) / 2;
        this.selectionItems.forEach((item, index) => {
            item.x = startX + index * spacing;
            item.y = centerY;
        });
    }
    handleTouch(pos) {
        // 注意：这个方法主要用于兼容旧代码
        // select 状态由 handleTouchStart/Move/End 处理
        if (this.state === 'start') {
            this.state = 'select';
            this.scrollOffset = 0;
            this.currentIndex = 0;
            this.autoScrollTimer = 0;
        }
        else if (this.state === 'playing') {
            // 检测退出按钮（仅在无尽模式游戏中）
            if (this.isEndlessMode && this.exitButton) {
                const distance = Math.sqrt(Math.pow(pos.x - this.exitButton.x, 2) + Math.pow(pos.y - this.exitButton.y, 2));
                if (distance < this.exitButton.size / 2) {
                    this.state = 'over';
                    this.exitButton = null;
                    return;
                }
            }
            this.tryToCatch(pos);
        }
        else if (this.state === 'over') {
            this.state = 'select';
            this.scrollOffset = 0;
            this.currentIndex = 0;
            this.autoScrollTimer = 0;
        }
    }
    // 触摸开始
    handleTouchStart(pos) {
        // 初始化音频（用户首次交互）
        this.initAudio();
        
        // 检测静音按钮（所有状态下都可用，除了 start）
        if (this.state !== 'start' && this.checkMuteButtonClick(pos)) {
            return;
        }
        if (this.state === 'start') {
            this.state = 'select';
            this.scrollOffset = 0;
            this.currentIndex = 0;
            this.autoScrollTimer = 0;
            this.skipNextTouchEnd = true;
            this.stateChangeTime = Date.now();
            // 调整 BGM 音量
            this.audioManager.playBGM('menu', { volume: AUDIO_CONFIG.BGM_VOLUME.select });
            this.audioManager.playButtonClick();
            return;
        }
        if (this.state === 'select') {
            // 开始拖动
            this.isDragging = true;
            this.dragStartX = pos.x;
            this.dragStartOffset = this.scrollOffset;
            this.lastTouchX = pos.x;
            this.lastTouchTime = performance.now();
            this.scrollVelocity = 0;
            this.isSnapping = false;
            return;
        }
        if (this.state === 'playing') {
            // 检测退出按钮（仅在无尽模式游戏中）
            if (this.isEndlessMode && this.exitButton) {
                const distance = Math.sqrt(Math.pow(pos.x - this.exitButton.x, 2) + Math.pow(pos.y - this.exitButton.y, 2));
                if (distance < this.exitButton.size / 2) {
                    this.state = 'over';
                    this.exitButton = null;
                    // 播放游戏结束音效和 BGM 切换
                    this.audioManager.stopBGM(true);
                    this.audioManager.playGameOver();
                    return;
                }
            }
            this.tryToCatch(pos);
        }
        if (this.state === 'over') {
            this.state = 'select';
            this.scrollOffset = 0;
            this.currentIndex = 0;
            this.autoScrollTimer = 0;
            this.skipNextTouchEnd = true;
            this.stateChangeTime = Date.now();
            // 恢复菜单 BGM
            this.audioManager.playBGM('menu', { volume: AUDIO_CONFIG.BGM_VOLUME.select });
            this.audioManager.playButtonClick();
        }
    }
    // 检测静音按钮点击
    checkMuteButtonClick(pos) {
        if (!this.muteButton || !this.audioManager) return false;
        const distance = Math.sqrt(
            Math.pow(pos.x - this.muteButton.x, 2) +
            Math.pow(pos.y - this.muteButton.y, 2)
        );
        // 增大点击区域
        if (distance < this.muteButton.size / 2 + 15) {
            const wasMuted = this.audioManager.isMuted;
            this.audioManager.toggleMute();
            console.log(wasMuted)
            // 只在取消静音时播放音效
            if (wasMuted) {
                this.audioManager.playButtonClick();
            }
            return true;
        }
        return false;
    }
    // 触摸移动
    handleTouchMove(pos) {
        if (this.state === 'select' && this.isDragging) {
            const deltaX = pos.x - this.dragStartX;
            this.scrollOffset = this.dragStartOffset - deltaX;
            // 计算滚动速度
            const now = performance.now();
            const dt = now - this.lastTouchTime;
            if (dt > 0) {
                this.scrollVelocity = (this.lastTouchX - pos.x) / dt * 16; // 标准化到每帧
            }
            this.lastTouchX = pos.x;
            this.lastTouchTime = now;
            // 边界限制（允许一点弹性）
            const cardStep = SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING;
            const maxOffset = (this.selectionItems.length - 1) * cardStep;
            const elasticRange = 50;
            if (this.scrollOffset < -elasticRange) {
                this.scrollOffset = -elasticRange;
            }
            if (this.scrollOffset > maxOffset + elasticRange) {
                this.scrollOffset = maxOffset + elasticRange;
            }
        }
    }
    // 触摸结束
    handleTouchEnd(pos) {
        if (this.state === 'select') {
            // 防止点击穿透：状态刚切换时跳过处理（300ms 内的所有 touchEnd 都跳过）
            if (this.stateChangeTime && Date.now() - this.stateChangeTime < 300) {
                this.skipNextTouchEnd = false;
                return;
            }
            if (this.isDragging) {
                this.isDragging = false;
                // 判断是点击还是滑动
                const dragDistance = Math.abs(pos.x - this.dragStartX);
                if (dragDistance < SELECTION_CONFIG.DRAG_THRESHOLD) {
                    // 这是一个点击，检查是否点击了中间的卡片
                    this.handleCardClick(pos);
                }
                else {
                    // 这是一个滑动，启动惯性滚动
                    this.isSnapping = true;
                }
                // 重置自动轮播计时器
                this.autoScrollTimer = 0;
            }
        }
    }
    // 处理卡片点击
    handleCardClick(pos) {
        const cardStep = SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING;
        const targetIndex = Math.round(this.scrollOffset / cardStep);
        const clampedIndex = Math.max(0, Math.min(this.selectionItems.length - 1, targetIndex));
        // 计算中间卡片的位置
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2 + 30;
        const cardWidth = SELECTION_CONFIG.CARD_WIDTH;
        const cardHeight = SELECTION_CONFIG.CARD_HEIGHT;
        // 检查点击是否在中间卡片区域内
        if (pos.x >= centerX - cardWidth / 2 - 20 &&
            pos.x <= centerX + cardWidth / 2 + 20 &&
            pos.y >= centerY - cardHeight / 2 - 20 &&
            pos.y <= centerY + cardHeight / 2 + 40) {
            const selectedItem = this.selectionItems[clampedIndex].config;
            // 检查是否是无尽模式
            if (selectedItem.isEndless) {
                this.startEndlessMode();
            }
            else {
                // 计时模式
                this.selectedTarget = selectedItem;
                this.isEndlessMode = false;
                this.startGame();
            }
        }
    }
    // 启动无尽模式
    startEndlessMode() {
        this.isEndlessMode = true;
        const initialIndex = Math.floor(Math.random() * TARGET_TYPES.length);
        this.unlockedTargetIndices = [initialIndex];
        this.selectedTarget = TARGET_TYPES[initialIndex];
        this.nextUnlockScore = ENDLESS_CONFIG.UNLOCK_SCORE_INTERVAL;
        // 播放模式选择音效
        this.audioManager.playModeSelect();
        this.startGame();
    }
    tryToCatch(pos) {
        for (const target of this.targets) {
            if (!target.isActive)
                continue;
            const distance = pos.distanceTo(target.position);
            if (distance < target.radius + 25) {
                target.isActive = false;
                this.score += target.points;
                // 播放得分音效（根据分数调整音调）
                this.audioManager.playCatch(target.points);
                // 检查是否解锁新目标（无尽模式）
                this.checkUnlock();
                this.catchEffect = {
                    x: target.position.x,
                    y: target.position.y,
                    time: 0.4,
                    points: target.points
                };
                return;
            }
        }
    }
    checkUnlock() {
        if (!this.isEndlessMode)
            return;
        if (this.unlockedTargetIndices.length >= TARGET_TYPES.length)
            return;
        if (this.score >= this.nextUnlockScore) {
            // 找到下一个未解锁的目标
            let nextIndex = -1;
            for (let i = 0; i < TARGET_TYPES.length; i++) {
                let unlocked = false;
                for (let j = 0; j < this.unlockedTargetIndices.length; j++) {
                    if (this.unlockedTargetIndices[j] === i) {
                        unlocked = true;
                        break;
                    }
                }
                if (!unlocked) {
                    nextIndex = i;
                    break;
                }
            }
            if (nextIndex !== -1) {
                this.unlockedTargetIndices.push(nextIndex);
                this.unlockNotification = {
                    message: `解锁新目标：${TARGET_TYPES[nextIndex].name}！`,
                    time: ENDLESS_CONFIG.UNLOCK_NOTIFICATION_DURATION / 1000
                };
                this.nextUnlockScore += ENDLESS_CONFIG.UNLOCK_SCORE_INTERVAL;
                // 播放解锁音效
                this.audioManager.playUnlock();
            }
        }
    }
    startGame() {
        this.state = 'playing';
        this.score = 0;
        this.timeLeft = this.isEndlessMode ? Infinity : CONFIG.GAME_DURATION;
        this.targets = [];
        this.spawnTimer = 0;
        this.gameTimer = 0;
        this.attributeChangeTimer = 0;
        this.lastCountdownSecond = -1; // 重置倒计时音效状态
        // 播放游戏开始音效
        this.audioManager.playGameStart();
        // 切换到游戏 BGM
        if (this.isEndlessMode) {
            this.audioManager.playBGM('menu', { volume: AUDIO_CONFIG.BGM_VOLUME.endless });
        } else {
            this.audioManager.playBGM('game', { volume: AUDIO_CONFIG.BGM_VOLUME.game });
        }
        // 初始化退出按钮位置（无尽模式）
        if (this.isEndlessMode) {
            this.exitButton = {
                x: this.canvas.width - ENDLESS_CONFIG.EXIT_BUTTON_SIZE - ENDLESS_CONFIG.EXIT_BUTTON_PADDING,
                y: ENDLESS_CONFIG.EXIT_BUTTON_SIZE + ENDLESS_CONFIG.EXIT_BUTTON_PADDING,
                size: ENDLESS_CONFIG.EXIT_BUTTON_SIZE
            };
        }
        else {
            this.exitButton = null;
        }
        for (let i = 0; i < CONFIG.SPAWN.INITIAL_COUNT; i++) {
            this.spawnTarget();
        }
    }
    // 选择界面更新逻辑
    updateSelection(dt) {
        const cardStep = SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING;
        const maxOffset = (this.selectionItems.length - 1) * cardStep;
        // 如果不在拖动中
        if (!this.isDragging) {
            // 惯性滚动
            if (Math.abs(this.scrollVelocity) > 0.5) {
                this.scrollOffset += this.scrollVelocity;
                this.scrollVelocity *= SELECTION_CONFIG.SCROLL_FRICTION;
            }
            else {
                this.scrollVelocity = 0;
            }
            // 吸附到最近的卡片
            if (this.isSnapping || Math.abs(this.scrollVelocity) < 1) {
                const targetIndex = Math.round(this.scrollOffset / cardStep);
                const clampedIndex = Math.max(0, Math.min(this.selectionItems.length - 1, targetIndex));
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
                // 切换到下一个
                let nextIndex = this.currentIndex + 1;
                if (nextIndex >= this.selectionItems.length) {
                    nextIndex = 0;
                }
                this.currentIndex = nextIndex;
                this.isSnapping = true;
                // 设置目标偏移量（会在下一帧通过吸附动画移动）
                const targetOffset = nextIndex * cardStep;
                // 如果从最后一个到第一个，需要特殊处理
                if (nextIndex === 0 && this.scrollOffset > cardStep) {
                    this.scrollVelocity = -this.scrollOffset / 10;
                }
            }
        }
        else {
            // 正在拖动时重置自动轮播计时器
            this.autoScrollTimer = 0;
        }
    }
    start() {
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
    }
    update(dt) {
        // 选择界面的更新逻辑
        if (this.state === 'select') {
            this.updateSelection(dt);
            return;
        }
        if (this.state !== 'playing')
            return;
        // 无尽模式：属性随机变化
        if (this.isEndlessMode) {
            this.attributeChangeTimer += dt * 1000;
            if (this.attributeChangeTimer >= ENDLESS_CONFIG.ATTRIBUTE_CHANGE_INTERVAL) {
                this.randomizeAttributes();
                this.attributeChangeTimer = 0;
            }
            // 无尽模式也更新游戏计时器用于显示时长
            this.gameTimer += dt * 1000;
        }
        else {
            // 计时模式：倒计时
            this.gameTimer += dt * 1000;
            this.timeLeft = Math.max(0, CONFIG.GAME_DURATION - Math.floor(this.gameTimer / 1000));

            // 最后10秒倒计时音效
            if (this.timeLeft <= AUDIO_CONFIG.COUNTDOWN_WARNING_TIME && this.timeLeft > 0) {
                if (this.lastCountdownSecond !== this.timeLeft) {
                    this.lastCountdownSecond = this.timeLeft;
                    this.audioManager.playCountdown();
                }
            }

            if (this.timeLeft <= 0) {
                this.state = 'over';
                // 播放游戏结束音效
                this.audioManager.stopBGM(true);
                this.audioManager.playGameOver();
                return;
            }
        }
        for (const target of this.targets) {
            target.update(dt, this.canvas.width, this.canvas.height);
        }
        this.targets = this.targets.filter(t => t.isActive);
        this.spawnTimer += dt * 1000;
        if (this.spawnTimer >= CONFIG.SPAWN.INTERVAL && this.targets.length < CONFIG.SPAWN.MAX_TARGETS) {
            this.spawnTarget();
            this.spawnTimer = 0;
        }
        if (this.catchEffect) {
            this.catchEffect.time -= dt;
            if (this.catchEffect.time <= 0) {
                this.catchEffect = null;
            }
        }
        if (this.unlockNotification) {
            this.unlockNotification.time -= dt;
            if (this.unlockNotification.time <= 0) {
                this.unlockNotification = null;
            }
        }
    }
    spawnTarget() {
        if (!this.selectedTarget)
            return;
        const padding = 100;
        const x = padding + Math.random() * (this.canvas.width - padding * 2);
        const y = padding + Math.random() * (this.canvas.height - padding * 2 - 80);
        const position = new Vector2(x, y);
        // 无尽模式：从已解锁的目标中随机选择，应用随机属性
        let targetConfig;
        if (this.isEndlessMode) {
            const randomIndex = this.unlockedTargetIndices[Math.floor(Math.random() * this.unlockedTargetIndices.length)];
            const baseTarget = TARGET_TYPES[randomIndex];
            targetConfig = {
                ...baseTarget,
                speed: baseTarget.speed * this.currentMultipliers.speed,
                radius: baseTarget.radius * this.currentMultipliers.radius,
                points: Math.floor(baseTarget.points * this.currentMultipliers.points)
            };
        }
        else {
            targetConfig = this.selectedTarget;
        }
        this.targets.push(new ImageTarget(position, targetConfig));
    }
    randomizeAttributes() {
        const [minSpeed, maxSpeed] = ENDLESS_CONFIG.SPEED_MULTIPLIER_RANGE;
        const [minRadius, maxRadius] = ENDLESS_CONFIG.RADIUS_MULTIPLIER_RANGE;
        const [minPoints, maxPoints] = ENDLESS_CONFIG.POINTS_MULTIPLIER_RANGE;
        this.currentMultipliers = {
            speed: minSpeed + Math.random() * (maxSpeed - minSpeed),
            radius: minRadius + Math.random() * (maxRadius - minRadius),
            points: minPoints + Math.random() * (maxPoints - minPoints)
        };
    }
    render() {
        this.ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrass();
        switch (this.state) {
            case 'start':
                this.renderStartScreen();
                break;
            case 'select':
                this.renderSelectScreen();
                break;
            case 'playing':
                for (const target of this.targets) {
                    target.render(this.ctx);
                }
                this.renderCatchEffect();
                this.renderUnlockNotification();
                this.renderHUD();
                break;
            case 'over':
                for (const target of this.targets) {
                    target.render(this.ctx);
                }
                this.renderGameOver();
                break;
        }
    }
    drawGrass() {
        const grassHeight = 80;
        this.ctx.fillStyle = CONFIG.COLORS.GRASS;
        this.ctx.fillRect(0, this.canvas.height - grassHeight, this.canvas.width, grassHeight);
    }
    // 绘制圆角矩形路径（兼容不支持 roundRect 的环境）
    drawRoundRect(x, y, width, height, radius) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.arcTo(x + width, y, x + width, y + radius, radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
        ctx.lineTo(x + radius, y + height);
        ctx.arcTo(x, y + height, x, y + height - radius, radius);
        ctx.lineTo(x, y + radius);
        ctx.arcTo(x, y, x + radius, y, radius);
        ctx.closePath();
    }
    renderCatchEffect() {
        if (!this.catchEffect)
            return;
        const alpha = this.catchEffect.time / 0.4;
        const scale = 1 + (1 - alpha) * 0.8;
        const offsetY = (1 - alpha) * 40;
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.font = `${40 * scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🐾', this.catchEffect.x, this.catchEffect.y - offsetY);
        this.ctx.font = `bold ${24 * scale}px Arial`;
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillText(`+${this.catchEffect.points}`, this.catchEffect.x, this.catchEffect.y - offsetY - 40);
        this.ctx.restore();
    }
    renderUnlockNotification() {
        if (!this.unlockNotification)
            return;
        const alpha = Math.min(this.unlockNotification.time / 2, 1);
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        // 金色背景框
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
        this.drawRoundRect(this.canvas.width / 2 - 150, this.canvas.height / 2 - 30, 300, 60, 15);
        this.ctx.fill();
        // 白色文字
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.unlockNotification.message, this.canvas.width / 2, this.canvas.height / 2 + 8);
        this.ctx.restore();
    }
    renderStartScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🐱 小猫追追追', this.canvas.width / 2, this.canvas.height / 2 - 60);
        this.ctx.font = '24px Arial';
        this.ctx.fillText('点击屏幕上移动的目标得分！', this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.font = 'bold 32px Arial';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillText('👆 点击开始', this.canvas.width / 2, this.canvas.height / 2 + 80);
    }
    renderSelectScreen() {
        // 半透明背景
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // 标题
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 36px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('选择的目标', this.canvas.width / 2, this.canvas.height / 2 - 160);
        // 渲染滚动卡片列表
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2 + 30;
        const cardStep = SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING;
        // 按从远到近的顺序渲染（先渲染两侧，再渲染中间）
        const renderOrder = [];
        for (let i = 0; i < this.selectionItems.length; i++) {
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
        // 渲染静音按钮
        this.renderMuteButton();
    }
    // 渲染无尽模式卡片
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
    this.drawRoundRect(x - 10, y - 10, width + 20, height + 60, 15);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 金色发光边框
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 4 * scale;
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ∞ 图标
    ctx.font = `bold ${60 * scale}px Arial`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('∞', center.x, center.y - 10 * scale);

    // 标题文字
    ctx.font = `bold ${20 * scale}px Arial`;
    ctx.fillStyle = '#FFD700';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('无尽模式', center.x, center.y + 50 * scale);

    // 描述文字
    ctx.font = `${14 * scale}px Arial`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('挑战无限关卡', center.x, center.y + 70 * scale);

    ctx.globalAlpha = 1;
}
// 渲染单个卡片
    renderCard(index, centerX, centerY, offset) {
        const item = this.selectionItems[index];
        const cardWidth = SELECTION_CONFIG.CARD_WIDTH;
        const cardHeight = SELECTION_CONFIG.CARD_HEIGHT;
        const cardStep = SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING;
        // 计算缩放和透明度
        const distanceRatio = Math.min(Math.abs(offset) / cardStep, 1);
        const scale = 1 - distanceRatio * (1 - SELECTION_CONFIG.SIDE_SCALE);
        const opacity = 1 - distanceRatio * (1 - SELECTION_CONFIG.SIDE_OPACITY);
        // 卡片位置
        const x = centerX + offset;
        const y = centerY;
        // 如果卡片完全超出屏幕，不渲染
        if (x < -cardWidth || x > this.canvas.width + cardWidth) {
            return;
        }
        // 无尽模式卡片使用特殊渲染
        if (item.config.isEndless) {
            this.renderEndlessCard({ x, y }, scale, opacity);
            return;
        }
        this.ctx.save();
        this.ctx.globalAlpha = opacity;
        // 计算缩放后的尺寸
        const scaledWidth = cardWidth * scale;
        const scaledHeight = cardHeight * scale;
        // 卡片背景
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.drawRoundRect(
            x - scaledWidth / 2 - 10,
            y - scaledHeight / 2 - 10,
            scaledWidth + 20,
            scaledHeight + 60,
            15
        );
        this.ctx.fill();
        // 边框 - 中间卡片用金色，两侧用灰色
        if (distanceRatio < 0.3) {
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 3;
        }
        else {
            this.ctx.strokeStyle = '#CCCCCC';
            this.ctx.lineWidth = 2;
        }
        this.ctx.stroke();
        // 图片
        if (item.loaded) {
            const imgSize = scaledWidth * 0.85;
            this.ctx.drawImage(
                item.image,
                x - imgSize / 2,
                y - scaledHeight / 2 + 10,
                imgSize,
                imgSize
            );
        }
        else {
            this.ctx.fillStyle = '#CCCCCC';
            const imgSize = scaledWidth * 0.85;
            this.ctx.fillRect(x - imgSize / 2, y - scaledHeight / 2 + 10, imgSize, imgSize);
        }
        // 名称
        this.ctx.fillStyle = '#333333';
        this.ctx.font = `bold ${18 * scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(item.config.name, x, y + scaledHeight / 2 + 15);
        // 分数
        this.ctx.fillStyle = '#666666';
        this.ctx.font = `${14 * scale}px Arial`;
        this.ctx.fillText(`${item.config.points}分/个`, x, y + scaledHeight / 2 + 35);
        this.ctx.restore();
    }
    // 渲染指示器小圆点
    renderIndicators(centerY) {
        const dotSize = 8;
        const dotSpacing = 16;
        const totalWidth = (this.selectionItems.length - 1) * dotSpacing;
        const startX = (this.canvas.width - totalWidth) / 2;
        const y = centerY + SELECTION_CONFIG.CARD_HEIGHT / 2 + 80;
        const cardStep = SELECTION_CONFIG.CARD_WIDTH + SELECTION_CONFIG.CARD_SPACING;
        const currentIndex = Math.round(this.scrollOffset / cardStep);
        for (let i = 0; i < this.selectionItems.length; i++) {
            const x = startX + i * dotSpacing;
            const isActive = i === Math.max(0, Math.min(this.selectionItems.length - 1, currentIndex));
            this.ctx.beginPath();
            this.ctx.arc(x, y, isActive ? dotSize / 2 + 2 : dotSize / 2, 0, Math.PI * 2);
            this.ctx.fillStyle = isActive ? '#FFD700' : 'rgba(255, 255, 255, 0.5)';
            this.ctx.fill();
        }
    }
    renderHUD() {
        // 无尽模式和计时模式使用一致的深灰色背景
        if (this.isEndlessMode) {
            this.ctx.fillStyle = 'rgba(51, 51, 51, 0.7)';
        }
        else {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        }
        this.drawRoundRect(10, 10, 150, 95, 10);
        this.ctx.fill();
        // 无尽模式金色边框效果
        if (this.isEndlessMode) {
            this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        if (this.isEndlessMode) {
            // 无尽模式显示
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('♾️ 无尽', 25, 35);
            this.ctx.font = 'bold 20px Arial';
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillText(`${Math.floor(this.gameTimer / 1000)}s`, 25, 58);
        }
        else {
            // 计时模式
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = 'bold 26px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`⏱️ ${this.timeLeft}s`, 25, 45);
        }
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 22px Arial';
        this.ctx.fillText(`⭐ ${this.score}`, 25, 78);
        // 无尽模式退出按钮
        if (this.isEndlessMode && this.exitButton) {
            // 按钮阴影
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.drawRoundRect(this.exitButton.x - this.exitButton.size / 2 + 2, this.exitButton.y - this.exitButton.size / 2 + 2, this.exitButton.size, this.exitButton.size, 12);
            this.ctx.fill();
            // 按钮背景 - 红色渐变
            const btnGradient = this.ctx.createLinearGradient(this.exitButton.x - this.exitButton.size / 2, this.exitButton.y - this.exitButton.size / 2, this.exitButton.x + this.exitButton.size / 2, this.exitButton.y + this.exitButton.size / 2);
            btnGradient.addColorStop(0, 'rgba(255, 82, 82, 0.95)');
            btnGradient.addColorStop(1, 'rgba(220, 38, 38, 0.95)');
            this.ctx.fillStyle = btnGradient;
            this.drawRoundRect(this.exitButton.x - this.exitButton.size / 2, this.exitButton.y - this.exitButton.size / 2, this.exitButton.size, this.exitButton.size, 12);
            this.ctx.fill();
            // 白色边框
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            // X 图标
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(this.exitButton.x - this.exitButton.size / 4, this.exitButton.y - this.exitButton.size / 4);
            this.ctx.lineTo(this.exitButton.x + this.exitButton.size / 4, this.exitButton.y + this.exitButton.size / 4);
            this.ctx.moveTo(this.exitButton.x + this.exitButton.size / 4, this.exitButton.y - this.exitButton.size / 4);
            this.ctx.lineTo(this.exitButton.x - this.exitButton.size / 4, this.exitButton.y + this.exitButton.size / 4);
            this.ctx.stroke();
            this.ctx.lineCap = 'butt';
        }
        // 渲染静音按钮
        this.renderMuteButton();
    }
    // 渲染静音按钮
    renderMuteButton() {
        if (!this.muteButton) return;

        const btn = this.muteButton;
        const isMuted = this.audioManager && this.audioManager.isMuted;

        // 按钮背景
        this.ctx.fillStyle = isMuted ? 'rgba(200, 50, 50, 0.8)' : 'rgba(50, 50, 50, 0.7)';
        this.ctx.beginPath();
        this.ctx.arc(btn.x, btn.y, btn.size / 2, 0, Math.PI * 2);
        this.ctx.fill();

        // 边框
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // 图标
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = `${AUDIO_CONFIG.MUTE_BUTTON.ICON_SIZE}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(isMuted ? '🔇' : '🔊', btn.x, btn.y);
        this.ctx.textBaseline = 'alphabetic';
    }
    renderGameOver() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎉 游戏结束！', this.canvas.width / 2, this.canvas.height / 2 - 80);
        this.ctx.font = 'bold 40px Arial';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillText(`得分: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 - 20);
        if (this.isEndlessMode) {
            this.ctx.font = '24px Arial';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillText(`游戏时长: ${Math.floor(this.gameTimer / 1000)}秒`, this.canvas.width / 2, this.canvas.height / 2 + 25);
        }
        this.ctx.font = 'bold 28px Arial';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('👆 点击选择新目标', this.canvas.width / 2, this.canvas.height / 2 + 80);
        // 重置无尽模式标志
        this.isEndlessMode = false;
        this.unlockedTargetIndices = [];
        this.exitButton = null;
    }
}
