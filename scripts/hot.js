const { spawn, spawnSync } = require('child_process')
const waitOn = require('wait-on')

const cwd = process.cwd()
let electronMainProcess

function exitHandler() {
  if (!devServerProcess.killed) {
    devServerProcess.kill()
  }
  if (!electronMainProcess?.killed) {
    electronMainProcess.kill()
  }
}

spawnSync('npm', ['run', 'bundle:bridge'], {
  cwd,
  detached: true,
  stdio: 'inherit'
})
spawnSync('npm', ['run', 'compile'], {
  cwd,
  detached: true,
  stdio: 'inherit'
})

const devServerProcess = spawn('npm', ['run', 'dev-server'], {
  cwd,
  detached: true,
  stdio: 'inherit'
})
devServerProcess.on('exit', () => {
  console.log('Dev Server Process exited.')
  exitHandler()
})
;(async () => {
  try {
    await waitOn({
      resources: ['http://localhost:1234/app/Tray/index.dev.html'],
      validateStatus: (status) => status === 200
    })
    electronMainProcess = spawn('npm', ['run', 'launch:hot'], {
      cwd,
      detached: true,
      stdio: 'inherit'
    })
    electronMainProcess.on('exit', () => {
      console.log('Electron Main Process exited.')
      exitHandler()
    })
  } catch (err) {
    console.log('Error running Electron', err)
    exitHandler()
  }
})()
