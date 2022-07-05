import { app } from 'electron'

jest.mock('electron', () => ({ 
  app: { 
    on: jest.fn(), 
    getName: jest.fn(), 
    getPath: jest.fn(), 
    getVersion: jest.fn(), 
    requestSingleInstanceLock: jest.fn(), 
    quit: jest.fn(), 
    commandLine: { appendSwitch: jest.fn() } 
  } 
}))

afterEach((() => {
  jest.resetModules()
}))

describe('instance handling', () => {
  it('should quit an instance which does not have the instance lock', () => {
    app.requestSingleInstanceLock.mockReturnValue(false)
    require('../../main/index')
    expect(app.quit).toHaveBeenCalled()
  })    

  it('should set up a second-instance event listener when it does have the instance lock', () => {
    app.requestSingleInstanceLock.mockReturnValue(true)
    require('../../main/index')
    expect(app.on).toHaveBeenCalledWith('second-instance', expect.any(Function))
  })   
})