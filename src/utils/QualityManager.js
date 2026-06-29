/**
 * QualityManager - 设备性能分级工具
 * 启动时检测设备能力，返回对应的渲染质量等级
 */

import { PERFORMANCE_TIERS } from '../config';

let _tier = null;
let _config = null;

/**
 * 检测设备性能等级（只执行一次，结果缓存）
 * 利用屏幕分辨率和 pixelRatio 作为设备能力的近似指标
 * @returns {'high'|'medium'|'low'}
 */
export function getPerformanceTier() {
    if (_tier) return _tier;

    try {
        const sysInfo = tt.getSystemInfoSync();
        const { screenWidth, screenHeight, pixelRatio } = sysInfo;
        const totalPixels = screenWidth * screenHeight * Math.min(pixelRatio, 3);

        if (totalPixels > 3000000) {
            _tier = 'high';
        } else if (totalPixels > 1500000) {
            _tier = 'medium';
        } else {
            _tier = 'low';
        }
    } catch (e) {
        // tt.getSystemInfoSync 不可用时回退到中等质量
        _tier = 'medium';
    }

    return _tier;
}

/**
 * 获取当前设备质量等级的配置对象
 * @returns {Object} PERFORMANCE_TIERS 中对应等级的配置
 */
export function getQualityConfig() {
    if (_config) return _config;
    const tier = getPerformanceTier();
    _config = PERFORMANCE_TIERS[tier];
    return _config;
}
