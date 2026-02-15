import EventEmitter from './event-emitter.js'

export default class Sizes extends EventEmitter {
  constructor(element) {
    super()
    // 设置目标元素，默认为 window
    this.element = element || window
    this.updateSizes()

    // 监听全局窗口缩放
    window.addEventListener('resize', () => {
      this.updateSizes()
      this.trigger('resize')
    })
  }

  updateSizes() {
    if (this.element === window) {
      this.width = window.innerWidth
      this.height = window.innerHeight
    } else {
      // 关键：获取父容器（main 标签）的实时物理尺寸
      this.width = this.element.offsetWidth
      this.height = this.element.offsetHeight
    }

    this.aspect = this.width / this.height
    this.pixelRatio = Math.min(window.devicePixelRatio, 2)
  }
}