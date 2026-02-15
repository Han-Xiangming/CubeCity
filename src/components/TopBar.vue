<script setup>
import { eventBus } from '@/js/utils/event-bus.js'
import { useGameState } from '@/stores/useGameState.js'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import AnimatedNumber from './AnimatedNumber.vue'
import AudioManager from './AudioManager.vue'
import GuideModal from './GuideModal.vue'

const gameState = useGameState()
const { 
  credits, totalJobs, maxPopulation, territory, citySize, cityLevel, cityName, 
  language, showMapOverview, gameDay, power, maxPower, musicEnabled, musicVolume, 
  isPlayingMusic, demolishConfirmEnabled 
} = storeToRefs(gameState)

const showVolumeSlider = ref(false)
const populationWarning = computed(() => totalJobs.value > maxPopulation.value)
const powerWarning = computed(() => power.value > maxPower.value)

watch([totalJobs, maxPopulation, power, maxPower], ([newJobs, newMaxPop, newPower, newMaxP], [oldJobs, oldMaxPop, oldPower, oldMaxP]) => {
  if (newJobs > newMaxPop && !(oldJobs > oldMaxPop)) {
    eventBus.emit('toast:add', { message: language.value === 'zh' ? '⚠️ 就业岗位不足！' : '⚠️ Job shortage!', type: 'warning' })
  }
  if (newPower > newMaxP && !(oldPower > oldMaxP)) {
    eventBus.emit('toast:add', { message: language.value === 'zh' ? '⚡ 电力不足！' : '⚡ Power shortage!', type: 'error' })
  }
}, { immediate: true })

function toggleLang() { gameState.setLanguage(language.value === 'zh' ? 'en' : 'zh') }
function toggleMapOverview() { gameState.setShowMapOverview(!showMapOverview.value) }
function toggleMusic() { gameState.toggleMusic() }

// --- 新增：切换拆除安全模式 ---
function toggleDemolishSafety() {
  gameState.demolishConfirmEnabled = !gameState.demolishConfirmEnabled
  // const msg = language.value === 'zh' 
  //   ? (gameState.demolishConfirmEnabled ? '🛡️ 拆除确认已开启 (安全模式)' : '💥 快速拆除模式已开启 (请谨慎操作)')
  //   : (gameState.demolishConfirmEnabled ? '🛡️ Demolish Confirm: ON' : '💥 Quick Demolish: ON')
  // eventBus.emit('toast:add', { message: msg, type: gameState.demolishConfirmEnabled ? 'info' : 'warning' })
}

function handleVolumeChange(event) {
  gameState.setMusicVolume(Number.parseFloat(event.target.value))
}

const showGuide = ref(false)
function toggleGuide() { showGuide.value = !showGuide.value }
function showGuideModal() { showGuide.value = true }
</script>

<template>
  <header class="industrial-panel p-2 shadow-industrial z-[10] relative ">
    <div class="flex justify-between items-center ">
      <!-- 左侧资源信息 (保持原样) -->
      <div class="flex items-center space-x-6">
        <div class="resource-display rounded-lg px-4 py-1 flex items-center space-x-3 min-w-[10vw]">
          <div class="status-indicator status-online" />
          <div class="flex items-center space-x-2">
            <span class="text-industrial-green text-xl">💰</span>
            <div>
              <div class="text-sm text-gray-400 uppercase tracking-wide">{{ $t('topbar.credits') }}</div>
              <div class="text-lg font-bold text-industrial-green neon-text">
                <AnimatedNumber :value="credits" :duration="3" separator="," />
              </div>
            </div>
          </div>
        </div>
        <!-- ... (其他人口、地皮、电力代码保持不变) ... -->
        <!-- 为简洁省略，请保留您原有的资源展示部分 -->
      </div>

      <!-- 右侧城市信息和按钮 -->
      <div class="text-right flex items-center space-x-4 mr-4">
        <div>
          <h1 class="text-2xl font-black text-industrial-accent neon-text uppercase tracking-wider">{{ cityName }}</h1>
          <div class="flex items-center justify-end space-x-2 mt-1">
            <div class="status-indicator status-online" />
            <span class="text-sm text-gray-400 uppercase tracking-wide">{{ $t('topbar.level') }} {{ cityLevel }} • {{ $t('topbar.day') }} {{ gameDay }}</span>
          </div>
        </div>

        <!-- 按钮区域 -->
        <div class="grid grid-cols-3 gap-2">
          <!-- 第一行 -->
          <button class="px-2 py-1 rounded bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 transition" @click="toggleLang">
            {{ language === 'zh' ? '中' : 'EN' }}
          </button>

          <!-- 新增：拆除确认切换按钮 -->
          <button
            class="px-2 py-1 rounded text-white text-sm font-bold shadow transition flex items-center justify-center"
            :class="demolishConfirmEnabled ? 'bg-blue-600 hover:bg-blue-500' : 'bg-red-600 hover:bg-red-500'"
            @click="toggleDemolishSafety"
          >
            {{ demolishConfirmEnabled ? '🛡️' : '💥' }}
          </button>

          <button class="px-3 py-1 rounded bg-industrial-green text-white text-sm font-bold shadow hover:bg-industrial-green/80 transition" @click="toggleGuide">
            📖
          </button>

          <!-- 第二行 -->
          <div class="relative">
            <button class="w-full px-2 py-1 rounded text-white text-sm font-bold shadow transition" :class="musicEnabled ? 'bg-industrial-blue hover:bg-industrial-blue/80' : 'bg-gray-600 hover:bg-gray-500'" @click="toggleMusic">
              {{ musicEnabled && isPlayingMusic ? '🔊' : '🔇' }}
            </button>
            <div v-if="showVolumeSlider" class="absolute bottom-full left-1/2 transform -translate-x-1/2 p-3 bg-gray-800 rounded shadow-lg border border-gray-600 z-20 min-w-max">
              <input type="range" min="0" max="1" step="0.1" :value="musicVolume" @input="handleVolumeChange" class="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer">
            </div>
          </div>
          <button class="px-3 col-span-2 py-1 rounded bg-industrial-accent text-white text-sm font-bold shadow hover:bg-industrial-accent/80 transition" @click="toggleMapOverview">
            {{ language === 'zh' ? (showMapOverview ? '🗺️ 隐藏' : '🗺️ 地图') : (showMapOverview ? '🗺️ Hide' : '🗺️ Map') }}
          </button>
        </div>
      </div>
    </div>
    <GuideModal :is-visible="showGuide" @close="showGuide = false" @show-guide="showGuideModal" />
    <AudioManager />
  </header>
</template>

<style scoped>
/* 保持您原有的样式代码 */
</style>