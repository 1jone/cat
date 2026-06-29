/**
 * ChatGroupManager - 抖音群聊管理器
 * 负责管理游戏中的群聊、公会和铭牌功能
 */

export class ChatGroupManager {
    constructor(settingsManager) {
        this.settings = settingsManager;

        // 群聊数据
        this.groupData = {
            officialGroup: {
                id: '@4F9U1aXLC8g0ay7zMNpoEKD51WeGOv6AM5F2rg+kK1ERavH81nDifmIujgn96zUF4et6ZbFrLr/Vbf4GfcPnJw==',
                name: '猫咪追追追官方群',
                memberCount: 0,
                avatar: ''
            },
            myGuilds: [],  // 用户加入的公会列表
            myBadge: null   // 用户的群铭牌
        };

        // 初始化
        this.init();
    }

    /**
     * 初始化群聊管理器
     */
    async init() {
        console.log('[ChatGroupManager] 初始化群聊管理器');

        // 检查抖音环境
        if (typeof tt === 'undefined') {
            console.log('[ChatGroupManager] 非抖音环境，群聊功能禁用');
            return;
        }

        // 加载本地存储的群聊数据
        this.loadGroupData();

        // 检查并初始化抖音群聊能力（仅检查核心加群和分享API）
        const missingApis = [];
        if (!tt.joinGroup) missingApis.push('tt.joinGroup');
        if (!tt.shareAppMessage) missingApis.push('tt.shareAppMessage');

        if (missingApis.length === 0) {
            console.log('[ChatGroupManager] 抖音群聊能力可用');
            this.isAvailable = true;
        } else {
            console.warn(`[ChatGroupManager] 抖音群聊能力不可用，缺失API: ${missingApis.join(', ')}`);
            this.isAvailable = false;
        }
    }

    /**
     * 从本地存储加载群聊数据
     */
    loadGroupData() {
        try {
            const data = tt.getStorageSync('chatGroupData');
            if (data) {
                this.groupData = JSON.parse(data);
                console.log('[ChatGroupManager] 群聊数据已加载:', this.groupData);
            }
        } catch (e) {
            console.warn('[ChatGroupManager] 加载群聊数据失败:', e);
        }
    }

    /**
     * 保存群聊数据到本地存储
     */
    saveGroupData() {
        try {
            tt.setStorageSync('chatGroupData', JSON.stringify(this.groupData));
            console.log('[ChatGroupManager] 群聊数据已保存');
        } catch (e) {
            console.warn('[ChatGroupManager] 保存群聊数据失败:', e);
        }
    }

    /**
     * 打开官方群聊（必须在用户手势回调中同步调用）
     * @param {Function} onSuccess - 加群成功后的回调（用户实际加入了群）
     * @returns {boolean} 是否成功调用API
     */
    openOfficialGroup(onSuccess) {
        console.log('[ChatGroupManager] 打开官方群聊');

        if (typeof tt === 'undefined') {
            console.warn('[ChatGroupManager] 非抖音环境');
            return false;
        }

        if (!tt.joinGroup) {
            console.warn('[ChatGroupManager] ❌ tt.joinGroup API 不可用');
            return false;
        }

        try {
            tt.joinGroup({
                groupid: this.groupData.officialGroup.id,
                success: () => {
                    console.log('[ChatGroupManager] ✅ 成功加入官方群');
                    if (typeof onSuccess === 'function') {
                        onSuccess();
                    }
                },
                fail: (err) => {
                    console.error('[ChatGroupManager] ❌ 加入官方群失败:', err);
                }
            });
            return true;
        } catch (e) {
            console.error('[ChatGroupManager] 打开官方群异常:', e);
            return false;
        }
    }

    /**
     * 通过平台API检查用户是否已在官方群中
     * 用于本地存储被清理后恢复加群状态
     * @returns {Promise<boolean>} 用户是否已在群中
     */
    async checkGroupMembership() {
        if (typeof tt === 'undefined' || !tt.checkGroupInfo) {
            console.warn('[ChatGroupManager] tt.checkGroupInfo 不可用，跳过群成员检查');
            return false;
        }

        try {
            const result = await new Promise((resolve) => {
                tt.checkGroupInfo({
                    groupid: this.groupData.officialGroup.id,
                    success: (res) => resolve(res),
                    fail: (err) => {
                        console.error('[ChatGroupManager] ❌ 检查群成员失败:', err);
                        resolve(null);
                    }
                });
            });

            if (result) {
                const isMember = result.hasJoined || false;
                console.log(`[ChatGroupManager] 群成员检查结果: hasJoined=${isMember}`);
                return isMember;
            }
            return false;
        } catch (e) {
            console.error('[ChatGroupManager] 检查群成员异常:', e);
            return false;
        }
    }

