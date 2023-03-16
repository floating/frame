import Restore from 'react-restore'

import store from '../../../../../main/store'
import link from '../../../../../resources/link'
import { screen, render } from '../../../../componentSetup'
import ChainComponent from '../../../../../app/dash/Chains/Chain'

jest.mock('../../../../../main/store/persist')
jest.mock('../../../../../resources/link', () => ({ send: jest.fn() }))

const Chain = Restore.connect(ChainComponent, store)

beforeAll(() => {
  store.addNetwork({
    id: 1337,
    type: 'ethereum',
    name: 'Leetnet',
    explorer: 'https://etherscan.io',
    symbol: 'ETH',
    on: true
  })
})

afterAll(() => {
  store.removeNetwork({ type: 'ethereum', id: 1337 })
})

describe('rendering', () => {
  it('renders the provided chain name', () => {
    const chainConfig = { view: 'expanded', name: 'Bizarro Mainnet' }
    render(<Chain {...chainConfig} />)

    const chainNameInput = screen.getByLabelText('Chain Name')
    expect(chainNameInput.value).toEqual('Bizarro Mainnet')
  })

  it('renders the provided chain symbol', () => {
    const chainConfig = { view: 'expanded', symbol: 'AVAX' }
    render(<Chain {...chainConfig} />)

    const chainNameInput = screen.getByLabelText('Native Symbol')
    expect(chainNameInput.value).toEqual('AVAX')
  })

  it('renders the provided block explorer', () => {
    const chainConfig = { view: 'expanded', explorer: 'https://etherscan.io' }
    render(<Chain {...chainConfig} />)

    const blockExplorerInput = screen.getByLabelText('Block Explorer')
    expect(blockExplorerInput.value).toEqual('https://etherscan.io')
  })
})

describe('updating', () => {
  it('opens a confirmation when removing a chain', async () => {
    const chainConfig = {
      id: 1337,
      type: 'ethereum',
      name: 'Leetnet',
      explorer: 'https://etherscan.io',
      symbol: 'ETH',
      on: true
    }

    const { user } = render(<Chain view='expanded' {...chainConfig} />)
    await user.click(screen.getByRole('button', { name: 'Remove Chain' }))

    expect(link.send).toHaveBeenCalledWith(
      'tray:action',
      'navDash',
      expect.objectContaining({
        view: 'notify'
      })
    )
  })
})
