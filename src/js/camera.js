import gsap from 'gsap'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import Experience from './experience.js'

export default class Camera {
  constructor(orthographic = false) {
    this.experience = new Experience()
    this.sizes = this.experience.sizes
    this.scene = this.experience.scene
    this.canvas = this.experience.canvas
    this.orthographic = orthographic
    this.debug = this.experience.debug
    this.debugActive = this.experience.debug.active

    /* ---------- 点位偏置（相对于目标的距离） ---------- */
    // 改为相对偏移，这样平移后再旋转视角，逻辑依然正确
    this.fixedOffsets = [
      new THREE.Vector3(10, 10, 10),
      new THREE.Vector3(10, 10, -10),
      new THREE.Vector3(-10, 10, -10),
      new THREE.Vector3(-10, 10, 10),
    ]
    this.fixedPoints = [
      new THREE.Vector3(18, 10, 18),
      new THREE.Vector3(18, 10, -2),
      new THREE.Vector3(-2, 10, -2),
      new THREE.Vector3(-2, 10, 18),
    ]
    this.currentIndex = 0 
    this.target = new THREE.Vector3(8, 0, 8) // 初始观察中心

    this.isRotating = false 
    this.initialAngle = null

    this.setInstance()
    this.setControls()
    this.setDebug()
    this.setKeyboardControls()
  }

  setInstance() {
    if (this.orthographic) {
      const aspect = this.sizes.aspect
      this.frustumSize = 10
      this.instance = new THREE.OrthographicCamera(
        -this.frustumSize * aspect,
        this.frustumSize * aspect,
        this.frustumSize,
        -this.frustumSize,
        -50,
        100,
      )
    }
    else {
      this.instance = new THREE.PerspectiveCamera(
        34,
        this.sizes.width / this.sizes.height,
        0.1,
        200, // 稍微调大远裁剪面
      )
    }

    this.instance.position.copy(this.fixedPoints[this.currentIndex])
    this.instance.lookAt(this.target)
    this.scene.add(this.instance)
  }

  setControls() {
    // 1. 鼠标自由旋转与平移 (OrbitControls)
    this.orbitControls = new OrbitControls(this.instance, this.canvas)

    // --- 核心优化：开启平移 ---
    this.orbitControls.enablePan = true
    this.orbitControls.screenSpacePanning = false // 保证沿地面平移
    this.orbitControls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.PAN, // 中键用于平移
      RIGHT: null // **修改：将右键映射为 null，禁用右键操作**
    }

    this.orbitControls.enableDamping = true
    this.orbitControls.dampingFactor = 0.05
    this.orbitControls.enableZoom = false // 保持 OrbitControls 的缩放禁用
    this.orbitControls.enableRotate = true

    // 设置初始目标
    this.orbitControls.target.copy(this.target)

    // 锁定俯视角度
    const offset = new THREE.Vector3().subVectors(this.instance.position, this.target)
    const polarAngle = offset.angleTo(new THREE.Vector3(0, 1, 0))
    this.orbitControls.minPolarAngle = polarAngle - 0.1
    this.orbitControls.maxPolarAngle = polarAngle + 0.1

    // 2. 缩放控制 (TrackballControls)
    this.trackballControls = new TrackballControls(this.instance, this.canvas)
    this.trackballControls.noRotate = true
    this.trackballControls.noPan = true // 由 OrbitControls 处理 Pan
    this.trackballControls.noZoom = false // 确保 TrackballControls 的缩放启用
    this.trackballControls.zoomSpeed = 1.2
    this.trackballControls.minZoom = 0.8
    this.trackballControls.maxZoom = 1.2
    this.trackballControls.target = this.orbitControls.target // 共享目标点
    this.trackballControls.handleResize()
  }
  setDebug() {
    if (this.debugActive) {
      const folder = this.debug.ui.addFolder({ title: 'Camera', expanded: false })
      folder.addBinding(this.instance, 'position', { label: 'Position' })
    }
  }

// camera.js 内部的 resize 方法
  resize() {
    if (!this.instance) return
    
    // 更新 PerspectiveCamera 的 Aspect
    this.instance.aspect = this.experience.sizes.aspect
    this.instance.updateProjectionMatrix()
    
    // 如果是 OrthographicCamera (正交相机)
    if (this.orthographic) {
      this.instance.left = -this.frustumSize * this.instance.aspect
      this.instance.right = this.frustumSize * this.instance.aspect
      this.instance.updateProjectionMatrix()
    }
  
    // 关键：通知控制器容器大小变了
    if (this.orbitControls) {
      this.orbitControls.update()
    }
  }

  update() {
    // 每一帧更新控制器，使阻尼生效
    this.orbitControls.update()
    this.trackballControls.update()
    // 同步两个控制器的目标点，防止冲突
    this.trackballControls.target.copy(this.orbitControls.target)
  }

  /* -------------------------------------------------- */
  /*              键盘移动与切换逻辑                    */
  /* -------------------------------------------------- */
setKeyboardControls() {
  window.addEventListener('keydown', (ev) => {
    // 如果正在打字，不触发
    if (ev.target.tagName === 'INPUT') return
    if (this.isRotating) return

    const key = ev.key.toLowerCase()

    // --- 1. 视角旋转 (Q/E 或 左右方向键) ---
    if (key === 'q' || ev.key === 'ArrowLeft') {
      this.snapToNextPoint(-1) // 逆时针旋转视角
    }
    else if (key === 'e' || ev.key === 'ArrowRight') {
      this.snapToNextPoint(1)  // 顺时针旋转视角
    }

    // --- 2. 地图平移 (WASD) ---
    const moveSpeed = 0.8
    // 获取相机当前的水平前方向
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.instance.quaternion)
    forward.y = 0
    forward.normalize()
    // 获取相机的右方向
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0))

    if (key === 'w') {
      this.orbitControls.target.addScaledVector(forward, moveSpeed)
      this.instance.position.addScaledVector(forward, moveSpeed)
    }
    if (key === 's') {
      this.orbitControls.target.addScaledVector(forward, -moveSpeed)
      this.instance.position.addScaledVector(forward, -moveSpeed)
    }
    if (key === 'a') {
      this.orbitControls.target.addScaledVector(right, -moveSpeed)
      this.instance.position.addScaledVector(right, -moveSpeed)
    }
    if (key === 'd') {
      this.orbitControls.target.addScaledVector(right, moveSpeed)
      this.instance.position.addScaledVector(right, moveSpeed)
    }
  })
}

  snapToNextPoint(step) {
    const currentTarget = this.orbitControls.target.clone()
    
    // 找到当前相机相对于目标点的当前逻辑位置
    this.currentIndex = (this.currentIndex + step + this.fixedOffsets.length) % this.fixedOffsets.length
    
    // 计算基于当前目标点的新位置
    const nextPos = currentTarget.clone().add(this.fixedOffsets[this.currentIndex])
    this.animateTo(nextPos, currentTarget)
  }

  animateTo(targetPos, targetCenter) {
    this.isRotating = true

    // 动画平滑移动位置，同时保持观察目标
    gsap.to(this.instance.position, {
      duration: 0.8,
      ease: 'power3.inOut',
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      onUpdate: () => {
        this.instance.lookAt(targetCenter)
        this.orbitControls.target.copy(targetCenter)
      },
      onComplete: () => {
        this.isRotating = false
      },
    })
  }
}