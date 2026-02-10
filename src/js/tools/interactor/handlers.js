import { BUILDING_DATA } from '@/constants/constants.js'
import { eventBus } from '@/js/utils/event-bus.js'
import { useGameState } from '@/stores/useGameState'
import {
  canPlaceBuilding,
  showBuildingPlacedToast,
  showBuildingRemovedToast,
  showToast,
  swapBuilding,
  updateAdjacentRoads,
} from './utils.js'

// =================================================================================
//  各模式下的具体逻辑处理器
// =================================================================================

/**
 * [选择模式] 逻辑
 */
export function handleSelectMode(ctx, tile) {
  const building = tile?.buildingInstance
  if (!building) return

  ctx.gameState.setSelectedBuilding({ type: building.type, level: building.level || 1 })
  // 统一使用 tile 上的网格坐标属性 x, y
  ctx.gameState.setSelectedPosition({ x: tile.x, y: tile.y })
}

/**
 * [建造模式] 逻辑
 */
export function handleBuildMode(ctx, tile) {
  const buildingTypeToBuild = ctx.gameState.selectedBuilding?.type
  const buildingLevelToBuild = 1
  if (!tile) return
  
  const { x, y } = tile
  const metadata = ctx.gameState.metadata
  const canBuild = canPlaceBuilding(x, y, buildingTypeToBuild, metadata)
  
  if (!buildingTypeToBuild || !canBuild || tile.buildingInstance) {
    const message = ctx.gameState.language === 'zh'
      ? '先建个路吧！建筑只能建在道路旁边。（特例：风力发电与公园可任意建造）'
      : 'Build a road first! Buildings can only be placed next to roads. (Exception: Wind Power and Parks can be built anywhere)'
    showToast('error', message)
    return
  }
  
  if (ctx.gameState.credits < BUILDING_DATA[buildingTypeToBuild]?.levels[buildingLevelToBuild]?.cost) {
    const message = ctx.gameState.language === 'zh' ? '资金不足。' : 'Insufficient funds.'
    showToast('error', message)
    return
  }

  // 修改 metadata 状态
  ctx.gameState.setTile(x, y, {
    type: 'ground',
    building: buildingTypeToBuild,
    direction: 0,
    level: buildingLevelToBuild,
    detail: BUILDING_DATA[buildingTypeToBuild]?.levels[buildingLevelToBuild],
    outputFactor: 1,
  })
  
  ctx.gameState.updateCredits(-BUILDING_DATA[buildingTypeToBuild]?.levels[buildingLevelToBuild]?.cost)
  
  // 更新 3D 视图
  tile.setBuilding(buildingTypeToBuild, buildingLevelToBuild, 0)
  tile.setType('ground')
  updateAdjacentRoads(tile, ctx.experience.world.city)
  showBuildingPlacedToast(buildingTypeToBuild, tile, buildingLevelToBuild, ctx.gameState)
}

/**
 * [拆除模式] 逻辑
 */
export function handleDemolishMode(ctx, tile) {
  if (!tile) return

  // 核心修复：确保从 tile 对象中提取正确的网格索引坐标
  const gridX = tile.x
  const gridY = tile.y

  if (tile.buildingInstance) {
    // 1. 同步选中位置到 Store (供 handleBuildingTransaction 使用)
    ctx.gameState.setSelectedPosition({ x: gridX, y: gridY })
    ctx.gameState.setSelectedBuilding({ 
      type: tile.buildingInstance.type, 
      level: tile.buildingInstance.level || 1 
    })

    // 2. 触发确认逻辑，显式传递坐标 x, y
    eventBus.emit('ui:confirm-action', {
      action: 'demolish',
      tileId: tile.id,
      buildingType: tile.buildingInstance.type,
      buildingLevel: tile.buildingInstance.level,
      x: gridX,
      y: gridY
    })
  } else {
    // 没建筑，变回草地
    tile.setType('grass')
    ctx._clearSelection()
  }
}

