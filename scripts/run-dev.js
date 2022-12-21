const { spawn } = require('child_process')
const waitOn = require('wait-on')

const cwd = process.cwd()

async function prepareEnvironment() {
  const bundle = new Promise((resolve, reject) => {
    const ps = spawn('npm', ['run', 'bundle:bridge'], {
      cwd,
      detached: true,
      stdio: 'inherit'
    })

    ps.once('close', (exitCode) =>
      exitCode === 0 ? resolve() : reject(`bundle failed with exit code: ${exitCode}`)
    )
  })

  const compile = new Promise((resolve, reject) => {
    const ps = spawn('npm', ['run', 'compile'], {
      cwd,
      detached: true,
      stdio: 'inherit'
    })

    ps.once('close', (exitCode) =>
      exitCode === 0 ? resolve() : reject(`compile failed with exit code: ${exitCode}`)
    )
  })

  return Promise.all([bundle, compile])
}

async function launchServer() {
  let electronMainProcess

  const exitHandler = () => {
    console.log('exit handler!')
    if (!devServerProcess.killed) {
      console.log('killing dev process')
      devServerProcess.kill()
    }
    if (!electronMainProcess?.killed) {
      console.log('killing electron process')
      electronMainProcess.kill()
    }
  }

  const devServerProcess = spawn('npm', ['run', 'dev-server'], {
    cwd,
    detached: true,
    stdio: 'inherit'
  })

  devServerProcess.once('exit', () => {
    console.log('Dev Server Process exited.')
    exitHandler()
  })

  try {
    await waitOn({
      resources: ['http://localhost:1234/app/tray/index.dev.html'],
      validateStatus: (status) => status === 200
    })

    electronMainProcess = spawn('npm', ['run', 'launch:dev'], {
      cwd,
      detached: true,
      stdio: 'inherit'
    })

    electronMainProcess.once('exit', () => {
      console.log('Electron Main Process exited.')
      exitHandler()
    })
  } catch (err) {
    console.log('Error running Electron', err)
    exitHandler()
  }
}

async function run() {
  await prepareEnvironment()

  launchServer()
}

run()
