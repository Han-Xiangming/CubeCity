<!-- src/components/ModeHUD.vue -->
<script setup>
import { useGameState } from '@/stores/useGameState.js'
import { eventBus } from '@/js/utils/event-bus.js' // 引入事件总线用于发送 Toast
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'

const gameState = useGameState()

const modes = [
  { id: 'select', icon: '🔍' },
  { id: 'build', icon: '🏗️' },
  { id: 'relocate', icon: '🚧' },
  { id: 'demolish', icon: '💥' }
]

const currentMode = computed(() => gameState.currentMode)
// 获取全局拆除确认状态
const isDemolishSafe = computed(() => gameState.demolishConfirmEnabled)

// --- 拖拽逻辑状态 ---
const hudRef = ref(null)
const isDragging = ref(false)
const position = ref({ x: 0, y: 0 })
const dragOffset = ref({ x: 0, y: 0 })

function resetToDefaultPosition() {
  const hudWidth = hudRef.value?.offsetWidth || 220
  position.value = {
    x: (window.innerWidth / 2) - (hudWidth / 2),
    y: 80 
  }
}

// 开始拖拽
function startDrag(e) {
  isDragging.value = true
  dragOffset.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
  window.addEventListener('mousemove', onDragging)
  window.addEventListener('mouseup', stopDrag)
}

function onDragging(e) {
  if (!isDragging.value) return
  let newX = e.clientX - dragOffset.value.x
  let newY = e.clientY - dragOffset.value.y
  const hudWidth = hudRef.value?.offsetWidth || 220
  const hudHeight = hudRef.value?.offsetHeight || 60
  newX = Math.max(10, Math.min(newX, window.innerWidth - hudWidth - 10))
  newY = Math.max(10, Math.min(newY, window.innerHeight - hudHeight - 10))
  position.value = { x: newX, y: newY }
}

function stopDrag() {
  isDragging.value = false
  window.removeEventListener('mousemove', onDragging)
  window.removeEventListener('mouseup', stopDrag)
}

/**
 * 核心修改：处理模式切换与拆除模式状态切换
 */
function setMode(modeId) {
  if (isDragging.value) return 

  // 如果点击的是当前已经选中的模式
  if (gameState.currentMode === modeId) {
    // 如果是拆除模式，则切换“快速/确认”状态
    if (modeId === 'demolish') {
      gameState.demolishConfirmEnabled = !gameState.demolishConfirmEnabled
      
      // 发送 Toast 提示
      const isSafe = gameState.demolishConfirmEnabled
      const msg = gameState.language === 'zh' 
        ? (isSafe ? '🛡️ 拆除确认已开启 (安全)' : '💥 快速拆除模式已开启 (危险)')
        : (isSafe ? '🛡️ Demolish Confirm: ON' : '💥 Quick Demolish: ON')
      
      eventBus.emit('toast:add', { 
        message: msg, 
        type: isSafe ? 'info' : 'warning' ,
        duration: 1200
      })
    }
    return
  }

  // 否则，正常切换模式
  gameState.setMode(modeId)
}

function handleResize() {
  const hudWidth = hudRef.value?.offsetWidth || 220
  if (Math.abs(position.value.x - (window.innerWidth / 2 - hudWidth / 2)) < 50) {
     resetToDefaultPosition()
  } else {
     position.value.x = Math.max(10, Math.min(position.value.x, window.innerWidth - hudWidth - 10))
  }
}

onMounted(async () => {
  window.addEventListener('resize', handleResize)
  await nextTick()
  resetToDefaultPosition()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', onDragging)
  window.removeEventListener('mouseup', stopDrag)
})
</script>

<template>
  <div 
    ref="hudRef"
    class="fixed z-40 flex items-center bg-[#181c24]/90 backdrop-blur-md border-2 border-gray-700 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
    :class="{ 'border-gray-500 cursor-grabbing': isDragging }"
    :style="{ left: position.x + 'px', top: position.y + 'px' }"
  >
    <!-- 拖拽手柄 -->
    <div 
      class="w-6 h-12 flex flex-col justify-center items-center gap-1 cursor-grab active:cursor-grabbing border-r border-gray-700/50 hover:bg-white/5 rounded-l-2xl px-1"
      @mousedown.stop="startDrag"
    >
      <div v-for="i in 3" :key="i" class="w-1 h-1 bg-gray-500 rounded-full" />
    </div>

    <!-- 模式按钮 -->
    <div class="flex items-center gap-2 p-2 px-3">
      <button
        v-for="mode in modes"
        :key="mode.id"
        @click="setMode(mode.id)"
        class="group relative flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-200"
        :class="[
          currentMode === mode.id 
            ? (mode.id === 'demolish' && !isDemolishSafe ? 'bg-red-600' : 'bg-industrial-accent') + ' scale-110 shadow-lg'
            : 'hover:bg-gray-700 active:scale-95'
        ]"
      >
        <span class="text-xl select-none">{{ mode.icon }}</span>
        
        <!-- 动态提示文字 -->
        <span class="absolute -bottom-10 scale-0 group-hover:scale-100 transition-transform bg-gray-800 text-white text-[10px] py-1 px-2 rounded border border-gray-600 pointer-events-none whitespace-nowrap uppercase">
          {{ mode.id }} 
          <template v-if="mode.id === 'demolish'">
            ({{ isDemolishSafe ? 'Safe' : 'Quick' }})
          </template>
        </span>

        <!-- 快速模式的小指示红点 -->
        <div 
          v-if="mode.id === 'demolish' && !isDemolishSafe" 
          class="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-red-600 animate-pulse"
        />
      </button>
    </div>
  </div>
</template>

<style scoped>
.fixed {
  user-select: none;
  touch-action: none;
}

/* 默认选中颜色：黄色系 */
.bg-industrial-accent {
  background-color: #ffbb00;
  animation: hud-pulse-yellow 2s infinite ease-in-out;
}

/* 快速拆除选中颜色：红色系 */
.bg-red-600 {
  animation: hud-pulse-red 1s infinite ease-in-out;
}

@keyframes hud-pulse-yellow {
  0%, 100% { box-shadow: 0 0 8px rgba(255,187,0,0.4); }
  50% { box-shadow: 0 0 16px rgba(255,187,0,0.7); }
}

@keyframes hud-pulse-red {
  0%, 100% { box-shadow: 0 0 8px rgba(220,38,38,0.4); }
  50% { box-shadow: 0 0 20px rgba(220,38,38,0.8); }
}
</style>