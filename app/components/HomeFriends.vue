<template>
    <section>
        <h2 class="text-2xl font-semibold mb-8">
            王大强的小猫朋友们
        </h2>

        <div class="grid grid-cols-3 gap-8">
            <div v-for="friend in friends" :key="friend.name" class="bg-white rounded-3xl p-6 shadow-sm" @click="ToDetail(friend.id)">
                <img :src="friend.img" class="rounded-2xl mb-4" />
                <h3 class="font-semibold">{{ friend.name }}</h3>
                <p class="text-sm text-gray-600">
                    {{ friend.desc }}
                </p>
            </div>
        </div>
    </section>
</template>

<script setup>
    const router =useRouter()
const friends = [
    { id:1, img:'/index/cchou.jpg', name: '臭臭', desc: '隔壁的冷漠邻居' },
    { id:2, img: '/index/xiaobao.jpg',name: '小宝', desc: '一起晒过太阳' },
    { id:3, img: '/index/xiaoqi.jpg',name: '小七', desc: '一起晒过太阳' },
    { id:4, img: '/index/waiwai.jpg',name: '歪歪', desc: '一起晒过太阳' },
]


function ToDetail(id) {
    router.push(`friends/${id}`)
}
</script>