/**
 * [搬迁模式] 逻辑
 */
export function handleRelocateMode(ctx, tile) {
  if (!tile) return

  if (!ctx.relocateFirst) {
    if (!tile.buildingInstance) {
      showToast('error', ctx.gameState.language === 'zh' ? '请选择一个建筑进行搬迁。' : 'Select a building to relocate.')
      ctx._clearSelection()
      return
    }
    ctx.relocateFirst = tile
    return
  }

  if (ctx.relocateFirst !== tile) {
    if (!canPlaceBuilding(tile.x, tile.y, ctx.relocateFirst.buildingInstance.type, ctx.gameState.metadata)) {
      showToast('error', ctx.gameState.language === 'zh' ? '地块不合规。' : 'Invalid tile.')
      return
    }
    if (tile.buildingInstance) {
      showToast('error', ctx.gameState.language === 'zh' ? '地块已被占用。' : 'Tile occupied.')
      return
    }
    ctx.relocateSecond = tile
    ctx.relocateSecond.setFocused(true, 'relocate')

    eventBus.emit('ui:confirm-action', {
      action: 'relocate',
      tileId: ctx.relocateFirst.id,
      buildingType: ctx.relocateFirst.buildingInstance.type,
      buildingLevel: ctx.relocateFirst.buildingInstance.level,
    })
  }
}

/**
 * [默认模式]
 */
export function handleDefaultMode(tile) {
  if (!tile) return
  eventBus.emit('ui:panel:show', { panel: 'building', data: tile })
}

// =================================================================================
//  动作执行 (由 UI 触发确认后调用)
// =================================================================================

export function confirmUpgrade(ctx) {
  const building = ctx.selected?.buildingInstance
  if (building && typeof building.upgrade === 'function') {
    const newBuilding = building.upgrade()
    if (newBuilding) {
      ctx.selected.setBuilding(newBuilding.type, newBuilding.level || 1, newBuilding.direction)
      ctx.gameState.setTile(ctx.selected.x, ctx.selected.y, {
        detail: BUILDING_DATA[newBuilding.type]?.levels[newBuilding.level],
      })
      showToast('success', ctx.gameState.language === 'zh' ? '升级成功！' : 'Upgraded!')
    }
  }
}

export function confirmDemolish(ctx) {
  const tile = ctx.selected
  const building = tile?.buildingInstance
  if (tile && building) {
    ctx.gameState.setTile(tile.x, tile.y, {
      type: 'ground',
      building: null,
      direction: 0,
      level: 0,
    })
    tile.removeBuilding()
    showBuildingRemovedToast(building.type, tile, building.level, ctx.gameState)
    updateAdjacentRoads(tile, ctx.experience.world.city)
  }
}

export function confirmRelocate(ctx) {
  const sourceTile = ctx.relocateFirst
  const destTile = ctx.relocateSecond
  if (sourceTile && destTile) {
    const srcData = { ...ctx.gameState.getTile(sourceTile.x, sourceTile.y) }
    const dstData = { ...ctx.gameState.getTile(destTile.x, destTile.y) }
    ctx.gameState.setTile(destTile.x, destTile.y, srcData)
    ctx.gameState.setTile(sourceTile.x, sourceTile.y, { ...dstData, building: null, direction: 0, level: 0 })
    swapBuilding(sourceTile, destTile)
    showToast('info', ctx.gameState.language === 'zh' ? '搬迁成功！' : 'Relocated!')
    updateAdjacentRoads(sourceTile, ctx.experience.world.city)
    updateAdjacentRoads(destTile, ctx.experience.world.city)
  }
}

export function rotateBuilding(ctx, tile) {
  const building = tile?.buildingInstance
  if (!building || building.type === 'road') return
  const { type, direction } = building
  tile.removeBuilding()
  tile.setBuilding(type, building.level || 1, (direction + 1) % 4)
  updateAdjacentRoads(tile, ctx.experience.world.city)
}