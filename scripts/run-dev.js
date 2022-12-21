const { spawn } = require('child_process')
const kill = require('tree-kill')
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
  const server = spawn('npm', ['run', 'dev-server'])

  server.once('exit', () => {
    console.log('Dev server exited')
    process.exit(0)
  })

  await waitOn({
    resources: ['http://localhost:1234/app/tray/index.dev.html'],
    validateStatus: (status) => status === 200
  })

  return { shutDown: () => kill(server.pid) }
}

async function run() {
  await prepareEnvironment()

  const { shutDown } = await launchServer()

  try {
    const npmProcess = spawn('npm', ['run', 'launch:dev'], { stdio: 'inherit' })

    npmProcess.once('exit', () => {
      console.log('Frame exited')
      shutDown()
    })
  } catch (err) {
    console.log('Error running Electron', err)
    shutDown()
  }
}

run()
