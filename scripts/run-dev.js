const { spawn } = require('child_process')
const kill = require('tree-kill')
const waitOn = require('wait-on')

const devHost = 'http://localhost:1234'

async function waitForTask(taskName) {
  return new Promise((resolve, reject) => {
    const ps = spawn('npm', ['run', taskName], { stdio: 'inherit' })

    ps.once('close', (exitCode) =>
      exitCode === 0 ? resolve() : reject(`${taskName} failed with exit code: ${exitCode}`)
    )

    ps.once('error', (err) => console.error(`Error executing task ${taskName}`, err))
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

  server.on('error', (err) => {
    console.error('Dev server error', err)
  })

  console.log(`Launched dev server, waiting for connection on ${devHost}`)

  await waitOn({
    resources: [`${devHost}/app/tray/index.dev.html`],
    validateStatus: (status) => status === 200
  })

  console.log('Dev session connected!')

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
