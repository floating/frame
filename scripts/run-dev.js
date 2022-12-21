const { spawn } = require('child_process')
const waitOn = require('wait-on')

async function waitForTask(taskName) {
  return new Promise((resolve, reject) => {
    const ps = spawn('npm', ['run', taskName], { stdio: 'inherit' })

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
  const devServerProcess = spawn('npm', ['run', 'dev-server'])

  try {
    await waitOn({
      resources: ['http://localhost:1234/app/tray/index.dev.html'],
      validateStatus: (status) => status === 200
    })

    const npmProcess = spawn('npm', ['run', 'launch:dev'], { stdio: 'inherit' })

    npmProcess.once('exit', () => {
      console.log('Frame exited')
      devServerProcess.kill()
    })
  } catch (err) {
    console.log('Error running Electron', err)
    devServerProcess.kill()
  }
}

async function run() {
  await prepareEnvironment()

  launchServer()
}

run()
