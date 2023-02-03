import { isValidAddress } from '@ethereumjs/util'
import React, { Component, useEffect, useRef, useState } from 'react'
import Restore from 'react-restore'
import RingIcon from '../../../../resources/Components/RingIcon'
import link from '../../../../resources/link'
import svg from '../../../../resources/svg'

const invalidFormatError = 'INVALID CONTRACT ADDRESS'
const unableToVerifyError = `COULD NOT FIND TOKEN WITH ADDRESS`

const navForward = async (notifyData) =>
  link.send('nav:forward', 'dash', {
    view: 'tokens',
    data: {
      notify: 'addToken',
      notifyData
    }
  })

const navBack = async (steps = 1) => link.send('nav:back', 'dash', steps)

const TokenError = ({ text, onContinue }) => {
  return (
    <div className='newTokenView cardShow'>
      <div className='newTokenErrorTitle'>{text}</div>

      <div className='tokenSetAddress' role='button' onClick={() => navBack()}>
        {'BACK'}
      </div>
      {text.includes(unableToVerifyError) && (
        <div
          className='tokenSetAddress'
          role='button'
          onClick={() => {
            navBack()
            onContinue()
          }}
        >
          {'ADD ANYWAY'}
        </div>
      )}
    </div>
  )
}

class AddTokenChainScreenComponent extends Component {
  render() {
    const activeChains = Object.values(this.store('main.networks.ethereum')).filter((chain) => chain.on)

    return (
      <div className='newTokenView cardShow'>
        <div className='newTokenChainSelectTitle'>{`Select token's chain`}</div>
        <div className='newTokenChainSelectChain'>
          <div className='originSwapChainList'>
            {activeChains.map((chain) => {
              const chainId = chain.id
              const { primaryColor, icon } = this.store('main.networksMeta.ethereum', chainId)

              return (
                <div
                  className='originChainItem'
                  key={chainId}
                  role='button'
                  onClick={() => {
                    this.setState({ chainId })

                    setTimeout(() => {
                      link.send('tray:action', 'navDash', {
                        view: 'tokens',
                        data: {
                          notify: 'addToken',
                          notifyData: { chain: { id: chainId, color: primaryColor, name: chain.name } }
                        }
                      })
                    }, 200)
                  }}
                >
                  <div className='originChainItemIcon'>
                    <RingIcon
                      color={primaryColor ? `var(--${primaryColor})` : 'var(--moon)'}
                      img={icon}
                      small={true}
                    />
                  </div>
                  {chain.name}
                </div>
              )
            })}
          </div>
        </div>
        <div className='newTokenChainSelectFooter'>
          {'Chain not listed?'}
          <div
            className='newTokenEnableChainLink'
            role='link'
            onClick={() => {
              link.send('tray:action', 'navDash', { view: 'chains', data: {} })
            }}
          >
            {'Enable it in Chains'}
          </div>
        </div>
      </div>
    )
  }
}

const SelectChain = Restore.connect(AddTokenChainScreenComponent)

