<script setup>
import { BUILDING_DATA } from '@/constants/constants.js'
import { useGameState } from '@/stores/useGameState'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

const gameState = useGameState()
// 使用 storeToRefs 保持 metadata 的响应式
const { metadata, selectedPosition, language } = storeToRefs(gameState)

/**
 * 根据格子的状态返回颜色类名
 * 这里的逻辑与游戏逻辑对齐：优先判断 building 字段
 */
function tileClass(tile, x, y) {
  const isSelected = selectedPosition.value?.x === x && selectedPosition.value?.y === y
  let bgColor = 'bg-stone-600' // 默认背景

  if (tile.building) {
    if (tile.building === 'road') {
      bgColor = 'bg-slate-400' // 道路：灰色
    } else {
      // 获取建筑配置，根据 category 分类着色
      const config = BUILDING_DATA[tile.building]
      const category = config?.category
      
      switch (category) {
        case 'residential': bgColor = 'bg-blue-500'; break; // 住宅：蓝色
        case 'commercial':  bgColor = 'bg-yellow-500'; break; // 商业：黄色
        case 'industrial':  bgColor = 'bg-orange-600'; break; // 工业：橙色
        case 'infrastructure': bgColor = 'bg-red-500'; break; // 电力/水利：红色
        case 'public':      bgColor = 'bg-emerald-500'; break; // 公园/公共：绿色
        default:            bgColor = 'bg-sky-400';
      }
    }
  } else {
    // 无建筑时的底色
    if (tile.type === 'grass') bgColor = 'bg-lime-900/50'
    if (tile.type === 'ground') bgColor = 'bg-orange-900/20'
  }

  // 组合样式：基础颜色 + 选中高亮效果
  return [
    bgColor,
    isSelected ? 'ring-2 ring-white z-10 scale-110 shadow-lg shadow-white/50' : 'opacity-90'
  ]
}

/**
 * 获取建筑展示文字或图标
 */
function getTileContent(tile) {
  if (!tile.building) return ''
  if (tile.building === 'road') return '•'
  const found = BUILDING_DATA[tile.building]
  return found ? found.icon : '?'
}

/**
 * 鼠标悬浮提示信息（支持国际化）
 */
function tileTooltip(x, y, tile) {
  const coord = `[${x}, ${y}]`
  if (tile.building === 'road') return `${coord} ${language.value === 'zh' ? '道路' : 'Road'}`
  if (tile.building) {
    const name = BUILDING_DATA[tile.building]?.levels[tile.detail?.level || 1]?.displayName[language.value]
    return `${coord} ${name}`
  }
  return `${coord} ${tile.type === 'grass' ? (language.value === 'zh' ? '草地' : 'Grass') : (language.value === 'zh' ? '空地' : 'Empty')}`
}

/**
 * 点击地图格子同步 3D 选区（交互增强）
 */
function handleTileClick(x, y, tile) {
  if (tile.building) {
    gameState.setSelectedPosition({ x, y })
    gameState.setSelectedBuilding({ type: tile.building, level: tile.detail?.level || 1 })
  } else {
    gameState.clearSelection()
  }
}
</script>

<template>
  <div class="flex flex-col w-full h-full p-2 bg-[#121418] rounded-xl border border-gray-700 shadow-2xl">
    <!-- 标题栏 -->
    <div class="flex justify-between items-center mb-3 px-2">
      <!-- <div class="text-industrial-accent font-black tracking-[0.3em] uppercase text-sm italic">
        Satellite Link Optimized
      </div> -->
      <!-- <div class="text-[10px] text-gray-500 font-mono">
        SCANNING_SECTOR_17x17
      </div> -->
    </div>

    <!-- 地图主网格 -->
    <div class="flex-1 w-full aspect-square grid grid-cols-17 grid-rows-17 gap-[2px] bg-black/40 p-1 rounded-lg border border-gray-800 shadow-inner overflow-hidden">
      <template v-for="(row, x) in metadata" :key="'row-' + x">
        <div
          v-for="(tile, y) in row"
          :key="'tile-' + x + '-' + y"
          class="relative flex items-center justify-center text-[10px] transition-all duration-200 cursor-pointer rounded-sm hover:z-20 hover:scale-125 hover:brightness-125 group"
          :class="tileClass(tile, x, y)"
          :title="tileTooltip(x, y, tile)"
          @click="handleTileClick(x, y, tile)"
        >
          <!-- 建筑图标 -->
          <span class="pointer-events-none select-none drop-shadow-md">
            {{ getTileContent(tile) }}
          </span>

          <!-- 选中时的呼吸边框 -->
          <div 
            v-if="selectedPosition?.x === x && selectedPosition?.y === y" 
            class="absolute inset-0 border border-white animate-pulse rounded-sm"
          />
        </div>
      </template>
    </div>

    <!-- 底部图例 -->
    <div class="mt-4 grid grid-cols-3 gap-y-1 gap-x-4 px-2">
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 bg-blue-500 rounded-sm"></div>
        <span class="text-[9px] text-gray-400 uppercase tracking-tighter">{{ language === 'zh' ? '住宅' : 'RES' }}</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 bg-orange-600 rounded-sm"></div>
        <span class="text-[9px] text-gray-400 uppercase tracking-tighter">{{ language === 'zh' ? '工业' : 'IND' }}</span>
      </div>
      <div class="flex items-center space-x-2">
        <div class="w-2 h-2 bg-red-500 rounded-sm"></div>
        <span class="text-[9px] text-gray-400 uppercase tracking-tighter">{{ language === 'zh' ? '能源' : 'PWR' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-cols-17 {
  grid-template-columns: repeat(17, minmax(0, 1fr));
}
.grid-rows-17 {
  grid-template-rows: repeat(17, minmax(0, 1fr));
}

/* 简单的进入动画 */
.grid-rows-17 > div {
  animation: scanline 0.5s ease-out forwards;
  opacity: 0;
}

@keyframes scanline {
  from { transform: translateY(5px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>