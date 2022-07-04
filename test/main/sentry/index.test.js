import * as Sentry from '@sentry/electron'
import { init as initSentry } from '../../../main/sentry'
import mockAsarPathEvent from '../../mocks/sentry.asar-path.json'

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
    const sentryEvent = mockEvent(mockAsarPathEvent)
    const stackFrameModules = sentryEvent.exception.values[0].stacktrace.frames.map((frame) => frame.module)
    stackFrameModules.filter((module) => module.includes('app.asar'))
      .forEach((module) => {
        expect(module).toMatch(/{asar}[\/(.+)]+/)
      })
  })
})
