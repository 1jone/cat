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
        movement: 'bounce',
        background: {
            image: '/backgrounds/captain_bg.jpg',
            showGrass: false
        },
        // 广告配置 - 免费目标
        unlock: {
            type: 'free',
            adRequired: false,
            unlockDuration: 0
        },
        adTrigger: {
            enabled: false,
            probability: 0,
            cooldown: 0,
            maxPerSession: 0
        }
    },
    {
        id: 'octopus',
        name: '章鱼',
        image: '/target/octopus_re.png',
        speed: 70,
        radius: 45,
        points: 20,
        movement: 'wave',
        background: {
            image: '/backgrounds/octopus_bg.jpg',
            showGrass: false
        },
        // 广告配置 - 需要广告解锁（24小时）
        unlock: {
            type: 'ad',
            adRequired: true,
            unlockDuration: 24 * 60 * 60 * 1000  // 24小时
        },
        adTrigger: {
            enabled: true,
            probability: 0.3,
            cooldown: 90,
            maxPerSession: 3
        }
    },
    {
        id: 'bear',
        name: '小熊',
        image: '/target/bear_re.png',
        speed: 50,
        radius: 35,
        points: 25,
        movement: 'random',
        background: {
            image: '/backgrounds/bear_bg.jpg',
            showGrass: false
        },
        // 广告配置 - 需要广告解锁（24小时）
        unlock: {
            type: 'ad',
            adRequired: true,
            unlockDuration: 24 * 60 * 60 * 1000  // 24小时
        },
        adTrigger: {
            enabled: true,
            probability: 0.4,
            cooldown: 90,
            maxPerSession: 3
        }
    },
    {
        id: 'seagull',
        name: '海鸥',
        image: '/target/seagull_re.png',
        speed: 200,
        radius: 30,
        points: 10,
        movement: 'random',
        background: {
            image: '/backgrounds/seagull_bg.jpg',
            showGrass: false
        },
        // 广告配置 - 免费但有概率广告
        unlock: {
            type: 'free',
            adRequired: false,
            unlockDuration: 0
        },
        adTrigger: {
            enabled: true,
            probability: 0.2,
            cooldown: 120,
            maxPerSession: 2
        }
    }
];
export const CONFIG = {
    GAME_DURATION: 60,
    // 运动轨迹参数配置
    MOVEMENT_PARAMS: {
        // 圆周运动
        circular: {
            orbitRadius: 80,       // 轨道半径
            angularSpeed: 2        // 角速度 (rad/s)
        },
        // 螺旋运动
        spiral: {
            baseRadius: 40,        // 起始半径
            maxRadius: 120,        // 最大半径
            spiralRate: 20,        // 扩展速率 (px/s)
            angularSpeed: 1.5      // 角速度
        },
        // 锯齿运动
        zigzag: {
            amplitude: 60,         // 振幅
            frequency: 1           // 频率 (Hz)
        },
        // 8字形运动
        figure8: {
            amplitudeX: 100,       // 水平振幅
            amplitudeY: 80,        // 垂直振幅
            angularSpeed: 1.5      // 角速度
        },
        // 冲刺运动
        dash: {
            dashSpeed: 200,        // 冲刺速度
            dashDuration: 0.4,     // 冲刺时长 (s)
            pauseDuration: 0.8     // 停顿时长 (s)
        },
        // 悬停运动
        hover: {
            hoverAmplitude: 30,    // 飘动幅度
            driftSpeed: 20         // 漂移速度
        },
        // 钟摆运动
        pendulum: {
            pendulumLength: 150,   // 摆长
            maxAngle: Math.PI / 3, // 最大摆角 (60度)
            angularFreq: 2         // 角频率
        },
        // 追逐运动
        chase: {
            chaseSpeed: 80,        // 追逐速度
            targetRadius: 100,     // 目标点运动半径
            targetSpeed: 1         // 目标点运动速度
        }
    },
    SPAWN: {
        INTERVAL: 1500,           // 默认生成间隔（毫秒）
        INTERVAL_MIN: 500,        // 最小生成间隔
        INTERVAL_MAX: 3000,       // 最大生成间隔
        MAX_TARGETS: 6,           // 默认最大实体数
        MAX_TARGETS_MIN: 3,       // 最小实体数
        MAX_TARGETS_MAX: 15,      // 最大实体数
        SPEED_MULTIPLIER: 1,      // 默认速度乘数
        SPEED_MULTIPLIER_MIN: 0.5,// 最小速度乘数
        SPEED_MULTIPLIER_MAX: 2,  // 最大速度乘数
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
    },
    // 音效文件路径
    SFX_PATHS: {
        catch: (points) => {
            const tier = getPointsTier(points);
            return `assets/sfx/catch_${tier}.mp3`;
        },
        unlock: 'assets/sfx/unlock.mp3',
        countdown: 'assets/sfx/countdown.mp3',
        gameStart: 'assets/sfx/game_start.mp3',
        gameOver: 'assets/sfx/game_over.mp3',
        buttonClick: 'assets/sfx/button_click.mp3',
        cardScroll: 'assets/sfx/card_scroll.mp3',
        modeSelect: 'assets/sfx/mode_select.mp3'
    }
};

/**
 * 根据分数获取音调档位
 * 用于参数化得分音效的降级方案
 */
