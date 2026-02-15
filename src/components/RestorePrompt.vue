<script setup>
import { useGameState } from '@/stores/useGameState.js'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const show = ref(false)
const enableMusic = ref(true) // 默认开启背景音乐
const STORAGE_KEY = 'gameState' // pinia 默认以 store.$id 作为 key
const RECENTLY_REJECTED_KEY = 'recentlyRejected'
const REJECTED_DURATION = 3000 // ms

/**
 * 确认恢复逻辑
 */
function onAccept() {
  const gameState = useGameState()
  if (enableMusic.value) {
    gameState.enableMusic()
  }
  else {
    gameState.disableMusic()
  }
  show.value = false
}

/**
 * 拒绝并重置逻辑
 */
function onReject() {
  localStorage.removeItem(STORAGE_KEY)
  const gameState = useGameState()
  gameState.resetAll()

  if (enableMusic.value) {
    gameState.enableMusic()
    gameState.setMusicPlaying(true)
  }
  else {
    gameState.disableMusic()
    gameState.setMusicPlaying(false)
  }

  localStorage.setItem(RECENTLY_REJECTED_KEY, Date.now().toString())
  window.location.reload()
  show.value = false
}

onMounted(() => {
  // --- 核心优化：检查是否是从存档管理中加载的刷新 ---
  const shouldSkip = sessionStorage.getItem('skip_restore_prompt') === 'true'
  if (shouldSkip) {
    sessionStorage.removeItem('skip_restore_prompt') // 使用一次后立即清除
    onAccept() // 直接执行进入逻辑
    return // 不再显示弹窗
  }

  // --- 原有逻辑 ---
  const rejectedAt = localStorage.getItem(RECENTLY_REJECTED_KEY)
  const now = Date.now()
  if (rejectedAt && now - Number(rejectedAt) < REJECTED_DURATION) {
    show.value = false
    return
  }
  // 检查 localStorage 是否有存档
  if (localStorage.getItem(STORAGE_KEY)) {
    show.value = true
  }
})
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-[500] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
    <div class="bg-industrial-panel bg-[#1a1f26] border-2 border-gray-700 rounded-xl shadow-2xl p-6 w-[90vw] max-w-lg mx-auto text-center">
      <h3 class="text-xl font-bold text-industrial-accent uppercase tracking-wide mb-2 neon-text">
        {{ t('restorePrompt.title') }}
      </h3>
      <p class="text-lg text-gray-400 mb-6">
        {{ t('restorePrompt.description') }}
      </p>

      <div class="flex flex-col gap-3">
        <button class="w-full text-white font-bold py-3 px-4 text-sm uppercase tracking-wide bg-blue-600 hover:bg-blue-500 rounded transition-colors" @click="onAccept">
          {{ t('restorePrompt.continueButton') }}
        </button>
        <button class="w-full text-white font-bold py-3 px-4 text-sm uppercase tracking-wide bg-red-600/80 hover:bg-red-500 rounded transition-colors" @click="onReject">
          {{ t('restorePrompt.newGameButton') }}
        </button>
      </div>

      <!-- 底部选项与提示 -->
      <div class="mt-6 space-y-4 border-t border-gray-800 pt-4">
        <label class="flex items-center justify-center space-x-3 cursor-pointer group">
          <input
            v-model="enableMusic"
            type="checkbox"
            class="w-4 h-4 text-industrial-blue bg-gray-700 border-gray-600 rounded focus:ring-industrial-blue"
          >
          <span class="text-gray-400 group-hover:text-white transition-colors text-sm">
            {{ t('restorePrompt.musicHint') }}
          </span>
        </label>

        <div class="p-3 bg-yellow-600/10 border border-yellow-500/20 rounded-lg">
          <div class="flex items-center justify-center space-x-2 text-yellow-300/60 text-[10px] uppercase tracking-tighter">
            <span>⚡ {{ t('restorePrompt.gpuHint') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.neon-text {
  text-shadow: 0 0 10px rgba(255, 184, 0, 0.4);
}
</style>