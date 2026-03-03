<template>
    <canvas ref="canvasRef" width="300" height="300" class="border rounded-xl" />
</template>

<script setup>
import { ref, onMounted } from 'vue'

const canvasRef = ref(null)

onMounted(() => {
        const canvas = canvasRef.value
        const ctx = canvas.getContext('2d')
        ctx.beginPath()
        ctx.arc(150, 150, 60, 0, Math.PI * 2)
        ctx.fillStyle = '#FFD6E7'
})
</script>
