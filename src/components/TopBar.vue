<script setup>
import { eventBus } from '@/js/utils/event-bus.js'
import { useGameState } from '@/stores/useGameState.js'
import { storeToRefs } from 'pinia'
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import AnimatedNumber from './AnimatedNumber.vue'
import AudioManager from './AudioManager.vue'
import GuideModal from './GuideModal.vue'
import ArchivePanel from './ArchivePanel.vue' // 引入之前创建的存档面板组件
import MusicPanel from './MusicPanel.vue'

const gameState = useGameState()
const { 
  credits, totalJobs, maxPopulation, territory, citySize, 
  cityLevel, cityName, language, showMapOverview, gameDay, 
  power, maxPower, musicEnabled, musicVolume, isPlayingMusic,
  demolishConfirmEnabled 
} = storeToRefs(gameState)

// --- 存档面板控制 ---
const showArchive = ref(false)
const archiveContainer = ref(null)

const toggleArchive = (e) => {
  e.stopPropagation()
  showArchive.value = !showArchive.value
}

// 点击外部关闭存档面板
const handleClickOutside = (e) => {
  if (archiveContainer.value && !archiveContainer.value.contains(e.target)) {
    showArchive.value = false
  }
}


// 音乐面板状态
const showMusic = ref(false)
const musicContainer = ref(null)

// 点击外部关闭
const closePanels = (e) => {
  if (musicContainer.value && !musicContainer.value.contains(e.target)) {
    showMusic.value = false
  }
}
onMounted(() => window.addEventListener('click', closePanels))
onUnmounted(() => window.removeEventListener('click', closePanels))

// --- 状态警告逻辑 ---
const populationWarning = computed(() => totalJobs.value > maxPopulation.value)
const powerWarning = computed(() => power.value > maxPower.value)

watch([totalJobs, maxPopulation, power, maxPower], ([newJobs, newMaxPop, newPower, newMaxP], [oldJobs, oldMaxPop, oldPower, oldMaxP]) => {
  if (newJobs > newMaxPop && !(oldJobs > oldMaxPop)) {
    eventBus.emit('toast:add', {
      message: language.value === 'zh' ? '⚠️ 就业岗位不足！人口容量已超负荷' : '⚠️ Job shortage! Population capacity exceeded',
      type: 'warning',
    })
  }
  if (newPower > newMaxP && !(oldPower > oldMaxP)) {
    eventBus.emit('toast:add', {
      message: language.value === 'zh' ? '⚡ 电力不足！发电量无法满足需求' : '⚡ Power shortage! Power generation insufficient',
      type: 'error',
    })
  }
}, { immediate: true })

// --- 基础功能 ---
function toggleLang() {
  gameState.setLanguage(language.value === 'zh' ? 'en' : 'zh')
  gameState.addToast(language.value === 'zh' ? '语言已切换为中文' : 'Language set to English', 'info', 1000)
}

function toggleMapOverview() {
  gameState.setShowMapOverview(!showMapOverview.value)
}

function toggleDemolishSafety() {
  gameState.demolishConfirmEnabled = !gameState.demolishConfirmEnabled
  const isSafe = gameState.demolishConfirmEnabled
  const msg = language.value === 'zh' 
    ? (isSafe ? '🛡️ 拆除确认已开启' : '💥 快速拆除模式已开启')
    : (isSafe ? '🛡️ Safety ON' : '💥 Quick Mode ON')
  eventBus.emit('toast:add', { message: msg, type: isSafe ? 'info' : 'warning', duration: 1500 })
}

const showGuide = ref(false)
function toggleGuide() { showGuide.value = !showGuide.value }

onMounted(() => window.addEventListener('click', handleClickOutside))
onUnmounted(() => window.removeEventListener('click', handleClickOutside))
</script>

