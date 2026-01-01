/**
 * ResourceManager - 资源管理器
 * 负责图片和背景资源的预加载与管理
 */

import { TARGET_TYPES, ENDLESS_MODE_CARD } from '../config';

export class ResourceManager {
    constructor() {
        // 选择界面的卡片列表
        this.selectionItems = [];

        // 背景图片 Map<targetId, HTMLImageElement>
        this.backgroundImages = new Map();

        // 加载状态
        this.backgroundImagesLoaded = false;
    }

    /**
     * 预加载所有图片资源
     */
    preloadImages() {
        // 首先添加无尽模式卡片（不需要加载图片）
        const endlessItem = {
            config: ENDLESS_MODE_CARD,
            image: null,
            loaded: true,
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

        // 预加载背景图片
        this.loadBackgroundImages();
    }

    /**
     * 加载背景图片
     */
    loadBackgroundImages() {
        let loadedCount = 0;
        let totalCount = 0;

        TARGET_TYPES.forEach(config => {
            if (config.background && config.background.image) {
                totalCount++;
                const bgImg = tt.createImage();

                bgImg.onload = () => {
                    loadedCount++;
                    if (loadedCount === totalCount) {
                        this.backgroundImagesLoaded = true;
                    }
                };

                bgImg.onerror = () => {
                    console.warn(`Failed to load background: ${config.background.image}`);
                    this.backgroundImages.delete(config.id);
                    loadedCount++;
                    if (loadedCount === totalCount) {
                        this.backgroundImagesLoaded = true;
                    }
                };

                bgImg.src = config.background.image;
                this.backgroundImages.set(config.id, bgImg);
            }
        });

        // 如果没有配置背景图片，直接标记为已加载
        if (totalCount === 0) {
            this.backgroundImagesLoaded = true;
        }
    }

    /**
     * 获取指定目标的背景图片
     * @param {string} targetId - 目标 ID
     * @returns {HTMLImageElement|null} 背景图片或 null
     */
    getBackground(targetId) {
        return this.backgroundImages.get(targetId) || null;
    }

    /**
     * 检查所有资源是否加载完成
     * @returns {boolean} 是否加载完成
     */
    isLoaded() {
        // 检查选择项图片
        const allItemsLoaded = this.selectionItems.every(item => item.loaded);
        return allItemsLoaded && this.backgroundImagesLoaded;
    }

    /**
     * 获取选择项数量
     * @returns {number} 选择项数量
     */
    getSelectionCount() {
        return this.selectionItems.length;
    }
}
