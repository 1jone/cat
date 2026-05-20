/**
 * CoinManager - 金币管理器
 * 统一管理金币的增减、签到、加群奖励、结算计算和永久解锁
 */

import { COIN_CONFIG } from '../config';

export class CoinManager {
    constructor(settingsManager) {
        this.settings = settingsManager;
    }

    getBalance() {
        return this.settings.get('coin.balance') || 0;
    }

    canAfford(amount) {
        return this.getBalance() >= amount;
    }

    addCoins(amount, reason) {
        const newBalance = this.getBalance() + amount;
        const totalEarned = (this.settings.get('coin.totalEarned') || 0) + amount;
        this.settings.set('coin.balance', newBalance);
        this.settings.set('coin.totalEarned', totalEarned);
        console.log(`[CoinManager] +${amount} 金币 (${reason}), 余额: ${newBalance}`);
        return { newBalance, amount };
    }

    spendCoins(amount, reason) {
        if (!this.canAfford(amount)) {
            console.log(`[CoinManager] 余额不足，需要 ${amount}，当前 ${this.getBalance()}`);
            return { success: false, newBalance: this.getBalance() };
        }
        const newBalance = this.getBalance() - amount;
        const totalSpent = (this.settings.get('coin.totalSpent') || 0) + amount;
        this.settings.set('coin.balance', newBalance);
        this.settings.set('coin.totalSpent', totalSpent);
        console.log(`[CoinManager] -${amount} 金币 (${reason}), 余额: ${newBalance}`);
        return { success: true, newBalance };
    }

    calculateSettlementCoins(score) {
        return Math.max(1, Math.floor(score * COIN_CONFIG.SETTLEMENT_RATIO));
    }

    // ==================== 签到系统 ====================

    getTodayStr() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    getYesterdayStr() {
        const d = new Date(Date.now() - 86400000);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    getCheckinState() {
        const today = this.getTodayStr();
        const lastDate = this.settings.get('coin.lastCheckinDate');
        const consecutive = this.settings.get('coin.consecutiveCheckins') || 0;

        if (lastDate === today) {
            return { canCheckin: false, consecutiveDays: consecutive, todayReward: 0 };
        }

        const nextConsecutive = (lastDate === this.getYesterdayStr()) ? consecutive + 1 : 1;
        const capped = Math.min(nextConsecutive, COIN_CONFIG.CHECKIN_MAX_CONSECUTIVE);
        const reward = COIN_CONFIG.CHECKIN_BASE_REWARD + (capped - 1) * COIN_CONFIG.CHECKIN_CONSECUTIVE_BONUS;

        const isGroupJoined = this.settings.get('coin.groupJoinRewardClaimed') || false;
        const finalReward = isGroupJoined ? reward * COIN_CONFIG.GROUP_MULTIPLIER : reward;

        return {
            canCheckin: true,
            consecutiveDays: capped,
            todayReward: finalReward,
            baseReward: reward,
            hasGroupBonus: isGroupJoined
        };
    }

    doCheckin() {
        const state = this.getCheckinState();
        if (!state.canCheckin) {
            return { success: false, reward: 0, newBalance: this.getBalance(), consecutiveDays: 0, reason: 'already_checked' };
        }

        this.settings.set('coin.lastCheckinDate', this.getTodayStr());
        this.settings.set('coin.consecutiveCheckins', state.consecutiveDays);

        const result = this.addCoins(state.todayReward, 'checkin');
        return {
            success: true,
            reward: state.todayReward,
            newBalance: result.newBalance,
            consecutiveDays: state.consecutiveDays,
            hasGroupBonus: state.hasGroupBonus
        };
    }

    // ==================== 加群奖励 ====================

    getGroupJoinRewardState() {
        const claimed = this.settings.get('coin.groupJoinRewardClaimed') || false;
        return { canClaim: !claimed };
    }

    claimGroupJoinReward() {
        if (this.settings.get('coin.groupJoinRewardClaimed')) {
            return { success: false, reward: 0, newBalance: this.getBalance(), reason: 'already_claimed' };
        }

        this.settings.set('coin.groupJoinRewardClaimed', true);
        const result = this.addCoins(COIN_CONFIG.GROUP_JOIN_REWARD, 'group_join');
        return { success: true, reward: COIN_CONFIG.GROUP_JOIN_REWARD, newBalance: result.newBalance };
    }

    // ==================== 金币永久解锁 ====================

    isPermanentlyUnlocked(targetId) {
        const unlocks = this.settings.get('coin.permanentUnlocks') || {};
        return unlocks[targetId] === true;
    }

    permanentUnlockTarget(targetId) {
        if (this.isPermanentlyUnlocked(targetId)) {
            return { success: false, reason: 'already_unlocked' };
        }

        const result = this.spendCoins(COIN_CONFIG.PERMANENT_UNLOCK_PRICE, 'permanent_unlock');
        if (!result.success) return result;

        const unlocks = this.settings.get('coin.permanentUnlocks') || {};
        unlocks[targetId] = true;
        this.settings.set('coin.permanentUnlocks', unlocks);

        return { success: true, newBalance: result.newBalance };
    }

    // ==================== 购买体力 ====================

    buyStamina1(staminaManager) {
        if (!staminaManager) return { success: false, reason: 'no_stamina_manager' };
        const result = this.spendCoins(COIN_CONFIG.STAMINA_PRICE_1, 'buy_stamina_1');
        if (!result.success) return result;
        staminaManager.addStamina(1);
        return { success: true, newBalance: result.newBalance };
    }

    buyStamina2(staminaManager) {
        if (!staminaManager) return { success: false, reason: 'no_stamina_manager' };
        const result = this.spendCoins(COIN_CONFIG.STAMINA_PRICE_2, 'buy_stamina_2');
        if (!result.success) return result;
        staminaManager.addStamina(2);
        return { success: true, newBalance: result.newBalance };
    }

    // ==================== 无限体力广告进度 ====================

    getUnlimitedStaminaAdProgress() {
        return this.settings.get('coin.unlimitedStaminaAdProgress') || 0;
    }

    recordUnlimitedStaminaAd() {
        const current = this.getUnlimitedStaminaAdProgress();
        const next = current + 1;
        this.settings.set('coin.unlimitedStaminaAdProgress', next);

        if (next >= COIN_CONFIG.STAMINA_AD_COUNT) {
            this.settings.set('coin.unlimitedStaminaAdProgress', 0);
            return { completed: true, progress: next, total: COIN_CONFIG.STAMINA_AD_COUNT };
        }
        return { completed: false, progress: next, total: COIN_CONFIG.STAMINA_AD_COUNT };
    }
}
