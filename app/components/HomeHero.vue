<template>
    <section class="grid grid-cols-2 gap-16 items-center min-h-[70vh]">
        <!-- 左侧文案 -->
        <div class="space-y-6">
            <h1 class="text-6xl font-bold tracking-tight">
                王大强
            </h1>

            <p class="text-xl text-gray-700 leading-relaxed max-w-md">
                一只外表柔软、内心叛逆的美少女战士。
            </p>

            <div class="flex gap-3 flex-wrap">
                <span v-for="tag in tags" :key="tag" class="px-4 py-1 rounded-full bg-pink-100 text-sm">
                    {{ tag }}
                </span>
            </div>
        </div>

        <!-- 右侧主视觉 -->
       <div class="relative w-[400px] h-[600px] mt-10 cursor-pointer" @click="switchLayer">
            <!-- 后面的图 -->
            <img src="/index/banner1.jpg"
                class="absolute top-0 right-0 w-full h-full object-cover rounded-3xl transition-all duration-500  hover:scale-90 transition"
                :class="isFront ? 'rotate-[0.1rad] scale-95' : 'z-20 scale-100 rotate-0'" />

            <!-- 前面的图 -->
            <img src="/index/banner.jpg"
                class="absolute top-0 left-0 w-full h-full object-cover rounded-3xl shadow-xl transition-all duration-500 hover:scale-90 transition"
                :class="isFront ? 'z-20 scale-100 rotate-0' : 'rotate-[0.1rad] scale-95'" />
        </div>
    </section>
</template>

<script setup>
const tags = [
    '美少女战士',
    '勇敢',
    '叛逆',
    '大眼萌妹'
]

import { ref } from 'vue'

const isFront = ref(true)

function switchLayer() {
    isFront.value = !isFront.value
}

</script>