export function getPointsTier(points) {
    if (points <= 10) return 10;
    if (points <= 15) return 15;
    if (points <= 20) return 20;
    if (points <= 25) return 25;
    return 30;
}

// 设置页面配置
export const SETTINGS_CONFIG = {
    // 面板配置
    PANEL: {
        widthRatio: 0.85,       // 相对于 canvas 宽度的比例
        maxWidth: 340,          // 最大宽度
        height: 480,            // 面板高度（非游戏中）
        heightInGame: 620,      // 面板高度（游戏中，多3个滑块）
        padding: 24,            // 内边距
        borderRadius: 20        // 圆角半径
    },
    // 滑块配置
    SLIDER: {
        width: 140,             // 滑块轨道宽度
        height: 6,              // 滑块轨道高度
        thumbRadius: 11         // 把手半径
    },
    // 开关配置
    TOGGLE: {
        width: 52,              // 开关宽度
        height: 30              // 开关高度
    },
    // 按钮配置
    BUTTON: {
        height: 44,             // 按钮高度
        borderRadius: 22        // 按钮圆角（药丸形状）
    },
    // 间距配置
    SPACING: {
        row: 18,                // 行间距
        group: 25               // 分组间距
    },
    // 颜色配置（毛玻璃风格 - 实化版）
    COLORS: {
        // 遮罩和面板
        overlay: 'rgba(0, 0, 0, 0.6)',           // 全屏遮罩（加深）
        panelBg: 'rgba(40, 40, 50, 0.92)',       // 面板背景（深色实化）
        panelBorder: 'rgba(255, 255, 255, 0.4)', // 面板边框
        innerBg: 'rgba(255, 255, 255, 0.08)',    // 内容区背景
        // 文字
        title: '#FFFFFF',                         // 标题颜色
        text: 'rgba(255, 255, 255, 0.9)',        // 普通文字（更清晰）
        accent: '#FFD700',                        // 强调色（金色）
        // 滑块
        sliderTrack: 'rgba(255, 255, 255, 0.25)', // 滑块轨道
        sliderFill: '#FFD700',                    // 滑块填充
        sliderThumb: '#FFFFFF',                   // 滑块把手
        // 开关
        toggleOn: '#FFD700',                      // 开关开启
        toggleOff: 'rgba(255, 255, 255, 0.25)',  // 开关关闭
        toggleThumb: '#FFFFFF',                   // 开关滑块
        // 按钮
        buttonBg: 'rgba(255, 255, 255, 0.15)',   // 按钮背景
        buttonHover: 'rgba(255, 255, 255, 0.25)' // 按钮悬停
    },
    // 设置按钮配置
    SETTINGS_BUTTON: {
        SIZE: 40,               // 按钮大小
        PADDING: 15,            // 边距
        ICON: '⚙️'              // 图标
    },
    // 退出按钮配置（在设置面板内）
    EXIT_BUTTON: {
        height: 44,             // 按钮高度
        marginTop: 15,          // 与返回按钮的间距
        bgColor: 'rgba(220, 53, 69, 0.9)',      // 红色背景
        borderColor: 'rgba(255, 100, 100, 0.6)' // 边框颜色
    }
};

// 广告配置
export const AD_CONFIG = {
    // 全局控制
    globalEnabled: true,
    minIntervalSeconds: 60,        // 两次广告最小间隔（秒）
    maxAdsPerSession: 5,           // 单次会话最大广告数

    // 解锁配置
    unlock: {
        duration: 24 * 60 * 60 * 1000  // 24小时有效期（毫秒）
    },

    // 概率调节因子
    factors: {
        newUser: 0.5,                // 新用户降低概率（前5局）
        consecutivePlays: 0.1        // 连续游戏每局增加概率
    },

    // 冷却规则
    cooldown: {
        afterWatch: 120,             // 观看广告后冷却秒数
        afterSkip: 60                // 跳过广告后冷却秒数
    },

    // 无尽模式广告
    endless: {
        entryProbability: 0,       // 进入时广告概率
        unlockProbability: 0.5,      // 解锁目标时广告概率
        gameOverProbability: 0.3,    // 游戏结束时广告概率
        gameOverMinScore: 500        // 触发结束广告的最低分数
    },

    // 广告位ID（需要替换为实际ID）
    adUnitIds: {
        rewarded: 'YOUR_REWARDED_AD_UNIT_ID',
        interstitial: 'YOUR_INTERSTITIAL_AD_UNIT_ID'
    }
};

// 受惊机制配置
export const STARTLE_CONFIG = {
    TRIGGER_RADIUS: 150,       // 触发距离（像素）
    SPEED_MULTIPLIER: 2.5,     // 速度峰值倍增
    DURATION: 0.8,             // 受惊持续时间（秒）
    COOLDOWN: 2.0,             // 冷却时间（秒）
    FLEE_ANGLE_VARIANCE: 30,   // 逃离角度随机偏差（度）

    // 视觉效果参数
    SHAKE_INTENSITY: 6,        // 抖动强度（像素，会随时间衰减）
    SHAKE_FREQUENCY: 25,       // 抖动频率（Hz）
    EXCLAMATION_DURATION: 0.4, // 惊叹号显示时长（秒）
    EXCLAMATION_OFFSET_Y: -50  // 惊叹号Y偏移（在目标上方）
};

