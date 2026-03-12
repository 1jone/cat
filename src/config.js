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
            unlockDuration: 10 * 60 * 60 * 1000
        },
        adTrigger: {
            enabled: false,
            probability: 0,
            cooldown: 0,
            maxPerSession: 0
        },
        // 侧边栏奖励配置 - 免费关卡不参与奖励
        sidebarReward: {
            canBeRewarded: false
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
        // 广告配置 - 需要广告解锁（48小时）
        unlock: {
            type: 'free',
            adRequired: true,
            unlockDuration: 48 * 60 * 60 * 1000  // 48小时
        },
        adTrigger: {
            enabled: true,
            probability: 0.3,
            cooldown: 90,
            maxPerSession: 3
        },
        // 侧边栏奖励配置 - 可作为奖励
        sidebarReward: {
            canBeRewarded: true
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
        // 广告配置 - 需要广告解锁（48小时）
        unlock: {
            type: 'free',
            adRequired: true,
            unlockDuration: 48 * 60 * 60 * 1000  // 48小时
        },
        adTrigger: {
            enabled: true,
            probability: 0.4,
            cooldown: 90,
            maxPerSession: 3
        },
        // 侧边栏奖励配置 - 可作为奖励
        sidebarReward: {
            canBeRewarded: true
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
        // 广告配置 - 需要广告解锁（48小时）
        unlock: {
            type: 'free',
            adRequired: true,
            unlockDuration: 48 * 60 * 60 * 1000  // 48小时
        },
        adTrigger: {
            enabled: true,
            probability: 0.2,
            cooldown: 120,
            maxPerSession: 2
        },
        // 侧边栏奖励配置 - 免费关卡不参与奖励
        sidebarReward: {
            canBeRewarded: false
        }
    },
    // ========== 新增免费目标 ==========
    {
        id: 'sparkle',
        name: '光点',
        image: '/target/sparkle_re.png',
        speed: 60,
        radius: 25,
        points: 8,
        movement: 'hover',
        movementConfig: {
            hoverAmplitude: 20,
            driftSpeed: 15
        },
        background: {
            image: null,
            showGrass: false  // 光点使用特殊背景，不显示草地
        },
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
        },
        sidebarReward: {
            canBeRewarded: false
        },
        // 特殊渲染标记
        renderType: 'particle'
    },
    {
        id: 'butterfly',
        type: 'butterfly',
        name: '蝴蝶',
        image: null,              // 改为 Canvas 渲染
        renderType: 'canvas',
        speed: 90,
        radius: 30,
        points: 12,
        movement: 'butterfly',
        background: {
            image: null,
            showGrass: false
        },
        // 渲染配置
        renderConfig: {
            primaryWingColor: '#FFD700',
            secondaryWingColor: '#FFC125',
            wingFlapSpeed: 15,
            wingFlapAmplitude: 0.4,
            glow: {
                enabled: true,
                color: 'rgba(255, 215, 0, 0.3)',
                blur: 15
            }
        },
        // 运动参数
        butterflyParams: {
            directionChangeProbability: 0.08,
            edgeHuggingProbability: 0.3,
            edgeDistance: 60,
            speedVariation: 0.4
        },
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
        },
        sidebarReward: {
            canBeRewarded: false
        }
    },
    {
        id: 'mouse',
        name: '老鼠',
        type: 'mouse',
        image: null,              // 改为 Canvas 渲染
        renderer: 'mouse',        // 指定渲染器类型
        speed: 150,
        radius: 25,               // 稍微减小碰撞半径
        points: 15,
        movement: 'dash',
        movementConfig: {
            dashSpeed: 250,
            dashDuration: 0.3,
            pauseDuration: 0.6
        },
        background: {
            image: null,
            showGrass: true
        },
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
        },
        sidebarReward: {
            canBeRewarded: false
        },
        // 老鼠特有配置
        mouseConfig: {
            jitterAmplitude: 2.0,      // 抖动幅度
            jitterFrequency: 15,       // 抖动频率
            dashSpeedMultiplier: 1.5,  // 冲刺速度倍数
            tailSwingSpeed: 8,         // 尾巴摆动速度
            tailSwingAmplitude: 0.15   // 尾巴摆动幅度
        }
    },
    // ========== 新增广告目标 (24h) ==========
    {
        id: 'fish',
        name: '小鱼',
        icon: '🐠',
        image: null,              // 改为 Canvas 渲染
        renderer: 'fish',         // 指定渲染器类型
        speed: 120,
        radius: 32,
        points: 12,
        movement: 'zigzag',       // 改为锯齿运动
        movementConfig: {
            amplitude: 50,        // Z字幅度
            frequency: 1.5        // Z字频率
        },
        background: {
            image: null,
            showGrass: false      // 不显示草地，使用水体背景
        },
        unlock: {
            type: 'free',
            adRequired: false,
            unlockDuration: 24 * 60 * 60 * 1000  // 24小时
        },
        adTrigger: {
            enabled: true,
            probability: 0.25,
            cooldown: 120,
            maxPerSession: 2
        },
        sidebarReward: {
            canBeRewarded: true
        },
        // 小鱼特有配置
        fishConfig: {
            shimmerSpeed: 3,      // 闪烁速度
            scaleShimmerSpeed: 2, // 鳞片闪烁速度
            tailFlutterSpeed: 12  // 尾巴抖动速度
        }
    },
    {
        id: 'bird',
        name: '小鸟',
        renderType: 'canvas',              // Canvas渲染
        // image: '/target/bird_re.png',   // 改用Canvas绘制
        speed: 130,
        radius: 30,
        points: 15,
        movement: 'zigzag',
        movementConfig: {
            amplitude: 80,
            frequency: 1.2
        },
        renderConfig: {                    // Canvas渲染配置
            // 颜色方案
            bodyColor: '#9C7B5E',          // 暖棕身体
            bellyColor: '#EAD7C5',         // 米色腹部
            wingColor: '#6B4F3A',          // 深棕翅膀
            beakColor: '#D79B3B',          // 柔橙嘴
            eyeColor: '#111111',           // 黑色眼睛

            // 尺寸比例（相对于radius=30）
            bodyRadius: 0.93,              // 28/30
            headRadius: 0.73,              // 22/30
            wingLength: 1.17               // 35/30
        },
        background: {
            image: null,
            showGrass: true
        },
        unlock: {
            type: 'free',
            adRequired: false,
            unlockDuration: 24 * 60 * 60 * 1000  // 24小时
        },
        adTrigger: {
            enabled: true,
            probability: 0.25,
            cooldown: 120,
            maxPerSession: 2
        },
        sidebarReward: {
            canBeRewarded: true
        }
    },
    {
        id: 'yarn',
        name: '多彩线群',
        renderType: 'multiline',      // 多线渲染类型
        speed: 30,                   // 较慢的游走速度
        radius: 40,                  // 点击判定半径
        points: 15,
        movement: 'free',            // 自由移动模式
        renderConfig: {
            lineCount: 5,             // 线的数量
            segmentCount: 60,         // 每条线的段数（增加到30，线更长）
            segmentLength: 12,        // 每段长度（增加到12）
            baseSpeed: 30,            // 基础速度
            wiggleAmplitude: 15,      // 扭动幅度
            wiggleFrequency: 2,       // 扭动频率
            colors: [                 // 配色方案
                '#FF6B6B', // 红
                '#4ECDC4', // 蓝
                '#95E1D3', // 青
                '#F38181', // 粉
                '#AA96DA'  // 紫
            ]
        },
        background: {
            image: null,
            showGrass: false          // 不显示草地，使用深蓝背景
        },
        unlock: {
            type: 'free',
            adRequired: false,
            unlockDuration: 24 * 60 * 60 * 1000  // 24小时
        },
        adTrigger: {
            enabled: true,
            probability: 0.2,
            cooldown: 120,
            maxPerSession: 2
        },
        sidebarReward: {
            canBeRewarded: true
        }
    },
    // ========== 新增广告目标 (48h) ==========
    {
        id: 'ladybug',
        name: '萤火虫',
        renderType: 'canvas',            // Canvas渲染
        renderer: 'ladybug',             // 指定渲染器类型
        speed: 60,
        radius: 22,
        points: 20,
        movement: 'random',
        renderConfig: {                 // 萤火虫渲染配置
            // 发光颜色
            glowColor: '#B6FF00',        // 黄绿色光晕
            coreColor: '#FFFF66',        // 淡黄色核心
            bodyColor: '#222222',        // 深色身体

            // 发光参数
            glow: {
                innerRadius: 1.2,        // 内发光半径
                outerRadius: 2.0,        // 外发光半径
                opacity: 0.8             // 发光透明度
            },

            // 闪烁参数
            flicker: {
                baseIntensity: 0.6,      // 基础亮度
                sineAmplitude: 0.3,      // 正弦波幅度
                sineFrequency: 6,        // 正弦波频率
                randomAmount: 0.2,       // 随机扰动
                startleMultiplier: 2.5   // 受惊倍率
            },

            // 身体尺寸
            bodyWidth: 0.3,              // 身体宽度
            bodyLength: 0.5,             // 身体长度
            headRadius: 0.15,            // 头部半径

            // 爆炸粒子颜色
            explosionColors: [
                '#B6FF00',               // 黄绿色（主发光色）
                '#FFFF66',               // 淡黄色（核心色）
                '#88DD00',               // 深绿色
                '#CCFF00',               // 黄绿色
                '#99EE44',               // 浅绿色
                '#DDFF55'                // 淡黄绿色
            ]
        },
        background: {
            image: null,
            showGrass: true
        },
        unlock: {
            type: 'free',
            adRequired: false,
            unlockDuration: 48 * 60 * 60 * 1000  // 48小时
        },
        adTrigger: {
            enabled: true,
            probability: 0.3,
            cooldown: 150,
            maxPerSession: 2
        },
        sidebarReward: {
            canBeRewarded: true
        }
    },
    {
        id: 'feather',
        name: '羽毛',
        image: '/target/feather_re.png',
        speed: 70,
        radius: 28,
        points: 22,
        movement: 'pendulum',
        movementConfig: {
            pendulumLength: 120,
            maxAngle: Math.PI / 4,
            angularFreq: 1.5
        },
        background: {
            image: null,
            showGrass: true
        },
        unlock: {
            type: 'free',
            adRequired: false,
            unlockDuration: 48 * 60 * 60 * 1000  // 48小时
        },
        adTrigger: {
            enabled: true,
            probability: 0.3,
            cooldown: 150,
            maxPerSession: 2
        },
        sidebarReward: {
            canBeRewarded: true
        }
    },
    // ========== 新增广告目标 (永久) ==========
    {
        id: 'laser',
        name: '激光点',
        image: '/target/laser_re.png',
        speed: 180,
        radius: 20,  // 最小体积
        points: 25,
        movement: 'random',
        movementConfig: {
            chaseSpeed: 120,
            targetRadius: 80,
            targetSpeed: 1.5
        },
        background: {
            image: null,
            showGrass: false
        },
        unlock: {
            type: 'free',
            adRequired: false,
            unlockDuration: -1  // -1 表示永久解锁
        },
        adTrigger: {
            enabled: true,
            probability: 0.35,
            cooldown: 180,
            maxPerSession: 2
        },
        sidebarReward: {
            canBeRewarded: true
        },
        // 特殊渲染标记
        renderType: 'particle'
    },
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
        },
        // 冲刺停止运动（三阶段）
        sprintStop: {
            slowSpeed: 50,         // 缓慢移动速度
            sprintSpeed: 300,      // 急速冲刺速度
            slowDuration: 2,       // 缓慢移动持续时间（秒）
            sprintDuration: 0.5,   // 冲刺持续时间（秒）
            stopDuration: 1.5      // 停止持续时间（秒）
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
export const STAMINA_CONFIG = {
    MAX_STAMINA: 10,              // 体力上限
    RECOVERY_INTERVAL: 180,       // 恢复间隔（秒）= 3分钟
    AD_REWARD: 1,                 // 广告奖励体力
    SHARE_REWARD: 2,              // 分享奖励体力
    DAILY_AD_LIMIT: 5,            // 每日广告次数限制

    // 分享内容配置
    SHARE: {
        title: '我正在玩猫咪追追追，快来一起玩吧！',  // 分享标题
        imageUrl: 'target/play.png',                                       // 分享图片URL（可选，空字符串使用默认）
        path: 'src/screens/SelectionScreen.js',                         // 分享路径（点击分享卡片进入的页面）
        query: "type=stamina"                                 // 分享参数（可选）
    }
};
export const ENDLESS_CONFIG = {
    EXIT_BUTTON_SIZE: 50,
    EXIT_BUTTON_PADDING: 15,
    ATTRIBUTE_CHANGE_INTERVAL: 5000,
    SPEED_MULTIPLIER_RANGE: [0.7, 1.5],
    RADIUS_MULTIPLIER_RANGE: [0.8, 1.3],
    POINTS_MULTIPLIER_RANGE: [0.8, 1.5]
};
export const SELECTION_CONFIG = {
    CARD_WIDTH: 140,              // 卡片宽度
    CARD_HEIGHT: 200,             // 卡片高度
    CARD_SPACING: 20,             // 卡片间距
    SIDE_SCALE: 0.8,              // 两侧卡片缩放
    SIDE_OPACITY: 0.6,            // 两侧卡片透明度
    AUTO_SCROLL_INTERVAL: 3000,   // 自动轮播间隔(ms)
    SCROLL_FRICTION: 0.88,        // 滚动摩擦系数（降低以更快减速）
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
        height: 570,            // 面板高度（非游戏中）- 增加90px用于新音频控件
        heightInGame: 710,      // 面板高度（游戏中）- 增加90px用于新音频控件
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

// 侧边栏奖励配置
export const SIDEBAR_REWARD_CONFIG = {
    enabled: true,                    // 是否启用侧边栏奖励
    cooldownDays: 15,                 // 奖励冷却时间（天）
    showGuideOnFirstVisit: true,      // 首次是否显示引导

    // UI 配置
    ui: {
        buttonText: '入口有奖',        // 按钮文字
        showRedDot: true,             // 是否显示红点提示
    },

    // 弹窗文案
    text: {
        guideTitle: '入口有奖',
        guideDesc: '添加到侧边栏，下次从侧边栏进入即可获得【随机关卡体验】奖励！',
        guideButton: '立即添加',
        rewardTitle: '恭喜获得',
        rewardButton: '立即体验',
    }
};

// ============ 音频分层配置 ============

/**
 * 音频层配置
 * 扩展 AUDIO_CONFIG 以支持分层音量控制
 */
export const AUDIO_LAYER_CONFIG = {
    // 默认音量
    DEFAULT_VOLUMES: {
        bgm: 0.5,           // 背景音乐
        gameSfx: 0.8,       // 游戏音效
        targetSfx: 0.8      // 目标音效
    },
    // 音效文件路径映射（目标音效）
    TARGET_SFX_PATHS: {
        captain: {
            meow1: 'assets/target/captain/meow1.mp3',
            meow2: 'assets/target/captain/meow2.mp3',
            meow3: 'assets/target/captain/meow3.mp3',
            purr: 'assets/target/captain/purr.mp3'
        },
        bear: {
            growl1: 'assets/target/bear/growl1.mp3',
            growl2: 'assets/target/bear/growl2.mp3',
            purr1: 'assets/target/bear/purr1.mp3',
            roar: 'assets/target/bear/roar.mp3'
        },
        octopus: {
            bubble1: 'assets/target/octopus/bubble1.mp3',
            bubble2: 'assets/target/octopus/bubble2.mp3',
            squirt: 'assets/target/octopus/squirt.mp3'
        },
        mouse: {
            squeak1: 'assets/target/mouse/squeak1.mp3',
            squeak2: 'assets/target/mouse/squeak2.mp3',
            squeak3: 'assets/target/mouse/squeak3.mp3'
        },
        // 其他目标可以使用默认音效或保持静默
        seagull: {
            call1: 'assets/target/seagull/call1.mp3',
            call2: 'assets/target/seagull/call2.mp3'
        },
        bird: {
            chirp1: 'assets/target/bird/chirp1.mp3',
            chirp2: 'assets/target/bird/chirp2.mp3',
            chirp3: 'assets/target/bird/chirp3.mp3'
        },
        fish: {
            splash: 'assets/target/fish/splash.mp3'
        },
        butterfly: {
            flutter: 'assets/target/butterfly/flutter.mp3'
        },
        yarn: {
            rustle: 'assets/target/yarn/rustle.mp3'
        },
        ladybug: {
            tiny: 'assets/target/ladybug/tiny.mp3'
        },
        feather: {
            rustle: 'assets/target/feather/rustle.mp3'
        },
        laser: {
            zap: 'assets/target/laser/zap.mp3'
        },
        // 粒子目标
        sparkle: {
            sparkle: 'assets/target/sparkle/sparkle.mp3'
        }
    }
};

// 更新 AUDIO_CONFIG 以包含新的目标音效路径
AUDIO_CONFIG.TARGET_SFX_PATHS = AUDIO_LAYER_CONFIG.TARGET_SFX_PATHS;

// ============ 行为系统配置 ============

/**
 * 行为系统配置
 * 控制动物行为（装死、叫声等）的触发和表现
 */
export const BEHAVIOR_CONFIG = {
    // 全局开关
    enabled: true,

    // // 装死行为配置
    // playDead: {
    //     enabled: true,
    //     // 支持的目标类型（空数组表示全部支持）
    //     supportedTargets: ['captain', 'bear', 'octopus', 'mouse'],
    //     // 触发概率（每秒）
    //     triggerProbability: 0.08,  // 约12.5秒触发一次 (1/0.08 ≈ 12.5)
    //     // 持续时间范围（秒）
    //     durationRange: [2, 5],
    //     // 冷却时间（秒）
    //     cooldown: 10,
    //     // 视觉效果
    //     visual: {
    //         rotation: Math.PI / 2,  // 倒地旋转角度（90度）
    //         wobbleAmplitude: 0.05,  // 晃动幅度（弧度）
    //         wobbleFrequency: 8,     // 晃动频率（Hz）
    //         expression: 'x_x'       // 装死表情
    //     }
    // },

    // 叫声行为配置
    vocalization: {
        enabled: true,
        // 支持的目标类型（空数组表示全部支持）
        supportedTargets: [],  // 空数组表示所有目标都支持
        // 触发间隔范围（秒）
        intervalRange: [5, 15],
        // 每次叫声的持续时间（秒）
        duration: 1.5,
        // 最小间隔（防止过于频繁）
        minInterval: 3,
        // 音效变体选择
        randomVariant: true  // 是否随机选择音效变体
    },

    // 行为优先级（数字越大优先级越高）
    priorities: {
        startle: 100,     // 受惊机制优先级最高
        playDead: 50,     // 装死中等优先级
        vocalization: 10  // 叫声优先级最低（可以与其他行为同时发生）
    }
};

// ============ 草地系统配置 ============

/**
 * 草地系统配置
 * 控制多层草地渲染、风效和交互
 */
export const GRASS_CONFIG = {
    // 全局开关
    enabled: true,
    animationEnabled: true,
    interactionEnabled: true,

    // 层级配置
    layers: {
        foreground: {
            bladeHeight: [25, 45],
            density: 3,
            opacity: 1.0,
            color: '#4A9E2D'
        },
        midground: {
            bladeHeight: [18, 30],
            density: 5,
            opacity: 0.8,
            color: '#5DB835'
        },
        background: {
            bladeHeight: [12, 22],
            density: 7,
            opacity: 0.6,
            color: '#7CD14A'
        }
    },

    // 风系统配置
    wind: {
        baseAngle: 0,              // 基础风向（弧度，0 = 向右）
        gustDuration: 3000,        // 阵风周期（毫秒）
        gustIntensity: 0.8         // 阵风强度（0-1）
    },

    // 触摸交互配置
    touch: {
        influenceRadius: 60,       // 触摸影响半径（像素）
        decay: 0.95,               // 影响衰减系数
        maxInfluences: 5           // 最大同时影响数量
    },

    // 性能配置
    performance: {
        targetFPS: 60,             // 目标帧率
        lodEnabled: true           // 启用 LOD（细节层次）
    }
};

// ============ 特性开关 ============

/**
 * 特性开关配置
 * 用于控制新功能的启用/禁用
 */
export const FEATURE_FLAGS = {
    // 草地系统
    animatedGrass: true,

    // 行为系统
    behaviorSystem: true,
    playDead: true,
    vocalization: true,

    // 音频分层
    audioLayering: true
};

// ============ 窜出动画配置 ============

/**
 * 窜出动画配置
 * 控制目标从画布边界外窜入、若隐若现的效果
 */
export const POPIN_CONFIG = {
    // 基础配置
    PROBABILITY: 0.5,          // 窜出触发概率 (0-1) - 100%便于测试
    COOLDOWN: 5,              // 窜出冷却时间（秒）- 缩短便于测试
    MIN_POPIN_DURATION: 1,     // 最小窜出持续时间（秒）
    MAX_POPIN_DURATION: 2.5,   // 最大窜出持续时间（秒）

    // 闪烁配置
    FLICKER_DURATION: 3,       // 闪烁持续时间（秒）
    FLICKER_PROBABILITY: 0.6,  // 触发闪烁的概率
    FLICKER_SPEED: 3,          // 闪烁频率
    MIN_OPACITY: 0.3,          // 最小透明度
    MAX_OPACITY: 1,            // 最大透明度

    // 边界配置
    POPIN_MARGIN: 100,         // 窜出起点距离边界的距离

    // 按目标类型的覆盖配置
    OVERRIDE: {
        'captain': {
            probability: 0.1,        // 船长不常窜出
            flickerProbability: 0.2
        },
        'butterfly': {
            probability: 0.8,        // 蝴蝶经常窜出
            flickerProbability: 0.9,
            isAlwaysFlickering: true // 总是闪烁
        },
        'mouse': {
            probability: 0.5,        // 老鼠中等频率
            flickerProbability: 0.4
        }
    }
};
