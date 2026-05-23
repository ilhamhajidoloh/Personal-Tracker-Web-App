<script setup lang="ts">
import { onMounted } from 'vue'

useHead({
  title: 'MyLife',
  titleTemplate: (titleChunk) => titleChunk ? `${titleChunk} | MyLife` : 'MyLife',
})

const { initializeTheme } = useAppTheme()

onMounted(() => {
  initializeTheme()
})
</script>

<template>
  <NuxtPage :page-key="route => route.fullPath" />
</template>
