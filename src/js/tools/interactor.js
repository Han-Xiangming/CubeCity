import { eventBus } from '@/js/utils/event-bus.js'
import { useGameState } from '@/stores/useGameState.js'
import * as THREE from 'three'
import Experience from '../experience.js'
import { MODES, PERSISTENT_HIGHLIGHT_MODES } from './interactor/constants.js'
import {
  confirmDemolish,
  confirmRelocate,
  confirmUpgrade,
  handleBuildMode,
  handleDefaultMode,
  handleDemolishMode,
  handleRelocateMode,
  handleSelectMode,
  rotateBuilding,
} from './interactor/handlers.js'
import { canPlaceBuilding, getIntersectedTile } from './interactor/utils.js'

export default class Interactor {
  constructor(cityGroup) {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.camera = this.experience.camera.instance
    this.iMouse = this.experience.iMouse
    this.canvas = this.experience.canvas
    this.gameState = useGameState()

    this.raycaster = new THREE.Raycaster()
    this.cityGroup = cityGroup

    this.focused = null
    this.selected = null
    this.relocateFirst = null
    this.relocateSecond = null
    this.lastMode = null

    this._bindEvents()
  }

  _bindEvents() {
    this._onMouseMove = this._onMouseMove.bind(this)
    this._onClick = this._onClick.bind(this)
    this._onRightClick = this._onRightClick.bind(this)
    this._onActionConfirmed = this._onActionConfirmed.bind(this)
    this._onKeyDown = this._onKeyDown.bind(this)

    this.canvas.addEventListener('mousemove', this._onMouseMove)
    this.canvas.addEventListener('click', this._onClick)
    this.canvas.addEventListener('contextmenu', this._onRightClick)
    document.addEventListener('keydown', this._onKeyDown)
    eventBus.on('ui:action-confirmed', this._onActionConfirmed)
  }

  _onMouseMove() {
    this._handleModeChange()

    // 1. 射线检测地块
    const newFocusedTile = getIntersectedTile(this.raycaster, this.iMouse, this.camera, this.cityGroup)
    this._updateFocus(newFocusedTile)

    const ghost = this.experience.world.ghost
    if (!ghost) return

    // 2. 只有在建造模式且有选中建筑时处理
    const currentMode = this.gameState.currentMode
    const selected = this.gameState.selectedBuilding

    if (currentMode === 'build' && selected && newFocusedTile) {
      // 逻辑判定
      const isValid = canPlaceBuilding(
        newFocusedTile.x, 
        newFocusedTile.y, 
        selected.type, 
        this.gameState.metadata
      ) && !newFocusedTile.buildingInstance

      // 更新虚影
      ghost.refresh(selected.type)
      ghost.update(newFocusedTile, isValid)
    } else {
      // 否则强制隐藏
      ghost.hide()
    }
  }

  _onClick() {
    if (!this.focused) return
    
    const mode = this.gameState.currentMode
    if (PERSISTENT_HIGHLIGHT_MODES.includes(mode))
      this._setSelected(this.focused)

    switch (mode) {
      case MODES.SELECT:
        handleSelectMode(this, this.selected)
        break
      case MODES.BUILD:
        handleBuildMode(this, this.focused)
        // 建造后立即刷新 Ghost
        this.experience.world.ghost?.hide()
        break
      case MODES.DEMOLISH:
        handleDemolishMode(this, this.selected)
        break
      case MODES.RELOCATE:
        handleRelocateMode(this, this.selected)
        break
      default:
        handleDefaultMode(this, this.focused)
        break
    }
  }

  _onRightClick(event) {
    if (event) event.preventDefault()
    this._clearSelection()
    this.experience.world.ghost?.hide() // 右键取消时隐藏虚影
  }

  _onKeyDown(event) {
    if (event.key === 'Escape') {
      this._onRightClick()
      return
    }

    const currentMode = this.gameState.currentMode
    if (currentMode === MODES.BUILD || currentMode === MODES.RELOCATE) {
      if (event.key.toLowerCase() === 'r') {
        const tileToRotate = currentMode === MODES.RELOCATE ? this.selected : this.focused
        if (tileToRotate) rotateBuilding(this, tileToRotate)
      }
    }
  }

  _onActionConfirmed(action) {
    if (!action) return
    switch (action) {
      case 'upgrade': confirmUpgrade(this); break
      case 'demolish': confirmDemolish(this); break
      case 'relocate': confirmRelocate(this); break
    }
    this._clearSelection()
  }

  _handleModeChange() {
    const currentMode = this.gameState.currentMode
    // 只有当模式【真的改变了】才执行清理
    if (this.lastMode !== currentMode) {
      console.log('Mode changed from', this.lastMode, 'to', currentMode)
      this.lastMode = currentMode
      this._clearSelection() 
      this.experience.world.ghost?.hide()
    }
  }
  
  _updateFocus(newFocusedTile) {
    if (this.focused === newFocusedTile) return
    let mode = this.gameState.currentMode
    if (mode === MODES.BUILD && newFocusedTile) {
      const { x, y } = newFocusedTile
      const buildingType = this.gameState.selectedBuilding?.type
      if (!canPlaceBuilding(x, y, buildingType, this.gameState.metadata))
        mode = 'build-invalid'
    }

    if (this.focused && (!this.selected || this.focused !== this.selected || !PERSISTENT_HIGHLIGHT_MODES.includes(mode)))
      this.focused.setFocused(false, mode)

    if (newFocusedTile && (!this.selected || newFocusedTile !== this.selected || !PERSISTENT_HIGHLIGHT_MODES.includes(mode)))
      newFocusedTile.setFocused(true, mode)

    this.focused = newFocusedTile
  }

  _setSelected(tile) {
    if (this.selected === tile) return
    if (this.selected) this.selected.setFocused(false, this.gameState.currentMode)
    this.selected = tile
    if (this.selected) this.selected.setFocused(true, this.gameState.currentMode)
  }

  _clearSelection() {
    if (this.selected) this.selected.setFocused(false, this.gameState.currentMode)
    if (this.relocateFirst) this.relocateFirst.setFocused(false, this.gameState.currentMode)
    if (this.relocateSecond) this.relocateSecond.setFocused(false, this.gameState.currentMode)
    this.selected = null
    this.relocateFirst = null
    this.relocateSecond = null
    this.gameState.clearSelection()
  }

  dispose() {
    this.canvas.removeEventListener('mousemove', this._onMouseMove)
    this.canvas.removeEventListener('click', this._onClick)
    this.canvas.removeEventListener('contextmenu', this._onRightClick)
    document.removeEventListener('keydown', this._onKeyDown)
    eventBus.off('ui:action-confirmed', this._onActionConfirmed)
  }
}