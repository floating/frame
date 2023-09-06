import React, { useState } from 'react'
import styled from 'styled-components'

import svg from '../../../../../resources/svg'
import link from '../../../../../resources/link'
import useStore from '../../../../../resources/Hooks/useStore'
import { Entity } from '../../../../../resources/Components/Fluid'
import { ClusterBox, Cluster, ClusterRow, ClusterValue } from '../../../../../resources/Components/Cluster'

import { icons, list } from '../../../../../resources/svg/new'

import { moveItem, insertItemInGroup } from './organize'
import { AccountManagerWrap, AccountManagerMain, GroupHeader, GroupExpand } from './styled'

export const Group = ({ item, setState }) => {
  const [expanded, setExpanded] = useState(true)
  const id = item.id
  return (
    <Entity
      item={item}
      id={id} // This needs to be a completely uniquie id
      type={'group'}
      onOver={(dragEntity, position) => {
        if (!dragEntity || dragEntity.id === id) return
        setState((currentState) => {
          let newState = currentState
          if (dragEntity.type === 'item' && (item?.items?.length === 0 || !expanded)) {
            newState = insertItemInGroup(newState, dragEntity.id, id, position)
          } else if (dragEntity.id && id) {
            newState = moveItem(newState, dragEntity.id, id, position)
          }
          return newState
        })
      }} // will trigger when another entity is dragged over this entity
    >
      <ClusterBox key={'cb' + item.id}>
        <GroupHeader>
          <GroupExpand
            expanded={expanded}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setExpanded(!expanded)
            }}
          >
            {svg.chevron(20)}
          </GroupExpand>
          <div style={{ marginLeft: '8px', fontWeight: '600' }}>{item.name}</div>
        </GroupHeader>
        {item?.items?.length > 0 && expanded ? (
          <Cluster>
            {item?.items?.map((item) => {
              return item.type === 'group' ? (
                <Group key={'group' + item.id} item={item} setState={setState} />
              ) : item.type === 'item' ? (
                <Account key={item.address} item={item} setState={setState} />
              ) : null
            })}
          </Cluster>
        ) : (
          <div style={{ height: '8px' }} />
        )}
      </ClusterBox>
    </Entity>
  )
}

export const Account = ({ item, setState }) => {
  const id = item.id
  return (
    <ClusterRow>
      <Entity
        id={id}
        onClick={() => {
          link.rpc('setSigner', item.address, (err) => {
            if (err) return console.log(err)
          })
          link.send('nav:back', 'panel')
        }}
        item={item}
        onOver={(dragEntity, position) => {
          // Dragging over self
          if (!dragEntity || dragEntity.id === id) return
          setState((currentState) => {
            let newState = currentState
            if (false) {
              newState = insertItemInGroup(newState, dragEntity.id, id, location)
            } else if (dragEntity.id && id) {
              newState = moveItem(newState, dragEntity.id, id, position)
            }
            return newState
          })
        }}
      >
        <ClusterValue onClick={() => {}}>
          <div
            style={{
              fontWeight: '400',
              height: '60px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '8px',
                top: '9px',
                width: '40px',
                height: '40px',
                marginRight: '16px',
                borderRadius: '12px',
                overflow: 'hidden',
                border: '2px solid var(--ghostZ)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              {list[Math.floor(Math.random() * list.length)].icon(21)}
            </div>

            <div>
              <div>{item.ensName}</div>
              <div>{`${item.address.substr(0, 6)}...${item.address.substr(
                item.address.length - 4,
                item.address.length
              )}`}</div>
            </div>
          </div>
        </ClusterValue>
      </Entity>
    </ClusterRow>
  )
}

export const AccountManagerFilter = () => {
  const [accountModuleFilter, setAccountModuleFilter] = useState('')

  return (
    <div className='panelFilterAccount'>
      <div className='panelFilterIcon'>{svg.search(12)}</div>
      <div className='panelFilterInput'>
        <input
          tabIndex='-1'
          type='text'
          spellCheck='false'
          onChange={(e) => {
            const value = e.target.value
            setAccountModuleFilter(value)
          }}
          value={accountModuleFilter}
        />
      </div>
      {accountModuleFilter ? (
        <div
          className='panelFilterClear'
          onClick={() => {
            setAccountModuleFilter('')
          }}
        >
          {svg.close(12)}
        </div>
      ) : null}
    </div>
  )
}

export const AccountManagerController = ({ active, state, setState }) => {
  return (
    <>
      {/* <Debug>
        {dragOver && (
          <>
            <div>
              <span>{dragOver.overItem.id}</span>
              <span>{dragOver.location}</span>
            </div>
            <div>{JSON.stringify(floatingItemPosition, null, 4)}</div>
          </>
        )}
      </Debug> */}

      <div style={{ height: '40px' }} />

      <AccountManagerMain active={active}>
        {state.map((item) => {
          return item.type === 'group' ? (
            <Group key={'group' + item.id} item={item} setState={setState} />
          ) : item.type === 'item' ? (
            <Account key={item.address} item={item} setState={setState} />
          ) : null
        })}
      </AccountManagerMain>
      <div style={{ height: '120px' }} />
    </>
  )
}

const AccountManagerMenuWrap = styled.div`
  width: 100%;
  height: 32px;
  background: var(--ghostAZ);
  border-radius: 6px;
  z-index: 999999;
  display: flex;
  justify-content: space-between;
`

export const AccountManagerMenu = ({ children }) => {
  return <AccountManagerMenuWrap>{children}</AccountManagerMenuWrap>
}

export const AccountManager = () => {
  // const crumb = useStore('windows.panel.nav')[0] || {}
  const active = true // crumb.view === 'accountManager'

  const groups = [
    {
      id: 'g1',
      type: 'group',
      name: 'Primary Accounts',
      accounts: Object.keys(useStore('main.accounts'))
    },
    {
      id: 'g2',
      type: 'group',
      name: 'Hidden Accounts',
      accounts: []
    },
    {
      id: 'g3',
      type: 'group',
      name: 'Other Accounts',
      accounts: []
    },

    {
      id: 'g4',
      type: 'group',
      name: 'Testnet Accounts',
      accounts: []
    }
  ]

  const accountToItem = (account) => {
    // get account from store
    return {
      type: 'item',
      ...account
    }
  }

  const initialState = groups.map(({ accounts, ...group }) => {
    return {
      ...group,
      items: accounts
        .map((address) => {
          return useStore('main.accounts', address.toLowerCase())
        })
        .map(accountToItem)
    }
  })

  const [state, setState] = useState(initialState) // initial state for your list

  return (
    <AccountManagerWrap active={active}>
      <AccountManagerMenu>
        <div>
          <AccountManagerFilter />
        </div>
        <div>
          <div>{'new Account'}</div>
          <div>{'new Group'}</div>
        </div>
      </AccountManagerMenu>
      <AccountManagerController active={active} state={state} setState={setState} />
    </AccountManagerWrap>
  )
}
