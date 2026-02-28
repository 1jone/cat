# 广告解锁配置完成

## 已修改的目标

### 1. 章鱼
```javascript
unlock: {
    type: 'ad',                         // 广告解锁
    adRequired: true,                    // 需要广告
    unlockDuration: 48 * 60 * 60 * 1000  // 48小时
}
```

### 2. 小熊
```javascript
unlock: {
    type: 'ad',                         // 广告解锁
    adRequired: true,                    // 需要广告
    unlockDuration: 48 * 60 * 60 * 1000  // 48小时
}
```

### 3. 海鸥
```javascript
unlock: {
    type: 'ad',                         // 广告解锁
    adRequired: true,                    // 需要广告
    unlockDuration: 48 * 60 * 60 * 1000  // 48小时
}
```

## 保持免费的目标

### 船长（新手目标）
```javascript
unlock: {
    type: 'free',                        // 免费目标
    adRequired: false,                   // 不需要广告
    unlockDuration: 10 * 60 * 60 * 1000  // 新手引导时长
}
```

## 测试步骤

1. **启动抖音开发者工具**
2. **进入目标选择界面**
3. **验证锁定状态**：
   - 章鱼、小熊、海鸥应该显示锁定遮罩和 🔒 图标
   - 船长应该正常显示，无锁定状态

4. **测试解锁流程**：
   - 点击章鱼/小熊/海鸥
   - 应该弹出解锁确认弹窗
   - 弹窗显示"观看广告解锁48小时"
   - 点击"观看广告"按钮
   - 广告播放完成后自动解锁

5. **验证解锁后状态**：
   - 目标显示剩余时间
   - 可以正常点击进入游戏
   - 关闭重开游戏，解锁状态保持

6. **测试过期机制**（可选）：
   - 临时修改 `unlockDuration` 为1分钟
   - 等待过期后自动恢复锁定状态

## 广告解锁系统说明

解锁功能基于现有的广告系统实现：
- **AdManager.js** - 管理广告和解锁逻辑
- **SelectionScreen.js** - 显示锁定状态和解锁弹窗
- **SettingsManager.js** - 存储解锁数据到本地

无需修改代码，只需要修改配置即可启用广告解锁功能。
