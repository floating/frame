/* globals self */

let canvas, ctx, looper
const particles = []
const particleCount = 56

class Particle {
  constructor() {
    this.x = canvas.width * Math.random()
    this.y = canvas.height * Math.random()
    this.vx = Math.random() - 1
    this.vy = Math.random() - 1
  }

  update() {
    this.x += this.vx
    this.y += this.vy
    if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx
    if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy
    ctx.fillStyle = 'rgba(0, 210, 180, 1)'
    ctx.fillRect(this.x, this.y, 2, 2)
  }
}

const loop = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (let i = 0; i < particleCount; i++) particles[i].update(ctx)
  looper = setTimeout(() => {
    this.animate = self.requestAnimationFrame(loop)
  }, 1000 / 20)
}

self.onmessage = (e) => {
  if (e.data.type === 'init') {
    canvas = e.data.canvas
    ctx = canvas.getContext('2d')
    if (ctx) {
      for (let i = 0; i < particleCount; i++) particles.push(new Particle())
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (let i = 0; i < particleCount; i++) particles[i].update(ctx)
    }
  } else if (e.data.type === 'start') {
    loop()
  } else if (e.data.type === 'stop') {
    clearTimeout(looper)
  }
}
