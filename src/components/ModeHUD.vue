<!-- src/components/ModeHUD.vue -->
<script setup>
import { useGameState } from '@/stores/useGameState.js'
import { eventBus } from '@/js/utils/event-bus.js'
import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue'

const gameState = useGameState()
const modes = [
  { id: 'select', icon: '🔍' }, 
  { id: 'build', icon: '🏗️' }, 
  { id: 'relocate', icon: '🚧' }, 
  { id: 'demolish', icon: '💥' }
]

const currentMode = computed(() => gameState.currentMode)
const isDemolishSafe = computed(() => gameState.demolishConfirmEnabled)

const hudRef = ref(null)
const isDragging = ref(false)

// 初始值给一个大概的居中位置，防止计算失败时消失
const position = ref({ x: window.innerWidth / 2 - 100, y: 12 })
const dragOffset = ref({ x: 0, y: 0 })

function resetToCenter() {
  if (!hudRef.value) return
  const hudWidth = hudRef.value.offsetWidth
  position.value.x = (window.innerWidth / 2) - (hudWidth / 2)
  position.value.y = 12 // 确保在顶栏高度范围内
}

function startDrag(e) {
  isDragging.value = true
  dragOffset.value = { x: e.clientX - position.value.x, y: e.clientY - position.value.y }
  window.addEventListener('mousemove', onDragging)
  window.addEventListener('mouseup', stopDrag)
}

function onDragging(e) {
  if (!isDragging.value) return
  position.value = { x: e.clientX - dragOffset.value.x, y: e.clientY - dragOffset.value.y }
}

function stopDrag() { 
  isDragging.value = false
  window.removeEventListener('mousemove', onDragging)
}

function setMode(id) {
  if (isDragging.value) return
  if (currentMode.value === id && id === 'demolish') {
    gameState.demolishConfirmEnabled = !gameState.demolishConfirmEnabled
    // const msg = gameState.demolishConfirmEnabled ? '🛡️ Safe Mode' : '💥 Quick Mode'
    // eventBus.emit('toast:add', { message: msg, type: gameState.demolishConfirmEnabled ? 'info' : 'warning', duration: 1500 })
    const msg = gameState.language === 'zh'
      ? (isSafe ? '🛡️ 拆除确认已开启 (安全)' : '💥 快速拆除模式已开启 (快速)')
      : (isSafe ? '🛡️ Demolish Confirm: ON' : '💥 Quick Demolish: ON')
    eventBus.emit('toast:add', { message: msg, type: isSafe ? 'info' : 'warning', duration: 500 })
    // gameState.addToast(msg, isSafe ? 'info' : 'warning', 1500)
  } else { 
    gameState.setMode(id) 
  }
}

onMounted(async () => {
  await nextTick()
  setTimeout(resetToCenter, 100) // 延迟 100ms 确保 DOM 完全计算宽度
  window.addEventListener('resize', resetToCenter)
})

onUnmounted(() => {
  window.removeEventListener('resize', resetToCenter)
  window.removeEventListener('mousemove', onDragging)
  window.removeEventListener('mouseup', stopDrag)
})
</script>

<template>
  <div 
    ref="hudRef"
    class="fixed flex items-center bg-[#181c24]/95 backdrop-blur-md border-2 border-gray-600 rounded-2xl shadow-2xl transition-opacity duration-500"
    :style="{ 
      left: position.x + 'px', 
      top: position.y + 'px', 
      zIndex: 9999, /* 强制最高层级 */
      opacity: position.x === 0 ? 0 : 1 /* 计算出坐标前先隐藏 */
    }"
  >
    <!-- 拖拽手柄 -->
    <div 
      class="w-6 h-12 flex flex-col justify-center items-center gap-1 cursor-grab active:cursor-grabbing border-r border-gray-700 px-1" 
      @mousedown.stop="startDrag"
    >
      <div v-for="i in 3" :key="i" class="w-1 h-1 bg-gray-500 rounded-full" />
    </div>

    <!-- 模式按钮 -->
    <div class="flex items-center gap-2 p-1.5 px-3">
      <button 
        v-for="m in modes" 
        :key="m.id" 
        @click.stop="setMode(m.id)" 
        class="relative p-2 rounded-xl transition-all" 
        :class="[currentMode === m.id ? (m.id === 'demolish' && !isDemolishSafe ? 'bg-red-600' : 'bg-[#ffbb00]') : 'hover:bg-gray-700']"
      >
        <span class="text-xl select-none">{{ m.icon }}</span>
        <!-- 快速模式红点 -->
        <div v-if="m.id === 'demolish' && !isDemolishSafe" class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white rounded-full animate-pulse border-2 border-red-600" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 确保背景色正确 */
.bg-industrial-accent { background-color: #ffbb00; }
</style>