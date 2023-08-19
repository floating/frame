import fs from 'fs'

import getState from '../../main/store/state'
import persist from '../../main/store/persist'

jest.mock('uuid', () => {
  const uuid = () => 'ce240b90-10f4-4993-a094-1c593a02feba'
  uuid.DNS = true

  return { v4: uuid, v5: uuid }
})

jest.mock('../../main/store/persist', () => ({
  get: jest.fn()
}))

const testFiles = fs.readdirSync(__dirname).filter((file) => file.startsWith('version'))

testFiles
  .filter((file) => file.includes('41'))
  .forEach((file) => {
    const [_prefix, stateVersion, appVersion] = file.split('-')

    it(`migrates from state version ${stateVersion} (${appVersion})`, async () => {
      const { input, output } = await import(`./${file}`)
      persist.get.mockReturnValueOnce(input)

      const state = getState()

      expect(state).toEqual({
        ...output,
        main: {
          ...output.main,
          instanceId: 'ce240b90-10f4-4993-a094-1c593a02feba'
        }
      })
    })
  })
