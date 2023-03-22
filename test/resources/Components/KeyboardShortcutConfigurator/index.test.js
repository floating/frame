import React from 'react'

import link from '../../../../resources/link'
import { render, screen } from '../../../componentSetup'

let KeyboardShortcutConfigurator
let mockLayoutGetKey

jest.mock('../../../../resources/link', () => ({ send: jest.fn() }))

beforeEach(async () => {
  mockLayoutGetKey = jest.fn()
  global.navigator.keyboard = {}
  global.navigator.keyboard.getLayoutMap = jest.fn().mockResolvedValue({
    get: mockLayoutGetKey
  })
  KeyboardShortcutConfigurator = (
    await import('../../../../resources/Components/KeyboardShortcutConfigurator')
  ).default
  mockLayoutGetKey.mockImplementation((key) => {
    const keyMap = {
      Slash: '/'
    }
    return keyMap[key] || key
  })
})

it('should render an existing shortcut', () => {
  render(
    <KeyboardShortcutConfigurator
      actionText='Test this component'
      platform='linux'
      shortcutName='Test'
      shortcut={{
        modifierKeys: ['Alt'],
        shortcutKey: 'Slash',
        enabled: true
      }}
    />
  )

  const displayedShortcut = screen.getByLabelText('Test this component by pressing')
  expect(displayedShortcut.textContent).toBe('Alt+/')
})

it('should render an existing Meta key shortcut on MacOS', () => {
  render(
    <KeyboardShortcutConfigurator
      actionText='Test this component'
      platform='darwin'
      shortcutName='Test'
      shortcut={{
        modifierKeys: ['Meta'],
        shortcutKey: 'Slash',
        enabled: true
      }}
    />
  )

  const displayedShortcut = screen.getByLabelText('Test this component by pressing')
  expect(displayedShortcut.textContent).toBe('Command+/')
})

it('should render an existing Alt key shortcut on MacOS', () => {
  render(
    <KeyboardShortcutConfigurator
      actionText='Test this component'
      platform='darwin'
      shortcutName='Test'
      shortcut={{
        modifierKeys: ['Alt'],
        shortcutKey: 'Slash',
        enabled: true
      }}
    />
  )

  const displayedShortcut = screen.getByLabelText('Test this component by pressing')
  expect(displayedShortcut.textContent).toBe('Option+/')
})

it('should render an existing Meta key shortcut on Windows', () => {
  render(
    <KeyboardShortcutConfigurator
      actionText='Test this component'
      platform='win32'
      shortcutName='Test'
      shortcut={{
        modifierKeys: ['Meta'],
        shortcutKey: 'Slash',
        enabled: true
      }}
    />
  )

  const displayedShortcut = screen.getByLabelText('Test this component by pressing')
  expect(displayedShortcut.textContent).toBe('Win+/')
})

