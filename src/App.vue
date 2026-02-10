<script setup>
import { useGameState } from '@/stores/useGameState.js'
import { onMounted, onUnmounted } from 'vue'
import BuildingDetails from './components/BuildingDetails.vue'
import BuildingSidebar from './components/BuildingSidebar.vue'
import DashboardFooter from './components/DashboardFooter.vue'
import GameCanvas from './components/GameCanvas.vue'
import DialogLayer from './components/layers/DialogLayer.vue'
import AppLayout from './components/layout/AppLayout.vue'
import MapOverview from './components/MapOverview.vue'
import ModeIndicator from './components/ModeIndicator.vue'
import RestorePrompt from './components/RestorePrompt.vue'
import SelectedIndicator from './components/SelectedIndicator.vue'
import ToastContainer from './components/ToastContainer.vue'
import TopBar from './components/TopBar.vue'
import ModeHUD from './components/ModeHUD.vue' // 引入 HUD

const gameState = useGameState()

// 时间管理
let dayInterval = null
let isPaused = false

function handleVisibilityChange() {
  if (document.hidden && !isPaused) {
    if (dayInterval) {
      clearInterval(dayInterval)
      isPaused = true
    }
  }
  else if (!document.hidden && isPaused) {
    startDayTimer()
    isPaused = false
  }
}

function startDayTimer() {
  if (dayInterval) clearInterval(dayInterval)
  dayInterval = setInterval(() => {
    gameState.nextDay()
  }, 5000)
}

// 键盘事件处理：ESC 关闭地图 + 全局快捷键切换模式
function handleKeydown(e) {
  // ESC 处理
  if (gameState.showMapOverview && (e.key === 'Escape' || e.key === 'Esc')) {
    gameState.setShowMapOverview(false)
    return
  }

  // 防止在输入框内触发快捷键
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

  // 模式快捷键映射
  const keyMap = {
    '1': 'select', 'q': 'select',
    '2': 'build',  'w': 'build',
    '3': 'relocate','e': 'relocate',
    '4': 'demolish','r': 'demolish'
  }

  const targetMode = keyMap[e.key.toLowerCase()]
  if (targetMode) {
    gameState.setMode(targetMode)
    // 增加一个微小的 Toast 提示方便感知
    const modeNames = { zh: { select:'选择', build:'建造', relocate:'搬迁', demolish:'拆除' }, en: { select:'Select', build:'Build', relocate:'Move', demolish:'Demolish' } }
    const lang = gameState.language === 'zh' ? 'zh' : 'en'
    gameState.addToast(`${modeNames[lang][targetMode]} Mode`, 'info')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  startDayTimer()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (dayInterval) clearInterval(dayInterval)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})
</script>

<template>
  <AppLayout>
    <template #header>
      <TopBar />
    </template>

    <template #left>
      <BuildingSidebar />
    </template>

    <template #main>
      <ModeIndicator />
      <GameCanvas />
      <!-- 方案三：悬浮模式工具栏 -->
      <ModeHUD />
      <SelectedIndicator />
    </template>

    <template #right>
      <BuildingDetails />
    </template>

    <template #footer>
      <DashboardFooter />
    </template>

    <template #overlays>
      <div class="pointer-events-auto">
        <RestorePrompt />
      </div>

      <div class="pointer-events-auto">
        <transition name="fade">
          <div
            v-if="gameState.showMapOverview"
            class="absolute top-[20%] right-[50%] translate-x-[50%] w-[min(90vw,600px)] h-[min(90vh,600px)] z-50 bg-[#212121] rounded-lg shadow-lg p-2"
            @contextmenu.prevent="gameState.setShowMapOverview(false)"
          >
            <button
              class="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full text-xl font-bold text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-150 focus:outline-none z-10"
              @click="gameState.setShowMapOverview(false)"
            >
              ❌
            </button>
            <MapOverview />
          </div>
        </transition>
      </div>

      <div class="pointer-events-auto">
        <ToastContainer />
      </div>
      <DialogLayer />
    </template>
  </AppLayout>
</template>

<style>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>