try {
  let active = !(JSON.parse(localStorage.getItem('__frameActive')))
  localStorage.setItem('__frameActive', JSON.stringify(active))
} catch (e) {
  console.error('Frame Error:', e)
}