const EnterAddress = ({ chain }) => {
  const [isFetching, setFetching] = useState(false)
  const [contractAddress, setAddress] = useState('')

  const { name: chainName, color } = chain

  const resolveTokenData = async () => {
    setFetching(true)

    const tokenData = await link.invoke('tray:getTokenDetails', contractAddress, chain.id)
    const error = tokenData.totalSupply ? null : `${unableToVerifyError} ${contractAddress}`
    return navForward({ error, tokenData, address: contractAddress, chain })
  }

  const submit = () => {
    if (!isValidAddress(contractAddress))
      return navForward({
        error: invalidFormatError,
        address: contractAddress,
        chain
      })

    resolveTokenData()
  }

  return (
    <div className='newTokenView cardShow'>
      {isFetching ? (
        <>
          <div className='signerLoading'>
            <div className='signerLoadingLoader' />
          </div>
          {'FETCHING TOKEN DATA'}
        </>
      ) : (
        <>
          <div className='newTokenChainSelectTitle'>
            <label id='newTokenAddressLabel'>{`Enter token's address`}</label>

            {chainName && (
              <div
                className='newTokenChainSelectSubtitle'
                style={{
                  color: color ? `var(--${color})` : 'var(--moon)'
                }}
              >
                {`on ${chainName}`}
              </div>
            )}
          </div>

          <div className='tokenRow'>
            <div className='tokenAddress'>
              <input
                aria-labelledby='newTokenAddressLabel'
                className='tokenInput tokenInputAddress'
                value={contractAddress}
                spellCheck={false}
                autoFocus={true}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    submit()
                  }
                }}
                onChange={(e) => {
                  if (e.target.value.length > 42) {
                    e.preventDefault()
                  } else {
                    setAddress(e.target.value)
                  }
                }}
              />
            </div>
          </div>
          <div className='tokenSetAddress' role='button' onClick={submit}>
            {'Set Address'}
          </div>
        </>
      )}
    </div>
  )
}

const tokenDetailsDefaults = {
  name: 'Token Name',
  symbol: 'Symbol',
  decimals: '?',
  logoURI: 'Logo URI'
}

