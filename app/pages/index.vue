<template>
  <div class="bg-[#FFF8F0] min-h-screen">

    <main class="max-w-6xl mx-auto px-8 space-y-32">
      <HomeHero />
      <CatInteraction />
      <HomeHighlights />
      <HomeFriends />
    </main>

    <div class="scroll rounded-3xl fixed bottom-8 right-8 w-16 h-16 hidden items-center justify-center cursor-pointer hover:scale-110 transition-transform duration-300" @click="ToTop" >
      <img src="/index/logo.png" alt="">
    </div>
  </div>
</template>

<script setup>
useHead({
  title: '首页 - 猫猫乐园'
})


let  scrollValue=ref(0)
const scroll = (() => {
  window.addEventListener('scroll', () => {
    scrollValue.value = window.scrollY
    console.log(scrollValue.value)
    if (window.scrollY >= 300) {
      document.querySelector('.scroll').style.display = 'flex'
    }else {
      document.querySelector('.scroll').style.display = 'none'
    }
  })
})

function ToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  scroll()
})


</script>