<template>
  <header class="industrial-panel p-2 shadow-industrial z-[110] relative">
    <div class="flex justify-between items-center">
      
      <!-- 左侧资源信息区域 -->
      <div class="flex items-center space-x-4">
        <!-- 金币 -->
        <div class="resource-display rounded-lg px-3 py-1 flex items-center space-x-3 min-w-[9vw]">
          <span class="text-industrial-green text-xl">💰</span>
          <div>
            <div class="text-[10px] text-gray-500 uppercase tracking-widest">{{ $t('topbar.credits') }}</div>
            <div class="text-lg font-bold text-industrial-green neon-text">
              <AnimatedNumber :value="credits" :duration="2" separator="," />
            </div>
          </div>
        </div>

        <!-- 人口 -->
        <div class="resource-display rounded-lg px-3 py-1 flex items-center space-x-3 min-w-[9vw]" :class="{ 'warning-pulse': populationWarning }">
          <span class="text-xl" :class="populationWarning ? 'text-red-500' : 'text-industrial-blue'">👥</span>
          <div>
            <div class="text-[10px] text-gray-500 uppercase tracking-widest">{{ $t('topbar.population') }}</div>
            <div class="text-lg font-bold neon-text" :class="populationWarning ? 'text-red-500' : 'text-industrial-blue'">
              <AnimatedNumber :value="totalJobs" :duration="2" />/{{ maxPopulation }}
            </div>
          </div>
        </div>

        <!-- 电力 -->
        <div class="resource-display rounded-lg px-3 py-1 flex items-center space-x-3 min-w-[9vw]" :class="{ 'warning-pulse': powerWarning }">
          <span class="text-xl" :class="powerWarning ? 'text-red-500' : 'text-industrial-yellow'">⚡️</span>
          <div>
            <div class="text-[10px] text-gray-500 uppercase tracking-widest">{{ $t('topbar.power') }}</div>
            <div class="text-lg font-bold neon-text" :class="powerWarning ? 'text-red-500' : 'text-industrial-yellow'">
              <AnimatedNumber :value="power" :duration="2" />/{{ maxPower }}
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧城市信息与控制台 -->
      <div class="flex items-center space-x-6 mr-4">
        <div class="text-right">
          <h1 class="text-2xl font-black text-industrial-accent neon-text uppercase tracking-tighter italic">
            {{ cityName }}
          </h1>
          <div class="text-[10px] text-gray-400 uppercase tracking-widest">
            Lv.{{ cityLevel }} • {{ $t('topbar.day') }} {{ gameDay }}
          </div>
        </div>

        <!-- 按钮组：4列宽度的网格布局 -->
        <div class="grid grid-cols-4 gap-2 min-w-[180px]">
          
          <!-- 1. 存档按钮 -->
          <div class="relative" ref="archiveContainer">
            <button 
              class="w-full px-2 py-1 rounded bg-indigo-600 text-white text-sm font-bold shadow hover:bg-indigo-500 transition active:scale-90"
              @click="toggleArchive"
              title="Archives"
            >
              💾
            </button>
            <!-- 弹出存档管理面板 -->
            <transition name="fade">
              <div v-if="showArchive" class="absolute top-full right-0 mt-3 z-[300]">
                <ArchivePanel />
              </div>
            </transition>
          </div>
            <!-- 2.音乐按钮 -->
          <div class="relative" ref="musicContainer">
            <button
              class="w-full px-2 py-1 rounded text-white text-sm font-bold shadow transition flex items-center justify-center gap-1"
              :class="musicEnabled ? 'bg-sky-600' : 'bg-gray-600'"
              @click.stop="showMusic = !showMusic"
            >
              <span>{{ musicEnabled ? '🔊' : '🔇' }}</span>
              <!-- 播放时的微小律动 -->
              <div v-if="musicEnabled" class="flex gap-0.5 items-end h-2.5">
                 <div class="w-0.5 bg-white/80 animate-pulse h-1"></div>
                 <div class="w-0.5 bg-white/80 animate-pulse h-2"></div>
              </div>
            </button>
          
            <!-- 音乐面板弹出层 -->
            <transition name="fade">
              <div v-if="showMusic" class="absolute top-full right-0 mt-3 z-[300]">
                <MusicPanel />
              </div>
            </transition>
          </div>
          <!-- 3. 语言切换 -->
          <button class="px-2 py-1 rounded bg-gray-700 text-white text-[10px] font-bold hover:bg-gray-600 transition" @click="toggleLang">
            {{ language === 'zh' ? '中' : 'EN' }}
          </button>

          <!-- 4. 拆除安全锁 -->
          <button 
            class="px-2 py-1 rounded text-white text-sm font-bold shadow transition"
            :class="demolishConfirmEnabled ? 'bg-blue-600 hover:bg-blue-500' : 'bg-red-600 hover:bg-red-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]'"
            @click="toggleDemolishSafety"
            :title="demolishConfirmEnabled ? 'Safety Mode' : 'Quick Mode'"
          >
            {{ demolishConfirmEnabled ? '🛡️' : '💥' }}
          </button>

          <!-- 5. 指南按钮 -->
          <button class="px-2 py-1 rounded bg-emerald-600 text-white text-sm font-bold shadow hover:bg-emerald-500 transition" @click="toggleGuide">
            📖
          </button>

          <!-- 第二行 -->
          <!-- 5. 音乐控制 -->
          <!-- <div class="relative">
            <button
              class="w-full px-2 py-1 rounded text-white text-sm font-bold shadow transition"
              :class="musicEnabled ? 'bg-sky-600 hover:bg-sky-500' : 'bg-gray-600 hover:bg-gray-500'"
              @click="toggleMusic"
              @mouseenter="showVolumeSlider = true"
              @mouseleave="showVolumeSlider = false"
            >
              {{ musicEnabled && isPlayingMusic ? '🔊' : '🔇' }}
            </button>
            <div v-if="showVolumeSlider" class="absolute bottom-full right-0 p-3 bg-gray-800 rounded-lg border border-gray-600 shadow-2xl z-[300] min-w-max">
              <input type="range" min="0" max="1" step="0.1" :value="musicVolume" class="w-24 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-industrial-accent" @input="handleVolumeChange">
            </div>
          </div> -->

          <!-- 6. 地图总览 (占3格) -->
          <button
            class="col-span-3 px-3 py-1 rounded bg-industrial-accent text-gray-900 text-xs font-black shadow hover:brightness-125 transition uppercase tracking-tighter"
            @click="toggleMapOverview"
          >
            {{ language === 'zh' ? '🛰️ 卫星地图' : '🛰️ Satellite Map' }}
          </button>
        </div>
      </div>
    </div>

    <GuideModal :is-visible="showGuide" @close="showGuide = false" />
    <AudioManager />
  </header>
</template>

<style scoped>
.resource-display {
  background: rgba(20, 24, 30, 0.6);
  border: 1px border-gray-700;
  transition: all 0.3s;
}

.warning-pulse {
  animation: warning-pulse 2s ease-in-out infinite;
  border: 1px solid rgba(239, 68, 68, 0.5);
}

@keyframes warning-pulse {
  0% { background: rgba(239, 68, 68, 0.1); }
  50% { background: rgba(239, 68, 68, 0.25); box-shadow: 0 0 15px rgba(239, 68, 68, 0.2); }
  100% { background: rgba(239, 68, 68, 0.1); }
}

/* 弹出框淡入淡出动画 */
.fade-enter-active, .fade-leave-active { transition: all 0.2s ease-out; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-10px); }

.neon-text {
  text-shadow: 0 0 5px currentColor;
}
</style>