import { globalShortcut } from 'electron'

jest.mock('electron', () => ({
  app: { on: jest.fn(), getName: jest.fn(), getVersion: jest.fn(), getPath: jest.fn() },
  globalShortcut: { register: jest.fn(), unregister: jest.fn() }
}))

let registerShortcut

describe('registerShortcut', () => {
  const shortcut = {
    shortcutKey: 'Slash',
    modifierKeys: ['Alt'],
    enabled: true,
    configuring: false
  }

  beforeEach(async () => {
    const keyboardShortcuts = await import('../../../main/keyboardShortcuts')
    registerShortcut = keyboardShortcuts.registerShortcut
  })

  it('should unregister an existing shortcut', () => {
    registerShortcut(shortcut, () => {})

    expect(globalShortcut.unregister).toHaveBeenCalledWith('Alt+/')
    expect(globalShortcut.unregister).toHaveBeenCalledTimes(1)
  })

  it('should register the new shortcut', () => {
    globalShortcut.register.mockImplementationOnce((accelerator, handlerFn) => handlerFn(accelerator))

    return new Promise((resolve) => {
      const handlerFn = (accelerator) => {
        expect(accelerator).toBe('Alt+/')
        resolve()
      }
      registerShortcut(shortcut, handlerFn)

      expect(globalShortcut.register).toHaveBeenCalledWith('Alt+/', expect.any(Function))
      expect(globalShortcut.register).toHaveBeenCalledTimes(1)
    })
  })
})
