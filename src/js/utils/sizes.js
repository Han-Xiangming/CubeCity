import EventEmitter from './event-emitter.js'

export default class Sizes extends EventEmitter {
  constructor() {
    super()

    // 核心更改：全屏模式直接使用 window 的宽高
    this.updateSizes()

    window.addEventListener('resize', () => {
      this.updateSizes()
      this.trigger('resize')
    })
  }

  updateSizes() {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.aspect = this.width / this.height
    this.pixelRatio = Math.min(window.devicePixelRatio, 2)
  }
}