<!-- src/components/BuildingDetails.vue -->
<script setup>
import { eventBus } from '@/js/utils/event-bus.js'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { BUILDING_DATA } from '../constants/constants'
import { useGameState } from '../stores/useGameState'
import { storeToRefs } from 'pinia' // 必须引入 storeToRefs 保证响应式
import BuildingDetail from './BuildingDetail.vue'
import EmptyState from './EmptyState.vue'

const { t } = useI18n()
const gameState = useGameState()

// 核心：使用 storeToRefs 确保 rightSidebarCollapsed 的改变能被 Vue 监听到
const { selectedBuilding, currentMode, selectedPosition, rightSidebarCollapsed } = storeToRefs(gameState)

const building = computed(() => {
  if (!selectedBuilding.value) return {}
  const { type, level } = selectedBuilding.value
  const base = BUILDING_DATA[type] || {}
  return { ...base, ...base.levels?.[level], level }
})

/**
 * 切换侧边栏状态
 * @param {MouseEvent} e 
 */
const handleToggle = (e) => {
  // 1. 彻底阻止事件冒泡，防止 3D 场景感知到点击
  e.stopPropagation()
  e.preventDefault()
  
  // 2. 调用 Store 中的切换动作
  gameState.toggleRightSidebar()
  
  // 3. 调试日志：如果图标不换，请按 F12 查看控制台输出的状态
  console.log('Sidebar Collapsed State:', gameState.rightSidebarCollapsed)
}

// 按钮动作
const upgradeBuilding = () => eventBus.emit('ui:confirm-action', { action: 'upgrade', buildingType: selectedBuilding.value.type, buildingLevel: selectedBuilding.value.level })
const repairBuilding = () => eventBus.emit('ui:confirm-action', { action: 'repair', buildingType: selectedBuilding.value.type, buildingLevel: selectedBuilding.value.level })
const demolishBuilding = () => eventBus.emit('ui:confirm-action', { action: 'demolish', buildingType: selectedBuilding.value.type, buildingLevel: selectedBuilding.value.level })
</script>

<template>
  <!-- 容器必须 overflow-visible 保证按钮可见 -->
  <div class="h-full relative overflow-visible pointer-events-none">
    
    <!-- 
      折叠按钮：
      1. 使用 pointer-events-auto 恢复点击。
      2. 使用 z-[200] 置于最顶层。
    -->
    <button
      @click.stop.prevent="handleToggle"
      class="absolute top-1/2 -left-6 transform -translate-y-1/2 w-6 h-28 bg-[#1a1f26] border border-gray-600 border-r-0 rounded-l-xl flex items-center justify-center text-industrial-accent hover:text-white transition-all z-[200] pointer-events-auto shadow-[-4px_0_12px_rgba(0,0,0,0.8)]"
    >
      <!-- 
        核心图标切换逻辑：
        当 rightSidebarCollapsed 为 true (已折叠)，显示 '<' 提示拉开
        当 rightSidebarCollapsed 为 false (展开中)，显示 '>' 提示推回
      -->
      <span class="text-2xl font-black select-none">
        {{ rightSidebarCollapsed ? '<' : '>' }}
      </span>
    </button>

    <!-- 
      内容层：
      使用 translate-x-full 实现侧滑退出，并在折叠时透明度设为 0
    -->
    <aside 
      class="industrial-panel shadow-industrial h-full w-[320px] bg-[#181c24] flex flex-col transition-all duration-300 ease-in-out pointer-events-auto border-l border-gray-800"
      :class="[rightSidebarCollapsed ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100']"
    >
      <div class="p-4 h-full flex flex-col">
        <h2 class="text-lg font-bold text-industrial-accent uppercase tracking-wide mb-4 border-b border-gray-600 pb-2 neon-text">
          <span class="neon-text">{{ t('buildingDetails.unitDetails') }}</span>
        </h2>
        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <!-- 只有在未折叠且有选中时才渲染详情 -->
          <EmptyState v-if="!selectedBuilding" :current-mode="currentMode" />
          <BuildingDetail
            v-else
            :building="building"
            :selected-position="selectedPosition"
            :current-mode="currentMode"
            @upgrade="upgradeBuilding"
            @repair="repairBuilding"
            @demolish="demolishBuilding"
          />
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* 梯形手柄按钮形状 */
button {
  clip-path: polygon(15% 0, 100% 0, 100% 100%, 15% 100%, 0 85%, 0 15%);
}

.custom-scrollbar::-webkit-scrollbar { width: 6px; background: #18181b; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #4a4a4a; border-radius: 3px; }
.neon-text { text-shadow: 0 0 10px rgba(255, 184, 0, 0.6); }
</style>