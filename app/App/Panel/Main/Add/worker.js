let canvas, ctx
const particles = []
const particleCount = 64

class Particle {
  constructor () {
    this.x = canvas.width * Math.random()
    this.y = canvas.height * Math.random()
    this.vx = (Math.random() / 2) - 0.25
    this.vy = (Math.random() / 2) - 0.25
  }

  update () {
    this.x += this.vx
    this.y += this.vy
    if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx
    if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy
    ctx.fillStyle = 'rgba(0, 210, 180, 0.9)'
    ctx.fillRect(this.x, this.y, 2, 2)
  }
}

const loop = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  for (let i = 0; i < particleCount; i++) particles[i].update(ctx)
  this.animate = self.requestAnimationFrame(loop)
}

self.onmessage = function(ev) {
  if(ev.data.type === 'init') {
    canvas = ev.data.canvas
    ctx = canvas.getContext('2d')
    if (ctx) {
      for (let i = 0; i < particleCount; i++) particles.push(new Particle())
      loop()
    }
  }
}
