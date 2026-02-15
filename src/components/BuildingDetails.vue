<script setup>
import { eventBus } from '@/js/utils/event-bus.js'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { BUILDING_DATA } from '../constants/constants'
import { useGameState } from '../stores/useGameState'
import { storeToRefs } from 'pinia'
import BuildingDetail from './BuildingDetail.vue'
import EmptyState from './EmptyState.vue'

const { t } = useI18n()
const gameState = useGameState()

// 响应式解构：确保所有在 template 中使用的状态都来自这里
const { selectedBuilding, currentMode, selectedPosition, rightSidebarCollapsed } = storeToRefs(gameState)

const building = computed(() => {
  if (!selectedBuilding.value) return {}
  const { type, level } = selectedBuilding.value
  const base = BUILDING_DATA[type] || {}
  const levelData = base.levels?.[level] || {}
  return { ...base, ...levelData, level }
})

const handleToggle = (e) => {
  e.stopPropagation()
  e.preventDefault()
  gameState.toggleRightSidebar()
}

// 按钮功能函数
const upgradeBuilding = () => eventBus.emit('ui:confirm-action', { action: 'upgrade', buildingType: selectedBuilding.value.type, buildingLevel: selectedBuilding.value.level })
const repairBuilding = () => eventBus.emit('ui:confirm-action', { action: 'repair', buildingType: selectedBuilding.value.type, buildingLevel: selectedBuilding.value.level })
const demolishBuilding = () => eventBus.emit('ui:confirm-action', { action: 'demolish', buildingType: selectedBuilding.value.type, buildingLevel: selectedBuilding.value.level })
</script>

<template>
  <div class="sidebar-wrapper h-full relative overflow-visible pointer-events-none">
    
    <!-- === 精制折叠按钮 === -->
    <button
      @click.stop.prevent="handleToggle"
      class="mini-sidebar-toggle group pointer-events-auto"
      :class="{ 'is-collapsed': rightSidebarCollapsed }"
    >
      <!-- 指示灯 -->
      <div 
        class="mini-led" 
        :class="rightSidebarCollapsed ? 'led-blink' : 'led-on'" 
      />

      <!-- 纤细箭头图标 -->
      <svg class="mini-arrow" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 7L15 12L10 17" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>

      <!-- 防滑纹 -->
      <div class="grip-lines">
        <div v-for="i in 3" :key="i" class="line"></div>
      </div>
    </button>

    <!-- 侧边栏内容层 -->
    <aside 
      class="details-container shadow-industrial h-full w-[300px] bg-[#181c24]/95 backdrop-blur-md flex flex-col pointer-events-auto border-l border-gray-800"
      :class="[rightSidebarCollapsed ? 'is-hidden' : 'is-visible']"
    >
      <div class="p-4 h-full flex flex-col">
        <!-- 侧边栏标题 -->
        <div class="flex items-center gap-2 mb-3 border-b border-gray-800 pb-2">
          <div class="w-1 h-3 bg-industrial-accent shadow-[0_0_5px_#ffbb00]" />
          <h2 class="text-sm font-black text-industrial-accent uppercase tracking-tighter italic">
            {{ t('buildingDetails.unitDetails') }}
          </h2>
        </div>
        
        <!-- 内容区域 -->
        <div class="flex-1 overflow-y-auto custom-scrollbar">
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
/* 按钮容器：更小、更精致 */
.mini-sidebar-toggle {
  position: absolute;
  top: 50%;
  left: -20px;
  transform: translateY(-50%);
  width: 20px;
  height: 64px;
  background: #1a1f26;
  border: 1px solid #374151;
  border-right: none;
  border-radius: 8px 0 0 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  z-index: 200;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: -4px 0 10px rgba(0, 0, 0, 0.4);
  color: #6b7280;
  opacity: 0.8;
  clip-path: polygon(0 15%, 100% 0, 100% 100%, 0 85%);
}

.mini-sidebar-toggle:hover {
  width: 24px;
  left: -24px;
  color: #ffbb00;
  opacity: 1;
  background: #20262e;
}

/* 状态 LED */
.mini-led {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #374151;
  transition: all 0.3s;
}
.led-on {
  background: #ffbb00;
  box-shadow: 0 0 5px #ffbb00;
}
.led-blink {
  animation: led-flash 2s infinite;
}
@keyframes led-flash {
  0%, 100% { background: #374151; box-shadow: none; }
  50% { background: #ffbb00; box-shadow: 0 0 6px #ffbb00; }
}

/* 箭头旋转控制 */
.mini-arrow {
  width: 16px;
  height: 16px;
  transition: transform 0.4s ease;
}
.is-collapsed .mini-arrow {
  transform: rotate(180deg);
}

/* 防滑纹路 */
.grip-lines {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.line {
  width: 8px;
  height: 1px;
  background: currentColor;
  opacity: 0.3;
}

/* 侧边栏容器动画逻辑 */
.details-container {
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.is-hidden {
  transform: translateX(100%);
  opacity: 0;
}
.is-visible {
  transform: translateX(0);
  opacity: 1;
}

/* 滚动条美化 */
.custom-scrollbar::-webkit-scrollbar { width: 4px; background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ffbb00; }

.shadow-industrial {
  box-shadow: -10px 0 30px rgba(0,0,0,0.5);
}
</style>