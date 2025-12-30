// 无尽模式卡片配置（作为列表第一项）
export const ENDLESS_MODE_CARD = {
    id: 'endless',
    name: '无尽模式',
    image: null,
    isEndless: true,
    points: 0,
    description: '挑战无限关卡'
};

export const TARGET_TYPES = [
    {
        id: 'captain',
        name: '船长',
        image: '/target/captain_re.png',
        speed: 100,
        radius: 40,
        points: 15,
        movement: 'bounce'
    },
    {
        id: 'octopus',
        name: '章鱼',
        image: '/target/octopus_re.png',
        speed: 70,
        radius: 45,
        points: 20,
        movement: 'wave'
    },
    {
        id: 'bear',
        name: '小熊',
        image: '/target/bear_re.png',
        speed: 50,
        radius: 35,
        points: 25,
        movement: 'random'
    },
    {
        id: 'seagull',
        name: '海鸥',
        image: '/target/seagull_re.png',
        speed: 200,
        radius: 30,
        points: 10,
        movement: 'random'
    }
];
export const CONFIG = {
    GAME_DURATION: 60,
    CAT: {
        SPEED: 200,
        RADIUS: 35,
        COLOR: '#FF9933'
    },
    YARN_BALL: {
        SPEED: 80,
        RADIUS: 20,
        POINTS: 10,
        COLOR: '#FF6B6B'
    },
    BUTTERFLY: {
        SPEED: 60,
        RADIUS: 25,
        POINTS: 20,
        AMPLITUDE: 50,
        FREQUENCY: 2,
        COLOR: '#9B59B6'
    },
    SPAWN: {
        INTERVAL: 1500,
        MAX_TARGETS: 6,
        INITIAL_COUNT: 3
    },
    COLORS: {
        BACKGROUND: '#87CEEB',
        GRASS: '#90EE90',
        TEXT: '#333333',
        SCORE: '#FFD700'
    }
};
export const ENDLESS_CONFIG = {
    EXIT_BUTTON_SIZE: 50,
    EXIT_BUTTON_PADDING: 15,
    ATTRIBUTE_CHANGE_INTERVAL: 5000,
    SPEED_MULTIPLIER_RANGE: [0.7, 1.5],
    RADIUS_MULTIPLIER_RANGE: [0.8, 1.3],
    POINTS_MULTIPLIER_RANGE: [0.8, 1.5],
    UNLOCK_SCORE_INTERVAL: 500, // 每500分解锁一个新目标
    UNLOCK_NOTIFICATION_DURATION: 2000 // 解锁提示显示时长(ms)
};
export const SELECTION_CONFIG = {
    CARD_WIDTH: 140,              // 卡片宽度
    CARD_HEIGHT: 200,             // 卡片高度
    CARD_SPACING: 20,             // 卡片间距
    SIDE_SCALE: 0.8,              // 两侧卡片缩放
    SIDE_OPACITY: 0.6,            // 两侧卡片透明度
    AUTO_SCROLL_INTERVAL: 3000,   // 自动轮播间隔(ms)
    SCROLL_FRICTION: 0.92,        // 滚动摩擦系数
    SNAP_SPEED: 0.15,             // 吸附动画速度
    DRAG_THRESHOLD: 10,           // 判定为拖动的最小距离
};

// 音频配置
export const AUDIO_CONFIG = {
    // BGM 音量配置（不同场景）
    BGM_VOLUME: {
        menu: 0.3,      // 菜单/开始界面
        select: 0.4,    // 选择界面
        game: 0.5,      // 计时模式游戏中
        endless: 0.4    // 无尽模式游戏中
    },
    // 音效音量
    SFX_VOLUME: 0.8,
    // 淡入淡出时长 (ms)
    FADE_DURATION: 500,
    // 倒计时警告开始时间（秒）
    COUNTDOWN_WARNING_TIME: 10,
    // 静音按钮配置
    MUTE_BUTTON: {
        SIZE: 40,           // 按钮大小
        PADDING: 15,        // 边距
        ICON_SIZE: 24       // 图标大小
    }
};
