import * as Sentry from '@sentry/electron'
import { init } from '../../../main/errors'
import store from '../../../main/store'

jest.mock('@sentry/electron', () => ({ init: jest.fn(), IPCMode: { Classic: 'test-ipcmode' } }))

jest.mock('../../../main/store')

beforeAll(() => {
  store.set('main.privacy.errorReporting', true)

  jest.useFakeTimers()
})

afterAll(() => {
  jest.useRealTimers()
})

describe('#init', () => {
  it('should initialize sentry with the expected object', () => {
    init()

    expect(Sentry.init).toHaveBeenCalledWith({
      beforeSend: expect.any(Function),
      dsn: 'https://7b09a85b26924609bef5882387e2c4dc@o1204372.ingest.sentry.io/6331069',
      ipcMode: 'test-ipcmode',
    })
  })
})

describe('sentry', () => {
  describe('#beforeSend', () => {
    const sendErrorEvent = (event) => SentryInstance.beforeSend(event)
    const sendErrorEvents = (numEvents) => [...Array(numEvents).fill(validEvent)].map(sendErrorEvent)
    const simulateException = (ex) => sendErrorEvent({ exception: { values: [ex] } })

    let SentryInstance

    beforeEach(() => {
      init()
      SentryInstance = Sentry.init.mock.calls[0][0]
    })

    const sampleException = {
      type: 'Error',
      value:
        'Cannot find latest.yml in the latest release artifacts (https://github.com/floating/frame/releases/download/v0.5.0-beta.20/latest.yml): HttpError: 404 \n"method: GET url: https://github.com/floating/frame/releases/download/v0.5.0-beta.20/latest.yml\\n\\...',
      stacktrace: {
        frames: [
          {
            module:
              'C:\\Users\\RickyBobby\\AppData\\Local\\Programs\\frame\\resources\\app.asar\\node_modules\\electron-updater\\out\\AppUpdater',
          },
          { module: 'node:domain' },
          {
            module:
              'C:\\Users\\RickyBobby\\AppData\\Local\\Programs\\frame\\resources\\app.asar\\compiled\\main\\signers\\lattice\\Lattice\\index',
          },
        ],
      },
    }

    const validEvent = {
      exception: {
        values: [],
      },
      extra: {
        networks: '{}',
        networksMeta: '{}',
        tokens: '{}',
      },
      tags: {
        'frame.instance_id': undefined,
      },
      user: {
        ip_address: undefined,
      },
    }

    it('should send exception type and value params after parsing stackframe modules', () => {
      const sentryEvent = simulateException(sampleException)

      const sentException = sentryEvent.exception.values[0]
      expect(sentException.type).toBe(sampleException.type)
      expect(sentException.value).toBe(sampleException.value)
    })

    it('should strip asar paths from stackframe modules on Windows', () => {
      const windowsException = {
        ...sampleException,
        stacktrace: {
          frames: [
            {
              module:
                'C:\\Users\\RickyBobby\\AppData\\Local\\Programs\\frame\\resources\\app.asar\\node_modules\\electron-updater\\out\\AppUpdater',
            },
            { module: 'node:domain' },
            {
              module:
                'C:\\Users\\RickyBobby\\AppData\\Local\\Programs\\frame\\resources\\app.asar\\compiled\\main\\signers\\lattice\\Lattice\\index',
            },
          ],
        },
      }
      const sentryEvent = simulateException(windowsException)

      const stackFrameModules = sentryEvent.exception.values[0].stacktrace.frames.map((frame) => frame.module)

      expect(stackFrameModules).toStrictEqual([
        '{asar}/node_modules/electron-updater/out/AppUpdater',
        'node:domain',
        '{asar}/compiled/main/signers/lattice/Lattice/index',
      ])
    })

    it('should strip asar paths from stackframe modules on non-Windows OSes', () => {
      const linuxException = {
        ...sampleException,
        stacktrace: {
          frames: [
            {
              module:
                '/home/RickyBobby/.config/frame/resources/app.asar/node_modules/electron-updater/out/AppUpdater',
            },
            { module: 'node:domain' },
            {
              module:
                '/home/RickyBobby/.config/frame/resources/app.asar/compiled/main/signers/lattice/Lattice/index',
            },
          ],
        },
      }

      const sentryEvent = simulateException(linuxException)

      const stackFrameModules = sentryEvent.exception.values[0].stacktrace.frames.map((frame) => frame.module)

      expect(stackFrameModules).toStrictEqual([
        '{asar}/node_modules/electron-updater/out/AppUpdater',
        'node:domain',
        '{asar}/compiled/main/signers/lattice/Lattice/index',
      ])
    })

    it('should drop events once the rate limit has been reached', () => {
      const sentEvents = sendErrorEvents(10)

      // after the limit is reached, this function will return a falsy value rather than the actual event
      const reportedEvents = sentEvents.filter((evt) => !!evt)
      expect(reportedEvents).toStrictEqual(Array(5).fill(validEvent))
    })

    it('should send events after the rate limit recovery period has partially elapsed', () => {
      // send 5 events to exhaust the initial rate limit
      sendErrorEvents(5)

      // the rate limit backs off by one every hour
      jest.advanceTimersByTime(3 * 60_000)

      const sentEvents = sendErrorEvents(5)
      const reportedEvents = sentEvents.filter((evt) => !!evt)
      expect(reportedEvents.length).toBe(3)
    })

    it('should send events after the rate limit recovery period has fully expired', () => {
      // send 5 events to exhaust the initial rate limit
      sendErrorEvents(5)

      // the rate limit backs off by one every hour
      jest.advanceTimersByTime(10 * 60_000)

      const sentEvents = sendErrorEvents(5)
      const reportedEvents = sentEvents.filter((evt) => !!evt)
      expect(reportedEvents.length).toBe(5)
    })

    it('should not send an event when exception reporting is disabled', () => {
      store.set('main.privacy.errorReporting', false)

      expect(sendErrorEvent(validEvent)).toBeNull()
    })
  })
})
