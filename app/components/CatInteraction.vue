<template>
    <section class="bg-white rounded-3xl p-8 shadow-sm">
        <h2 class="text-2xl font-semibold mb-6">
            和王大强互动
        </h2>

        <!-- 当前状态 -->
        <div class="flex items-center gap-6 mb-6">
            <div class="text-5xl">
                {{ mood.emoji }}
            </div>
            <div>
                <p class="text-lg font-medium mb-1">
                    当前情绪：{{ mood.label }}
                </p>
                <p class="text-sm text-gray-500">
                    {{ feedback }}
                </p>
            </div>
        </div>

        <!-- 数值面板 -->
        <div class="grid grid-cols-2 gap-6 mb-8">
            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span>心情值</span>
                    <span>{{ moodValue }}</span>
                </div>
                <div class="h-2 bg-gray-200 rounded-full">
                    <div class="h-full bg-pink-400 rounded-full transition-all" :style="{ width: moodValue + '%' }" />
                </div>
            </div>

            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span>饥饿值</span>
                    <span>{{ hunger }}</span>
                </div>
                <div class="h-2 bg-gray-200 rounded-full">
                    <div class="h-full bg-orange-400 rounded-full transition-all" :style="{ width: hunger + '%' }" />
                </div>
            </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-4">
            <button class="px-6 py-2 rounded-full bg-pink-100 hover:bg-pink-200 transition" @click="petCat">
                🐾 摸摸
            </button>

            <button class="px-6 py-2 rounded-full bg-orange-100 hover:bg-orange-200 transition" @click="feedCat">
                🍗 投喂
            </button>

            <button class="px-6 py-2 rounded-full bg-gray-100 hover:bg-gray-200 transition" @click="ignoreCat">
                🙈 无视她
            </button>
        </div>
    </section>
</template>

<script setup>
import { ref, computed } from 'vue'

const moodValue = ref(70)
const hunger = ref(40)
const feedback = ref('她正在暗中观察你。')

const mood = computed(() => {
    if (moodValue.value >= 80) return { emoji: '😺', label: '非常满意' }
    if (moodValue.value >= 60) return { emoji: '😼', label: '勉强开心' }
    if (moodValue.value >= 40) return { emoji: '😐', label: '冷漠中立' }
    return { emoji: '😾', label: '明显不爽' }
})

function petCat() {
    moodValue.value = Math.min(100, moodValue.value + 10)
    feedback.value = '她允许你摸了一下，但没有看你。'
}

function feedCat() {
    hunger.value = Math.max(0, hunger.value - 15)
    moodValue.value = Math.min(100, moodValue.value + 5)
    feedback.value = '她认真吃完了，但假装这是理所当然。'
}

function ignoreCat() {
    moodValue.value = Math.max(0, moodValue.value - 15)
    feedback.value = '她记住了这件事。'
}
</script>
