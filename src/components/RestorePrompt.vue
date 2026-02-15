<script setup>
import { useGameState } from '@/stores/useGameState.js'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const gameState = useGameState()

const show = ref(false)
const isQuickLoad = ref(false) // 是否为存档加载模式
const enableMusic = ref(true) 

const STORAGE_KEY = 'gameState'
const RECENTLY_REJECTED_KEY = 'recentlyRejected'
const REJECTED_DURATION = 3000 

/**
 * 核心激活逻辑：在点击事件中直接触发播放
 */
async function onAccept() {
  // 1. 设置音乐偏好状态
  if (enableMusic.value) {
    gameState.enableMusic()
    
    // 2. 关键：在点击的回调栈里直接寻找并尝试播放音频
    // 这一步能 100% 激活浏览器的音频上下文
    const audioEl = document.getElementById('main-audio')
    if (audioEl) {
      try {
        await audioEl.play()
      } catch (err) {
        console.warn('音频激活尝试失败，将在下一次交互时播放:', err)
      }
    }
  } else {
    gameState.disableMusic()
  }
  
  show.value = false
}

/**
 * 拒绝并重置逻辑
 */
function onReject() {
  localStorage.removeItem(STORAGE_KEY)
  gameState.resetAll()

  // 即使拒绝恢复进度，如果勾选了音乐，也执行激活
  if (enableMusic.value) {
    gameState.enableMusic()
    const audioEl = document.getElementById('main-audio')
    audioEl?.play().catch(() => {})
  } else {
    gameState.disableMusic()
  }

  localStorage.setItem(RECENTLY_REJECTED_KEY, Date.now().toString())
  window.location.reload()
  show.value = false
}

onMounted(() => {
  const shouldSkip = sessionStorage.getItem('skip_restore_prompt') === 'true'
  
  if (shouldSkip) {
    // 如果是加载存档刷新，清除标记
    sessionStorage.removeItem('skip_restore_prompt')
    // 设为快速加载模式：只显示一个遮罩引导点击，不显示“新游戏/继续”选择
    isQuickLoad.value = true
    show.value = true
    return
  }

  const rejectedAt = localStorage.getItem(RECENTLY_REJECTED_KEY)
  const now = Date.now()
  if (rejectedAt && now - Number(rejectedAt) < REJECTED_DURATION) {
    show.value = false
    return
  }

  if (localStorage.getItem(STORAGE_KEY)) {
    show.value = true
  }
})
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-[500] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-md">
    <div class="bg-industrial-panel bg-[#1a1f26] border-2 border-gray-700 rounded-xl shadow-2xl p-8 w-[90vw] max-w-lg mx-auto text-center">
      
      <!-- 模式一：存档快速加载 (仅为了获取音频授权) -->
      <template v-if="isQuickLoad">
        <h3 class="text-2xl font-black text-industrial-accent uppercase mb-4 neon-text">
          {{ t('restorePrompt.cityReady') }}
        </h3>
        <p class="text-gray-400 mb-8">
          {{ t('restorePrompt.clickToEnter') }}
        </p>
        <button 
                class="w-full text-white font-bold py-4 px-4 text-lg uppercase tracking-widest bg-industrial-accent hover:brightness-125 rounded-lg transition-all shadow-[0_0_20px_rgba(255,187,0,0.3)] text-black" 
          @click="onAccept"
        >
          {{ t('restorePrompt.enterCity') }}
        </button>
      </template>

      <!-- 模式二：正常的恢复/新游戏询问 -->
      <template v-else>
        <h3 class="text-xl font-bold text-industrial-accent uppercase tracking-wide mb-2 neon-text">
          {{ t('restorePrompt.title') }}
        </h3>
        <p class="text-lg text-gray-400 mb-6">
          {{ t('restorePrompt.description') }}
        </p>

        <div class="flex flex-col gap-3">
          <button class="w-full text-white font-bold py-3 px-4 text-sm uppercase tracking-wide bg-blue-600 hover:bg-blue-500 rounded transition-colors shadow-lg" @click="onAccept">
            {{ t('restorePrompt.continueButton') }}
          </button>
          <button class="w-full text-white font-bold py-3 px-4 text-sm uppercase tracking-wide bg-red-600/20 hover:bg-red-600/40 text-red-500 rounded border border-red-900/50 transition-all" @click="onReject">
            {{ t('restorePrompt.newGameButton') }}
          </button>
        </div>
      </template>

      <!-- 音乐开启提示 (共用) -->
      <div class="mt-8 space-y-4 border-t border-gray-800 pt-6">
        <label class="flex items-center justify-center space-x-3 cursor-pointer group">
          <input
            v-model="enableMusic"
            type="checkbox"
            class="w-5 h-5 text-industrial-blue bg-gray-700 border-gray-600 rounded focus:ring-industrial-blue accent-industrial-blue"
          >
          <span class="text-gray-400 group-hover:text-white transition-colors text-sm font-medium">
            {{ t('restorePrompt.musicHint') }}
          </span>
        </label>

        <div class="p-3 bg-yellow-600/10 border border-yellow-500/20 rounded-lg">
          <div class="flex items-center justify-center space-x-2 text-yellow-300/60 text-[10px] uppercase tracking-widest">
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
/* 防止点击按钮时产生的蓝色边框 */
button:focus {
  outline: none;
}
</style>