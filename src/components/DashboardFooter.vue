<script setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGameState } from '../stores/useGameState'
import AnimatedNumber from './AnimatedNumber.vue'

const gameState = useGameState()
const { t } = useI18n()
const { buildingCount, dailyIncome, pollution, stability } = storeToRefs(gameState)

// 系统状态数据抽离
const systemStatusList = computed(() => [
  {
    key: 'powerGrid',
    status: 'online',
    colorClass: 'text-industrial-green',
    statusClass: 'status-online',
    label: t('dashboardFooter.online'),
  },
  {
    key: 'transport',
    status: 'limited',
    colorClass: 'text-industrial-yellow',
    statusClass: 'status-warning',
    label: t('dashboardFooter.limited'),
  },
  {
    key: 'security',
    status: 'secure',
    colorClass: 'text-industrial-green',
    statusClass: 'status-online',
    label: t('dashboardFooter.secure'),
  },
  {
    key: 'environment',
    status: 'moderate',
    colorClass: 'text-industrial-yellow',
    statusClass: 'status-warning',
    label: t('dashboardFooter.moderate'),
  },
])
</script>

<template>
  <!-- 布局改为 grid-cols-2 -->
  <div class="grid grid-cols-2 gap-0">
    <!-- 左侧统计：城市指标 -->
    <div class="dashboard-card p-4 z-10 border-r border-gray-700/50">
      <h3 class="text-sm font-bold text-industrial-accent uppercase tracking-wide mb-3 neon-text">
        {{ t('dashboardFooter.cityMetrics') }}
      </h3>
      <div class="grid grid-cols-4 gap-2 mt-4"> <!-- 改为 4 列横向排布更加美观 -->
        <div class="text-center">
          <div class="text-2xl font-bold text-industrial-green neon-text">
            <AnimatedNumber :value="buildingCount" :duration="2" />
          </div>
          <div class="text-[10px] text-gray-400 uppercase tracking-wider">
            {{ t('dashboardFooter.buildings') }}
          </div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-industrial-blue neon-text">
            +<AnimatedNumber :value="dailyIncome" :duration="2" separator="," />
          </div>
          <div class="text-[10px] text-gray-400 uppercase tracking-wider">
            {{ t('dashboardFooter.dailyIncome') }}
          </div>
        </div>
        <div class="text-center">
          <div
            class="text-2xl font-bold neon-text"
            :class="pollution > 100 ? 'text-red-500' : 'text-industrial-yellow'"
          >
            <AnimatedNumber :value="pollution" :duration="2" />
          </div>
          <div class="text-[10px] text-gray-400 uppercase tracking-wider">
            {{ t('dashboardFooter.efficiency') }}
          </div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-industrial-green neon-text">
            <AnimatedNumber :value="stability" :duration="2" />%
          </div>
          <div class="text-[10px] text-gray-400 uppercase tracking-wider">
            {{ t('dashboardFooter.stability') }}
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧统计：系统状态 -->
    <div class="dashboard-card p-4 z-10">
      <h3 class="text-sm font-bold text-industrial-accent uppercase tracking-wide mb-3 neon-text">
        {{ t('dashboardFooter.systemStatus') }}
      </h3>
      <div class="grid grid-cols-2 gap-x-8 gap-y-3 mt-2 px-4">
        <div
          v-for="item in systemStatusList"
          :key="item.key"
          class="flex items-center space-x-3"
        >
          <!-- 图标容器 -->
          <div class="w-9 h-9 flex-shrink-0 rounded-full border border-orange-400/30 flex items-center justify-center bg-black/20">
            <!-- 电网图标 -->
            <svg
              v-if="item.key === 'powerGrid'"
              class="w-4 h-4 text-yellow-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5.293l6.293-6.293a1 1 0 011.414 1.414L13.414 8.707H18a1 1 0 01.951 1.317l-8 10a1 1 0 01-1.902-.434V10.707L2.707 17.001a1 1 0 01-1.414-1.414L7.586 9.293V4a1 1 0 01.707-1.707l3-1.5z" clip-rule="evenodd" />
            </svg>
            <!-- 运输图标 -->
            <svg
              v-else-if="item.key === 'transport'"
              class="w-4 h-4"
              :class="item.colorClass"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path fill-rule="evenodd" d="M17 8V6a2 2 0 00-2-2H3a2 2 0 00-2 2v8a2 2 0 002 2h1.532a2.5 2.5 0 014.936 0h2.064a2.5 2.5 0 014.936 0H17a2 2 0 002-2v-2.143a2 2 0 00-1-1.732L17 8zM15 10a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm-6 0a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            <!-- 安全图标 -->
            <svg
              v-else-if="item.key === 'security'"
              class="w-4 h-4"
              :class="item.colorClass"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fill-rule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944z" clip-rule="evenodd" />
            </svg>
            <!-- 环境图标 -->
            <svg
              v-else-if="item.key === 'environment'"
              class="w-4 h-4"
              :class="item.colorClass"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.74 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.527-1.973 6.012 6.012 0 011.912 2.706 6.043 6.043 0 01-2.122 7.232A4.5 4.5 0 0012.5 16a4.5 4.5 0 00-1.066-3.093A6.043 6.043 0 014.332 8.027z" clip-rule="evenodd" />
            </svg>
          </div>
          <!-- 文字状态 -->
          <div>
            <div class="text-[10px] text-blue-300 uppercase tracking-tighter">
              {{ t(`dashboardFooter.${item.key}`) }}
            </div>
            <div class="text-xs font-bold uppercase" :class="item.colorClass">
              {{ item.label }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 保持原有样式，若需要两列平分，Grid 已经处理 */
.dashboard-card {
  position: relative;
  background: rgba(20, 24, 30, 0.4);
}
</style>