describe('when configuring', () => {
  it('should prompt to enter a shortcut', async () => {
    const { user } = render(
      <KeyboardShortcutConfigurator
        actionText='Test this component'
        platform='linux'
        shortcutName='Test'
        shortcut={{
          modifierKeys: ['Meta'],
          shortcutKey: 'Slash',
          enabled: true
        }}
      />
    )

    const displayedShortcut = screen.getByLabelText('Test this component by pressing')
    await user.click(displayedShortcut)
    const enterShortcutPrompt = screen.getByText('Enter keyboard shortcut:')
    expect(enterShortcutPrompt).toBeDefined()
  })

  it('should disable the existing shortcut', async () => {
    const { user } = render(
      <KeyboardShortcutConfigurator
        actionText='Test this component'
        platform='linux'
        shortcutName='Test'
        shortcut={{
          modifierKeys: ['Meta'],
          shortcutKey: 'Slash',
          enabled: true
        }}
      />
    )

    const displayedShortcut = screen.getByLabelText('Test this component by pressing')
    await user.click(displayedShortcut)
    expect(link.send).toHaveBeenCalledWith('tray:action', 'setShortcut', 'Test', {
      enabled: false,
      modifierKeys: ['Meta'],
      shortcutKey: 'Slash'
    })
  })

  describe('and a valid shortcut is entered', () => {
    it('should set the new shortcut', async () => {
      const { user } = render(
        <KeyboardShortcutConfigurator
          actionText='Test this component'
          platform='linux'
          shortcutName='Test'
          shortcut={{
            modifierKeys: ['Meta'],
            shortcutKey: 'Slash',
            enabled: true
          }}
        />
      )

      let displayedShortcut = screen.getByLabelText('Test this component by pressing')
      await user.click(displayedShortcut)

      const enterShortcutPrompt = screen.getByText('Enter keyboard shortcut:')
      expect(enterShortcutPrompt).toBeDefined()
      await user.keyboard('{Alt>}T{/Alt}')

      expect(link.send).toHaveBeenLastCalledWith('tray:action', 'setShortcut', 'Test', {
        enabled: true,
        modifierKeys: ['Alt'],
        shortcutKey: 'KeyT'
      })
    })

    it('should enable a new shortcut when the previous one was disabled', async () => {
      const { user } = render(
        <KeyboardShortcutConfigurator
          actionText='Test this component'
          platform='linux'
          shortcutName='Test'
          shortcut={{
            modifierKeys: ['Meta'],
            shortcutKey: 'Slash',
            enabled: false
          }}
        />
      )

      let displayedShortcut = screen.getByLabelText('Test this component by pressing')
      await user.click(displayedShortcut)

      const enterShortcutPrompt = screen.getByText('Enter keyboard shortcut:')
      expect(enterShortcutPrompt).toBeDefined()
      await user.keyboard('{Alt>}T{/Alt}')

      expect(link.send).toHaveBeenLastCalledWith('tray:action', 'setShortcut', 'Test', {
        enabled: true,
        modifierKeys: ['Alt'],
        shortcutKey: 'KeyT'
      })
    })
  })

  describe('and an invalid shortcut is entered', () => {
    it('should not set a new shortcut', async () => {
      const { user } = render(
        <KeyboardShortcutConfigurator
          actionText='Test this component'
          platform='linux'
          shortcutName='Test'
          shortcut={{
            modifierKeys: ['Meta'],
            shortcutKey: 'Slash',
            enabled: true
          }}
        />
      )

      let displayedShortcut = screen.getByLabelText('Test this component by pressing')
      await user.click(displayedShortcut)

      const enterShortcutPrompt = screen.getByText('Enter keyboard shortcut:')
      expect(enterShortcutPrompt).toBeDefined()
      await user.keyboard('{Shift>};{/Shift}')

      expect(link.send).toHaveBeenCalledTimes(1)
      expect(link.send).toHaveBeenLastCalledWith('tray:action', 'setShortcut', 'Test', {
        enabled: false,
        modifierKeys: ['Meta'],
        shortcutKey: 'Slash'
      })
    })
  })

  describe('and the cancel button is clicked', () => {
    it('should revert to displaying the existing shortcut', async () => {
      const { user } = render(
        <KeyboardShortcutConfigurator
          actionText='Test this component'
          platform='linux'
          shortcutName='Test'
          shortcut={{
            modifierKeys: ['Meta'],
            shortcutKey: 'Slash',
            enabled: true
          }}
        />
      )

      let displayedShortcut = screen.getByLabelText('Test this component by pressing')
      await user.click(displayedShortcut)
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      displayedShortcut = screen.getByLabelText('Test this component by pressing')
      expect(displayedShortcut.textContent).toBe('Meta+/')
    })

    it('should re-enable the existing shortcut', async () => {
      const { user } = render(
        <KeyboardShortcutConfigurator
          actionText='Test this component'
          platform='linux'
          shortcutName='Test'
          shortcut={{
            modifierKeys: ['Meta'],
            shortcutKey: 'Slash',
            enabled: true
          }}
        />
      )

      let displayedShortcut = screen.getByLabelText('Test this component by pressing')
      await user.click(displayedShortcut)
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      expect(link.send).toBeCalledTimes(2)
      expect(link.send).toHaveBeenLastCalledWith('tray:action', 'setShortcut', 'Test', {
        enabled: true,
        modifierKeys: ['Meta'],
        shortcutKey: 'Slash'
      })
    })

    it('should not re-enable the existing shortcut if the shortcut was previously disabled', async () => {
      const { user } = render(
        <KeyboardShortcutConfigurator
          actionText='Test this component'
          platform='linux'
          shortcutName='Test'
          shortcut={{
            modifierKeys: ['Meta'],
            shortcutKey: 'Slash',
            enabled: false
          }}
        />
      )

      let displayedShortcut = screen.getByLabelText('Test this component by pressing')
      await user.click(displayedShortcut)
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      expect(link.send).toBeCalledTimes(2)
      expect(link.send).toHaveBeenLastCalledWith('tray:action', 'setShortcut', 'Test', {
        enabled: false,
        modifierKeys: ['Meta'],
        shortcutKey: 'Slash'
      })
    })
  })
})
