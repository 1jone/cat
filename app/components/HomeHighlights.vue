<template>
    <section class="grid grid-cols-3 gap-8">
        <!-- 今日状态 -->
        <div class="bg-white rounded-3xl p-6 shadow-sm">
            <h3 class="font-semibold mb-4">今日状态</h3>

            <div v-for="item in status" :key="item.label" class="mb-4">
                <div class="flex justify-between text-sm mb-1">
                    <span>{{ item.label }}</span>
                    <span>{{ item.value }}%</span>
                </div>
                <div class="h-2 bg-gray-200 rounded-full">
                    <div class="h-full rounded-full" :class="item.color" :style="{ width: item.value + '%' }" />
                </div>
            </div>
        </div>

        <!-- 最近记录 -->
        <div class="bg-white rounded-3xl p-6 shadow-sm">
            <h3 class="font-semibold mb-4">最近生活</h3>
            <ul class="space-y-3 text-sm text-gray-700">
                <li>🐾 今天拒绝被抱 3 次</li>
                <li>🐾 盯着窗外发呆 20 分钟</li>
                <li>🐾 深夜突然开始跑酷</li>
            </ul>
        </div>

        <!-- 精选照片 -->
        <div class="bg-white rounded-3xl p-6 shadow-sm">
            <h3 class="font-semibold mb-4">精选照片</h3>
            <div class="grid grid-cols-3 gap-2">
                <img v-for="i in 3" :key="i" src="https://placekitten.com/300/300" class="rounded-xl" />
            </div>
        </div>
    </section>
</template>

<script setup>
const status = [
    { label: '心情', value: 85, color: 'bg-pink-400' },
    { label: '饥饿度', value: 40, color: 'bg-orange-400' },
    { label: '活跃度', value: 70, color: 'bg-purple-400' },
]
</script>
