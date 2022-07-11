import * as Sentry from '@sentry/electron'
import { initSentry } from '../../../main/errors'

jest.mock('@sentry/electron', () => ({ init: jest.fn(), IPCMode: { Classic: 'test-ipcmode' } }))
jest.mock('../../../main/store')

beforeAll(() => {
  jest.useFakeTimers()
})

afterAll(() => {
  jest.useRealTimers()
})

describe('sentry', () => {
  const mockEvent = (event) => Sentry.init.mock.calls[0][0].beforeSend(event)
  const mockEvents = (events) => events.map(mockEvent)
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
      "frame.instance_id": undefined,
    },
    user: {
      ip_address: undefined,
    }
  }

  it('should initialize sentry with the expected object', () => {
    initSentry()
    expect(Sentry.init).toHaveBeenCalledWith({
      beforeSend: expect.any(Function),
      dsn: 'https://7b09a85b26924609bef5882387e2c4dc@o1204372.ingest.sentry.io/6331069',
      ipcMode: 'test-ipcmode'
    })
  })

  it('should strip asar paths from stackframe modules', () => {
    initSentry()
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

  it('should drop events once the rate limit has been reached', () => {
    initSentry()
    const sentEvents = mockEvents(Array(10).fill({}))

    expect(sentEvents.slice(0, 5)).toStrictEqual(
      Array(5).fill(validEvent)
    )
    // after the limit is reached, this function will return a falsy value rather than the actual event
    const reportedEvents = sentEvents.filter(evt => !!evt)
    expect(reportedEvents).toStrictEqual(Array(5).fill(validEvent))
  })

  it('should send events after the rate limit recovery period has elapsed', () => {
    const events = Array(5).fill({})
    initSentry()
    mockEvents(events)
    jest.advanceTimersByTime(60_000)
    expect(mockEvents(events)).toStrictEqual(
      [validEvent, null, null, null, null]
    )
    jest.advanceTimersByTime(2 * 60_000)
    expect(mockEvents(events)).toStrictEqual(
      [validEvent, validEvent, null, null, null]
    )
    jest.advanceTimersByTime(3 * 60_000)
    expect(mockEvents(events)).toStrictEqual(
      [validEvent, validEvent, validEvent, null, null]
    )
    jest.advanceTimersByTime(4 * 60_000)
    expect(mockEvents(events)).toStrictEqual(
      [validEvent, validEvent, validEvent, validEvent, null]
    )
    jest.advanceTimersByTime(100 * 60_000)
    expect(mockEvents(events)).toStrictEqual(
      [validEvent, validEvent, validEvent, validEvent, validEvent]
    )
  })
})
