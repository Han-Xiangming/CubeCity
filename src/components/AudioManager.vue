<script setup>
import { useGameState } from '@/stores/useGameState'
import { watch, ref, onMounted } from 'vue'

const gameState = useGameState()
const audio = ref(null)

// 暴露播放方法给全局调用
const forcePlay = () => {
  if (audio.value) {
    audio.value.play().catch(err => {
      console.warn("播放被拦截，等待下次交互", err)
    })
  }
}

// 监听状态：当用户在面板里点播放/暂停时
watch(() => gameState.musicEnabled, (val) => {
  if (val) forcePlay();
  else audio.value?.pause();
})

// 监听切歌
watch(() => gameState.currentTrackIndex, () => {
  if (gameState.musicEnabled) {
    // 换源后由于浏览器机制，必须在下一次 DOM 更新循环中执行
    setTimeout(() => forcePlay(), 50)
  }
})

// 监听音量
watch(() => gameState.musicVolume, (val) => {
  if (audio.value) audio.value.volume = val
})

// 进度与时长
const onTimeUpdate = () => gameState.setMusicCurrentTime(audio.value.currentTime)
const onLoadedMetadata = () => gameState.setMusicDuration(audio.value.duration)

onMounted(() => {
  if (audio.value) audio.value.volume = gameState.musicVolume
  // 将播放方法挂载到 window，方便 RestorePrompt 跨组件紧急调用
  window._forcePlayMusic = forcePlay
})
</script>

<template>
  <!-- 必须有 ID，且 preload 设为 auto -->
  <audio 
    ref="audio" 
    id="main-audio"
    :src="gameState.trackList[gameState.currentTrackIndex].url"
    preload="auto"
    @timeupdate="onTimeUpdate"
    @loadedmetadata="onLoadedMetadata"
    @ended="gameState.nextTrack"
  ></audio>
</template>