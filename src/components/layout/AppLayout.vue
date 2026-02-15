<script setup>
import { useGameState } from '@/stores/useGameState'
import { storeToRefs } from 'pinia'
const { rightSidebarCollapsed } = storeToRefs(useGameState())
</script>

<template>
  <div class="flex flex-col h-[100dvh] md:h-screen overflow-hidden bg-[#0f1115]">
    <!-- Header -->
    <header class="flex-none z-[110] relative shadow-lg">
      <slot name="header" />
    </header>

    <div class="flex-1 min-h-0 flex flex-row relative overflow-hidden">
      <!-- Left Sidebar -->
      <aside class="w-64 flex-none border-r border-gray-800 z-20 bg-[#14181e] overflow-y-auto custom-scrollbar">
        <slot name="left" />
      </aside>

      <!-- Center Main: flex-1 配合 min-w-0 才能在侧边栏折叠时自动拉伸 -->
      <main class="flex-1 min-h-0 min-w-0 relative bg-black z-10">
        <slot name="main" />
      </main>

      <!-- Right Sidebar Container -->
      <!-- 必须设置 overflow-visible 否则挂在左边的按钮会被切掉 -->
      <aside 
        class="flex-none transition-all duration-300 ease-in-out relative z-30 overflow-visible bg-[#181c24]"
        :style="{ width: rightSidebarCollapsed ? '0px' : '320px' }"
      >
        <slot name="right" />
      </aside>
    </div>

    <!-- Footer -->
    <footer class="flex-none z-[110] relative shadow-2xl">
      <slot name="footer" />
    </footer>

    <!-- Overlays -->
    <div class="fixed inset-0 z-[120] pointer-events-none">
      <slot name="overlays" />
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #14181e; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
</style>