// export const syncDash = (u, dash) => u('dash', () => dash)
// export const syncMain = (u, main) => u('main', () => main)

export const pathSync = (u, path, value) => u(path, () => value)

export const notify = (u, ...args) => {
  console.log('notify action', ...args)
}