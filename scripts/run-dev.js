const { spawn } = require('child_process')
const waitOn = require('wait-on')

async function waitForTask(taskName) {
  return new Promise((resolve, reject) => {
    const ps = spawn('npm', ['run', taskName], {
      detached: true,
      stdio: 'inherit'
    })

    ps.once('close', (exitCode) =>
      exitCode === 0 ? resolve() : reject(`${taskName} failed with exit code: ${exitCode}`)
    )
  })
}

async function prepareEnvironment() {
  const bundle = waitForTask('bundle:bridge')
  const compile = waitForTask('compile')

  return Promise.all([bundle, compile])
}

async function launchServer() {
  let electronMainProcess

  const exitHandler = () => {
    if (!devServerProcess.killed) {
      devServerProcess.kill()
    }

    if (!electronMainProcess?.killed) {
      electronMainProcess.kill()
    }
  }

  const devServerProcess = spawn('npm', ['run', 'dev-server'], {
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
