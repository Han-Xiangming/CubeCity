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

function handleKeydown(e) {
  // 1. 排除输入框，防止打字时触发
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

  // 2. 映射 1, 2, 3 到对应模式
  const modeMap = { 
    '1': 'select', 
    '2': 'build', 
    '3': 'relocate' 
  }

  // 处理 1, 2, 3 键
  if (modeMap[e.key]) {
    gameState.setMode(modeMap[e.key])
    return
  }

  // 3. 核心：处理 4 号键 (拆除模式 + 模式切换)
  if (e.key === '4') {
    if (gameState.currentMode === 'demolish') {
      // 如果当前已经是拆除模式，则切换“确认开关”
      gameState.demolishConfirmEnabled = !gameState.demolishConfirmEnabled
      
      // 发送反馈提示
      const isSafe = gameState.demolishConfirmEnabled
      const msg = gameState.language === 'zh'
        ? (isSafe ? '🛡️ 拆除确认已开启 (安全)' : '💥 快速拆除模式已开启 (快速)')
        : (isSafe ? '🛡️ Demolish Confirm: ON' : '💥 Quick Demolish: ON')
      
      gameState.addToast(msg, isSafe ? 'info' : 'warning', 1500)
    } else {
      // 如果当前不是拆除模式，则进入拆除模式
      gameState.setMode('demolish')
      const msg = gameState.language === 'zh' ? '进入拆除模式' : 'Demolish Mode'
      gameState.addToast(msg, 'info', 1000)
    }
    return
  }

  // 4. 其他快捷键保持不变
  if (e.key.toLowerCase() === 'i') {
    gameState.toggleRightSidebar()
  }
  
  if (e.key === 'Escape') {
    gameState.setShowMapOverview(false)
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
        <ModeHUD />
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