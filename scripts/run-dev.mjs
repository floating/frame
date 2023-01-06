import { spawn } from 'child_process'
import waitOn from 'wait-on'
import parcel from './parcel.mjs'

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

async function launchDevServer() {
  const { server, host } = await parcel()

  await waitOn({
    resources: [`${host}/tray/index.dev.html`],
    validateStatus: (status) => status === 200
  })

  return { shutdown: () => server.unsubscribe() }
}

function launchFrame({ shutdown }) {
  const npmProcess = spawn('npm', ['run', 'launch:dev'], { stdio: 'inherit' })

  npmProcess.once('exit', () => {
    console.log('Frame exited')
    shutdown()
  })
}

async function run() {
  const [env, server] = await Promise.all([prepareEnvironment(), launchDevServer()])

  launchFrame(server)
}

run()
