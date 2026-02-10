<script setup>
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useBuilding } from '@/hooks/useBuilding.js'
import { useGameState } from '@/stores/useGameState'
import { eventBus } from '@/js/utils/event-bus.js'
import { onMounted, onUnmounted, ref } from 'vue'

const show = ref(false)
const dialogData = ref(null)

const gameState = useGameState()
const { getDialogConfig, handleBuildingTransaction } = useBuilding()

// 处理 UI 侧触发的确认动作
function onAskConfirm(payload) {
  // 1. 关键修复：强制转换坐标为整数，并进行空值保护
  const x = payload.x !== undefined ? parseInt(payload.x) : null
  const y = payload.y !== undefined ? parseInt(payload.y) : null

  if (x !== null && y !== null) {
    gameState.setSelectedPosition({ x, y })
  }

  // 2. 检查快速拆除开关
  if (payload.action === 'demolish' && !gameState.demolishConfirmEnabled) {
    // 二重确认：确保选中的位置在执行前已就绪
    if (gameState.selectedPosition) {
      executeTransaction(payload.action, payload.buildingType, payload.buildingLevel)
    }
    return
  }

  // 3. 正常弹窗逻辑
  dialogData.value = getDialogConfig(payload.action, payload.buildingType, payload.buildingLevel)
  if (dialogData.value) {
    show.value = true
  }
}


// 执行交易并广播结果
function executeTransaction(action, type, level) {
  const ok = handleBuildingTransaction(action, type, level)
  if (ok) {
    eventBus.emit('ui:action-confirmed', action)
  }
}

function onConfirm() {
  executeTransaction(
    dialogData.value.action,
    dialogData.value.buildingType,
    dialogData.value.buildingLevel
  )
  show.value = false
}

function onCancel() {
  show.value = false
}

onMounted(() => {
  eventBus.on('ui:confirm-action', onAskConfirm)
})
onUnmounted(() => {
  eventBus.off('ui:confirm-action', onAskConfirm)
})
</script>

<template>
  <div class="pointer-events-auto">
    <ConfirmDialog
      v-if="dialogData"
      :show="show"
      :title="dialogData.title"
      :message="dialogData.message"
      :confirm-text="dialogData.confirmText"
      :cancel-text="dialogData.cancelText"
      :action="dialogData.action"
      @confirm="onConfirm"
      @cancel="onCancel"
    />
  </div>
</template>