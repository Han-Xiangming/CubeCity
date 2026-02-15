import * as THREE from 'three'
import Experience from '../experience.js'

export default class Ghost {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    
    this.instance = new THREE.Group()
    this.instance.visible = false
    this.scene.add(this.instance)
    
    this.currentType = null
    this.model = null
    
    // 预定义材质，减少创建开销
    this.validMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.5,
      depthWrite: false, // 核心：不写入深度缓冲区
      polygonOffset: true, // 核心：启用多边形偏移
      polygonOffsetFactor: -4, // 核心：让物体在视觉上“更靠前”
      polygonOffsetUnits: -4
    })
    
    this.invalidMaterial = this.validMaterial.clone()
    this.invalidMaterial.color.set(0xff3300)
  }

  refresh(type) {
    if (this.currentType === type) return
    
    if (this.model) {
      this.instance.remove(this.model)
    }

    // 基于你提供的 52 个资源列表进行映射
    const resourceMap = {
      'house': 'house_level1', 'house2': 'house2_level1', 'factory': 'factory_level1',
      'chemistry_factory': 'chemistry_factory_level1', 'shop': 'shop_level1',
      'office': 'office_level1', 'hospital': 'hospital_level1', 'police': 'police_level1',
      'fire_station': 'fire_station_level1', 'nuke_factory': 'nuke_factory_level1',
      'garbage_station': 'garbage_station_level1', 'wind_power': 'wind_power_level1',
      'sun_power': 'sun_power_level1', 'water_tower': 'water_tower_level1',
      'hero_park': 'hero_park_level1', 'park': 'park_level1', 'road': 'road'
    }

    const resourceKey = resourceMap[type] || `${type}_level1`
    const resource = this.resources.items[resourceKey]
    
    if (resource && resource.scene) {
      this.currentType = type
      this.model = resource.scene.clone()
      
      // 移除虚影模型的所有灯光和干扰组件
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = this.validMaterial // 初始赋予绿色
          child.castShadow = false
          child.receiveShadow = false
          // 确保射线检测永远穿透虚影
          child.raycast = () => { return null } 
        }
      })
      this.instance.add(this.model)
    }
  }

  update(tile, isValid) {
    if (!this.model) return

    this.instance.visible = true
    
    // 使用地块的坐标，y轴只抬高一点点 (0.01)，依靠 polygonOffset 解决闪烁
    this.instance.position.set(tile.position.x, 0.01, tile.position.z)

    // 根据合法性切换材质
    const mat = isValid ? this.validMaterial : this.invalidMaterial
    this.model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material !== mat) {
        child.material = mat
      }
    })
  }

  hide() {
    this.instance.visible = false
    this.currentType = null
  }
}