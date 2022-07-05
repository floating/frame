import * as Sentry from '@sentry/electron'
import { init as initSentry } from '../../../main/sentry'

jest.mock('@sentry/electron', () => ({ init: jest.fn(), IPCMode: { Classic: 'test-ipcmode' } }))
jest.mock('../../../main/store')

describe('sentry', () => {
  beforeEach(async () => {
    initSentry();
  })

  const mockEvent = (event) => Sentry.init.mock.calls[0][0].beforeSend(event)

  it('should call sentry with the expected object', () => {
    expect(Sentry.init).toHaveBeenCalledWith({
      beforeSend: expect.any(Function),
      dsn: 'https://7b09a85b26924609bef5882387e2c4dc@o1204372.ingest.sentry.io/6331069',
      ipcMode: 'test-ipcmode'
    })
  })

  it('should strip asar paths from stackframe modules', () => {
    const sentryEvent = mockEvent({
      exception: {
        values: [{
          "type": "Error",
          "value": "Cannot find latest.yml in the latest release artifacts (https://github.com/floating/frame/releases/download/v0.5.0-beta.20/latest.yml): HttpError: 404 \n\"method: GET url: https://github.com/floating/frame/releases/download/v0.5.0-beta.20/latest.yml\\n\\...",
          "stacktrace": {
              "frames": [{
                "module": "C:\\Users\\Test\\AppData\\Local\\Programs\\frame\\resources\\app.asar\\node_modules\\electron-updater\\out\\AppUpdater",
              }, {
                "module": "node:domain",
              }, {
                "module": "C:\\Users\\Test\\AppData\\Local\\Programs\\frame\\resources\\app.asar\\compiled\\main\\signers\\lattice\\Lattice\\index",
              }]
            },
          }]
      }
    })
    const stackFrameModules = sentryEvent.exception.values[0].stacktrace.frames.map((frame) => frame.module)
    expect(stackFrameModules).toStrictEqual([
      "{asar}/node_modules/electron-updater/out/AppUpdater",
      "node:domain",
      "{asar}/compiled/main/signers/lattice/Lattice/index"
    ])
  })
})
