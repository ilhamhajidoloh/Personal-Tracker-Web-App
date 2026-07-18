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
  <div>
    <NuxtPwaManifest />
    <NuxtPage :page-key="route => route.fullPath" v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </NuxtPage>
    <InstallPrompt />
  </div>
</template>
