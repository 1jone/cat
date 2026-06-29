# Cat Game - Project Context

## Project Overview
抖音小游戏 - 猫咪点击游戏，使用原生 JavaScript (ES6+) 和抖音小游戏 API (tt.*)

**技术栈**: Canvas + 原生 JS
**架构模式**: 分层管理器模式 + 组件化结构

## Architecture

### 核心架构

```
User Input → InputManager → Game (Orchestrator)
                              ├─ GameStateManager (状态管理)
                              ├─ SpawnManager (实体生成)
                              ├─ ResourceManager (资源加载)
                              ├─ AudioManager (音频管理)
                              ├─ AdManager (广告管理)
                              ├─ SettingsManager (设置持久化)
                              ├─ Renderers (Background/HUD/Effects)
                              └─ Screens (Start/Selection/GameOver)
```

### Directory Structure

```
src/
├── Game.js                 # 中央协调器 (819行)
├── config.js               # 全局配置 (690行)
├── InputManager.js         # 输入管理
├── AudioManager.js         # 音频管理 (单例)
├── SettingsManager.js      # 设置持久化 (单例)
├── entities/
│   ├── Entity.js           # 基础实体
│   ├── ImageTarget.js      # 目标实体 (925行, 12种运动模式)
│   └── ParticleTarget.js   # 粒子目标
├── managers/
│   ├── GameStateManager.js # 游戏状态管理
│   ├── SpawnManager.js     # 生成管理
│   ├── ResourceManager.js  # 资源管理
│   ├── AdManager.js        # 广告管理
│   ├── EmojiManager.js     # Emoji管理
│   └── SidebarManager.js   # 侧边栏奖励
├── renderers/
│   ├── BackgroundRenderer.js
│   ├── HUDRenderer.js
│   └── EffectsRenderer.js
├── screens/
│   ├── StartScreen.js
│   ├── SelectionScreen.js  # 卡片轮播选择
│   └── GameOverScreen.js
└── utils/
    ├── Vector2.js          # 2D向量类
    └── CanvasUtils.js      # 画布工具
```

### Key Files
- `src/Game.js` - 主游戏循环和状态管理，协调所有模块
- `src/entities/ImageTarget.js` - 目标实体，包含运动模式和受惊机制
- `src/config.js` - 游戏配置和运动参数
- `src/managers/GameStateManager.js` - 状态机和解锁系统

### Game States

```javascript
GameState = {
  START: 'start',       // 开始界面
  SELECT: 'select',     // 目标选择
  PLAYING: 'playing',   // 游戏进行中
  OVER: 'over',         // 游戏结束
  SETTINGS: 'settings'  // 设置面板（可叠加）
}
```

## Movement System

目标实体支持多种运动模式，分为两类：

**速度累积模式**（使用 `position += velocity * dt`）:
- `bounce` - 弹跳
- `random` - 随机方向变化
- `dash` - 冲刺停顿
- `chase` - 追逐虚拟目标

**参数化模式**（使用 `position = 基准点 + 动态偏移`）:
- `wave` - 波浪运动，使用 `baseY`
- `hover` - 悬停飘动，使用 `baseX/baseY`
- `pendulum` - 钟摆运动，使用 `pivotX/pivotY`
- `circular` - 圆周运动，使用 `orbitCenterX/Y`
- `spiral` - 螺旋运动，使用 `spiralCenterX/Y`
- `zigzag` - 锯齿运动，使用 `baseY`
- `figure8` - 8字形运动，使用 `figure8CenterX/Y`

## Startle System (受惊机制)

当触摸位置在目标 150px 范围内时触发受惊：
1. 保存当前速度 `preStartleVelocity`
2. 计算逃离方向 `fleeDirection`
3. 高速弹跳运动（跳过正常运动更新）
4. 受惊结束时恢复速度并同步基准点

**重要**: 受惊结束时必须调用 `syncMovementBasePoint()` 同步参数化运动的基准点，否则位置会"漂移回位"。

## Endless Mode (无尽模式)

### 核心机制
- 每 500 分解锁一个新目标
- 每 5 秒随机改变 speed/radius/points 乘数
- 配置项 `ENDLESS_CONFIG.USE_ALL_TARGETS` 控制目标池：
  - `true`: 使用所有目标
  - `false`: 只使用选择界面已解锁的目标

### 关键代码
```javascript
// GameStateManager.js
getAvailableTargetIndices()  // 根据配置返回可用目标
startEndlessMode()           // 从可用目标中随机选择初始目标
checkUnlock()                // 检查分数解锁新目标
```

## Unlock System (解锁系统)

存在两套独立的解锁系统：

1. **选择界面解锁** - `AdManager.isTargetUnlocked(targetId)`
   - 基于广告观看和时效（24h/48h/永久）
   - 存储在 `SettingsManager.ad.unlockData`

2. **无尽模式内部解锁** - `GameStateManager.unlockedTargetIndices`
   - 每500分解锁一个
   - 受 `USE_ALL_TARGETS` 配置影响

## Design Patterns

- **单例模式**: SettingsManager, AudioManager
- **工厂模式**: SpawnManager 创建 ImageTarget/ParticleTarget
- **观察者模式**: InputManager 的回调函数
- **策略模式**: 12种运动模式的 switch-case
- **委托模式**: Game.js 委托各管理器处理

## Known Patterns

**参数化运动与状态恢复**:
当参数化运动模式被中断（如受惊）后恢复时，需要根据当前 `position` 和 `time` 反推基准点：
```javascript
// 例如 hover 模式
baseX = position.x - hoverOffsetX(time)
baseY = position.y - hoverOffsetY(time)
```

**触摸防穿透**:
```javascript
// Game.js handleTouchEnd
if (Date.now() - this.stateChangeTime < 300) return;
```

**音频延迟初始化**:
```javascript
// 现代浏览器要求用户交互后初始化音频
handleTouchStart() {
  this.initAudio(); // 首次交互时初始化
}
```

## Development Notes

- 使用 `tt.createImage()` 加载图片资源
- 画布底部 80px 保留给 UI
- `this.time` 在每帧累积（即使受惊期间）
- 高 DPI 支持：使用 `ctx.setTransform(dpr, 0, 0, dpr, 0, 0)`

## Configuration Keys

### ENDLESS_CONFIG
- `USE_ALL_TARGETS`: 无尽模式是否使用所有目标
- `UNLOCK_SCORE_INTERVAL`: 解锁分数间隔 (500)
- `ATTRIBUTE_CHANGE_INTERVAL`: 属性变化间隔 (5000ms)

### TARGET_TYPES[].unlock
- `type`: 'free' | 'ad'
- `adRequired`: boolean
- `unlockDuration`: ms (-1 永久, 0 免费, >0 时效)

### STARTLE_CONFIG
- `TRIGGER_RADIUS`: 触发距离 (150px)
- `SPEED_MULTIPLIER`: 速度峰值 (2.5x)
- `DURATION`: 持续时间 (0.8s)
