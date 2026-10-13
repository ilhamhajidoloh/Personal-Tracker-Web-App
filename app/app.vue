<script setup lang="ts">
import { onMounted } from 'vue'

useHead({
  title: 'MyLife',
  titleTemplate: (titleChunk) => titleChunk ? `${titleChunk} | MyLife` : 'MyLife',
})

const route = useRoute()
const { initializeTheme } = useAppTheme()

onMounted(() => {
  initializeTheme()
})
</script>

<template>
  <div>
    <NuxtPwaManifest />
    <NuxtPage v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </NuxtPage>
    <InstallPrompt />
  </div>
</template>
