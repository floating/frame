document.addEventListener(
  'DOMContentLoaded',
  () => {
    document.body.style.opacity = '0'
    const bg = document.body.style.backgroundColor
    document.body.style.backgroundColor = 'transparent'
    document.documentElement.style.backgroundColor = 'transparent'
    requestAnimationFrame(() => {
      document.body.style.backgroundColor = bg
      document.body.style.opacity = '1'
    })
  },
  false
)
