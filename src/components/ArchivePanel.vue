<script setup>
import { useGameState } from '@/stores/useGameState'
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const gameState = useGameState()
const slots = ref([null, null, null])

const refresh = () => {
  slots.value = [gameState.getSlotInfo(1), gameState.getSlotInfo(2), gameState.getSlotInfo(3)]
}

const doSave = (id) => {
  if (slots.value[id-1] && !confirm(t('archive.confirmSave'))) return
  gameState.saveToLocalSlot(id)
  refresh()
}

const doLoad = (id) => {
  if (confirm(t('archive.confirmLoad'))) {
    const raw = localStorage.getItem(`cubecity_slot_${id}`)
    if (gameState.applySaveData(raw)) {
        sessionStorage.setItem('skip_restore_prompt', 'true')
        location.reload() // 刷新页面以重建 3D 场景
    }
  }
}

const onFileImport = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    if (gameState.applySaveData(ev.target.result)) {
      gameState.addToast(t('archive.importSuccess'), 'success',500)
      sessionStorage.setItem('skip_restore_prompt', 'true')
      setTimeout(() => location.reload(), 1000)
    } else {
      gameState.addToast(t('archive.importError'), 'error',500)
    }
  }
  reader.readAsText(file)
}

onMounted(refresh)
</script>

<template>
  <div class="archive-panel p-4 bg-[#1a1f26] border-2 border-gray-600 rounded-xl w-72 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
    <h3 class="text-industrial-accent font-black uppercase text-sm mb-4 tracking-tighter border-b border-gray-700 pb-2">
      {{ t('archive.title') }}
    </h3>

    <div class="space-y-3">
      <div v-for="n in 3" :key="n" class="p-2 bg-black/40 rounded border border-gray-800 hover:border-gray-600 transition-colors">
        <div class="flex justify-between text-[10px] mb-1">
          <span class="text-gray-500 font-bold">{{ t('archive.slot') }} 0{{ n }}</span>
          <span v-if="slots[n-1]" class="text-industrial-blue">{{ slots[n-1].timestamp.split(' ')[0] }}</span>
        </div>

        <div v-if="slots[n-1]" class="mb-2">
          <div class="text-xs font-bold text-white truncate">{{ slots[n-1].cityName }}</div>
          <div class="text-[9px] text-gray-400">Day {{ slots[n-1].gameDay }} • {{ slots[n-1].credits }} Cr</div>
        </div>
        <div v-else class="mb-2 text-[10px] text-gray-700 italic">{{ t('archive.empty') }}</div>

        <div class="flex gap-2">
          <button @click="doSave(n)" class="flex-1 py-1 text-[9px] bg-blue-900/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded uppercase font-bold transition-all">
            {{ t('archive.saveBtn') }}
          </button>
          <button v-if="slots[n-1]" @click="doLoad(n)" class="flex-1 py-1 text-[9px] bg-green-900/30 hover:bg-green-600 text-green-300 hover:text-white rounded uppercase font-bold transition-all">
            {{ t('archive.loadBtn') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 底部文件操作 -->
    <div class="mt-4 pt-3 border-t border-gray-700 flex flex-col gap-2">
      <button @click="gameState.exportSaveFile" class="text-[9px] text-gray-400 hover:text-industrial-accent transition-colors uppercase text-left">
        > {{ t('archive.exportFile') }}
      </button>
      <label class="text-[9px] text-gray-400 hover:text-industrial-accent transition-colors uppercase cursor-pointer">
        > {{ t('archive.importFile') }}
        <input type="file" class="hidden" accept=".json" @change="onFileImport">
      </label>
    </div>
  </div>
</template>