const TokenDetailsForm = ({ req, chain, tokenData, isEdit }) => {
  const [name, setName] = useState(tokenData.name || tokenDetailsDefaults.name)
  const [symbol, setSymbol] = useState(tokenData.symbol || tokenDetailsDefaults.symbol)
  const [decimals, setDecimals] = useState(tokenData.decimals || tokenDetailsDefaults.decimals)
  const [logoUri, setLogoUri] = useState(tokenData.logoURI || tokenDetailsDefaults.logoURI)

  const submitRef = useRef(null)

  const { address } = tokenData
  const { name: chainName, color } = chain

  const saveAndClose = () => {
    const token = {
      name,
      symbol,
      chainId: chain.id,
      address,
      decimals,
      logoURI: logoUri === tokenDetailsDefaults.logoURI ? '' : logoUri
    }

    const backSteps = isEdit ? 2 : 4

    link.send('tray:addToken', token, req)

    setTimeout(() => {
      navBack(backSteps)
      link.send('nav:forward', 'dash', {
        view: 'tokens',
        data: {}
      })
    }, 250)
  }

  const focusSubmitButton = () => {
    if (submitRef.current) {
      submitRef.current.focus()
    }
  }

  // handle asynchronous loading of token data
  useEffect(() => {
    const { name, symbol, decimals, logoURI } = tokenData

    setName(name || tokenDetailsDefaults.name)
    setSymbol(symbol || tokenDetailsDefaults.symbol)
    setDecimals(decimals || tokenDetailsDefaults.decimals)
    setLogoUri(logoURI || tokenDetailsDefaults.logoURI)
  }, [tokenData])

  useEffect(() => {
    focusSubmitButton()
  }, [])

  const newTokenReady =
    name &&
    name !== tokenDetailsDefaults.name &&
    symbol &&
    symbol !== tokenDetailsDefaults.symbol &&
    Number.isInteger(chain.id) &&
    Number.isInteger(decimals)

  return (
    <div className='notifyBoxWrap cardShow' onMouseDown={(e) => e.stopPropagation()}>
      <div className='notifyBoxSlide'>
        <div className='addTokenTop'>
          <div className='addTokenTitle' data-testid='addTokenFormTitle'>
            {isEdit ? 'Edit Token' : 'Add New Token'}
          </div>
          <div className='newTokenChainSelectTitle'>
            <div className='newTokenChainAddress' role='heading' aria-level='2'>
              {address.substring(0, 10)}
              {svg.octicon('kebab-horizontal', { height: 14 })}
              {address.substring(address.length - 8)}
            </div>
            {chainName ? (
              <div
                className='newTokenChainSelectSubtitle'
                style={{
                  color: color ? `var(--${color})` : 'var(--moon)'
                }}
              >
                {`on ${chainName}`}
              </div>
            ) : null}
          </div>
        </div>
        <div className='addToken'>
          <div className='tokenRow'>
            <div className='tokenName'>
              <label className='tokenInputLabel'>
                <input
                  className={`tokenInput ${name === tokenDetailsDefaults.name ? 'tokenInputDim' : ''}`}
                  value={name}
                  spellCheck={false}
                  onChange={(e) => {
                    setName(e.target.value)
                  }}
                  onFocus={(e) => {
                    if (e.target.value === tokenDetailsDefaults.name) setName('')
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') setName(tokenDetailsDefaults.name)
                    focusSubmitButton()
                  }}
                />
                Token Name
              </label>
            </div>
          </div>

          <div className='tokenRow'>
            <div className='tokenSymbol'>
              <label className='tokenInputLabel'>
                <input
                  className={`tokenInput ${symbol === tokenDetailsDefaults.symbol ? 'tokenInputDim' : ''}`}
                  value={symbol}
                  spellCheck={false}
                  onChange={(e) => {
                    if (e.target.value.length > 10) return e.preventDefault()
                    setSymbol(e.target.value)
                  }}
                  onFocus={(e) => {
                    if (e.target.value === tokenDetailsDefaults.symbol) setSymbol('')
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') setSymbol(tokenDetailsDefaults.symbol)
                    focusSubmitButton()
                  }}
                />
                Symbol
              </label>
            </div>

            <div className='tokenDecimals'>
              <label className='tokenInputLabel'>
                <input
                  className={`tokenInput ${
                    decimals === tokenDetailsDefaults.decimals ? 'tokenInputDim' : ''
                  }`}
                  value={decimals}
                  spellCheck={false}
                  onChange={(e) => {
                    if (!e.target.value) return setDecimals('')
                    if (e.target.value.length > 2) return e.preventDefault()

                    const decimals = parseInt(e.target.value)
                    if (!Number.isInteger(decimals)) return e.preventDefault()

                    setDecimals(decimals)
                  }}
                  onFocus={(e) => {
                    if (e.target.value === tokenDetailsDefaults.decimals) setDecimals('')
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') setDecimals(tokenDetailsDefaults.decimals)
                    focusSubmitButton()
                  }}
                />
                Decimals
              </label>
            </div>
          </div>

          <div className='tokenRow'>
            <div className='tokenLogoUri'>
              <label className='tokenInputLabel'>
                <input
                  className={`tokenInput ${logoUri === tokenDetailsDefaults.logoURI ? 'tokenInputDim' : ''}`}
                  value={logoUri}
                  spellCheck={false}
                  onChange={(e) => {
                    setLogoUri(e.target.value)
                  }}
                  onFocus={(e) => {
                    if (e.target.value === tokenDetailsDefaults.logoURI) setLogoUri('')
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') setLogoUri(tokenDetailsDefaults.logoURI)
                    focusSubmitButton()
                  }}
                />
                Logo URI
              </label>
            </div>
          </div>
          <div className='tokenRow'>
            {newTokenReady ? (
              <div
                role='button'
                tabIndex={0}
                ref={submitRef}
                className='addTokenSubmit addTokenSubmitEnabled'
                onMouseDown={(e) => {
                  if (e.button === 0) {
                    saveAndClose()
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation()
                    saveAndClose()
                  }
                }}
              >
                {isEdit ? 'Save' : 'Add Token'}
              </div>
            ) : (
              <div role='button' className='addTokenSubmit'>
                Fill in Token Details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const AddToken = ({ data, req }) => {
  const { address, chain, error, tokenData, isEdit } = data?.notifyData || {}

  if (!chain) return <SelectChain />
  if (!address) return <EnterAddress chain={chain} />
  if (error) return <TokenError text={error} onContinue={() => navForward({ address, chain })} />

  return <TokenDetailsForm chain={chain} req={req} tokenData={{ ...tokenData, address }} isEdit={isEdit} />
}

export default AddToken