    /**
     * 获取官方群信息
     * @returns {Promise<Object>} 官方群信息
     */
    async getOfficialGroupInfo() {
        if (typeof tt === 'undefined') {
            return this.groupData.officialGroup;
        }

        try {
            if (tt.getGroupInfo) {
                const info = await new Promise((resolve) => {
                    tt.getGroupInfo({
                        groupid: this.groupData.officialGroup.id, // 🔥 修复：全小写 groupid
                        success: (res) => {
                            resolve(res);
                        },
                        fail: (err) => {
                            console.error('[ChatGroupManager] ❌ 获取群信息失败:', err);
                            resolve(null);
                        }
                    });
                });

                if (info) {
                    this.groupData.officialGroup = {
                        ...this.groupData.officialGroup,
                        memberCount: info.memberCount || 0,
                        avatar: info.avatar || ''
                    };
                    this.saveGroupData();
                }
            }
        } catch (e) {
            console.error('[ChatGroupManager] 获取官方群信息失败:', e);
        }

        return this.groupData.officialGroup;
    }

    /**
     * 分享到群聊
     * @param {Object} shareData - 分享数据
     * @returns {Promise<boolean>} 是否成功分享
     */
    async shareToGroup(shareData) {
        if (typeof tt === 'undefined') {
            console.warn('[ChatGroupManager] ❌ 非抖音环境');
            return false;
        }

        // 🔥 修复：废弃旧API，使用新API
        if (!tt.shareAppMessage) {
            console.warn('[ChatGroupManager] ❌ tt.shareAppMessage API 不可用');
            return false;
        }

        try {
            console.log('[ChatGroupManager] 📤 调用 tt.shareAppMessage 分享');
            console.log('[ChatGroupManager] 分享数据:', shareData);

            // 封装为 Promise 以等待结果
            const shareResult = await new Promise((resolve) => {
                tt.shareAppMessage({
                    title: shareData.title || '我正在玩猫咪追追追，快来一起玩吧！',
                    imageUrl: shareData.imageUrl || '',
                    query: shareData.query || '',
                    // path 已删除，抖音小游戏不需要

                    success: () => {
                        console.log('[ChatGroupManager] ✅ 分享成功');
                        resolve(true);
                    },
                    fail: (err) => {
                        console.error('[ChatGroupManager] ❌ 分享失败:', err);
                        resolve(false);
                    }
                });
            });

            return shareResult;
        } catch (e) {
            console.error('[ChatGroupManager] ❌ 分享异常:', e);
            return false;
        }
    }

    /**
     * 获取用户的群铭牌
     * @returns {Promise<Object>} 群铭牌信息
     */
    async getGroupBadge() {
        // TODO: 调用抖音群铭牌API
        // 这里先返回模拟数据
        if (!this.groupData.myBadge) {
            this.groupData.myBadge = {
                id: 'badge_001',
                name: '初级玩家',
                level: 1,
                icon: '🎮',
                description: '开始你的猫咪追追追之旅',
                privilege: ['基础奖励加成']
            };
        }

        return this.groupData.myBadge;
    }

    /**
     * 获取玩家公会列表
     * @returns {Promise<Array>} 公会列表
     */
    async getMyGuilds() {
        // TODO: 调用抖音公会API
        // 这里先返回空数组
        return this.groupData.myGuilds;
    }

    /**
     * 创建公会
     * @param {Object} guildData - 公会数据
     * @returns {Promise<boolean>} 是否成功创建
     */
    async createGuild(guildData) {
        // TODO: 调用抖音创建公会API
        console.log('[ChatGroupManager] 创建公会:', guildData);
        return false;
    }

    /**
     * 加入公会
     * @param {string} guildId - 公会ID
     * @returns {Promise<boolean>} 是否成功加入
     */
    async joinGuild(guildId) {
        // TODO: 调用抖音加入公会API
        console.log('[ChatGroupManager] 加入公会:', guildId);
        return false;
    }
}