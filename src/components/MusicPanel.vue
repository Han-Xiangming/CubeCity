<script setup>
import { useGameState } from '@/stores/useGameState'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { watch, ref, nextTick, onMounted } from 'vue'

const { t } = useI18n()
const gameState = useGameState()

const { 
  trackList, 
  currentTrackIndex, 
  musicEnabled, 
  musicLoopMode, 
  musicCurrentTime, 
  musicDuration, 
  musicVolume 
} = storeToRefs(gameState)

const playlistRef = ref(null)

// 格式化时间 (秒 -> 00:00)
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

// 自动滚动逻辑：确保选中的曲目可见
const scrollToActive = () => {
  nextTick(() => {
    const activeItem = playlistRef.value?.querySelector('.active-track')
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  })
}

watch(currentTrackIndex, scrollToActive)
onMounted(scrollToActive)

const handleSeek = (e) => {
  const time = parseFloat(e.target.value)
  const audioEl = document.getElementById('main-audio')
  if (audioEl) audioEl.currentTime = time
}

const handlePlayTrack = (index) => {
  gameState.playTrack(index)
}
</script>

<template>
  <div class="music-panel p-4 bg-[#1a1f26]/95 backdrop-blur-md border-2 border-gray-600 rounded-xl w-80 shadow-[0_20px_60px_rgba(0,0,0,0.6)] select-none">
    <!-- 标题栏 -->
    <div class="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
      <h3 class="text-industrial-accent font-black uppercase text-[10px] tracking-[0.2em]">
        {{ t('music.title') }}
      </h3>
      <div class="flex items-center gap-2 font-mono text-[8px] text-gray-500">
        <span class="animate-pulse text-industrial-green">●</span>
        <span>LIVE_LINK_ESTABLISHED</span>
      </div>
    </div>

    <!-- 播放器主卡片 -->
    <div class="mb-4 p-4 bg-gradient-to-br from-black/80 to-[#1e232b] rounded-lg border border-white/5 shadow-inner">
      <div class="flex justify-between items-start mb-4">
        <div class="truncate flex-1">
          <span class="text-[7px] text-industrial-blue/80 font-bold uppercase tracking-widest block mb-1">
            Signal Input
          </span>
          <div class="text-sm font-black text-white truncate leading-none mb-1">
            {{ trackList[currentTrackIndex]?.title || 'NO SIGNAL' }}
          </div>
          <div class="text-[9px] text-gray-500 font-mono flex items-center gap-1">
            <span class="w-1.5 h-1.5 bg-gray-700 rounded-full inline-block"></span>
            {{ trackList[currentTrackIndex]?.artist || 'Unknown source' }}
          </div>
        </div>

        <!-- 律动条 -->
        <div class="flex gap-0.5 h-5 items-end">
          <div v-for="i in 4" :key="i" 
               class="w-0.5 bg-industrial-accent" 
               :class="{ 'animate-music-pulse': musicEnabled }"
               :style="{ animationDelay: `${i * 0.1}s`, height: !musicEnabled ? '2px' : '' }">
          </div>
        </div>
      </div>

      <!-- 进度条 -->
      <div class="relative">
        <input 
          type="range" min="0" :max="musicDuration || 100" :value="musicCurrentTime" @input="handleSeek" 
          class="music-range-input w-full h-1 rounded-full cursor-pointer"
        >
        <div class="flex justify-between text-[8px] font-mono text-gray-500 mt-1">
          <span :class="{ 'text-industrial-blue': musicEnabled }">{{ formatTime(musicCurrentTime) }}</span>
          <span>{{ formatTime(musicDuration) }}</span>
        </div>
      </div>
    </div>

    <!-- 交互控制 -->
    <div class="grid grid-cols-4 gap-2 mb-4">
      <button @click="gameState.toggleMusic()" class="col-span-2 py-2 bg-gray-700/50 hover:bg-gray-600 text-white font-bold rounded-md transition-all active:scale-95 flex items-center justify-center gap-2 text-[10px]">
        <span>{{ musicEnabled ? '⏸' : '▶' }}</span>
        {{ musicEnabled ? 'STOP' : 'RUN' }}
      </button>
      <button @click="gameState.toggleMusicLoopMode()" class="py-2 bg-black/20 border border-white/5 rounded-md hover:bg-white/5 transition-all text-sm flex items-center justify-center">
        <span :class="{'text-industrial-blue': musicLoopMode === 'one'}">{{ musicLoopMode === 'all' ? '🔁' : '🔂' }}</span>
      </button>
      <button @click="gameState.nextTrack()" class="py-2 bg-blue-900/20 text-blue-400 border border-blue-900/30 rounded-md hover:bg-blue-600 hover:text-white transition-all text-sm flex items-center justify-center">
        ⏭
      </button>
    </div>

    <!-- 音量调节 -->
    <div class="flex items-center gap-3 mb-6 px-1 group">
      <span class="text-[10px] opacity-40 group-hover:opacity-100 transition-opacity">🔈</span>
      <input type="range" min="0" max="1" step="0.01" v-model="gameState.musicVolume" class="music-range-input flex-1 h-0.5">
      <span class="text-[9px] font-mono text-gray-500 w-8 text-right font-bold">
        {{ Math.round(musicVolume * 100) }}%
      </span>
    </div>

    <!-- 完整的播放列表 -->
    <div class="playlist-section flex flex-col h-64 border-t border-gray-800 pt-3">
      <div class="flex justify-between px-2 mb-2 text-[7px] font-black text-gray-600 uppercase tracking-[0.2em]">
        <span>#  Track Name</span>
        <span>Length</span>
      </div>
      
      <div 
        ref="playlistRef"
        class="flex-1 overflow-y-auto custom-scrollbar pr-1"
      >
        <div v-if="trackList.length === 0" class="text-center py-10 text-[10px] text-gray-600 italic">
          No tracks found in library...
        </div>

        <div 
          v-for="(track, index) in trackList" 
          :key="track.id"
          @click="handlePlayTrack(index)"
          class="track-item group relative mb-0.5 p-2 rounded cursor-pointer transition-all flex items-center justify-between border border-transparent"
          :class="currentTrackIndex === index 
            ? 'active-track bg-industrial-blue/10 text-industrial-blue border-industrial-blue/20' 
            : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'"
        >
          <!-- 播放指示器 -->
          <div class="flex items-center gap-3 overflow-hidden z-10">
            <div class="w-4 flex justify-center text-[9px] font-mono">
              <div v-if="currentTrackIndex === index && musicEnabled" class="flex gap-0.5 items-end h-2.5">
                 <div v-for="i in 3" :key="i" class="w-0.5 bg-industrial-blue animate-music-pulse" :style="{ animationDelay: `${i * 0.2}s` }"></div>
              </div>
              <span v-else class="opacity-30 group-hover:opacity-100 group-hover:text-white transition-opacity">
                {{ (index + 1).toString().padStart(2, '0') }}
              </span>
            </div>

            <div class="flex flex-col truncate">
              <span class="font-bold text-[10px] truncate leading-none group-hover:text-white transition-colors">
                {{ track.title }}
              </span>
              <span class="text-[7px] opacity-40 truncate font-mono mt-1 uppercase tracking-tight">
                {{ track.artist || 'Unknown' }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 z-10 font-mono text-[9px] opacity-30 group-hover:opacity-100 transition-opacity">
            <span v-if="currentTrackIndex === index" class="text-[7px] font-black text-industrial-accent">PLAYING</span>
            <span>{{ track.duration || '--:--' }}</span>
          </div>
        </div>
      </div>

      <!-- 列表底栏统计 -->
      <div class="mt-2 pt-2 border-t border-gray-800/50 flex justify-between items-center text-[7px] text-gray-600 font-mono">
        <span>TOTAL_TRACKS: {{ trackList.length }}</span>
        <span>DB_VER: 2024.1.0</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes music-pulse {
  0%, 100% { height: 2px; }
  50% { height: 100%; }
}
.animate-music-pulse {
  animation: music-pulse 0.6s infinite ease-in-out;
}

.custom-scrollbar::-webkit-scrollbar { width: 2px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 2px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #ffbb00; }

.music-range-input { 
  appearance: none; 
  background: #2d3748; 
  outline: none;
  overflow: hidden;
}

.music-range-input::-webkit-slider-runnable-track {
  background: #1a202c;
  height: 2px;
}

.music-range-input::-webkit-slider-thumb {
  appearance: none;
  width: 6px; height: 6px;
  background: #ffbb00;
  border-radius: 0;
  cursor: pointer;
  box-shadow: -407px 0 0 400px #ffbb00;
  margin-top: -2px;
}

.active-track {
  box-shadow: inset 2px 0 0 #0088ff;
  text-shadow: 0 0 10px rgba(0, 136, 255, 0.4);
}

.music-panel {
  animation: panel-appear 0.4s cubic-bezier(0.19, 1, 0.22, 1);
}

@keyframes panel-appear {
  from { opacity: 0; transform: scale(0.95) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
</style>