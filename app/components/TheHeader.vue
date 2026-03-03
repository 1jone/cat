<template>
    <header class="sticky top-0 z-50 bg-white/80 backdrop-blur">
        <div class="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
            <div class="font-semibold text-lg">
                王大强日记
            </div>

            <nav class="flex gap-6 text-sm text-gray-600">
                <NuxtLink to="/" class="hover:text-black">Home</NuxtLink>
                <NuxtLink to="/profile">Profile</NuxtLink>
                <NuxtLink to="/diary">Diary</NuxtLink>
                <NuxtLink to="/gallery">Gallery</NuxtLink>
                <NuxtLink to="/friends">Friends</NuxtLink>
                <NuxtLink to="/about">About</NuxtLink>
            </nav>
        </div>
    </header>
</template>
