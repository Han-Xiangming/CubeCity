import { getAdjustedStabilityRate, STABILITY_CONFIG } from '@/constants/constants.js'
import { getEffectiveBuildingValue } from '@/js/utils/building-interaction-utils.js'
import { defineStore } from 'pinia'

export const useGameState = defineStore('gameState', {
  state: () => ({
    metadata: Array.from({ length: 17 }, _ =>
      Array.from({ length: 17 }, _ => ({
        type: 'grass',
        building: null,
        direction: 0,
      }))),
    currentMode: 'build',
    selectedBuilding: null,
    selectedPosition: null,
    toastQueue: [],
    gameDay: 1,
    credits: 3000,
    territory: 16,
    cityLevel: 1,
    cityName: 'HeXian City',
    citySize: 16,
    language: 'en',
    showMapOverview: false,
    musicEnabled: false,
    musicVolume: 0.5,
    isPlayingMusic: false,
    stability: 100,
    stabilityChangeRate: 0,
    demolishConfirmEnabled: true,
    // --- 新增：右侧边栏折叠状态 ---
    rightSidebarCollapsed: false,
  }),
  getters: {
    dailyIncome: (state) => {
      let totalIncome = 0
      state.metadata.forEach((row, x) => {
        row.forEach((tile, y) => {
          if (tile.building && tile.detail) {
            const income = getEffectiveBuildingValue(state, x, y, 'coinOutput')
            totalIncome += income
          }
        })
      })
      return totalIncome
    },
    maxPopulation: (state) => {
      let totalCapacity = 0
      state.metadata.forEach((row, x) => {
        row.forEach((tile, y) => {
          if (tile.building && tile.detail && tile.detail.category === 'residential') {
            const capacity = getEffectiveBuildingValue(state, x, y, 'maxPopulation')
            totalCapacity += capacity
          }
        })
      })
      return totalCapacity
    },
    totalJobs: (state) => {
      let totalJobs = 0
      state.metadata.forEach((row) => {
        row.forEach((tile) => {
          if (tile.building && tile.detail) totalJobs += tile.detail.population || 0
        })
      })
      return totalJobs
    },
    population() { return Math.min(this.maxPopulation * 1.5, this.totalJobs) },
    maxPower: (state) => {
      let totalPower = 0
      state.metadata.forEach((row, x) => {
        row.forEach((tile, y) => {
          if (tile.building && tile.detail) {
            const power = getEffectiveBuildingValue(state, x, y, 'powerOutput')
            totalPower += power
          }
        })
      })
      return totalPower
    },
    power: (state) => {
      let totalUsage = 0
      state.metadata.forEach((row) => {
        row.forEach((tile) => {
          if (tile.building && tile.detail) totalUsage += tile.detail.powerUsage || 0
        })
      })
      return totalUsage
    },
    buildingCount: (state) => {
      let count = 0
      state.metadata.forEach((row) => {
        row.forEach((tile) => {
          if (tile.building && tile.building !== 'road') count++
        })
      })
      return count
    },
    pollution: (state) => {
      let totalPollution = 0
      state.metadata.forEach((row, x) => {
        row.forEach((tile, y) => {
          if (tile.building && tile.detail) {
            const pollution = getEffectiveBuildingValue(state, x, y, 'pollution')
            totalPollution += pollution
          }
        })
      })
      return totalPollution
    },
    hospitalCount: state => state.metadata.flat().filter(tile => tile.building === 'hospital').length,
    policeStationCount: state => state.metadata.flat().filter(tile => tile.building === 'police').length,
    fireStationCount: state => state.metadata.flat().filter(tile => tile.building === 'fire_station').length,
  },
  actions: {
    // --- 新增：切换侧边栏方法 ---
    toggleRightSidebar() {
      this.rightSidebarCollapsed = !this.rightSidebarCollapsed
    },
    updateStability() {
      let changeRate = STABILITY_CONFIG.DEFAULT_STABILITY_CHANGE_RATE
      const servicesCount = this.hospitalCount + this.policeStationCount + this.fireStationCount
      changeRate += servicesCount * getAdjustedStabilityRate(STABILITY_CONFIG.SERVICE_STABILITY_PER_SECOND)
      const jobDeficit = this.totalJobs - this.maxPopulation
      if (jobDeficit > 0 && this.maxPopulation > 0) {
        const unemploymentRatio = Number((jobDeficit / this.maxPopulation).toFixed(2))
        changeRate -= unemploymentRatio * getAdjustedStabilityRate(STABILITY_CONFIG.UNEMPLOYMENT_STABILITY_PENALTY)
      }
      if (this.pollution > STABILITY_CONFIG.POLLUTION_THRESHOLD) {
        const pollutionFactor = (this.pollution / STABILITY_CONFIG.POLLUTION_THRESHOLD) ** 2
        changeRate -= Number((pollutionFactor * getAdjustedStabilityRate(STABILITY_CONFIG.POLLUTION_STABILITY_PENALTY)).toFixed(2))
      }
      const powerDeficit = this.power - this.maxPower
      if (powerDeficit > 0 && this.maxPower > 0) {
        const powerDeficitRatio = Number((powerDeficit / this.maxPower).toFixed(2))
        changeRate -= powerDeficitRatio * getAdjustedStabilityRate(STABILITY_CONFIG.POWER_DEFICIT_STABILITY_PENALTY)
      }
      if (!Number.isFinite(changeRate)) changeRate = 0
      this.stabilityChangeRate = changeRate
    },
    applyStabilityChange() {
      const newStability = this.stability + this.stabilityChangeRate
      this.stability = Math.max(0, Math.min(100, newStability))
    },
    setMode(mode) { this.currentMode = mode },
    setSelectedBuilding(payload) { this.selectedBuilding = payload },
    setSelectedPosition(position) { 
      if (position && position.x !== undefined && position.y !== undefined) {
        this.selectedPosition = { x: Math.floor(Number(position.x)), y: Math.floor(Number(position.y)) }
      } else {
        this.selectedPosition = null
      }
    },
    getSnapshot() {
      return {
        metadata: JSON.parse(JSON.stringify(this.metadata)),
        credits: this.credits,
        gameDay: this.gameDay,
        cityName: this.cityName,
        cityLevel: this.cityLevel,
        citySize: this.citySize,
        stability: this.stability,
      };
    },
    saveToNewSlot(customName, defaultNameLabel) {
      const id = Date.now();
      const saveEntry = {
        id,
        name: customName || `${defaultNameLabel} ${this.saveSlots.length + 1}`,
        date: new Date().toLocaleString(),
        data: this.getSnapshot()
      };
      this.saveSlots.push(saveEntry);
    },
    loadFromSlot(slotId) {
      const slot = this.saveSlots.find(s => s.id === slotId);
      if (slot) {
        Object.assign(this, slot.data);
        return true;
      }
      return false;
    },
    exportSaveJSON() {
      const blob = new Blob([JSON.stringify({ city: this.getSnapshot() })], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CubeCity_Save_${Date.now()}.json`;
      a.click();
    },
    deleteSlot(slotId) {
      this.saveSlots = this.saveSlots.filter(s => s.id !== slotId);
    },    
    setCredits(credits) { this.credits = credits },
    updateCredits(credits) { this.credits += credits },
    setTerritory(territory) { this.territory = territory },
    setCityLevel(cityLevel) { this.cityLevel = cityLevel },
    setCityName(cityName) { this.cityName = cityName },
    setCitySize(citySize) { this.citySize = citySize },
    addToast(message, type = 'info', duration = 3000) {
      const id = Date.now() + Math.random()
      this.toastQueue.push({ message, type, id })
      setTimeout(() => { this.removeToast(id) }, duration)
    },
    setLanguage(lang) { this.language = lang },
    removeToast(id) { this.toastQueue = this.toastQueue.filter(t => t.id !== id) },
    clearSelection() { this.selectedBuilding = null; this.selectedPosition = null },
    updateTile(x, y, patch) {
      if (this.metadata[x] && this.metadata[x][y]) {
        Object.assign(this.metadata[x][y], patch)
      }
    },
    setTile(x, y, patch) {
      if (this.metadata[x] && this.metadata[x][y]) {
        Object.assign(this.metadata[x][y], patch)
      }
    },
    getTile(x, y) { return this.metadata?.[x]?.[y] || null },
    setShowMapOverview(val) { this.showMapOverview = val },
    nextDay() {
      this.credits += this.dailyIncome
      this.gameDay++
      this.updateStability()
      this.applyStabilityChange()
    },
    resetAll() {
      this.metadata = Array.from({ length: 17 }, _ =>
        Array.from({ length: 17 }, _ => ({ type: 'grass', building: null, direction: 0 })))
      this.currentMode = 'build'
      this.selectedBuilding = null
      this.selectedPosition = null
      this.toastQueue = []
      this.gameDay = 1
      this.credits = 3000
      this.territory = 16
      this.cityLevel = 1
      this.cityName = 'HeXian City'
      this.citySize = 16
      this.language = 'en'
      this.showMapOverview = false
      this.stability = 100
      this.stabilityChangeRate = 0
      this.musicEnabled = false
      this.musicVolume = 0.5
      this.isPlayingMusic = false
      this.demolishConfirmEnabled = true
      this.rightSidebarCollapsed = false
    },
    toggleMusic() { this.musicEnabled = !this.musicEnabled },
    enableMusic() { this.musicEnabled = true },
    disableMusic() { this.musicEnabled = false },
    setMusicVolume(volume) { this.musicVolume = Math.max(0, Math.min(1, volume)) },
    setMusicPlaying(playing) { this.isPlayingMusic = playing },
  },
  persist: true,
})